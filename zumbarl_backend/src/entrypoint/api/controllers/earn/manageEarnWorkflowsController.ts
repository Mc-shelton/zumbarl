import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  acceptOpportunityInviteService,
  listEarnOpportunitiesService,
  listStudentBidsService,
  listStudentProjectsService,
  readStudentTrustSnapshotService,
  submitOpportunityBidService,
  submitProjectDeliverableService
} from '../../../../adapters/services/earn/index.js'
import { submitOpportunityBidSchema, submitProjectDeliverableSchema } from '../../../validators/earn/index.js'

async function listEarnOpportunitiesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listEarnOpportunitiesService(request.query as Record<string, unknown>))
}

async function listStudentBidsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listStudentBidsService(request.authUser?.studentId, request.query as Record<string, unknown>))
}

async function submitOpportunityBidController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await submitOpportunityBidService(id, request.authUser?.studentId, requireBody(submitOpportunityBidSchema, request)))
}

async function acceptOpportunityInviteController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await acceptOpportunityInviteService(id))
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

export {
  listEarnOpportunitiesController,
  listStudentBidsController,
  submitOpportunityBidController,
  acceptOpportunityInviteController,
  listStudentProjectsController,
  submitProjectDeliverableController,
  readStudentTrustSnapshotController
}
