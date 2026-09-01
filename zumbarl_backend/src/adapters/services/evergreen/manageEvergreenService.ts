import { createHash } from 'node:crypto'
import { Prisma, type EvergreenCandidateStatus, type EvergreenProgramStatus, type PlacementStatus } from '@prisma/client'
import { evergreenRepository } from '../../repositories/evergreen/index.js'
import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { assertTransition, candidateTransitions, cohortTransitions, evaluateCompanyQualification, offerTransitions, placementTransitions, programTransitions } from '../../../domain/evergreen/index.js'
import type { AuthUser } from '../../../lib/security.js'

const qualificationGigThreshold = Math.max(1, Number(process.env.EVERGREEN_QUALIFICATION_GIGS ?? 3))
const repeatHireLimit = Math.max(1, Number(process.env.EVERGREEN_REPEAT_HIRE_LIMIT ?? 3))

function conflict(code: string, message: string, details?: unknown): never {
  throw new ApiError(409, message, code, details)
}

function hashPayload(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

async function assertEvergreenEnabledService() {
  const flag = await evergreenRepository.findFeatureFlag('evergreen.enabled')
  if (flag && !flag.enabled) throw new ApiError(503, 'Zumbarl Evergreen is temporarily unavailable', 'EVERGREEN_FEATURE_DISABLED')
}

function cursorEnvelope<T extends { id: string }>(records: T[], limit: number) {
  const hasMore = records.length > limit
  const data = hasMore ? records.slice(0, limit) : records
  return { data, meta: { nextCursor: hasMore ? data.at(-1)?.id ?? null : null, hasMore } }
}

async function readCompanyEligibilityService(companyId: string) {
  const [company, override] = await Promise.all([
    evergreenRepository.findCompanyContext(companyId),
    evergreenRepository.findActiveOverride('COMPANY', companyId, 'COMPANY_QUALIFICATION')
  ])
  if (!company) notFound('Company')
  const qualification = evaluateCompanyQualification({
    kycApproved: company.kycStatus === 'APPROVED',
    verifiedCompletedGigs: company.engagementOutcomes.length,
    pipelineOptIn: company.isPipelinePartner,
    pipelinePartner: company.isPipelinePartner,
    activeOverride: Boolean(override),
    threshold: qualificationGigThreshold
  })
  const entitlement = company.evergreenEntitlements[0] ?? null
  return {
    qualification,
    entitlement,
    canCreateProgram: qualification.qualified && Boolean(entitlement),
    limits: entitlement ? { programLimit: entitlement.programLimit, seatLimit: entitlement.seatLimit, activePrograms: company._count.evergreenPrograms } : null,
    supervisors: company.contacts.map((contact) => ({ id: contact.id, name: contact.user.name, email: contact.user.email, jobTitle: contact.jobTitle }))
  }
}

async function requireQualifiedEntitledCompany(companyId: string) {
  const eligibility = await readCompanyEligibilityService(companyId)
  if (!eligibility.qualification.qualified) forbidden('Company is not qualified for Evergreen recruiting')
  if (!eligibility.entitlement) forbidden('An active, finance-confirmed Evergreen entitlement is required')
  if (eligibility.limits && eligibility.limits.activePrograms >= eligibility.limits.programLimit) conflict('EVERGREEN_PROGRAM_LIMIT_REACHED', 'The entitlement program limit has been reached')
  return eligibility
}

async function listProgramsService(companyId: string | undefined, query: Record<string, unknown>) {
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)))
  const status = query.status ? String(query.status) as EvergreenProgramStatus : undefined
  return cursorEnvelope(await evergreenRepository.listPrograms(companyId, status, query.cursor ? String(query.cursor) : undefined, limit), limit)
}

async function readProgramService(id: string, companyId?: string) {
  const program = await evergreenRepository.findProgram(id)
  if (!program || (companyId && program.companyId !== companyId)) notFound('Evergreen program')
  return { data: program, allowedActions: {
    edit: ['DRAFT', 'CHANGES_REQUESTED'].includes(program.status),
    submit: ['DRAFT', 'CHANGES_REQUESTED'].includes(program.status),
    createCohort: program.status === 'ACTIVE',
    pause: program.status === 'ACTIVE'
  } }
}

