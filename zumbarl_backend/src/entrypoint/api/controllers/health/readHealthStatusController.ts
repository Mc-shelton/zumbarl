import type { FastifyReply, FastifyRequest } from 'fastify'
import { readHealthStatusService, readReadinessStatusService } from '../../../../adapters/services/health/index.js'

async function readHealthStatusController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(readHealthStatusService())
}

async function readReadinessStatusController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readReadinessStatusService())
}

export {
  readHealthStatusController,
  readReadinessStatusController
}
