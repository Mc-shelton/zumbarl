import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { subscribeToRealtimeEvents } from '../../../../lib/realtimeEvents.js'
import { createMessageSchema, messageQuerySchema } from '../../../validators/connect/index.js'
import {
  createMessageService,
  listConversationsService,
  listMessagesService
} from '../../../../adapters/services/connect/index.js'

async function listConversationsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listConversationsService(request.authUser?.id))
}

async function listMessagesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMessagesService(request.authUser?.id, messageQuerySchema.parse(request.query)))
}

async function createMessageController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createMessageService(
    request.authUser?.id,
    requireBody(createMessageSchema, request)
  ))
}

async function realtimeEventsController(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.authUser?.id
  if (!userId) return reply.code(401).send({ error: 'UNAUTHORIZED' })

  reply.hijack()
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': request.headers.origin || '*',
    Vary: 'Origin'
  })
  reply.raw.write('event: connected\ndata: {}\n\n')

  const unsubscribe = subscribeToRealtimeEvents(userId, (event) => {
    if (!reply.raw.destroyed) {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
    }
  })
  const heartbeat = setInterval(() => {
    if (!reply.raw.destroyed) reply.raw.write(': heartbeat\n\n')
  }, 15000)

  request.raw.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
}

export {
  listConversationsController,
  listMessagesController,
  createMessageController,
  realtimeEventsController
}