async function createProgramService(companyId: string, actorId: string, payload: Record<string, any>) {
  await requireQualifiedEntitledCompany(companyId)
  if (await evergreenRepository.countCompanyContacts(companyId, payload.supervisorIds) !== new Set(payload.supervisorIds).size) forbidden('Every supervisor must belong to your company')
  return { data: await evergreenRepository.createProgram(companyId, actorId, payload) }
}

async function updateProgramService(id: string, companyId: string, actorId: string, payload: Record<string, any>) {
  const program = await evergreenRepository.findProgram(id)
  if (!program || program.companyId !== companyId) notFound('Evergreen program')
  if (!['DRAFT', 'CHANGES_REQUESTED'].includes(program.status)) conflict('EVERGREEN_PROGRAM_IMMUTABLE', 'Only draft or change-requested programs can be edited')
  const patch = { ...payload }
  const version = patch.version
  delete patch.version
  delete patch.skills
  delete patch.competencies
  delete patch.supervisorIds
  const result = await evergreenRepository.updateProgram(id, companyId, actorId, version, patch)
  if (result === 'VERSION_CONFLICT') conflict('EVERGREEN_VERSION_CONFLICT', 'The program changed; reload before saving')
  if (!result) notFound('Evergreen program')
  return { data: result }
}

async function transitionProgramService(id: string, companyId: string | undefined, actorId: string, to: EvergreenProgramStatus, reason?: string) {
  const program = await evergreenRepository.findProgram(id)
  if (!program || (companyId && program.companyId !== companyId)) notFound('Evergreen program')
  assertTransition(programTransitions, program.status, to, 'program')
  if (to === 'PENDING_REVIEW' && program.supervisors.length === 0) conflict('EVERGREEN_SUPERVISOR_REQUIRED', 'Assign a company supervisor before review')
  const result = await evergreenRepository.transitionProgram(id, companyId, actorId, program.status, to, { ...(to === 'ACTIVE' ? { approvedAt: new Date(), approvedById: actorId } : {}), ...(to === 'CHANGES_REQUESTED' ? { riskLevel: `CHANGES: ${reason}` } : {}) })
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Program state changed concurrently')
  return { data: result }
}

async function createCohortService(programId: string, companyId: string, actorId: string, idempotencyKey: string, payload: Record<string, any>) {
  const program = await evergreenRepository.findProgram(programId)
  if (!program || program.companyId !== companyId) notFound('Evergreen program')
  if (program.status !== 'ACTIVE') conflict('EVERGREEN_PROGRAM_NOT_ACTIVE', 'Only an active program can create a cohort')
  const eligibility = await requireQualifiedEntitledCompany(companyId)
  if (payload.seatCount > eligibility.entitlement!.seatLimit) conflict('EVERGREEN_SEAT_LIMIT_REACHED', 'Cohort seats exceed the entitlement limit')
  const data = { ...payload, status: payload.applicationOpensAt <= new Date() ? 'OPEN' : 'SCHEDULED' }
  return { data: await evergreenRepository.createCohort(programId, actorId, { data, requestHash: hashPayload(payload) }, idempotencyKey) }
}

async function transitionCohortService(id: string, companyId: string | undefined, actorId: string, to: any) {
  const cohort = await evergreenRepository.findCohort(id)
  if (!cohort || (companyId && cohort.program.companyId !== companyId)) notFound('Evergreen cohort')
  assertTransition(cohortTransitions, cohort.status, to, 'cohort')
  const result = await evergreenRepository.transitionCohort(id, cohort.status, to, actorId, to === 'OPEN' ? { openedAt: new Date() } : {})
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Cohort state changed concurrently')
  return { data: result }
}

async function readCohortService(id: string, companyId: string) {
  const cohort = await evergreenRepository.findCohort(id)
  if (!cohort || cohort.program.companyId !== companyId) notFound('Evergreen cohort')
  return { data: cohort, allowedActions: { open: cohort.status === 'SCHEDULED', viewCandidates: ['OPEN', 'MATCHING', 'INTERVIEWING', 'PARTIALLY_FILLED', 'FILLED'].includes(cohort.status), live: cohort.status === 'IN_PROGRESS' } }
}

