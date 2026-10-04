import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { requireAuth } from '../../../../lib/security.js'
import { env } from '../../../../config/env.js'
import { listRegistrationCampusesService, listRegistrationCoursesService, loginUserService, logoutUserService, readAuthenticatedUserService, registerUserService, requestEmailOtpService, searchRegistrationLocationsService, verifyEmailOtpService } from '../../../../adapters/services/auth/index.js'
import { loginUserSchema, registerUserSchema, requestEmailOtpSchema, verifyEmailOtpSchema } from '../../../validators/auth/index.js'

function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.AUTH_SESSION_TTL_SECONDS
  })
}

async function registerUserController(request: FastifyRequest, reply: FastifyReply) {
  const result = await registerUserService(request.server, requireBody(registerUserSchema, request))
  setSessionCookie(reply, result.token)
  return reply.code(201).send(result)
}
async function listRegistrationCampusesController(request: FastifyRequest, reply: FastifyReply) { const query = String((request.query as Record<string, unknown>).q || '').slice(0, 100); return reply.send(await listRegistrationCampusesService(query)) }
async function listRegistrationCoursesController(request: FastifyRequest, reply: FastifyReply) { const query = String((request.query as Record<string, unknown>).q || '').slice(0, 100); return reply.send(await listRegistrationCoursesService(query)) }
async function searchRegistrationLocationsController(request: FastifyRequest, reply: FastifyReply) { const query = String((request.query as Record<string, unknown>).q || '').trim(); if (query.length < 3) return reply.send({ results: [] }); return reply.send(await searchRegistrationLocationsService(query)) }

async function loginUserController(request: FastifyRequest, reply: FastifyReply) {
  const result = await loginUserService(request.server, requireBody(loginUserSchema, request))
  setSessionCookie(reply, result.token)
  return reply.send(result)
}

async function requestEmailOtpController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(202).send(await requestEmailOtpService(requireBody(requestEmailOtpSchema, request)))
}

async function verifyEmailOtpController(request: FastifyRequest, reply: FastifyReply) {
  const result = await verifyEmailOtpService(request.server, requireBody(verifyEmailOtpSchema, request))
  if ('token' in result && typeof result.token === 'string') setSessionCookie(reply, result.token)
  return reply.send(result)
}

async function logoutUserController(request: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie(env.AUTH_COOKIE_NAME, { path: '/' })
  try {
    await requireAuth(request, { allowCookieForUnsafeMethod: true })
    await logoutUserService(request.authUser?.sessionId)
  } catch {
    // Logout is idempotent: an absent, expired, or already-revoked session is
    // still successfully cleared in the browser.
  }
  return reply.code(204).send()
}

async function readAuthenticatedUserController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request)
  return reply.send(await readAuthenticatedUserService(request.authUser?.id))
}

export {
  registerUserController,
  listRegistrationCampusesController,
  listRegistrationCoursesController,
  searchRegistrationLocationsController,
  loginUserController,
  logoutUserController,
  requestEmailOtpController,
  verifyEmailOtpController,
  readAuthenticatedUserController
}
