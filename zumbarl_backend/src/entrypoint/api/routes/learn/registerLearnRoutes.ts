import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { addRoadmapEvidenceController, completeCheckpointTestController, createRoadmapController, listCareerLaddersController, listRoadmapsController, listTransitionPoolsController, lockRoadmapController, verifyRoadmapController } from '../../controllers/learn/index.js'

async function registerLearnRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  const business = requireRoles(...roleGroups.business, ...roleGroups.admin)
  app.get('/ladders', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin) }, listCareerLaddersController)
  app.get('/roadmaps', { preHandler: students }, listRoadmapsController)
  app.post('/roadmaps', { preHandler: students }, createRoadmapController)
  app.post('/roadmaps/:id/lock', { preHandler: students }, lockRoadmapController)
  app.post('/roadmaps/:id/evidence', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin) }, addRoadmapEvidenceController)
  app.post('/roadmaps/:id/tests', { preHandler: students }, completeCheckpointTestController)
  app.post('/roadmaps/:id/verify', { preHandler: students }, verifyRoadmapController)
  app.get('/transition-pools', { preHandler: business }, listTransitionPoolsController)
}

export {
  registerLearnRoutes
}