async function readStudentReadinessService(studentId: string) {
  const [student, override] = await Promise.all([
    evergreenRepository.findStudentReadiness(studentId),
    evergreenRepository.findActiveOverride('STUDENT', studentId, 'STUDENT_TRANSITION_ACCESS')
  ])
  if (!student) notFound('Student')
  const transitionAccess = ['STUDENT_TRANSITION', 'STUDENT_ALUMNI'].includes(student.user.role) || Boolean(student.transitionUnlockedAt) || Boolean(override)
  const readinessVerified = student.roadmapEnrollments.length > 0
  const gaps = [
    student.kycStatus === 'APPROVED' ? null : 'Complete identity verification',
    transitionAccess ? null : 'Complete the transition-readiness requirements',
    readinessVerified ? null : 'Verify at least one career roadmap',
    student.activePlacementLock ? 'Complete or formally close your active placement' : null
  ].filter(Boolean)
  return {
    ready: gaps.length === 0,
    identityApproved: student.kycStatus === 'APPROVED',
    transitionAccess,
    readinessVerified,
    verifiedRoadmaps: student.roadmapEnrollments.map((item) => ({ id: item.roadmapId, title: item.roadmap.title, verifiedAt: item.verifiedAt })),
    verifiedCompetencies: student.competencyStates.map((item) => ({ id: item.competencyId, name: item.competency.name, score: item.evidenceScore })),
    activePlacement: Boolean(student.activePlacementLock),
    availability: student.placementAvailability,
    gaps
  }
}

async function setAvailabilityService(studentId: string, payload: Record<string, any>) {
  const readiness = await readStudentReadinessService(studentId)
  if (!readiness.ready && payload.isSeeking) conflict('EVERGREEN_STUDENT_NOT_READY', 'Resolve readiness gaps before enabling placement discovery', { gaps: readiness.gaps })
  return { data: await evergreenRepository.upsertAvailability(studentId, { ...payload, consentedAt: new Date(), visibleFrom: payload.isSeeking ? new Date() : null, pausedAt: payload.isSeeking ? null : new Date() }) }
}

async function pauseAvailabilityService(studentId: string) {
  const readiness = await evergreenRepository.findStudentReadiness(studentId)
  if (!readiness?.placementAvailability) notFound('Placement availability')
  return { data: await evergreenRepository.upsertAvailability(studentId, { isSeeking: false, visibleFrom: null, pausedAt: new Date() }) }
}

function sanitizeStudentCandidate(candidate: Record<string, any>) {
  const consent = candidate.consentSnapshot as { fields?: string[] } | null
  const fields = new Set(consent?.fields ?? [])
  const student = candidate.student
  const output: Record<string, unknown> = { id: candidate.id, status: candidate.status, matchScore: candidate.matchScore, matchReasons: candidate.matchReasons, createdAt: candidate.createdAt }
  if (fields.has('name')) output.name = [student.firstName, student.lastName].filter(Boolean).join(' ')
  if (fields.has('avatarUrl')) output.avatarUrl = student.avatarUrl
  if (fields.has('campus')) output.campus = student.campus?.name
  if (fields.has('course')) output.course = student.course?.name
  if (fields.has('careerPath')) output.careerPath = student.careerPath
  if (fields.has('skills')) output.skills = student.studentSkills?.map((item: any) => ({ id: item.skillId, name: item.skill.name, level: item.level }))
  if (fields.has('competencies')) output.competencies = student.competencyStates?.filter((item: any) => item.status === 'VERIFIED').map((item: any) => ({ id: item.competencyId, name: item.competency.name, score: item.evidenceScore }))
  if (fields.has('portfolio')) output.portfolio = student.portfolioItems?.filter((item: any) => item.isPublic).map((item: any) => ({ id: item.id, title: item.title, description: item.description, category: item.category, fileUrls: item.fileUrls }))
  return output
}

