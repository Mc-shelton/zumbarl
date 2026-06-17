import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { updateModerationCaseSchema, updateUserSchema } from '../../../validators/admin/index.js'
import { listModerationCasesService, listUsersService, readAdminMetricsService, updateModerationCaseService, updateUserService } from '../../../../adapters/services/admin/index.js'
async function readAdminMetricsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readAdminMetricsService()) }
async function listUsersController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listUsersService(request.query as Record<string, unknown>)) }
async function updateUserController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateUserService(id, requireBody(updateUserSchema, request))) }
async function listModerationCasesController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listModerationCasesService(request.query as Record<string, unknown>)) }
async function updateModerationCaseController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateModerationCaseService(id, requireBody(updateModerationCaseSchema, request))) }

export {
  readAdminMetricsController,
  listUsersController,
  updateUserController,
  listModerationCasesController,
  updateModerationCaseController
}
