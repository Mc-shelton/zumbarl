import { Prisma, type EvergreenCandidateStatus, type EvergreenCohortStatus, type EvergreenOfferStatus, type EvergreenProgramStatus, type PlacementStatus } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

const programInclude = {
  skills: { include: { skill: true } },
  competencies: { include: { competency: true } },
  supervisors: { include: { supervisor: { include: { user: true } } } },
  cohorts: { orderBy: { sequenceNumber: 'desc' as const }, take: 5 }
} satisfies Prisma.EvergreenProgramInclude

function outboxData(eventType: string, aggregateType: string, aggregateId: string, payload: Prisma.InputJsonValue, idempotencyKey: string) {
  return { eventType, aggregateType, aggregateId, payload, idempotencyKey }
}

class EvergreenRepository {
  countCompanyContacts(companyId: string, contactIds: string[]) {
    return prisma.companyContact.count({ where: { companyId, id: { in: contactIds } } })
  }

  findFeatureFlag(key: string) {
    return prisma.featureFlag.findUnique({ where: { key } })
  }

  findCompanyContext(companyId: string) {
    const now = new Date()
    return prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { evergreenPrograms: true } },
        contacts: { include: { user: { select: { name: true, email: true } } } },
        evergreenEntitlements: { where: { status: 'ACTIVE', validFrom: { lte: now }, validUntil: { gt: now } }, orderBy: { validUntil: 'desc' }, take: 1 },
        engagementOutcomes: { where: { isVerified: true } }
      }
    })
  }

  findActiveOverride(subjectType: string, subjectId: string, policy: string) {
    return prisma.evergreenOverride.findFirst({ where: { subjectType, subjectId, policy, status: 'ACTIVE', expiresAt: { gt: new Date() } } })
  }

  listPrograms(companyId?: string, status?: EvergreenProgramStatus, cursor?: string, take = 25) {
    return prisma.evergreenProgram.findMany({
      where: { ...(companyId ? { companyId } : {}), ...(status ? { status } : {}) },
      include: programInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    })
  }

  findProgram(id: string) {
    return prisma.evergreenProgram.findUnique({ where: { id }, include: programInclude })
  }

  createProgram(companyId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const program = await transaction.evergreenProgram.create({
        data: {
          companyId,
          createdById: actorId,
          title: payload.title,
          description: payload.description,
          placementType: payload.placementType,
          workMode: payload.workMode,
          location: payload.location,
          durationWeeks: payload.durationWeeks,
          defaultSeatCount: payload.defaultSeatCount,
          stipendAmount: payload.stipendAmount,
          currency: payload.currency,
          stipendFrequency: payload.stipendFrequency,
          supervisionPlan: payload.supervisionPlan,
          learningOutcomes: payload.learningOutcomes,
          recurrenceType: payload.recurrenceType,
          recurrenceRule: payload.recurrenceRule ?? Prisma.JsonNull,
          timezone: payload.timezone,
          skills: { create: payload.skills.map((item: Record<string, any>) => ({ skillId: item.skillId, required: item.required, weight: item.weight })) },
          competencies: { create: payload.competencies.map((item: Record<string, any>) => ({ competencyId: item.competencyId, required: item.required, minimumScore: item.minimumScore, weight: item.weight })) },
          supervisors: { create: payload.supervisorIds.map((supervisorId: string, index: number) => ({ supervisorId, isPrimary: index === 0 })) }
        },
        include: programInclude
      })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PROGRAM_CREATED', entityType: 'EvergreenProgram', entityId: program.id, after: program as unknown as Prisma.InputJsonValue } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.program_created', 'EvergreenProgram', program.id, { programId: program.id, companyId }, `program.created:${program.id}`) })
      return program
    })
  }

  async updateProgram(id: string, companyId: string, actorId: string, version: number, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.evergreenProgram.findFirst({ where: { id, companyId } })
      if (!existing) return null
      const update = await transaction.evergreenProgram.updateMany({ where: { id, companyId, version }, data: { ...payload, version: { increment: 1 } } })
      if (update.count !== 1) return 'VERSION_CONFLICT' as const
      const program = await transaction.evergreenProgram.findUniqueOrThrow({ where: { id }, include: programInclude })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PROGRAM_UPDATED', entityType: 'EvergreenProgram', entityId: id, before: existing as unknown as Prisma.InputJsonValue, after: program as unknown as Prisma.InputJsonValue } })
      return program
    })
  }

  transitionProgram(id: string, companyId: string | undefined, actorId: string, from: EvergreenProgramStatus, to: EvergreenProgramStatus, patch: Record<string, any> = {}) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.evergreenProgram.updateMany({ where: { id, status: from, ...(companyId ? { companyId } : {}) }, data: { status: to, version: { increment: 1 }, ...patch } })
      if (result.count !== 1) return null
      const program = await transaction.evergreenProgram.findUniqueOrThrow({ where: { id }, include: programInclude })
      await transaction.auditLog.create({ data: { userId: actorId, action: `EVERGREEN_PROGRAM_${to}`, entityType: 'EvergreenProgram', entityId: id, before: { status: from }, after: { status: to } } })
      if (to === 'ACTIVE') await transaction.outboxEvent.create({ data: outboxData('evergreen.program_activated', 'EvergreenProgram', id, { programId: id, companyId: program.companyId }, `program.activated:${id}:${program.version}`) })
      if (to === 'CHANGES_REQUESTED') await transaction.outboxEvent.create({ data: outboxData('evergreen.program_changes_requested', 'EvergreenProgram', id, { programId: id, companyId: program.companyId }, `program.changes-requested:${id}:${program.version}`) })
      return program
    })
  }

  createCohort(programId: string, actorId: string, payload: Record<string, any>, idempotencyKey: string) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.evergreenIdempotencyKey.findUnique({ where: { actorId_operation_key: { actorId, operation: 'CREATE_COHORT', key: idempotencyKey } } })
      if (existing?.resourceId) return transaction.evergreenCohort.findUnique({ where: { id: existing.resourceId } })
      await transaction.evergreenIdempotencyKey.create({ data: { actorId, operation: 'CREATE_COHORT', key: idempotencyKey, requestHash: payload.requestHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } })
      const last = await transaction.evergreenCohort.findFirst({ where: { programId }, orderBy: { sequenceNumber: 'desc' }, select: { sequenceNumber: true } })
      const cohort = await transaction.evergreenCohort.create({ data: { ...payload.data, programId, sequenceNumber: (last?.sequenceNumber ?? 0) + 1 } })
      await transaction.evergreenIdempotencyKey.update({ where: { actorId_operation_key: { actorId, operation: 'CREATE_COHORT', key: idempotencyKey } }, data: { resourceId: cohort.id, responseCode: 201, responseBody: { id: cohort.id }, completedAt: new Date() } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_COHORT_CREATED', entityType: 'EvergreenCohort', entityId: cohort.id, after: cohort as unknown as Prisma.InputJsonValue } })
      return cohort
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  findCohort(id: string) {
    return prisma.evergreenCohort.findUnique({ where: { id }, include: { program: { include: programInclude } } })
  }

  transitionCohort(id: string, from: EvergreenCohortStatus, to: EvergreenCohortStatus, actorId: string, patch: Record<string, any> = {}) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.evergreenCohort.updateMany({ where: { id, status: from }, data: { status: to, version: { increment: 1 }, ...patch } })
      if (result.count !== 1) return null
      const cohort = await transaction.evergreenCohort.findUniqueOrThrow({ where: { id }, include: { program: { select: { companyId: true } } } })
      await transaction.auditLog.create({ data: { userId: actorId, action: `EVERGREEN_COHORT_${to}`, entityType: 'EvergreenCohort', entityId: id, before: { status: from }, after: { status: to } } })
      if (to === 'OPEN') await transaction.outboxEvent.create({ data: outboxData('evergreen.cohort_opened', 'EvergreenCohort', id, { cohortId: id, programId: cohort.programId, companyId: cohort.program.companyId }, `cohort.opened:${id}:${cohort.version}`) })
      return cohort
    })
  }

  findStudentReadiness(studentId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { role: true } },
        roadmapEnrollments: { where: { verifiedAt: { not: null } }, include: { roadmap: true } },
        competencyStates: { where: { status: 'VERIFIED' }, include: { competency: true } },
        placementAvailability: true,
        activePlacementLock: true
      }
    })
  }

  upsertAvailability(studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const availability = await transaction.placementAvailability.upsert({
        where: { studentId },
        update: { ...payload, version: { increment: 1 } } as Prisma.PlacementAvailabilityUncheckedUpdateInput,
        create: { ...payload, studentId } as Prisma.PlacementAvailabilityUncheckedCreateInput
      })
      await transaction.outboxEvent.create({ data: outboxData('student.placement_availability_changed', 'PlacementAvailability', availability.id, { availabilityId: availability.id, studentId, isSeeking: availability.isSeeking }, `availability.changed:${availability.id}:${availability.version}`) })
      return availability
    })
  }

  listStudentMatches(studentId: string, cursor?: string, take = 25) {
    return prisma.evergreenCandidate.findMany({
      where: { studentId, cohort: { status: { in: ['OPEN', 'MATCHING', 'INTERVIEWING', 'PARTIALLY_FILLED'] } } },
      include: {
        cohort: {
          include: {
            program: {
              include: {
                company: { select: { id: true, name: true, logoUrl: true } },
                competencies: { include: { competency: true } },
                skills: { include: { skill: true } }
              }
            }
          }
        },
        offers: { where: { status: { in: ['SENT', 'VIEWED'] } } }
      },
      orderBy: [{ matchScore: 'desc' }, { id: 'desc' }], take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    })
  }

  listStudentOffers(studentId: string) {
    return prisma.placementOffer.findMany({ where: { studentId }, include: { candidate: { include: { cohort: { include: { program: true } } } }, company: { select: { id: true, name: true, logoUrl: true } }, supervisor: { include: { user: { select: { name: true, email: true } } } }, acceptedPlacement: true }, orderBy: { createdAt: 'desc' } })
  }

  findCandidate(id: string) {
    return prisma.evergreenCandidate.findUnique({ where: { id }, include: { cohort: { include: { program: true } }, student: { include: { user: true, campus: true, course: true, studentSkills: { include: { skill: true } }, competencyStates: { include: { competency: true } }, portfolioItems: true, endorsementsReceived: true } }, offers: true } })
  }

  listCohortCandidates(cohortId: string, cursor?: string, take = 25) {
    return prisma.evergreenCandidate.findMany({ where: { cohortId }, include: { student: { include: { user: true, campus: true, course: true, studentSkills: { include: { skill: true } }, competencyStates: { include: { competency: true } }, portfolioItems: true } }, offers: true }, orderBy: [{ matchScore: 'desc' }, { id: 'desc' }], take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
  }

  upsertApplication(cohortId: string, studentId: string, consentSnapshot: Prisma.InputJsonValue, actorId: string) {
    return prisma.$transaction(async (transaction) => {
      const candidate = await transaction.evergreenCandidate.upsert({ where: { cohortId_studentId: { cohortId, studentId } }, update: { status: 'APPLIED', source: 'APPLICATION', lastActorId: actorId, version: { increment: 1 } }, create: { cohortId, studentId, source: 'APPLICATION', status: 'APPLIED', consentSnapshot, lastActorId: actorId } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_CANDIDATE_APPLIED', entityType: 'EvergreenCandidate', entityId: candidate.id, after: { status: candidate.status } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.candidate_status_changed', 'EvergreenCandidate', candidate.id, { candidateId: candidate.id, cohortId, studentId, status: candidate.status }, `candidate.status:${candidate.id}:${candidate.version}`) })
      return candidate
    })
  }

  transitionCandidate(id: string, from: EvergreenCandidateStatus, to: EvergreenCandidateStatus, actorId: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.evergreenCandidate.updateMany({ where: { id, status: from }, data: { status: to, lastActorId: actorId, version: { increment: 1 } } })
      if (result.count !== 1) return null
      const candidate = await transaction.evergreenCandidate.findUniqueOrThrow({ where: { id } })
      await transaction.auditLog.create({ data: { userId: actorId, action: `EVERGREEN_CANDIDATE_${to}`, entityType: 'EvergreenCandidate', entityId: id, before: { status: from }, after: { status: to } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.candidate_status_changed', 'EvergreenCandidate', id, { candidateId: id, cohortId: candidate.cohortId, studentId: candidate.studentId, status: to }, `candidate.status:${id}:${candidate.version}`) })
      return candidate
    })
  }

  createOffer(candidateId: string, companyId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const offer = await transaction.placementOffer.create({ data: { ...payload, candidateId, companyId, createdById: actorId } as Prisma.PlacementOfferUncheckedCreateInput })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_OFFER_DRAFTED', entityType: 'PlacementOffer', entityId: offer.id, after: { status: offer.status, candidateId } } })
      return offer
    })
  }

  findOffer(id: string) {
    return prisma.placementOffer.findUnique({ where: { id }, include: { candidate: { include: { cohort: { include: { program: true } } } }, supervisor: { include: { user: true } }, acceptedPlacement: true } })
  }

  transitionOffer(id: string, companyId: string | undefined, from: EvergreenOfferStatus, to: EvergreenOfferStatus, actorId: string, patch: Record<string, any> = {}) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placementOffer.updateMany({ where: { id, status: from, ...(companyId ? { companyId } : {}) }, data: { status: to, ...patch } })
      if (result.count !== 1) return null
      const offer = await transaction.placementOffer.findUniqueOrThrow({ where: { id } })
      await transaction.auditLog.create({ data: { userId: actorId, action: `EVERGREEN_OFFER_${to}`, entityType: 'PlacementOffer', entityId: id, before: { status: from }, after: { status: to } } })
      if (to === 'SENT') await transaction.outboxEvent.create({ data: outboxData('evergreen.offer_sent', 'PlacementOffer', id, { offerId: id, studentId: offer.studentId, companyId: offer.companyId }, `offer.sent:${id}:${offer.version}`) })
      return offer
    })
  }

  acceptOffer(offerId: string, studentId: string, actorId: string, idempotencyKey: string, requestHash: string, repeatHireLimit: number) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${studentId}, 0))`
      const prior = await transaction.evergreenIdempotencyKey.findUnique({ where: { actorId_operation_key: { actorId, operation: 'ACCEPT_OFFER', key: idempotencyKey } } })
      if (prior?.resourceId) return transaction.placement.findUnique({ where: { id: prior.resourceId }, include: { activeLock: true, acceptedOffer: true } })
      if (prior && prior.requestHash !== requestHash) return 'IDEMPOTENCY_MISMATCH' as const

      const offer = await transaction.placementOffer.findFirst({ where: { id: offerId, studentId }, include: { acceptedPlacement: { include: { activeLock: true, acceptedOffer: true } }, candidate: { include: { cohort: { include: { program: true } } } } } })
      if (!offer) return null
      if (offer.acceptedPlacement) return offer.acceptedPlacement
      if (!['SENT', 'VIEWED'].includes(offer.status)) return `OFFER_${offer.status}` as const
      if (offer.respondBy <= new Date()) return 'OFFER_EXPIRED' as const
      if (!['OPEN', 'MATCHING', 'INTERVIEWING', 'PARTIALLY_FILLED'].includes(offer.candidate.cohort.status)) return 'COHORT_NOT_ACCEPTING' as const
      if (await transaction.activePlacementLock.findUnique({ where: { studentId } })) return 'ACTIVE_PLACEMENT_EXISTS' as const

      const [completedPlacements, mentorshipAlternatives] = await Promise.all([
        transaction.placement.count({ where: { studentId, companyId: offer.companyId, status: 'COMPLETED' } }),
        transaction.evergreenMentorshipAlternative.count({ where: { studentId, companyId: offer.companyId } })
      ])
      if (completedPlacements >= repeatHireLimit + mentorshipAlternatives) return 'REPEAT_HIRE_GUARDRAIL' as const

      if (!prior) await transaction.evergreenIdempotencyKey.create({ data: { actorId, operation: 'ACCEPT_OFFER', key: idempotencyKey, requestHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } })

      const seat = await transaction.evergreenCohort.updateMany({ where: { id: offer.candidate.cohortId, filledSeats: { lt: offer.candidate.cohort.seatCount }, reservedSeats: { lt: offer.candidate.cohort.seatCount } }, data: { filledSeats: { increment: 1 }, reservedSeats: { increment: 1 }, version: { increment: 1 } } })
      if (seat.count !== 1) return 'COHORT_FULL' as const
      const seatedCohort = await transaction.evergreenCohort.findUniqueOrThrow({ where: { id: offer.candidate.cohortId } })
      if (['INTERVIEWING', 'PARTIALLY_FILLED'].includes(seatedCohort.status)) {
        await transaction.evergreenCohort.update({ where: { id: seatedCohort.id }, data: { status: seatedCohort.filledSeats === seatedCohort.seatCount ? 'FILLED' : 'PARTIALLY_FILLED' } })
      }

      const terms = offer.termsSnapshot as Record<string, any>
      const placement = await transaction.placement.create({ data: {
        studentId, companyId: offer.companyId, programId: offer.candidate.cohort.programId, cohortId: offer.candidate.cohortId,
        candidateId: offer.candidateId, offerId: offer.id, supervisorId: offer.supervisorId, type: offer.placementType,
        role: offer.role, duties: offer.duties, status: 'PENDING_ONBOARDING', workMode: offer.workMode, location: offer.location,
        startDate: offer.startDate, endDate: offer.endDate, stipendAmount: offer.stipendAmount, currency: offer.currency,
        stipendFrequency: offer.stipendFrequency, termsSnapshot: terms, offeredAt: offer.sentAt ?? offer.createdAt, acceptedAt: new Date(), isLocked: true
      } })
      await transaction.placementOnboardingItem.createMany({ data: [
        { placementId: placement.id, ownerType: 'STUDENT', label: 'Confirm placement dates, location and support channels' },
        { placementId: placement.id, ownerType: 'COMPANY', label: 'Complete supervisor briefing and workspace access' },
        { placementId: placement.id, ownerType: 'COMPANY', label: 'Confirm first-week goals and check-in schedule' }
      ] })
      await transaction.activePlacementLock.create({ data: { studentId, placementId: placement.id, acquiredFromOfferId: offer.id } })
      await transaction.placementOffer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED', respondedAt: new Date() } })
      await transaction.evergreenCandidate.update({ where: { id: offer.candidateId }, data: { status: 'ACCEPTED', lastActorId: actorId, version: { increment: 1 } } })
      const otherOffers = await transaction.placementOffer.findMany({ where: { studentId, id: { not: offer.id }, status: { in: ['SENT', 'VIEWED'] } }, select: { id: true, candidateId: true } })
      if (otherOffers.length) {
        await transaction.placementOffer.updateMany({ where: { id: { in: otherOffers.map((item) => item.id) } }, data: { status: 'EXPIRED', respondedAt: new Date(), withdrawalReason: 'Closed after another placement was accepted' } })
        await transaction.evergreenCandidate.updateMany({ where: { id: { in: otherOffers.map((item) => item.candidateId) }, status: 'OFFERED' }, data: { status: 'OFFER_EXPIRED', lastActorId: actorId, version: { increment: 1 } } })
      }
      await transaction.placementStatusEvent.create({ data: { placementId: placement.id, toStatus: 'PENDING_ONBOARDING', actorId, reason: 'Formal offer accepted' } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_OFFER_ACCEPTED', entityType: 'Placement', entityId: placement.id, after: { offerId, studentId, companyId: offer.companyId, lockAcquired: true } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.offer_accepted', 'Placement', placement.id, { placementId: placement.id, offerId, studentId, companyId: offer.companyId, cohortId: offer.candidate.cohortId }, `offer.accepted:${offer.id}`) })
      await transaction.evergreenIdempotencyKey.update({ where: { actorId_operation_key: { actorId, operation: 'ACCEPT_OFFER', key: idempotencyKey } }, data: { resourceId: placement.id, responseCode: 200, responseBody: { placementId: placement.id }, completedAt: new Date() } })
      return transaction.placement.findUniqueOrThrow({ where: { id: placement.id }, include: { activeLock: true, acceptedOffer: true } })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 })
  }

  listStudentPlacements(studentId: string) {
    return prisma.placement.findMany({ where: { studentId }, include: { company: { select: { id: true, name: true, logoUrl: true } }, program: true, cohort: true, supervisor: { include: { user: { select: { name: true, email: true } } } }, activeLock: true, goals: true, checkIns: true, evidence: true, evaluations: true, onboardingItems: true, statusEvents: { orderBy: { createdAt: 'asc' } } }, orderBy: { offeredAt: 'desc' } })
  }

  findPlacement(id: string) {
    return prisma.placement.findUnique({ where: { id }, include: { company: true, student: { include: { user: true } }, program: true, cohort: true, supervisor: { include: { user: true } }, activeLock: true, goals: { include: { competency: true } }, checkIns: true, evidence: { include: { competency: true } }, evaluations: true, amendments: true, onboardingItems: true, statusEvents: { orderBy: { createdAt: 'asc' } } } })
  }

  transitionPlacement(id: string, from: PlacementStatus, to: PlacementStatus, actorId: string, reason?: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placement.updateMany({ where: { id, status: from }, data: { status: to, version: { increment: 1 }, ...(to === 'ACTIVE' ? { startedAt: new Date() } : {}), ...(to === 'COMPLETION_REVIEW' ? { completionSubmittedAt: new Date() } : {}) } })
      if (result.count !== 1) return null
      await transaction.placementStatusEvent.create({ data: { placementId: id, fromStatus: from, toStatus: to, actorId, reason } })
      const placement = await transaction.placement.findUniqueOrThrow({ where: { id } })
      if (to === 'ACTIVE') {
        if (placement.endDate) {
          const checkIns = []
          let periodStartsAt = new Date(placement.startDate)
          while (periodStartsAt < placement.endDate && checkIns.length < 104) {
            const periodEndsAt = new Date(Math.min(periodStartsAt.getTime() + 7 * 24 * 60 * 60 * 1000, placement.endDate.getTime()))
            checkIns.push({ placementId: id, periodStartsAt, periodEndsAt, dueAt: periodEndsAt, status: 'DUE' })
            periodStartsAt = periodEndsAt
          }
          if (checkIns.length) await transaction.placementCheckIn.createMany({ data: checkIns, skipDuplicates: true })
        }
        if (placement.candidateId) await transaction.evergreenCandidate.updateMany({ where: { id: placement.candidateId, status: 'ACCEPTED' }, data: { status: 'STARTED', version: { increment: 1 }, lastActorId: actorId } })
        if (placement.cohortId) await transaction.evergreenCohort.updateMany({ where: { id: placement.cohortId, status: { in: ['FILLED', 'PARTIALLY_FILLED'] } }, data: { status: 'IN_PROGRESS', version: { increment: 1 } } })
        await transaction.outboxEvent.create({ data: outboxData('placement.started', 'Placement', id, { placementId: id, studentId: placement.studentId, companyId: placement.companyId, cohortId: placement.cohortId }, `placement.started:${id}`) })
      }
      if (['CANCELLED_BEFORE_START', 'TERMINATED'].includes(to)) {
        await transaction.activePlacementLock.deleteMany({ where: { placementId: id } })
        await transaction.placement.update({ where: { id }, data: { isLocked: false, lockReleasedAt: new Date(), terminatedAt: to === 'TERMINATED' ? new Date() : undefined, terminationReason: reason } })
        await transaction.placementAvailability.updateMany({ where: { studentId: placement.studentId }, data: { isSeeking: false, visibleFrom: null, pausedAt: new Date(), version: { increment: 1 } } })
        await transaction.outboxEvent.create({ data: outboxData('placement.lock_released', 'Placement', id, { placementId: id, studentId: placement.studentId, reason, terminalStatus: to }, `placement.lock_released:${id}`) })
      }
      return transaction.placement.findUniqueOrThrow({ where: { id } })
    })
  }

  completePlacement(id: string, actorId: string, reason?: string) {
    return prisma.$transaction(async (transaction) => {
      const placement = await transaction.placement.findUnique({ where: { id }, include: { activeLock: true, cohort: true } })
      if (!placement || !['COMPLETION_REVIEW', 'DISPUTED'].includes(placement.status)) return null
      const verifiedEvidence = await transaction.placementEvidence.count({ where: { placementId: id, status: 'VERIFIED' } })
      if (verifiedEvidence === 0) return 'EVIDENCE_REQUIRED' as const
      const supervisorEvaluation = await transaction.placementEvaluation.count({ where: { placementId: id, evaluatorType: 'SUPERVISOR' } })
      if (supervisorEvaluation === 0) return 'EVALUATION_REQUIRED' as const
      const now = new Date()
      await transaction.placement.update({ where: { id }, data: { status: 'COMPLETED', completedAt: now, lockReleasedAt: now, isLocked: false, version: { increment: 1 } } })
      if (placement.activeLock) await transaction.activePlacementLock.delete({ where: { placementId: id } })
      await transaction.placementAvailability.updateMany({ where: { studentId: placement.studentId }, data: { isSeeking: false, visibleFrom: null, pausedAt: now, version: { increment: 1 } } })
      await transaction.evergreenCandidate.updateMany({ where: { id: placement.candidateId ?? '__none__' }, data: { status: 'COMPLETED', lastActorId: actorId, version: { increment: 1 } } })
      await transaction.placementStatusEvent.create({ data: { placementId: id, fromStatus: placement.status, toStatus: 'COMPLETED', actorId, reason } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PLACEMENT_COMPLETED', entityType: 'Placement', entityId: id, after: { lockReleased: true, availabilityRequiresReconfirmation: true } } })
      await transaction.outboxEvent.createMany({ data: [
        outboxData('placement.completed', 'Placement', id, { placementId: id, studentId: placement.studentId, companyId: placement.companyId, cohortId: placement.cohortId }, `placement.completed:${id}`),
        outboxData('placement.lock_released', 'Placement', id, { placementId: id, studentId: placement.studentId }, `placement.lock_released:${id}`)
      ] })
      if (placement.cohortId) {
        const remaining = await transaction.placement.count({ where: { cohortId: placement.cohortId, id: { not: id }, status: { notIn: ['COMPLETED', 'CANCELLED_BEFORE_START', 'TERMINATED'] } } })
        if (remaining === 0) {
          await transaction.evergreenCohort.updateMany({ where: { id: placement.cohortId, status: 'IN_PROGRESS' }, data: { status: 'COMPLETED', closedAt: now, version: { increment: 1 } } })
          await transaction.outboxEvent.create({ data: outboxData('evergreen.cohort_completed', 'EvergreenCohort', placement.cohortId, { cohortId: placement.cohortId, programId: placement.programId }, `cohort.completed:${placement.cohortId}`) })
        }
      }
      return transaction.placement.findUnique({ where: { id }, include: { activeLock: true } })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  createPlacementGoal(placementId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const goal = await transaction.placementGoal.create({ data: { placementId, createdById: actorId, competencyId: payload.competencyId, title: payload.title, description: payload.description, dueAt: payload.dueAt } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'PLACEMENT_GOAL_CREATED', entityType: 'PlacementGoal', entityId: goal.id, after: goal as unknown as Prisma.InputJsonValue } })
      return goal
    })
  }

  createPlacementCheckIn(placementId: string, studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const scheduled = await transaction.placementCheckIn.findFirst({ where: { placementId, status: { in: ['DUE', 'OVERDUE'] } }, orderBy: { dueAt: 'asc' } })
      const checkIn = scheduled
        ? await transaction.placementCheckIn.update({ where: { id: scheduled.id }, data: { studentReflection: payload.studentReflection, studentSubmittedAt: new Date(), status: 'SUBMITTED', riskFlag: false } })
        : await transaction.placementCheckIn.create({ data: { placementId, periodStartsAt: payload.periodStartsAt, periodEndsAt: payload.periodEndsAt, dueAt: payload.dueAt, studentReflection: payload.studentReflection, studentSubmittedAt: new Date(), status: 'SUBMITTED' } })
      await transaction.auditLog.create({ data: { userId: payload.actorId, action: 'PLACEMENT_CHECK_IN_SUBMITTED', entityType: 'PlacementCheckIn', entityId: checkIn.id, after: { placementId, studentId } } })
      return checkIn
    })
  }

  respondPlacementCheckIn(id: string, placementId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placementCheckIn.updateMany({ where: { id, placementId }, data: { supervisorResponse: payload.response, supervisorRespondedAt: new Date(), riskFlag: payload.riskFlag, status: 'RESPONDED' } })
      if (result.count !== 1) return null
      await transaction.auditLog.create({ data: { userId: actorId, action: 'PLACEMENT_CHECK_IN_RESPONDED', entityType: 'PlacementCheckIn', entityId: id, after: { placementId, riskFlag: payload.riskFlag } } })
      return transaction.placementCheckIn.findUnique({ where: { id } })
    })
  }

  createPlacementEvidence(placementId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const evidence = await transaction.placementEvidence.create({ data: { placementId, submittedById: actorId, goalId: payload.goalId, competencyId: payload.competencyId, evidenceType: payload.evidenceType, title: payload.title, description: payload.description, artifactReference: payload.artifactReference } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'PLACEMENT_EVIDENCE_SUBMITTED', entityType: 'PlacementEvidence', entityId: evidence.id, after: { placementId, evidenceType: evidence.evidenceType } } })
      return evidence
    })
  }

  createPlacementEvaluation(placementId: string, actorId: string, evaluatorType: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const evaluation = await transaction.placementEvaluation.create({ data: { placementId, evaluatorId: actorId, evaluatorType, rubricScores: payload.rubricScores, narrative: payload.narrative, recommendation: payload.recommendation, visibility: payload.visibility } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'PLACEMENT_EVALUATION_SUBMITTED', entityType: 'PlacementEvaluation', entityId: evaluation.id, after: { placementId, evaluatorType, visibility: evaluation.visibility } } })
      return evaluation
    })
  }

  verifyPlacementEvidence(placementId: string, evidenceId: string, actorId: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placementEvidence.updateMany({ where: { id: evidenceId, placementId, status: 'SUBMITTED' }, data: { status: 'VERIFIED', verifiedById: actorId, verifiedAt: new Date() } })
      if (result.count !== 1) return null
      const evidence = await transaction.placementEvidence.findUniqueOrThrow({ where: { id: evidenceId } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'PLACEMENT_EVIDENCE_VERIFIED', entityType: 'PlacementEvidence', entityId: evidenceId, after: { placementId, status: 'VERIFIED' } } })
      return evidence
    })
  }

  completeOnboardingItem(id: string, placementId: string, actorId: string, ownerType: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placementOnboardingItem.updateMany({ where: { id, placementId, ownerType, completedAt: null }, data: { completedAt: new Date(), completedBy: actorId } })
      if (result.count !== 1) return null
      const remaining = await transaction.placementOnboardingItem.count({ where: { placementId, required: true, completedAt: null } })
      if (remaining === 0) {
        const placement = await transaction.placement.findUniqueOrThrow({ where: { id: placementId } })
        if (placement.status === 'PENDING_ONBOARDING') {
          await transaction.placement.update({ where: { id: placementId }, data: { status: 'READY', readyAt: new Date(), version: { increment: 1 } } })
          await transaction.placementStatusEvent.create({ data: { placementId, fromStatus: 'PENDING_ONBOARDING', toStatus: 'READY', actorId, reason: 'Required onboarding completed' } })
        }
      }
      return transaction.placement.findUnique({ where: { id: placementId }, include: { onboardingItems: true } })
    })
  }

  createPlacementAmendment(placementId: string, actorId: string, party: 'STUDENT' | 'COMPANY', reason: string, changes: Prisma.InputJsonValue) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${placementId}, 1))`
      const latest = await transaction.placementAmendment.findFirst({ where: { placementId }, orderBy: { version: 'desc' }, select: { version: true } })
      const amendment = await transaction.placementAmendment.create({ data: {
        placementId,
        proposedById: actorId,
        reason,
        changes,
        version: (latest?.version ?? 0) + 1,
        ...(party === 'STUDENT' ? { studentAcceptedAt: new Date() } : { companyAcceptedAt: new Date() })
      } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PLACEMENT_AMENDMENT_PROPOSED', entityType: 'PlacementAmendment', entityId: amendment.id, after: { placementId, version: amendment.version, party } } })
      await transaction.outboxEvent.create({ data: outboxData('placement.amendment_proposed', 'PlacementAmendment', amendment.id, { amendmentId: amendment.id, placementId, proposedBy: party }, `placement.amendment.proposed:${amendment.id}`) })
      return amendment
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  decidePlacementAmendment(amendmentId: string, placementId: string, actorId: string, party: 'STUDENT' | 'COMPANY', decision: 'ACCEPT' | 'REJECT', reason?: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${placementId}, 1))`
      const amendment = await transaction.placementAmendment.findFirst({ where: { id: amendmentId, placementId } })
      if (!amendment || amendment.status !== 'PROPOSED') return null
      if (decision === 'REJECT') {
        const rejected = await transaction.placementAmendment.update({ where: { id: amendmentId }, data: { status: 'REJECTED' } })
        await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PLACEMENT_AMENDMENT_REJECTED', entityType: 'PlacementAmendment', entityId: amendmentId, after: { placementId, party, reason } } })
        return { amendment: rejected, placement: null }
      }
      const accepted = await transaction.placementAmendment.update({ where: { id: amendmentId }, data: party === 'STUDENT' ? { studentAcceptedAt: new Date() } : { companyAcceptedAt: new Date() } })
      if (!accepted.studentAcceptedAt || !accepted.companyAcceptedAt) {
        await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PLACEMENT_AMENDMENT_ACCEPTED', entityType: 'PlacementAmendment', entityId: amendmentId, after: { placementId, party, pendingCounterparty: true } } })
        return { amendment: accepted, placement: null }
      }
      const changes = accepted.changes as Record<string, unknown>
      const placement = await transaction.placement.update({ where: { id: placementId }, data: {
        ...(changes.startDate !== undefined ? { startDate: new Date(String(changes.startDate)) } : {}),
        ...(changes.endDate !== undefined ? { endDate: changes.endDate === null ? null : new Date(String(changes.endDate)) } : {}),
        ...(changes.stipendAmount !== undefined ? { stipendAmount: changes.stipendAmount === null ? null : new Prisma.Decimal(String(changes.stipendAmount)) } : {}),
        ...(changes.currency !== undefined ? { currency: String(changes.currency) } : {}),
        ...(changes.stipendFrequency !== undefined ? { stipendFrequency: changes.stipendFrequency === null ? null : String(changes.stipendFrequency) } : {}),
        ...(changes.location !== undefined ? { location: changes.location === null ? null : String(changes.location) } : {}),
        ...(changes.supervisorId !== undefined ? { supervisorId: changes.supervisorId === null ? null : String(changes.supervisorId) } : {}),
        ...(changes.duties !== undefined ? { duties: changes.duties === null ? null : String(changes.duties) } : {}),
        version: { increment: 1 }
      } })
      const applied = await transaction.placementAmendment.update({ where: { id: amendmentId }, data: { status: 'APPLIED', appliedAt: new Date() } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PLACEMENT_AMENDMENT_APPLIED', entityType: 'PlacementAmendment', entityId: amendmentId, after: { placementId, version: applied.version } } })
      await transaction.outboxEvent.create({ data: outboxData('placement.amendment_applied', 'PlacementAmendment', amendmentId, { amendmentId, placementId }, `placement.amendment.applied:${amendmentId}`) })
      return { amendment: applied, placement }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  createPlacementSupportRequest(placementId: string, actorId: string, payload: { category: string, summary: string, privateDetails?: string }) {
    return prisma.$transaction(async (transaction) => {
      const request = await transaction.placementSupportRequest.create({ data: { placementId, requestedById: actorId, ...payload } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PROTECTED_SUPPORT_REQUESTED', entityType: 'PlacementSupportRequest', entityId: request.id, after: { placementId, category: request.category } } })
      await transaction.outboxEvent.create({ data: outboxData('placement.protected_support_requested', 'PlacementSupportRequest', request.id, { supportRequestId: request.id, placementId, category: request.category }, `placement.support.requested:${request.id}`) })
      return { ...request, privateDetails: undefined }
    })
  }

  listOpenSupportRequests() {
    return prisma.placementSupportRequest.findMany({ where: { status: 'OPEN' }, include: { placement: { select: { id: true, studentId: true, companyId: true, status: true } } }, orderBy: { createdAt: 'asc' } })
  }

  resolveSupportRequest(id: string, actorId: string, resolution: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.placementSupportRequest.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'RESOLVED', assignedToId: actorId, resolution, resolvedAt: new Date() } })
      if (result.count !== 1) return null
      const request = await transaction.placementSupportRequest.findUniqueOrThrow({ where: { id } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_PROTECTED_SUPPORT_RESOLVED', entityType: 'PlacementSupportRequest', entityId: id, after: { placementId: request.placementId, resolution } } })
      return request
    })
  }

  auditSensitiveRead(actorId: string, entityType: string, entityId: string, action: string) {
    return prisma.auditLog.create({ data: { userId: actorId, action, entityType, entityId } })
  }

  createOverride(actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const override = await transaction.evergreenOverride.create({ data: { subjectType: payload.subjectType, subjectId: payload.subjectId, policy: payload.policy, reason: payload.reason, expiresAt: payload.expiresAt, approvedById: actorId } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_OVERRIDE_GRANTED', entityType: 'EvergreenOverride', entityId: override.id, after: override as unknown as Prisma.InputJsonValue } })
      return override
    })
  }

  createMentorshipAlternative(actorId: string, payload: { companyId: string, studentId: string, type: string, description: string, completedAt: Date, evidence?: Prisma.InputJsonValue }) {
    return prisma.$transaction(async (transaction) => {
      const alternative = await transaction.evergreenMentorshipAlternative.create({ data: { ...payload, approvedById: actorId } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_MENTORSHIP_ALTERNATIVE_APPROVED', entityType: 'EvergreenMentorshipAlternative', entityId: alternative.id, after: { companyId: alternative.companyId, studentId: alternative.studentId, type: alternative.type, completedAt: alternative.completedAt } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.mentorship_alternative_approved', 'EvergreenMentorshipAlternative', alternative.id, { mentorshipAlternativeId: alternative.id, companyId: alternative.companyId, studentId: alternative.studentId, type: alternative.type }, `mentorship.alternative:${alternative.id}`) })
      return alternative
    })
  }

  createInvoice(companyId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const invoice = await transaction.evergreenInvoice.create({ data: { companyId, invoiceNumber: payload.invoiceNumber, amount: payload.amount, currency: payload.currency, status: 'ISSUED', externalReference: payload.externalReference, issuedAt: new Date(), dueAt: payload.dueAt, idempotencyKey: payload.idempotencyKey } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_INVOICE_ISSUED', entityType: 'EvergreenInvoice', entityId: invoice.id, after: { companyId, invoiceNumber: invoice.invoiceNumber, amount: invoice.amount.toString(), currency: invoice.currency } } })
      return invoice
    })
  }

  confirmInvoice(invoiceId: string, actorId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const invoice = await transaction.evergreenInvoice.findUnique({ where: { id: invoiceId }, include: { entitlement: true } })
      if (!invoice) return null
      if (invoice.entitlement && invoice.status === 'CONFIRMED') return invoice.entitlement
      if (invoice.status !== 'ISSUED') return `INVOICE_${invoice.status}` as const
      await transaction.evergreenInvoice.update({ where: { id: invoiceId }, data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedById: actorId, externalReference: payload.externalReference } })
      const entitlement = await transaction.evergreenEntitlement.create({ data: { companyId: invoice.companyId, sourceInvoiceId: invoice.id, planCode: payload.planCode, status: 'ACTIVE', programLimit: payload.programLimit, seatLimit: payload.seatLimit, validFrom: payload.validFrom, validUntil: payload.validUntil, sourceType: 'MANUAL_INVOICE', sourceReference: payload.externalReference, confirmedById: actorId, confirmedAt: new Date() } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_INVOICE_CONFIRMED', entityType: 'EvergreenInvoice', entityId: invoiceId, after: { entitlementId: entitlement.id, externalReference: payload.externalReference } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.entitlement_activated', 'EvergreenEntitlement', entitlement.id, { entitlementId: entitlement.id, companyId: invoice.companyId, invoiceId }, `entitlement.activated:${entitlement.id}`) })
      return entitlement
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  refundInvoice(invoiceId: string, actorId: string, reason: string) {
    return prisma.$transaction(async (transaction) => {
      const invoice = await transaction.evergreenInvoice.findUnique({ where: { id: invoiceId }, include: { entitlement: true } })
      if (!invoice) return null
      if (invoice.status === 'REFUNDED') return invoice
      if (invoice.status !== 'CONFIRMED') return `INVOICE_${invoice.status}` as const
      const refunded = await transaction.evergreenInvoice.update({ where: { id: invoiceId }, data: { status: 'REFUNDED', refundedAt: new Date(), refundReason: reason } })
      if (invoice.entitlement) await transaction.evergreenEntitlement.update({ where: { id: invoice.entitlement.id }, data: { status: 'REFUNDED' } })
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_INVOICE_REFUNDED', entityType: 'EvergreenInvoice', entityId: invoiceId, after: { reason, entitlementId: invoice.entitlement?.id } } })
      await transaction.outboxEvent.create({ data: outboxData('evergreen.entitlement_refunded', 'EvergreenInvoice', invoiceId, { invoiceId, companyId: invoice.companyId, entitlementId: invoice.entitlement?.id }, `entitlement.refunded:${invoiceId}`) })
      return refunded
    })
  }

  changeEntitlementStatus(id: string, actorId: string, from: 'ACTIVE' | 'SUSPENDED', to: 'ACTIVE' | 'SUSPENDED', reason: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.evergreenEntitlement.updateMany({ where: { id, status: from, validUntil: { gt: new Date() } }, data: { status: to } })
      if (result.count !== 1) return null
      const entitlement = await transaction.evergreenEntitlement.findUniqueOrThrow({ where: { id } })
      await transaction.auditLog.create({ data: { userId: actorId, action: `EVERGREEN_ENTITLEMENT_${to}`, entityType: 'EvergreenEntitlement', entityId: id, after: { reason, companyId: entitlement.companyId } } })
      await transaction.outboxEvent.create({ data: outboxData(`evergreen.entitlement_${to.toLowerCase()}`, 'EvergreenEntitlement', id, { entitlementId: id, companyId: entitlement.companyId, reason }, `entitlement.${to.toLowerCase()}:${id}:${entitlement.updatedAt.toISOString()}`) })
      return entitlement
    })
  }

  listProgramReviews(cursor?: string, take = 25) {
    return prisma.evergreenProgram.findMany({ where: { status: { in: ['PENDING_REVIEW', 'CHANGES_REQUESTED'] } }, include: { company: true, supervisors: { include: { supervisor: { include: { user: true } } } }, competencies: { include: { competency: true } }, skills: { include: { skill: true } } }, orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }], take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
  }

  listPlacementAlerts() {
    return prisma.placement.findMany({ where: { OR: [{ status: 'DISPUTED' }, { checkIns: { some: { status: 'DUE', dueAt: { lt: new Date() } } } }, { supervisorId: null }] }, include: { company: { select: { id: true, name: true } }, student: { include: { user: { select: { name: true } } } }, checkIns: { where: { status: 'DUE', dueAt: { lt: new Date() } } } }, orderBy: { updatedAt: 'asc' } })
  }
}

const evergreenRepository = new EvergreenRepository()

export { EvergreenRepository, evergreenRepository, outboxData }