async function listCohortCandidatesService(cohortId: string, companyId: string, query: Record<string, unknown>) {
  const cohort = await evergreenRepository.findCohort(cohortId)
  if (!cohort || cohort.program.companyId !== companyId) notFound('Evergreen cohort')
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)))
  const candidates = await evergreenRepository.listCohortCandidates(cohortId, query.cursor ? String(query.cursor) : undefined, limit)
  return cursorEnvelope(candidates, limit) as any as { data: Record<string, unknown>[], meta: Record<string, unknown> }
}

async function listConsentedCohortCandidatesService(cohortId: string, companyId: string, query: Record<string, unknown>) {
  const result = await listCohortCandidatesService(cohortId, companyId, query)
  return { ...result, data: result.data.map(sanitizeStudentCandidate) }
}

async function listStudentMatchesService(studentId: string, query: Record<string, unknown>) {
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)))
  return cursorEnvelope(await evergreenRepository.listStudentMatches(studentId, query.cursor ? String(query.cursor) : undefined, limit), limit)
}

async function applyToCohortService(cohortId: string, studentId: string, actorId: string) {
  const [cohort, readiness] = await Promise.all([evergreenRepository.findCohort(cohortId), evergreenRepository.findStudentReadiness(studentId)])
  if (!cohort || !['OPEN', 'MATCHING', 'INTERVIEWING'].includes(cohort.status)) conflict('EVERGREEN_COHORT_NOT_OPEN', 'This cohort is not accepting applications')
  if (!readiness?.placementAvailability?.isSeeking || readiness.placementAvailability.expiresAt <= new Date()) conflict('EVERGREEN_AVAILABILITY_REQUIRED', 'Active, consented placement availability is required')
  const consentSnapshot = { version: readiness.placementAvailability.consentVersion, fields: readiness.placementAvailability.companyVisibleFields, consentedAt: readiness.placementAvailability.consentedAt.toISOString() }
  return { data: await evergreenRepository.upsertApplication(cohortId, studentId, consentSnapshot, actorId) }
}

async function transitionCandidateService(id: string, companyId: string | undefined, actorId: string, to: EvergreenCandidateStatus, studentId?: string) {
  const candidate = await evergreenRepository.findCandidate(id)
  if (!candidate || (companyId && candidate.cohort.program.companyId !== companyId) || (studentId && candidate.studentId !== studentId)) notFound('Evergreen candidate')
  assertTransition(candidateTransitions, candidate.status, to, 'candidate')
  const result = await evergreenRepository.transitionCandidate(id, candidate.status, to, actorId)
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Candidate state changed concurrently')
  return { data: result }
}

async function createOfferService(candidateId: string, companyId: string, actorId: string, payload: Record<string, any>) {
  const candidate = await evergreenRepository.findCandidate(candidateId)
  if (!candidate || candidate.cohort.program.companyId !== companyId) notFound('Evergreen candidate')
  if (candidate.status !== 'INTERVIEWING') conflict('EVERGREEN_CANDIDATE_NOT_OFFERABLE', 'Candidate must be interviewing before a formal offer is drafted')
  if (await evergreenRepository.countCompanyContacts(companyId, [payload.supervisorId]) !== 1) forbidden('The offer supervisor must belong to your company')
  const termsSnapshot = { role: payload.role, duties: payload.duties, placementType: payload.placementType, workMode: payload.workMode, location: payload.location, stipendAmount: payload.stipendAmount ?? null, currency: payload.currency, stipendFrequency: payload.stipendFrequency ?? null, startDate: payload.startDate.toISOString(), endDate: payload.endDate.toISOString(), expectations: payload.expectations, policyLinks: payload.policyLinks, supervisorId: payload.supervisorId }
  return { data: await evergreenRepository.createOffer(candidateId, companyId, actorId, { ...payload, studentId: candidate.studentId, termsSnapshot }) }
}

async function sendOfferService(id: string, companyId: string, actorId: string) {
  const offer = await evergreenRepository.findOffer(id)
  if (!offer || offer.companyId !== companyId) notFound('Placement offer')
  assertTransition(offerTransitions, offer.status, 'SENT', 'offer')
  const result = await evergreenRepository.transitionOffer(id, companyId, offer.status, 'SENT', actorId, { sentAt: new Date() })
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Offer state changed concurrently')
  await transitionCandidateService(offer.candidateId, companyId, actorId, 'OFFERED')
  return { data: result }
}

