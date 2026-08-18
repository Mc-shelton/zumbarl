import { sendZumbarlApiRequest } from "../../../lib/sendZumbarlApiRequest";

function normalizeMarketingCampaign(campaign) {
  return {
    ...campaign,
    budgetAmount:
      campaign.budgetAmount ||
      Number(String(campaign.budget || "").replace(/[^\d.]/g, "")) ||
      0,
    currency: campaign.currency || "KES",
    payoutPerCampaigner: campaign.payoutPerCampaigner || 0,
    minimumFollowers: campaign.minimumFollowers || 0,
    minimumLikes: campaign.minimumLikes || 0,
    minimumEngagement: campaign.minimumEngagement || 0,
    platforms: campaign.platforms?.length ? campaign.platforms : ["Instagram"],
    proofRequirements: campaign.proofRequirements || [],
    status:
      String(campaign.status || "").toLowerCase() === "draft"
        ? "draft"
        : "published",
  };
}

async function listBackendMarketingCampaigns() {
  return sendZumbarlApiRequest("/marketing/campaigns");
}

async function readBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}`);
}

async function createBackendMarketingCampaign(campaign) {
  return sendZumbarlApiRequest("/marketing/campaigns", {
    method: "POST",
    body: JSON.stringify(normalizeMarketingCampaign(campaign)),
  });
}

async function updateBackendMarketingCampaign(campaignId, campaign) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(campaign),
  });
}

async function acceptBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/accept`, {
    method: "POST",
  });
}

async function submitBackendMarketingCampaignProof(campaignId, proof) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/proofs`, {
    method: "POST",
    body: JSON.stringify(proof),
  });
}

async function fundBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/fund`, {
    method: "POST",
  });
}

async function publishBackendMarketingCampaign(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/publish`, {
    method: "POST",
  });
}

async function generateBackendMarketingCampaignStats(campaignId) {
  return sendZumbarlApiRequest(`/marketing/campaigns/${campaignId}/stats`, {
    method: "POST",
  });
}

async function endorseBackendMarketingCampaigners(campaignId, payload) {
  return sendZumbarlApiRequest(
    `/marketing/campaigns/${campaignId}/endorsements`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export {
  acceptBackendMarketingCampaign,
  createBackendMarketingCampaign,
  updateBackendMarketingCampaign,
  listBackendMarketingCampaigns,
  readBackendMarketingCampaign,
  submitBackendMarketingCampaignProof,
  fundBackendMarketingCampaign,
  publishBackendMarketingCampaign,
  generateBackendMarketingCampaignStats,
  endorseBackendMarketingCampaigners,
};
