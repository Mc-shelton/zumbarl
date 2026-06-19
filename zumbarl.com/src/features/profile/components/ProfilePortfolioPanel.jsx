import { FiArrowRight, FiChevronDown, FiMoreVertical, FiStar } from 'react-icons/fi'
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
  onFilterChange,
  onPortfolioItemSelect,
  onPortfolioServiceSelect,
  portfolioItems,
  portfolioServices,
  selectedPortfolioId,
  selectedPortfolioServiceId,
}) {
  return (
    <>
      <ProfilePortfolioServicesPanel
        onPortfolioServiceSelect={onPortfolioServiceSelect}
        portfolioServices={portfolioServices}
        selectedPortfolioServiceId={selectedPortfolioServiceId}
      />

      <section className="campus-profile-surface campus-portfolio-panel">
        <div className="campus-portfolio-sticky-head">
          <header className="campus-portfolio-head">
            <div>
              <h2>My Portfolio</h2>
              <p>A collection of my best work across different categories.</p>
            </div>
          </header>

          <div className="campus-portfolio-toolbar">
            <div className="campus-portfolio-filter-row">
              {PORTFOLIO_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`campus-portfolio-filter-chip${activePortfolioFilter === key ? ' is-active' : ''}`}
                  onClick={() => onFilterChange(key)}
                >
                  {label}
                </button>
              ))}
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
                <button type="button" className="campus-portfolio-more" aria-label="Project actions">
                  <FiMoreVertical aria-hidden="true" />
                </button>
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
        </div>
      </section>

      <section className="campus-profile-surface campus-portfolio-case-study">
        <div className="campus-portfolio-case-head">
          <div>
            <p>
              <FiStar aria-hidden="true" />
              Featured Case Study
            </p>
            <h3>Media Campaigns</h3>
            <span>Social Media · May 12, 2025</span>
          </div>
          <button type="button" className="campus-portfolio-case-btn">
            View Case Study
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="campus-portfolio-case-body">
          <div className="campus-portfolio-case-metrics">
            <article>
              <strong>45%</strong>
              <p>Engagement Increase</p>
            </article>
            <article>
              <strong>2.3K</strong>
              <p>New Followers</p>
            </article>
            <article>
              <strong>12.5K</strong>
              <p>Reach</p>
            </article>
            <article>
              <strong>5.0/5</strong>
              <p>Client Rating</p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

export default ProfilePortfolioPanel
