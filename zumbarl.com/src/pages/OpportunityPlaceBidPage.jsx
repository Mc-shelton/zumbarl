import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import OpportunityBidForm from '../features/opportunities/components/OpportunityBidForm'
import OpportunityBidHeader from '../features/opportunities/components/OpportunityBidHeader'
import OpportunityBidSuccessDialog from '../features/opportunities/components/OpportunityBidSuccessDialog'
import OpportunityBidSummaryRail from '../features/opportunities/components/OpportunityBidSummaryRail'
import useOpportunityPlaceBidState from '../features/opportunities/hooks/useOpportunityPlaceBidState'
import { CAMPUS_PLACE_BID_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunityPlaceBidPage() {
  const {
    activeBidIntent,
    isBidSuccessOpen,
    isSubmitting,
    onBackToGig,
    onContinueDiscovery,
    onOpenMyBids,
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
            <OpportunityBidHeader onBackToGig={onBackToGig} selectedGig={selectedGig} />
            <OpportunityBidForm
              isSubmitting={isSubmitting}
              onSubmitProposal={onSubmitProposal}
              selectedGig={selectedGig}
              submitError={submitError}
            />
          </section>

          <OpportunityBidSummaryRail selectedGig={selectedGig} />
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
    </main>
  )
}

export default OpportunityPlaceBidPage
