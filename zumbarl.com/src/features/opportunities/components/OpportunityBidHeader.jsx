import { FiArrowLeft, FiBookmark, FiBriefcase, FiMapPin } from 'react-icons/fi'
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
        <div className="opportunities-bid-header-copy">
          <small>Application workspace</small>
          <h1>{selectedGig.title}</h1>
          <div className="opportunities-bid-header-meta">
            <span><FiBriefcase aria-hidden="true" /> {selectedGig.company}</span>
            <span>{selectedGig.domain}</span>
            <span><FiMapPin aria-hidden="true" /> {selectedGig.mode}</span>
          </div>
          <p>{selectedGig.summary}</p>
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
