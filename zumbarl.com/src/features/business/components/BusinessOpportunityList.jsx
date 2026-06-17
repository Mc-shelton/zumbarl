import { FiArrowRight, FiBriefcase, FiClock } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { BusinessOpportunityTabs } from './BusinessOpportunityTabs'

export function BusinessOpportunityList({ activeTab, onChangeTab, opportunities }) {
  return (
    <section className="business-profile-card business-workspace-list" aria-labelledby="business-opportunities-title">
      <header>
        <div>
          <p className="business-section-kicker">Opportunity Pipeline</p>
          <h2 id="business-opportunities-title">Opportunities</h2>
        </div>
        <Link to="/business/applicant-profile" className="business-link-btn">Review applicants</Link>
      </header>

      <BusinessOpportunityTabs activeTab={activeTab} onChangeTab={onChangeTab} />

      <div className="business-opportunity-tab-panel" role="tabpanel">
        {opportunities.length ? (
          <div className="business-opportunity-list">
            {opportunities.map((opportunity) => (
              <article key={opportunity.id} className="business-opportunity-row">
                <span aria-hidden="true">
                  <FiBriefcase />
                </span>
                <div>
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.summary}</p>
                  {opportunity.deliverables ? (
                    <p className="business-opportunity-detail-note">
                      <strong>Deliverables:</strong> {opportunity.deliverables}
                    </p>
                  ) : null}
                  <ul>
                    <li>{opportunity.category}</li>
                    <li>{opportunity.mode}</li>
                    <li>{opportunity.budget}</li>
                  </ul>
                </div>
                <aside>
                  <strong>{opportunity.status}</strong>
                  <p><FiClock aria-hidden="true" /> {opportunity.deadline}</p>
                  <Link to="/business/applicant-profile">
                    Open
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </aside>
              </article>
            ))}
          </div>
        ) : (
          <div className="business-opportunity-empty" role="status">
            No opportunities in this status.
          </div>
        )}
      </div>
    </section>
  )
}
