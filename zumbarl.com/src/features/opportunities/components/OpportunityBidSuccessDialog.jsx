import { FiCheckCircle } from 'react-icons/fi'

function OpportunityBidSuccessDialog({
  activeBidIntentId,
  isOpen,
  onContinueDiscovery,
  onOpenMyBids,
  selectedGig,
  submittedBid,
}) {
  if (!isOpen) {
    return null
  }

  const successNote = submittedBid
    ? `${submittedBid.title} is now visible in My Bids.`
    : activeBidIntentId === 'career'
      ? selectedGig.progressionOutcome
      : `${selectedGig.trustOutcome} will start once the project is confirmed.`

  return (
    <div className="opportunities-bid-success-overlay" role="presentation">
      <section
        className="opportunities-bid-success-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-success-title"
        aria-describedby="bid-success-description"
      >
        <div className="opportunities-bid-success-icon" aria-hidden="true">
          <FiCheckCircle />
        </div>
        <h2 id="bid-success-title">Proposal submitted successfully</h2>
        <p id="bid-success-description">
          Your bid has been sent to {selectedGig.company}. You can continue exploring opportunities or track this in My Bids.
        </p>
        <p className="opportunities-bid-success-note">{successNote}</p>
        <div className="opportunities-bid-success-actions">
          <button type="button" className="campus-link-btn" onClick={onContinueDiscovery}>
            Continue discovery
          </button>
          <button type="button" className="opportunities-detail-bid-btn" onClick={onOpenMyBids}>
            My Bids
          </button>
        </div>
      </section>
    </div>
  )
}

export default OpportunityBidSuccessDialog
