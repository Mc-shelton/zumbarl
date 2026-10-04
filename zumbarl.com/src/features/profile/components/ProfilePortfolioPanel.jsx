import { useRef, useState } from 'react'
import { FiChevronDown, FiEdit3, FiLock, FiStar } from 'react-icons/fi'
import {
  PORTFOLIO_FILTERS,
} from '../constants'
import ProfilePortfolioServicesPanel from './ProfilePortfolioServicesPanel'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function ProfilePortfolioPanel({
  activePortfolioFilter,
  isOwnProfile,
  onEditPortfolioItem,
  onFilterChange,
  onPortfolioItemSelect,
  onPortfolioServiceSelect,
  portfolioItems,
  portfolioFilterCounts,
  portfolioServices,
  selectedPortfolioId,
  selectedPortfolioServiceId,
}) {
  const [activeWorkView, setActiveWorkView] = useState('portfolio')
  const [transitionDirection, setTransitionDirection] = useState('back')
  const swipeStartRef = useRef(null)

  function changeWorkView(nextView) {
    if (nextView === activeWorkView) return
    setTransitionDirection(nextView === 'portfolio' ? 'forward' : 'back')
    setActiveWorkView(nextView)
    if (nextView === 'services') onPortfolioItemSelect(null)
    else onPortfolioServiceSelect(null)
  }

  function handleSwipeStart(event) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      target: event.target,
    }
  }

  function handleSwipeEnd(event) {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || event.pointerType !== 'touch' || !event.isPrimary) return
    if (start.target.closest?.('.campus-work-view-tabs, .campus-portfolio-filter-row')) return

    const horizontalDistance = event.clientX - start.x
    const verticalDistance = event.clientY - start.y
    if (Math.abs(horizontalDistance) < 64 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance) * 1.25) return

    if (horizontalDistance > 0 && activeWorkView === 'portfolio') {
      event.preventDefault()
      changeWorkView('services')
    } else if (horizontalDistance < 0 && activeWorkView === 'services') {
      event.preventDefault()
      changeWorkView('portfolio')
    }
  }

  return (
    <div
      className="campus-portfolio-workspace"
      onPointerCancel={() => { swipeStartRef.current = null }}
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
    >
      <section className="campus-profile-surface campus-work-view-switcher" aria-label="Choose work view">
        <div className="campus-work-view-tabs" role="tablist" aria-label="Services and portfolio">
          <button
            id="services-view-tab"
            type="button"
            role="tab"
            aria-controls="services-view-panel"
            aria-label={`Services, ${portfolioServices.length} items`}
            aria-selected={activeWorkView === 'services'}
            className={activeWorkView === 'services' ? 'is-active' : ''}
            onClick={() => changeWorkView('services')}
          >
            <span>Services</span><strong>{portfolioServices.length}</strong>
          </button>
          <button
            id="portfolio-view-tab"
            type="button"
            role="tab"
            aria-controls="portfolio-view-panel"
            aria-label={`Portfolio, ${portfolioItems.length} items`}
            aria-selected={activeWorkView === 'portfolio'}
            className={activeWorkView === 'portfolio' ? 'is-active' : ''}
            onClick={() => changeWorkView('portfolio')}
          >
            <span>Portfolio</span><strong>{portfolioItems.length}</strong>
          </button>
        </div>
      </section>

      {activeWorkView === 'services' ? (
        <div key="services" id="services-view-panel" role="tabpanel" aria-labelledby="services-view-tab" className={`campus-work-view-panel is-${transitionDirection}`}>
          <ProfilePortfolioServicesPanel
            onPortfolioServiceSelect={onPortfolioServiceSelect}
            portfolioServices={portfolioServices}
            selectedPortfolioServiceId={selectedPortfolioServiceId}
          />
        </div>
      ) : null}

      {activeWorkView === 'portfolio' ? (
      <section key="portfolio" id="portfolio-view-panel" className={`campus-profile-surface campus-portfolio-panel campus-work-view-panel is-${transitionDirection}`} role="tabpanel" aria-labelledby="portfolio-view-tab">
        <div className="campus-portfolio-sticky-head">
          <header className="campus-portfolio-head">
            <div>
              <h2>My Portfolio</h2>
              <p>Selected work, outcomes and client proof.</p>
            </div>
          </header>

          <div className="campus-portfolio-toolbar">
            <div className="campus-portfolio-filter-row">
              {PORTFOLIO_FILTERS.map(({ key, label }) => {
                const count = portfolioFilterCounts?.[key] || 0
                return (
                <button
                  key={key}
                  type="button"
                  className={`campus-portfolio-filter-chip${activePortfolioFilter === key ? ' is-active' : ''}`}
                  onClick={() => onFilterChange(key)}
                >
                  {label.replace(/\s*\(\d+\)$/, '')} ({count})
                </button>
                )
              })}
            </div>
            <button type="button" className="campus-portfolio-sort-btn">
              Most Recent
              <FiChevronDown aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="campus-portfolio-grid">
          {portfolioItems.map((item) => (
            <article
              key={item.id}
              className={`campus-portfolio-item${selectedPortfolioId === item.id ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedPortfolioId === item.id}
              onClick={() => onPortfolioItemSelect(item.id)}
              onKeyDown={(event) => handleKeyboardActivation(event, () => onPortfolioItemSelect(item.id))}
            >
              <div className="campus-portfolio-thumb">
                {item.featured ? <span className="campus-portfolio-featured">Featured</span> : null}
                {item.status !== 'PUBLISHED' ? <span className="campus-portfolio-draft"><FiLock />Draft</span> : null}
                {isOwnProfile ? <button type="button" className="campus-portfolio-more" aria-label={`Manage ${item.title}`} onClick={(event) => { event.stopPropagation(); onEditPortfolioItem(item.id) }}><FiEdit3 aria-hidden="true" /></button> : null}
                <img src={item.image} alt={`${item.title} preview`} loading="lazy" />
              </div>
              <div className="campus-portfolio-item-body">
                <p className="campus-portfolio-category">{item.category}</p>
                <h3>{item.title}</h3>
                <p className="campus-portfolio-description">{item.description}</p>
                <div className="campus-portfolio-item-foot">
                  <div className="campus-portfolio-client">
                    <img src="/assets/index/bee_nobg.png" alt={`${item.client} logo`} />
                    <div>
                      <strong>{item.client}</strong>
                      <p>
                        <FiStar aria-hidden="true" />
                        {item.rating}
                      </p>
                    </div>
                  </div>
                  <time>{item.date}</time>
                </div>
              </div>
            </article>
          ))}
          {!portfolioItems.length ? <p>No portfolio work added yet.</p> : null}
        </div>
      </section>
      ) : null}
    </div>
  )
}

export default ProfilePortfolioPanel