async function withdrawOfferService(id: string, companyId: string, actorId: string, reason: string) {
  const offer = await evergreenRepository.findOffer(id)
  if (!offer || offer.companyId !== companyId) notFound('Placement offer')
  assertTransition(offerTransitions, offer.status, 'WITHDRAWN', 'offer')
  const result = await evergreenRepository.transitionOffer(id, companyId, offer.status, 'WITHDRAWN', actorId, { withdrawalReason: reason, respondedAt: new Date() })
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Offer state changed concurrently')
  return { data: result }
}

async function listStudentOffersService(studentId: string) {
  return { data: await evergreenRepository.listStudentOffers(studentId) }
}

async function acceptOfferService(id: string, studentId: string, actorId: string, idempotencyKey: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await evergreenRepository.acceptOffer(id, studentId, actorId, idempotencyKey, hashPayload({ id, studentId }), repeatHireLimit)
      if (!result) notFound('Placement offer')
      if (typeof result === 'string') {
        const messages: Record<string, string> = {
          IDEMPOTENCY_MISMATCH: 'The idempotency key was already used for another request',
          OFFER_EXPIRED: 'The offer has expired',
          COHORT_NOT_ACCEPTING: 'The cohort is no longer accepting offers',
          ACTIVE_PLACEMENT_EXISTS: 'You already have an exclusive active placement',
          REPEAT_HIRE_GUARDRAIL: 'This company must complete an approved mentorship alternative before another placement',
          COHORT_FULL: 'The final cohort seat has already been accepted'
        }
        conflict(`EVERGREEN_${result}`, messages[result] ?? `Offer cannot be accepted: ${result}`)
      }
      return { data: result, notice: 'This placement is now exclusive. Other incompatible open offers have been closed.' }
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' || error.code === 'P2002')
      if (retryable && attempt < 3) continue
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') conflict('EVERGREEN_ACCEPTANCE_CONFLICT', 'Another placement or final seat was accepted concurrently')
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') conflict('EVERGREEN_ACCEPTANCE_RETRY', 'Acceptance conflicted repeatedly; retry with the same idempotency key')
      throw error
    }
  }
  conflict('EVERGREEN_ACCEPTANCE_RETRY', 'Acceptance could not be completed')
}

async function declineOfferService(id: string, studentId: string, actorId: string, reason?: string) {
  const offer = await evergreenRepository.findOffer(id)
  if (!offer || offer.studentId !== studentId) notFound('Placement offer')
  assertTransition(offerTransitions, offer.status, 'DECLINED', 'offer')
  const result = await evergreenRepository.transitionOffer(id, undefined, offer.status, 'DECLINED', actorId, { declineReason: reason, respondedAt: new Date() })
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Offer state changed concurrently')
  await transitionCandidateService(offer.candidateId, undefined, actorId, 'DECLINED', studentId)
  return { data: result }
}

async function listStudentPlacementsService(studentId: string) {
  return { data: await evergreenRepository.listStudentPlacements(studentId) }
}

async function readPlacementService(id: string, user: AuthUser) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement) notFound('Placement')
  const companyAccess = user.businessId === placement.companyId
  const studentAccess = user.studentId === placement.studentId
  const operationsAccess = ['OPERATIONS_MANAGER', 'SUPER_ADMIN'].includes(user.role)
  if (!companyAccess && !studentAccess && !operationsAccess) notFound('Placement')
  const safePlacement: Record<string, any> = { ...placement }
  if (studentAccess) safePlacement.evaluations = placement.evaluations.filter((item) => item.visibility === 'SHARED')
  return { data: safePlacement, allowedActions: { supervise: companyAccess, submitCheckIn: studentAccess && placement.status === 'ACTIVE', submitCompletion: studentAccess && placement.status === 'ACTIVE', resolve: operationsAccess } }
}

async function requireCompanyPlacement(id: string, companyId: string, actorId: string, role: string) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement || placement.companyId !== companyId) notFound('Placement')
  if (role === 'COMPANY_HIRING_MANAGER' && placement.supervisor?.userId !== actorId) forbidden('Hiring managers may supervise only assigned placements')
  return placement
}

