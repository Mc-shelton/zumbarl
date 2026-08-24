import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import type { AuthUser } from '../../../lib/security.js'
import { titleCase } from '../../../shared/text/titleCase.js'
import { marketingCampaignsRepository } from '../../repositories/marketing/index.js'
import { renameCampaignMaterialUploadService } from '../uploads/index.js'
import { fetchCampaignLinkPreview } from './fetchLinkPreview.js'
import { verifyCampaignProof } from './verifyCampaignProof.js'

async function normalizeCampaignMaterials(campaignId: string, campaignTitle: string, materials: unknown) {
  if (!Array.isArray(materials)) return materials

  return Promise.all(materials.map(async (material) => {
    if (!material || typeof material !== 'object' || Array.isArray(material)) return material
    const record = material as Record<string, any>
    if (!record.id) return record

    const upload = await renameCampaignMaterialUploadService(String(record.id), campaignId, campaignTitle)
    if (!upload || upload.fileName === record.fileName) return record
    return {
      ...record,
      title: upload.fileName,
      fileName: upload.fileName,
      storageKey: upload.storageKey,
      url: upload.url,
      previewUrl: upload.url,
      metadata: upload.metadata
    }
  }))
}

function listMarketingCampaignsService(query: Record<string, unknown>, actor?: { businessId?: string; studentId?: string; role?: string }) {
  const audience = actor?.studentId ? 'student' : actor?.businessId ? 'business' : 'admin'
  return marketingCampaignsRepository.listCampaigns(query, { businessId: actor?.businessId, studentId: actor?.studentId, audience })
}

async function createMarketingCampaignService(businessId: string | undefined, payload: Record<string, any>) {
  const campaignPayload = payload.destinationUrl
    ? { ...payload, linkPreview: await fetchCampaignLinkPreview(payload.destinationUrl, payload) }
    : payload
  const campaign = await marketingCampaignsRepository.createCampaign({
    ...campaignPayload,
    businessId,
    acceptedBudget: 0,
    inviteOnlyUntil: null,
    workflow: { proofSubmitted: false, statsGenerated: false, endorsed: false }
  })
  const materials = await normalizeCampaignMaterials(campaign.id, campaign.title, campaign.materials)
  const savedCampaign = materials === campaign.materials
    ? campaign
    : await marketingCampaignsRepository.updateCampaign(campaign.id, { materials }) ?? campaign
  await marketingCampaignsRepository.syncZumbarlAd(campaign.id)
  return savedCampaign
}

async function readMarketingCampaignService(id: string, actor?: AuthUser) {
  const detail = await marketingCampaignsRepository.readCampaignDetail(id, actor?.studentId)
  if (!detail.campaign) notFound('Campaign')
  if (actor?.businessId && detail.campaign.businessId !== actor.businessId) forbidden('This campaign belongs to another business')
  if (actor?.studentId) {
    return {
      ...detail,
      invites: detail.invites.filter((item: Record<string, any>) => item.studentId === actor.studentId),
      acceptances: detail.acceptances.filter((item: Record<string, any>) => item.studentId === actor.studentId),
      proofs: detail.proofs.filter((item: Record<string, any>) => item.studentId === actor.studentId)
    }
  }
  return detail
}

async function updateMarketingCampaignService(id: string, actor: AuthUser | undefined, patch: Record<string, any>) {
  const detail = await marketingCampaignsRepository.readCampaignDetail(id)
  if (!detail.campaign) notFound('Campaign')
  if (actor?.businessId && detail.campaign.businessId !== actor.businessId) forbidden('This campaign belongs to another business')

  const acceptedCount = detail.acceptances.filter((item: Record<string, any>) => item.status === 'accepted').length
  if (patch.creatorsLimit != null && Number(patch.creatorsLimit) < acceptedCount) {
    throw new ApiError(409, `This campaign already has ${acceptedCount} creator${acceptedCount === 1 ? '' : 's'}.`, 'CAMPAIGN_CAPACITY_CONFLICT')
  }
  if (patch.budgetAmount != null && Number(patch.budgetAmount) < Number(detail.campaign.acceptedBudget || 0)) {
    throw new ApiError(409, 'The campaign budget cannot be lower than the amount already committed.', 'CAMPAIGN_BUDGET_CONFLICT')
  }

  const enrichedPatch = 'destinationUrl' in patch
    ? {
        ...patch,
        linkPreview: patch.destinationUrl
          ? await fetchCampaignLinkPreview(String(patch.destinationUrl), { ...detail.campaign, ...patch })
          : null
      }
    : patch
  const campaignTitle = titleCase(String(enrichedPatch.title ?? detail.campaign.title))
  const sourceMaterials = enrichedPatch.materials ?? detail.campaign.materials
  const materials = await normalizeCampaignMaterials(id, campaignTitle, sourceMaterials)
  const nextPatch = materials === sourceMaterials ? enrichedPatch : { ...enrichedPatch, materials }
  const campaign = await marketingCampaignsRepository.updateCampaign(id, nextPatch) ?? notFound('Campaign')
  await marketingCampaignsRepository.syncZumbarlAd(id)
  return campaign
}

