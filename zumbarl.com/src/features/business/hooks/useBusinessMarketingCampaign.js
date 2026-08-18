import { useEffect, useState } from "react";
import { BUSINESS_MARKETING_DETAIL_TABS } from "../marketingDetailData";
import {
  endorseBusinessMarketingCampaigners,
  generateBusinessMarketingCampaignStats,
  getBusinessMarketingCampaignFromBackend,
  publishBusinessMarketingCampaign,
} from "../services/businessMarketingService";

export function useBusinessMarketingCampaign(campaignId) {
  const [activeTab, setActiveTab] = useState("overview");
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    const result = await getBusinessMarketingCampaignFromBackend(campaignId);
    setCampaign(result);
    return result;
  }

  useEffect(() => {
    let active = true;
    const refreshCampaign = () => getBusinessMarketingCampaignFromBackend(campaignId)
      .then((result) => {
        if (active) setCampaign(result);
      })
      .catch((reason) => {
        if (active) setError(reason.message || "Campaign could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    refreshCampaign();
    const refreshInterval = window.setInterval(refreshCampaign, 15000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [campaignId]);

  return {
    activeTab,
    campaign,
    detailTabs: BUSINESS_MARKETING_DETAIL_TABS.map((tab) =>
      tab.id === "creators"
        ? { ...tab, count: campaign?.acceptances?.length || undefined }
        : tab.id === "outlets"
          ? { ...tab, count: campaign?.outlets?.length || undefined }
        : tab,
    ),
    error,
    isLoading,
    isPaused: false,
    onChangeTab: setActiveTab,
    onEndorseTopCampaigners: async () => {
      const studentIds = [
        ...new Set(
          (campaign?.proofs || [])
            .map((proof) => proof.studentId)
            .filter(Boolean),
        ),
      ];
      if (!studentIds.length) return;
      await endorseBusinessMarketingCampaigners(campaignId, {
        studentIds,
        note: "Endorsed after campaign proof review.",
      });
      await reload();
    },
    onGenerateStats: async () => {
      await generateBusinessMarketingCampaignStats(campaignId);
      await reload();
    },
    onSubmitProof: () => {},
    onTogglePause: async () => {
      if (campaign?.status === "Draft") {
        await publishBusinessMarketingCampaign(campaignId);
        await reload();
      }
    },
  };
}
