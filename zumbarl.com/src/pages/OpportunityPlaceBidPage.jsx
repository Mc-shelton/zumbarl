import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import OpportunityBidForm from '../features/opportunities/components/OpportunityBidForm'
import OpportunityBidHeader from '../features/opportunities/components/OpportunityBidHeader'
import OpportunityBidSuccessDialog from '../features/opportunities/components/OpportunityBidSuccessDialog'
import OpportunityBidSummaryRail from '../features/opportunities/components/OpportunityBidSummaryRail'
import useOpportunityPlaceBidState from '../features/opportunities/hooks/useOpportunityPlaceBidState'
import { CAMPUS_PLACE_BID_SEO } from '../features/seo/constants'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import '../styles/campus.css'
import '../styles/opportunities.css'
import '../styles/workflows.css'

function OpportunityPlaceBidPage() {
  const {
    activeBidIntent,
    bidIntentOptions,
    isBidSuccessOpen,
    onBackToGig,
    onContinueDiscovery,
    onIntentChange,
    onOpenMyBids,
    onSubmitProposal,
    selectedGig,
    submittedBid,
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
            <WorkflowStatusPanel
              title="Bid submission path"
              items={[
                { label: 'Opportunity open', status: 'done', detail: `${selectedGig.company} is accepting student bids.` },
                { label: 'Proposal mode', status: 'done', detail: activeBidIntent.label },
                { label: 'Business review', status: 'blocked', detail: 'Starts after you submit your proposal.' },
              ]}
            />
            <OpportunityBidForm
              activeBidIntentId={activeBidIntent.id}
              intentOptions={bidIntentOptions}
              onIntentChange={onIntentChange}
              onSubmitProposal={onSubmitProposal}
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