async function createPlacementGoalService(id: string, companyId: string, actorId: string, role: string, payload: Record<string, any>) {
  await requireCompanyPlacement(id, companyId, actorId, role)
  return { data: await evergreenRepository.createPlacementGoal(id, actorId, payload) }
}

async function completeOnboardingService(id: string, itemId: string, user: AuthUser) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement) notFound('Placement')
  const ownerType = user.studentId === placement.studentId ? 'STUDENT' : user.businessId === placement.companyId ? 'COMPANY' : null
  if (!ownerType) notFound('Placement')
  const result = await evergreenRepository.completeOnboardingItem(itemId, id, user.id, ownerType)
  if (!result) conflict('EVERGREEN_ONBOARDING_ITEM_NOT_ACTIONABLE', 'This onboarding item is missing, completed, or owned by the other party')
  return { data: result }
}

async function submitCheckInService(id: string, studentId: string, actorId: string, payload: Record<string, any>) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement || placement.studentId !== studentId) notFound('Placement')
  if (placement.status !== 'ACTIVE') conflict('EVERGREEN_PLACEMENT_NOT_ACTIVE', 'Check-ins require an active placement')
  return { data: await evergreenRepository.createPlacementCheckIn(id, studentId, { ...payload, actorId }) }
}

async function respondCheckInService(id: string, checkInId: string, companyId: string, actorId: string, role: string, payload: Record<string, any>) {
  await requireCompanyPlacement(id, companyId, actorId, role)
  const result = await evergreenRepository.respondPlacementCheckIn(checkInId, id, actorId, payload)
  if (!result) notFound('Placement check-in')
  return { data: result }
}

async function submitEvidenceService(id: string, studentId: string, actorId: string, payload: Record<string, any>) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement || placement.studentId !== studentId) notFound('Placement')
  return { data: await evergreenRepository.createPlacementEvidence(id, actorId, payload) }
}

async function createEvaluationService(id: string, companyId: string, actorId: string, role: string, payload: Record<string, any>) {
  await requireCompanyPlacement(id, companyId, actorId, role)
  return { data: await evergreenRepository.createPlacementEvaluation(id, actorId, 'SUPERVISOR', payload) }
}

async function verifyPlacementEvidenceService(id: string, evidenceId: string, companyId: string, actorId: string, role: string) {
  await requireCompanyPlacement(id, companyId, actorId, role)
  const result = await evergreenRepository.verifyPlacementEvidence(id, evidenceId, actorId)
  if (!result) conflict('EVERGREEN_EVIDENCE_NOT_VERIFIABLE', 'Evidence is missing or has already been reviewed')
  return { data: result }
}

function placementParty(placement: Awaited<ReturnType<typeof evergreenRepository.findPlacement>>, user: AuthUser) {
  if (!placement) notFound('Placement')
  if (user.studentId === placement.studentId) return 'STUDENT' as const
  if (user.businessId === placement.companyId) {
    if (user.role === 'COMPANY_HIRING_MANAGER' && placement.supervisor?.userId !== user.id) forbidden('Hiring managers may supervise only assigned placements')
    return 'COMPANY' as const
  }
  notFound('Placement')
}

async function createPlacementAmendmentService(id: string, user: AuthUser, payload: { reason: string, changes: Record<string, unknown> }) {
  const placement = await evergreenRepository.findPlacement(id)
  const party = placementParty(placement, user)
  if (!placement || ['COMPLETED', 'CANCELLED_BEFORE_START', 'TERMINATED'].includes(placement.status)) conflict('EVERGREEN_AMENDMENT_NOT_ALLOWED', 'A closed placement cannot be amended')
  const startDate = payload.changes.startDate ? new Date(String(payload.changes.startDate)) : placement.startDate
  const endDate = payload.changes.endDate ? new Date(String(payload.changes.endDate)) : placement.endDate
  if (endDate && startDate >= endDate) conflict('EVERGREEN_AMENDMENT_DATES_INVALID', 'The amended end date must follow the start date')
  if (payload.changes.supervisorId && await evergreenRepository.countCompanyContacts(placement.companyId, [String(payload.changes.supervisorId)]) !== 1) forbidden('The amended supervisor must belong to the placement company')
  return { data: await evergreenRepository.createPlacementAmendment(id, user.id, party, payload.reason, payload.changes as Prisma.InputJsonValue) }
}

