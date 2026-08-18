import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import OpportunityBidForm from '../features/opportunities/components/OpportunityBidForm'
import OpportunityBidHeader from '../features/opportunities/components/OpportunityBidHeader'
import OpportunityApplicationLeavePrompt from '../features/opportunities/components/OpportunityApplicationLeavePrompt'
import OpportunityBidSuccessDialog from '../features/opportunities/components/OpportunityBidSuccessDialog'
import OpportunityBidSummaryRail from '../features/opportunities/components/OpportunityBidSummaryRail'
import useOpportunityPlaceBidState from '../features/opportunities/hooks/useOpportunityPlaceBidState'
import { CAMPUS_PLACE_BID_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunityPlaceBidPage() {
  const {
    activeBidIntent,
    applicationDraft,
    draftError,
    draftNotice,
    isBidSuccessOpen,
    isLoadingDraft,
    isSavingDraft,
    isSubmitting,
    leavePrompt,
    onApplicationStateChange,
    onBackToGig,
    onCancel,
    onContinueDiscovery,
    onOpenMyBids,
    onMarkDirty,
    onSaveDraft,
    onSubmitProposal,
    selectedGig,
    submittedBid,
    submitError,
  } = useOpportunityPlaceBidState()

  return (
    <main className="campus-page opportunities-page opportunities-bid-page">
      <Seo
        title={CAMPUS_PLACE_BID_SEO.title}
        description={CAMPUS_PLACE_BID_SEO.description}
        path={CAMPUS_PLACE_BID_SEO.path}
        keywords={CAMPUS_PLACE_BID_SEO.keywords}
        jsonLd={[CAMPUS_PLACE_BID_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-bid-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main opportunities-bid-main">
            {selectedGig ? (
              <>
                <OpportunityBidHeader onBackToGig={onBackToGig} selectedGig={selectedGig} />
                {isLoadingDraft ? (
                  <div className="opportunities-bid-form-card opportunities-application-loading" role="status">
                    Loading your application draft...
                  </div>
                ) : (
                  <OpportunityBidForm
                    draftError={draftError}
                    draftNotice={draftNotice}
                    initialDraft={applicationDraft}
                    isSavingDraft={isSavingDraft}
                    isSubmitting={isSubmitting}
                    onApplicationStateChange={onApplicationStateChange}
                    onCancel={onCancel}
                    onMarkDirty={onMarkDirty}
                    onSaveDraft={onSaveDraft}
                    onSubmitProposal={onSubmitProposal}
                    selectedGig={selectedGig}
                    submitError={submitError}
                  />
                )}
              </>
            ) : (
              <div className="opportunities-list-section">
                <p className="opportunities-list-empty">
                  This opportunity is no longer available or is still loading.
                </p>
                <button type="button" className="campus-link-btn" onClick={onBackToGig}>
                  Back to opportunities
                </button>
              </div>
            )}
          </section>

          {selectedGig ? <OpportunityBidSummaryRail selectedGig={selectedGig} /> : null}
        </div>
      </div>

      <OpportunityBidSuccessDialog
        isOpen={isBidSuccessOpen}
        activeBidIntentId={activeBidIntent.id}
        onContinueDiscovery={onContinueDiscovery}
        onOpenMyBids={onOpenMyBids}
        selectedGig={selectedGig}
        submittedBid={submittedBid}
      />
      <OpportunityApplicationLeavePrompt {...leavePrompt} />
    </main>
  )
}

export default OpportunityPlaceBidPage
