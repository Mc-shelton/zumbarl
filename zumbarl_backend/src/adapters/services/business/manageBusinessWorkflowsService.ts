import { notFound } from '../../../lib/http.js'
import { deleteCacheByPattern, readCache, writeCache } from '../../cache/index.js'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'

async function readBusinessDashboardService(businessId: string | undefined) {
  const cacheKey = `business-dashboard:${businessId ?? 'all'}`
  const cachedDashboard = await readCache<Record<string, any>>(cacheKey)
  if (cachedDashboard) return cachedDashboard

  const opportunities = (await businessWorkflowsRepository.listBusinessOpportunities(businessId, {})).data
  const [campaigns, projects] = await Promise.all([
    businessWorkflowsRepository.listBusinessCampaigns(businessId),
    businessWorkflowsRepository.listBusinessProjects(businessId)
  ])
  const dashboard = {
    metrics: {
      opportunities: opportunities.length,
      applicants: opportunities.reduce((count, opportunity) => count + (opportunity.applicants ?? 0), 0),
      campaigns: campaigns.length,
      projects: projects.length
    },
    opportunities: opportunities.slice(0, 10),
    campaigns: campaigns.slice(0, 10)
  }
  await writeCache(cacheKey, dashboard, 60)
  return dashboard
}

function readBusinessProfileService(businessId: string | undefined) {
  return businessWorkflowsRepository.findBusinessProfile(businessId)
}

async function updateBusinessProfileService(businessId: string | undefined, payload: Record<string, any>) {
  return await businessWorkflowsRepository.updateBusinessProfile(businessId ?? '', payload) ?? notFound('Business profile')
}

function listBusinessOpportunitiesService(businessId: string | undefined, query: Record<string, unknown>) {
  return businessWorkflowsRepository.listBusinessOpportunities(businessId, query)
}

async function createBusinessOpportunityService(businessId: string | undefined, actorId: string | undefined, payload: Record<string, any>) {
  const opportunity = await businessWorkflowsRepository.createOpportunityWithEvent({
    ...payload,
    businessId,
    status: payload.visibility === 'draft' ? 'draft' : 'ready',
    applicants: 0,
    escrowStatus: 'unfunded'
  }, actorId)
  await deleteCacheByPattern(`business-dashboard:${businessId ?? '*'}*`)
  return opportunity
}

async function publishBusinessOpportunityService(id: string, actorId: string | undefined) {
  const opportunity = await businessWorkflowsRepository.publishOpportunityWithEvent(id, { status: 'published', visibility: 'public', publishedAt: new Date().toISOString() }, actorId) ?? notFound('Opportunity')
  await deleteCacheByPattern('business-dashboard:*')
  return opportunity
}

async function fundBusinessOpportunityService(id: string, payload: Record<string, any>) {
  const funded = await businessWorkflowsRepository.fundOpportunity(id, payload) ?? notFound('Opportunity')
  const { opportunity, escrow } = funded
  await deleteCacheByPattern(`business-dashboard:${opportunity.businessId ?? '*'}*`)
  return escrow
}

async function inviteOpportunityBiddersService(id: string, payload: Record<string, any>, actorId: string | undefined) {
  const result = await businessWorkflowsRepository.createOpportunityInvitesWithEvent(id, payload, actorId) ?? notFound('Opportunity')
  const { invites } = result
  return { invites }
}

async function listOpportunityApplicantsService(id: string) {
  await businessWorkflowsRepository.findOpportunity(id) ?? notFound('Opportunity')
  return { data: await businessWorkflowsRepository.listOpportunityBids(id) }
}

async function createApplicantReviewEventService(id: string, payload: Record<string, any>, actorId: string | undefined) {
  return await businessWorkflowsRepository.recordApplicantReviewEvent(id, payload, actorId) ?? notFound('Applicant bid')
}

async function awardApplicantProjectService(id: string, actorId: string | undefined) {
  const awarded = await businessWorkflowsRepository.awardApplicantProjectWithEvent(id, actorId) ?? notFound('Applicant bid')
  const { bid: updatedBid, project } = awarded
  return { bid: updatedBid, project }
}

export {
  readBusinessDashboardService,
  readBusinessProfileService,
  updateBusinessProfileService,
  listBusinessOpportunitiesService,
  createBusinessOpportunityService,
  publishBusinessOpportunityService,
  fundBusinessOpportunityService,
  inviteOpportunityBiddersService,
  listOpportunityApplicantsService,
  createApplicantReviewEventService,
  awardApplicantProjectService
}
