import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import {
  acceptOfferService,
  changeEntitlementStatusService,
  completeOnboardingService,
  completePlacementService,
  confirmInvoiceService,
  createEvaluationService,
  createInvoiceService,
  createPlacementAmendmentService,
  createPlacementSupportRequestService,
  decidePlacementAmendmentService,
  listConsentedCohortCandidatesService,
  refundInvoiceService,
  resolvePlacementService,
  runEvergreenJobService,
  submitCheckInService,
  submitEvidenceService,
  transitionPlacementService,
  verifyPlacementEvidenceService
} from '../../services/evergreen/index.js'
import { evergreenJobsRepository } from './evergreen.jobs.repository.js'
import { readProgramService } from '../../services/evergreen/index.js'

const marker = `evergreen-race-${process.pid}-${Date.now()}`
const companyId = `${marker}-company`
const companyUserId = `${marker}-company-user`
const companyContactId = `${marker}-company-contact`
const campusId = `${marker}-campus`
const courseId = `${marker}-course`
const studentIds = [1, 2, 3, 4, 5].map((index) => `${marker}-student-${index}`)
const studentUserIds = [1, 2, 3, 4, 5].map((index) => `${marker}-student-user-${index}`)
const jobRunIds: string[] = []

async function createProgramAndCohort(suffix: string, seatCount: number) {
  const program = await prisma.evergreenProgram.create({ data: {
    id: `${marker}-program-${suffix}`,
    companyId,
    createdById: companyUserId,
    title: `Race program ${suffix}`,
    description: 'A complete integration-test program for acceptance concurrency.',
    placementType: 'INTERNSHIP',
    workMode: 'REMOTE',
    durationWeeks: 8,
    defaultSeatCount: seatCount,
    supervisionPlan: 'A named supervisor provides weekly structured feedback.',
    learningOutcomes: ['Concurrency is verified'],
    status: 'ACTIVE'
  } })
  const now = Date.now()
  const cohort = await prisma.evergreenCohort.create({ data: {
    id: `${marker}-cohort-${suffix}`,
    programId: program.id,
    sequenceNumber: 1,
    applicationOpensAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    applicationClosesAt: new Date(now - 24 * 60 * 60 * 1000),
    placementStartsAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    placementEndsAt: new Date(now + 70 * 24 * 60 * 60 * 1000),
    seatCount,
    status: 'INTERVIEWING'
  } })
  return { program, cohort }
}

async function createOffer(suffix: string, cohortId: string, studentId: string) {
  const candidate = await prisma.evergreenCandidate.create({ data: {
    id: `${marker}-candidate-${suffix}`,
    cohortId,
    studentId,
    source: 'APPLICATION',
    status: 'OFFERED',
    consentSnapshot: { version: 'test-v1', fields: ['name'] }
  } })
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const endDate = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000)
  return prisma.placementOffer.create({ data: {
    id: `${marker}-offer-${suffix}`,
    candidateId: candidate.id,
    companyId,
    studentId,
    createdById: companyUserId,
    supervisorId: companyContactId,
    role: 'Integration intern',
    duties: 'Exercise the atomic acceptance transaction under concurrency.',
    placementType: 'INTERNSHIP',
    workMode: 'REMOTE',
    currency: 'KES',
    startDate,
    endDate,
    termsSnapshot: { role: 'Integration intern', startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    status: 'SENT',
    sentAt: new Date(),
    respondBy: new Date(Date.now() + 24 * 60 * 60 * 1000)
  } })
}

