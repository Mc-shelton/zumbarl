import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { createRecommendationEventsController, readRecommendationStatusController } from '../../controllers/recommendations/index.js'

async function registerRecommendationRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.post('/events', { preHandler: students }, createRecommendationEventsController)
  app.get('/status', { preHandler: students }, readRecommendationStatusController)
}

export {
  registerRecommendationRoutes
}
