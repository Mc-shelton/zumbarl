import { useMemo, useState } from 'react'
import {
  BUSINESS_MARKETING_CREATE_OPTIONS,
  BUSINESS_MARKETING_FILTERS,
  BUSINESS_MARKETING_METRICS,
  BUSINESS_MARKETING_PLATFORMS,
} from '../marketingData'
import { getBusinessMarketingCampaigns } from '../services/businessMarketingService'

const PAGE_SIZE = 4
const KNOWN_CAMPAIGN_COUNT = 12

function amountValue(value) {
  return Number(String(value).replace(/[^\d]/g, '')) || 0
}

function metricValue(value) {
  const normalized = String(value).toLowerCase().replace(/[^0-9.k]/g, '')
  const number = Number.parseFloat(normalized) || 0

  return normalized.includes('k') ? number * 1000 : number
}

function matchesTab(campaign, activeTab) {
  if (activeTab === 'all') return true
  if (activeTab === 'drafts') return campaign.status === 'Draft'
  if (activeTab === 'collaborations') return campaign.creators.length + campaign.creatorOverflow > 4
  if (activeTab === 'analytics') return true

  return campaign.status.toLowerCase() === activeTab
}

export function useBusinessMarketing() {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedCampaignType, setSelectedCampaignType] = useState('')
  const [sort, setSort] = useState('newest')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [viewMode, setViewMode] = useState('list')

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const campaigns = getBusinessMarketingCampaigns()

    return campaigns
      .filter((campaign) => {
        if (!matchesTab(campaign, activeTab)) return false
        if (type !== 'all' && campaign.type !== type) return false
        if (platform !== 'all' && !campaign.platforms.includes(platform)) return false
        if (status !== 'all' && campaign.status !== status) return false
        if (!normalizedQuery) return true

        return [
          campaign.title,
          campaign.type,
          campaign.description,
          campaign.status,
          campaign.platforms.join(' '),
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => {
        if (sort === 'reach-high') return metricValue(b.reach) - metricValue(a.reach)
        if (sort === 'engagement-high') return metricValue(b.engagement) - metricValue(a.engagement)
        if (sort === 'budget-high') return amountValue(b.budget) - amountValue(a.budget)
        return campaigns.indexOf(a) - campaigns.indexOf(b)
      })
  }, [activeTab, platform, query, sort, status, type])

  const isDefaultView = activeTab === 'all'
    && !query
    && platform === 'all'
    && status === 'all'
    && type === 'all'

  return {
    activeTab,
    campaigns: filteredCampaigns.slice(0, PAGE_SIZE),
    createOptions: BUSINESS_MARKETING_CREATE_OPTIONS,
    filters: BUSINESS_MARKETING_FILTERS,
    filterState: { platform, query, sort, status, type, viewMode },
    metrics: BUSINESS_MARKETING_METRICS,
    platforms: BUSINESS_MARKETING_PLATFORMS,
    selectedCampaignType,
    showingCount: Math.min(PAGE_SIZE, filteredCampaigns.length),
    totalCount: isDefaultView ? KNOWN_CAMPAIGN_COUNT : filteredCampaigns.length,
    onChangePlatform: setPlatform,
    onChangeQuery: setQuery,
    onChangeSort: setSort,
    onChangeStatus: setStatus,
    onChangeTab: setActiveTab,
    onChangeType: setType,
    onChangeViewMode: setViewMode,
    onSelectCampaignType: setSelectedCampaignType,
  }
}
