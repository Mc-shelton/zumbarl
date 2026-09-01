import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { ApiError, requireBody, requireParams } from '../../../../lib/http.js'
import { assertCompanyIdentity, assertStudentIdentity } from '../../../../domain/evergreen/index.js'
import {
  acceptOfferService,
  applyToCohortService,
  completePlacementService,
  confirmInvoiceService,
  completeOnboardingService,
  changeEntitlementStatusService,
  createCohortService,
  createEvaluationService,
  createInvoiceService,
  createMentorshipAlternativeService,
  createOfferService,
  createOverrideService,
  createPlacementGoalService,
  createPlacementAmendmentService,
  createPlacementSupportRequestService,
  createProgramService,
  declineOfferService,
  listConsentedCohortCandidatesService,
  listPlacementAlertsService,
  listPlacementSupportRequestsService,
  listEvergreenFailuresService,
  listProgramReviewsService,
  listProgramsService,
  listStudentMatchesService,
  listStudentOffersService,
  listStudentPlacementsService,
  pauseAvailabilityService,
  readCompanyEligibilityService,
  readCohortService,
  readPlacementService,
  readProgramService,
  readStudentReadinessService,
  refundInvoiceService,
  resolvePlacementService,
  resolvePlacementSupportRequestService,
  replayEvergreenEventService,
  respondCheckInService,
  sendOfferService,
  setAvailabilityService,
  submitCheckInService,
  submitEvidenceService,
  transitionCandidateService,
  transitionCohortService,
  transitionPlacementService,
  transitionProgramService,
  updateProgramService,
  decidePlacementAmendmentService,
  verifyPlacementEvidenceService,
  withdrawOfferService
} from '../../../../adapters/services/evergreen/index.js'
import { jobNames, runEvergreenJobService } from '../../../../adapters/services/evergreen/index.js'
import {
  availabilitySchema,
  amendmentDecisionSchema,
  confirmInvoiceSchema,
  createAmendmentSchema,
  createCheckInSchema,
  createCohortSchema,
  createEvaluationSchema,
  createEvidenceSchema,
  createGoalSchema,
  createInvoiceSchema,
  createOfferSchema,
  createOverrideSchema,
  createProgramSchema,
  createSupportRequestSchema,
  declineOfferSchema,
  reasonSchema,
  refundInvoiceSchema,
  resolveSupportRequestSchema,
  placementResolutionSchema,
  respondCheckInSchema,
  updateProgramSchema,
  entitlementStatusSchema,
  mentorshipAlternativeSchema
} from '../../../validators/evergreen/index.js'

const idSchema = z.object({ id: z.string().min(1) })
const programIdSchema = z.object({ programId: z.string().min(1) })
const cohortIdSchema = z.object({ cohortId: z.string().min(1) })
const candidateIdSchema = z.object({ candidateId: z.string().min(1) })
const placementCheckInSchema = z.object({ id: z.string().min(1), checkInId: z.string().min(1) })
const placementAmendmentSchema = z.object({ id: z.string().min(1), amendmentId: z.string().min(1) })

function requireIdempotencyKey(request: FastifyRequest) {
  const value = request.headers['idempotency-key']
  if (typeof value !== 'string' || value.length < 8 || value.length > 200) throw new ApiError(400, 'An Idempotency-Key header of 8-200 characters is required', 'IDEMPOTENCY_KEY_REQUIRED')
  return value
}

async function readEligibilityController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readCompanyEligibilityService(assertCompanyIdentity(request.authUser)))
}

async function listProgramsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProgramsService(assertCompanyIdentity(request.authUser), request.query as Record<string, unknown>))
}

async function readProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readProgramService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser)))
}

async function createProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createProgramService(assertCompanyIdentity(request.authUser), request.authUser!.id, requireBody(createProgramSchema, request)))
}

async function updateProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await updateProgramService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, requireBody(updateProgramSchema, request)))
}

async function submitProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionProgramService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, 'PENDING_REVIEW'))
}

async function pauseProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionProgramService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, 'PAUSED'))
}

async function createCohortController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createCohortService(requireParams(programIdSchema, request).programId, assertCompanyIdentity(request.authUser), request.authUser!.id, requireIdempotencyKey(request), requireBody(createCohortSchema, request)))
}

async function openCohortController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionCohortService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, 'OPEN'))
}

async function readCohortController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readCohortService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser)))
}

async function listCohortCandidatesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listConsentedCohortCandidatesService(requireParams(cohortIdSchema, request).cohortId, assertCompanyIdentity(request.authUser), request.query as Record<string, unknown>))
}

async function inviteCandidateController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionCandidateService(requireParams(candidateIdSchema, request).candidateId, assertCompanyIdentity(request.authUser), request.authUser!.id, 'INVITED'))
}

async function shortlistCandidateController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionCandidateService(requireParams(candidateIdSchema, request).candidateId, assertCompanyIdentity(request.authUser), request.authUser!.id, 'SHORTLISTED'))
}

