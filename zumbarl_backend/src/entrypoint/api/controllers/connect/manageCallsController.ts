import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { createCallSchema, respondToCallSchema } from '../../../validators/connect/index.js'
import {
  cancelCallService,
  createCallService,
  endCallService,
  heartbeatService,
  listIncomingCallsService,
  readCallService,
  respondToCallService
} from '../../../../adapters/services/connect/index.js'

async function heartbeatController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await heartbeatService(request.authUser?.id))
}

async function createCallController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createCallService(request.authUser?.id, requireBody(createCallSchema, request)))
}

async function listIncomingCallsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listIncomingCallsService(request.authUser?.id))
}

async function readCallController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readCallService(id, request.authUser?.id))
}

async function respondToCallController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { response } = requireBody(respondToCallSchema, request)
  return reply.send(await respondToCallService(id, request.authUser?.id, response))
}

async function cancelCallController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await cancelCallService(id, request.authUser?.id))
}

async function endCallController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await endCallService(id, request.authUser?.id))
}

export {
  heartbeatController,
  createCallController,
  listIncomingCallsController,
  readCallController,
  respondToCallController,
  cancelCallController,
  endCallController
}
