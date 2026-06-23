import { notFound } from '../../../lib/http.js'
import { deleteCacheByPattern, readCache, writeCache } from '../../cache/index.js'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'

const DEFAULT_BUSINESS_INDUSTRIES = [
  'Accounting and bookkeeping',
  'Agriculture and food production',
  'Beauty and personal care',
  'Consulting and professional services',
  'Creative agency',
  'Digital marketing',
  'Education and training',
  'Events and activations',
  'Fashion and retail',
  'Financial services',
  'Food and hospitality',
  'Health and wellness',
  'Logistics and delivery',
  'Media and entertainment',
  'Non-profit and social impact',
  'Real estate',
  'Technology and software',
  'Tourism and travel'
]

const PIPELINE_STAGES = [
  { key: 'shortlisted', label: 'Shortlisted', tone: 'purple' },
  { key: 'interview_scheduled', label: 'Interview', tone: 'orange' },
  { key: 'assessment', label: 'Assessment', tone: 'green' },
  { key: 'offer', label: 'Offer', tone: 'blue' },
  { key: 'awarded', label: 'Awarded', tone: 'pink' }
]

const STATUS_TONES: Record<string, string> = {
  awarded: 'blue',
  shortlisted: 'purple',
  interview_scheduled: 'orange',
  assessment: 'green',
  new: 'purple',
  submitted: 'green',
  pending: 'orange'
}

function getKycRequirements(kyc: Record<string, any> | null) {
  const checks = [
    { key: 'businessIdentity', label: 'Business identity verification', complete: Boolean(kyc?.registeredBusinessName && kyc?.businessRegistrationNumber && kyc?.incorporationCertificate && kyc?.kraPinCertificate) },
    { key: 'representative', label: 'Owner or representative verification', complete: Boolean(kyc?.representativeFullName && kyc?.representativeIdDocument && kyc?.representativePhone && kyc?.representativeEmail && kyc?.representativeRole) },
    { key: 'businessDetails', label: 'Business details', complete: Boolean(kyc?.industry && kyc?.companySize && kyc?.physicalAddress && kyc?.yearEstablished) },
    { key: 'financial', label: 'Financial verification', complete: Boolean(kyc?.mpesaTillOrPaybill || kyc?.bankAccountDetails) },
    { key: 'trustSignals', label: 'Trust signals', complete: Boolean(kyc?.linkedInCompanyPage || kyc?.socialMediaPresence || kyc?.verifiedCompanyReferral) }
  ]
  const completed = checks.filter((item) => item.complete).length

  return {
    status: kyc?.status ?? 'not_started',
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    checks
  }
}

