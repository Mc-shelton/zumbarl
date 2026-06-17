import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  awardApplicantProjectController,
  createApplicantReviewEventController,
  createBusinessOpportunityController,
  fundBusinessOpportunityController,
  inviteOpportunityBiddersController,
  listBusinessOpportunitiesController,
  listOpportunityApplicantsController,
  publishBusinessOpportunityController,
  readBusinessDashboardController,
  readBusinessProfileController,
  updateBusinessProfileController
} from '../../controllers/business/index.js'

async function registerBusinessRoutes(app: FastifyInstance) {
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  app.get('/dashboard', { preHandler: businessOnly }, readBusinessDashboardController)
  app.get('/profile', { preHandler: businessOnly }, readBusinessProfileController)
  app.patch('/profile', { preHandler: businessOnly }, updateBusinessProfileController)
  app.get('/opportunities', { preHandler: businessOnly }, listBusinessOpportunitiesController)
  app.post('/opportunities', { preHandler: businessOnly }, createBusinessOpportunityController)
  app.post('/opportunities/:id/publish', { preHandler: businessOnly }, publishBusinessOpportunityController)
  app.post('/opportunities/:id/fund', { preHandler: businessOnly }, fundBusinessOpportunityController)
  app.post('/opportunities/:id/invites', { preHandler: businessOnly }, inviteOpportunityBiddersController)
  app.get('/opportunities/:id/applicants', { preHandler: businessOnly }, listOpportunityApplicantsController)
  app.post('/applicants/:id/review-events', { preHandler: businessOnly }, createApplicantReviewEventController)
  app.post('/applicants/:id/award', { preHandler: businessOnly }, awardApplicantProjectController)
}

export {
  registerBusinessRoutes
}
