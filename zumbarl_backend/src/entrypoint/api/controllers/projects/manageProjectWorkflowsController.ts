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
  inviteProjectTeamMembersService,
  listMyProjectTeamInvitesService,
  listProjectTeamCandidatesService,
  listProjectTeamService,
  listProjectsService,
  readProjectWorkspaceService,
  respondToProjectTeamInviteService,
  reviewDeliverableService,
  completeScopeTargetService,
  updateProjectTaskService,
  proposeProjectPriceService,
  respondToProjectPriceProposalService,
  startProjectService,
  endProjectService
} from '../../../../adapters/services/projects/index.js'
import {
  applyToProjectSchema,
  createMilestoneSchema,
  createProjectSchema,
  createProjectTaskSchema,
  inviteProjectTeamMembersSchema,
  respondToProjectTeamInviteSchema,
  reviewDeliverableSchema,
  completeScopeTargetSchema,
  proposeProjectPriceSchema,
  respondToPriceProposalSchema
} from '../../../validators/projects/index.js'

async function listProjectsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listProjectsService(request.query as Record<string, unknown>))
}

async function createProjectController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createProjectService(request.authUser?.businessId, requireBody(createProjectSchema, request)))
}

async function readProjectWorkspaceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readProjectWorkspaceService(id, request.authUser))
}

async function listProjectTeamController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listProjectTeamService(id, request.authUser))
}

async function listProjectTeamCandidatesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listProjectTeamCandidatesService(id, request.query as Record<string, unknown>, request.authUser))
}

async function inviteProjectTeamMembersController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await inviteProjectTeamMembersService(
    id,
    requireBody(inviteProjectTeamMembersSchema, request),
    request.authUser
  ))
}

async function listMyProjectTeamInvitesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMyProjectTeamInvitesService(request.authUser))
}

async function respondToProjectTeamInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { action } = requireBody(respondToProjectTeamInviteSchema, request)
  return reply.send(await respondToProjectTeamInviteService(id, action, request.authUser))
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
  return reply.code(201).send(await createMilestoneService(
    id,
    requireBody(createMilestoneSchema, request),
    request.authUser
  ))
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
  return reply.send(await reviewDeliverableService(id, requireBody(reviewDeliverableSchema, request), request.authUser))
}

async function completeScopeTargetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await completeScopeTargetService(id, requireBody(completeScopeTargetSchema, request), request.authUser))
}

async function proposeProjectPriceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await proposeProjectPriceService(id, requireBody(proposeProjectPriceSchema, request), request.authUser))
}

async function respondToProjectPriceProposalController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await respondToProjectPriceProposalService(id, requireBody(respondToPriceProposalSchema, request), request.authUser))
}

async function startProjectController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await startProjectService(id, request.authUser))
}

async function endProjectController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await endProjectService(id, request.authUser))
}

export {
  listProjectsController,
  createProjectController,
  readProjectWorkspaceController,
  listProjectTeamController,
  listProjectTeamCandidatesController,
  inviteProjectTeamMembersController,
  listMyProjectTeamInvitesController,
  respondToProjectTeamInviteController,
  applyToProjectController,
  acceptProjectApplicationController,
  createMilestoneController,
  fundMilestoneController,
  activateMilestoneController,
  createProjectTaskController,
  updateProjectTaskController,
  reviewDeliverableController,
  completeScopeTargetController,
  proposeProjectPriceController,
  respondToProjectPriceProposalController,
  startProjectController,
  endProjectController
}
