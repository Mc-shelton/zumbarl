import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  acceptMarketingCampaignService,
  createMarketingCampaignService,
  endorseMarketingCampaignersService,
  fundMarketingCampaignService,
  generateMarketingCampaignStatsService,
  inviteCampaignersService,
  listMarketingCampaignsService,
  publishMarketingCampaignService,
  readMarketingCampaignService,
  submitMarketingCampaignProofService
} from '../../../../adapters/services/marketing/index.js'
import { createMarketingCampaignSchema, endorseCampaignersSchema, inviteCampaignersSchema, submitCampaignProofSchema } from '../../../validators/marketing/index.js'

async function listMarketingCampaignsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMarketingCampaignsService(request.query as Record<string, unknown>))
}

async function createMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createMarketingCampaignService(request.authUser?.businessId, requireBody(createMarketingCampaignSchema, request)))
}

async function readMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readMarketingCampaignService(id))
}

async function fundMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await fundMarketingCampaignService(id))
}

async function publishMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await publishMarketingCampaignService(id))
}

async function inviteCampaignersController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await inviteCampaignersService(id, requireBody(inviteCampaignersSchema, request)))
}

async function acceptMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await acceptMarketingCampaignService(id, request.authUser?.studentId))
}

async function submitMarketingCampaignProofController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await submitMarketingCampaignProofService(id, request.authUser?.studentId, requireBody(submitCampaignProofSchema, request)))
}

async function generateMarketingCampaignStatsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await generateMarketingCampaignStatsService(id))
}

async function endorseMarketingCampaignersController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.code(201).send(await endorseMarketingCampaignersService(id, requireBody(endorseCampaignersSchema, request)))
}

export {
  listMarketingCampaignsController,
  createMarketingCampaignController,
  readMarketingCampaignController,
  fundMarketingCampaignController,
  publishMarketingCampaignController,
  inviteCampaignersController,
  acceptMarketingCampaignController,
  submitMarketingCampaignProofController,
  generateMarketingCampaignStatsController,
  endorseMarketingCampaignersController
}
