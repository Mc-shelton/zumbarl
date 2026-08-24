import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadZumbarlFile } from "../../../lib/uploadZumbarlFile";
import { sendZumbarlApiRequest } from "../../../lib/sendZumbarlApiRequest";
import {
  createBusinessMarketingCampaign,
  getBusinessMarketingCampaignFromBackend,
  updateBusinessMarketingCampaign,
} from "../services/businessMarketingService";

export const MARKETING_CAMPAIGN_STEPS = [
  { id: 1, label: "Goal", detail: "What success looks like" },
  { id: 2, label: "Audience", detail: "Who should create and see it" },
  { id: 3, label: "Content", detail: "Assets, formats, and proof" },
  { id: 4, label: "Budget", detail: "Payouts and campaign dates" },
  { id: 5, label: "Zumbarl Ads", detail: "Request in-app promotion" },
  { id: 6, label: "Review", detail: "Check and launch" },
];

const INITIAL_FORM = {
  title: "",
  objective: "Brand awareness",
  description: "",
  callToAction: "",
  destinationUrl: "",
  platforms: ["Instagram"],
  targetAudience: "",
  campuses: [],
  interests: "",
  minimumFollowers: "0",
  minimumLikes: "0",
  minimumEngagement: "0",
  creatorsLimit: "5",
  contentFormats: ["Short-form video"],
  hashtags: "",
  proofRequirements: ["Live post URL", "Platform insights screenshot"],
  materials: [],
  instructions: "",
  budgetAmount: "",
  payoutPerCampaigner: "",
  startsAt: "",
  endsAt: "",
  zumbarlAdsRequested: false,
  adHeadline: "",
  adDescription: "",
  adCallToAction: "",
  adDestinationUrl: "",
};

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function campaignToForm(campaign) {
  const adRequest = campaign.zumbarlAds || {};
  const storedAd = campaign.zumbarlAd || {};
  return {
    ...INITIAL_FORM,
    ...Object.fromEntries(
      Object.keys(INITIAL_FORM)
        .filter((key) => campaign[key] != null)
        .map((key) => [key, campaign[key]]),
    ),
    campuses: Array.isArray(campaign.campuses)
      ? campaign.campuses.map((campus) =>
          typeof campus === "object" ? campus.id || campus.name : campus,
        ).filter(Boolean)
      : String(campaign.campuses || "")
          .split(",")
          .map((campus) => campus.trim())
          .filter(Boolean),
    minimumFollowers: String(campaign.minimumFollowers || 0),
    minimumLikes: String(campaign.minimumLikes || 0),
    minimumEngagement: String(campaign.minimumEngagement || 0),
    creatorsLimit: String(campaign.creatorsLimit || 1),
    budgetAmount: String(campaign.budgetAmount || ""),
    payoutPerCampaigner: String(campaign.payoutPerCampaigner || ""),
    hashtags: Array.isArray(campaign.hashtags)
      ? campaign.hashtags.join(" ")
      : campaign.hashtags || "",
    materials: Array.isArray(campaign.materials)
      ? campaign.materials.map((item) => ({ ...item }))
      : [],
    startsAt: dateInputValue(campaign.startsAt),
    endsAt: dateInputValue(campaign.endsAt),
    zumbarlAdsRequested:
      adRequest.requested === true ||
      Boolean(storedAd.id && storedAd.status !== "withdrawn"),
    adHeadline: adRequest.headline || storedAd.headline || "",
    adDescription: adRequest.description || storedAd.description || "",
    adCallToAction: adRequest.callToAction || storedAd.callToAction || "",
    adDestinationUrl:
      adRequest.destinationUrl || storedAd.destinationUrl || "",
  };
}

const REQUIRED_BY_STEP = {
  1: ["title", "objective", "description"],
  2: ["platforms", "targetAudience", "creatorsLimit"],
  3: ["contentFormats", "proofRequirements"],
  4: ["budgetAmount", "payoutPerCampaigner", "startsAt", "endsAt"],
};

function parseTags(value) {
  return String(value || "")
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean)
    .map((item) => `#${item}`);
}

