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
  readRoadmapCoachingPlanService,
  refreshRoadmapResourcesService,
  readLearnBaselineService,
  submitLearningPracticeService,
  updateRoadmapCoachingFocusService,
  updateRoadmapResourceProgressService,
  updateRoadmapResourceSelectionService,
  verifyRoadmapEvidenceService,
  verifyRoadmapService
} from '../../../../adapters/services/learn/index.js'
import {
  addRoadmapEvidenceSchema,
  completeCheckpointTestSchema,
  createRoadmapSchema,
  submitLearningPracticeSchema,
  updateRoadmapCoachingFocusSchema,
  updateRoadmapResourceProgressSchema,
  updateRoadmapResourceSelectionSchema,
  verifyRoadmapEvidenceSchema
} from '../../../validators/learn/index.js'

async function listCareerLaddersController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listCareerLaddersService(request.query as Record<string, unknown>))
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

async function updateRoadmapCoachingFocusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateRoadmapCoachingFocusService(id, request.authUser?.studentId, requireBody(updateRoadmapCoachingFocusSchema, request)))
}

async function readRoadmapCoachingPlanController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readRoadmapCoachingPlanService(id, request.authUser?.studentId))
}

async function refreshRoadmapResourcesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await refreshRoadmapResourcesService(id, request.authUser?.studentId))
}

async function updateRoadmapResourceProgressController(request: FastifyRequest, reply: FastifyReply) {
  const params = requireParams(idParamSchema.extend({ resourceId: idParamSchema.shape.id }), request)
  return reply.send(await updateRoadmapResourceProgressService(params.id, params.resourceId, request.authUser?.studentId, requireBody(updateRoadmapResourceProgressSchema, request)))
}

async function updateRoadmapResourceSelectionController(request: FastifyRequest, reply: FastifyReply) {
  const params = requireParams(idParamSchema.extend({ resourceId: idParamSchema.shape.id }), request)
  return reply.send(await updateRoadmapResourceSelectionService(params.id, params.resourceId, request.authUser?.studentId, requireBody(updateRoadmapResourceSelectionSchema, request)))
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
  readRoadmapCoachingPlanController,
  refreshRoadmapResourcesController,
  submitLearningPracticeController,
  updateRoadmapCoachingFocusController,
  updateRoadmapResourceProgressController,
  updateRoadmapResourceSelectionController,
  verifyRoadmapEvidenceController,
  verifyRoadmapController
}