async function fundMarketingCampaignService(id: string) {
  return await marketingCampaignsRepository.fundCampaign(id) ?? notFound('Campaign')
}

async function publishMarketingCampaignService(id: string) {
  return await marketingCampaignsRepository.publishCampaign(id) ?? notFound('Campaign')
}

function listZumbarlAdsService(query: Record<string, unknown>) {
  return marketingCampaignsRepository.listZumbarlAds(query)
}

async function publishZumbarlAdService(id: string, actor?: AuthUser) {
  const ad = await marketingCampaignsRepository.publishZumbarlAd(id, actor?.id)
  if (!ad) throw new ApiError(409, 'Only pending Zumbarl Ads can be published.', 'ZUMBARL_AD_NOT_PUBLISHABLE')
  return ad
}

async function inviteCampaignersService(id: string, payload: Record<string, any>) {
  return await marketingCampaignsRepository.createCampaignInvites(id, payload) ?? notFound('Campaign')
}

async function acceptMarketingCampaignService(id: string, studentId: string | undefined) {
  const result = await marketingCampaignsRepository.acceptCampaign(id, studentId) ?? notFound('Campaign')
  if ('reason' in result && result.reason === 'student_profile_not_found') notFound('Student profile')
  return result
}

async function submitMarketingCampaignProofService(id: string, actor: AuthUser | undefined, payload: Record<string, any>) {
  if (!actor?.id || !actor.studentId) forbidden('A student profile is required')
  const campaign = await marketingCampaignsRepository.findCampaign(id)
  if (!campaign) notFound('Campaign')
  const verifiedPayload = await verifyCampaignProof(campaign, actor, payload)
  return await marketingCampaignsRepository.submitCampaignProof(id, actor.studentId, verifiedPayload) ?? notFound('Campaign')
}

async function generateMarketingCampaignStatsService(id: string) {
  const detail = await marketingCampaignsRepository.readCampaignDetail(id)
  if (!detail.campaign) notFound('Campaign')
  const proofs = detail.proofs
  const stats = {
    reach: proofs.reduce((sum, proof) => sum + Number(proof.reach || 0), 0),
    engagement: proofs.reduce((sum, proof) => sum + Number(proof.engagement || 0), 0),
    trackingClicks: detail.acceptances.reduce((sum, acceptance) => sum + Number(acceptance.trackingClicks || 0), 0),
    trackingVisits: detail.acceptances.reduce((sum, acceptance) => sum + Number(acceptance.trackingVisits || 0), 0),
    verifiedProofs: proofs.filter((proof) => proof.status === 'verified_screenshot').length,
    needsReview: proofs.filter((proof) => proof.status === 'needs_review').length,
    proofQuality: proofs.length && proofs.every((proof) => proof.status === 'verified_screenshot') ? 'verified' : proofs.length ? 'reviewable' : 'pending'
  }
  return await marketingCampaignsRepository.updateCampaign(id, { stats, workflow: { proofSubmitted: proofs.length > 0, statsGenerated: true, endorsed: false } }) ?? notFound('Campaign')
}

async function trackMarketingCampaignClickService(token: string, visitorHash: string) {
  return await marketingCampaignsRepository.trackCampaignClick(token, visitorHash) ?? notFound('Tracking link')
}

async function readMarketingCampaignTrackingPageService(token: string) {
  return await marketingCampaignsRepository.readCampaignTrackingPage(token) ?? notFound('Tracking link')
}

async function endorseMarketingCampaignersService(id: string, payload: Record<string, any>) {
  return await marketingCampaignsRepository.endorseCampaigners(id, payload) ?? notFound('Campaign')
}

export {
  listMarketingCampaignsService,
  createMarketingCampaignService,
  readMarketingCampaignService,
  updateMarketingCampaignService,
  fundMarketingCampaignService,
  publishMarketingCampaignService,
  listZumbarlAdsService,
  publishZumbarlAdService,
  inviteCampaignersService,
  acceptMarketingCampaignService,
  submitMarketingCampaignProofService,
  generateMarketingCampaignStatsService,
  trackMarketingCampaignClickService,
  readMarketingCampaignTrackingPageService,
  endorseMarketingCampaignersService
}
