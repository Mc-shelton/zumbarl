import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  accessKnowledgeResourceService,
  createKnowledgeResourceService,
  createKnowledgeRoomMessageService,
  createKnowledgeRoomService,
  createKnowledgeSpacePostService,
  decideKnowledgeRoomMembershipRequestService,
  decideKnowledgeResourceAccessService,
  decideKnowledgeResourceSubmissionService,
  createKnowledgeSpaceService,
  decideKnowledgeMembershipRequestService,
  listKnowledgeService,
  listKnowledgeUnitsService,
  listKnowledgeManagerCandidatesService,
  listKnowledgeRoomMessagesService,
  purchaseKnowledgeResourceService,
  readKnowledgeSpaceService,
  readKnowledgeResourceCheckoutService,
  readKnowledgeRoomService,
  updateKnowledgeFollowingService,
  updateKnowledgeManagerService,
  updateKnowledgeMembershipService,
  updateKnowledgeRoomMembershipService,
  updateKnowledgeRoomService,
  updateKnowledgeSpaceService
  ,takeDownKnowledgeSpacePostService
  ,updateKnowledgeSpacePostService
} from '../../../../adapters/services/learn/index.js'
import {
  createKnowledgeResourceSchema,
  createKnowledgeRoomMessageSchema,
  createKnowledgeRoomSchema,
  createKnowledgeSpaceSchema,
  knowledgeAccessSchema,
  knowledgeAccessRequestParamsSchema,
  knowledgeManagerSchema,
  knowledgeMemberParamsSchema,
  knowledgeMembershipDecisionSchema,
  knowledgePostParamsSchema,
  knowledgePostSchema,
  knowledgePurchaseSchema,
  knowledgeResourceParamsSchema,
  updateKnowledgeRoomSchema,
  updateKnowledgePostSchema,
  updateKnowledgeSpaceSchema,
  knowledgeToggleSchema
} from '../../../validators/learn/index.js'

async function listKnowledgeController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listKnowledgeService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function listKnowledgeUnitsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listKnowledgeUnitsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function createKnowledgeSpaceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createKnowledgeSpaceService(request.authUser?.studentId, requireBody(createKnowledgeSpaceSchema, request)))
}

async function readKnowledgeSpaceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readKnowledgeSpaceService(id, request.authUser?.studentId))
}

async function createKnowledgeResourceController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createKnowledgeResourceService(request.authUser?.studentId, requireBody(createKnowledgeResourceSchema, request)))
}

async function decideKnowledgeResourceSubmissionController(request: FastifyRequest, reply: FastifyReply) {
  const { id, resourceId } = requireParams(knowledgeResourceParamsSchema, request)
  const { action } = requireBody(knowledgeMembershipDecisionSchema, request)
  return reply.send(await decideKnowledgeResourceSubmissionService(id, resourceId, request.authUser?.studentId, action))
}

async function decideKnowledgeResourceAccessController(request: FastifyRequest, reply: FastifyReply) {
  const { id, accessId } = requireParams(knowledgeAccessRequestParamsSchema, request)
  const { action } = requireBody(knowledgeMembershipDecisionSchema, request)
  return reply.send(await decideKnowledgeResourceAccessService(id, accessId, request.authUser?.studentId, action))
}

async function updateKnowledgeMembershipController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { active } = requireBody(knowledgeToggleSchema, request)
  return reply.send(await updateKnowledgeMembershipService(id, request.authUser?.studentId, active))
}

async function updateKnowledgeFollowingController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { active } = requireBody(knowledgeToggleSchema, request)
  return reply.send(await updateKnowledgeFollowingService(id, request.authUser?.studentId, active))
}

async function accessKnowledgeResourceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await accessKnowledgeResourceService(id, request.authUser?.studentId, requireBody(knowledgeAccessSchema, request)))
}

async function readKnowledgeResourceCheckoutController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readKnowledgeResourceCheckoutService(id, request.authUser?.studentId))
}

async function purchaseKnowledgeResourceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await purchaseKnowledgeResourceService(id, request.authUser?.studentId, requireBody(knowledgePurchaseSchema, request)))
}

async function listKnowledgeManagerCandidatesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const query = String((request.query as Record<string, unknown>)?.q || '')
  return reply.send(await listKnowledgeManagerCandidatesService(id, request.authUser?.studentId, query))
}

