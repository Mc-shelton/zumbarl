import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  awardApplicantProjectController,
  createBusinessIndustryController,
  createApplicantReviewEventController,
  createBusinessOpportunityController,
  createOpportunityDeliverablesController,
  fundBusinessOpportunityController,
  inviteOpportunityBiddersController,
  listBusinessOpportunitiesController,
  listBusinessIndustriesController,
  listOpportunityDeliverablesController,
  listOpportunityApplicantsController,
  publishBusinessOpportunityController,
  readOpportunityDeliverableController,
  readBusinessDashboardController,
  readBusinessKycController,
  readBusinessProfileController,
  submitBusinessKycController,
  updateBusinessOpportunityController,
  updateBusinessProfileController
} from '../../controllers/business/index.js'

async function registerBusinessRoutes(app: FastifyInstance) {
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  app.get('/dashboard', { preHandler: businessOnly }, readBusinessDashboardController)
  app.get('/profile', { preHandler: businessOnly }, readBusinessProfileController)
  app.patch('/profile', { preHandler: businessOnly }, updateBusinessProfileController)
  app.get('/kyc', { preHandler: businessOnly }, readBusinessKycController)
  app.patch('/kyc', { preHandler: businessOnly }, submitBusinessKycController)
  app.get('/industries', { preHandler: businessOnly }, listBusinessIndustriesController)
  app.post('/industries', { preHandler: businessOnly }, createBusinessIndustryController)
  app.get('/opportunities', { preHandler: businessOnly }, listBusinessOpportunitiesController)
  app.post('/opportunities', { preHandler: businessOnly }, createBusinessOpportunityController)
  app.patch('/opportunities/:id', { preHandler: businessOnly }, updateBusinessOpportunityController)
  app.post('/opportunities/:id/publish', { preHandler: businessOnly }, publishBusinessOpportunityController)
  app.post('/opportunities/:id/fund', { preHandler: businessOnly }, fundBusinessOpportunityController)
  app.get('/opportunities/:id/deliverables', { preHandler: businessOnly }, listOpportunityDeliverablesController)
  app.post('/opportunities/:id/deliverables', { preHandler: businessOnly }, createOpportunityDeliverablesController)
  app.get('/opportunities/:id/deliverables/:deliverableId', { preHandler: businessOnly }, readOpportunityDeliverableController)
  app.post('/opportunities/:id/invites', { preHandler: businessOnly }, inviteOpportunityBiddersController)
  app.get('/opportunities/:id/applicants', { preHandler: businessOnly }, listOpportunityApplicantsController)
  app.post('/applicants/:id/review-events', { preHandler: businessOnly }, createApplicantReviewEventController)
  app.post('/applicants/:id/award', { preHandler: businessOnly }, awardApplicantProjectController)
}

export {
  registerBusinessRoutes
}
