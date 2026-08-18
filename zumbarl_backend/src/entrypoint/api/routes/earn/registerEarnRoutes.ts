import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  acceptOpportunityInviteController,
  declineOpportunityInviteController,
  listEarnOpportunitiesController,
  listStudentBidsController,
  listStudentInvitesController,
  listStudentInterviewsController,
  listStudentProjectsController,
  readOpportunityBidDraftController,
  readStudentTrustSnapshotController,
  readStudentInterviewController,
  respondToStudentInterviewController,
  respondToBidCounterOfferController,
  saveOpportunityBidDraftController,
  submitOpportunityBidController,
  submitProjectDeliverableController
} from '../../controllers/earn/index.js'

async function registerEarnRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/opportunities', { preHandler: students }, listEarnOpportunitiesController)
  app.get('/bids', { preHandler: students }, listStudentBidsController)
  app.get('/opportunities/:id/bid-draft', { preHandler: students }, readOpportunityBidDraftController)
  app.put('/opportunities/:id/bid-draft', { preHandler: students }, saveOpportunityBidDraftController)
  app.post('/opportunities/:id/bids', { preHandler: students }, submitOpportunityBidController)
  app.post('/bids/:id/counter-offer/respond', { preHandler: students }, respondToBidCounterOfferController)
  app.get('/invites', { preHandler: students }, listStudentInvitesController)
  app.post('/invites/:id/accept', { preHandler: students }, acceptOpportunityInviteController)
  app.post('/invites/:id/decline', { preHandler: students }, declineOpportunityInviteController)
  app.get('/interviews', { preHandler: students }, listStudentInterviewsController)
  app.get('/interviews/:id', { preHandler: students }, readStudentInterviewController)
  app.post('/interviews/:id/respond', { preHandler: students }, respondToStudentInterviewController)
  app.get('/projects', { preHandler: students }, listStudentProjectsController)
  app.post('/projects/:id/deliverables', { preHandler: students }, submitProjectDeliverableController)
  app.get('/trust-snapshot', { preHandler: students }, readStudentTrustSnapshotController)
}

export {
  registerEarnRoutes
}
