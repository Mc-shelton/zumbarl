import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  addRoadmapEvidenceService,
  completeCheckpointTestService,
  createRoadmapService,
  listCareerLaddersService,
  listRoadmapRecommendationsService,
  listRoadmapsService,
  listTransitionPoolsService,
  lockRoadmapService,
  readRoadmapService,
  readLearnBaselineService,
  submitLearningPracticeService,
  verifyRoadmapEvidenceService,
  verifyRoadmapService
} from '../../../../adapters/services/learn/index.js'
import {
  addRoadmapEvidenceSchema,
  completeCheckpointTestSchema,
  createRoadmapSchema,
  submitLearningPracticeSchema,
  verifyRoadmapEvidenceSchema
} from '../../../validators/learn/index.js'

async function listCareerLaddersController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listCareerLaddersService())
}

async function readLearnBaselineController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readLearnBaselineService(request.authUser?.studentId))
}

async function listRoadmapsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listRoadmapsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function readRoadmapController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readRoadmapService(id, request.authUser?.studentId))
}

async function createRoadmapController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createRoadmapService(request.authUser?.studentId, requireBody(createRoadmapSchema, request)))
}

async function lockRoadmapController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await lockRoadmapService(id, request.authUser?.studentId))
}

async function addRoadmapEvidenceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await addRoadmapEvidenceService(id, request.authUser, requireBody(addRoadmapEvidenceSchema, request)))
}

async function submitLearningPracticeController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await submitLearningPracticeService(id, request.authUser, requireBody(submitLearningPracticeSchema, request)))
}

async function verifyRoadmapEvidenceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await verifyRoadmapEvidenceService(id, request.authUser, requireBody(verifyRoadmapEvidenceSchema, request)))
}

async function completeCheckpointTestController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await completeCheckpointTestService(id, request.authUser?.studentId, requireBody(completeCheckpointTestSchema, request)))
}

async function verifyRoadmapController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await verifyRoadmapService(id, request.authUser?.studentId))
}

async function listRoadmapRecommendationsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listRoadmapRecommendationsService(id, request.authUser?.studentId))
}

async function listTransitionPoolsController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listTransitionPoolsService())
}

export {
  addRoadmapEvidenceController,
  completeCheckpointTestController,
  createRoadmapController,
  listCareerLaddersController,
  listRoadmapRecommendationsController,
  listRoadmapsController,
  listTransitionPoolsController,
  lockRoadmapController,
  readRoadmapController,
  readLearnBaselineController,
  submitLearningPracticeController,
  verifyRoadmapEvidenceController,
  verifyRoadmapController
}
