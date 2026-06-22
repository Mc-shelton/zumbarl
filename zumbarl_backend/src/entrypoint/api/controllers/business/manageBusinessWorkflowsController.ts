import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  createApplicantReviewEventService,
  createBusinessOpportunityService,
  createBusinessIndustryService,
  createOpportunityDeliverablesService,
  awardApplicantProjectService,
  fundBusinessOpportunityService,
  inviteOpportunityBiddersService,
  listBusinessOpportunitiesService,
  listBusinessIndustriesService,
  listOpportunityDeliverablesService,
  listOpportunityApplicantsService,
  publishBusinessOpportunityService,
  readOpportunityDeliverableService,
  readBusinessDashboardService,
  readBusinessKycService,
  readBusinessProfileService,
  submitBusinessKycService,
  updateBusinessOpportunityService,
  updateBusinessProfileService
} from '../../../../adapters/services/business/index.js'
import { z } from 'zod'
import {
  createOpportunityDeliverablesSchema,
  createBusinessIndustrySchema,
  createOpportunitySchema,
  fundOpportunitySchema,
  inviteOpportunityBiddersSchema,
  reviewApplicantSchema,
  submitBusinessKycSchema,
  updateOpportunitySchema,
  updateBusinessProfileSchema
} from '../../../validators/business/index.js'

const deliverableParamSchema = z.object({
  id: z.string().min(1),
  deliverableId: z.string().min(1)
})

async function readBusinessDashboardController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readBusinessDashboardService(request.authUser?.businessId))
}

async function readBusinessProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readBusinessProfileService(request.authUser?.businessId))
}

async function updateBusinessProfileController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await updateBusinessProfileService(request.authUser?.businessId, requireBody(updateBusinessProfileSchema, request)))
}

async function readBusinessKycController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await readBusinessKycService(request.authUser?.businessId))
}

async function submitBusinessKycController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await submitBusinessKycService(request.authUser?.businessId, requireBody(submitBusinessKycSchema, request), request.authUser?.id))
}

async function listBusinessIndustriesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listBusinessIndustriesService(request.query as Record<string, unknown>))
}

async function createBusinessIndustryController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createBusinessIndustryService(requireBody(createBusinessIndustrySchema, request), request.authUser?.id))
}

async function listBusinessOpportunitiesController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listBusinessOpportunitiesService(request.authUser?.businessId, request.query as Record<string, unknown>))
}

async function createBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createBusinessOpportunityService(request.authUser?.businessId, request.authUser?.id, requireBody(createOpportunitySchema, request)))
}

async function updateBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateBusinessOpportunityService(id, request.authUser?.businessId, request.authUser?.id, requireBody(updateOpportunitySchema, request)))
}

async function publishBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await publishBusinessOpportunityService(id, request.authUser?.id))
}

async function fundBusinessOpportunityController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await fundBusinessOpportunityService(id, requireBody(fundOpportunitySchema, request)))
}

async function listOpportunityDeliverablesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await listOpportunityDeliverablesService(id))
}

async function readOpportunityDeliverableController(request: FastifyRequest, reply: FastifyReply) {
  const { id, deliverableId } = requireParams(deliverableParamSchema, request)
  return reply.send(await readOpportunityDeliverableService(id, deliverableId))
}

async function createOpportunityDeliverablesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await createOpportunityDeliverablesService(id, requireBody(createOpportunityDeliverablesSchema, request), request.authUser?.id))
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
  readBusinessKycController,
  submitBusinessKycController,
  listBusinessIndustriesController,
  createBusinessIndustryController,
  listBusinessOpportunitiesController,
  createBusinessOpportunityController,
  updateBusinessOpportunityController,
  publishBusinessOpportunityController,
  fundBusinessOpportunityController,
  listOpportunityDeliverablesController,
  readOpportunityDeliverableController,
  createOpportunityDeliverablesController,
  inviteOpportunityBiddersController,
  listOpportunityApplicantsController,
  createApplicantReviewEventController,
  awardApplicantProjectController
}
