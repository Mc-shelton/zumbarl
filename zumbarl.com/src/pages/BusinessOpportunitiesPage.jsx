import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Seo from '../components/Seo'
import { BusinessOpportunityBoard } from '../features/business/components/BusinessOpportunityBoard'
import { BusinessOpportunityInvitePanel } from '../features/business/components/BusinessOpportunityInvitePanel'
import { BusinessOpportunityRail } from '../features/business/components/BusinessOpportunityRail'
import { BusinessOpportunityReviewRail } from '../features/business/components/BusinessOpportunityReviewRail'
import { BusinessOpportunityReviewWorkspace } from '../features/business/components/BusinessOpportunityReviewWorkspace'
import { BusinessOpportunityTabs } from '../features/business/components/BusinessOpportunityTabs'
import { BusinessOpportunityToolbar } from '../features/business/components/BusinessOpportunityToolbar'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessOpportunities } from '../features/business/hooks/useBusinessOpportunities'
import '../styles/campus.css'
import '../styles/business.css'

function BusinessOpportunitiesPage() {
  const opportunities = useBusinessOpportunities()

  return (
    <main className="campus-page business-workspace-page business-opportunities-page">
      <Seo
        title="Business Opportunities | Zumbarl"
        description="Manage Zumbarl company opportunity briefs, applicant stages, and student hiring demand."
        path="/business/opportunities"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="opportunities" />

          <section className="campus-main business-workspace-main business-opportunities-main">
            {opportunities.reviewOpportunity ? (
              <BusinessOpportunityReviewWorkspace
                activeApplicationStatus={opportunities.activeApplicationStatus}
                activeReviewTab={opportunities.activeReviewTab}
                onBack={opportunities.onCloseReviewOpportunity}
                onChangeApplicationStatus={opportunities.onChangeApplicationStatus}
                onChangeReviewTab={opportunities.onChangeReviewTab}
                opportunity={opportunities.reviewOpportunity}
              />
            ) : (
              <>
                <BusinessWorkspaceHeader
                  title="Opportunities"
                  description="Discover, manage and hire top student talent for your projects."
                  primaryActionHref="/business/opportunities/create"
                  primaryActionLabel="Create Opportunity"
                />
                <BusinessOpportunityTabs activeTab={opportunities.activeTab} onChangeTab={opportunities.onChangeTab} />
                <BusinessOpportunityToolbar
                  filters={opportunities.filters}
                  filterState={opportunities.filterState}
                  onChangeBudget={opportunities.onChangeBudget}
                  onChangeCategory={opportunities.onChangeCategory}
                  onChangeQuery={opportunities.onChangeQuery}
                  onChangeSkill={opportunities.onChangeSkill}
                  onChangeSort={opportunities.onChangeSort}
                  onChangeStage={opportunities.onChangeStage}
                  onChangeViewMode={opportunities.onChangeViewMode}
                />
                <BusinessOpportunityBoard
                  onOpenInvitePanel={opportunities.onOpenInvitePanel}
                  onPublishOpportunity={opportunities.onPublishOpportunity}
                  onReviewOpportunity={opportunities.onReviewOpportunity}
                  opportunities={opportunities.opportunities}
                  viewMode={opportunities.filterState.viewMode}
                />
                <footer className="business-opportunities-pagination">
                  <p>Showing 1 to {opportunities.showingCount} of {opportunities.totalCount} opportunities</p>
                  <div>
                    <button type="button" aria-label="Previous page"><FiChevronLeft aria-hidden="true" /></button>
                    <button type="button" className="is-active">1</button>
                    <button type="button">2</button>
                    <button type="button">3</button>
                    <span>...</span>
                    <button type="button">5</button>
                    <button type="button" aria-label="Next page"><FiChevronRight aria-hidden="true" /></button>
                    <button type="button">5 per page</button>
                  </div>
                </footer>
              </>
            )}
          </section>

          {opportunities.reviewOpportunity ? (
            <BusinessOpportunityReviewRail
              activeApplicationStatus={opportunities.activeApplicationStatus}
              activeReviewTab={opportunities.activeReviewTab}
              opportunity={opportunities.reviewOpportunity}
            />
          ) : (
            <BusinessOpportunityRail
              activity={opportunities.activity}
              skillsDemand={opportunities.skillsDemand}
              summary={opportunities.summary}
            />
          )}
        </div>
      </div>

      <BusinessOpportunityInvitePanel
        candidates={opportunities.inviteCandidates}
        inviteNote={opportunities.inviteNote}
        inviteOpportunity={opportunities.inviteOpportunity}
        onChangeInviteNote={opportunities.onChangeInviteNote}
        onChangeInviteQuery={opportunities.onChangeInviteQuery}
        onClose={opportunities.onCloseInvitePanel}
        onSendInvites={opportunities.onSendInvites}
        onToggleBidder={opportunities.onToggleBidderSelection}
        selectedBidderIds={opportunities.selectedBidderIds}
      />
    </main>
  )
}

export default BusinessOpportunitiesPage
