import { Navigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { BusinessMarketingCampaignBody } from '../features/business/components/BusinessMarketingCampaignBody'
import { BusinessMarketingCampaignHero } from '../features/business/components/BusinessMarketingCampaignHero'
import { BusinessMarketingCampaignRail } from '../features/business/components/BusinessMarketingCampaignRail'
import { BusinessMarketingCampaignTabs } from '../features/business/components/BusinessMarketingCampaignTabs'
import { BusinessMarketingCampaignTopBar } from '../features/business/components/BusinessMarketingCampaignTopBar'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessMarketingCampaign } from '../features/business/hooks/useBusinessMarketingCampaign'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/workflows.css'

function BusinessMarketingCampaignPage() {
  const { campaignId } = useParams()
  const campaignState = useBusinessMarketingCampaign(campaignId)

  if (!campaignState.campaign) {
    return <Navigate to="/business/marketing" replace />
  }

  return (
    <main className="campus-page business-workspace-page business-marketing-detail-page">
      <Seo
        title={`${campaignState.campaign.title} | Business Marketing | Zumbarl`}
        description={campaignState.campaign.description}
        path={`/business/marketing/${campaignState.campaign.id}`}
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="marketing" />

          <section className="campus-main business-workspace-main business-marketing-detail-main">
            <BusinessMarketingCampaignTopBar campaign={campaignState.campaign} />
            <BusinessMarketingCampaignHero
              campaign={campaignState.campaign}
              isPaused={campaignState.isPaused}
              onTogglePause={campaignState.onTogglePause}
            />
            <BusinessMarketingCampaignTabs
              activeTab={campaignState.activeTab}
              onChangeTab={campaignState.onChangeTab}
              tabs={campaignState.detailTabs}
            />
            <BusinessMarketingCampaignBody
              activeTab={campaignState.activeTab}
              campaign={campaignState.campaign}
              onEndorseTopCampaigners={campaignState.onEndorseTopCampaigners}
              onGenerateStats={campaignState.onGenerateStats}
              onSubmitProof={campaignState.onSubmitProof}
            />
          </section>

          <BusinessMarketingCampaignRail campaign={campaignState.campaign} />
        </div>
      </div>
    </main>
  )
}

export default BusinessMarketingCampaignPage
