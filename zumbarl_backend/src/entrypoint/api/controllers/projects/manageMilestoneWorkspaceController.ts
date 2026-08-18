import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  assignSprintTasksService,
  createMilestoneDeliverableService,
  createProjectSprintService,
  readMilestoneWorkspaceService,
  readProgramGatesService,
  readProjectTimelineService,
  settleTaskPayoutsService,
  updateMilestoneDeliverableService,
  updateMilestoneService,
  updateProjectSprintService
} from '../../../../adapters/services/projects/index.js'
import {
  assignSprintTasksSchema,
  createMilestoneDeliverableSchema,
  createProjectSprintSchema,
  updateMilestoneDeliverableSchema,
  updateMilestoneSchema,
  updateProjectSprintSchema
} from '../../../validators/projects/index.js'

const milestoneQuerySchema = z.object({ milestoneId: z.string().min(1).optional() })

async function readMilestoneWorkspaceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readMilestoneWorkspaceService(id, request.authUser))
}

async function readProjectTimelineController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readProjectTimelineService(id, request.authUser))
}

async function readProgramGatesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const query = milestoneQuerySchema.parse(request.query ?? {})
  return reply.send(await readProgramGatesService(id, query.milestoneId ?? null, request.authUser))
}

async function updateMilestoneController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateMilestoneService(
    id,
    requireBody(updateMilestoneSchema, request),
    request.authUser
  ))
}

async function createMilestoneDeliverableController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createMilestoneDeliverableService(
    id,
    requireBody(createMilestoneDeliverableSchema, request),
    request.authUser
  ))
}

async function updateMilestoneDeliverableController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateMilestoneDeliverableService(
    id,
    requireBody(updateMilestoneDeliverableSchema, request),
    request.authUser
  ))
}

async function createProjectSprintController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createProjectSprintService(
    id,
    requireBody(createProjectSprintSchema, request),
    request.authUser
  ))
}

async function updateProjectSprintController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateProjectSprintService(
    id,
    requireBody(updateProjectSprintSchema, request),
    request.authUser
  ))
}

async function assignSprintTasksController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await assignSprintTasksService(
    id,
    requireBody(assignSprintTasksSchema, request),
    request.authUser
  ))
}

async function settleTaskPayoutsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await settleTaskPayoutsService(id, request.authUser))
}

export {
  assignSprintTasksController,
  settleTaskPayoutsController,
  updateMilestoneController,
  createMilestoneDeliverableController,
  createProjectSprintController,
  readMilestoneWorkspaceController,
  readProgramGatesController,
  readProjectTimelineController,
  updateMilestoneDeliverableController,
  updateProjectSprintController
}
