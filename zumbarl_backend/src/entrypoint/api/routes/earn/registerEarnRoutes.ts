import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  acceptOpportunityInviteController,
  listEarnOpportunitiesController,
  listStudentBidsController,
  listStudentProjectsController,
  readStudentTrustSnapshotController,
  readStudentInterviewController,
  respondToStudentInterviewController,
  submitOpportunityBidController,
  submitProjectDeliverableController
} from '../../controllers/earn/index.js'

async function registerEarnRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/opportunities', { preHandler: students }, listEarnOpportunitiesController)
  app.get('/bids', { preHandler: students }, listStudentBidsController)
  app.post('/opportunities/:id/bids', { preHandler: students }, submitOpportunityBidController)
  app.post('/invites/:id/accept', { preHandler: students }, acceptOpportunityInviteController)
  app.get('/interviews/:id', { preHandler: students }, readStudentInterviewController)
  app.post('/interviews/:id/respond', { preHandler: students }, respondToStudentInterviewController)
  app.get('/projects', { preHandler: students }, listStudentProjectsController)
  app.post('/projects/:id/deliverables', { preHandler: students }, submitProjectDeliverableController)
  app.get('/trust-snapshot', { preHandler: students }, readStudentTrustSnapshotController)
}

export {
  registerEarnRoutes
}