async function interviewCandidateController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionCandidateService(requireParams(candidateIdSchema, request).candidateId, assertCompanyIdentity(request.authUser), request.authUser!.id, 'INTERVIEWING'))
}

async function rejectCandidateController(request: FastifyRequest, reply: FastifyReply) {
  requireBody(reasonSchema, request)
  return reply.send(await transitionCandidateService(requireParams(candidateIdSchema, request).candidateId, assertCompanyIdentity(request.authUser), request.authUser!.id, 'REJECTED'))
}

async function createOfferController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createOfferService(requireParams(candidateIdSchema, request).candidateId, assertCompanyIdentity(request.authUser), request.authUser!.id, requireBody(createOfferSchema, request)))
}

async function sendOfferController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await sendOfferService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id))
}

async function withdrawOfferController(request: FastifyRequest, reply: FastifyReply) {
  const { reason } = requireBody(reasonSchema, request)
  return reply.send(await withdrawOfferService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, reason))
}

async function readReadinessController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readStudentReadinessService(assertStudentIdentity(request.authUser)))
}

async function setAvailabilityController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await setAvailabilityService(assertStudentIdentity(request.authUser), requireBody(availabilitySchema, request)))
}

async function pauseAvailabilityController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await pauseAvailabilityService(assertStudentIdentity(request.authUser)))
}

async function listMatchesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentMatchesService(assertStudentIdentity(request.authUser), request.query as Record<string, unknown>))
}

async function applyToCohortController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await applyToCohortService(requireParams(cohortIdSchema, request).cohortId, assertStudentIdentity(request.authUser), request.authUser!.id))
}

async function respondInvitationController(request: FastifyRequest, reply: FastifyReply) {
  const response = z.object({ response: z.enum(['ACCEPT', 'DECLINE']) }).parse(request.body ?? {})
  return reply.send(await transitionCandidateService(requireParams(candidateIdSchema, request).candidateId, undefined, request.authUser!.id, response.response === 'ACCEPT' ? 'APPLIED' : 'DECLINED', assertStudentIdentity(request.authUser)))
}

async function listStudentOffersController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentOffersService(assertStudentIdentity(request.authUser)))
}

async function acceptOfferController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await acceptOfferService(requireParams(idSchema, request).id, assertStudentIdentity(request.authUser), request.authUser!.id, requireIdempotencyKey(request)))
}

async function declineOfferController(request: FastifyRequest, reply: FastifyReply) {
  const { reason } = requireBody(declineOfferSchema, request)
  return reply.send(await declineOfferService(requireParams(idSchema, request).id, assertStudentIdentity(request.authUser), request.authUser!.id, reason))
}

async function listStudentPlacementsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentPlacementsService(assertStudentIdentity(request.authUser)))
}

async function readPlacementController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readPlacementService(requireParams(idSchema, request).id, request.authUser!))
}

async function createGoalController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createPlacementGoalService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, request.authUser!.role, requireBody(createGoalSchema, request)))
}

async function completeOnboardingController(request: FastifyRequest, reply: FastifyReply) {
  const { itemId } = z.object({ itemId: z.string().min(1) }).parse(request.body ?? {})
  return reply.send(await completeOnboardingService(requireParams(idSchema, request).id, itemId, request.authUser!))
}

async function submitCheckInController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await submitCheckInService(requireParams(idSchema, request).id, assertStudentIdentity(request.authUser), request.authUser!.id, requireBody(createCheckInSchema, request)))
}

async function respondCheckInController(request: FastifyRequest, reply: FastifyReply) {
  const params = requireParams(placementCheckInSchema, request)
  return reply.send(await respondCheckInService(params.id, params.checkInId, assertCompanyIdentity(request.authUser), request.authUser!.id, request.authUser!.role, requireBody(respondCheckInSchema, request)))
}

async function submitEvidenceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await submitEvidenceService(requireParams(idSchema, request).id, assertStudentIdentity(request.authUser), request.authUser!.id, requireBody(createEvidenceSchema, request)))
}

async function createEvaluationController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createEvaluationService(requireParams(idSchema, request).id, assertCompanyIdentity(request.authUser), request.authUser!.id, request.authUser!.role, requireBody(createEvaluationSchema, request)))
}

async function verifyEvidenceController(request: FastifyRequest, reply: FastifyReply) {
  const params = z.object({ id: z.string().min(1), evidenceId: z.string().min(1) }).parse(request.params ?? {})
  return reply.send(await verifyPlacementEvidenceService(params.id, params.evidenceId, assertCompanyIdentity(request.authUser), request.authUser!.id, request.authUser!.role))
}

async function createAmendmentController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createPlacementAmendmentService(requireParams(idSchema, request).id, request.authUser!, requireBody(createAmendmentSchema, request)))
}

async function decideAmendmentController(request: FastifyRequest, reply: FastifyReply) {
  const params = requireParams(placementAmendmentSchema, request)
  const body = requireBody(amendmentDecisionSchema, request)
  return reply.send(await decidePlacementAmendmentService(params.id, params.amendmentId, request.authUser!, body.decision, body.reason))
}

