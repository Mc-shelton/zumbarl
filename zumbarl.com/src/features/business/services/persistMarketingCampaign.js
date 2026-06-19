import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function normalizeMarketingCampaign(campaign) {
  return {
    ...campaign,
    budgetAmount: campaign.budgetAmount || Number(String(campaign.budget || '').replace(/[^\d.]/g, '')) || 0,
    currency: campaign.currency || 'KES',
    payoutPerCampaigner: campaign.payoutPerCampaigner || 0,
    minimumFollowers: campaign.minimumFollowers || 0,
    platforms: campaign.platforms?.length ? campaign.platforms : ['Instagram'],
    proofRequirements: campaign.proofRequirements || [],
    status: String(campaign.status || '').toLowerCase() === 'draft' ? 'draft' : 'published',
  }
}

async function listBackendMarketingCampaigns() {
  return sendZumbarlApiRequest('/marketing/campaigns')
}

async function readBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}`)
}

async function createBackendMarketingCampaign(campaign) {
  return sendZumbarlApiRequest('/marketing/campaigns', {
    method: 'POST',
    body: JSON.stringify(normalizeMarketingCampaign(campaign)),
  })
}

async function acceptBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/accept`, {
    method: 'POST',
  })
}

async function submitBackendMarketingCampaignProof(campaignId, proof) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/proofs`, {
    method: 'POST',
    body: JSON.stringify(proof),
  })
}

export {
  acceptBackendMarketingCampaign,
  createBackendMarketingCampaign,
  listBackendMarketingCampaigns,
  readBackendMarketingCampaign,
  submitBackendMarketingCampaignProof,
}
