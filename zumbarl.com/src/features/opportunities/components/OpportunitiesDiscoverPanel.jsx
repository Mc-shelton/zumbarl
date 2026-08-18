function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function OpportunitiesDiscoverPanel({
  activeOpportunityIntentId,
  activeOpportunityTypeId,
  onClearFilters,
  onOpportunitySelect,
  onOpportunityTypeChange,
  opportunities,
  opportunityTypeOptions = [],
  selectedOpportunityUuid,
}) {
  return (
    <>
      <section className="opportunities-types" aria-label="Opportunity categories">
        {opportunityTypeOptions.map(({ id, label, count, Icon }) => (
          <article
            key={id}
            className={`opportunities-type-card${activeOpportunityTypeId === id ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={activeOpportunityTypeId === id}
            aria-label={`Filter by ${label}`}
            onClick={() => onOpportunityTypeChange(id)}
            onKeyDown={(event) => handleKeyboardActivation(event, () => onOpportunityTypeChange(id))}
          >
            <div className="opportunities-type-icon">
              <Icon aria-hidden="true" />
            </div>
            <h3>{label}</h3>
            <p>{Number(count || 0).toLocaleString()}</p>
          </article>
        ))}
      </section>

      <section className="opportunities-list-section" aria-label="Recommended opportunities">
        <div className="opportunities-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p>Opportunities matched to your skills and activity</p>
          </div>
          <button type="button" className="campus-link-btn" onClick={onClearFilters}>View all</button>
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
                <img src={item.image} alt={`${item.title} preview`} loading="lazy" style={item.imageCropStyle || undefined} />
              </div>

              <div className="opportunities-job-main">
                <div className="opportunities-job-head">
                  <h3>{item.title}</h3>
                  {item.badge ? (
                    <span className={`opportunities-badge${item.isInvited ? ' is-invited' : ''}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <div className="opportunities-job-intent-row">
                  <span className="opportunities-intent-pill">Fits: {item.careerPath}</span>
                  <span>{item.intentFit[activeOpportunityIntentId] || ''}</span>
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
          {!opportunities.length ? (
            <p className="opportunities-list-empty">No opportunities match this category yet. Try another category or clear your filters.</p>
          ) : null}
        </div>
      </section>
    </>
  )
}

export default OpportunitiesDiscoverPanel
