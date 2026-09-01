import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

class EvergreenJobsRepository {
  async acquireLease(name: string, ownerId: string, leaseMilliseconds = 5 * 60 * 1000) {
    const now = new Date()
    const lockedUntil = new Date(now.getTime() + leaseMilliseconds)
    const renewed = await prisma.evergreenWorkerLease.updateMany({ where: { name, OR: [{ lockedUntil: { lt: now } }, { ownerId }] }, data: { ownerId, lockedUntil, heartbeatAt: now } })
    if (renewed.count === 1) return true
    try {
      await prisma.evergreenWorkerLease.create({ data: { name, ownerId, lockedUntil, heartbeatAt: now } })
      return true
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false
      throw error
    }
  }

  releaseLease(name: string, ownerId: string) {
    return prisma.evergreenWorkerLease.updateMany({ where: { name, ownerId }, data: { lockedUntil: new Date(), heartbeatAt: new Date() } })
  }

  startJob(jobName: string, requestedById?: string, replayOfId?: string) {
    return prisma.evergreenJobRun.create({ data: { jobName, requestedById, replayOfId } })
  }

  finishJob(id: string, result: Prisma.InputJsonValue) {
    return prisma.evergreenJobRun.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date(), result } })
  }

  failJob(id: string, error: unknown) {
    return prisma.evergreenJobRun.update({ where: { id }, data: { status: 'FAILED', completedAt: new Date(), failureReason: error instanceof Error ? error.message.slice(0, 4000) : String(error).slice(0, 4000) } })
  }

  listMatchableCohorts() {
    return prisma.evergreenCohort.findMany({
      where: { status: { in: ['OPEN', 'MATCHING'] }, program: { status: 'ACTIVE' } },
      include: { program: { include: { skills: true, competencies: true } } }
    })
  }

  openAndCloseScheduledCohorts() {
    return prisma.$transaction(async (transaction) => {
      const now = new Date()
      const dueToOpen = await transaction.evergreenCohort.findMany({ where: { status: 'SCHEDULED', applicationOpensAt: { lte: now }, program: { status: 'ACTIVE', company: { evergreenEntitlements: { some: { status: 'ACTIVE', validFrom: { lte: now }, validUntil: { gt: now } } } } } }, include: { program: { select: { companyId: true } } } })
      for (const cohort of dueToOpen) {
        await transaction.evergreenCohort.update({ where: { id: cohort.id }, data: { status: 'OPEN', openedAt: now, version: { increment: 1 } } })
        await transaction.outboxEvent.create({ data: { aggregateType: 'EvergreenCohort', aggregateId: cohort.id, eventType: 'evergreen.cohort_opened', payload: { cohortId: cohort.id, programId: cohort.programId, companyId: cohort.program.companyId }, idempotencyKey: `cohort.opened:${cohort.id}:${cohort.version + 1}` } })
      }
      const dueToClose = await transaction.evergreenCohort.findMany({ where: { status: 'MATCHING', applicationClosesAt: { lte: now } } })
      for (const cohort of dueToClose) {
        await transaction.evergreenCohort.update({ where: { id: cohort.id }, data: { status: 'INTERVIEWING', closedAt: now, version: { increment: 1 } } })
      }
      return { opened: dueToOpen.length, movedToInterviewing: dueToClose.length }
    })
  }

  listAvailableStudents() {
    const now = new Date()
    return prisma.placementAvailability.findMany({
      where: { isSeeking: true, expiresAt: { gt: now }, visibleFrom: { lte: now }, pausedAt: null },
      include: {
        student: {
          include: {
            user: { select: { role: true } },
            activePlacementLock: true,
            roadmapEnrollments: { where: { verifiedAt: { not: null } }, include: { evidence: { where: { verificationStatus: 'VERIFIED' } } } },
            competencyStates: true,
            studentSkills: true,
            endorsementsReceived: true,
            pipelineRelationships: true,
            portfolioItems: { where: { isPublic: true } }
          }
        }
      }
    })
  }

  listActiveStudentTransitionOverrides(studentIds: string[]) {
    return prisma.evergreenOverride.findMany({ where: { subjectType: 'STUDENT', subjectId: { in: studentIds }, policy: 'STUDENT_TRANSITION_ACCESS', status: 'ACTIVE', expiresAt: { gt: new Date() } }, select: { subjectId: true } })
  }

  async persistMatchRun(cohortId: string, inputSnapshot: Prisma.InputJsonValue, matches: Array<Record<string, any>>) {
    return prisma.$transaction(async (transaction) => {
      const run = await transaction.evergreenMatchRun.create({ data: { cohortId, algorithmVersion: 'evergreen-match-v1', inputSnapshot, status: 'RUNNING', startedAt: new Date() } })
      for (const match of matches) {
        await transaction.evergreenCandidate.upsert({
          where: { cohortId_studentId: { cohortId, studentId: match.studentId } },
          update: { matchScore: match.score, matchVersion: 'evergreen-match-v1', matchReasons: match.reasons, eligibilitySnapshot: match.eligibilitySnapshot, consentSnapshot: match.consentSnapshot, version: { increment: 1 } },
          create: { cohortId, studentId: match.studentId, source: 'MATCH', status: 'MATCHED', matchScore: match.score, matchVersion: 'evergreen-match-v1', matchReasons: match.reasons, eligibilitySnapshot: match.eligibilitySnapshot, consentSnapshot: match.consentSnapshot }
        })
      }
      await transaction.evergreenMatchRun.update({ where: { id: run.id }, data: { status: 'COMPLETED', eligibleCount: matches.length, matchedCount: matches.length, completedAt: new Date() } })
      await transaction.evergreenCohort.updateMany({ where: { id: cohortId, status: 'OPEN' }, data: { status: 'MATCHING', version: { increment: 1 } } })
      await transaction.outboxEvent.create({ data: { aggregateType: 'EvergreenCohort', aggregateId: cohortId, eventType: 'evergreen.match_completed', payload: { cohortId, matchRunId: run.id, matchedCount: matches.length }, idempotencyKey: `match.completed:${run.id}` } })
      return run
    })
  }

  expireOffers() {
    return prisma.$transaction(async (transaction) => {
      const offers = await transaction.placementOffer.findMany({ where: { status: { in: ['SENT', 'VIEWED'] }, respondBy: { lte: new Date() } }, select: { id: true, candidateId: true, studentId: true } })
      if (!offers.length) return 0
      await transaction.placementOffer.updateMany({ where: { id: { in: offers.map((offer) => offer.id) } }, data: { status: 'EXPIRED', respondedAt: new Date() } })
      await transaction.evergreenCandidate.updateMany({ where: { id: { in: offers.map((offer) => offer.candidateId) }, status: 'OFFERED' }, data: { status: 'OFFER_EXPIRED', version: { increment: 1 } } })
      for (const offer of offers) await transaction.outboxEvent.create({ data: { aggregateType: 'PlacementOffer', aggregateId: offer.id, eventType: 'evergreen.offer_expired', payload: { offerId: offer.id, studentId: offer.studentId }, idempotencyKey: `offer.expired:${offer.id}` } })
      return offers.length
    })
  }

  expireAvailability() {
    return prisma.$transaction(async (transaction) => {
      const expired = await transaction.placementAvailability.findMany({ where: { isSeeking: true, expiresAt: { lte: new Date() } }, select: { id: true, studentId: true, version: true } })
      if (!expired.length) return 0
      await transaction.placementAvailability.updateMany({ where: { id: { in: expired.map((item) => item.id) } }, data: { isSeeking: false, visibleFrom: null, pausedAt: new Date(), version: { increment: 1 } } })
      for (const item of expired) await transaction.outboxEvent.create({ data: { aggregateType: 'PlacementAvailability', aggregateId: item.id, eventType: 'student.placement_availability_expired', payload: { availabilityId: item.id, studentId: item.studentId }, idempotencyKey: `availability.expired:${item.id}:${item.version}` } })
      return expired.length
    })
  }

  markOverdueCheckIns() {
    return prisma.$transaction(async (transaction) => {
      const overdue = await transaction.placementCheckIn.findMany({ where: { status: 'DUE', dueAt: { lt: new Date() } }, include: { placement: true } })
      if (!overdue.length) return 0
      await transaction.placementCheckIn.updateMany({ where: { id: { in: overdue.map((item) => item.id) } }, data: { status: 'OVERDUE', riskFlag: true } })
      for (const item of overdue) await transaction.outboxEvent.create({ data: { aggregateType: 'PlacementCheckIn', aggregateId: item.id, eventType: 'placement.check_in_overdue', payload: { checkInId: item.id, placementId: item.placementId, studentId: item.placement.studentId, companyId: item.placement.companyId }, idempotencyKey: `check-in.overdue:${item.id}` } })
      return overdue.length
    })
  }

  enqueueDueReminders() {
    return prisma.$transaction(async (transaction) => {
      const now = new Date()
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const [offers, onboarding, completion] = await Promise.all([
        transaction.placementOffer.findMany({ where: { status: { in: ['SENT', 'VIEWED'] }, respondBy: { gt: now, lte: in24Hours } }, select: { id: true, studentId: true, companyId: true } }),
        transaction.placement.findMany({ where: { status: 'PENDING_ONBOARDING', acceptedAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }, select: { id: true, studentId: true, companyId: true } }),
        transaction.placement.findMany({ where: { status: 'ACTIVE', endDate: { gt: now, lte: in3Days } }, select: { id: true, studentId: true, companyId: true } })
      ])
      await transaction.outboxEvent.createMany({ data: [
        ...offers.map((offer) => ({ aggregateType: 'PlacementOffer', aggregateId: offer.id, eventType: 'evergreen.offer_expiry_near', payload: { offerId: offer.id, studentId: offer.studentId, companyId: offer.companyId }, idempotencyKey: `offer.expiry-near:${offer.id}` })),
        ...onboarding.map((placement) => ({ aggregateType: 'Placement', aggregateId: placement.id, eventType: 'placement.onboarding_due', payload: { placementId: placement.id, studentId: placement.studentId, companyId: placement.companyId }, idempotencyKey: `placement.onboarding-due:${placement.id}` })),
        ...completion.map((placement) => ({ aggregateType: 'Placement', aggregateId: placement.id, eventType: 'placement.completion_due', payload: { placementId: placement.id, studentId: placement.studentId, companyId: placement.companyId }, idempotencyKey: `placement.completion-due:${placement.id}` }))
      ], skipDuplicates: true })
      return { offerExpiry: offers.length, onboarding: onboarding.length, completion: completion.length }
    })
  }

  expireEntitlements() {
    return prisma.evergreenEntitlement.updateMany({ where: { status: 'ACTIVE', validUntil: { lte: new Date() } }, data: { status: 'EXPIRED' } })
  }

  listCompletedRecurringPrograms() {
    const now = new Date()
    return prisma.evergreenProgram.findMany({ where: { status: 'ACTIVE', recurrenceType: { not: 'NONE' }, cohorts: { some: { status: 'COMPLETED' } }, company: { evergreenEntitlements: { some: { status: 'ACTIVE', validFrom: { lte: now }, validUntil: { gt: now } } } } }, include: { cohorts: { orderBy: { sequenceNumber: 'desc' }, take: 2 } } })
  }

  createRecurringCohort(programId: string, sequenceNumber: number, data: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const program = await transaction.evergreenProgram.findUniqueOrThrow({ where: { id: programId }, select: { companyId: true } })
      const cohort = await transaction.evergreenCohort.create({ data: { programId, sequenceNumber, seatCount: data.seatCount, applicationOpensAt: data.applicationOpensAt, applicationClosesAt: data.applicationClosesAt, placementStartsAt: data.placementStartsAt, placementEndsAt: data.placementEndsAt, status: data.applicationOpensAt <= new Date() ? 'OPEN' : 'SCHEDULED', recurrenceSource: data.recurrenceSource } })
      await transaction.outboxEvent.create({ data: { aggregateType: 'EvergreenCohort', aggregateId: cohort.id, eventType: cohort.status === 'OPEN' ? 'evergreen.cohort_opened' : 'evergreen.cohort_scheduled', payload: { cohortId: cohort.id, programId, companyId: program.companyId }, idempotencyKey: `cohort.recurrence:${programId}:${sequenceNumber}` } })
      return cohort
    })
  }

  reconcilePlacements() {
    return Promise.all([
      prisma.placement.count({ where: { status: { in: ['PENDING_ONBOARDING', 'READY', 'ACTIVE', 'COMPLETION_REVIEW', 'DISPUTED'] }, activeLock: null } }),
      prisma.activePlacementLock.count({ where: { placement: { status: { in: ['COMPLETED', 'CANCELLED_BEFORE_START', 'TERMINATED'] } } } }),
      prisma.evergreenCohort.count({ where: { filledSeats: { gt: 0 }, placements: { none: {} } } })
    ]).then(([missingLocks, staleLocks, seatMismatches]) => ({ missingLocks, staleLocks, seatMismatches }))
  }

  listPendingOutbox(limit = 50) {
    return prisma.outboxEvent.findMany({ where: { status: { in: ['PENDING', 'FAILED'] }, availableAt: { lte: new Date() }, attemptCount: { lt: 8 } }, orderBy: { createdAt: 'asc' }, take: limit })
  }

  async claimOutbox(id: string, workerId: string) {
    const result = await prisma.outboxEvent.updateMany({ where: { id, status: { in: ['PENDING', 'FAILED'] }, availableAt: { lte: new Date() } }, data: { status: 'PROCESSING', claimedBy: workerId, claimedAt: new Date(), attemptCount: { increment: 1 } } })
    return result.count === 1
  }

  deliverOutbox(id: string) {
    return prisma.outboxEvent.update({ where: { id }, data: { status: 'DELIVERED', deliveredAt: new Date(), claimedBy: null, claimedAt: null, lastError: null } })
  }

  failOutbox(id: string, error: unknown, attempts: number) {
    const dead = attempts >= 8
    return prisma.outboxEvent.update({ where: { id }, data: { status: dead ? 'DEAD_LETTER' : 'FAILED', claimedBy: null, claimedAt: null, lastError: error instanceof Error ? error.message.slice(0, 4000) : String(error).slice(0, 4000), availableAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60 * 1000) } })
  }

  listFailures() {
    return Promise.all([
      prisma.evergreenJobRun.findMany({ where: { status: 'FAILED' }, orderBy: { startedAt: 'desc' }, take: 100 }),
      prisma.outboxEvent.findMany({ where: { status: { in: ['FAILED', 'DEAD_LETTER'] } }, orderBy: { createdAt: 'desc' }, take: 100 })
    ]).then(([jobs, events]) => ({ jobs, events }))
  }

  replayOutboxEvent(id: string, actorId: string) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.outboxEvent.updateMany({ where: { id, status: { in: ['FAILED', 'DEAD_LETTER'] } }, data: { status: 'PENDING', attemptCount: 0, availableAt: new Date(), claimedAt: null, claimedBy: null, lastError: null } })
      if (result.count !== 1) return null
      await transaction.auditLog.create({ data: { userId: actorId, action: 'EVERGREEN_OUTBOX_REPLAY_REQUESTED', entityType: 'OutboxEvent', entityId: id } })
      return transaction.outboxEvent.findUnique({ where: { id } })
    })
  }

  processNotificationConsumer(event: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (await transaction.outboxConsumerReceipt.findUnique({ where: { eventId_consumer: { eventId: event.id, consumer: 'evergreen.notifications.v1' } } })) return 'duplicate'
      const payload = event.payload as Record<string, any>
      const notifications: Array<{ userId: string, type: string, title: string, body: string, data: Prisma.InputJsonValue, sentVia: string[] }> = []
      const student = payload.studentId ? await transaction.studentProfile.findUnique({ where: { id: payload.studentId }, select: { userId: true } }) : null
      const companyUsers = payload.companyId ? await transaction.companyContact.findMany({ where: { companyId: payload.companyId }, select: { userId: true } }) : []
      const studentMessages: Record<string, [string, string]> = {
        'evergreen.offer_sent': ['New placement offer', 'A company sent you a formal Evergreen placement offer.'],
        'evergreen.offer_expired': ['Placement offer expired', 'The response window for a placement offer has closed.'],
        'evergreen.offer_expiry_near': ['Placement offer expires soon', 'Review and respond before the formal offer deadline.'],
        'evergreen.offer_accepted': ['Placement accepted', 'Your exclusive Evergreen placement is ready for onboarding.'],
        'placement.check_in_overdue': ['Placement check-in overdue', 'Please complete your overdue placement check-in.'],
        'placement.completed': ['Placement completed', 'Your placement evidence and growth records are being updated.'],
        'placement.onboarding_due': ['Placement onboarding due', 'Complete your remaining onboarding actions.'],
        'placement.completion_due': ['Placement completion approaching', 'Prepare your final evidence and completion material.'],
        'student.placement_availability_expired': ['Reconfirm placement availability', 'Your placement availability expired and is now paused.'],
        'placement.amendment_proposed': ['Placement amendment proposed', 'Review a proposed change to your placement terms.'],
        'placement.amendment_applied': ['Placement terms updated', 'Both parties accepted a placement amendment and the new terms now apply.']
      }
      const companyMessages: Record<string, [string, string]> = {
        'evergreen.program_activated': ['Evergreen program approved', 'Your recurring placement program is approved and active.'],
        'evergreen.program_changes_requested': ['Program changes requested', 'Operations requested changes before your Evergreen program can be approved.'],
        'evergreen.cohort_opened': ['Evergreen cohort opened', 'A recurring cohort is now open for matching and applications.'],
        'evergreen.offer_accepted': ['Placement offer accepted', 'A student accepted your formal offer and the cohort seat is locked.'],
        'evergreen.offer_expiry_near': ['Placement offer expires soon', 'A formal offer is nearing its response deadline.'],
        'placement.check_in_overdue': ['Placement check-in overdue', 'An assigned placement has an overdue check-in.'],
        'placement.onboarding_due': ['Placement onboarding due', 'Complete the company onboarding actions for an accepted placement.'],
        'placement.completion_due': ['Placement completion approaching', 'Prepare the supervisor evaluation and evidence review.'],
        'placement.completed': ['Placement completed', 'A supervised Evergreen placement has completed.'],
        'placement.amendment_proposed': ['Placement amendment proposed', 'Review a proposed change to supervised placement terms.'],
        'placement.amendment_applied': ['Placement terms updated', 'Both parties accepted a placement amendment.']
      }
      if (event.eventType === 'evergreen.candidate_status_changed' && student) {
        const candidateMessages: Record<string, [string, string]> = {
          INVITED: ['Evergreen invitation', 'A qualified company invited you to a recurring placement cohort.'],
          INTERVIEWING: ['Placement interview update', 'Your Evergreen candidate record moved to the interview stage.'],
          REJECTED: ['Placement application update', 'A company completed its review of your application.']
        }
        const message = candidateMessages[String(payload.status)]
        if (message) notifications.push({ userId: student.userId, type: event.eventType, title: message[0], body: message[1], data: payload, sentVia: ['IN_APP'] })
      }
      if (event.eventType === 'evergreen.match_completed' && payload.cohortId) {
        const matched = await transaction.evergreenCandidate.findMany({ where: { cohortId: String(payload.cohortId), source: 'MATCH' }, select: { student: { select: { userId: true } } } })
        for (const item of matched) notifications.push({ userId: item.student.userId, type: event.eventType, title: 'New explained placement match', body: 'A new Evergreen match is ready with reasons you can review.', data: payload, sentVia: ['IN_APP'] })
      }
      if (event.eventType === 'placement.protected_support_requested') {
        const operationsUsers = await transaction.user.findMany({ where: { role: { in: ['OPERATIONS_MANAGER', 'SUPER_ADMIN'] } }, select: { id: true } })
        for (const user of operationsUsers) notifications.push({ userId: user.id, type: event.eventType, title: 'Protected placement support request', body: 'A student requested a private operations response.', data: { supportRequestId: payload.supportRequestId, placementId: payload.placementId, category: payload.category }, sentVia: ['IN_APP'] })
      }
      if (['placement.amendment_proposed', 'placement.amendment_applied'].includes(event.eventType) && payload.placementId) {
        const placement = await transaction.placement.findUnique({ where: { id: String(payload.placementId) }, select: { student: { select: { userId: true } }, company: { select: { contacts: { select: { userId: true } } } } } })
        const message = event.eventType === 'placement.amendment_proposed' ? ['Placement amendment proposed', 'Review a proposed change to placement terms.'] : ['Placement terms updated', 'Both parties accepted a placement amendment.']
        if (placement) {
          notifications.push({ userId: placement.student.userId, type: event.eventType, title: message[0], body: message[1], data: payload, sentVia: ['IN_APP'] })
          for (const contact of placement.company.contacts) notifications.push({ userId: contact.userId, type: event.eventType, title: message[0], body: message[1], data: payload, sentVia: ['IN_APP'] })
        }
      }
      if (student && studentMessages[event.eventType]) {
        const [title, body] = studentMessages[event.eventType]
        notifications.push({ userId: student.userId, type: event.eventType, title, body, data: payload, sentVia: ['IN_APP'] })
      }
      if (companyMessages[event.eventType]) {
        const [title, body] = companyMessages[event.eventType]
        for (const contact of companyUsers) notifications.push({ userId: contact.userId, type: event.eventType, title, body, data: payload, sentVia: ['IN_APP'] })
      }
      if (notifications.length) await transaction.notification.createMany({ data: notifications })
      await transaction.outboxConsumerReceipt.create({ data: { eventId: event.id, consumer: 'evergreen.notifications.v1', result: { notifications: notifications.length } } })
      return notifications.length
    })
  }

  processGrowthConsumer(event: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (await transaction.outboxConsumerReceipt.findUnique({ where: { eventId_consumer: { eventId: event.id, consumer: 'evergreen.growth.v1' } } })) return 'duplicate'
      if (event.eventType !== 'placement.completed') {
        await transaction.outboxConsumerReceipt.create({ data: { eventId: event.id, consumer: 'evergreen.growth.v1', result: { skipped: true } } })
        return 'skipped'
      }
      const payload = event.payload as Record<string, any>
      const placement = await transaction.placement.findUniqueOrThrow({ where: { id: payload.placementId }, include: { company: true, evidence: { where: { status: 'VERIFIED' } } } })
      await transaction.portfolioItem.upsert({ where: { id: `placement-portfolio-${placement.id}` }, update: {}, create: { id: `placement-portfolio-${placement.id}`, studentId: placement.studentId, title: `${placement.role} placement`, description: `Completed ${placement.type.toLowerCase()} with ${placement.company.name}.`, category: 'PLACEMENT', fileUrls: placement.evidence.map((item) => item.artifactReference), companyName: placement.company.name, metricsVerified: true } })
      await transaction.pipelineRelationship.upsert({ where: { studentId_companyId: { studentId: placement.studentId, companyId: placement.companyId } }, update: { status: 'PLACED' }, create: { studentId: placement.studentId, companyId: placement.companyId, status: 'PLACED', targetRole: placement.role } })
      const endorsementId = `placement-endorsement-${placement.id}`
      if (!await transaction.endorsement.findUnique({ where: { id: endorsementId } })) await transaction.endorsement.create({ data: { id: endorsementId, studentId: placement.studentId, companyId: placement.companyId, endorsedByName: placement.company.name, endorsedByTitle: 'Placement supervisor', note: `Verified completion of ${placement.role}` } })
      for (const evidence of placement.evidence.filter((item) => item.competencyId)) {
        const step = await transaction.careerRoadmapStep.findFirst({ where: { competencies: { some: { competencyId: evidence.competencyId! } }, roadmap: { enrollments: { some: { studentId: placement.studentId } } } }, include: { roadmap: { include: { enrollments: { where: { studentId: placement.studentId }, take: 1 } } } } })
        const enrollment = step?.roadmap.enrollments[0]
        if (step && enrollment) await transaction.roadmapEvidence.upsert({ where: { enrollmentId_stepId_sourceType_sourceId: { enrollmentId: enrollment.id, stepId: step.id, sourceType: 'EVERGREEN_PLACEMENT', sourceId: evidence.id } }, update: { verificationStatus: 'VERIFIED', verifiedAt: new Date(), verifiedByUserId: evidence.verifiedById, scoreAwarded: 100 }, create: { enrollmentId: enrollment.id, stepId: step.id, studentId: placement.studentId, competencyId: evidence.competencyId, sourceType: 'EVERGREEN_PLACEMENT', sourceId: evidence.id, note: evidence.title, verificationStatus: 'VERIFIED', verifiedAt: new Date(), verifiedByUserId: evidence.verifiedById, scoreAwarded: 100 } })
      }
      await transaction.outboxConsumerReceipt.create({ data: { eventId: event.id, consumer: 'evergreen.growth.v1', result: { placementId: placement.id, evidence: placement.evidence.length } } })
      return placement.id
    })
  }
}

const evergreenJobsRepository = new EvergreenJobsRepository()

export { EvergreenJobsRepository, evergreenJobsRepository }
