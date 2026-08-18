import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { requireAuth } from '../../../../lib/security.js'
import { listRegistrationCampusesService, loginUserService, readAuthenticatedUserService, registerUserService, searchRegistrationLocationsService } from '../../../../adapters/services/auth/index.js'
import { loginUserSchema, registerUserSchema } from '../../../validators/auth/index.js'

async function registerUserController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await registerUserService(request.server, requireBody(registerUserSchema, request)))
}
async function listRegistrationCampusesController(request: FastifyRequest, reply: FastifyReply) { const query = String((request.query as Record<string, unknown>).q || '').slice(0, 100); return reply.send(await listRegistrationCampusesService(query)) }
async function searchRegistrationLocationsController(request: FastifyRequest, reply: FastifyReply) { const query = String((request.query as Record<string, unknown>).q || '').trim(); if (query.length < 3) return reply.send({ results: [] }); return reply.send(await searchRegistrationLocationsService(query)) }

async function loginUserController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await loginUserService(request.server, requireBody(loginUserSchema, request)))
}

async function readAuthenticatedUserController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request)
  return reply.send(await readAuthenticatedUserService(request.authUser?.id))
}

export {
  registerUserController,
  listRegistrationCampusesController,
  searchRegistrationLocationsController,
  loginUserController,
  readAuthenticatedUserController
}
