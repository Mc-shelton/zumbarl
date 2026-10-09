import {
  FiArrowUpRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiImage,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import ProfileAvatar from '../../../components/ui/ProfileAvatar'

const SECTION_LINKS = {
  posts: '/campus/explore',
  gigs: '/campus/opportunities',
  marketplace: '/campus/opportunities/buy-sell',
  communities: '/campus/explore',
  events: '/campus/explore',
  roadmaps: '/campus/learn?view=path',
  services: '/campus/opportunities/buy-sell?mode=services',
}

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function formatEventMeta(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: String(value || 'Date to be confirmed'), time: '' }
  }

  return {
    date: new Intl.DateTimeFormat('en-KE', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-KE', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  }
}

function MediaFallback({ Icon = FiImage }) {
  return <span className="campus-card-media-placeholder"><Icon aria-hidden="true" /></span>
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
        <div className="campus-gig-media">
          {item.thumbnail ? <img
            className="campus-gig-cover"
            src={normalizeZumbarlFileUrl(item.thumbnail)}
            alt=""
            loading="lazy"
          /> : <span className="campus-gig-cover is-placeholder"><FiBriefcase aria-hidden="true" /></span>}
          <span className="campus-gig-type">{item.meta || 'Flexible opportunity'}</span>
        </div>
        <div className="campus-gig-content">
          <div className="campus-gig-company">
            {item.companyLogo ? <img className="campus-gig-company-avatar" src={normalizeZumbarlFileUrl(item.companyLogo)} alt="" loading="lazy" /> : <span className="campus-gig-company-avatar is-placeholder"><FiBriefcase aria-hidden="true" /></span>}
            <div>
              <span>Recommended opportunity</span>
              <p>{item.org || 'Zumbarl partner'}</p>
            </div>
          </div>
          <h4>{item.title}</h4>
          <p className="campus-gig-summary">{item.recommendationReason || item.description || 'A paid opportunity matched to your campus activity and skills.'}</p>
          {Array.isArray(item.tags) && item.tags.length ? <div className="campus-gig-skills">
            {item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div> : null}
          <footer className="campus-gig-footer">
            <div><span>Budget</span><strong>{item.value}</strong></div>
            <span className="campus-gig-open">View role <FiArrowUpRight aria-hidden="true" /></span>
          </footer>
        </div>
      </article>
    )
  }

  if (sectionId === 'posts') {
    return (
      <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-social-reco-card">
        {item.thumbnail ? <img className="campus-event-reco-cover" src={normalizeZumbarlFileUrl(item.thumbnail)} alt="" loading="lazy" /> : <span className="campus-social-reco-placeholder"><FiImage aria-hidden="true" /></span>}
        <div className="campus-event-reco-body">
          <div className="campus-reco-creator">
            <ProfileAvatar src={item.avatar} alt="" loading="lazy" />
            <p>{item.org}</p>
          </div>
          <h4>{item.title}</h4>
          {item.description ? <p className="campus-reco-summary">{item.description}</p> : null}
          <footer><span>{item.meta}</span><strong>{item.value}</strong></footer>
        </div>
      </Link>
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
          {activeImage ? <img
              key={`${marketplaceKey}-${imageIndex}`}
              className={`campus-market-cover${isHovered ? ' is-slideshow' : ''}`}
              src={activeImage}
              alt=""
              loading="lazy"
            /> : <MediaFallback Icon={FiShoppingBag} />}
          <span className="campus-card-badge">{item.condition || 'Available'}</span>
        </div>
        <div className="campus-market-body">
          <p className="campus-card-kicker">{item.org}</p>
          <h4>{item.title}</h4>
          {item.description ? <p className="campus-card-summary">{item.description}</p> : null}
          <div className="campus-market-foot">
            <span>{item.meta}</span>
            <strong>{item.value}</strong>
            <FiArrowUpRight aria-hidden="true" />
          </div>
        </div>
      </Link>
    )
  }

  if (sectionId === 'communities') {
    return (
      <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-community-card">
        <div className="campus-community-head">
          {item.thumbnail ? <img className="campus-community-avatar" src={normalizeZumbarlFileUrl(item.thumbnail)} alt="" loading="lazy" /> : <span className="campus-community-avatar is-placeholder"><FiUsers aria-hidden="true" /></span>}
          <div>
            <span className="campus-card-kicker">Student community</span>
            <h4>{item.title}</h4>
            <p>{item.org}</p>
          </div>
        </div>
        <div className="campus-card-footer">
          <span><FiUsers aria-hidden="true" /> {item.meta}</span>
          <strong>{item.value}</strong>
          <FiArrowUpRight aria-hidden="true" />
        </div>
      </Link>
    )
  }

  if (sectionId === 'events') {
    const eventMeta = formatEventMeta(item.meta)

    return (
      <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-event-reco-card">
        <div className="campus-event-reco-media">
          {item.thumbnail ? <img className="campus-event-reco-cover" src={normalizeZumbarlFileUrl(item.thumbnail)} alt="" loading="lazy" /> : <MediaFallback Icon={FiCalendar} />}
          <strong className="campus-card-badge">{item.value}</strong>
        </div>
        <div className="campus-event-reco-body">
          <span className="campus-card-kicker">Upcoming event</span>
          <h4>{item.title}</h4>
          <p>{item.org}</p>
          <div className="campus-event-meta">
            <span><FiCalendar aria-hidden="true" /> {eventMeta.date}</span>
            {eventMeta.time ? <span><FiClock aria-hidden="true" /> {eventMeta.time}</span> : null}
          </div>
          <div className="campus-card-footer">
            <span>{item.attendeeCount ? `${item.attendeeCount} attending` : 'Be the first to join'}</span>
            <strong>{item.isGoing ? 'You’re going' : item.actionLabel || 'View event'}</strong>
            <FiArrowUpRight aria-hidden="true" />
          </div>
        </div>
      </Link>
    )
  }

  if (sectionId === 'roadmaps') {
    return (
      <Link to={item.href || '/campus/learn?view=path'} className="campus-reco-card campus-roadmap-card">
        <div className="campus-roadmap-media">
          {item.thumbnail ? <img src={normalizeZumbarlFileUrl(item.thumbnail)} alt="" loading="lazy" /> : <MediaFallback Icon={FiBookOpen} />}
        </div>
        <div className="campus-roadmap-body">
          <span className="campus-card-kicker">Learning path</span>
          <h4>{item.title}</h4>
          <p>{item.org}</p>
          <div className="campus-roadmap-tags">
            {(item.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="campus-card-footer">
            <span>{item.meta}</span>
            <strong>{item.value}</strong>
            <FiArrowUpRight aria-hidden="true" />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={item.href || '/campus/explore'} className="campus-reco-card campus-service-card">
      <div className="campus-service-head">
        {item.thumbnail ? <img className="campus-service-avatar" src={normalizeZumbarlFileUrl(item.thumbnail)} alt="" loading="lazy" /> : <span className="campus-service-avatar is-placeholder"><FiShoppingBag aria-hidden="true" /></span>}
        <div>
          <span className="campus-card-kicker">Campus service</span>
          <h4>{item.title}</h4>
          <p>{item.org}</p>
        </div>
      </div>
      <div className="campus-card-footer">
        <span>{item.meta}</span>
        <strong>{item.value}</strong>
        <FiArrowUpRight aria-hidden="true" />
      </div>
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
  const populatedSections = recommendationSections.filter((section) => (
    section.id !== 'posts' && Array.isArray(section.items) && section.items.length
  ))

  return (
    <>
      {populatedSections.map((section) => (
        <section key={section.id} className={`campus-section campus-recommendation-section is-${section.id}`}>
          <div className="campus-section-head">
            <div>
              <h3>{section.title}</h3>
              <p>{section.subtitle}</p>
            </div>
            <Link to={SECTION_LINKS[section.id] || '/campus/explore'} className="campus-link-btn">
              View all
            </Link>
          </div>

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
