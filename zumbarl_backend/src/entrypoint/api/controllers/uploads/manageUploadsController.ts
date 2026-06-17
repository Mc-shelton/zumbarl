import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { completeUploadSchema, presignUploadSchema } from '../../../validators/uploads/index.js'
import { completeUploadService, presignUploadService } from '../../../../adapters/services/uploads/index.js'
async function presignUploadController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await presignUploadService(request.authUser?.id, requireBody(presignUploadSchema, request))) }
async function completeUploadController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await completeUploadService(id, requireBody(completeUploadSchema, request))) }

export {
  presignUploadController,
  completeUploadController
}
