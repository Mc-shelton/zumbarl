import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function OpportunityDetailRailPanel({
  activeOpportunityIntentId,
  isDetailPanelVisible,
  onClose,
  onEditFilters,
  onOpenPlaceBid,
  selectedOpportunity,
  selectedOpportunityThumbnail,
}) {
  if (!selectedOpportunity) {
    return null
  }

  const canPlaceBid = hasAccess(ACCESS_KEYS.opportunities.apply)

  return (
    <section
      className={`campus-rail-card opportunities-detail-card opportunities-rail-panel${isDetailPanelVisible ? ' is-active' : ' is-hidden'}`}
      aria-label={`${selectedOpportunity.title} details`}
    >
      <header className="opportunities-detail-header">
        <div>
          <p className="opportunities-detail-kicker">Opportunity Details</p>
          <h3>{selectedOpportunity.title}</h3>
          <p>{selectedOpportunity.company} · {selectedOpportunity.meta}</p>
        </div>
        <div className="opportunities-detail-actions">
          <button
            type="button"
            className="campus-link-btn opportunities-detail-filter-btn"
            onClick={onEditFilters}
          >
            Edit filters
          </button>
          <button
            type="button"
            className="opportunities-detail-close"
            onClick={onClose}
            aria-label="Close gig details"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="opportunities-detail-stat-row">
        <article>
          <p>Pay</p>
          <strong>{selectedOpportunity.pay}</strong>
          <span>{selectedOpportunity.unit}</span>
        </article>
        <article>
          <p>Location</p>
          <strong>{selectedOpportunity.location}</strong>
          <span>{selectedOpportunity.commitment}</span>
        </article>
        <article>
          <p>Activity</p>
          <strong>{selectedOpportunity.proposals}</strong>
          <span>{selectedOpportunity.posted}</span>
        </article>
      </div>

      {canPlaceBid ? (
        <button
          type="button"
          className="opportunities-detail-bid-btn"
          onClick={() => onOpenPlaceBid(selectedOpportunity.opportunityUuid)}
        >
          Place Bid
          <FiArrowRight aria-hidden="true" />
        </button>
      ) : null}

      <section className="opportunities-gig-thumbnail" aria-label={`${selectedOpportunity.title} preview`}>
        <img src={selectedOpportunityThumbnail} alt={`${selectedOpportunity.title} thumbnail`} loading="lazy" />
      </section>

      <section className="opportunities-owner-card">
        <div className="opportunities-owner-head">
          <img src="/assets/index/bee_nobg.png" alt={`${selectedOpportunity.owner.name} avatar`} loading="lazy" />
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
        <div className="opportunities-owner-metrics">
          {selectedOpportunity.owner.metrics.map((metric, index) => {
            const MetricIcon = index === 0 ? FiStar : index === 1 ? FiTrendingUp : FiCheckCircle
            return (
              <article key={`${selectedOpportunity.id}-${metric.label}`}>
                <div className="opportunities-owner-metric-icon">
                  <MetricIcon aria-hidden="true" />
                </div>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
              </article>
            )
          })}
        </div>
      </section>

      <section className="opportunities-detail-block">
        <h4>Overview</h4>
        <p>{selectedOpportunity.overview}</p>
      </section>

      <section className="opportunities-detail-block opportunities-fit-block">
        <h4>{selectedOpportunity.intentFit[activeOpportunityIntentId] || selectedOpportunity.careerPath}</h4>
        <p>{selectedOpportunity.progressionOutcome}</p>
        <span>{selectedOpportunity.trustOutcome}</span>
      </section>

      <section className="opportunities-detail-block">
        <h4>What you will do</h4>
        <ul>
          {selectedOpportunity.responsibilities.map((item) => (
            <li key={`${selectedOpportunity.id}-scope-${item}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="opportunities-detail-block">
        <h4>What you need</h4>
        <ul>
          {selectedOpportunity.requirements.map((item) => (
            <li key={`${selectedOpportunity.id}-req-${item}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="opportunities-detail-foot">
        <p>
          <FiClock aria-hidden="true" />
          Responds quickly
        </p>
        <p>
          <FiTrendingUp aria-hidden="true" />
          High repeat-hire profile
        </p>
        <p>
          <FiStar aria-hidden="true" />
          Trusted by campus talent
        </p>
      </section>
    </section>
  )
}

export default OpportunityDetailRailPanel
