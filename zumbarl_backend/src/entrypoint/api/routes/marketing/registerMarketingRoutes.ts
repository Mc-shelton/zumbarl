import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  acceptMarketingCampaignController,
  createMarketingCampaignController,
  endorseMarketingCampaignersController,
  fundMarketingCampaignController,
  generateMarketingCampaignStatsController,
  inviteCampaignersController,
  listZumbarlAdsController,
  publishZumbarlAdController,
  listMarketingCampaignsController,
  publishMarketingCampaignController,
  readMarketingCampaignController,
  readMarketingCampaignTrackingClientController,
  readMarketingCampaignTrackingPageController,
  submitMarketingCampaignProofController,
  trackMarketingCampaignClickController,
  updateMarketingCampaignController
} from '../../controllers/marketing/index.js'

async function registerMarketingRoutes(app: FastifyInstance) {
  const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin)
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  const studentOnly = requireRoles(...roleGroups.student, ...roleGroups.admin)
  const adminOnly = requireRoles(...roleGroups.admin)
  app.get('/track-client.js', readMarketingCampaignTrackingClientController)
  app.get('/track/:token', readMarketingCampaignTrackingPageController)
  app.post('/track/:token/click', trackMarketingCampaignClickController)
  app.get('/campaigns', { preHandler: anyActor }, listMarketingCampaignsController)
  app.get('/ads', { preHandler: adminOnly }, listZumbarlAdsController)
  app.post('/ads/:id/publish', { preHandler: adminOnly }, publishZumbarlAdController)
  app.post('/campaigns', { preHandler: businessOnly }, createMarketingCampaignController)
  app.get('/campaigns/:id', { preHandler: anyActor }, readMarketingCampaignController)
  app.patch('/campaigns/:id', { preHandler: businessOnly }, updateMarketingCampaignController)
  app.post('/campaigns/:id/fund', { preHandler: businessOnly }, fundMarketingCampaignController)
  app.post('/campaigns/:id/publish', { preHandler: businessOnly }, publishMarketingCampaignController)
  app.post('/campaigns/:id/invites', { preHandler: businessOnly }, inviteCampaignersController)
  app.post('/campaigns/:id/accept', { preHandler: studentOnly }, acceptMarketingCampaignController)
  app.post('/campaigns/:id/proofs', { preHandler: studentOnly }, submitMarketingCampaignProofController)
  app.post('/campaigns/:id/stats', { preHandler: businessOnly }, generateMarketingCampaignStatsController)
  app.post('/campaigns/:id/endorsements', { preHandler: businessOnly }, endorseMarketingCampaignersController)
}

export {
  registerMarketingRoutes
}
