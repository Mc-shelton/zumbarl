import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { requireEvergreenCapability } from '../../../../domain/evergreen/index.js'
import { assertEvergreenEnabledService } from '../../../../adapters/services/evergreen/index.js'
import {
  acceptOfferController,
  applyToCohortController,
  approveProgramController,
  completePlacementController,
  completeOnboardingController,
  changeEntitlementStatusController,
  cancelPlacementController,
  confirmInvoiceController,
  createCohortController,
  createEvaluationController,
  createGoalController,
  createAmendmentController,
  createSupportRequestController,
  createInvoiceController,
  createMentorshipAlternativeController,
  createOfferController,
  createOverrideController,
  createProgramController,
  declineOfferController,
  interviewCandidateController,
  inviteCandidateController,
  listCohortCandidatesController,
  listMatchesController,
  listFailuresController,
  listPlacementAlertsController,
  listSupportRequestsController,
  listProgramReviewsController,
  listProgramsController,
  listStudentOffersController,
  listStudentPlacementsController,
  openCohortController,
  pauseAvailabilityController,
  pauseProgramController,
  readEligibilityController,
  readCohortController,
  readPlacementController,
  readProgramController,
  readReadinessController,
  replayJobController,
  replayEventController,
  refundInvoiceController,
  rejectCandidateController,
  requestProgramChangesController,
  resolvePlacementController,
  resolveSupportRequestController,
  respondCheckInController,
  respondInvitationController,
  sendOfferController,
  setAvailabilityController,
  shortlistCandidateController,
  startPlacementController,
  submitCheckInController,
  submitEvidenceController,
  submitPlacementCompletionController,
  submitProgramController,
  terminatePlacementController,
  updateProgramController,
  decideAmendmentController,
  verifyEvidenceController,
  withdrawOfferController
} from '../../controllers/evergreen/index.js'

