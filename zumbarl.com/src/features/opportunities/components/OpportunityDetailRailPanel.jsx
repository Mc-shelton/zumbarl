import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiDollarSign,
  FiMapPin,
  FiMonitor,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import ProfileAvatar from '../../../components/ui/ProfileAvatar'

function OpportunityDetailRailPanel({
  activeOpportunityIntentId,
  isDetailPanelVisible,
  onClose,
  onEditFilters,
  onOpenPlaceBid,
  selectedOpportunity,
  selectedOpportunityBid,
  selectedOpportunityProject,
}) {
  if (!selectedOpportunity) {
    return null
  }

  const canPlaceBid = hasAccess(ACCESS_KEYS.opportunities.apply)
  const responsibilities = (selectedOpportunity.responsibilities || []).filter((item) => typeof item === 'string' && item.trim())
  const requirements = (selectedOpportunity.requirements || []).filter((item) => typeof item === 'string' && item.trim())
  const intentFit = selectedOpportunity.matchReason
    ? selectedOpportunity.intentFit?.[activeOpportunityIntentId]
    : null
  const ownerMetrics = selectedOpportunity.owner?.metrics || []

  return (
    <section
      className={`campus-rail-card opportunities-detail-card opportunities-rail-panel${isDetailPanelVisible ? ' is-active' : ' is-hidden'}`}
      aria-label={`${selectedOpportunity.title} details`}
    >
      <header className="opportunities-detail-header">
        <div>
          <p className="opportunities-detail-kicker"><FiBriefcase aria-hidden="true" /> Opportunity details</p>
          <h3>{selectedOpportunity.title}</h3>
          <p>{selectedOpportunity.company} · {selectedOpportunity.meta}</p>
        </div>
        <button
          type="button"
          className="opportunities-detail-close"
          onClick={onClose}
          aria-label="Close opportunity details"
        >
          <FiX aria-hidden="true" />
        </button>
      </header>

      <div className="opportunities-detail-stat-row">
        <article>
          <span className="opportunities-detail-stat-icon"><FiDollarSign aria-hidden="true" /></span>
          <p>Pay</p>
          <strong>{selectedOpportunity.pay}</strong>
          <small>{selectedOpportunity.unit}</small>
        </article>
        <article>
          <span className="opportunities-detail-stat-icon"><FiMapPin aria-hidden="true" /></span>
          <p>Location</p>
          <strong>{selectedOpportunity.location}</strong>
          <small>{selectedOpportunity.commitment}</small>
        </article>
        <article>
          <span className="opportunities-detail-stat-icon"><FiUsers aria-hidden="true" /></span>
          <p>Activity</p>
          <strong>{selectedOpportunity.proposals}</strong>
          <small>{selectedOpportunity.posted}</small>
        </article>
      </div>

      <section className="opportunities-owner-card">
        <div className="opportunities-owner-head">
          <ProfileAvatar src={selectedOpportunity.owner.avatarUrl} alt={`${selectedOpportunity.owner.name} avatar`} loading="lazy" />
          <div>
            <h4>{selectedOpportunity.owner.name}</h4>
            <p>{selectedOpportunity.owner.role}</p>
          </div>
          <span className="opportunities-owner-verified">
            <FiCheckCircle aria-hidden="true" />
            Verified
          </span>
        </div>
        <p className="opportunities-owner-background">{selectedOpportunity.owner.background}</p>
        {ownerMetrics.length ? (
          <div className="opportunities-owner-metrics" aria-label="Client activity">
            {ownerMetrics.map((metric) => (
              <span key={`${selectedOpportunity.id}-${metric.label}`}>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="opportunities-detail-block opportunities-detail-summary">
        <h4>At a glance</h4>
        <p>{selectedOpportunity.overview}</p>
      </section>

      <section className="opportunities-detail-block opportunities-fit-block">
        <h4>{selectedOpportunity.matchReason ? 'Why this fits you' : 'About this opportunity'}</h4>
        <span className="opportunities-intent-pill">
          {selectedOpportunity.matchReason || selectedOpportunity.careerPath}
        </span>
        {intentFit ? <p>{intentFit}</p> : null}
        {selectedOpportunity.progressionOutcome ? <p>{selectedOpportunity.progressionOutcome}</p> : null}
        <button type="button" className="opportunities-detail-desktop-only" onClick={onEditFilters}>Adjust my matches</button>
      </section>

      <div className="opportunities-detail-disclosures">
        {responsibilities.length ? (
          <details className="opportunities-detail-disclosure">
            <summary>What you will do <span>{responsibilities.length}</span></summary>
            <ul>
              {responsibilities.map((item) => (
                <li key={`${selectedOpportunity.id}-scope-${item}`}>{item}</li>
              ))}
            </ul>
          </details>
        ) : null}
        {requirements.length ? (
          <details className="opportunities-detail-disclosure">
            <summary>What you need <span>{requirements.length}</span></summary>
            <ul>
              {requirements.map((item) => (
                <li key={`${selectedOpportunity.id}-req-${item}`}>{item}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {canPlaceBid ? (
        <footer className="opportunities-detail-cta">
          {selectedOpportunity.applicationsClosed ? (
            <div className="opportunities-detail-closed-note" role="status">
              <strong>Applications closed</strong>
              <span>This business is no longer accepting applications.</span>
            </div>
          ) : (
            <>
              {selectedOpportunityProject || (selectedOpportunityBid && !selectedOpportunityBid.isDraft) ? (
                <div className="opportunities-detail-application-note" role="status">
                  <FiCheckCircle aria-hidden="true" />
                  {selectedOpportunityProject
                    ? <div><strong>Work is ongoing</strong><span>Open the active project workspace.</span></div>
                    : <div><strong>Application submitted</strong><span>Track it under My Bids.</span></div>}
                </div>
              ) : null}
              <button
                type="button"
                className="opportunities-detail-bid-btn"
                onClick={() => onOpenPlaceBid(selectedOpportunity.opportunityUuid)}
              >
                {selectedOpportunityProject ? 'View Ongoing Work' : selectedOpportunityBid?.isDraft ? 'Continue Application' : selectedOpportunityBid ? 'View Application' : 'Place Bid'}
                <FiArrowRight aria-hidden="true" />
              </button>
              <div className="opportunities-detail-mobile-preview-note" role="note">
                <FiMonitor aria-hidden="true" />
                <div>
                  <strong>Preview only on mobile</strong>
                  <span>
                    {selectedOpportunityProject
                      ? 'Open and manage this project from a desktop computer.'
                      : selectedOpportunityBid
                        ? 'Continue or manage your application from a desktop computer.'
                        : 'Use a desktop computer when you are ready to apply.'}
                  </span>
                </div>
              </div>
            </>
          )}
        </footer>
      ) : null}
    </section>
  )
}

export default OpportunityDetailRailPanel
