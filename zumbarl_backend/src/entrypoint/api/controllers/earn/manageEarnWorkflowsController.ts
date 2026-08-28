import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  acceptOpportunityInviteService,
  declineOpportunityInviteService,
  listEarnOpportunitiesService,
  readEarnOpportunityService,
  listStudentBidsService,
  listStudentInvitesService,
  listStudentInterviewsService,
  listStudentProjectsService,
  readOpportunityBidDraftService,
  readStudentTrustSnapshotService,
  readStudentInterviewService,
  respondToStudentInterviewService,
  respondToBidCounterOfferService,
  saveOpportunityBidDraftService,
  submitOpportunityBidService,
  submitProjectDeliverableService
} from '../../../../adapters/services/earn/index.js'
import { respondToBidCounterOfferSchema, respondToInterviewSchema, saveOpportunityBidDraftSchema, submitOpportunityBidSchema, submitProjectDeliverableSchema } from '../../../validators/earn/index.js'

async function listEarnOpportunitiesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listEarnOpportunitiesService(request.query as Record<string, unknown>, request.authUser?.studentId))
}

async function listStudentBidsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentBidsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function readEarnOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readEarnOpportunityService(id))
}

async function submitOpportunityBidController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await submitOpportunityBidService(id, request.authUser?.studentId, requireBody(submitOpportunityBidSchema, request)))
}

async function readOpportunityBidDraftController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readOpportunityBidDraftService(id, request.authUser?.studentId))
}

async function saveOpportunityBidDraftController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await saveOpportunityBidDraftService(
    id,
    request.authUser?.studentId,
    requireBody(saveOpportunityBidDraftSchema, request)
  ))
}

async function acceptOpportunityInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await acceptOpportunityInviteService(id, request.authUser?.studentId))
}

async function declineOpportunityInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await declineOpportunityInviteService(id, request.authUser?.studentId))
}

async function listStudentInvitesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentInvitesService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function listStudentInterviewsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentInterviewsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function readStudentInterviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readStudentInterviewService(id, request.authUser?.studentId))
}

async function respondToStudentInterviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await respondToStudentInterviewService(
    id,
    request.authUser?.studentId,
    requireBody(respondToInterviewSchema, request)
  ))
}

async function listStudentProjectsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentProjectsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function submitProjectDeliverableController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await submitProjectDeliverableService(id, request.authUser?.studentId, requireBody(submitProjectDeliverableSchema, request)))
}

async function readStudentTrustSnapshotController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readStudentTrustSnapshotService(request.authUser?.studentId))
}

async function respondToBidCounterOfferController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await respondToBidCounterOfferService(id, request.authUser?.studentId, requireBody(respondToBidCounterOfferSchema, request)))
}

export {
  listEarnOpportunitiesController,
  readEarnOpportunityController,
  listStudentBidsController,
  readOpportunityBidDraftController,
  saveOpportunityBidDraftController,
  submitOpportunityBidController,
  acceptOpportunityInviteController,
  declineOpportunityInviteController,
  listStudentInvitesController,
  listStudentInterviewsController,
  readStudentInterviewController,
  respondToStudentInterviewController,
  listStudentProjectsController,
  submitProjectDeliverableController,
  respondToBidCounterOfferController,
  readStudentTrustSnapshotController
}
