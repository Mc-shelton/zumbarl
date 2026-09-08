import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCoffee,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { Breadcrumb, TabNav } from '../components/ui'
import {
  getPreparationMinutes,
  isCampusEateryListing,
  isCampusEateryShop,
  isFoodListing,
  isStudentKitchenShop,
} from '../features/eatery/eateryListings'
import {
  listMarketplaceListings,
  listMarketplaceShops,
  listMyCampusVendors,
  mapMarketplaceApiListing,
  readMyMarketplaceInventory,
} from '../features/opportunities/services/marketplaceInteractionService'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend } from '../features/auth/services/authUserService'
import { CAMPUS_EATERY_SEO } from '../features/seo/constants'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import '../styles/campus.css'
import '../styles/eatery.css'

const EATERY_TABS = [
  { id: 'all-food', label: 'All Food' },
  { id: 'campus-eateries', label: 'Campus Eateries' },
  { id: 'student-kitchens', label: 'Student Kitchens' },
]

const MEAL_FILTERS = ['All', 'Meals', 'Quick bites', 'Drinks', 'Under KSh 200']
const FALLBACK_FOOD_IMAGE = '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp'
const KITCHEN_PROMO_DISMISSAL_KEY = 'zumbarl.eatery.startKitchenDismissed.v1'

function kitchenPromoDismissalKey(studentId) {
  return `${KITCHEN_PROMO_DISMISSAL_KEY}:${studentId}`
}

function inventoryHasKitchen(inventory) {
  if ((inventory?.listings || []).some(isFoodListing)) return true
  const shop = inventory?.shop
  const shopDescription = `${shop?.name || ''} ${shop?.category || ''} ${shop?.tagline || ''}`.toLowerCase()
  return /\b(food|meal|eatery|restaurant|cafe|coffee|baker|kitchen)\b/.test(shopDescription)
}

function matchesMealFilter(item, filter) {
  if (filter === 'All') return true
  if (filter === 'Under KSh 200') return Number(item.priceAmount || 0) <= 200
  const searchable = `${item.category || ''} ${item.foodType || ''} ${item.title || ''}`.toLowerCase()
  if (filter === 'Meals') return /meal|fresh food|breakfast|lunch|dinner|plate|biryani|beryani/.test(searchable)
  if (filter === 'Quick bites') return /snack|baked|pastr|cake|mandazi|samosa|quick/.test(searchable)
  return /drink|coffee|tea|juice|soda|water/.test(searchable)
}

function EateryVenueCard({ venue }) {
  const isKitchen = String(venue.vendorType || venue.type || '').toLowerCase() === 'student_kitchen'
  return (
    <Link className="eatery-venue-card" to={`/campus/vendors/${encodeURIComponent(venue.slug)}`}>
      <div className="eatery-venue-image">
        <img src={venue.image || FALLBACK_FOOD_IMAGE} alt="" loading="lazy" />
        <span className={venue.acceptingOrders === false ? 'is-closed' : ''}>{venue.acceptingOrders === false ? 'Closed' : 'Open now'}</span>
      </div>
      <div>
        <span className="eatery-eyebrow">{isKitchen ? 'Student kitchen' : 'Campus eatery'}</span>
        <h3>{venue.name}</h3>
        <p><FiMapPin aria-hidden="true" /> {venue.locationLabel || venue.campus || 'On campus'}</p>
        <footer>
          <span><FiStar aria-hidden="true" /> {Number(venue.ratingAverage || venue.score || 0) > 0 ? Number(venue.ratingAverage || venue.score).toFixed(1) : 'New'}</span>
          <span>{venue.menuCount} item{venue.menuCount === 1 ? '' : 's'} today</span>
          <FiArrowRight aria-hidden="true" />
        </footer>
      </div>
    </Link>
  )
}

function EateryMealCard({ item, onOpen }) {
  const preparationMinutes = getPreparationMinutes(item)
  const providerName = item.shop?.name || item.seller?.name || 'Student kitchen'
  const isKitchen = String(item.shop?.vendorType || '').toLowerCase() === 'student_kitchen'
  const pickupCount = item.shop?.pickupSpots?.length || 0

  return (
    <article className="eatery-meal-card" role="link" tabIndex="0" onClick={() => onOpen(item.id)} onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onOpen(item.id)
      }
    }}>
      <div className="eatery-meal-image">
        <img src={item.image || FALLBACK_FOOD_IMAGE} alt={item.title} loading="lazy" />
        {item.availableToday === false || Number(item.stock || 0) < 1 ? <span className="is-sold-out">Sold out</span> : <span>Available today</span>}
      </div>
      <div className="eatery-meal-body">
        <span className="eatery-eyebrow">{item.category || 'Home-style food'}</span>
        <h3>{item.title}</h3>
        <p>{item.subtitle || item.description}</p>
        <div className="eatery-meal-provider"><FiCoffee aria-hidden="true" /><span><strong>{providerName}</strong><small>{isKitchen ? `${pickupCount || 1} campus pickup ${(pickupCount || 1) === 1 ? 'location' : 'locations'}` : 'In-campus delivery'}</small></span></div>
        <footer>
          <strong>{item.price}</strong>
          <span><FiClock aria-hidden="true" /> {preparationMinutes == null ? 'Confirm time' : preparationMinutes === 0 ? 'Ready now' : `${preparationMinutes} min`}</span>
        </footer>
      </div>
    </article>
  )
}

function EateryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSource = searchParams.get('source')
  const activeTab = EATERY_TABS.some((tab) => tab.id === requestedSource) ? requestedSource : 'all-food'
  const [listings, setListings] = useState([])
  const [shops, setShops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewerStudentId, setViewerStudentId] = useState(() => getAuthUserSnapshot()?.student?.id || '')
  const [hasKitchen, setHasKitchen] = useState(null)
  const [studentKitchen, setStudentKitchen] = useState(null)
  const [isKitchenPromoDismissed, setIsKitchenPromoDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      hydrateAuthUserFromBackend(),
      listMarketplaceListings({ campusOnly: true }),
      listMarketplaceShops({ campusOnly: true }),
      readMyMarketplaceInventory().catch(() => null),
      listMyCampusVendors().catch(() => ({ vendors: [] })),
    ])
      .then(([authSnapshot, listingResponse, shopResponse, inventoryResponse, vendorResponse]) => {
        if (cancelled) return
        setListings((listingResponse?.data || []).map(mapMarketplaceApiListing).filter(isFoodListing))
        setShops(shopResponse?.data || [])
        const studentId = authSnapshot?.student?.id || ''
        setViewerStudentId(studentId)
        const ownedKitchen = (vendorResponse?.vendors || []).find((vendor) => vendor.type === 'student_kitchen' && !['rejected', 'archived'].includes(String(vendor.approvalStatus || vendor.status).toLowerCase())) || null
        const ownsStudentKitchen = Boolean(ownedKitchen)
        setStudentKitchen(ownedKitchen)
        setHasKitchen(Boolean(ownsStudentKitchen || (inventoryResponse && inventoryHasKitchen(inventoryResponse))))
        if (studentId) {
          try {
            setIsKitchenPromoDismissed(window.localStorage.getItem(kitchenPromoDismissalKey(studentId)) === 'true')
          } catch {
            setIsKitchenPromoDismissed(false)
          }
        }
        setError('')
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'We could not load today’s menus.')
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const campusListings = useMemo(() => listings.filter(isCampusEateryListing), [listings])
  const affordableListings = useMemo(() => listings.filter((item) => Number(item.priceAmount || 0) <= 200), [listings])
  const affordableListingsCount = affordableListings.length
  const studentKitchenApproved = Boolean(studentKitchen && ['approved', 'open', 'closed'].includes(String(studentKitchen.approvalStatus || studentKitchen.status).toLowerCase()))
  const studentKitchenWorkspaceHref = studentKitchen ? `/campus/vendors/${encodeURIComponent(studentKitchen.slug)}/manage` : '/campus/profile?tab=pages'
  const studentKitchenListingHref = studentKitchenApproved ? `/campus/marketplace/listings/new?mode=food&vendorId=${encodeURIComponent(studentKitchen.id)}&vendorSlug=${encodeURIComponent(studentKitchen.slug)}` : studentKitchenWorkspaceHref
  const visibleListings = useMemo(() => {
    const term = query.trim().toLowerCase()
    return listings.filter((item) => {
      const searchable = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.shop?.name || ''} ${item.seller?.name || ''}`.toLowerCase()
      return (!term || searchable.includes(term)) && matchesMealFilter(item, activeFilter)
    })
  }, [activeFilter, listings, query])

  const venues = useMemo(() => shops.filter(isCampusEateryShop).map((shop) => {
    const menu = campusListings.filter((item) => item.shop?.id === shop.id)
    return {
      ...shop,
      image: normalizeZumbarlFileUrl(shop.coverImageUrl || shop.logoUrl) || menu[0]?.image,
      menuCount: menu.length,
    }
  }), [campusListings, shops])

  const kitchenVenues = useMemo(() => shops.filter(isStudentKitchenShop).map((shop) => {
    const menu = listings.filter((item) => item.shop?.id === shop.id)
    return {
      ...shop,
      image: normalizeZumbarlFileUrl(shop.coverImageUrl || shop.logoUrl) || menu[0]?.image,
      menuCount: menu.length,
    }
  }), [listings, shops])

  const orderedTabs = useMemo(() => EATERY_TABS.map((tab) => ({
    ...tab,
    count: tab.id === 'student-kitchens' ? kitchenVenues.length : tab.id === 'campus-eateries' ? venues.length : listings.length,
  })).sort((left, right) => Number(right.count > 0) - Number(left.count > 0)), [kitchenVenues.length, listings.length, venues.length])

  function changeTab(source) {
    setActiveFilter('All')
    setQuery('')
    setSearchParams(source === 'all-food' ? {} : { source })
  }

  function showAffordablePicks() {
    setActiveFilter('Under KSh 200')
    setQuery('')
    setSearchParams({})
  }

  function dismissKitchenPromo() {
    setIsKitchenPromoDismissed(true)
    if (!viewerStudentId) return
    try {
      window.localStorage.setItem(kitchenPromoDismissalKey(viewerStudentId), 'true')
    } catch {
      // The card still closes for this page view when storage is unavailable.
    }
  }

  return (
    <main className="campus-page eatery-page">
      <Seo {...CAMPUS_EATERY_SEO} jsonLd={[CAMPUS_EATERY_SEO.pageJsonLd]} />
      <div className="campus-stage">
        <div className="campus-shell eatery-shell">
          <CampusSidebar activeItemId="eatery" />

          <section className="campus-main eatery-main">
            <header className="campus-header eatery-header">
              <div>
                <Breadcrumb items={[{ label: 'Campus' }, { label: 'Eatery' }]} />
                <span className="eatery-kicker"><FiCoffee aria-hidden="true" /> Food around your campus</span>
                <h1>What are you craving?</h1>
                <p>See what campus eateries are serving or pick up a home-style plate from a student kitchen.</p>
              </div>
              <CampusTopActions className="campus-header-actions eatery-header-actions" primaryAction={<Link className="eatery-orders-link" to="/campus/opportunities/buy-sell?view=orders"><FiPackage aria-hidden="true" /> My orders</Link>} showUserButton={false} />
            </header>

            <section className="eatery-discovery-card">
              <div>
                <span>Today’s budget picks</span>
                <h2>Big flavor, small budget.</h2>
                <p>{isLoading ? 'Finding today’s affordable meals…' : `${affordableListingsCount} meal${affordableListingsCount === 1 ? '' : 's'} available for KSh 200 or less.`}</p>
                <button className="eatery-promo-action" type="button" onClick={showAffordablePicks}>Explore budget bites <FiArrowRight aria-hidden="true" /></button>
              </div>
              {affordableListings.length ? (
                <div className="eatery-promo-items" aria-label="Featured budget meals">
                  {affordableListings.slice(0, 3).map((item) => (
                    <button className="eatery-promo-item" type="button" key={item.id} onClick={() => navigate(`/campus/opportunities/buy-sell/${encodeURIComponent(item.id)}`)} aria-label={`View ${item.title}, ${item.price}`}>
                      <img src={item.image || FALLBACK_FOOD_IMAGE} alt="" />
                      <span>{item.title}</span>
                      <small>{item.price}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="eatery-discovery-marks" aria-hidden="true"><span>200</span><small>KSh<br />or less</small></div>
              )}
            </section>

            <div className="eatery-tabs-row">
              <TabNav
                activeId={activeTab}
                ariaLabel="Eatery sources"
                className="eatery-source-tabs"
                items={orderedTabs}
                onChange={changeTab}
                renderTab={(tab) => <>{tab.label}<strong>{tab.count}</strong></>}
              />
              {activeTab === 'student-kitchens' ? <Link to={studentKitchenListingHref}><FiPlus aria-hidden="true" /> {studentKitchenApproved ? 'List today’s plate' : studentKitchen ? 'View kitchen submission' : 'Create a kitchen page'}</Link> : null}
            </div>

            {activeTab === 'student-kitchens' && hasKitchen === false && !isKitchenPromoDismissed ? (
              <section className="eatery-student-intro">
                <button className="eatery-student-intro-close" type="button" aria-label="Dismiss start your kitchen suggestion" onClick={dismissKitchenPromo}><FiX aria-hidden="true" /></button>
                <div className="eatery-student-icon"><FiUsers aria-hidden="true" /></div>
                <div><span>Made by students</span><h2>A little closer to home.</h2><p>Discover rotating plates cooked in small batches by students on your campus. Cooks share ingredients, allergens, portions, and pickup times before you order.</p></div>
                <Link to="/campus/profile?tab=pages">Start your kitchen <FiArrowRight aria-hidden="true" /></Link>
              </section>
            ) : null}

            {activeTab === 'campus-eateries' && venues.length ? (
              <section className="eatery-venues" aria-labelledby="eatery-venues-title">
                <div className="eatery-section-head"><div><span>Right here</span><h2 id="eatery-venues-title">In-campus eateries</h2><p>University eateries and registered food spots offering delivery around campus.</p></div></div>
                <div className="eatery-venue-grid">{venues.map((venue) => <EateryVenueCard key={venue.id} venue={venue} />)}</div>
              </section>
            ) : activeTab === 'campus-eateries' && !isLoading ? (
              <section className="eatery-empty">
                <FiCoffee aria-hidden="true" />
                <h3>No campus eateries are listed yet.</h3>
                <p>Registered university eateries and nearby food spots will appear here.</p>
              </section>
            ) : activeTab === 'student-kitchens' && kitchenVenues.length ? (
              <section className="eatery-venues" aria-labelledby="student-kitchens-title">
                <div className="eatery-section-head"><div><span>Made on your campus</span><h2 id="student-kitchens-title">Student kitchens</h2><p>Browse approved student-run kitchens, then open a kitchen to see its menu.</p></div></div>
                <div className="eatery-venue-grid">{kitchenVenues.map((venue) => <EateryVenueCard key={venue.id} venue={venue} />)}</div>
              </section>
            ) : activeTab === 'student-kitchens' && !isLoading ? (
              <section className="eatery-empty">
                <FiCoffee aria-hidden="true" />
                <h3>No student kitchens are open on your campus yet.</h3>
                <p>Approved student kitchen pages from your campus will appear here.</p>
                <Link to={studentKitchenListingHref}><FiPlus /> {studentKitchen ? 'View kitchen submission' : 'Create a student kitchen'}</Link>
              </section>
            ) : null}

            {activeTab === 'all-food' ? <section className="eatery-menu" aria-labelledby="eatery-menu-title">
              <div className="eatery-section-head">
                <div><span>Available today</span><h2 id="eatery-menu-title">Today’s food menu</h2><p>Fresh picks from campus eateries and student kitchens.</p></div>
                <div className="eatery-search"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food or kitchens" aria-label="Search food or kitchens" /></div>
              </div>

              <div className="eatery-filter-row" aria-label="Meal filters">{MEAL_FILTERS.map((filter) => <button key={filter} type="button" className={filter === activeFilter ? 'is-active' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>

              {isLoading ? <div className="eatery-loading" aria-label="Loading menus"><span /><span /><span /></div> : error ? <section className="eatery-empty"><FiCoffee /><h3>Today’s menus are taking a moment.</h3><p>{error}</p></section> : visibleListings.length ? (
                <div className="eatery-meal-grid">{visibleListings.map((item) => <EateryMealCard key={item.id} item={item} onOpen={(id) => navigate(`/campus/opportunities/buy-sell/${encodeURIComponent(id)}`)} />)}</div>
              ) : (
                <section className="eatery-empty">
                  <FiCoffee aria-hidden="true" />
                  <h3>{query || activeFilter !== 'All' ? 'No plates match that search.' : 'No campus menu is live yet.'}</h3>
                  <p>{query || activeFilter !== 'All' ? 'Try another meal type or clear your search.' : 'Check back when campus eateries publish today’s menu.'}</p>
                </section>
              )}
            </section> : null}
          </section>

          <aside className="campus-rail eatery-rail" aria-label="Eatery tips">
            <section className="eatery-rail-card is-budget">
              <span>Budget bite</span>
              <strong>{affordableListingsCount}</strong>
              <h2>meals under KSh 200</h2>
              <button type="button" onClick={showAffordablePicks}>Show affordable picks <FiArrowRight /></button>
            </section>
            <section className="eatery-rail-card">
              <span>How it works</span>
              <h2>From menu to handoff.</h2>
              <ol><li><strong>1</strong><p><b>Choose a plate</b><small>See the price, portion, ingredients, and prep time.</small></p></li><li><strong>2</strong><p><b>Place your order</b><small>Continue straight to checkout—no scheduling required.</small></p></li><li><strong>3</strong><p><b>Choose fulfilment</b><small>Eateries deliver; student kitchens let you choose a listed pickup point.</small></p></li></ol>
            </section>
            <section className="eatery-rail-card is-trust">
              <FiShield aria-hidden="true" />
              <div><span>Eat with confidence</span><h2>Clear before you order.</h2></div>
              <p><FiCheckCircle /> Ingredient and allergen notes</p><p><FiCheckCircle /> Campus identity and reviews</p><p><FiCheckCircle /> Protected checkout</p>
            </section>
            <Link className="eatery-shop-link" to="/campus/opportunities/buy-sell"><FiShoppingBag /><span><small>Looking for something else?</small><strong>Return to Shop</strong></span><FiArrowRight /></Link>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default EateryPage
