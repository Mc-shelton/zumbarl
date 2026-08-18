import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  confirmDeliverableSplitService,
  readProjectSettingsService,
  updateProjectSettingsService,
  createDeliverableDependencyService,
  createDeliverableNoteService,
  resolveDeliverableDependencyService,
  declareDeliverableTaskService,
  listDeliverableTasksService,
  updateDeliverableTaskService
} from '../../../../adapters/services/projects/index.js'
import {
  updateProjectSettingsSchema,
  createDeliverableDependencySchema,
  createDeliverableNoteSchema,
  resolveDeliverableDependencySchema,
  declareDeliverableTaskSchema,
  updateDeliverableTaskSchema
} from '../../../validators/projects/index.js'
import { z } from 'zod'

const splitParamSchema = z.object({
  id: z.string().min(1),
  scopeItemId: z.string().min(1)
})

async function listDeliverableTasksController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listDeliverableTasksService(id, request.authUser))
}

async function declareDeliverableTaskController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await declareDeliverableTaskService(
    id,
    requireBody(declareDeliverableTaskSchema, request),
    request.authUser
  ))
}

async function updateDeliverableTaskController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateDeliverableTaskService(
    id,
    requireBody(updateDeliverableTaskSchema, request),
    request.authUser
  ))
}

async function confirmDeliverableSplitController(request: FastifyRequest, reply: FastifyReply) {
  const { id, scopeItemId } = requireParams(splitParamSchema, request)
  return reply.send(await confirmDeliverableSplitService(id, scopeItemId, request.authUser))
}

async function createDeliverableNoteController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createDeliverableNoteService(
    id,
    requireBody(createDeliverableNoteSchema, request),
    request.authUser
  ))
}

async function createDeliverableDependencyController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createDeliverableDependencyService(
    id,
    requireBody(createDeliverableDependencySchema, request),
    request.authUser
  ))
}

async function resolveDeliverableDependencyController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await resolveDeliverableDependencyService(
    id,
    requireBody(resolveDeliverableDependencySchema, request),
    request.authUser
  ))
}

async function readProjectSettingsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readProjectSettingsService(id, request.authUser))
}

async function updateProjectSettingsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateProjectSettingsService(
    id,
    requireBody(updateProjectSettingsSchema, request),
    request.authUser
  ))
}

export {
  confirmDeliverableSplitController,
  readProjectSettingsController,
  updateProjectSettingsController,
  createDeliverableDependencyController,
  resolveDeliverableDependencyController,
  createDeliverableNoteController,
  declareDeliverableTaskController,
  listDeliverableTasksController,
  updateDeliverableTaskController
}
