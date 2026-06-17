import type { FastifyReply } from 'fastify'

function sendJsonResponse(reply: FastifyReply, payload: unknown, statusCode = 200) {
  return reply.code(statusCode).send(payload)
}

export {
  sendJsonResponse
}