function validateStep(form, step) {
  const missing = (REQUIRED_BY_STEP[step] || []).filter((key) => {
    const value = form[key];
    return Array.isArray(value) ? value.length === 0 : !String(value).trim();
  });
  if (missing.length) return "Complete the required fields before continuing.";
  if (
    step === 3 &&
    !form.materials.some(
      (item) =>
        item.url && ["image", "video"].includes(String(item.type || "")),
    )
  )
    return "Upload the image or video creators will use for this campaign.";
  if (step === 4) {
    const budget = Number(form.budgetAmount);
    const payout = Number(form.payoutPerCampaigner);
    const slots = Number(form.creatorsLimit);
    if (budget <= 0 || payout <= 0 || slots <= 0)
      return "Budget, payout, and creator slots must be greater than zero.";
    if (payout * slots > budget)
      return "The total budget does not cover every creator slot at the proposed payout.";
    if (new Date(form.endsAt) <= new Date(form.startsAt))
      return "The end date must be after the start date.";
  }
  if (step === 5 && form.zumbarlAdsRequested) {
    if (!form.adHeadline.trim() || !form.adDescription.trim())
      return "Add a headline and description for the Zumbarl Ad request.";
    const destinationUrl = form.adDestinationUrl.trim() || form.destinationUrl.trim();
    if (destinationUrl) {
      try {
        new URL(destinationUrl);
      } catch {
        return "Enter a valid destination URL for the Zumbarl Ad.";
      }
    }
  }
  return "";
}

