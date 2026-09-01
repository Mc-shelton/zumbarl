import { randomUUID } from 'node:crypto'
import { evergreenJobsRepository } from '../../repositories/evergreen/index.js'
import { calculateNextCohortDates, evaluateStudentEligibility, rankEligibleStudent } from '../../../domain/evergreen/index.js'
import { ApiError } from '../../../lib/http.js'

const jobNames = [
  'cohort-scheduler',
  'matching-dispatch',
  'offer-expiry',
  'availability-expiry',
  'placement-reminders',
  'placement-reconciliation',
  'entitlement-reconciliation',
  'next-cohort-planner',
  'outbox-delivery'
] as const

type EvergreenJobName = (typeof jobNames)[number]

function dateCompatible(availability: Record<string, any>, placementStartsAt: Date) {
  return (!availability.earliestStartDate || availability.earliestStartDate <= placementStartsAt) && (!availability.latestStartDate || availability.latestStartDate >= placementStartsAt)
}

async function runMatchingJob() {
  const [cohorts, availabilities] = await Promise.all([evergreenJobsRepository.listMatchableCohorts(), evergreenJobsRepository.listAvailableStudents()])
  const transitionOverrides = new Set((await evergreenJobsRepository.listActiveStudentTransitionOverrides(availabilities.map((item) => item.studentId))).map((item) => item.subjectId))
  let matches = 0
  for (const cohort of cohorts) {
    const ranked = []
    for (const availability of availabilities) {
      const student = availability.student
      const requiredCompetencies = cohort.program.competencies.filter((item) => item.required)
      const verifiedCompetencies = requiredCompetencies.filter((requirement) => student.competencyStates.some((state) => state.competencyId === requirement.competencyId && state.status === 'VERIFIED' && state.evidenceScore >= requirement.minimumScore))
      const requiredSkills = cohort.program.skills.filter((item) => item.required)
      const verifiedSkills = requiredSkills.filter((requirement) => student.studentSkills.some((skill) => skill.skillId === requirement.skillId && skill.verifiedByGigs > 0))
      const activeOverride = transitionOverrides.has(student.id)
      const transitionAccess = ['STUDENT_TRANSITION', 'STUDENT_ALUMNI'].includes(student.user.role) || Boolean(student.transitionUnlockedAt) || activeOverride
      const eligibility = evaluateStudentEligibility({
        identityApproved: student.kycStatus === 'APPROVED',
        transitionAccess,
        activeOverride,
        readinessVerified: student.roadmapEnrollments.length > 0,
        seeking: availability.isSeeking,
        availabilityUnexpired: availability.expiresAt > new Date(),
        consented: Boolean(availability.consentedAt && availability.companyVisibleFields.length),
        placementTypeMatch: availability.placementTypes.includes(cohort.program.placementType),
        dateMatch: dateCompatible(availability, cohort.placementStartsAt),
        workModeMatch: availability.workModes.includes(cohort.program.workMode),
        locationMatch: cohort.program.workMode === 'REMOTE' || availability.locations.length === 0 || availability.locations.some((location) => cohort.program.location?.toLowerCase().includes(location.toLowerCase())),
        mandatoryCompetenciesMet: verifiedCompetencies.length === requiredCompetencies.length,
        activePlacementLock: Boolean(student.activePlacementLock),
        legallyBlockingConflict: false,
        cohortOpen: ['OPEN', 'MATCHING'].includes(cohort.status)
      })
      if (!eligibility.eligible) continue
      const ranking = rankEligibleStudent({
        requiredCompetencies: requiredCompetencies.length,
        verifiedCompetencies: verifiedCompetencies.length,
        requiredSkills: requiredSkills.length,
        verifiedSkills: verifiedSkills.length,
        relevantEvidenceCount: student.roadmapEnrollments.reduce((count, enrollment) => count + enrollment.evidence.length, 0) + student.portfolioItems.length,
        roadmapVerified: student.roadmapEnrollments.length > 0,
        evidenceFresh: student.roadmapEnrollments.some((enrollment) => enrollment.verifiedAt && enrollment.verifiedAt > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)),
        roleInterestMatch: availability.roleInterests.some((role) => cohort.program.title.toLowerCase().includes(role.toLowerCase())),
        scheduleFit: true,
        positiveRelationship: student.pipelineRelationships.some((relationship) => relationship.companyId === cohort.program.companyId && ['WARMING_UP', 'ACTIVE', 'PLACEMENT_READY', 'PLACED'].includes(relationship.status)),
        verifiedEndorsements: student.endorsementsReceived.length
      })
      ranked.push({
        studentId: student.id,
        score: ranking.score,
        reasons: ranking.reasons,
        eligibilitySnapshot: eligibility,
        consentSnapshot: { version: availability.consentVersion, fields: availability.companyVisibleFields, consentedAt: availability.consentedAt.toISOString() }
      })
    }
    await evergreenJobsRepository.persistMatchRun(cohort.id, { algorithmVersion: 'evergreen-match-v1', cohortVersion: cohort.version, evaluatedStudents: availabilities.length, excludedSensitiveDomains: ['wellbeing', 'safety-circle', 'health', 'financial-distress'] }, ranked)
    matches += ranked.length
  }
  return { cohorts: cohorts.length, matches }
}

