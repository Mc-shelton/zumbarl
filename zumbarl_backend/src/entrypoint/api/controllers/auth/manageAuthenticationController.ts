import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { requireAuth } from '../../../../lib/security.js'
import { loginUserService, readAuthenticatedUserService, registerUserService } from '../../../../adapters/services/auth/index.js'
import { loginUserSchema, registerUserSchema } from '../../../validators/auth/index.js'

async function registerUserController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await registerUserService(request.server, requireBody(registerUserSchema, request)))
}

async function loginUserController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await loginUserService(request.server, requireBody(loginUserSchema, request)))
}

async function readAuthenticatedUserController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request)
  return reply.send(await readAuthenticatedUserService(request.authUser?.id))
}

export {
  registerUserController,
  loginUserController,
  readAuthenticatedUserController
}
