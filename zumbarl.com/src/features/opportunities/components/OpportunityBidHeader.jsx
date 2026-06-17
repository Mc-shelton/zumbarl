import { FiArrowLeft, FiBookmark } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

function OpportunityBidHeader({ onBackToGig, selectedGig }) {
  return (
    <>
      <section className="opportunities-bid-breadcrumb-wrap">
        <Breadcrumb
          className="opportunities-bid-breadcrumb"
          items={[
            { label: 'Opportunities', href: '/campus/opportunities' },
            { label: 'Jobs & Gigs', href: '/campus/opportunities' },
            { label: 'bid' },
          ]}
        />
      </section>

      <header className="opportunities-bid-header">
        <div>
          <h1>{selectedGig.title}</h1>
          <p>{selectedGig.company} · {selectedGig.domain}</p>
          <span>{selectedGig.summary}</span>
        </div>

        <div className="opportunities-bid-top-actions">
          <button type="button" className="opportunities-bid-ghost-btn">
            <FiBookmark aria-hidden="true" />
            Save Gig
          </button>
          <button
            type="button"
            className="opportunities-bid-ghost-btn"
            onClick={onBackToGig}
          >
            <FiArrowLeft aria-hidden="true" />
            Back to Gig
          </button>
        </div>
      </header>
    </>
  )
}

export default OpportunityBidHeader
