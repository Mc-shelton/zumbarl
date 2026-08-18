import { BUSINESS_MARKETING_CAMPAIGNS } from "../marketingData";
import { BUSINESS_MARKETING_CAMPAIGN_DETAILS } from "../marketingDetailData";
import {
  acceptBackendMarketingCampaign,
  createBackendMarketingCampaign,
  endorseBackendMarketingCampaigners,
  fundBackendMarketingCampaign,
  generateBackendMarketingCampaignStats,
  listBackendMarketingCampaigns,
  publishBackendMarketingCampaign,
  readBackendMarketingCampaign,
  submitBackendMarketingCampaignProof,
  updateBackendMarketingCampaign,
} from "./persistMarketingCampaign";

const STORAGE_KEY = "zumbarl.businessMarketingCampaigns.v1";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readCreatedCampaigns() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedCampaigns(campaigns) {
  const storage = getStorage();
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

function createId(value) {
  return `campaign-${String(value || Date.now())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
}

function inferOutletPlatform(url, fallback = "Social media") {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("instagram.com")) return "Instagram";
    if (hostname.includes("tiktok.com")) return "TikTok";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be"))
      return "YouTube";
    if (hostname.includes("facebook.com") || hostname.includes("fb.watch"))
      return "Facebook";
    if (hostname === "x.com" || hostname.endsWith(".x.com") || hostname.includes("twitter.com"))
      return "X";
    if (hostname.includes("linkedin.com")) return "LinkedIn";
  } catch {
    // The API validates submitted links. Retain a readable fallback if older
    // records contain a value that cannot be parsed by URL.
  }
  return fallback || "Social media";
}

function createCampaignOutlets(proofs, acceptances) {
  const creatorsByStudentId = new Map(
    acceptances.map((acceptance) => [acceptance.studentId, acceptance.student]),
  );
  const outletsByUrl = new Map();

  proofs.forEach((proof) => {
    const verification = proof.payload?.verification || {};
    const analyticsEvidence = Array.isArray(verification.analyticsEvidence)
      ? verification.analyticsEvidence
      : [];
    const uploads = Array.isArray(proof.platformUploads)
      ? proof.platformUploads
      : [];
    const candidates = [
      ...uploads
        .filter((upload) => upload?.url)
        .map((upload) => ({ url: upload.url, platform: upload.platform })),
      ...(Array.isArray(proof.links)
        ? proof.links.map((url) => ({ url, platform: "" }))
        : []),
    ];

    candidates.forEach((candidate, index) => {
      const url = String(candidate.url || "").trim();
      if (!url || outletsByUrl.has(url)) return;
      const student = creatorsByStudentId.get(proof.studentId);
      outletsByUrl.set(url, {
        id: `${proof.id || proof.studentId || "proof"}-${index}`,
        url,
        platform: inferOutletPlatform(url, candidate.platform),
        creatorName: student
          ? `${student.firstName} ${student.lastName}`.trim()
          : "Student creator",
        studentId: proof.studentId,
        submittedAt: proof.createdAt,
        status: proof.status || "submitted",
        verificationStatus: verification.status || proof.status || "submitted",
        analyticsEvidence,
        notes: proof.notes || "",
        reach: proof.reach,
        engagement: proof.engagement,
        clicks: Number(
          acceptances.find((item) => item.studentId === proof.studentId)
            ?.trackingClicks || 0,
        ),
        visits: Number(
          acceptances.find((item) => item.studentId === proof.studentId)
            ?.trackingVisits || 0,
        ),
      });
    });
  });

  return [...outletsByUrl.values()];
}

export function getBusinessMarketingCampaigns() {
  return [...readCreatedCampaigns(), ...BUSINESS_MARKETING_CAMPAIGNS];
}

export async function createBusinessMarketingCampaign(payload) {
  const campaign = {
    id: createId(`${payload.title}-${Date.now()}`),
    creators: ["ZS"],
    creatorOverflow: 0,
    engagement: "0",
    platforms: payload.platforms || ["Instagram", "TikTok"],
    reach: "0",
    status: payload.status,
    thumbnailMeta: payload.thumbnailMeta || "#ZetechPower",
    thumbnailTitle:
      payload.thumbnailTitle ||
      String(payload.title || "NEW CAMPAIGN").toUpperCase(),
    timelineLabel: payload.status === "Draft" ? "Drafted" : "Starts on",
    timelineValue: payload.startDate || "Pending",
    tone: "navy",
    ...payload,
  };

  const saved = await createBackendMarketingCampaign(campaign);
  writeCreatedCampaigns([
    saved,
    ...readCreatedCampaigns().filter((item) => item.id !== saved.id),
  ]);
  return saved;
}

export function updateBusinessMarketingCampaign(campaignId, payload) {
  return updateBackendMarketingCampaign(campaignId, payload);
}

export function getBusinessMarketingCampaign(campaignId) {
  const campaign = getBusinessMarketingCampaigns().find(
    (item) => item.id === campaignId,
  );

  if (!campaign) {
    return null;
  }

  return {
    ...campaign,
    rawStatus: campaign.status,
    detail:
      BUSINESS_MARKETING_CAMPAIGN_DETAILS[campaign.id] ||
      BUSINESS_MARKETING_CAMPAIGN_DETAILS["level-up-skills"],
  };
}

export async function listBusinessMarketingCampaignsFromBackend() {
  const response = await listBackendMarketingCampaigns();
  return response?.data || [];
}

export async function getBusinessMarketingCampaignFromBackend(campaignId) {
  const response = await readBackendMarketingCampaign(campaignId);
  if (!response?.campaign) return null;
  const campaign = response.campaign;
  const proofs = response.proofs || [];
  const acceptances = response.acceptances || [];
  const outlets = createCampaignOutlets(proofs, acceptances);
  const money = (amount) =>
    `${campaign.currency || "KES"} ${Number(amount || 0).toLocaleString()}`;
  const spent = acceptances.reduce(
    (sum, item) => sum + Number(item.payoutAmount || 0),
    0,
  );
  const remaining = Math.max(0, Number(campaign.budgetAmount || 0) - spent);
  const reach = proofs.reduce((sum, item) => sum + Number(item.reach || 0), 0);
  const engagement = proofs.reduce(
    (sum, item) => sum + Number(item.engagement || 0),
    0,
  );
  const trackingClicks = acceptances.reduce(
    (sum, item) => sum + Number(item.trackingClicks || 0),
    0,
  );
  const trackingVisits = acceptances.reduce(
    (sum, item) => sum + Number(item.trackingVisits || 0),
    0,
  );
  const verifiedProofs = proofs.filter(
    (item) => item.status === "verified_screenshot",
  ).length;
  return {
    ...campaign,
    status: ["published", "funded"].includes(campaign.status)
      ? "Active"
      : String(campaign.status || "draft").replace(/\b\w/g, (value) =>
          value.toUpperCase(),
        ),
    budget: money(campaign.budgetAmount),
    reach: reach.toLocaleString(),
    engagement: engagement.toLocaleString(),
    stats: {
      ...(campaign.stats || {}),
      reach,
      engagement,
      trackingClicks,
      trackingVisits,
      verifiedProofs,
      needsReview: proofs.length - verifiedProofs,
    },
    timelineLabel: campaign.endsAt ? "Ends on" : "Updated",
    timelineValue: new Date(
      campaign.endsAt || campaign.updatedAt,
    ).toLocaleDateString("en-KE"),
    thumbnailTitle: campaign.thumbnailTitle || campaign.title,
    thumbnailMeta: campaign.thumbnailMeta || campaign.objective || "Campaign",
    tone: campaign.tone || "navy",
    proofs,
    acceptances,
    outlets,
    detail: {
      campaignId: campaign.id,
      category: campaign.type || "Creator campaign",
      createdAt: new Date(campaign.createdAt).toLocaleDateString("en-KE"),
      createdBy: "Your business",
      campaignType: campaign.type || "Creator campaign",
      engagementMode: "Campus creator collaboration",
      pickupAccess:
        campaign.status === "draft"
          ? "Not visible to students"
          : "Eligible creators can pick it up immediately",
      autoClose: campaign.endsAt
        ? new Date(campaign.endsAt).toLocaleDateString("en-KE")
        : "Not set",
      overview: [
        ["Objective", campaign.objective || "Not provided"],
        ["Target Audience", campaign.targetAudience || "Not provided"],
        [
          "Creator Eligibility",
          [
            Number(campaign.minimumFollowers || 0)
              ? `${Number(campaign.minimumFollowers).toLocaleString()} minimum followers`
              : "",
            Number(campaign.minimumLikes || 0)
              ? `${Number(campaign.minimumLikes).toLocaleString()} average likes`
              : "",
            Number(campaign.minimumEngagement || 0)
              ? `${Number(campaign.minimumEngagement).toLocaleString()} average engagements`
              : "",
          ]
            .filter(Boolean)
            .join("\n") || "No minimum creator metrics",
        ],
        [
          "Proof Requirements",
          campaign.proofRequirements?.join("\n") || "Not provided",
        ],
        ["Hashtags", campaign.hashtags?.join(" ") || "None"],
        ["Platforms", campaign.platforms?.join(", ") || "None"],
      ],
      timeline: [
        {
          label: "Campaign created",
          date: new Date(campaign.createdAt).toLocaleDateString("en-KE"),
          status: "done",
        },
        {
          label: "Campaign published",
          date: campaign.status === "draft" ? "Not published" : "Published",
          status: campaign.status === "draft" ? "upcoming" : "done",
        },
        {
          label: "Campaign closes",
          date: campaign.endsAt
            ? new Date(campaign.endsAt).toLocaleDateString("en-KE")
            : "No closing date",
          status: "upcoming",
        },
      ],
      budget: [
        {
          label: "Committed",
          amount: money(spent),
          percent: campaign.budgetAmount
            ? Math.round((spent / campaign.budgetAmount) * 100)
            : 0,
          tone: "purple",
        },
        {
          label: "Remaining",
          amount: money(remaining),
          percent: campaign.budgetAmount
            ? Math.round((remaining / campaign.budgetAmount) * 100)
            : 100,
          tone: "green",
        },
      ],
      performance: [
        {
          label: "Verified reach",
          value: reach.toLocaleString(),
          change: `${proofs.length} proof submissions`,
        },
        {
          label: "Engagement",
          value: engagement.toLocaleString(),
          change: "extracted from analytics screenshots",
        },
        {
          label: "Unique clicks",
          value: trackingClicks.toLocaleString(),
          change: "unique browser profiles",
        },
        {
          label: "Total visits",
          value: trackingVisits.toLocaleString(),
          change: "including repeat visits",
        },
      ],
      creators: acceptances.map((item, index) => {
        const account = item.verifiedSocialAccounts?.find((candidate) =>
          campaign.platforms?.some(
            (platform) =>
              platform.toLowerCase() === candidate.platform.toLowerCase(),
          ),
        );
        return {
          name: item.student
            ? `${item.student.firstName} ${item.student.lastName}`
            : `Campaigner ${index + 1}`,
          handle: account?.platform || item.studentId,
          platform: account?.platform || campaign.platforms?.[0] || "Social",
          followers: account
            ? Number(account.followers || 0).toLocaleString()
            : "Not verified",
          status: item.status,
          engagement: account
            ? Number(account.engagement || 0).toLocaleString()
            : "-",
          clicks: Number(item.trackingClicks || 0),
          visits: Number(item.trackingVisits || 0),
          proofSubmitted: proofs.some((proof) => proof.studentId === item.studentId),
          amount: money(item.payoutAmount),
          tone: "dark",
        };
      }),
      activity: [
        ...proofs.map(
          (item) =>
            `Proof submitted ${new Date(item.createdAt).toLocaleString("en-KE")}`,
        ),
        ...acceptances.map(
          (item) =>
            `Campaign picked up ${new Date(item.createdAt).toLocaleString("en-KE")}`,
        ),
      ],
    },
  };
}

export const fundBusinessMarketingCampaign = fundBackendMarketingCampaign;
export const publishBusinessMarketingCampaign = publishBackendMarketingCampaign;
export const generateBusinessMarketingCampaignStats =
  generateBackendMarketingCampaignStats;
export const endorseBusinessMarketingCampaigners =
  endorseBackendMarketingCampaigners;

export function acceptBusinessMarketingCampaign(campaignId) {
  return acceptBackendMarketingCampaign(campaignId);
}

export function submitBusinessMarketingCampaignProof(campaignId, proof) {
  return submitBackendMarketingCampaignProof(campaignId, proof);
}