async function createSupportRequestController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createPlacementSupportRequestService(requireParams(idSchema, request).id, assertStudentIdentity(request.authUser), request.authUser!.id, requireBody(createSupportRequestSchema, request)))
}

async function submitPlacementCompletionController(request: FastifyRequest, reply: FastifyReply) {
  const body = declineOfferSchema.parse(request.body ?? {})
  return reply.send(await transitionPlacementService(requireParams(idSchema, request).id, request.authUser!, 'COMPLETION_REVIEW', body.reason))
}

async function startPlacementController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionPlacementService(requireParams(idSchema, request).id, request.authUser!, 'ACTIVE'))
}

async function completePlacementController(request: FastifyRequest, reply: FastifyReply) {
  const body = declineOfferSchema.parse(request.body ?? {})
  return reply.send(await completePlacementService(requireParams(idSchema, request).id, request.authUser!, body.reason))
}

async function cancelPlacementController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await resolvePlacementService(requireParams(idSchema, request).id, request.authUser!, 'CANCEL_BEFORE_START', requireBody(reasonSchema, request).reason))
}

async function terminatePlacementController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await resolvePlacementService(requireParams(idSchema, request).id, request.authUser!, 'TERMINATE', requireBody(reasonSchema, request).reason))
}

async function listProgramReviewsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProgramReviewsService(request.query as Record<string, unknown>))
}

async function approveProgramController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionProgramService(requireParams(idSchema, request).id, undefined, request.authUser!.id, 'ACTIVE'))
}

async function requestProgramChangesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await transitionProgramService(requireParams(idSchema, request).id, undefined, request.authUser!.id, 'CHANGES_REQUESTED', requireBody(reasonSchema, request).reason))
}

async function createOverrideController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createOverrideService(request.authUser!.id, requireBody(createOverrideSchema, request)))
}

async function createMentorshipAlternativeController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createMentorshipAlternativeService(request.authUser!.id, requireBody(mentorshipAlternativeSchema, request)))
}

async function listPlacementAlertsController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPlacementAlertsService())
}

async function resolvePlacementController(request: FastifyRequest, reply: FastifyReply) {
  const body = requireBody(placementResolutionSchema, request)
  return reply.send(await resolvePlacementService(requireParams(idSchema, request).id, request.authUser!, body.action, body.reason))
}

async function listSupportRequestsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPlacementSupportRequestsService(request.authUser!.id))
}

async function resolveSupportRequestController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await resolvePlacementSupportRequestService(requireParams(idSchema, request).id, request.authUser!.id, requireBody(resolveSupportRequestSchema, request).resolution))
}

async function createInvoiceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createInvoiceService(request.authUser!.id, requireBody(createInvoiceSchema, request)))
}

async function confirmInvoiceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await confirmInvoiceService(requireParams(idSchema, request).id, request.authUser!.id, requireBody(confirmInvoiceSchema, request)))
}

async function refundInvoiceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await refundInvoiceService(requireParams(idSchema, request).id, request.authUser!.id, requireBody(refundInvoiceSchema, request).reason))
}

async function changeEntitlementStatusController(request: FastifyRequest, reply: FastifyReply) {
  const body = requireBody(entitlementStatusSchema, request)
  return reply.send(await changeEntitlementStatusService(requireParams(idSchema, request).id, request.authUser!.id, body.action, body.reason))
}

async function replayJobController(request: FastifyRequest, reply: FastifyReply) {
  const params = z.object({ name: z.enum(jobNames) }).parse(request.params ?? {})
  return reply.code(202).send(await runEvergreenJobService(params.name, request.authUser!.id))
}

async function listFailuresController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listEvergreenFailuresService())
}

async function replayEventController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(202).send(await replayEvergreenEventService(requireParams(idSchema, request).id, request.authUser!.id))
}

export {
  readEligibilityController, listProgramsController, readProgramController, createProgramController, updateProgramController, submitProgramController, pauseProgramController,
  createCohortController, openCohortController, readCohortController, listCohortCandidatesController, inviteCandidateController, shortlistCandidateController, interviewCandidateController,
  rejectCandidateController, createOfferController, sendOfferController, withdrawOfferController, readReadinessController, setAvailabilityController,
  pauseAvailabilityController, listMatchesController, applyToCohortController, respondInvitationController, listStudentOffersController, acceptOfferController,
  declineOfferController, listStudentPlacementsController, readPlacementController, createGoalController, completeOnboardingController, submitCheckInController, respondCheckInController,
  submitEvidenceController, createEvaluationController, verifyEvidenceController, createAmendmentController, decideAmendmentController, createSupportRequestController, submitPlacementCompletionController, startPlacementController, completePlacementController, cancelPlacementController, terminatePlacementController,
  listProgramReviewsController, approveProgramController, requestProgramChangesController, createOverrideController, createMentorshipAlternativeController, listPlacementAlertsController,
  resolvePlacementController, listSupportRequestsController, resolveSupportRequestController,
  createInvoiceController, confirmInvoiceController, refundInvoiceController, changeEntitlementStatusController, replayJobController, listFailuresController, replayEventController
}