async function runOutboxJob(workerId: string) {
  const events = await evergreenJobsRepository.listPendingOutbox()
  let delivered = 0
  let failed = 0
  for (const event of events) {
    if (!await evergreenJobsRepository.claimOutbox(event.id, workerId)) continue
    try {
      await evergreenJobsRepository.processNotificationConsumer(event)
      await evergreenJobsRepository.processGrowthConsumer(event)
      await evergreenJobsRepository.deliverOutbox(event.id)
      delivered += 1
    } catch (error) {
      await evergreenJobsRepository.failOutbox(event.id, error, event.attemptCount + 1)
      failed += 1
    }
  }
  return { selected: events.length, delivered, failed }
}

async function runNextCohortPlanner() {
  const programs = await evergreenJobsRepository.listCompletedRecurringPrograms()
  let created = 0
  for (const program of programs) {
    const latest = program.cohorts[0]
    if (!latest || latest.status !== 'COMPLETED') continue
    const rule = (program.recurrenceRule as { interval?: number } | null) ?? {}
    const dates = calculateNextCohortDates({ recurrenceType: program.recurrenceType, timezone: program.timezone, interval: rule.interval ?? 1, applicationOpensAt: latest.applicationOpensAt, applicationClosesAt: latest.applicationClosesAt, placementStartsAt: latest.placementStartsAt, placementEndsAt: latest.placementEndsAt })
    if (!dates) continue
    await evergreenJobsRepository.createRecurringCohort(program.id, latest.sequenceNumber + 1, { ...dates, seatCount: program.defaultSeatCount, recurrenceSource: `cohort:${latest.id}` })
    created += 1
  }
  return { programs: programs.length, created }
}

async function executeJob(name: EvergreenJobName, workerId: string) {
  if (name === 'matching-dispatch') return runMatchingJob()
  if (name === 'offer-expiry') return { expired: await evergreenJobsRepository.expireOffers() }
  if (name === 'availability-expiry') return { expired: await evergreenJobsRepository.expireAvailability() }
  if (name === 'placement-reminders') {
    const [overdue, reminders] = await Promise.all([evergreenJobsRepository.markOverdueCheckIns(), evergreenJobsRepository.enqueueDueReminders()])
    return { overdue, ...reminders }
  }
  if (name === 'placement-reconciliation') return evergreenJobsRepository.reconcilePlacements()
  if (name === 'entitlement-reconciliation') return { expired: (await evergreenJobsRepository.expireEntitlements()).count }
  if (name === 'next-cohort-planner') return runNextCohortPlanner()
  if (name === 'outbox-delivery') return runOutboxJob(workerId)
  if (name === 'cohort-scheduler') return evergreenJobsRepository.openAndCloseScheduledCohorts()
  return { skipped: true }
}

async function runEvergreenJobService(name: EvergreenJobName, requestedById?: string, replayOfId?: string) {
  const workerId = `${process.pid}-${randomUUID()}`
  if (!await evergreenJobsRepository.acquireLease(name, workerId)) throw new ApiError(409, `${name} is already running`, 'EVERGREEN_JOB_ALREADY_RUNNING')
  const run = await evergreenJobsRepository.startJob(name, requestedById, replayOfId)
  try {
    const result = await executeJob(name, workerId)
    await evergreenJobsRepository.finishJob(run.id, result)
    return { runId: run.id, jobName: name, result }
  } catch (error) {
    await evergreenJobsRepository.failJob(run.id, error)
    throw error
  } finally {
    await evergreenJobsRepository.releaseLease(name, workerId)
  }
}

async function runEvergreenMaintenanceService() {
  const results = []
  for (const job of ['cohort-scheduler', 'offer-expiry', 'availability-expiry', 'placement-reminders', 'placement-reconciliation', 'entitlement-reconciliation', 'next-cohort-planner', 'matching-dispatch', 'outbox-delivery'] as EvergreenJobName[]) {
    try { results.push(await runEvergreenJobService(job)) } catch (error) { results.push({ jobName: job, error: error instanceof Error ? error.message : String(error) }) }
  }
  return results
}

async function listEvergreenFailuresService() {
  return { data: await evergreenJobsRepository.listFailures() }
}

async function replayEvergreenEventService(id: string, actorId: string) {
  const event = await evergreenJobsRepository.replayOutboxEvent(id, actorId)
  if (!event) throw new ApiError(409, 'Only failed or dead-letter Evergreen events can be replayed', 'EVERGREEN_EVENT_NOT_REPLAYABLE')
  return { data: event }
}

export { jobNames, runEvergreenJobService, runEvergreenMaintenanceService, listEvergreenFailuresService, replayEvergreenEventService, type EvergreenJobName }
