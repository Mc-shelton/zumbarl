import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireBody } from '../../../../lib/http.js'
import { subscribeToRealtimeEvents } from '../../../../lib/realtimeEvents.js'
import { createMessageSchema, createPageConversationSchema, createPageMessageSchema, createProjectGroupMessageSchema, messageQuerySchema, pageConversationQuerySchema } from '../../../validators/connect/index.js'
import {
  createMessageService,
  createProjectGroupMessageService,
  createPageConversationService,
  createPageMessageService,
  heartbeatService,
  listConversationsService,
  listMessageNetworkService,
  listMessagesService,
  listPageConversationsService,
  listPageMessagesService,
  listProjectGroupConversationsService,
  listProjectGroupMessagesService
} from '../../../../adapters/services/connect/index.js'

async function listConversationsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listConversationsService(request.authUser?.id))
}

async function listMessageNetworkController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMessageNetworkService(request.authUser?.id))
}

async function listPageConversationsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPageConversationsService(request.authUser?.id, pageConversationQuerySchema.parse(request.query)))
}

async function createPageConversationController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createPageConversationService(
    request.authUser?.id,
    requireBody(createPageConversationSchema, request)
  ))
}

async function listPageMessagesController(request: FastifyRequest, reply: FastifyReply) {
  const { conversationId } = request.params as { conversationId: string }
  return reply.send(await listPageMessagesService(request.authUser?.id, conversationId))
}

async function createPageMessageController(request: FastifyRequest, reply: FastifyReply) {
  const { conversationId } = request.params as { conversationId: string }
  return reply.code(201).send(await createPageMessageService(
    request.authUser?.id,
    conversationId,
    requireBody(createPageMessageSchema, request)
  ))
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

async function listProjectGroupMessagesController(request: FastifyRequest, reply: FastifyReply) {
  const { projectId } = request.params as { projectId: string }
  return reply.send(await listProjectGroupMessagesService(request.authUser?.id, projectId))
}

async function listProjectGroupConversationsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProjectGroupConversationsService(request.authUser?.id))
}

async function createProjectGroupMessageController(request: FastifyRequest, reply: FastifyReply) {
  const { projectId } = request.params as { projectId: string }
  return reply.code(201).send(await createProjectGroupMessageService(
    request.authUser?.id,
    projectId,
    requireBody(createProjectGroupMessageSchema, request)
  ))
}

async function realtimeEventsController(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.authUser?.id
  if (!userId) return reply.code(401).send({ error: 'UNAUTHORIZED' })

  await heartbeatService(userId)

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
  const heartbeat = globalThis.setInterval(() => {
    if (!reply.raw.destroyed) {
      reply.raw.write(': heartbeat\n\n')
      void heartbeatService(userId).catch((error) => request.log.warn({ error }, 'Unable to refresh realtime presence'))
    }
  }, 15000)

  request.raw.on('close', () => {
    globalThis.clearInterval(heartbeat)
    unsubscribe()
  })
}

export {
  listConversationsController,
  listMessageNetworkController,
  listMessagesController,
  createMessageController,
  listProjectGroupConversationsController,
  listProjectGroupMessagesController,
  createProjectGroupMessageController,
  listPageConversationsController,
  createPageConversationController,
  listPageMessagesController,
  createPageMessageController,
  realtimeEventsController
}
