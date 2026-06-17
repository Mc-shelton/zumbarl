import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { addRoadmapEvidenceService, completeCheckpointTestService, createRoadmapService, listCareerLaddersService, listRoadmapsService, listTransitionPoolsService, lockRoadmapService, verifyRoadmapService } from '../../../../adapters/services/learn/index.js'
import { addRoadmapEvidenceSchema, completeCheckpointTestSchema, createRoadmapSchema } from '../../../validators/learn/index.js'

async function listCareerLaddersController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(listCareerLaddersService()) }
async function listRoadmapsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listRoadmapsService(request.authUser?.studentId, request.query as Record<string, unknown>)) }
async function createRoadmapController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createRoadmapService(request.authUser?.studentId, requireBody(createRoadmapSchema, request))) }
async function lockRoadmapController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await lockRoadmapService(id)) }
async function addRoadmapEvidenceController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await addRoadmapEvidenceService(id, requireBody(addRoadmapEvidenceSchema, request))) }
async function completeCheckpointTestController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await completeCheckpointTestService(id, requireBody(completeCheckpointTestSchema, request))) }
async function verifyRoadmapController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await verifyRoadmapService(id)) }
async function listTransitionPoolsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await listTransitionPoolsService()) }

export {
  listCareerLaddersController,
  listRoadmapsController,
  createRoadmapController,
  lockRoadmapController,
  addRoadmapEvidenceController,
  completeCheckpointTestController,
  verifyRoadmapController,
  listTransitionPoolsController
}