async function decidePlacementAmendmentService(id: string, amendmentId: string, user: AuthUser, decision: 'ACCEPT' | 'REJECT', reason?: string) {
  const placement = await evergreenRepository.findPlacement(id)
  const party = placementParty(placement, user)
  const result = await evergreenRepository.decidePlacementAmendment(amendmentId, id, user.id, party, decision, reason)
  if (!result) conflict('EVERGREEN_AMENDMENT_NOT_ACTIONABLE', 'The amendment is missing or has already been decided')
  return { data: result }
}

async function createPlacementSupportRequestService(id: string, studentId: string, actorId: string, payload: { category: string, summary: string, privateDetails?: string }) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement || placement.studentId !== studentId) notFound('Placement')
  if (['COMPLETED', 'CANCELLED_BEFORE_START', 'TERMINATED'].includes(placement.status)) conflict('EVERGREEN_SUPPORT_PLACEMENT_CLOSED', 'Open a general support case for a closed placement')
  return { data: await evergreenRepository.createPlacementSupportRequest(id, actorId, payload) }
}

async function listPlacementSupportRequestsService(actorId: string) {
  const data = await evergreenRepository.listOpenSupportRequests()
  await evergreenRepository.auditSensitiveRead(actorId, 'PlacementSupportRequest', 'open', 'EVERGREEN_PROTECTED_SUPPORT_READ')
  return { data }
}

async function resolvePlacementSupportRequestService(id: string, actorId: string, resolution: string) {
  const result = await evergreenRepository.resolveSupportRequest(id, actorId, resolution)
  if (!result) conflict('EVERGREEN_SUPPORT_NOT_ACTIONABLE', 'The protected support request is missing or already resolved')
  return { data: result }
}

async function transitionPlacementService(id: string, user: AuthUser, to: any, reason?: string) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement) notFound('Placement')
  const authorized = user.studentId === placement.studentId || user.businessId === placement.companyId || ['OPERATIONS_MANAGER', 'SUPER_ADMIN'].includes(user.role)
  if (!authorized) notFound('Placement')
  assertTransition(placementTransitions, placement.status, to, 'placement')
  const result = await evergreenRepository.transitionPlacement(id, placement.status, to, user.id, reason)
  if (!result) conflict('EVERGREEN_TRANSITION_CONFLICT', 'Placement state changed concurrently')
  return { data: result }
}

async function completePlacementService(id: string, user: AuthUser, reason?: string) {
  const placement = await evergreenRepository.findPlacement(id)
  if (!placement) notFound('Placement')
  if (user.businessId !== placement.companyId && !['OPERATIONS_MANAGER', 'SUPER_ADMIN'].includes(user.role)) forbidden('Company or operations completion approval is required')
  const result = await evergreenRepository.completePlacement(id, user.id, reason)
  if (result === 'EVIDENCE_REQUIRED') conflict('EVERGREEN_VERIFIED_EVIDENCE_REQUIRED', 'At least one verified placement evidence record is required')
  if (result === 'EVALUATION_REQUIRED') conflict('EVERGREEN_SUPERVISOR_EVALUATION_REQUIRED', 'A supervisor completion evaluation is required')
  if (!result) conflict('EVERGREEN_COMPLETION_CONFLICT', 'Placement must be in completion review or dispute resolution')
  return { data: result, availabilityReconfirmationRequired: true }
}

async function resolvePlacementService(id: string, user: AuthUser, action: string, reason: string) {
  const targets: Record<string, PlacementStatus> = {
    CANCEL_BEFORE_START: 'CANCELLED_BEFORE_START',
    TERMINATE: 'TERMINATED',
    DISPUTE: 'DISPUTED',
    RESUME_ACTIVE: 'ACTIVE',
    RETURN_TO_COMPLETION_REVIEW: 'COMPLETION_REVIEW'
  }
  return transitionPlacementService(id, user, targets[action], reason)
}

