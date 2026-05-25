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
  FiTruck,
  FiUsers,
  FiHeart,
  FiTrendingUp,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
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

const MARKETPLACE_CATEGORIES = [
  { label: 'All Items', count: 2340, Icon: FiGrid, active: true },
  { label: 'Electronics', count: 420, Icon: FiSmartphone },
  { label: 'Books & Notes', count: 512, Icon: FiBookOpen },
  { label: 'Furniture', count: 268, Icon: FiHome },
  { label: 'Fashion', count: 318, Icon: FiShoppingBag },
  { label: 'Sports', count: 156, Icon: FiBox },
  { label: 'Services', count: 366, Icon: FiTool },
  { label: 'Other', count: 300, Icon: FiMoreHorizontal },
]

const FEATURED_ITEMS = [
  {
    id: 'featured-macbook',
    title: 'MacBook Air M1',
    category: 'Electronics',
    price: 'KSh 75,000',
    location: 'Kenyatta University',
    badge: 'Featured',
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  },
  {
    id: 'featured-accounting-notes',
    title: 'Fundamentals of Accounting',
    category: 'Books & Notes',
    price: 'KSh 1,200',
    location: 'Kenyatta University',
    badge: 'Featured',
    image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp',
  },
  {
    id: 'featured-chair',
    title: 'Study Desk Chair',
    category: 'Furniture',
    price: 'KSh 4,500',
    location: 'Kenyatta University',
    badge: 'Featured',
    image: '/assets/index/business_page_images/optimized/0xk-y5n-nhkRd7U-unsplash.webp',
  },
  {
    id: 'featured-nike',
    title: 'Nike Air Force 1',
    category: 'Fashion',
    price: 'KSh 3,000',
    location: 'Kenyatta University',
    badge: 'Featured',
    image: '/assets/index/business_page_images/optimized/vlad-hilitanu-1FI2QAYPa-Y-unsplash.webp',
  },
]

const RECENT_ITEMS = [
  {
    id: 'recent-iphone',
    title: 'iPhone 12 128GB',
    category: 'Electronics',
    price: 'KSh 38,000',
    location: 'Kenyatta University',
    posted: '2h ago',
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
  },
  {
    id: 'recent-notes',
    title: 'Engineering Mathematics Notes',
    category: 'Books & Notes',
    price: 'KSh 300',
    location: 'Kenyatta University',
    posted: '3h ago',
    image: '/assets/index/business_page_images/optimized/setengah-limasore-qUcZ3TUlgnM-unsplash.webp',
  },
  {
    id: 'recent-backpack',
    title: 'Laptop Backpack',
    category: 'Fashion',
    price: 'KSh 1,500',
    location: 'Kenyatta University',
    posted: '4h ago',
    image: '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  },
  {
    id: 'recent-printer',
    title: 'HP DeskJet 2130 Printer',
    category: 'Electronics',
    price: 'KSh 4,000',
    location: 'Kenyatta University',
    posted: '5h ago',
    image: '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp',
  },
  {
    id: 'recent-desk',
    title: 'Study Desk',
    category: 'Furniture',
    price: 'KSh 6,500',
    location: 'Kenyatta University',
    posted: '6h ago',
    image: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
]

const TRENDING_ITEMS = [
  { id: 'trend-airpods', title: 'AirPods Pro generation 2', price: 'KSh 16,000', trend: 12, image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp' },
  { id: 'trend-economics', title: 'Economics 4th Ed. Textbook', price: 'KSh 1,000', trend: 9, image: '/assets/index/business_page_images/optimized/alejandro-escamilla-BbQLHCpVUqA-unsplash.webp' },
  { id: 'trend-bike', title: 'Mountain Bike', price: 'KSh 18,500', trend: 7, image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp' },
  { id: 'trend-camera', title: 'Canon EOS 2000D Camera', price: 'KSh 32,000', trend: 6, image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp' },
  { id: 'trend-sofa', title: '2-Seater Sofa', price: 'KSh 12,000', trend: 5, image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp' },
]

const RECENT_FILTERS = ['All', 'Near You', 'New Today', 'Price: Low to High', 'Price: High to Low']

function OpportunitiesBuySellPage() {
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
              {MARKETPLACE_CATEGORIES.map(({ label, count, Icon, active }) => (
                <article key={label} className={`opportunities-marketplace-category${active ? ' is-active' : ''}`}>
                  <div className="opportunities-marketplace-category-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{label}</h3>
                  <p>{count.toLocaleString()}</p>
                </article>
              ))}
            </section>

            <section className="opportunities-marketplace-block" aria-label="Featured items">
              <div className="opportunities-section-head">
                <div>
                  <h2>Featured Items</h2>
                </div>
                <button type="button" className="campus-link-btn">View all</button>
              </div>

              <div className="opportunities-marketplace-featured-grid">
                {FEATURED_ITEMS.map((item) => (
                  <article key={item.id} className="opportunities-marketplace-card">
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
                        <button type="button" aria-label={`Save ${item.title}`}>
                          <FiHeart aria-hidden="true" />
                        </button>
                      </footer>
                    </div>
                  </article>
                ))}
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
                {RECENT_ITEMS.map((item) => (
                  <article key={item.id} className="opportunities-marketplace-card is-recent">
                    <div className="opportunities-marketplace-card-image-wrap">
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <button type="button" aria-label={`Save ${item.title}`}>
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
                {TRENDING_ITEMS.map((item) => (
                  <article key={item.id} className="opportunities-marketplace-trending-item">
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