async function registerEvergreenRoutes(app: FastifyInstance) {
  app.addHook('preHandler', assertEvergreenEnabledService)
  const companyRead = requireEvergreenCapability('EVERGREEN_PROGRAM_READ')
  const programManage = requireEvergreenCapability('EVERGREEN_PROGRAM_MANAGE')
  const cohortManage = requireEvergreenCapability('EVERGREEN_COHORT_MANAGE')
  const poolAccess = requireEvergreenCapability('EVERGREEN_POOL_ACCESS')
  const candidateReview = requireEvergreenCapability('EVERGREEN_CANDIDATE_REVIEW')
  const formalOffer = requireEvergreenCapability('EVERGREEN_FORMAL_OFFER')
  const supervision = requireEvergreenCapability('EVERGREEN_PLACEMENT_SUPERVISE')
  const studentDiscovery = requireEvergreenCapability('EVERGREEN_STUDENT_DISCOVERY')
  const operations = requireEvergreenCapability('EVERGREEN_OPERATIONS_REVIEW')
  const overrideManage = requireEvergreenCapability('EVERGREEN_OVERRIDE_MANAGE')
  const finance = requireEvergreenCapability('EVERGREEN_FINANCE_MANAGE')
  const replayJobs = requireEvergreenCapability('EVERGREEN_JOB_REPLAY')

  app.get('/eligibility', { preHandler: companyRead }, readEligibilityController)
  app.get('/programs', { preHandler: companyRead }, listProgramsController)
  app.get('/programs/:id', { preHandler: companyRead }, readProgramController)
  app.post('/programs', { preHandler: programManage }, createProgramController)
  app.patch('/programs/:id', { preHandler: programManage }, updateProgramController)
  app.post('/programs/:id/submit', { preHandler: programManage }, submitProgramController)
  app.post('/programs/:id/pause', { preHandler: programManage }, pauseProgramController)
  app.post('/programs/:programId/cohorts', { preHandler: cohortManage }, createCohortController)
  app.get('/cohorts/:id', { preHandler: companyRead }, readCohortController)
  app.post('/cohorts/:id/open', { preHandler: cohortManage }, openCohortController)
  app.get('/cohorts/:cohortId/candidates', { preHandler: poolAccess }, listCohortCandidatesController)
  app.post('/candidates/:candidateId/invite', { preHandler: candidateReview }, inviteCandidateController)
  app.post('/candidates/:candidateId/shortlist', { preHandler: candidateReview }, shortlistCandidateController)
  app.post('/candidates/:candidateId/interviews', { preHandler: candidateReview }, interviewCandidateController)
  app.post('/candidates/:candidateId/reject', { preHandler: candidateReview }, rejectCandidateController)
  app.post('/candidates/:candidateId/offers', { preHandler: formalOffer }, createOfferController)
  app.post('/offers/:id/send', { preHandler: formalOffer }, sendOfferController)
  app.post('/offers/:id/withdraw', { preHandler: formalOffer }, withdrawOfferController)

  app.get('/student/readiness', { preHandler: requireRoles(...roleGroups.student) }, readReadinessController)
  app.put('/student/availability', { preHandler: studentDiscovery }, setAvailabilityController)
  app.post('/student/availability/pause', { preHandler: studentDiscovery }, pauseAvailabilityController)
  app.get('/student/matches', { preHandler: studentDiscovery }, listMatchesController)
  app.post('/cohorts/:cohortId/applications', { preHandler: studentDiscovery }, applyToCohortController)
  app.post('/invitations/:candidateId/respond', { preHandler: studentDiscovery }, respondInvitationController)
  app.get('/student/offers', { preHandler: studentDiscovery }, listStudentOffersController)
  app.post('/offers/:id/accept', { preHandler: studentDiscovery }, acceptOfferController)
  app.post('/offers/:id/decline', { preHandler: studentDiscovery }, declineOfferController)
  app.get('/student/placements', { preHandler: studentDiscovery }, listStudentPlacementsController)
  app.post('/placements/:id/check-ins', { preHandler: studentDiscovery }, submitCheckInController)
  app.post('/placements/:id/evidence', { preHandler: studentDiscovery }, submitEvidenceController)
  app.post('/placements/:id/support-requests', { preHandler: studentDiscovery }, createSupportRequestController)
  app.post('/placements/:id/completion', { preHandler: studentDiscovery }, submitPlacementCompletionController)

  app.get('/placements/:id', { preHandler: requireRoles(...roleGroups.student, 'COMPANY_VIEWER', ...roleGroups.business, ...roleGroups.admin) }, readPlacementController)
  app.post('/placements/:id/onboarding', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.business) }, completeOnboardingController)
  app.post('/placements/:id/goals', { preHandler: supervision }, createGoalController)
  app.post('/placements/:id/check-ins/:checkInId/respond', { preHandler: supervision }, respondCheckInController)
  app.post('/placements/:id/evaluations', { preHandler: supervision }, createEvaluationController)
  app.post('/placements/:id/evidence/:evidenceId/verify', { preHandler: supervision }, verifyEvidenceController)
  app.post('/placements/:id/amendments', { preHandler: requireRoles(...roleGroups.student, 'COMPANY_PIPELINE_PARTNER', 'COMPANY_HR_MANAGER', 'COMPANY_HIRING_MANAGER') }, createAmendmentController)
  app.post('/placements/:id/amendments/:amendmentId/decision', { preHandler: requireRoles(...roleGroups.student, 'COMPANY_PIPELINE_PARTNER', 'COMPANY_HR_MANAGER', 'COMPANY_HIRING_MANAGER') }, decideAmendmentController)
  app.post('/placements/:id/start', { preHandler: supervision }, startPlacementController)
  app.post('/placements/:id/complete', { preHandler: supervision }, completePlacementController)
  app.post('/placements/:id/cancel', { preHandler: supervision }, cancelPlacementController)
  app.post('/placements/:id/terminate', { preHandler: supervision }, terminatePlacementController)

  app.get('/admin/program-reviews', { preHandler: operations }, listProgramReviewsController)
  app.post('/admin/programs/:id/approve', { preHandler: operations }, approveProgramController)
  app.post('/admin/programs/:id/request-changes', { preHandler: operations }, requestProgramChangesController)
  app.post('/admin/overrides', { preHandler: overrideManage }, createOverrideController)
  app.post('/admin/mentorship-alternatives', { preHandler: overrideManage }, createMentorshipAlternativeController)
  app.get('/admin/placement-alerts', { preHandler: operations }, listPlacementAlertsController)
  app.post('/admin/placements/:id/resolve', { preHandler: operations }, resolvePlacementController)
  app.get('/admin/support-requests', { preHandler: operations }, listSupportRequestsController)
  app.post('/admin/support-requests/:id/resolve', { preHandler: operations }, resolveSupportRequestController)
  app.post('/admin/jobs/:name/replay', { preHandler: replayJobs }, replayJobController)
  app.get('/admin/failures', { preHandler: replayJobs }, listFailuresController)
  app.post('/admin/events/:id/replay', { preHandler: replayJobs }, replayEventController)
  app.post('/finance/invoices', { preHandler: finance }, createInvoiceController)
  app.post('/finance/invoices/:id/confirm', { preHandler: finance }, confirmInvoiceController)
  app.post('/finance/invoices/:id/refund', { preHandler: finance }, refundInvoiceController)
  app.post('/finance/entitlements/:id/status', { preHandler: finance }, changeEntitlementStatusController)
}

export { registerEvergreenRoutes }
