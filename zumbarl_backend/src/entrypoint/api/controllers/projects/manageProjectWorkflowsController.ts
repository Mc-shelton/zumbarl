import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  acceptProjectApplicationService,
  activateMilestoneService,
  applyToProjectService,
  createMilestoneService,
  createProjectService,
  createProjectTaskService,
  fundMilestoneService,
  listProjectsService,
  readProjectWorkspaceService,
  reviewDeliverableService,
  updateProjectTaskService
} from '../../../../adapters/services/projects/index.js'
import { applyToProjectSchema, createMilestoneSchema, createProjectSchema, createProjectTaskSchema, reviewDeliverableSchema } from '../../../validators/projects/index.js'

async function listProjectsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProjectsService(request.query as Record<string, unknown>))
}

async function createProjectController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createProjectService(request.authUser?.businessId, requireBody(createProjectSchema, request)))
}

async function readProjectWorkspaceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readProjectWorkspaceService(id))
}

async function applyToProjectController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await applyToProjectService(id, request.authUser?.studentId, requireBody(applyToProjectSchema, request)))
}

async function acceptProjectApplicationController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await acceptProjectApplicationService(id))
}

async function createMilestoneController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createMilestoneService(id, requireBody(createMilestoneSchema, request)))
}

async function fundMilestoneController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await fundMilestoneService(id))
}

async function activateMilestoneController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await activateMilestoneService(id))
}

async function createProjectTaskController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createProjectTaskService(id, requireBody(createProjectTaskSchema, request)))
}

async function updateProjectTaskController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateProjectTaskService(id, requireBody(createProjectTaskSchema.partial(), request)))
}

async function reviewDeliverableController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await reviewDeliverableService(id, requireBody(reviewDeliverableSchema, request)))
}

export {
  listProjectsController,
  createProjectController,
  readProjectWorkspaceController,
  applyToProjectController,
  acceptProjectApplicationController,
  createMilestoneController,
  fundMilestoneController,
  activateMilestoneController,
  createProjectTaskController,
  updateProjectTaskController,
  reviewDeliverableController
}
