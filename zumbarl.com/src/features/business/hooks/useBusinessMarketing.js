import { useEffect, useMemo, useState } from "react";
import {
  BUSINESS_MARKETING_CREATE_OPTIONS,
  BUSINESS_MARKETING_FILTERS,
  BUSINESS_MARKETING_PLATFORMS,
} from "../marketingData";
import { listBusinessMarketingCampaignsFromBackend } from "../services/businessMarketingService";

const PAGE_SIZE = 4;

function displayStatus(status) {
  const value = String(status || "draft").toLowerCase();
  return value === "published" || value === "funded"
    ? "Active"
    : value[0].toUpperCase() + value.slice(1);
}

function displayNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: Number(value) >= 1000 ? "compact" : "standard",
  }).format(Number(value) || 0);
}

function toCampaign(record) {
  const stats = record.stats || {};
  const acceptanceCount = Number(
    record.acceptanceCount || record.acceptances?.length || 0,
  );
  return {
    ...record,
    status: displayStatus(record.status),
    budget: `${record.currency || "KES"} ${Number(record.budgetAmount || 0).toLocaleString()}`,
    reach: displayNumber(stats.reach),
    engagement: displayNumber(stats.engagement),
    creators: acceptanceCount ? ["C"] : [],
    creatorOverflow: Math.max(0, acceptanceCount - 1),
    timelineLabel: record.endsAt
      ? "Ends on"
      : record.timelineLabel || "Updated",
    timelineValue: record.endsAt
      ? new Date(record.endsAt).toLocaleDateString("en-KE")
      : record.timelineValue ||
        new Date(record.updatedAt).toLocaleDateString("en-KE"),
    thumbnailTitle: record.thumbnailTitle || record.title,
    thumbnailMeta: record.thumbnailMeta || record.objective || "Campaign",
    tone: record.tone || "navy",
  };
}

function amountValue(value) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function metricValue(value) {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^0-9.k]/g, "");
  const number = Number.parseFloat(normalized) || 0;

  return normalized.includes("k") ? number * 1000 : number;
}

function matchesTab(campaign, activeTab) {
  if (activeTab === "all") return true;
  if (activeTab === "drafts") return campaign.status === "Draft";
  if (activeTab === "collaborations")
    return campaign.creators.length + campaign.creatorOverflow > 4;
  if (activeTab === "analytics") return true;

  return campaign.status.toLowerCase() === activeTab;
}

export function useBusinessMarketing() {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [campaignRecords, setCampaignRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listBusinessMarketingCampaignsFromBackend()
      .then((records) => {
        if (active) setCampaignRecords(records.map(toCampaign));
      })
      .catch((reason) => {
        if (active)
          setError(reason.message || "Campaigns could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const campaigns = campaignRecords;

    return campaigns
      .filter((campaign) => {
        if (!matchesTab(campaign, activeTab)) return false;
        if (type !== "all" && campaign.type !== type) return false;
        if (platform !== "all" && !campaign.platforms.includes(platform))
          return false;
        if (status !== "all" && campaign.status !== status) return false;
        if (!normalizedQuery) return true;

        return [
          campaign.title,
          campaign.type,
          campaign.description,
          campaign.status,
          campaign.platforms.join(" "),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "reach-high")
          return metricValue(b.reach) - metricValue(a.reach);
        if (sort === "engagement-high")
          return metricValue(b.engagement) - metricValue(a.engagement);
        if (sort === "budget-high")
          return amountValue(b.budget) - amountValue(a.budget);
        return campaigns.indexOf(a) - campaigns.indexOf(b);
      });
  }, [activeTab, campaignRecords, platform, query, sort, status, type]);

  const metrics = useMemo(() => {
    const active = campaignRecords.filter(
      (campaign) => campaign.status === "Active",
    );
    const totals = campaignRecords.reduce(
      (sum, campaign) => ({
        reach: sum.reach + metricValue(campaign.reach),
        engagement: sum.engagement + metricValue(campaign.engagement),
        spend: sum.spend + amountValue(campaign.acceptedBudget || 0),
        creators:
          sum.creators + campaign.creators.length + campaign.creatorOverflow,
      }),
      { reach: 0, engagement: 0, spend: 0, creators: 0 },
    );
    return [
      {
        icon: "campaign",
        label: "Active Campaigns",
        trend: `${campaignRecords.length} total`,
        tone: "purple",
        value: String(active.length),
      },
      {
        icon: "send",
        label: "Creator Collaborations",
        trend: "Accepted campaigners",
        tone: "orange",
        value: String(totals.creators),
      },
      {
        icon: "eye",
        label: "Verified Reach",
        trend: "From submitted proof",
        tone: "green",
        value: displayNumber(totals.reach),
      },
      {
        icon: "thumbs",
        label: "Engagements",
        trend: "From reviewed proof",
        tone: "blue",
        value: displayNumber(totals.engagement),
      },
      {
        icon: "spend",
        label: "Committed Budget",
        trend: "Accepted creator payouts",
        tone: "purple",
        value: `KES ${totals.spend.toLocaleString()}`,
      },
    ];
  }, [campaignRecords]);

  return {
    activeTab,
    campaigns: filteredCampaigns.slice(0, PAGE_SIZE),
    createOptions: BUSINESS_MARKETING_CREATE_OPTIONS,
    filters: BUSINESS_MARKETING_FILTERS,
    filterState: { platform, query, sort, status, type, viewMode },
    error,
    isLoading,
    metrics,
    platforms: BUSINESS_MARKETING_PLATFORMS,
    selectedCampaignType,
    showingCount: Math.min(PAGE_SIZE, filteredCampaigns.length),
    totalCount: filteredCampaigns.length,
    onChangePlatform: setPlatform,
    onChangeQuery: setQuery,
    onChangeSort: setSort,
    onChangeStatus: setStatus,
    onChangeTab: setActiveTab,
    onChangeType: setType,
    onChangeViewMode: setViewMode,
    onSelectCampaignType: setSelectedCampaignType,
  };
}
