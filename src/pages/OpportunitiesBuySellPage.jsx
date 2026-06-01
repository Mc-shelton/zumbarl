import { useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiHeart,
  FiHome,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiSmartphone,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { getMarketplaceItemPath, FEATURED_ITEMS, MARKETPLACE_CATEGORIES, RECENT_FILTERS, RECENT_ITEMS, TRENDING_ITEMS } from '../data/marketplace'
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

const CATEGORY_ICON_MAP = {
  grid: FiGrid,
  smartphone: FiSmartphone,
  book: FiBookOpen,
  home: FiHome,
  'shopping-bag': FiShoppingBag,
  box: FiBox,
  tool: FiTool,
  more: FiMoreHorizontal,
}

function OpportunitiesBuySellPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All Items')

  const filteredFeaturedItems = useMemo(() => {
    if (activeCategory === 'All Items') {
      return FEATURED_ITEMS
    }

    return FEATURED_ITEMS.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  const filteredRecentItems = useMemo(() => {
    if (activeCategory === 'All Items') {
      return RECENT_ITEMS
    }

    return RECENT_ITEMS.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  const filteredTrendingItems = useMemo(() => {
    if (activeCategory === 'All Items') {
      return TRENDING_ITEMS
    }

    return TRENDING_ITEMS.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  const openItemDetail = (itemId) => {
    navigate(getMarketplaceItemPath(itemId))
  }

  const handleCardKeyDown = (event, itemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openItemDetail(itemId)
    }
  }

  const preventCardNavigation = (event) => {
    event.stopPropagation()
  }

  const handleCategoryKeyDown = (event, categoryLabel) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setActiveCategory(categoryLabel)
    }
  }

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page">
      <Seo
        title={CAMPUS_BUY_SELL_SEO.title}
        description={CAMPUS_BUY_SELL_SEO.description}
        path={CAMPUS_BUY_SELL_SEO.path}
        keywords={CAMPUS_BUY_SELL_SEO.keywords}
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

          <section className="campus-main opportunities-main opportunities-marketplace-main">
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

            <section className="opportunities-marketplace-search-row" aria-label="Search marketplace items">
              <div className="opportunities-marketplace-search-field">
                <FiSearch aria-hidden="true" />
                <input type="search" placeholder="Search items, brands or categories..." />
              </div>

              <button type="button" className="opportunities-location-btn opportunities-marketplace-location-btn">
                <FiMapPin aria-hidden="true" />
                All locations
                <FiChevronDown aria-hidden="true" />
              </button>

              <button type="button" className="opportunities-search-btn opportunities-marketplace-search-btn">Search</button>
            </section>

            <section className="opportunities-marketplace-categories" aria-label="Marketplace categories">
              {MARKETPLACE_CATEGORIES.map(({ label, count, icon }) => {
                const Icon = CATEGORY_ICON_MAP[icon] || FiMoreHorizontal
                const isActive = label === activeCategory

                return (
                  <article
                    key={label}
                    className={`opportunities-marketplace-category is-clickable${isActive ? ' is-active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveCategory(label)}
                    onKeyDown={(event) => handleCategoryKeyDown(event, label)}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${label}`}
                  >
                    <div className="opportunities-marketplace-category-icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <h3>{label}</h3>
                    <p>{count.toLocaleString()}</p>
                  </article>
                )
              })}
            </section>

            <section className="opportunities-marketplace-block" aria-label="Featured items">
              <div className="opportunities-section-head">
                <div>
                  <h2>Featured Items</h2>
                </div>
                <button type="button" className="campus-link-btn">View all</button>
              </div>

              <div className="opportunities-marketplace-featured-grid">
                {filteredFeaturedItems.map((item) => (
                  <article
                    key={item.id}
                    className="opportunities-marketplace-card is-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={() => openItemDetail(item.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, item.id)}
                    aria-label={`Open ${item.title}`}
                  >
                    <div className="opportunities-marketplace-card-image-wrap">
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <span>{item.badge}</span>
                    </div>

                    <div className="opportunities-marketplace-card-body">
                      <h3>{item.title}</h3>
                      <p className="opportunities-marketplace-card-category">{item.category}</p>
                      <p className="opportunities-marketplace-card-price">{item.price}</p>
                      <footer>
                        <p>
                          <FiMapPin aria-hidden="true" />
                          {item.location}
                        </p>
                        <button type="button" aria-label={`Save ${item.title}`} onClick={preventCardNavigation}>
                          <FiHeart aria-hidden="true" />
                        </button>
                      </footer>
                    </div>
                  </article>
                ))}

                {filteredFeaturedItems.length === 0 ? (
                  <article className="opportunities-marketplace-empty-state" aria-live="polite">
                    <p>No featured items in {activeCategory} right now.</p>
                  </article>
                ) : null}
              </div>
            </section>

            <section className="opportunities-marketplace-block" aria-label="Recently added items">
              <div className="opportunities-section-head">
                <div>
                  <h2>Recently Added</h2>
                </div>
                <button type="button" className="campus-link-btn">View all</button>
              </div>

              <div className="opportunities-marketplace-filters" role="tablist" aria-label="Recently added filters">
                {RECENT_FILTERS.map((filter, index) => (
                  <button key={filter} type="button" className={index === 0 ? 'is-active' : ''}>
                    {filter}
                  </button>
                ))}
              </div>

              <div className="opportunities-marketplace-recent-grid">
                {filteredRecentItems.map((item) => (
                  <article
                    key={item.id}
                    className="opportunities-marketplace-card is-recent is-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={() => openItemDetail(item.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, item.id)}
                    aria-label={`Open ${item.title}`}
                  >
                    <div className="opportunities-marketplace-card-image-wrap">
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <button type="button" aria-label={`Save ${item.title}`} onClick={preventCardNavigation}>
                        <FiHeart aria-hidden="true" />
                      </button>
                    </div>

                    <div className="opportunities-marketplace-card-body">
                      <h3>{item.title}</h3>
                      <p className="opportunities-marketplace-card-category">{item.category}</p>
                      <p className="opportunities-marketplace-card-price">{item.price}</p>
                      <footer>
                        <p>
                          <FiMapPin aria-hidden="true" />
                          {item.location}
                        </p>
                        <span>
                          <FiClock aria-hidden="true" />
                          {item.posted}
                        </span>
                      </footer>
                    </div>
                  </article>
                ))}

                {filteredRecentItems.length === 0 ? (
                  <article className="opportunities-marketplace-empty-state" aria-live="polite">
                    <p>No recently added items in {activeCategory} yet.</p>
                  </article>
                ) : null}
              </div>
            </section>
          </section>

          <aside className="campus-rail opportunities-rail opportunities-marketplace-rail" aria-label="Marketplace filters and trends">
            <section className="campus-rail-card opportunities-marketplace-filter-card">
              <header>
                <h3>Filter Items</h3>
                <button type="button" className="campus-link-btn">Clear all</button>
              </header>

              <div className="opportunities-marketplace-filter-group">
                <h4>Category</h4>
                <button type="button" className="opportunities-select">
                  All Categories
                  <FiChevronDown aria-hidden="true" />
                </button>
              </div>

              <div className="opportunities-marketplace-filter-group">
                <h4>Condition</h4>
                <button type="button" className="opportunities-select">
                  All Conditions
                  <FiChevronDown aria-hidden="true" />
                </button>
              </div>

              <div className="opportunities-marketplace-filter-group">
                <h4>Price Range</h4>
                <div className="opportunities-budget-row">
                  <input type="text" placeholder="Min" />
                  <input type="text" placeholder="Max" />
                </div>
              </div>

              <div className="opportunities-marketplace-filter-group">
                <h4>Location</h4>
                <button type="button" className="opportunities-select">
                  All Locations
                  <FiChevronDown aria-hidden="true" />
                </button>
              </div>

              <button type="button" className="opportunities-search-btn opportunities-marketplace-apply-btn">
                Apply Filters
              </button>
            </section>

            <section className="campus-rail-card opportunities-marketplace-trending-card">
              <header>
                <h3>Trending on Campus</h3>
                <button type="button" className="campus-link-btn">View all</button>
              </header>

              <div className="opportunities-marketplace-trending-list">
                {filteredTrendingItems.map((item) => (
                  <article
                    key={item.id}
                    className="opportunities-marketplace-trending-item"
                    role="link"
                    tabIndex={0}
                    onClick={() => openItemDetail(item.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, item.id)}
                    aria-label={`Open ${item.title}`}
                  >
                    <img src={item.image} alt={item.title} loading="lazy" />

                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.price}</p>
                    </div>

                    <span>
                      <FiTrendingUp aria-hidden="true" />
                      {item.trend}
                    </span>
                  </article>
                ))}

                {filteredTrendingItems.length === 0 ? (
                  <article className="opportunities-marketplace-empty-state is-compact" aria-live="polite">
                    <p>No trending items in {activeCategory} right now.</p>
                  </article>
                ) : null}
              </div>

              <button type="button" className="opportunities-marketplace-trending-cta">
                See more trending
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellPage
