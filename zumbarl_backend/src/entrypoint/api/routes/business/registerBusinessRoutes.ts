import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  awardApplicantProjectController,
  counterOfferApplicantBidController,
  createBusinessIndustryController,
  createApplicantReviewEventController,
  createBusinessOpportunityController,
  createOpportunityDeliverablesController,
  deleteBusinessOpportunityController,
  setOpportunityApplicationsClosedController,
  fundBusinessOpportunityController,
  inviteOpportunityBiddersController,
  listBusinessActivityController,
  listOpportunityInviteCandidatesController,
  listBusinessOpportunitiesController,
  listBusinessIndustriesController,
  listOpportunityDeliverablesController,
  listOpportunityApplicantsController,
  listOpportunitySubmissionsController,
  publishBusinessOpportunityController,
  readOpportunityDeliverableController,
  readBusinessDashboardController,
  readBusinessKycController,
  readBusinessProfileController,
  scheduleApplicantInterviewController,
  startApplicantInterviewController,
  submitBusinessKycController,
  updateBusinessOpportunityController,
  updateBusinessProfileController
} from '../../controllers/business/index.js'

async function registerBusinessRoutes(app: FastifyInstance) {
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  app.get('/dashboard', { preHandler: businessOnly }, readBusinessDashboardController)
  app.get('/activity', { preHandler: businessOnly }, listBusinessActivityController)
  app.get('/profile', { preHandler: businessOnly }, readBusinessProfileController)
  app.patch('/profile', { preHandler: businessOnly }, updateBusinessProfileController)
  app.get('/kyc', { preHandler: businessOnly }, readBusinessKycController)
  app.patch('/kyc', { preHandler: businessOnly }, submitBusinessKycController)
  app.get('/industries', { preHandler: businessOnly }, listBusinessIndustriesController)
  app.post('/industries', { preHandler: businessOnly }, createBusinessIndustryController)
  app.get('/opportunities', { preHandler: businessOnly }, listBusinessOpportunitiesController)
  app.post('/opportunities', { preHandler: businessOnly }, createBusinessOpportunityController)
  app.patch('/opportunities/:id', { preHandler: businessOnly }, updateBusinessOpportunityController)
  app.delete('/opportunities/:id', { preHandler: businessOnly }, deleteBusinessOpportunityController)
  app.post('/opportunities/:id/applications-closed', { preHandler: businessOnly }, setOpportunityApplicationsClosedController)
  app.post('/opportunities/:id/publish', { preHandler: businessOnly }, publishBusinessOpportunityController)
  app.post('/opportunities/:id/fund', { preHandler: businessOnly }, fundBusinessOpportunityController)
  app.get('/opportunities/:id/deliverables', { preHandler: businessOnly }, listOpportunityDeliverablesController)
  app.post('/opportunities/:id/deliverables', { preHandler: businessOnly }, createOpportunityDeliverablesController)
  app.get('/opportunities/:id/deliverables/:deliverableId', { preHandler: businessOnly }, readOpportunityDeliverableController)
  app.get('/opportunities/:id/invite-candidates', { preHandler: businessOnly }, listOpportunityInviteCandidatesController)
  app.post('/opportunities/:id/invites', { preHandler: businessOnly }, inviteOpportunityBiddersController)
  app.get('/opportunities/:id/applicants', { preHandler: businessOnly }, listOpportunityApplicantsController)
  app.get('/opportunities/:id/submissions', { preHandler: businessOnly }, listOpportunitySubmissionsController)
  app.post('/applicants/:id/review-events', { preHandler: businessOnly }, createApplicantReviewEventController)
  app.post('/applicants/:id/interview', { preHandler: businessOnly }, scheduleApplicantInterviewController)
  app.post('/applicants/:id/interview/start', { preHandler: businessOnly }, startApplicantInterviewController)
  app.post('/applicants/:id/award', { preHandler: businessOnly }, awardApplicantProjectController)
  app.post('/applicants/:id/counter-offer', { preHandler: businessOnly }, counterOfferApplicantBidController)
}

export {
  registerBusinessRoutes
}