function getReadableStatus(status: string | undefined) {
  return String(status || 'new')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getDateLabel(value: string | undefined) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toRecentApplicant(bid: Record<string, any>) {
  const name = bid.studentName || bid.applicantName || bid.creatorName || 'Student applicant'
  const status = bid.status || bid.action || 'new'
  return {
    id: bid.id,
    name,
    role: bid.role || bid.headline || bid.opportunityTitle || 'Applicant',
    school: bid.school || bid.campus || 'Campus not provided',
    score: bid.score ?? bid.zumbarlScore ?? 0,
    match: bid.match || (bid.score >= 70 ? 'High Match' : 'New applicant'),
    applied: getDateLabel(bid.createdAt || bid.appliedAt),
    status: getReadableStatus(status),
    tone: STATUS_TONES[status] ?? 'purple',
    avatar: bid.avatar || '/assets/index/bee_nobg.png'
  }
}

function getApplicantInsights(bids: Record<string, any>[]) {
  const categoryCounts = bids.reduce<Record<string, number>>((counts, bid) => {
    const key = bid.category || bid.skill || bid.role || 'Other'
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const total = Math.max(bids.length, 1)
  const tones = ['purple', 'orange', 'green', 'blue']
  const insights = Object.entries(categoryCounts)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 4)
    .map(([label, count], index) => ({
      label,
      value: Math.round((count / total) * 100),
      tone: tones[index] ?? 'blue'
    }))

  return insights.length ? insights : [{ label: 'No applicant data yet', value: 0, tone: 'blue' }]
}

function getUpcomingActions(opportunities: Record<string, any>[], kycSummary: Record<string, any>) {
  const actions = []
  if (kycSummary.status !== 'verified') {
    actions.push({
      title: 'Complete business KYC',
      meta: `${kycSummary.completed}/${kycSummary.total} checks complete`,
      time: 'Required before higher-volume hiring',
      tone: 'purple'
    })
  }
  opportunities
    .filter((opportunity) => opportunity.applicationDeadline || opportunity.deadline)
    .slice(0, 3)
    .forEach((opportunity) => {
      actions.push({
        title: opportunity.title || 'Opportunity deadline',
        meta: opportunity.status || 'Open opportunity',
        time: getDateLabel(opportunity.applicationDeadline || opportunity.deadline),
        tone: 'orange'
      })
    })

  return actions
}

async function readBusinessDashboardService(businessId: string | undefined) {
  const cacheKey = `business-dashboard:v2:${businessId ?? 'all'}`
  const cachedDashboard = await readCache<Record<string, any>>(cacheKey)
  if (cachedDashboard) return cachedDashboard

  const opportunities = ((await businessWorkflowsRepository.listBusinessOpportunities(businessId, {})).data ?? []).filter(Boolean) as Record<string, any>[]
  const [businessProfile, kyc, campaigns, projects, bids, reviewEvents] = await Promise.all([
    businessWorkflowsRepository.findBusinessProfile(businessId),
    businessWorkflowsRepository.findBusinessKyc(businessId),
    businessWorkflowsRepository.listBusinessCampaigns(businessId),
    businessWorkflowsRepository.listBusinessProjects(businessId),
    businessWorkflowsRepository.listBusinessBids(businessId),
    businessWorkflowsRepository.listBusinessReviewEvents(businessId)
  ])
  const kycSummary = getKycRequirements(kyc)
  const activeOpportunities = opportunities.filter((opportunity) => !['archived', 'closed', 'completed'].includes(String(opportunity.status ?? '').toLowerCase()))
  const awardedCount = bids.filter((bid) => bid.status === 'awarded').length + reviewEvents.filter((event) => event.action === 'awarded').length
  const pipelineStages = PIPELINE_STAGES.map((stage) => ({
    label: stage.label,
    tone: stage.tone,
    value: bids.filter((bid) => bid.status === stage.key).length + reviewEvents.filter((event) => event.action === stage.key).length,
    trend: '-'
  }))
  const dashboard = {
    business: businessProfile,
    kyc: kycSummary,
    metrics: [
      { icon: 'briefcase', label: 'Active Opportunities', meta: `${opportunities.length} total`, tone: 'purple', value: activeOpportunities.length },
      { icon: 'users', label: 'Total Applicants', meta: `${bids.length} from database`, tone: 'orange', value: bids.length },
      { icon: 'trending', label: 'In Pipeline', meta: `${projects.length} projects`, tone: 'green', value: bids.filter((bid) => !['awarded', 'rejected', 'removed'].includes(String(bid.status ?? '').toLowerCase())).length },
      { icon: 'check', label: 'Hires / Awarded', meta: `${campaigns.length} campaigns`, tone: 'blue', value: awardedCount }
    ],
    pipelineStages,
    applicants: bids.slice(0, 6).map(toRecentApplicant),
    insights: getApplicantInsights(bids),
    upcomingActions: getUpcomingActions(opportunities, kycSummary),
    opportunities: opportunities.slice(0, 10),
    campaigns: campaigns.slice(0, 10),
    projects: projects.slice(0, 10)
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

async function readBusinessKycService(businessId: string | undefined) {
  const kyc = await businessWorkflowsRepository.findBusinessKyc(businessId)
  return {
    data: kyc,
    summary: getKycRequirements(kyc)
  }
}

async function submitBusinessKycService(businessId: string | undefined, payload: Record<string, any>, actorId: string | undefined) {
  const kyc = await businessWorkflowsRepository.upsertBusinessKycWithEvent(businessId ?? '', payload, actorId) ?? notFound('Business profile')
  await deleteCacheByPattern(`business-dashboard:${businessId ?? '*'}*`)
  return {
    data: kyc,
    summary: getKycRequirements(kyc)
  }
}

async function listBusinessIndustriesService(query: Record<string, unknown>) {
  await businessWorkflowsRepository.ensureIndustries(DEFAULT_BUSINESS_INDUSTRIES)
  return businessWorkflowsRepository.listIndustries(query)
}

async function createBusinessIndustryService(payload: Record<string, any>, actorId: string | undefined) {
  await businessWorkflowsRepository.ensureIndustries(DEFAULT_BUSINESS_INDUSTRIES)
  return businessWorkflowsRepository.createIndustryWithEvent(payload, actorId)
}

function listBusinessOpportunitiesService(businessId: string | undefined, query: Record<string, unknown>) {
  return businessWorkflowsRepository.listBusinessOpportunities(businessId, query)
}

async function createBusinessOpportunityService(businessId: string | undefined, actorId: string | undefined, payload: Record<string, any>) {
  const budgetAmount = (payload.budgetAmount ?? Number(String(payload.budget ?? '').replace(/[^\d.]/g, ''))) || 0
  const opportunity = await businessWorkflowsRepository.createOpportunityWithEvent({
    ...payload,
    budgetAmount,
    businessId,
    status: payload.visibility === 'draft' ? 'draft' : payload.status ?? 'open',
    applicants: 0,
    escrowStatus: 'unfunded'
  }, actorId)
  await deleteCacheByPattern(`business-dashboard:${businessId ?? '*'}*`)
  return opportunity
}

async function updateBusinessOpportunityService(id: string, businessId: string | undefined, actorId: string | undefined, payload: Record<string, any>) {
  const existingOpportunity = await businessWorkflowsRepository.findOpportunity(id) ?? notFound('Opportunity')
  if (businessId && existingOpportunity.businessId && existingOpportunity.businessId !== businessId) notFound('Opportunity')

  const budgetAmount = payload.budgetAmount ?? (
    payload.budget === undefined ? existingOpportunity.budgetAmount : Number(String(payload.budget ?? '').replace(/[^\d.]/g, '')) || 0
  )
  const patch = {
    ...payload,
    budgetAmount,
    businessId: existingOpportunity.businessId ?? businessId,
    status: payload.visibility === 'draft' ? 'draft' : payload.status ?? existingOpportunity.status
  }
  const opportunity = await businessWorkflowsRepository.updateOpportunityWithEvent(id, patch, actorId) ?? notFound('Opportunity')
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
  const { opportunity, escrow } = funded as { opportunity: Record<string, any>, escrow: Record<string, any> }
  await deleteCacheByPattern(`business-dashboard:${opportunity.businessId ?? '*'}*`)
  return escrow
}

async function listOpportunityDeliverablesService(id: string) {
  await businessWorkflowsRepository.findOpportunity(id) ?? notFound('Opportunity')
  return { data: await businessWorkflowsRepository.listOpportunityDeliverables(id) }
}

async function readOpportunityDeliverableService(id: string, deliverableId: string) {
  await businessWorkflowsRepository.findOpportunity(id) ?? notFound('Opportunity')
  const deliverable = await businessWorkflowsRepository.findOpportunityDeliverable(deliverableId) ?? notFound('Deliverable') as Record<string, any>
  if (deliverable.opportunityId !== id) notFound('Deliverable')
  return deliverable
}

async function createOpportunityDeliverablesService(id: string, payload: Record<string, any>, actorId: string | undefined) {
  const result = await businessWorkflowsRepository.createOpportunityDeliverablesWithEvent(id, payload, actorId) ?? notFound('Opportunity')
  if (!result.opportunity) notFound('Opportunity')
  await deleteCacheByPattern(`business-dashboard:${result.opportunity.businessId ?? '*'}*`)
  return result
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
  readBusinessKycService,
  submitBusinessKycService,
  listBusinessIndustriesService,
  createBusinessIndustryService,
  listBusinessOpportunitiesService,
  createBusinessOpportunityService,
  updateBusinessOpportunityService,
  publishBusinessOpportunityService,
  fundBusinessOpportunityService,
  listOpportunityDeliverablesService,
  readOpportunityDeliverableService,
  createOpportunityDeliverablesService,
  inviteOpportunityBiddersService,
  listOpportunityApplicantsService,
  createApplicantReviewEventService,
  awardApplicantProjectService
}