async function listProgramReviewsService(query: Record<string, unknown>) {
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)))
  return cursorEnvelope(await evergreenRepository.listProgramReviews(query.cursor ? String(query.cursor) : undefined, limit), limit)
}

async function createOverrideService(actorId: string, payload: Record<string, any>) {
  if (payload.expiresAt <= new Date()) conflict('EVERGREEN_OVERRIDE_EXPIRY_INVALID', 'Override expiry must be in the future')
  return { data: await evergreenRepository.createOverride(actorId, payload) }
}

async function createMentorshipAlternativeService(actorId: string, payload: { companyId: string, studentId: string, type: string, description: string, completedAt: Date, evidence?: Record<string, unknown> }) {
  try {
    return { data: await evergreenRepository.createMentorshipAlternative(actorId, { ...payload, evidence: payload.evidence as Prisma.InputJsonValue | undefined }) }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') notFound('Company or student')
    throw error
  }
}

async function createInvoiceService(actorId: string, payload: Record<string, any>) {
  return { data: await evergreenRepository.createInvoice(payload.companyId, actorId, payload) }
}

async function confirmInvoiceService(id: string, actorId: string, payload: Record<string, any>) {
  const result = await evergreenRepository.confirmInvoice(id, actorId, payload)
  if (!result) notFound('Evergreen invoice')
  if (typeof result === 'string') conflict('EVERGREEN_INVOICE_NOT_CONFIRMABLE', `Invoice cannot be confirmed from ${result.replace('INVOICE_', '')}`)
  return { data: result }
}

async function refundInvoiceService(id: string, actorId: string, reason: string) {
  const result = await evergreenRepository.refundInvoice(id, actorId, reason)
  if (!result) notFound('Evergreen invoice')
  if (typeof result === 'string') conflict('EVERGREEN_INVOICE_NOT_REFUNDABLE', `Invoice cannot be refunded from ${result.replace('INVOICE_', '')}`)
  return { data: result }
}

async function changeEntitlementStatusService(id: string, actorId: string, action: 'SUSPEND' | 'REACTIVATE', reason: string) {
  const from = action === 'SUSPEND' ? 'ACTIVE' : 'SUSPENDED'
  const to = action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE'
  const result = await evergreenRepository.changeEntitlementStatus(id, actorId, from, to, reason)
  if (!result) conflict('EVERGREEN_ENTITLEMENT_STATUS_CONFLICT', `Entitlement cannot be ${action.toLowerCase()}ed from its current state or after expiry`)
  return { data: result }
}

async function listPlacementAlertsService() {
  return { data: await evergreenRepository.listPlacementAlerts() }
}

export {
  assertEvergreenEnabledService,
  readCompanyEligibilityService,
  listProgramsService,
  readProgramService,
  createProgramService,
  updateProgramService,
  transitionProgramService,
  createCohortService,
  readCohortService,
  transitionCohortService,
  readStudentReadinessService,
  setAvailabilityService,
  pauseAvailabilityService,
  listConsentedCohortCandidatesService,
  listStudentMatchesService,
  applyToCohortService,
  transitionCandidateService,
  createOfferService,
  sendOfferService,
  withdrawOfferService,
  listStudentOffersService,
  acceptOfferService,
  declineOfferService,
  listStudentPlacementsService,
  readPlacementService,
  createPlacementGoalService,
  completeOnboardingService,
  submitCheckInService,
  respondCheckInService,
  submitEvidenceService,
  createEvaluationService,
  verifyPlacementEvidenceService,
  createPlacementAmendmentService,
  decidePlacementAmendmentService,
  createPlacementSupportRequestService,
  listPlacementSupportRequestsService,
  resolvePlacementSupportRequestService,
  transitionPlacementService,
  completePlacementService,
  resolvePlacementService,
  listProgramReviewsService,
  createOverrideService,
  createMentorshipAlternativeService,
  createInvoiceService,
  confirmInvoiceService,
  refundInvoiceService,
  changeEntitlementStatusService,
  listPlacementAlertsService
}
