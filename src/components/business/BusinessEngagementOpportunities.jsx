import {
  BUSINESS_ENGAGEMENT_OPPORTUNITIES,
  BUSINESS_ENGAGEMENT_SECTION,
} from '../../features/business/constants'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function BusinessEngagementOpportunities() {
  return (
    <section className="business-plans business-opportunities" aria-label="SME and business engagement opportunities">
      <div className="container business-plans-inner">
        <header className="business-opportunities-header">
          <p className="business-opportunities-label">{BUSINESS_ENGAGEMENT_SECTION.label}</p>
          <h2>{BUSINESS_ENGAGEMENT_SECTION.title}</h2>
          <p>{BUSINESS_ENGAGEMENT_SECTION.description}</p>
        </header>

        <ol className="business-opportunities-grid">
          {BUSINESS_ENGAGEMENT_OPPORTUNITIES.map((opportunity) => (
            <li key={opportunity.id} className={`business-opportunity-card tone-${opportunity.tone}`}>
              <p className={`business-opportunity-number tone-${opportunity.tone}`}>{opportunity.order}</p>
              <h3>{opportunity.title}</h3>
              <p className="business-opportunity-description">{opportunity.description}</p>
              <Link className="business-opportunity-cta" to={opportunity.ctaHref || '/help'}>
                {opportunity.ctaLabel || 'Learn more'}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default BusinessEngagementOpportunities
