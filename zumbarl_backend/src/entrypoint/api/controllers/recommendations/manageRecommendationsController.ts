import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { readRecommendationStatusService, recordRecommendationEventsService } from '../../../../adapters/services/recommendations/index.js'
import { recommendationEventBatchSchema } from '../../../validators/recommendations/index.js'

async function createRecommendationEventsController(request: FastifyRequest, reply: FastifyReply) {
  const { events } = requireBody(recommendationEventBatchSchema, request)
  const result = await recordRecommendationEventsService(request.authUser?.studentId, events)
  return reply.code(202).send(result)
}

async function readRecommendationStatusController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readRecommendationStatusService())
}

export {
  createRecommendationEventsController,
  readRecommendationStatusController
}
