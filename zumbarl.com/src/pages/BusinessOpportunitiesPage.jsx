import Seo from '../components/Seo'
import { Pagination } from '../components/ui'
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
                activeInterviewConversation={opportunities.activeInterviewConversation}
                activeReviewTab={opportunities.activeReviewTab}
                applications={opportunities.reviewApplicants}
                applicationsError={opportunities.reviewApplicantsError}
                isLoadingApplications={opportunities.isLoadingReviewApplicants}
                onBack={opportunities.onCloseReviewOpportunity}
                onChangeApplicationStatus={opportunities.onChangeApplicationStatus}
                onChangeReviewTab={opportunities.onChangeReviewTab}
                onPublishOpportunity={opportunities.onPublishOpportunity}
                onScheduleApplicantInterview={opportunities.onScheduleApplicantInterview}
                onStartApplicantInterview={opportunities.onStartApplicantInterview}
                opportunity={opportunities.reviewOpportunity}
                openPublishPayment={opportunities.openPublishPaymentForReview}
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
                  onContinueDraftOpportunity={opportunities.onContinueDraftOpportunity}
                  onOpenInvitePanel={opportunities.onOpenInvitePanel}
                  onPublishOpportunity={opportunities.onPublishOpportunity}
                  onReviewOpportunity={opportunities.onReviewOpportunity}
                  opportunities={opportunities.opportunities}
                  viewMode={opportunities.filterState.viewMode}
                />
                <Pagination
                  className="business-opportunities-pagination"
                  itemsLabel="opportunities"
                  onChangePage={opportunities.onChangePage}
                  onChangePageSize={opportunities.onChangePageSize}
                  page={opportunities.page}
                  pageCount={opportunities.pageCount}
                  pageSize={opportunities.pageSize}
                  pageSizeOptions={opportunities.pageSizeOptions}
                  showingFrom={opportunities.showingFrom}
                  showingTo={opportunities.showingTo}
                  totalCount={opportunities.totalCount}
                />
              </>
            )}
          </section>

          {opportunities.reviewOpportunity ? (
            <BusinessOpportunityReviewRail
              activeApplicationStatus={opportunities.activeApplicationStatus}
              activeReviewTab={opportunities.activeReviewTab}
              applications={opportunities.reviewApplicants}
              onChangeApplicationStatus={opportunities.onChangeApplicationStatus}
              opportunity={opportunities.reviewOpportunity}
            />
          ) : (
            <BusinessOpportunityRail
              activity={opportunities.activity}
              topSkills={opportunities.topSkills}
              summary={opportunities.summary}
            />
          )}
        </div>
      </div>

      <BusinessOpportunityInvitePanel
        candidates={opportunities.inviteCandidates}
        inviteNote={opportunities.inviteNote}
        inviteOpportunity={opportunities.inviteOpportunity}
        isLoading={opportunities.isLoadingInviteCandidates}
        isSending={opportunities.isSendingInvites}
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