export function useMarketingCampaignCreate() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const isEditing = Boolean(campaignId);
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campusOptions, setCampusOptions] = useState([]);
  const [campusesLoading, setCampusesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    sendZumbarlApiRequest("/auth/campuses")
      .then((response) => {
        if (active) setCampusOptions(response?.campuses || []);
      })
      .catch(() => {
        if (active) setCampusOptions([]);
      })
      .finally(() => {
        if (active) setCampusesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!campaignId) return;
    let active = true;
    getBusinessMarketingCampaignFromBackend(campaignId)
      .then((campaign) => {
        if (!active) return;
        if (!campaign) throw new Error("Campaign could not be loaded.");
        setForm(campaignToForm(campaign));
      })
      .catch((requestError) => {
        if (active)
          setError(requestError?.message || "Campaign could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [campaignId]);

  const capacity = useMemo(() => {
    const payout = Number(form.payoutPerCampaigner);
    return payout > 0 ? Math.floor(Number(form.budgetAmount || 0) / payout) : 0;
  }, [form.budgetAmount, form.payoutPerCampaigner]);

  function update(name, value) {
    setError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggle(name, value) {
    setError("");
    setForm((current) => {
      const values = current[name];
      return {
        ...current,
        [name]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  }

  function goToStep(step) {
    if (step > activeStep) {
      const validationError = validateStep(form, activeStep);
      if (validationError) return setError(validationError);
    }
    setError("");
    setActiveStep(Math.max(1, Math.min(MARKETING_CAMPAIGN_STEPS.length, step)));
  }

  async function save(status) {
    if (isUploadingMaterial) {
      setError("Wait for the campaign media upload to finish.");
      return;
    }
    for (let step = 1; step <= 5; step += 1) {
      const validationError = validateStep(form, step);
      if (validationError) {
        setActiveStep(step);
        setError(validationError);
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const selectedCampuses = campusOptions.filter((campus) =>
        form.campuses.some(
          (value) =>
            value === campus.id ||
            String(value).toLocaleLowerCase() === campus.name.toLocaleLowerCase(),
        ),
      );
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        objective: form.objective,
        type: "Creator campaign",
        callToAction: form.callToAction.trim(),
        destinationUrl: form.destinationUrl.trim() || undefined,
        platforms: form.platforms,
        targetAudience: form.targetAudience.trim(),
        campuses: selectedCampuses.map((campus) => campus.id),
        priorityCampuses: selectedCampuses.map((campus) => ({
          id: campus.id,
          name: campus.name,
          branch: campus.branch || null,
          city: campus.city || null,
        })),
        interests: form.interests.trim(),
        minimumFollowers: Number(form.minimumFollowers || 0),
        minimumLikes: Number(form.minimumLikes || 0),
        minimumEngagement: Number(form.minimumEngagement || 0),
        creatorsLimit: Number(form.creatorsLimit),
        contentFormats: form.contentFormats,
        hashtags: parseTags(form.hashtags),
        proofRequirements: form.proofRequirements,
        materials: form.materials
          .filter((item) => item.url)
          .map((item, index) => ({
            ...item,
            id: item.id || `material-${index + 1}`,
            title:
              item.title?.trim() ||
              item.fileName ||
              `Campaign material ${index + 1}`,
            instructions: form.instructions.trim(),
          })),
        previewImage:
          form.materials[0]?.type === "image"
            ? form.materials[0].previewUrl || form.materials[0].url
            : null,
        budgetAmount: Number(form.budgetAmount),
        budget: `KES ${Number(form.budgetAmount).toLocaleString()}`,
        currency: "KES",
        payoutPerCampaigner: Number(form.payoutPerCampaigner),
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        zumbarlAds: {
          requested: form.zumbarlAdsRequested,
          ...(form.zumbarlAdsRequested
            ? {
                headline: form.adHeadline.trim(),
                description: form.adDescription.trim(),
                callToAction: form.adCallToAction.trim(),
                destinationUrl:
                  form.adDestinationUrl.trim() ||
                  form.destinationUrl.trim() ||
                  undefined,
              }
            : {}),
        },
        ...(!isEditing ? { status } : {}),
      };
      const campaign = isEditing
        ? await updateBusinessMarketingCampaign(campaignId, payload)
        : await createBusinessMarketingCampaign(payload);
      navigate(`/business/marketing/${campaign.id}`);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "The campaign could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    activeStep,
    capacity,
    campusOptions,
    campusesLoading,
    error,
    form,
    isEditing,
    isLoading,
    isUploadingMaterial,
    saving,
    goToStep,
    removeMaterial() {
      update("materials", []);
    },
    toggleZumbarlAds(requested) {
      setError("");
      setForm((current) => ({
        ...current,
        zumbarlAdsRequested: requested,
        adHeadline: requested
          ? current.adHeadline || current.title
          : current.adHeadline,
        adDescription: requested
          ? current.adDescription || current.description
          : current.adDescription,
        adCallToAction: requested
          ? current.adCallToAction || current.callToAction
          : current.adCallToAction,
        adDestinationUrl: requested
          ? current.adDestinationUrl || current.destinationUrl
          : current.adDestinationUrl,
      }));
    },
    async uploadMaterial(file) {
      if (!file) return;
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setError("Choose an image or video file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("Campaign media must be 50 MB or smaller.");
        return;
      }

      const localPreviewUrl = URL.createObjectURL(file);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      setError("");
      setIsUploadingMaterial(true);
      setForm((current) => ({
        ...current,
        materials: [
          {
            title: file.name,
            type: mediaType,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            previewUrl: localPreviewUrl,
            uploadStatus: "uploading",
          },
        ],
      }));
      try {
        const upload = await uploadZumbarlFile(file, {
          scope: "business-marketing-campaign",
          metadata: { purpose: "campaign-creative", mediaType },
        });
        setForm((current) => ({
          ...current,
          materials: [
            {
              ...upload,
              id: upload.id,
              title: file.name,
              type: mediaType,
              fileName: upload.fileName || file.name,
              mimeType: upload.mimeType || file.type,
              sizeBytes: upload.sizeBytes || file.size,
              previewUrl: upload.previewUrl || upload.url,
              url: upload.url || upload.previewUrl,
              uploadStatus: "complete",
            },
          ],
        }));
      } catch (uploadError) {
        setForm((current) => ({ ...current, materials: [] }));
        setError(uploadError?.message || "Campaign media could not be uploaded.");
      } finally {
        URL.revokeObjectURL(localPreviewUrl);
        setIsUploadingMaterial(false);
      }
    },
    toggle,
    update,
    save,
  };
}
