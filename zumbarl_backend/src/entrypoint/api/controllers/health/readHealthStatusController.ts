import type { FastifyReply, FastifyRequest } from 'fastify'
import { readHealthStatusService, readReadinessStatusService } from '../../../../adapters/services/health/index.js'

async function readHealthStatusController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(readHealthStatusService())
}

async function readReadinessStatusController(_request: FastifyRequest, reply: FastifyReply) {
  const readiness = await readReadinessStatusService()
  return reply.code(readiness.status === 'ready' ? 200 : 503).send(readiness)
}

export {
  readHealthStatusController,
  readReadinessStatusController
}
