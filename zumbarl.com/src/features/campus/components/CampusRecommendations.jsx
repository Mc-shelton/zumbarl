import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

const SECTION_LINKS = {
  stories: '/campus/explore',
  posts: '/campus/explore',
  gigs: '/campus/opportunities',
  marketplace: '/campus/opportunities/buy-sell',
  communities: '/campus/explore',
  events: '/campus/explore',
  roadmaps: '/campus/learn',
  services: '/campus/opportunities/buy-sell?mode=services',
}

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
        onClick={() => onOpenRecommendedGig(item.opportunityUuid || item.id, item.owner, item.href)}
        onKeyDown={(event) => handleKeyboardActivation(event, () => onOpenRecommendedGig(item.opportunityUuid || item.id, item.owner, item.href))}
      >
        <img
          className="campus-gig-cover"
          src={normalizeZumbarlFileUrl(item.thumbnail) || '/assets/index/bee_nobg.png'}
          alt={`${item.title} thumbnail`}
          loading="lazy"
        />
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
    const activeImage = normalizeZumbarlFileUrl(marketplaceImages[imageIndex])

    return (
      <Link to={item.href || '/campus/opportunities/buy-sell'} className="campus-reco-card campus-market-card">
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
      </Link>
    )
  }

  if (sectionId === 'communities') {
    return (
      <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-community-card">
        <div className="campus-community-head">
          <img className="campus-community-avatar" src={normalizeZumbarlFileUrl(item.thumbnail)} alt={`${item.title} thumbnail`} loading="lazy" />
          <div>
            <h4>{item.title}</h4>
            <p>{item.org}</p>
          </div>
        </div>
        <span>{item.meta}</span>
        <strong>{item.value}</strong>
      </Link>
    )
  }

  if (sectionId === 'events' || sectionId === 'stories' || sectionId === 'posts' || sectionId === 'roadmaps') {
    return (
      <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-event-reco-card">
        {item.thumbnail ? <img className="campus-event-reco-cover" src={normalizeZumbarlFileUrl(item.thumbnail)} alt={`${item.title} thumbnail`} loading="lazy" /> : null}
        <div className="campus-event-reco-body">
          <h4>{item.title}</h4>
          <p>{item.org}</p>
          <span>{item.meta}</span>
          <strong>{item.value}</strong>
        </div>
      </Link>
    )
  }

  return (
    <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-service-card">
      <div className="campus-service-head">
        {item.thumbnail ? <img className="campus-service-avatar" src={normalizeZumbarlFileUrl(item.thumbnail)} alt={`${item.title} thumbnail`} loading="lazy" /> : null}
        <div>
          <h4>{item.title}</h4>
          <p>{item.org}</p>
        </div>
      </div>
      <span>{item.meta}</span>
      <strong>{item.value}</strong>
    </Link>
  )
}

function CampusRecommendations({
  activeMarketplaceHover,
  activeMarketplaceSlide,
  onMarketplaceHoverEnd,
  onMarketplaceHoverStart,
  onOpenRecommendedGig,
  recommendationSections = [],
}) {
  const populatedSections = recommendationSections.filter((section) => Array.isArray(section.items) && section.items.length)

  return (
    <>
      {populatedSections.map((section, index) => (
        <section key={section.id} className="campus-section">
          {index === 0 ? (
            <div className="campus-section-head">
              <div>
                <h3>{section.title}</h3>
                <p>{section.subtitle}</p>
              </div>
              <Link to={SECTION_LINKS[section.id] || '/campus/explore'} className="campus-link-btn">
                View all
              </Link>
            </div>
          ) : (
            <div className="campus-reco-strip">
              <p>{section.subtitle}</p>
              <Link to={SECTION_LINKS[section.id] || '/campus/explore'} className="campus-link-btn">
                View all
              </Link>
            </div>
          )}

          <div className={`campus-gigs-grid campus-gigs-grid-${section.id}`}>
            {section.items.map((item, itemIndex) => (
              <RecommendationCard
                key={`${section.id}-${item.id || item.opportunityUuid || item.title}-${itemIndex}`}
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
