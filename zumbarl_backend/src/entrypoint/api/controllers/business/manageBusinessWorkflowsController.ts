import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  createApplicantReviewEventService,
  createBusinessOpportunityService,
  awardApplicantProjectService,
  fundBusinessOpportunityService,
  inviteOpportunityBiddersService,
  listBusinessOpportunitiesService,
  listOpportunityApplicantsService,
  publishBusinessOpportunityService,
  readBusinessDashboardService,
  readBusinessProfileService,
  updateBusinessProfileService
} from '../../../../adapters/services/business/index.js'
import { createOpportunitySchema, fundOpportunitySchema, inviteOpportunityBiddersSchema, reviewApplicantSchema } from '../../../validators/business/index.js'

async function readBusinessDashboardController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readBusinessDashboardService(request.authUser?.businessId))
}

async function readBusinessProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readBusinessProfileService(request.authUser?.businessId))
}

async function updateBusinessProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await updateBusinessProfileService(request.authUser?.businessId, requireBody(createOpportunitySchema.partial(), request)))
}

async function listBusinessOpportunitiesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listBusinessOpportunitiesService(request.authUser?.businessId, request.query as Record<string, unknown>))
}

async function createBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createBusinessOpportunityService(request.authUser?.businessId, request.authUser?.id, requireBody(createOpportunitySchema, request)))
}

async function publishBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await publishBusinessOpportunityService(id, request.authUser?.id))
}

async function fundBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await fundBusinessOpportunityService(id, requireBody(fundOpportunitySchema, request)))
}

async function inviteOpportunityBiddersController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await inviteOpportunityBiddersService(id, requireBody(inviteOpportunityBiddersSchema, request), request.authUser?.id))
}

async function listOpportunityApplicantsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listOpportunityApplicantsService(id))
}

async function createApplicantReviewEventController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createApplicantReviewEventService(id, requireBody(reviewApplicantSchema, request), request.authUser?.id))
}

async function awardApplicantProjectController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await awardApplicantProjectService(id, request.authUser?.id))
}

export {
  readBusinessDashboardController,
  readBusinessProfileController,
  updateBusinessProfileController,
  listBusinessOpportunitiesController,
  createBusinessOpportunityController,
  publishBusinessOpportunityController,
  fundBusinessOpportunityController,
  inviteOpportunityBiddersController,
  listOpportunityApplicantsController,
  createApplicantReviewEventController,
  awardApplicantProjectController
}