async function addKnowledgeManagerController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { studentId } = requireBody(knowledgeManagerSchema, request)
  return reply.send(await updateKnowledgeManagerService(id, studentId, request.authUser?.studentId, true))
}

async function removeKnowledgeManagerController(request: FastifyRequest, reply: FastifyReply) {
  const { id, studentId } = requireParams(knowledgeMemberParamsSchema, request)
  return reply.send(await updateKnowledgeManagerService(id, studentId, request.authUser?.studentId, false))
}

async function decideKnowledgeMembershipRequestController(request: FastifyRequest, reply: FastifyReply) {
  const { id, studentId } = requireParams(knowledgeMemberParamsSchema, request)
  const { action } = requireBody(knowledgeMembershipDecisionSchema, request)
  return reply.send(await decideKnowledgeMembershipRequestService(id, studentId, request.authUser?.studentId, action))
}

async function updateKnowledgeSpaceController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateKnowledgeSpaceService(id, request.authUser?.studentId, requireBody(updateKnowledgeSpaceSchema, request)))
}

async function createKnowledgeRoomController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createKnowledgeRoomService(
    id,
    request.authUser?.studentId,
    requireBody(createKnowledgeRoomSchema, request)
  ))
}

async function readKnowledgeRoomController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readKnowledgeRoomService(id, request.authUser?.studentId))
}

async function updateKnowledgeRoomController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateKnowledgeRoomService(
    id,
    request.authUser?.studentId,
    requireBody(updateKnowledgeRoomSchema, request)
  ))
}

async function updateKnowledgeRoomMembershipController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const { active } = requireBody(knowledgeToggleSchema, request)
  return reply.send(await updateKnowledgeRoomMembershipService(id, request.authUser?.studentId, active))
}

async function decideKnowledgeRoomMembershipRequestController(request: FastifyRequest, reply: FastifyReply) {
  const { id, studentId } = requireParams(knowledgeMemberParamsSchema, request)
  const { action } = requireBody(knowledgeMembershipDecisionSchema, request)
  return reply.send(await decideKnowledgeRoomMembershipRequestService(id, studentId, request.authUser?.studentId, action))
}

async function listKnowledgeRoomMessagesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listKnowledgeRoomMessagesService(id, request.authUser?.studentId))
}

async function createKnowledgeRoomMessageController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  const payload = requireBody(createKnowledgeRoomMessageSchema, request)
  return reply.code(201).send(await createKnowledgeRoomMessageService(id, request.authUser?.studentId, payload))
}

async function createKnowledgeSpacePostController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createKnowledgeSpacePostService(id, request.authUser?.studentId, requireBody(knowledgePostSchema, request)))
}

async function updateKnowledgeSpacePostController(request: FastifyRequest, reply: FastifyReply) {
  const { id, postId } = requireParams(knowledgePostParamsSchema, request)
  return reply.send(await updateKnowledgeSpacePostService(id, postId, request.authUser?.studentId, requireBody(updateKnowledgePostSchema, request)))
}

async function takeDownKnowledgeSpacePostController(request: FastifyRequest, reply: FastifyReply) {
  const { id, postId } = requireParams(knowledgePostParamsSchema, request)
  return reply.send(await takeDownKnowledgeSpacePostService(id, postId, request.authUser?.studentId))
}

export {
  accessKnowledgeResourceController,
  addKnowledgeManagerController,
  createKnowledgeResourceController,
  createKnowledgeRoomController,
  createKnowledgeRoomMessageController,
  createKnowledgeSpacePostController,
  createKnowledgeSpaceController,
  decideKnowledgeMembershipRequestController,
  decideKnowledgeResourceAccessController,
  decideKnowledgeResourceSubmissionController,
  decideKnowledgeRoomMembershipRequestController,
  listKnowledgeController,
  listKnowledgeUnitsController,
  listKnowledgeManagerCandidatesController,
  listKnowledgeRoomMessagesController,
  purchaseKnowledgeResourceController,
  readKnowledgeSpaceController,
  readKnowledgeResourceCheckoutController,
  readKnowledgeRoomController,
  removeKnowledgeManagerController,
  updateKnowledgeFollowingController,
  takeDownKnowledgeSpacePostController,
  updateKnowledgeSpaceController,
  updateKnowledgeSpacePostController,
  updateKnowledgeMembershipController,
  updateKnowledgeRoomController,
  updateKnowledgeRoomMembershipController
}
