import { BUSINESS_MARKETING_CAMPAIGNS } from '../marketingData'
import { BUSINESS_MARKETING_CAMPAIGN_DETAILS } from '../marketingDetailData'
import {
  acceptBackendMarketingCampaign,
  createBackendMarketingCampaign,
  listBackendMarketingCampaigns,
  readBackendMarketingCampaign,
  submitBackendMarketingCampaignProof,
} from './persistMarketingCampaign'

const STORAGE_KEY = 'zumbarl.businessMarketingCampaigns.v1'

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readCreatedCampaigns() {
  const storage = getStorage()
  if (!storage) return []

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCreatedCampaigns(campaigns) {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(campaigns))
}

function mirrorBackendWrite(writeOperation) {
  writeOperation().catch(() => {})
}

function createId(value) {
  return `campaign-${String(value || Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function getBusinessMarketingCampaigns() {
  return [...readCreatedCampaigns(), ...BUSINESS_MARKETING_CAMPAIGNS]
}

export function createBusinessMarketingCampaign(payload) {
  const campaign = {
    id: createId(`${payload.title}-${Date.now()}`),
    creators: ['ZS'],
    creatorOverflow: 0,
    engagement: '0',
    platforms: payload.platforms || ['Instagram', 'TikTok'],
    reach: '0',
    status: payload.status,
    thumbnailMeta: payload.thumbnailMeta || '#ZetechPower',
    thumbnailTitle: payload.thumbnailTitle || String(payload.title || 'NEW CAMPAIGN').toUpperCase(),
    timelineLabel: payload.status === 'Draft' ? 'Drafted' : 'Starts on',
    timelineValue: payload.startDate || 'Pending',
    tone: 'navy',
    ...payload,
  }

  writeCreatedCampaigns([campaign, ...readCreatedCampaigns()])
  mirrorBackendWrite(() => createBackendMarketingCampaign(campaign))
  return campaign
}

export function getBusinessMarketingCampaign(campaignId) {
  const campaign = getBusinessMarketingCampaigns().find((item) => item.id === campaignId)

  if (!campaign) {
    return null
  }

  return {
    ...campaign,
    detail: BUSINESS_MARKETING_CAMPAIGN_DETAILS[campaign.id] || BUSINESS_MARKETING_CAMPAIGN_DETAILS['level-up-skills'],
  }
}

export async function listBusinessMarketingCampaignsFromBackend() {
  const response = await listBackendMarketingCampaigns()
  return response?.data || []
}

export async function getBusinessMarketingCampaignFromBackend(campaignId) {
  const response = await readBackendMarketingCampaign(campaignId)
  return response?.campaign ? {
    ...response.campaign,
    detail: BUSINESS_MARKETING_CAMPAIGN_DETAILS[response.campaign.id] || BUSINESS_MARKETING_CAMPAIGN_DETAILS['level-up-skills'],
  } : null
}

export function acceptBusinessMarketingCampaign(campaignId) {
  return acceptBackendMarketingCampaign(campaignId)
}

export function submitBusinessMarketingCampaignProof(campaignId, proof) {
  return submitBackendMarketingCampaignProof(campaignId, proof)
}
