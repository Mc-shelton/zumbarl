import { RECOMMENDATION_SECTIONS } from '../homeData'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function RecommendationCard({
  activeMarketplaceHover,
  activeMarketplaceSlide,
  item,
  onMarketplaceHoverEnd,
  onMarketplaceHoverStart,
  onOpenRecommendedGig,
  sectionId,
}) {
  if (sectionId === 'gigs') {
    return (
      <article
        key={`${sectionId}-${item.title}`}
        className="campus-gig-card"
        role="button"
        tabIndex={0}
        aria-label={`Open ${item.title} gig`}
        onClick={() => onOpenRecommendedGig(item.opportunityUuid, item.owner)}
        onKeyDown={(event) => handleKeyboardActivation(event, () => onOpenRecommendedGig(item.opportunityUuid, item.owner))}
      >
        <img className="campus-gig-cover" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
        <div className="campus-gigs-card-wrap">
          <img className="campus-gig-company-avatar" src="/assets/index/bee_nobg.png" alt={`${item.org} logo`} loading="lazy" />
          <div className="campus-gig-body">
            <h4>{item.title}</h4>
            <div className="campus-gig-detail">
              <p>{item.org}</p>
            </div>
            <span>{item.meta}</span>
            <strong>{item.value}</strong>
          </div>
        </div>
      </article>
    )
  }

  if (sectionId === 'marketplace') {
    const marketplaceKey = `${sectionId}-${item.title}`
    const marketplaceImages = item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails : [item.thumbnail]
    const isHovered = activeMarketplaceHover === marketplaceKey && marketplaceImages.length > 1
    const imageIndex = isHovered ? activeMarketplaceSlide % marketplaceImages.length : 0
    const activeImage = marketplaceImages[imageIndex]

    return (
      <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-market-card">
        <div
          className="campus-market-media"
          onMouseEnter={() => onMarketplaceHoverStart(marketplaceKey, marketplaceImages.length)}
          onMouseLeave={onMarketplaceHoverEnd}
        >
          <img
            key={`${marketplaceKey}-${imageIndex}`}
            className={`campus-market-cover${isHovered ? ' is-slideshow' : ''}`}
            src={activeImage}
            alt={`${item.title} thumbnail`}
            loading="lazy"
          />
        </div>
        <div className="campus-market-body">
          <h4>{item.title}</h4>
          <p>{item.org}</p>
          <div className="campus-market-foot">
            <span>{item.meta}</span>
            <strong>{item.value}</strong>
          </div>
        </div>
      </article>
    )
  }

  if (sectionId === 'communities') {
    return (
      <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-community-card">
        <div className="campus-community-head">
          <img className="campus-community-avatar" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
          <div>
            <h4>{item.title}</h4>
            <p>{item.org}</p>
          </div>
        </div>
        <span>{item.meta}</span>
        <strong>{item.value}</strong>
      </article>
    )
  }

  if (sectionId === 'events') {
    return (
      <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-event-reco-card">
        <img className="campus-event-reco-cover" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
        <div className="campus-event-reco-body">
          <h4>{item.title}</h4>
          <p>{item.org}</p>
          <span>{item.meta}</span>
          <strong>{item.value}</strong>
        </div>
      </article>
    )
  }

  return (
    <article key={`${sectionId}-${item.title}`} className="campus-reco-card campus-service-card">
      <div className="campus-service-head">
        <img className="campus-service-avatar" src={item.thumbnail} alt={`${item.title} thumbnail`} loading="lazy" />
        <div>
          <h4>{item.title}</h4>
          <p>{item.org}</p>
        </div>
      </div>
      <span>{item.meta}</span>
      <strong>{item.value}</strong>
    </article>
  )
}

function CampusRecommendations({
  activeMarketplaceHover,
  activeMarketplaceSlide,
  onMarketplaceHoverEnd,
  onMarketplaceHoverStart,
  onOpenRecommendedGig,
}) {
  return (
    <>
      {RECOMMENDATION_SECTIONS.map((section, index) => (
        <section key={section.id} className="campus-section">
          {index === 0 ? (
            <div className="campus-section-head">
              <div>
                <h3>{section.title}</h3>
                <p>{section.subtitle}</p>
              </div>
              <button type="button" className="campus-link-btn">
                View all
              </button>
            </div>
          ) : (
            <div className="campus-reco-strip">
              <p>{section.subtitle}</p>
              <button type="button" className="campus-link-btn">
                View all
              </button>
            </div>
          )}

          <div className={`campus-gigs-grid campus-gigs-grid-${section.id}`}>
            {section.items.map((item) => (
              <RecommendationCard
                key={`${section.id}-${item.title}`}
                activeMarketplaceHover={activeMarketplaceHover}
                activeMarketplaceSlide={activeMarketplaceSlide}
                item={item}
                onMarketplaceHoverEnd={onMarketplaceHoverEnd}
                onMarketplaceHoverStart={onMarketplaceHoverStart}
                onOpenRecommendedGig={onOpenRecommendedGig}
                sectionId={section.id}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default CampusRecommendations
