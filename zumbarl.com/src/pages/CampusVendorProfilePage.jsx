import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiBriefcase, FiCheck, FiMapPin, FiMessageCircle, FiMessageSquare, FiShoppingBag, FiTruck, FiUserPlus } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import Seo from '../components/Seo'
import ExploreShareModal from '../features/explore/components/ExploreShareModal'
import ExploreStoryViewer from '../features/explore/components/ExploreStoryViewer'
import ManagedEntityFeed from '../features/explore/components/ManagedEntityFeed'
import { listStories } from '../features/explore/services/storyService'
import { buildVendorStoryCreator, markVendorStoryViewed } from '../features/explore/utils/vendorStories'
import { CampusVendorInventoryPreview, CampusVendorOverviewBanner } from '../features/opportunities/components/CampusVendorOverview'
import { mapMarketplaceApiListing, readCampusVendorProfile, registerAsVendorErrander, setCampusVendorFollowing } from '../features/opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import '../styles/campus.css'
import '../styles/explore-campus.css'
import '../styles/vendor-workspace.css'
import '../styles/vendor-overview.css'
import '../styles/vendor-profile.css'

const FALLBACK_AVATAR = '/assets/knowledge/default-group-avatar.svg'

function CampusVendorProfilePage() {
  const { vendorSlug } = useParams()
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('Loading campus vendor…')
  const [activeTab, setActiveTab] = useState('overview')
  const [vendorStoryCreator, setVendorStoryCreator] = useState(null)
  const [activeStoryId, setActiveStoryId] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const [followPending, setFollowPending] = useState(false)
  const [errandPending, setErrandPending] = useState(false)
  const [errandFeedback, setErrandFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      readCampusVendorProfile(vendorSlug),
      listStories().catch(() => ({ data: [] })),
    ])
      .then(([response, storyResponse]) => {
        if (cancelled) return
        setProfile(response)
        setVendorStoryCreator(buildVendorStoryCreator(response.shop, storyResponse?.data || []))
        setStatus('')
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message || 'This campus vendor could not be loaded.')
      })
    return () => { cancelled = true }
  }, [vendorSlug])

  const shop = profile?.shop
  const listings = useMemo(() => (profile?.listings || []).map(mapMarketplaceApiListing).filter(Boolean), [profile?.listings])
  const identity = useMemo(() => shop ? ({
    id: shop.id,
    slug: shop.slug,
    profileType: 'vendor',
    name: shop.name,
    handle: 'Campus vendor',
    avatar: shop.logoUrl,
    campus: shop.campus || shop.locationLabel,
  }) : null, [shop])
  const avatar = normalizeZumbarlFileUrl(shop?.logoUrl) || FALLBACK_AVATAR
  const vendorType = String(shop?.type || 'service').replaceAll('_', ' ')
  const inventoryLabel = ['hotel', 'student_kitchen'].includes(shop?.type) ? 'Menu' : 'Shop'
  const hasUnseenVendorStory = Boolean(vendorStoryCreator?.items?.some((item) => !item.isViewed))

  const handleStoryViewed = useCallback((creatorId, itemId) => {
    setVendorStoryCreator((current) => {
      if (!current || current.id !== creatorId || current.items.every((item) => item.id !== itemId || item.isViewed)) return current
      return { ...current, items: current.items.map((item) => item.id === itemId ? { ...item, isViewed: true } : item) }
    })
    if (shop?.id) markVendorStoryViewed(shop.id, itemId)
  }, [shop])

  async function toggleFollowing() {
    if (!shop || followPending) return
    const nextFollowing = !shop.isFollowing
    setFollowPending(true)
    setStatus('')
    try {
      const response = await setCampusVendorFollowing(shop.slug, nextFollowing)
      setProfile((current) => current ? { ...current, shop: { ...current.shop, ...response } } : current)
    } catch (error) {
      setStatus(error.message || 'Your follow preference could not be saved.')
    } finally {
      setFollowPending(false)
    }
  }

  async function registerForErrands(event) {
    event.preventDefault()
    if (!shop || errandPending) return
    setErrandPending(true)
    setErrandFeedback('')
    try {
      const registration = await registerAsVendorErrander(shop.slug)
      try {
        setProfile(await readCampusVendorProfile(shop.slug))
      } catch {
        setProfile((current) => current ? { ...current, erranders: [], shop: { ...current.shop, viewerErranderRegistration: registration } } : current)
      }
      setErrandFeedback(`You are now registered with ${shop.name}. Turn on availability from your Errands profile when you are ready.`)
    } catch (error) {
      setErrandFeedback(error.message || 'Your errander registration could not be completed.')
    } finally {
      setErrandPending(false)
    }
  }

  return <main className="campus-page vendor-profile-page">
    <Seo
      description={shop?.description || 'Discover this verified campus vendor on Zumbarl.'}
      image={normalizeZumbarlFileUrl(shop?.coverImageUrl || shop?.logoUrl)}
      path={`/campus/vendors/${vendorSlug || ''}`}
      title={`${shop?.name || 'Campus vendor'} | Zumbarl`}
    />
    <div className="campus-stage">
      <div className="campus-shell vendor-profile-shell">
        <CampusSidebar activeItemId="explore" />
        <section className="campus-main vendor-profile-main">
          {status ? <div className="vendor-profile-status" role="status">{status}</div> : null}
          {shop ? <>
            <header className="vendor-workspace-intro vendor-profile-intro">
              <div className="vendor-workspace-breadcrumb"><Link to="/campus/explore"><FiArrowLeft /> Explore Campus</Link><span>Campus vendor</span></div>
              <div className="vendor-workspace-title-row">
                <div className="vendor-workspace-identity">
                  {vendorStoryCreator ? <button
                    aria-label={`View ${shop.name}'s story`}
                    className={`vendor-workspace-story-avatar ${hasUnseenVendorStory ? 'is-unseen' : 'is-viewed'}`}
                    onClick={() => setActiveStoryId(vendorStoryCreator.id)}
                    type="button"
                  ><img src={avatar} alt="" /></button> : <img src={avatar} alt="" />}
                  <div><span>Campus vendor</span><h1>{shop.name}</h1><p>{shop.description || `Order from ${shop.name} within campus.`}</p><small className="vendor-workspace-social-summary">{Number(shop.followerCount || 0).toLocaleString()} {Number(shop.followerCount || 0) === 1 ? 'follower' : 'followers'} · {(profile.posts?.length || 0).toLocaleString()} {profile.posts?.length === 1 ? 'update' : 'updates'}</small></div>
                </div>
                <div className="vendor-workspace-actions vendor-profile-actions">
                  {!shop.canOpenWorkspace ? <Link to={`/messages?${new URLSearchParams({ pageType: 'marketplace_shop', pageId: shop.id }).toString()}`}><FiMessageCircle /> Message</Link> : null}
                  <button className={`vendor-profile-follow-button ${shop.isFollowing ? 'is-following' : ''}`} disabled={followPending} onClick={toggleFollowing} type="button">{shop.isFollowing ? <FiCheck /> : <FiUserPlus />}{followPending ? 'Saving…' : shop.isFollowing ? 'Following' : 'Follow'}</button>
                  {shop.canOpenWorkspace ? <Link className="is-primary" to={`/campus/vendors/${encodeURIComponent(shop.slug)}/manage`}><FiBriefcase /> Open admin workspace</Link> : null}
                </div>
              </div>
              <div className="vendor-workspace-meta">{shop.campusProfileSlug ? <Link className="vendor-workspace-campus-link" to={`/campus/organizations/${encodeURIComponent(shop.campusProfileSlug)}`}><FiMapPin /> {shop.campus || shop.locationLabel || 'On campus'}</Link> : <span><FiMapPin /> {shop.campus || shop.locationLabel || 'On campus'}</span>}<span><FiShoppingBag /> {vendorType}</span>{shop.viewerRole ? <span><FiBriefcase /> {shop.viewerRole} access</span> : null}<span className={shop.acceptingOrders !== false ? 'is-live' : 'is-closed'}>{shop.acceptingOrders !== false ? 'Accepting orders' : 'Currently closed'}</span></div>
            </header>

            <nav className="vendor-workspace-tabs zumbarl-segmented-tabs vendor-profile-tabs" aria-label={`${shop.name} sections`}>
              <button className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')} type="button"><FiBriefcase /> Overview</button>
              <button className={activeTab === 'menu' ? 'is-active' : ''} onClick={() => setActiveTab('menu')} type="button"><FiShoppingBag /> {inventoryLabel} <span>{listings.length}</span></button>
              <button className={activeTab === 'updates' ? 'is-active' : ''} onClick={() => setActiveTab('updates')} type="button"><FiMessageSquare /> Updates <span>{profile.posts?.length || 0}</span></button>
              <button className={activeTab === 'errands' ? 'is-active' : ''} onClick={() => setActiveTab('errands')} type="button"><FiTruck /> Errands {shop.viewerErranderRegistration?.status === 'ACTIVE' ? <span>{shop.availableErrandCount || 0}</span> : null}</button>
            </nav>

            {activeTab === 'overview' ? <>
              <CampusVendorOverviewBanner actionLabel="Explore menu" onAction={() => setActiveTab('menu')} shop={shop} />
              <section className="vendor-workspace-overview-grid vendor-profile-overview-grid">
                <CampusVendorInventoryPreview emptyText="Check back when this vendor publishes its campus menu." eyebrow="In-campus service" items={listings.slice(0, 4).map((listing) => ({ id: listing.id, image: listing.image, category: listing.category, title: listing.title, stock: Number(listing.stock || 0), price: listing.price, href: shop.acceptingOrders !== false && Number(listing.stock || 0) > 0 ? `/campus/opportunities/buy-sell/${listing.id}` : '', actionLabel: shop.acceptingOrders === false ? 'Closed' : Number(listing.stock || 0) > 0 ? 'Order' : 'Sold out' }))} onViewAll={() => setActiveTab('menu')} title="Menu at a glance" viewAllLabel="View menu" />
                <section className="vendor-workspace-panel vendor-profile-about-card">
                  <header><div><span>About</span><h2>{shop.name}</h2></div></header>
                  <div className="vendor-profile-verified-note"><FiCheck /><span><strong>Verified campus vendor</strong><small>Connected to {shop.campus || shop.locationLabel || 'your campus'}</small></span></div>
                  <p>{shop.description || 'A verified campus service on Zumbarl.'}</p>
                  <dl><div><dt>Campus</dt><dd>{shop.campus || shop.locationLabel || 'On campus'}</dd></div><div><dt>Service</dt><dd>{vendorType}</dd></div><div><dt>Orders</dt><dd>{shop.acceptingOrders !== false ? 'Open' : 'Closed'}</dd></div></dl>
                </section>
              </section>
            </> : null}

            {activeTab === 'menu' ? <section className="vendor-profile-section">
              <header>
                <div><span>In-campus service</span><h2>{shop.type === 'hotel' ? 'Menu' : 'Inventory'}</h2><p>{shop.type === 'student_kitchen' ? 'Place an order and choose one of the kitchen’s listed pickup locations.' : shop.type === 'hotel' ? 'Place an order for in-campus delivery.' : 'Available for campus fulfilment.'}</p></div>
                <Link to="/campus/opportunities/buy-sell?mode=services">See in-campus services</Link>
              </header>
              <div className="vendor-profile-products">
                {listings.map((listing) => <Link className="vendor-profile-product" key={listing.id} to={`/campus/opportunities/buy-sell/${listing.id}`}>
                  <img src={listing.image} alt="" />
                  <div><span>{listing.category}</span><h3>{listing.title}</h3><p>{listing.subtitle}</p><footer><strong>{listing.price}</strong><small>{Number(listing.stock || 0)} available</small></footer></div>
                </Link>)}
                {!listings.length ? <div className="vendor-profile-empty"><FiShoppingBag /><strong>No items are available yet</strong><p>Check back when this vendor publishes its campus inventory.</p></div> : null}
              </div>
            </section> : null}

            {activeTab === 'updates' ? <section className="vendor-profile-section vendor-profile-posts">
              <header><div><span>Explore Campus</span><h2>Updates from {shop.name}</h2><p>Posts, menus and news shared by this vendor.</p></div></header>
              {profile.posts?.length && identity ? <ManagedEntityFeed identity={identity} posts={profile.posts} /> : <div className="vendor-profile-empty"><strong>No updates yet</strong><p>This vendor has not published an Explore Campus post.</p></div>}
            </section> : null}

            {activeTab === 'errands' ? <section className="vendor-profile-section vendor-profile-errands">
              <header><div><span>Campus delivery</span><h2>Errand with {shop.name}</h2><p>{shop.viewerErranderRegistration?.status === 'ACTIVE' ? 'Your delivery setup and this page’s live errands.' : 'Join this page first, then choose when you are available from your profile.'}</p></div></header>
              {shop.viewerErranderRegistration?.status === 'ACTIVE' ? <div className={`vendor-profile-errand-banner ${shop.viewerErranderAvailability ? 'is-available' : 'is-paused'}`}><FiTruck /><div><strong>{shop.viewerErranderAvailability ? `You’re receiving errands from ${shop.name}` : `You’re registered with ${shop.name}`}</strong><p>{shop.errandsEnabled ? `${shop.availableErrandCount || 0} live ${Number(shop.availableErrandCount || 0) === 1 ? 'delivery' : 'deliveries'} from this page right now.` : 'This business is not publishing new delivery errands right now.'}</p><small>Pay · {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(shop.errandFee || 0))} per completed delivery</small></div><Link to="/campus/profile?tab=errands">Manage errands</Link></div> : null}
              {!shop.canOpenWorkspace && shop.viewerErranderRegistration?.status !== 'ACTIVE' ? <div className="vendor-profile-errand-join">
                <div><strong>{shop.viewerErranderRegistration?.status === 'ACTIVE' ? `Registered with ${shop.name}` : shop.viewerErranderRegistration?.status === 'FLAGGED' ? 'Registration flagged' : shop.viewerErranderRegistration?.status === 'REMOVED' ? 'Registration removed' : `Become an errander for ${shop.name}`}</strong><p>{shop.viewerErranderRegistration?.status === 'ACTIVE' ? 'When you turn availability on, this page can send you live errands.' : shop.viewerErranderRegistration?.status === 'FLAGGED' ? (shop.viewerErranderRegistration.flagReason || 'Contact the business if you need more information.') : shop.viewerErranderRegistration?.status === 'REMOVED' ? 'This business must restore your access before you can receive its errands.' : 'Registration connects you only to this business. It does not make you available automatically.'}</p></div>
                {!shop.viewerErranderRegistration && shop.acceptingErranders ? <form className="vendor-profile-errand-rate-form" onSubmit={registerForErrands}><span><b>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(shop.errandFee || 0))}</b><small>Paid for each completed delivery</small></span><button disabled={errandPending} type="submit">{errandPending ? 'Registering…' : 'Register with this page'}</button></form> : null}
                {!shop.viewerErranderRegistration && !shop.acceptingErranders ? <button disabled type="button">Not accepting erranders</button> : null}
              </div> : shop.canOpenWorkspace ? <p className="vendor-profile-errand-owner-note">Manage registrations, availability, and the delivery price from this page’s admin workspace.</p> : null}
              {shop.viewerErranderRegistration?.status === 'ACTIVE' ? <section className="vendor-profile-erranders" aria-labelledby="vendor-profile-erranders-title">
                <header><div><span>Registered people</span><h3 id="vendor-profile-erranders-title">Other erranders</h3><p>See who else is connected to {shop.name} and whether they are available.</p></div><strong>{(profile.erranders || []).length} registered</strong></header>
                <div>
                  {(profile.erranders || []).map((errander) => <article key={errander.id}>
                    <span className="vendor-errander-person"><ProfileAvatar alt="" src={errander.avatarUrl} /><span><strong>{errander.name}</strong><small>{Number(errander.completedCount || 0)} completed</small></span></span>
                    <span className={`vendor-profile-availability is-${String(errander.status || 'UNAVAILABLE').toLowerCase().replaceAll('_', '-')}`}>{errander.status === 'ON_ERRAND' ? 'On an errand' : errander.status === 'AVAILABLE' ? 'Available now' : 'Unavailable'}</span>
                  </article>)}
                  {!profile.erranders?.length ? <div className="vendor-profile-empty"><FiTruck /><strong>No other erranders yet</strong><p>You are currently the only accepted errander on this page.</p></div> : null}
                </div>
              </section> : null}
              {errandFeedback ? <p className="vendor-profile-errand-feedback" role="status">{errandFeedback}</p> : null}
            </section> : null}
          </> : null}
        </section>
      </div>
    </div>
    <ExploreStoryViewer
      key={activeStoryId || 'public-vendor-story-viewer'}
      activeStoryId={activeStoryId}
      onClose={() => setActiveStoryId('')}
      onShareStory={(item, creator) => setShareTarget({
        kind: 'story',
        id: item.id,
        author: creator.name,
        title: item.title || `${creator.name}'s story on Zumbarl`,
        text: item.caption || 'See this story on Zumbarl',
        url: `${window.location.origin}/campus/explore?story=${encodeURIComponent(item.id)}`,
      })}
      onStoryViewed={handleStoryViewed}
      stories={vendorStoryCreator ? [vendorStoryCreator] : []}
    />
    <ExploreShareModal key={shareTarget?.url || 'public-vendor-story-share'} target={shareTarget} onClose={() => setShareTarget(null)} />
  </main>
}

export default CampusVendorProfilePage
