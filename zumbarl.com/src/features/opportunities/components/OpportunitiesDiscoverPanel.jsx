import { OPPORTUNITY_TYPES } from '../constants'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function OpportunitiesDiscoverPanel({
  activeOpportunityIntentId,
  onOpenMarketingCampaign,
  onOpportunitySelect,
  opportunities,
  selectedOpportunityUuid,
}) {
  return (
    <>
      <section className="opportunities-types" aria-label="Opportunity categories">
        {OPPORTUNITY_TYPES.map(({ label, count, Icon, active }) => (
          <article key={label} className={`opportunities-type-card${active ? ' is-active' : ''}`}>
            <div className="opportunities-type-icon">
              <Icon aria-hidden="true" />
            </div>
            <h3>{label}</h3>
            <p>{count.toLocaleString()}</p>
          </article>
        ))}
      </section>

      <section className="opportunities-marketing-workflow-card" aria-label="Marketing campaign opportunity">
        <div>
          <span>Creator campaign</span>
          <h2>Zetech Studios Level Up Skills</h2>
          <p>
            Accept if you meet the campaign criteria, run the social campaign, submit proof,
            and earn endorsement when your results rank among top performers.
          </p>
        </div>
        <dl>
          <div><dt>Budget left</dt><dd>KES 28,000</dd></div>
          <div><dt>Invite window</dt><dd>14h left</dd></div>
          <div><dt>Criteria</dt><dd>2K+ followers</dd></div>
        </dl>
        <button type="button" className="opportunities-detail-bid-btn" onClick={onOpenMarketingCampaign}>
          Open campaign workflow
        </button>
      </section>

      <section className="opportunities-list-section" aria-label="Recommended opportunities">
        <div className="opportunities-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p>Opportunities matched to your skills and activity</p>
          </div>
          <button type="button" className="campus-link-btn">View all</button>
        </div>

        <div className="opportunities-list">
          {opportunities.map((item) => (
            <article
              key={item.opportunityUuid}
              className={`opportunities-job-card${selectedOpportunityUuid === item.opportunityUuid ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedOpportunityUuid === item.opportunityUuid}
              aria-label={`Open details for ${item.title}`}
              onClick={() => onOpportunitySelect(item.opportunityUuid)}
              onKeyDown={(event) => handleKeyboardActivation(event, () => onOpportunitySelect(item.opportunityUuid))}
            >
              <div className="opportunities-job-avatar">
                <img src="/assets/index/bee_nobg.png" alt={`${item.company} logo`} loading="lazy" />
              </div>

              <div className="opportunities-job-main">
                <div className="opportunities-job-head">
                  <h3>{item.title}</h3>
                  {item.badge ? <span className="opportunities-badge">{item.badge}</span> : null}
                </div>
                <div className="opportunities-job-intent-row">
                  <span className="opportunities-intent-pill">
                    {item.intentFit[activeOpportunityIntentId] || item.careerPath}
                  </span>
                  <span>{item.careerPath}</span>
                </div>
                <p className="opportunities-job-meta">
                  {item.company} · {item.meta}
                </p>
                <p className="opportunities-job-description">{item.description}</p>
                <p className="opportunities-job-outcome">{item.progressionOutcome}</p>
                <div className="opportunities-tag-row">
                  {item.tags.map((tag) => (
                    <span key={`${item.title}-${tag}`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="opportunities-job-side">
                <p className="opportunities-job-pay">
                  <strong>{item.pay}</strong>
                  <span>{item.unit}</span>
                </p>
                <p className="opportunities-job-posted">{item.posted}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default OpportunitiesDiscoverPanel
