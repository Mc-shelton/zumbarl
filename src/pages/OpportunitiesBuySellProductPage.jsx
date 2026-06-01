import { useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiHeart,
  FiHome,
  FiLayers,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiPlus,
  FiSave,
  FiShare2,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FEATURED_ITEMS, MARKETPLACE_DEFAULT_SELLER, getMarketplaceItem, getMarketplaceItemPath, getMarketplaceRelatedItems } from '../data/marketplace'
import Seo from '../components/Seo'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: false, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, active: true, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, active: false, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen, active: false },
  { label: 'Community', Icon: FiUsers, active: false },
  { label: 'Finance', Icon: FiCreditCard, active: false },
  { label: 'Services', Icon: FiTruck, active: false },
  { label: 'Messages', Icon: FiMail, active: false },
  { label: 'Notifications', Icon: FiBell, active: false },
]

function OpportunitiesBuySellProductPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const item = useMemo(() => getMarketplaceItem(itemId) || FEATURED_ITEMS[0], [itemId])

  const galleryImages = item?.galleryImages?.length > 0 ? item.galleryImages : [item.image]
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0]

  const relatedItems = useMemo(() => getMarketplaceRelatedItems(item.id, 5), [item.id])
  const suggestedItems = useMemo(() => getMarketplaceRelatedItems(item.id, 3), [item.id])

  const detailRows = useMemo(() => {
    const rows = [
      { label: 'Category', value: item.categoryPath || item.category, Icon: FiTag },
      { label: 'Condition', value: item.condition || 'Good', Icon: FiShield },
      { label: 'Brand', value: item.brand || 'N/A', Icon: FiShoppingBag },
      { label: 'Model', value: item.model || item.title, Icon: FiPackage },
      { label: 'Color', value: item.color || 'N/A', Icon: FiLayers },
      { label: 'Included', value: item.included || 'Item only', Icon: FiPackage },
      { label: 'Posted on', value: item.postedOn || item.posted || 'Recently', Icon: FiClock },
      { label: 'Location', value: item.location, Icon: FiMapPin },
    ]

    if (item.storage && item.storage !== 'N/A') {
      rows.splice(4, 0, { label: 'Storage', value: item.storage, Icon: FiPackage })
    }

    if (item.ram && item.ram !== 'N/A') {
      rows.splice(5, 0, { label: 'RAM', value: item.ram, Icon: FiLayers })
    }

    return rows
  }, [item])

  const showThumbOverflow = galleryImages.length > 5
  const visibleThumbs = showThumbOverflow ? galleryImages.slice(0, 5) : galleryImages
  const overflowCount = Math.max(galleryImages.length - 5, 0)

  const setImageByIndex = (index) => {
    setActiveImageIndex(index)
  }

  const stepImage = (delta) => {
    const total = galleryImages.length
    setActiveImageIndex((previous) => (previous + delta + total) % total)
  }

  const openItemDetail = (nextItemId) => {
    if (!nextItemId) {
      return
    }

    navigate(getMarketplaceItemPath(nextItemId))
    setActiveImageIndex(0)
  }

  const handleCardKeyDown = (event, nextItemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openItemDetail(nextItemId)
    }
  }

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page opportunities-marketplace-product-page">
      <Seo
        title={`${item.title} | Zumbarl Buy & Sell`}
        description={item.subtitle || item.description || CAMPUS_BUY_SELL_SEO.description}
        path={getMarketplaceItemPath(item.id)}
        keywords={`${CAMPUS_BUY_SELL_SEO.keywords}, ${item.title}, ${item.category}`}
        jsonLd={[CAMPUS_BUY_SELL_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-marketplace-shell">
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
              <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
              <span className="campus-brand-text">zumbarl.</span>
            </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, active, href }) =>
                href ? (
                  <Link
                    key={label}
                    to={href}
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card" to="/campus/profile" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>

            <section className="campus-sidebar-card">
              <h3>Invite your friends</h3>
              <p>Bring your squad and earn rewards together.</p>
              <button type="button" className="campus-pill-btn">
                Invite Now
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          </aside>

          <section className="campus-main opportunities-main opportunities-marketplace-main opportunities-marketplace-product-main">
            <header className="campus-header opportunities-header opportunities-marketplace-header">
              <div className="opportunities-head-copy">
                <p className="opportunities-breadcrumb">
                  <span>Opportunities</span>
                  <FiChevronRight aria-hidden="true" />
                  <strong>Buy &amp; Sell</strong>
                </p>
                <h1 className="opportunities-title">Buy &amp; Sell</h1>
                <p className="opportunities-subtitle">Student marketplace for products, services and more.</p>
              </div>

              <div className="campus-header-actions opportunities-marketplace-actions">
                <button type="button" className="opportunities-marketplace-post-btn">
                  <FiPlus aria-hidden="true" />
                  Post an Item
                </button>
                <button type="button" className="campus-icon-btn" aria-label="Open messages">
                  <FiMessageCircle aria-hidden="true" />
                  <span className="campus-badge">3</span>
                </button>
                <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                  <FiBell aria-hidden="true" />
                  <span className="campus-badge">6</span>
                </button>
                <button type="button" className="opportunities-user-btn" aria-label="Open profile menu">
                  <img src="/assets/index/bee_nobg.png" alt="Brian avatar" />
                </button>
              </div>
            </header>

            <section className="opportunities-marketplace-product-head" aria-label="Product overview">
              <div>
                <p className="opportunities-breadcrumb opportunities-marketplace-product-breadcrumb">
                  <Link to="/campus/opportunities">Opportunities</Link>
                  <FiChevronRight aria-hidden="true" />
                  <Link to="/campus/opportunities/buy-sell">Buy &amp; Sell</Link>
                  <FiChevronRight aria-hidden="true" />
                  <strong>{item.title}</strong>
                </p>
                <h2>{item.title}</h2>
                <p>
                  <span>{item.subtitle || 'Quality item posted by a verified campus seller.'}</span>
                  {item.badge ? <em>{item.badge}</em> : null}
                </p>
              </div>

              <div className="opportunities-marketplace-product-head-actions">
                <button type="button">
                  <FiShare2 aria-hidden="true" />
                  Share
                </button>
                <button type="button">
                  <FiSave aria-hidden="true" />
                  Save
                </button>
              </div>
            </section>

            <section className="opportunities-marketplace-product-grid" aria-label="Product media and details">
              <article className="opportunities-marketplace-product-gallery-card">
                <div className="opportunities-marketplace-product-hero-wrap">
                  <span>{activeImageIndex + 1}/{galleryImages.length}</span>
                  <img src={activeImage} alt={item.title} loading="lazy" />

                  <button
                    type="button"
                    className="opportunities-marketplace-product-image-nav is-prev"
                    onClick={() => stepImage(-1)}
                    aria-label="Previous product image"
                  >
                    <FiChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="opportunities-marketplace-product-image-nav is-next"
                    onClick={() => stepImage(1)}
                    aria-label="Next product image"
                  >
                    <FiChevronRight aria-hidden="true" />
                  </button>
                </div>

                <div className="opportunities-marketplace-product-thumbs" role="tablist" aria-label="Product images">
                  {visibleThumbs.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={activeImageIndex === index ? 'is-active' : ''}
                      onClick={() => setImageByIndex(index)}
                      aria-label={`Show image ${index + 1}`}
                    >
                      <img src={image} alt={`${item.title} preview ${index + 1}`} loading="lazy" />
                    </button>
                  ))}

                  {showThumbOverflow ? (
                    <button
                      type="button"
                      className="opportunities-marketplace-product-thumbs-more"
                      onClick={() => setImageByIndex(visibleThumbs.length)}
                      aria-label={`Show ${overflowCount} more images`}
                    >
                      +{overflowCount}
                      <small>more</small>
                    </button>
                  ) : null}
                </div>
              </article>

              <article className="opportunities-marketplace-product-detail-card">
                <h3>Details</h3>
                <dl>
                  {detailRows.map(({ label, value, Icon }) => (
                    <div key={label}>
                      <dt>
                        <Icon aria-hidden="true" />
                        {label}
                      </dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>

                <section className="opportunities-marketplace-product-description">
                  <h4>Description</h4>
                  <p>{item.description}</p>
                  <button type="button" className="campus-link-btn">See less</button>
                </section>
              </article>
            </section>

            <section className="opportunities-marketplace-product-related" aria-label="Related items">
              <div className="opportunities-section-head">
                <h3>Related Items</h3>
              </div>

              <div className="opportunities-marketplace-product-related-grid">
                {relatedItems.map((related) => (
                  <article
                    key={related.id}
                    className="opportunities-marketplace-product-mini-card"
                    role="link"
                    tabIndex={0}
                    onClick={() => openItemDetail(related.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, related.id)}
                    aria-label={`Open ${related.title}`}
                  >
                    <img src={related.image} alt={related.title} loading="lazy" />
                    <h4>{related.title}</h4>
                    <p>{related.category}</p>
                    <strong>{related.price}</strong>
                    <button type="button" aria-label={`Save ${related.title}`}>
                      <FiHeart aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="campus-rail opportunities-rail opportunities-marketplace-rail opportunities-marketplace-product-rail" aria-label="Product purchase and seller info">
            <section className="campus-rail-card opportunities-marketplace-product-price-card">
              <p>{item.price}</p>
              <button type="button" className="opportunities-marketplace-product-primary-btn">
                <FiMessageCircle aria-hidden="true" />
                Chat with Seller
              </button>
              <button type="button" className="opportunities-marketplace-product-secondary-btn">Make an Offer</button>

              <article>
                <FiShield aria-hidden="true" />
                <div>
                  <h4>Shop safely</h4>
                  <p>Meet in a public place and check the item before paying.</p>
                </div>
              </article>
            </section>

            <section className="campus-rail-card opportunities-marketplace-product-seller-card">
              <h3>Seller Information</h3>

              <div className="opportunities-marketplace-product-seller-head">
                <img src={MARKETPLACE_DEFAULT_SELLER.avatar} alt={MARKETPLACE_DEFAULT_SELLER.name} />
                <div>
                  <h4>{MARKETPLACE_DEFAULT_SELLER.name}</h4>
                  <p>{MARKETPLACE_DEFAULT_SELLER.role}</p>
                  <span>{MARKETPLACE_DEFAULT_SELLER.campus}</span>
                </div>
              </div>

              <div className="opportunities-marketplace-product-seller-metrics">
                <article>
                  <strong>{MARKETPLACE_DEFAULT_SELLER.itemsSold}</strong>
                  <span>Items Sold</span>
                </article>
                <article>
                  <strong>{MARKETPLACE_DEFAULT_SELLER.rating}</strong>
                  <span>({MARKETPLACE_DEFAULT_SELLER.reviews} reviews)</span>
                </article>
                <article>
                  <strong>{MARKETPLACE_DEFAULT_SELLER.joined}</strong>
                  <span>Joined</span>
                </article>
              </div>

              <button type="button" className="opportunities-marketplace-product-secondary-btn">View Seller Profile</button>
            </section>

            <section className="campus-rail-card opportunities-marketplace-product-suggested-card">
              <div className="opportunities-section-head">
                <h3>You may also like</h3>
                <button type="button" className="campus-link-btn">View all</button>
              </div>

              <div className="opportunities-marketplace-product-suggested-list">
                {suggestedItems.map((suggested) => (
                  <article
                    key={suggested.id}
                    className="opportunities-marketplace-product-suggested-item"
                    role="link"
                    tabIndex={0}
                    onClick={() => openItemDetail(suggested.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, suggested.id)}
                    aria-label={`Open ${suggested.title}`}
                  >
                    <img src={suggested.image} alt={suggested.title} loading="lazy" />
                    <div>
                      <h4>{suggested.title}</h4>
                      <p>{suggested.price}</p>
                    </div>
                    <FiHeart aria-hidden="true" />
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellProductPage
