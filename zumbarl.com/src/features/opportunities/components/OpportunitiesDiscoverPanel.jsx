import { useEffect, useRef, useState } from 'react'
import { FiArrowUpRight, FiBriefcase, FiCheck, FiChevronDown, FiClock, FiMoreHorizontal, FiTrendingUp } from 'react-icons/fi'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function OpportunityTypePill({ activeTypeId, onSelect, option }) {
  const { id, label, description, count, Icon } = option

  return (
    <button
      type="button"
      className={`opportunities-type-card${activeTypeId === id ? ' is-active' : ''}`}
      aria-pressed={activeTypeId === id}
      aria-label={`Filter by ${label}, ${Number(count || 0).toLocaleString()} available`}
      onClick={() => onSelect(id)}
    >
      <span className="opportunities-type-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="opportunities-type-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className="opportunities-type-count" aria-hidden="true">
        {Number(count || 0).toLocaleString()}
      </span>
    </button>
  )
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
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreMenuRef = useRef(null)
  const orderedOpportunityTypes = [...opportunityTypeOptions].sort((left, right) => {
    if (left.id === 'all') return -1
    if (right.id === 'all') return 1
    return Number(right.count || 0) - Number(left.count || 0)
  })
  const allOpportunityType = orderedOpportunityTypes.find((option) => option.id === 'all')
  const additionalOpportunityTypes = orderedOpportunityTypes.filter((option) => option.id !== 'all')

  useEffect(() => {
    if (!isMoreOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!moreMenuRef.current?.contains(event.target)) setIsMoreOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsMoreOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMoreOpen])

  function selectOpportunityType(typeId) {
    onOpportunityTypeChange(typeId)
    setIsMoreOpen(false)
  }

  return (
    <>
      <section className="opportunities-types" aria-label="Opportunity categories">
        {allOpportunityType ? (
          <OpportunityTypePill
            activeTypeId={activeOpportunityTypeId}
            onSelect={selectOpportunityType}
            option={allOpportunityType}
          />
        ) : null}

        <div className="opportunities-types-more" ref={moreMenuRef}>
          <button
            type="button"
            className={`opportunities-types-more-trigger${activeOpportunityTypeId !== 'all' ? ' has-selection' : ''}`}
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
            onClick={() => setIsMoreOpen((current) => !current)}
          >
            <FiMoreHorizontal aria-hidden="true" />
            <strong>More</strong>
            <FiChevronDown aria-hidden="true" />
          </button>

          {isMoreOpen ? (
            <div className="opportunities-types-more-menu" role="menu" aria-label="More opportunity categories">
              {additionalOpportunityTypes.map(({ id, label, description, count, Icon }) => (
                <button
                  type="button"
                  key={id}
                  role="menuitemradio"
                  aria-checked={activeOpportunityTypeId === id}
                  className={activeOpportunityTypeId === id ? 'is-active' : ''}
                  onClick={() => selectOpportunityType(id)}
                >
                  <span className="opportunities-types-more-icon"><Icon aria-hidden="true" /></span>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <em>{Number(count || 0).toLocaleString()}</em>
                  {activeOpportunityTypeId === id ? <FiCheck aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="opportunities-types-track">
          {additionalOpportunityTypes.map((option) => (
            <OpportunityTypePill
              key={option.id}
              activeTypeId={activeOpportunityTypeId}
              onSelect={selectOpportunityType}
              option={option}
            />
          ))}
        </div>
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
                  <FiBriefcase aria-hidden="true" />
                  <span>{item.company}</span>
                  <i aria-hidden="true" />
                  <span>{item.meta}</span>
                </p>
                <p className="opportunities-job-description">{item.description}</p>
                <p className="opportunities-job-outcome">
                  <FiTrendingUp aria-hidden="true" />
                  <span>{item.progressionOutcome}</span>
                </p>
                <div className="opportunities-tag-row">
                  {item.tags.map((tag) => (
                    <span key={`${item.title}-${tag}`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="opportunities-job-side">
                <p className="opportunities-job-pay">
                  <small>Opportunity value</small>
                  <strong>{item.pay}</strong>
                  <span>{item.unit}</span>
                </p>
                <div className="opportunities-job-side-footer">
                  <p className="opportunities-job-posted"><FiClock aria-hidden="true" />{item.posted}</p>
                  <span className="opportunities-job-open">View opportunity <FiArrowUpRight aria-hidden="true" /></span>
                </div>
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
