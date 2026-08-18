import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
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
  readMarketingCampaignTrackingPageService,
  submitMarketingCampaignProofService,
  trackMarketingCampaignClickService,
  updateMarketingCampaignService
} from '../../../../adapters/services/marketing/index.js'
import { CAMPAIGN_TRACKING_CLIENT, renderCampaignTrackingPage } from '../../../../shared/marketing/campaignTrackingPage.js'
import { campaignVisitorCookie, createCampaignVisitorId, hashCampaignVisitorId, readCampaignVisitorId } from '../../../../shared/marketing/campaignVisitor.js'
import { createMarketingCampaignSchema, endorseCampaignersSchema, inviteCampaignersSchema, submitCampaignProofSchema, updateMarketingCampaignSchema } from '../../../validators/marketing/index.js'

async function listMarketingCampaignsController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listMarketingCampaignsService(request.query as Record<string, unknown>, request.authUser))
}

async function createMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(201).send(await createMarketingCampaignService(request.authUser?.businessId, requireBody(createMarketingCampaignSchema, request)))
}

async function readMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await readMarketingCampaignService(id, request.authUser))
}

async function updateMarketingCampaignController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = requireParams(idParamSchema, request)
  return reply.send(await updateMarketingCampaignService(id, request.authUser, requireBody(updateMarketingCampaignSchema, request)))
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
  return reply.code(201).send(await submitMarketingCampaignProofService(id, request.authUser, requireBody(submitCampaignProofSchema, request)))
}

async function trackMarketingCampaignClickController(request: FastifyRequest, reply: FastifyReply) {
  const { token } = requireParams(z.object({ token: z.string().min(12) }), request)
  const visitorId = ensureCampaignVisitor(request, reply)
  return reply
    .header('cache-control', 'no-store')
    .send(await trackMarketingCampaignClickService(token, hashCampaignVisitorId(visitorId, token)))
}

async function readMarketingCampaignTrackingPageController(request: FastifyRequest, reply: FastifyReply) {
  const { token } = requireParams(z.object({ token: z.string().min(12) }), request)
  ensureCampaignVisitor(request, reply)
  const tracking = await readMarketingCampaignTrackingPageService(token)
  const origin = `${request.protocol}://${request.headers.host || request.hostname}`
  return reply
    .header('cache-control', 'private, no-cache')
    .type('text/html; charset=utf-8')
    .send(renderCampaignTrackingPage(tracking, origin))
}

async function readMarketingCampaignTrackingClientController(_request: FastifyRequest, reply: FastifyReply) {
  return reply
    .header('cache-control', 'public, max-age=86400')
    .type('application/javascript; charset=utf-8')
    .send(CAMPAIGN_TRACKING_CLIENT)
}

function ensureCampaignVisitor(request: FastifyRequest, reply: FastifyReply) {
  const visitorId = readCampaignVisitorId(request.headers.cookie) || createCampaignVisitorId()
  const forwardedProtocol = Array.isArray(request.headers['x-forwarded-proto'])
    ? request.headers['x-forwarded-proto'][0]
    : request.headers['x-forwarded-proto']
  reply.header('set-cookie', campaignVisitorCookie(visitorId, request.protocol === 'https' || forwardedProtocol === 'https'))
  return visitorId
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
  updateMarketingCampaignController,
  fundMarketingCampaignController,
  publishMarketingCampaignController,
  inviteCampaignersController,
  acceptMarketingCampaignController,
  submitMarketingCampaignProofController,
  trackMarketingCampaignClickController,
  readMarketingCampaignTrackingPageController,
  readMarketingCampaignTrackingClientController,
  generateMarketingCampaignStatsController,
  endorseMarketingCampaignersController
}