beforeAll(async () => {
  await prisma.campus.create({ data: { id: campusId, name: 'Race Test Campus', city: 'Nairobi' } })
  await prisma.course.create({ data: { id: courseId, name: 'Race Test Course', category: 'STEM', duration: 4 } })
  await prisma.user.create({ data: { id: companyUserId, email: `${companyUserId}@example.test`, phone: `+25471${String(Date.now()).slice(-7)}`, passwordHash: 'test-only', role: 'COMPANY_PIPELINE_PARTNER', isVerified: true } })
  await prisma.company.create({ data: { id: companyId, name: 'Evergreen Race Test SME', sector: 'Technology', size: 'SMALL', isPipelinePartner: true, kycStatus: 'APPROVED' } })
  await prisma.companyContact.create({ data: { id: companyContactId, userId: companyUserId, companyId, isOwner: true } })
  for (let index = 0; index < studentIds.length; index += 1) {
    await prisma.user.create({ data: { id: studentUserIds[index], email: `${studentUserIds[index]}@example.test`, phone: `+25472${String(Date.now() + index).slice(-7)}`, passwordHash: 'test-only', role: 'STUDENT_TRANSITION', isVerified: true } })
    await prisma.studentProfile.create({ data: { id: studentIds[index], userId: studentUserIds[index], firstName: 'Race', lastName: `Student ${index + 1}`, dateOfBirth: new Date('2000-01-01'), campusId, courseId, yearJoined: 2024, courseDuration: 4, expectedGraduation: new Date('2028-12-01'), kycStatus: 'APPROVED', transitionUnlockedAt: new Date() } })
  }
})

afterAll(async () => {
  const placements = await prisma.placement.findMany({ where: { companyId }, select: { id: true } })
  const placementIds = placements.map((placement) => placement.id)
  const programs = await prisma.evergreenProgram.findMany({ where: { id: { startsWith: marker } }, select: { id: true } })
  const cohorts = await prisma.evergreenCohort.findMany({ where: { programId: { in: programs.map((item) => item.id) } }, select: { id: true } })
  const aggregateIds = [...placementIds, ...cohorts.map((item) => item.id)]
  await prisma.outboxConsumerReceipt.deleteMany({ where: { event: { OR: [{ aggregateId: { in: aggregateIds } }, { aggregateId: { startsWith: marker } }] } } })
  await prisma.outboxEvent.deleteMany({ where: { OR: [{ aggregateId: { in: aggregateIds } }, { aggregateId: { startsWith: marker } }] } })
  await prisma.notification.deleteMany({ where: { userId: { in: studentUserIds } } })
  await prisma.auditLog.deleteMany({ where: { userId: { in: [...studentUserIds, companyUserId] } } })
  await prisma.evergreenIdempotencyKey.deleteMany({ where: { actorId: { in: studentUserIds } } })
  await prisma.placementSupportRequest.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementAmendment.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementOnboardingItem.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementEvaluation.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementEvidence.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementCheckIn.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementGoal.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placementStatusEvent.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.activePlacementLock.deleteMany({ where: { placementId: { in: placementIds } } })
  await prisma.placement.deleteMany({ where: { id: { in: placementIds } } })
  await prisma.placementOffer.deleteMany({ where: { id: { startsWith: marker } } })
  await prisma.evergreenCandidate.deleteMany({ where: { id: { startsWith: marker } } })
  await prisma.evergreenCohort.deleteMany({ where: { id: { in: cohorts.map((item) => item.id) } } })
  await prisma.evergreenProgram.deleteMany({ where: { id: { startsWith: marker } } })
  await prisma.evergreenEntitlement.deleteMany({ where: { companyId } })
  await prisma.evergreenInvoice.deleteMany({ where: { companyId } })
  await prisma.evergreenJobRun.deleteMany({ where: { id: { in: jobRunIds } } })
  await prisma.companyContact.deleteMany({ where: { id: companyContactId } })
  await prisma.studentProfile.deleteMany({ where: { id: { in: studentIds } } })
  await prisma.company.deleteMany({ where: { id: companyId } })
  await prisma.user.deleteMany({ where: { id: { in: [...studentUserIds, companyUserId] } } })
  await prisma.campus.deleteMany({ where: { id: campusId } })
  await prisma.course.deleteMany({ where: { id: courseId } })
  await prisma.$disconnect()
})

