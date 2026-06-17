import { FiX } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function ProfilePortfolioServiceRail({ onClose, selectedPortfolioService }) {
  const canManagePortfolio = hasAccess(ACCESS_KEYS.profile.managePortfolio)
  const canShareProfile = hasAccess(ACCESS_KEYS.profile.share)

  return (
    <aside className="campus-rail campus-portfolio-detail-rail" aria-label={`${selectedPortfolioService.title} service details`}>
      <section className="campus-rail-card campus-portfolio-detail-panel campus-service-detail-panel">
        <header className="campus-service-detail-head">
          <img
            className="campus-service-detail-thumb"
            src={selectedPortfolioService.image}
            alt={`${selectedPortfolioService.title} thumbnail`}
            loading="lazy"
          />
          <div>
            <h3>{selectedPortfolioService.title}</h3>
            <p>
              <span>{selectedPortfolioService.category}</span>
              <span>{selectedPortfolioService.delivery}</span>
            </p>
          </div>
          <button
            type="button"
            className="campus-portfolio-detail-close"
            aria-label="Close service details"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <section className="campus-portfolio-detail-client-grid campus-service-detail-meta-grid">
          <article>
            <h4>Starting Price</h4>
            <strong>{selectedPortfolioService.price}</strong>
            <p>{selectedPortfolioService.revisions}</p>
          </article>
          <article>
            <h4>Service Health</h4>
            <strong>{selectedPortfolioService.satisfaction}</strong>
            <p>{selectedPortfolioService.completed}</p>
          </article>
        </section>

        <section className="campus-service-detail-copy">
          <h4>Service Summary</h4>
          <p>{selectedPortfolioService.description}</p>
        </section>

        <section className="campus-portfolio-detail-skills">
          <h4>What Clients Get</h4>
          <p>Deliverables included in this service package.</p>
          <div className="campus-portfolio-detail-skill-chips">
            {selectedPortfolioService.includes.map((item) => (
              <span key={`${selectedPortfolioService.id}-${item}`}>{item}</span>
            ))}
          </div>
        </section>

        <section className="campus-service-detail-workflow">
          <h4>Delivery Workflow</h4>
          <ol>
            {selectedPortfolioService.workflow.map((item) => (
              <li key={`${selectedPortfolioService.id}-${item}`}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="campus-portfolio-detail-impact">
          <h4>Service Stats</h4>
          <div className="campus-portfolio-detail-impact-grid">
            <article>
              <strong>{selectedPortfolioService.delivery}</strong>
              <p>Typical Delivery</p>
            </article>
            <article>
              <strong>{selectedPortfolioService.responseTime}</strong>
              <p>Response Time</p>
            </article>
            <article>
              <strong>{selectedPortfolioService.revisions}</strong>
              <p>Revision Policy</p>
            </article>
            <article>
              <strong>{selectedPortfolioService.price}</strong>
              <p>Starting Price</p>
            </article>
          </div>
        </section>

        {canManagePortfolio || canShareProfile ? (
          <section className="campus-portfolio-detail-actions">
            {canManagePortfolio ? (
              <button type="button" className="campus-portfolio-detail-action-btn is-ghost">Edit Service</button>
            ) : null}
            {canShareProfile ? (
              <button type="button" className="campus-portfolio-detail-action-btn is-primary">Share Service</button>
            ) : null}
          </section>
        ) : null}
      </section>
    </aside>
  )
}

export default ProfilePortfolioServiceRail
