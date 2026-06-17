import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiCode,
  FiEdit3,
  FiRadio,
  FiSend,
  FiVideo,
} from 'react-icons/fi'

const ICON_BY_TYPE = {
  analytics: FiBarChart2,
  briefcase: FiBriefcase,
  campaign: FiRadio,
  code: FiCode,
  design: FiEdit3,
  video: FiVideo,
}

function OpportunityIcon({ icon, tone }) {
  const Icon = ICON_BY_TYPE[icon] || FiBriefcase

  return (
    <span className={`business-opportunity-avatar tone-${tone}`} aria-hidden="true">
      <Icon />
    </span>
  )
}

export function BusinessOpportunityBoard({
  onOpenInvitePanel,
  onPublishOpportunity,
  onReviewOpportunity,
  opportunities,
  viewMode,
}) {
  if (!opportunities.length) {
    return (
      <section className="business-profile-card business-opportunities-empty" aria-live="polite">
        <h2>No opportunities found</h2>
        <p>Adjust your filters or create a new opportunity brief to start a fresh applicant pipeline.</p>
      </section>
    )
  }

  return (
    <section
      className={`business-opportunities-board is-${viewMode}`}
      aria-label="Business opportunities"
    >
      {opportunities.map((opportunity) => (
        <article key={opportunity.id} className="business-profile-card business-opportunities-card">
          <OpportunityIcon icon={opportunity.icon} tone={opportunity.tone} />

          <div className="business-opportunities-card-main">
            <h2>{opportunity.title}</h2>
            <p className="business-opportunities-company">{opportunity.company}</p>
            <p className="business-opportunities-description">{opportunity.description}</p>
            <ul className="business-opportunities-meta" aria-label={`${opportunity.title} details`}>
              <li>{opportunity.category}</li>
              <li>{opportunity.mode || 'Project'}</li>
              <li>Apply by {opportunity.deadline || 'Rolling'}</li>
              {opportunity.paymentTerms ? <li>{opportunity.paymentTerms}</li> : null}
            </ul>
            <ul className="business-opportunities-tags" aria-label={`${opportunity.title} skills`}>
              {opportunity.skills.slice(0, 3).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
              {opportunity.skillOverflow > 0 ? <li>+{opportunity.skillOverflow}</li> : null}
            </ul>
          </div>

          <dl className="business-opportunities-card-stats">
            <div>
              <dt>Budget</dt>
              <dd>{opportunity.budget}</dd>
            </div>
            <div>
              <dt>Applicants</dt>
              <dd>{opportunity.applicants}</dd>
            </div>
            <div>
              <dt>Invited</dt>
              <dd>{opportunity.invitedCount || 0}</dd>
            </div>
          </dl>

          <aside className="business-opportunities-card-status">
            <strong className={`tone-${opportunity.tone}`}>{opportunity.status}</strong>
            <time>{opportunity.time}</time>
          </aside>

          <div className="business-opportunities-card-actions">
            {opportunity.canPublish ? (
              <button type="button" onClick={() => onPublishOpportunity?.(opportunity)}>
                <FiCheckCircle aria-hidden="true" />
                Publish
              </button>
            ) : null}
            {opportunity.canInvite ? (
              <button type="button" onClick={() => onOpenInvitePanel?.(opportunity)}>
                <FiSend aria-hidden="true" />
                Invite bidders
              </button>
            ) : null}
            <button
              type="button"
              className="business-opportunities-review-btn"
              onClick={() => onReviewOpportunity?.(opportunity)}
              aria-label={`Review applicants for ${opportunity.title}`}
            >
              Review
            </button>
          </div>
        </article>
      ))}
    </section>
  )
}