describe('atomic Evergreen offer acceptance', () => {
  it('is idempotent for simultaneous retries of the same offer', async () => {
    const { cohort } = await createProgramAndCohort('same-offer', 2)
    const offer = await createOffer('same-offer', cohort.id, studentIds[0])
    const key = `${marker}-same-offer-key`
    const results = await Promise.all([
      acceptOfferService(offer.id, studentIds[0], studentUserIds[0], key),
      acceptOfferService(offer.id, studentIds[0], studentUserIds[0], key)
    ])
    expect(results[0].data.id).toBe(results[1].data.id)
    expect(await prisma.activePlacementLock.count({ where: { studentId: studentIds[0] } })).toBe(1)
    expect(await prisma.placement.count({ where: { studentId: studentIds[0] } })).toBe(1)
  })

  it('allows only one of two different offers for the same student', async () => {
    const first = await createProgramAndCohort('student-lock-a', 2)
    const second = await createProgramAndCohort('student-lock-b', 2)
    const firstOffer = await createOffer('student-lock-a', first.cohort.id, studentIds[1])
    const secondOffer = await createOffer('student-lock-b', second.cohort.id, studentIds[1])
    const results = await Promise.allSettled([
      acceptOfferService(firstOffer.id, studentIds[1], studentUserIds[1], `${marker}-student-lock-a`),
      acceptOfferService(secondOffer.id, studentIds[1], studentUserIds[1], `${marker}-student-lock-b`)
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(await prisma.activePlacementLock.count({ where: { studentId: studentIds[1] } })).toBe(1)
  })

  it('does not overfill the final seat when two students accept concurrently', async () => {
    const { cohort } = await createProgramAndCohort('final-seat', 1)
    const firstOffer = await createOffer('final-seat-a', cohort.id, studentIds[2])
    const secondOffer = await createOffer('final-seat-b', cohort.id, studentIds[3])
    const results = await Promise.allSettled([
      acceptOfferService(firstOffer.id, studentIds[2], studentUserIds[2], `${marker}-final-seat-a`),
      acceptOfferService(secondOffer.id, studentIds[3], studentUserIds[3], `${marker}-final-seat-b`)
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const updated = await prisma.evergreenCohort.findUniqueOrThrow({ where: { id: cohort.id } })
    expect(updated.filledSeats).toBe(1)
    expect(updated.reservedSeats).toBe(1)
    expect(await prisma.placement.count({ where: { cohortId: cohort.id } })).toBe(1)
  })

  it('rolls back the seat, placement and lock when the transactional outbox write fails', async () => {
    const { cohort } = await createProgramAndCohort('rollback', 1)
    const offer = await createOffer('rollback', cohort.id, studentIds[4])
    await prisma.outboxEvent.create({ data: { id: `${marker}-blocking-event`, aggregateType: 'Test', aggregateId: `${marker}-blocking`, eventType: 'test.block', payload: {}, idempotencyKey: `offer.accepted:${offer.id}` } })
    await expect(acceptOfferService(offer.id, studentIds[4], studentUserIds[4], `${marker}-rollback-key`)).rejects.toMatchObject({ statusCode: 409 })
    expect(await prisma.placement.count({ where: { cohortId: cohort.id } })).toBe(0)
    expect(await prisma.activePlacementLock.count({ where: { studentId: studentIds[4] } })).toBe(0)
    expect(await prisma.evergreenCohort.findUnique({ where: { id: cohort.id } })).toMatchObject({ filledSeats: 0, reservedSeats: 0 })
    expect(await prisma.placementOffer.findUnique({ where: { id: offer.id } })).toMatchObject({ status: 'SENT' })
  })

  it('delivers an outbox notification consumer exactly once across replay', async () => {
    const event = await prisma.outboxEvent.create({ data: { id: `${marker}-notification-event`, aggregateType: 'PlacementOffer', aggregateId: `${marker}-notification`, eventType: 'evergreen.offer_sent', payload: { studentId: studentIds[4] }, idempotencyKey: `${marker}-notification-key` } })
    expect(await evergreenJobsRepository.processNotificationConsumer(event)).toBe(1)
    expect(await evergreenJobsRepository.processNotificationConsumer(event)).toBe('duplicate')
    expect(await prisma.notification.count({ where: { userId: studentUserIds[4], type: 'evergreen.offer_sent' } })).toBe(1)
  })

  it('returns not found instead of exposing a program across companies', async () => {
    const { program, cohort } = await createProgramAndCohort('isolation', 1)
    await createOffer('isolation', cohort.id, studentIds[0])
    const consented = await listConsentedCohortCandidatesService(cohort.id, companyId, {})
    expect(consented.data[0]).toMatchObject({ name: 'Race Student 1' })
    expect(consented.data[0]).not.toHaveProperty('email')
    expect(consented.data[0]).not.toHaveProperty('student')
    await expect(readProgramService(program.id, `${marker}-other-company`)).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    await expect(listConsentedCohortCandidatesService(cohort.id, `${marker}-other-company`, {})).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
  })

  it('applies a mutually accepted amendment, protects support details, and releases the lock only through cancellation', async () => {
    await prisma.outboxEvent.deleteMany({ where: { id: `${marker}-blocking-event` } })
    const { cohort } = await createProgramAndCohort('lifecycle', 1)
    const offer = await createOffer('lifecycle', cohort.id, studentIds[4])
    const accepted = await acceptOfferService(offer.id, studentIds[4], studentUserIds[4], `${marker}-lifecycle-key`)
    const placementId = accepted.data.id
    const studentUser = { id: studentUserIds[4], email: `${studentUserIds[4]}@example.test`, role: 'STUDENT_TRANSITION' as const, studentId: studentIds[4] }
    const companyUser = { id: companyUserId, email: `${companyUserId}@example.test`, role: 'COMPANY_PIPELINE_PARTNER' as const, businessId: companyId }

    const proposed = await createPlacementAmendmentService(placementId, studentUser, { reason: 'Use the agreed hybrid workspace for weekly supervision.', changes: { location: 'Nairobi innovation hub' } })
    const decided = await decidePlacementAmendmentService(placementId, proposed.data.id, companyUser, 'ACCEPT')
    expect(decided.data.placement).toMatchObject({ location: 'Nairobi innovation hub' })
    expect(decided.data.amendment).toMatchObject({ status: 'APPLIED' })

    const support = await createPlacementSupportRequestService(placementId, studentIds[4], studentUserIds[4], { category: 'SUPERVISION', summary: 'I need a private operations conversation about supervision.', privateDetails: 'Do not disclose this private context to the company.' })
    expect(support.data.privateDetails).toBeUndefined()
    expect((await prisma.placementSupportRequest.findUniqueOrThrow({ where: { id: support.data.id } })).privateDetails).toContain('Do not disclose')

    await resolvePlacementService(placementId, companyUser, 'CANCEL_BEFORE_START', 'The placement start was cancelled by mutual written agreement.')
    expect(await prisma.activePlacementLock.count({ where: { placementId } })).toBe(0)
    expect(await prisma.placement.findUnique({ where: { id: placementId } })).toMatchObject({ status: 'CANCELLED_BEFORE_START', isLocked: false })
  })

  it('blocks recruiting on suspension/refund while retaining invoice and entitlement history', async () => {
    const invoice = await createInvoiceService(companyUserId, { companyId, invoiceNumber: `${marker}-invoice`, amount: 12000, currency: 'KES', idempotencyKey: `${marker}-invoice-key` })
    const entitlement = await confirmInvoiceService(invoice.data.id, companyUserId, { externalReference: `${marker}-settlement`, planCode: 'PILOT', programLimit: 3, seatLimit: 10, validFrom: new Date(Date.now() - 1000), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    await changeEntitlementStatusService(entitlement.data.id, companyUserId, 'SUSPEND', 'Finance review temporarily blocks new recruiting actions.')
    expect((await prisma.evergreenEntitlement.findUniqueOrThrow({ where: { id: entitlement.data.id } })).status).toBe('SUSPENDED')
    await changeEntitlementStatusService(entitlement.data.id, companyUserId, 'REACTIVATE', 'Finance review completed with settlement intact.')
    await refundInvoiceService(invoice.data.id, companyUserId, 'Customer refund approved and recruiting access revoked.')
    expect(await prisma.evergreenInvoice.findUnique({ where: { id: invoice.data.id } })).toMatchObject({ status: 'REFUNDED' })
    expect(await prisma.evergreenEntitlement.findUnique({ where: { id: entitlement.data.id } })).toMatchObject({ status: 'REFUNDED' })
  })

  it('runs acceptance through supervised completion, idempotent growth, lock release, and the next recurring cohort', async () => {
    const { program, cohort } = await createProgramAndCohort('complete-loop', 1)
    await prisma.evergreenProgram.update({ where: { id: program.id }, data: { recurrenceType: 'MONTHLY', timezone: 'Africa/Nairobi' } })
    await prisma.evergreenEntitlement.create({ data: { id: `${marker}-loop-entitlement`, companyId, planCode: 'LOOP', status: 'ACTIVE', programLimit: 3, seatLimit: 10, validFrom: new Date(Date.now() - 1000), validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), sourceType: 'TEST_VERIFIED', sourceReference: `${marker}-loop-settlement`, confirmedById: companyUserId, confirmedAt: new Date() } })
    const offer = await createOffer('complete-loop', cohort.id, studentIds[4])
    const accepted = await acceptOfferService(offer.id, studentIds[4], studentUserIds[4], `${marker}-complete-loop-key`)
    const placementId = accepted.data.id
    const studentUser = { id: studentUserIds[4], email: `${studentUserIds[4]}@example.test`, role: 'STUDENT_TRANSITION' as const, studentId: studentIds[4] }
    const companyUser = { id: companyUserId, email: `${companyUserId}@example.test`, role: 'COMPANY_PIPELINE_PARTNER' as const, businessId: companyId }
    const onboarding = await prisma.placementOnboardingItem.findMany({ where: { placementId } })
    for (const item of onboarding) await completeOnboardingService(placementId, item.id, item.ownerType === 'STUDENT' ? studentUser : companyUser)
    expect(await prisma.placement.findUnique({ where: { id: placementId } })).toMatchObject({ status: 'READY' })

    await transitionPlacementService(placementId, companyUser, 'ACTIVE')
    expect(await prisma.placementCheckIn.count({ where: { placementId, status: 'DUE' } })).toBeGreaterThan(0)
    const now = new Date()
    await submitCheckInService(placementId, studentIds[4], studentUserIds[4], { periodStartsAt: new Date(now.getTime() - 7 * 86400000), periodEndsAt: now, dueAt: now, studentReflection: 'I completed the first supervised outcomes and documented the work.' })
    const evidence = await submitEvidenceService(placementId, studentIds[4], studentUserIds[4], { evidenceType: 'URL', title: 'Verified placement outcome', artifactReference: 'https://example.test/evidence', description: 'A reviewable work artifact.' })
    await verifyPlacementEvidenceService(placementId, evidence.data.id, companyId, companyUserId, companyUser.role)
    await createEvaluationService(placementId, companyId, companyUserId, companyUser.role, { rubricScores: { overall: 5 }, narrative: 'The student completed the supervised outcomes with strong evidence.', recommendation: 'Eligible for future mentorship.', visibility: 'SHARED' })
    await transitionPlacementService(placementId, studentUser, 'COMPLETION_REVIEW', 'Student submitted final completion materials.')
    await completePlacementService(placementId, companyUser, 'Supervisor approved the verified completion.')
    expect(await prisma.activePlacementLock.count({ where: { placementId } })).toBe(0)

    const completionEvent = await prisma.outboxEvent.findFirstOrThrow({ where: { aggregateId: placementId, eventType: 'placement.completed' } })
    expect(await evergreenJobsRepository.processGrowthConsumer(completionEvent)).toBe(placementId)
    expect(await evergreenJobsRepository.processGrowthConsumer(completionEvent)).toBe('duplicate')
    expect(await prisma.portfolioItem.count({ where: { id: `placement-portfolio-${placementId}` } })).toBe(1)
    expect(await prisma.pipelineRelationship.findUnique({ where: { studentId_companyId: { studentId: studentIds[4], companyId } } })).toMatchObject({ status: 'PLACED' })

    const job = await runEvergreenJobService('next-cohort-planner', companyUserId)
    jobRunIds.push(job.runId)
    expect(job.result).toMatchObject({ created: 1 })
    expect(await prisma.evergreenCohort.count({ where: { programId: program.id } })).toBe(2)
  })
})
