import { useMemo, useState } from 'react'
import { BUSINESS_MARKETING_DETAIL_TABS } from '../marketingDetailData'
import { getBusinessMarketingCampaign } from '../services/businessMarketingService'

export function useBusinessMarketingCampaign(campaignId) {
  const [activeTab, setActiveTab] = useState('overview')
  const [campaignWorkflow, setCampaignWorkflow] = useState({
    endorsed: false,
    proofSubmitted: false,
    statsGenerated: true,
    stepId: 'stats',
  })
  const [isPaused, setIsPaused] = useState(false)

  const campaign = useMemo(() => getBusinessMarketingCampaign(campaignId), [campaignId])
  const status = isPaused ? 'Paused' : campaign?.status
  const enrichedCampaign = campaign ? {
    ...campaign,
    status,
    workflow: campaignWorkflow,
    workflowStepId: campaignWorkflow.stepId,
  } : null

  return {
    activeTab,
    campaign: enrichedCampaign,
    detailTabs: BUSINESS_MARKETING_DETAIL_TABS,
    isPaused,
    onChangeTab: setActiveTab,
    onEndorseTopCampaigners: () => setCampaignWorkflow((current) => ({
      ...current,
      endorsed: true,
      stepId: 'endorsed',
    })),
    onGenerateStats: () => setCampaignWorkflow((current) => ({
      ...current,
      statsGenerated: true,
      stepId: 'stats',
    })),
    onSubmitProof: () => setCampaignWorkflow((current) => ({
      ...current,
      proofSubmitted: true,
      stepId: 'proof',
    })),
    onTogglePause: () => setIsPaused((current) => !current),
  }
}
