import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Seo from '../components/Seo'
import { ACCESS_KEYS } from '../features/auth/roleConfig'
import { BusinessMarketingCampaignList } from '../features/business/components/BusinessMarketingCampaignList'
import { BusinessMarketingMetrics } from '../features/business/components/BusinessMarketingMetrics'
import { BusinessMarketingRail } from '../features/business/components/BusinessMarketingRail'
import { BusinessMarketingTabs } from '../features/business/components/BusinessMarketingTabs'
import { BusinessMarketingToolbar } from '../features/business/components/BusinessMarketingToolbar'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessMarketing } from '../features/business/hooks/useBusinessMarketing'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import { MARKETING_WORKFLOW_MOCK } from '../features/workflows/workflowData'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/workflows.css'

function BusinessMarketingPage() {
  const marketing = useBusinessMarketing()

  return (
    <main className="campus-page business-workspace-page business-marketing-page">
      <Seo
        title="Business Marketing | Zumbarl"
        description="Promote business brands, products, and services to students through creator campaigns."
        path="/business/marketing"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="marketing" />

          <section className="campus-main business-workspace-main business-marketing-main">
            <BusinessWorkspaceHeader
              title="Marketing"
              description="Promote your brand, products or services to students. They'll share, post, and engage across their socials and channels."
              primaryActionAccess={ACCESS_KEYS.business.marketingCreate}
              primaryActionHref="/business/marketing/create"
              primaryActionLabel="Create Marketing Campaign"
            />
            <BusinessMarketingMetrics metrics={marketing.metrics} />
            <section className="business-marketing-panel">
              <BusinessMarketingTabs activeTab={marketing.activeTab} onChangeTab={marketing.onChangeTab} />
              <BusinessMarketingToolbar
                filters={marketing.filters}
                filterState={marketing.filterState}
                onChangePlatform={marketing.onChangePlatform}
                onChangeQuery={marketing.onChangeQuery}
                onChangeSort={marketing.onChangeSort}
                onChangeStatus={marketing.onChangeStatus}
                onChangeType={marketing.onChangeType}
                onChangeViewMode={marketing.onChangeViewMode}
              />
              <WorkflowStatusPanel
                title="Campaign acceptance gates"
                items={[
                  { label: 'Campaign budget', status: 'done', detail: `${MARKETING_WORKFLOW_MOCK.acceptedBudget} accepted of ${MARKETING_WORKFLOW_MOCK.budgetCap}.` },
                  { label: 'Invite-only window', status: 'done', detail: MARKETING_WORKFLOW_MOCK.inviteWindow },
                  { label: 'Eligibility rules', status: 'done', detail: MARKETING_WORKFLOW_MOCK.eligibility.join(', ') },
                ]}
              />
              <BusinessMarketingCampaignList
                campaigns={marketing.campaigns}
                viewMode={marketing.filterState.viewMode}
              />
              <footer className="business-marketing-pagination">
                <p>Showing 1 to {marketing.showingCount} of {marketing.totalCount} campaigns</p>
                <div>
                  <button type="button" aria-label="Previous page"><FiChevronLeft aria-hidden="true" /></button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button" aria-label="Next page"><FiChevronRight aria-hidden="true" /></button>
                  <button type="button">5 per page</button>
                </div>
              </footer>
            </section>
          </section>

          <BusinessMarketingRail
            createCampaignHref="/business/marketing/create"
            createOptions={marketing.createOptions}
            onSelectCampaignType={marketing.onSelectCampaignType}
            platforms={marketing.platforms}
            selectedCampaignType={marketing.selectedCampaignType}
          />
        </div>
      </div>
    </main>
  )
}

export default BusinessMarketingPage
