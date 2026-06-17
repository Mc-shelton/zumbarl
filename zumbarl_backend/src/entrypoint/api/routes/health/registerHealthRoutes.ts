import type { FastifyInstance } from 'fastify'
import { readHealthStatusController, readReadinessStatusController } from '../../controllers/health/index.js'

async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', readHealthStatusController)
  app.get('/ready', readReadinessStatusController)
}

export {
  registerHealthRoutes
}
