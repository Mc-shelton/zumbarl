import { notFound } from '../../../lib/http.js'
import { marketingCampaignsRepository } from '../../repositories/marketing/index.js'

function listMarketingCampaignsService(query: Record<string, unknown>) {
  return marketingCampaignsRepository.listCampaigns(query)
}

function createMarketingCampaignService(businessId: string | undefined, payload: Record<string, any>) {
  return marketingCampaignsRepository.createCampaign({
    ...payload,
    businessId,
    acceptedBudget: 0,
    inviteOnlyUntil: null,
    workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false }
  })
}

async function readMarketingCampaignService(id: string) {
  const detail = await marketingCampaignsRepository.readCampaignDetail(id)
  if (!detail.campaign) notFound('Campaign')
  return detail
}

async function fundMarketingCampaignService(id: string) {
  return await marketingCampaignsRepository.fundCampaign(id) ?? notFound('Campaign')
}

async function publishMarketingCampaignService(id: string) {
  return await marketingCampaignsRepository.updateCampaign(id, { status: 'published', inviteOnlyUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }) ?? notFound('Campaign')
}

async function inviteCampaignersService(id: string, payload: Record<string, any>) {
  return await marketingCampaignsRepository.createCampaignInvites(id, payload) ?? notFound('Campaign')
}

async function acceptMarketingCampaignService(id: string, studentId: string | undefined) {
  const result = await marketingCampaignsRepository.acceptCampaign(id, studentId) ?? notFound('Campaign')
  if (result.reason === 'student_profile_not_found') notFound('Student profile')
  return result
}

async function submitMarketingCampaignProofService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  return await marketingCampaignsRepository.submitCampaignProof(id, studentId, payload) ?? notFound('Campaign')
}

async function generateMarketingCampaignStatsService(id: string) {
  const proofs = await marketingCampaignsRepository.listProofs(id)
  const stats = { reach: proofs.length * 1200, engagement: proofs.length * 180, proofQuality: proofs.length ? 'reviewable' : 'pending' }
  return await marketingCampaignsRepository.updateCampaign(id, { stats, workflow: { proofSubmitted: proofs.length > 0, statsGenerated: true, endorsed: false } }) ?? notFound('Campaign')
}

async function endorseMarketingCampaignersService(id: string, payload: Record<string, any>) {
  return await marketingCampaignsRepository.endorseCampaigners(id, payload) ?? notFound('Campaign')
}

export {
  listMarketingCampaignsService,
  createMarketingCampaignService,
  readMarketingCampaignService,
  fundMarketingCampaignService,
  publishMarketingCampaignService,
  inviteCampaignersService,
  acceptMarketingCampaignService,
  submitMarketingCampaignProofService,
  generateMarketingCampaignStatsService,
  endorseMarketingCampaignersService
}
