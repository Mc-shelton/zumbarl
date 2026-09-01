import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBox, FiBriefcase, FiCamera, FiChevronRight, FiClock, FiEdit2, FiMapPin, FiMinus, FiPause, FiPlay, FiPlus, FiPower, FiRefreshCw, FiSearch, FiSettings, FiShield, FiShoppingBag, FiUsers } from 'react-icons/fi'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { ConfirmDialog } from '../components/ui'
import ExplorePostComposer from '../features/explore/components/ExplorePostComposer'
import ExploreShareModal from '../features/explore/components/ExploreShareModal'
import ExploreStoryComposer from '../features/explore/components/ExploreStoryComposer'
import ExploreStoryViewer from '../features/explore/components/ExploreStoryViewer'
import ManagedEntityFeed from '../features/explore/components/ManagedEntityFeed'
import { createStory, listStories } from '../features/explore/services/storyService'
import { buildVendorStoryCreator, markVendorStoryViewed } from '../features/explore/utils/vendorStories'
import { CampusVendorInventoryPreview, CampusVendorMetricGrid, CampusVendorOverviewBanner } from '../features/opportunities/components/CampusVendorOverview'
import ProfileShopOrders from '../features/profile/components/ProfileShopOrders'
import { addManagedCampusVendorManager, createCampusVendorPost, readCampusVendorWorkspace, removeManagedCampusVendorManager, searchManagedCampusVendorManagerCandidates, updateCampusVendorAvailability, updateCampusVendorOrderStatus, updateCampusVendorPost, updateManagedCampusVendor, updateMarketplaceListing } from '../features/opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import { uploadZumbarlFile } from '../lib/uploadZumbarlFile'
import '../styles/campus.css'
import '../styles/explore-campus.css'
import '../styles/vendor-workspace.css'
import '../styles/vendor-overview.css'

const TABS = [
  { id: 'overview', label: 'Overview', Icon: FiBriefcase },
  { id: 'inventory', label: 'Inventory', Icon: FiBox },
  { id: 'orders', label: 'Orders', Icon: FiShoppingBag },
  { id: 'posts', label: 'Posts', Icon: FiPlus },
  { id: 'settings', label: 'Settings & team', Icon: FiSettings },
]

const FALLBACK_LISTING_IMAGE = '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp'

function listingStatusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'published' || normalized === 'active') return 'Published'
  if (!normalized) return 'Draft'
  return normalized.replace(/^./, (letter) => letter.toUpperCase())
}

function listingImage(listing) {
  const gallery = Array.isArray(listing.gallery) && listing.gallery.length ? listing.gallery : listing.images
  return normalizeZumbarlFileUrl((Array.isArray(gallery) ? gallery : [])[0]) || FALLBACK_LISTING_IMAGE
}

function CampusVendorWorkspacePage() {
  const { vendorSlug } = useParams()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [status, setStatus] = useState('Loading vendor workspace…')
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false)
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false)
  const [vendorStoryCreator, setVendorStoryCreator] = useState(null)
  const [activeStoryId, setActiveStoryId] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [vendorDraft, setVendorDraft] = useState({ name: '', type: 'service', description: '', locationLabel: '', logoUrl: '' })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [assignment, setAssignment] = useState({ email: '', role: 'editor' })
  const [isTeammateFormOpen, setIsTeammateFormOpen] = useState(false)
  const [teammateQuery, setTeammateQuery] = useState('')
  const [teammateCandidates, setTeammateCandidates] = useState([])
  const [selectedTeammateId, setSelectedTeammateId] = useState('')
  const [teammateSearchStatus, setTeammateSearchStatus] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [orderUnableToFulfil, setOrderUnableToFulfil] = useState(null)
  const [updatingListingId, setUpdatingListingId] = useState('')

  const load = useCallback(async () => {
    try {
      const [nextWorkspace, storyResponse] = await Promise.all([
        readCampusVendorWorkspace(vendorSlug),
        listStories().catch(() => ({ data: [] })),
      ])
      setWorkspace(nextWorkspace)
      setVendorStoryCreator(buildVendorStoryCreator(nextWorkspace.shop, storyResponse?.data || []))
      setVendorDraft({ name: nextWorkspace.shop.name || '', type: nextWorkspace.shop.type || 'service', description: nextWorkspace.shop.description || '', locationLabel: nextWorkspace.shop.locationLabel || '', logoUrl: nextWorkspace.shop.logoUrl || '' })
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'This vendor workspace could not be loaded.')
    }
  }, [vendorSlug])

  // Loading the selected vendor is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const posts = useMemo(() => (workspace?.posts || []).filter((post) => post.type !== 'promotion' && !post.isPromoted && !post.promotion), [workspace?.posts])
  const shop = workspace?.shop
  const vendorId = shop?.id || ''
  const canManageVendor = Boolean(shop?.canManageAssignments || ['owner', 'admin'].includes(String(shop?.viewerRole || '').toLowerCase()))
  const hasUnseenVendorStory = Boolean(vendorStoryCreator?.items?.some((item) => !item.isViewed))
  const isAcceptingOrders = shop?.acceptingOrders !== false

  const handleStoryViewed = useCallback((creatorId, itemId) => {
    setVendorStoryCreator((current) => {
      if (!current || current.id !== creatorId || current.items.every((item) => item.id !== itemId || item.isViewed)) return current
      return { ...current, items: current.items.map((item) => item.id === itemId ? { ...item, isViewed: true } : item) }
    })
    if (!vendorId) return
    markVendorStoryViewed(vendorId, itemId)
  }, [vendorId])

  async function runAction(action, successMessage) {
    setIsSaving(true)
    setFeedback(null)
    try {
      await action()
      setFeedback({ type: 'success', text: successMessage })
      await load()
      return true
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'That change could not be saved.' })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function publishPost(payload) {
    const published = await runAction(() => createCampusVendorPost(vendorSlug, payload), 'Post published to Explore Campus as this vendor.')
    if (!published) throw new Error('The vendor post could not be published.')
  }

  async function editPost(postId, payload) {
    const updated = await runAction(() => updateCampusVendorPost(vendorSlug, postId, payload), 'Post updated across Explore Campus.')
    if (!updated) throw new Error('The vendor post could not be updated.')
  }

  async function publishStory(story) {
    const published = await runAction(() => createStory({
      title: story.title,
      text: story.caption,
      mediaUrl: story.media,
      mediaType: story.type,
      poster: story.poster,
      storyKind: story.storyKind,
      product: story.product,
      visibility: 'campus',
      context: 'vendor',
      vendorSlug,
      trimStart: story.trimStart,
      trimEnd: story.trimEnd,
    }), `Story published to Explore Campus as ${shop.name}.`)
    if (!published) throw new Error('The vendor story could not be published.')
    setIsStoryComposerOpen(false)
  }

  async function saveVendor(event) {
    event.preventDefault()
    await runAction(() => updateManagedCampusVendor(vendorSlug, vendorDraft), 'Vendor profile updated.')
  }

  async function uploadVendorAvatar(file) {
    if (!file || isUploadingAvatar) return
    setIsUploadingAvatar(true)
    setFeedback(null)
    try {
      const upload = await uploadZumbarlFile(file, { scope: 'marketplace-vendor', metadata: { vendorId, purpose: 'vendor-profile-picture' } })
      setVendorDraft((current) => ({ ...current, logoUrl: upload.url || upload.previewUrl }))
      setFeedback({ type: 'success', text: 'Profile picture uploaded. Save the vendor to publish it.' })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'The profile picture could not be uploaded.' })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function toggleOrderAvailability() {
    const nextState = !isAcceptingOrders
    await runAction(
      () => updateCampusVendorAvailability(vendorSlug, nextState),
      nextState ? 'This vendor is open and accepting new orders.' : 'This vendor is closed to new orders. Existing orders are unchanged.',
    )
  }

  async function saveAssignment(event) {
    event.preventDefault()
    if (await runAction(() => addManagedCampusVendorManager(vendorSlug, assignment), 'Teammate added to this vendor.')) {
      setAssignment({ email: '', role: 'editor' })
      setTeammateQuery('')
      setTeammateCandidates([])
      setSelectedTeammateId('')
      setIsTeammateFormOpen(false)
    }
  }

  async function changeAssignmentRole(manager, role) {
    await runAction(
      () => addManagedCampusVendorManager(vendorSlug, { email: manager.user.email, role }),
      `${manager.user.name || manager.user.email} now has ${role} access.`,
    )
  }

  async function searchTeammates(event) {
    event.preventDefault()
    const query = teammateQuery.trim()
    if (query.length < 2) {
      setTeammateSearchStatus('Enter at least 2 characters to search.')
      setTeammateCandidates([])
      return
    }
    setTeammateSearchStatus('Searching Zumbarl accounts…')
    try {
      const response = await searchManagedCampusVendorManagerCandidates(vendorSlug, query)
      const candidates = response?.candidates || []
      setTeammateCandidates(candidates)
      setTeammateSearchStatus(candidates.length ? '' : 'No matching Zumbarl users found.')
    } catch (error) {
      setTeammateCandidates([])
      setTeammateSearchStatus(error.message || 'Users could not be loaded.')
    }
  }

  function selectTeammate(candidate) {
    if (candidate.currentRole === 'owner') return
    setAssignment((current) => ({ ...current, email: candidate.email, role: candidate.currentRole || current.role }))
    setSelectedTeammateId(candidate.id)
    setTeammateSearchStatus(`${candidate.name} selected.`)
  }

  async function removeAssignment(userId) {
    await runAction(() => removeManagedCampusVendorManager(vendorSlug, userId), 'Vendor operator removed.')
  }

  async function progressOrder(order, fulfillmentStatus) {
    if (updatingOrderId) return
    setUpdatingOrderId(order.id)
    setFeedback(null)
    try {
      await updateCampusVendorOrderStatus(vendorSlug, order.id, fulfillmentStatus)
      const statusLabel = String(fulfillmentStatus || '').replaceAll('_', ' ')
      setFeedback({ type: 'success', text: `Order #${order.id.slice(-8).toUpperCase()} ${fulfillmentStatus === 'cannot_fulfil' ? 'was cancelled.' : `is now ${statusLabel}.`}` })
      await load()
      return true
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'The order could not be updated.' })
      return false
    } finally {
      setUpdatingOrderId('')
    }
  }

  async function patchListing(listing, patch, successMessage) {
    if (updatingListingId) return
    setUpdatingListingId(listing.id)
    setFeedback(null)
    try {
      await updateMarketplaceListing(listing.id, patch)
      setFeedback({ type: 'success', text: successMessage })
      await load()
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'The listing could not be updated.' })
    } finally {
      setUpdatingListingId('')
    }
  }

  function toggleListingAvailability(listing) {
    const isLive = ['published', 'active'].includes(String(listing.status || '').toLowerCase())
    return patchListing(listing, { status: isLive ? 'PAUSED' : 'ACTIVE' }, isLive
      ? `${listing.title} was paused and hidden from buyers.`
      : `${listing.title} is live in the marketplace again.`)
  }

  function adjustListingStock(listing, delta) {
    const currentStock = Number(listing.stock ?? listing.stockCount ?? 0)
    const nextStock = Math.max(0, currentStock + delta)
    if (nextStock === currentStock) return
    return patchListing(listing, { stock: nextStock }, `Stock for ${listing.title} set to ${nextStock}.`)
  }

  function editListing(listing) {
    navigate(`/campus/marketplace/listings/${encodeURIComponent(listing.id)}/edit`)
  }

  const inventoryHref = shop ? `/campus/marketplace/listings/new?vendorId=${encodeURIComponent(shop.id)}&vendorSlug=${encodeURIComponent(shop.slug)}` : '#'

  return <main className="campus-page vendor-workspace-page">
    <Seo title={`${shop?.name || 'Vendor'} workspace | Zumbarl`} description="Manage campus vendor inventory, orders, posts and team access." path={`/campus/vendors/${vendorSlug}/manage`} />
    <div className="campus-stage"><div className="campus-shell vendor-workspace-shell">
      <CampusSidebar activeItemId="marketplace" supportCard={null} />
      <section className="campus-main vendor-workspace-main">
        <header className="vendor-workspace-intro">
          <div className="vendor-workspace-breadcrumb"><Link to="/campus/profile?tab=pages"><FiArrowLeft /> My pages</Link><FiChevronRight /><span>Vendor workspace</span></div>
          <div className="vendor-workspace-title-row">
            <div className="vendor-workspace-identity">
              {vendorStoryCreator ? <button
                aria-label={`View ${shop.name}'s story`}
                className={`vendor-workspace-story-avatar ${hasUnseenVendorStory ? 'is-unseen' : 'is-viewed'}`}
                onClick={() => setActiveStoryId(vendorStoryCreator.id)}
                type="button"
              ><img src={normalizeZumbarlFileUrl(shop?.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" /></button> : <img src={normalizeZumbarlFileUrl(shop?.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" />}
              <div><span>Campus vendor</span><h1>{shop?.name || 'Loading vendor…'}</h1><p>{shop?.description || 'Inventory, orders, content, and vendor access in one place.'}</p>{shop ? <small className="vendor-workspace-social-summary">{Number(shop.followerCount || 0).toLocaleString()} {Number(shop.followerCount || 0) === 1 ? 'follower' : 'followers'} · {posts.length.toLocaleString()} {posts.length === 1 ? 'update' : 'updates'}</small> : null}</div>
            </div>
            <div className="vendor-workspace-actions">
              {workspace ? <button className={`vendor-order-availability-toggle ${isAcceptingOrders ? 'is-open' : 'is-closed'}`} disabled={isSaving} onClick={toggleOrderAvailability} type="button"><FiPower /> {isAcceptingOrders ? 'Close orders' : 'Open for orders'}</button> : null}
              {workspace ? <Link className="is-primary" to={inventoryHref}><FiPlus /> Add inventory</Link> : null}
              <button type="button" onClick={load}><FiRefreshCw /> Refresh</button>
            </div>
          </div>
          {shop ? <div className="vendor-workspace-meta"><span><FiMapPin /> {shop.campus || shop.locationLabel || 'Campus vendor'}</span><span><FiBriefcase /> {(shop.type || 'service').replaceAll('_', ' ')}</span><span><FiShield /> {shop.viewerRole || 'editor'} access</span><span className={isAcceptingOrders ? 'is-live' : 'is-closed'}>{isAcceptingOrders ? 'Accepting orders' : 'Closed to orders'}</span></div> : null}
        </header>

        <nav className="vendor-workspace-tabs zumbarl-segmented-tabs" aria-label="Vendor tools">
          {TABS.map(({ id, label, Icon }) => <button className={activeTab === id ? 'is-active' : ''} key={id} onClick={() => setActiveTab(id)} type="button"><Icon /> {label}</button>)}
        </nav>
        {status ? <p className="vendor-workspace-status">{status}</p> : null}
        {feedback ? <p className={`vendor-workspace-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p> : null}
        {workspace && activeTab === 'overview' ? <>
          <CampusVendorOverviewBanner actionLabel="Manage inventory" onAction={() => setActiveTab('inventory')} shop={shop} />
          <CampusVendorMetricGrid metrics={[
            { id: 'inventory', Icon: FiBox, label: 'Inventory', value: workspace.listings.length, note: 'Products and services', onSelect: () => setActiveTab('inventory') },
            { id: 'orders', Icon: FiShoppingBag, label: 'Orders', value: workspace.orders.length, note: 'Customer activity', onSelect: () => setActiveTab('orders') },
            { id: 'posts', Icon: FiPlus, label: 'Posts', value: posts.length, note: 'Vendor updates', onSelect: () => setActiveTab('posts') },
            { id: 'followers', Icon: FiUsers, label: 'Followers', value: Number(shop.followerCount || 0), note: 'Campus audience' },
          ]} />
          <section className="vendor-workspace-overview-grid">
            <CampusVendorInventoryPreview emptyAction={<Link to={inventoryHref}>Add first item <FiArrowRight /></Link>} emptyText="Add a menu item or service so students can discover and order it." eyebrow="Sell on Zumbarl" items={workspace.listings.slice(0, 4).map((listing) => ({ id: listing.id, image: listingImage(listing), category: listing.category, title: listing.title, stock: Number(listing.stock ?? listing.stockCount ?? 0), price: `KSh ${Number(listing.priceAmount || 0).toLocaleString()}`, onAction: () => editListing(listing), actionLabel: 'Manage' }))} onViewAll={() => setActiveTab('inventory')} title="Inventory at a glance" />
            <aside className="vendor-workspace-panel vendor-workspace-access-card">
              <header><div><span>Workspace</span><h2>Team & access</h2></div><FiUsers /></header>
              <div className="vendor-workspace-access-summary"><strong>{shop.managers?.length || 0}</strong><span>assigned operators</span></div>
              <ul>{(shop.managers || []).slice(0, 4).map((manager) => <li key={manager.user.id}><span>{(manager.user.name || manager.user.email || '?').slice(0, 1).toUpperCase()}</span><div><strong>{manager.user.name || manager.user.email}</strong><small>{manager.role}</small></div></li>)}</ul>
              <button type="button" onClick={() => setActiveTab('settings')}>{canManageVendor ? 'Manage team' : 'View team'} <FiArrowRight /></button>
            </aside>
          </section>
          <section className="vendor-workspace-activity-strip">
            <div><FiClock /><span><strong>Recent activity</strong><small>{workspace.orders[0] ? `Latest order ${new Date(workspace.orders[0].createdAt).toLocaleDateString('en-KE')}` : workspace.posts[0] ? `Latest post ${new Date(workspace.posts[0].createdAt).toLocaleDateString('en-KE')}` : 'Activity will appear here as the vendor starts operating.'}</small></span></div>
            <button type="button" onClick={() => setActiveTab(workspace.orders.length ? 'orders' : 'posts')}>Open activity <FiArrowRight /></button>
          </section>
        </> : null}
        {workspace && activeTab === 'inventory' ? <section className="vendor-workspace-panel">
          <header><div><span>Products and services</span><h2>Inventory</h2><p>{workspace.listings.length ? `${workspace.listings.length} item${workspace.listings.length === 1 ? '' : 's'} · ${workspace.listings.filter((listing) => ['published', 'active'].includes(String(listing.status || '').toLowerCase())).length} live in the marketplace.` : 'Showcase the vendor’s products and services.'}</p></div><Link to={inventoryHref}><FiPlus /> Add inventory</Link></header>
          <div className="vendor-workspace-inventory">
            {workspace.listings.map((listing) => {
              const stock = Number(listing.stock ?? listing.stockCount ?? 0)
              const status = String(listing.status || '').toLowerCase()
              const isLive = status === 'published' || status === 'active'
              const isUpdating = updatingListingId === listing.id
              return (
                <article className={`vendor-inventory-card${isUpdating ? ' is-busy' : ''}`} key={listing.id}>
                  <div className="vendor-inventory-media">
                    <img alt={listing.title || 'Inventory item'} loading="lazy" src={listingImage(listing)} />
                    <i className={`vendor-order-pill is-${status || 'draft'}`}>{listingStatusLabel(status)}</i>
                  </div>
                  <div className="vendor-inventory-body">
                    <span className="vendor-inventory-kind">{listing.kind === 'service' ? 'Service' : 'Product'} · {listing.category || 'Other'}</span>
                    <strong>{listing.title}</strong>
                    {listing.description ? <p>{listing.description}</p> : null}
                    <div className="vendor-inventory-pricing">
                      <b>KSh {Number(listing.priceAmount || 0).toLocaleString()}</b>
                      <span className={stock <= 3 ? `is-low${stock === 0 ? ' is-out' : ''}` : ''}>{stock === 0 ? 'Out of stock' : `${stock} in stock`}</span>
                    </div>
                  </div>
                  <footer className="vendor-inventory-actions">
                    <div aria-label={`Stock for ${listing.title}`} className="vendor-stock-stepper">
                      <button disabled={Boolean(updatingListingId) || stock === 0} onClick={() => adjustListingStock(listing, -1)} type="button"><FiMinus /></button>
                      <b>{stock}</b>
                      <button disabled={Boolean(updatingListingId)} onClick={() => adjustListingStock(listing, 1)} type="button"><FiPlus /></button>
                    </div>
                    <div className="vendor-inventory-buttons">
                      {isLive || status === 'paused' ? <button disabled={Boolean(updatingListingId)} onClick={() => toggleListingAvailability(listing)} type="button">{isLive ? <><FiPause /> Pause</> : <><FiPlay /> Resume</>}</button> : null}
                      <button className="is-primary" onClick={() => editListing(listing)} type="button"><FiEdit2 /> Edit</button>
                    </div>
                  </footer>
                </article>
              )
            })}
            {!workspace.listings.length ? <p>No inventory yet. Add the vendor’s first product or service.</p> : null}
          </div>
        </section> : null}
        {workspace && activeTab === 'orders' ? <section className="vendor-workspace-panel vendor-marketplace-orders">
          <ProfileShopOrders
            backLabel="Inventory"
            description="Confirm paid campus orders, prepare each item and coordinate collection with the buyer."
            eyebrow={`${shop.name} seller workspace`}
            error=""
            isLoading={false}
            onBack={() => setActiveTab('inventory')}
            onMessageBuyer={(order) => navigate(order.buyerUserId ? `/messages?participantId=${encodeURIComponent(order.buyerUserId)}` : '/messages')}
            onRefresh={load}
            onUpdateStatus={(order, fulfillmentStatus) => {
              if (fulfillmentStatus === 'cannot_fulfil') {
                setOrderUnableToFulfil(order)
                return
              }
              progressOrder(order, fulfillmentStatus)
            }}
            orders={workspace.orders}
            title="Orders & fulfilment"
            updatingOrderId={updatingOrderId}
          />
        </section> : null}
        {workspace && activeTab === 'posts' ? <section className="vendor-workspace-panel vendor-workspace-social-panel"><header><div><span>Vendor voice</span><h2>Posts & stories</h2><p>Publish rich Explore Campus posts and 24-hour stories using {shop.name}’s profile.</p></div><div className="vendor-workspace-publish-actions"><button className="is-story" type="button" onClick={() => setIsStoryComposerOpen(true)}><FiPlay /> Create story</button><button className="is-post" type="button" onClick={() => setIsPostComposerOpen(true)}><FiPlus /> Create post</button></div></header>{posts.length ? <ManagedEntityFeed identity={{ id: shop.id, slug: shop.slug, profileType: 'vendor', name: shop.name, handle: 'Campus vendor', avatar: shop.logoUrl, campus: shop.campus || shop.locationLabel }} onEditPost={editPost} posts={posts} /> : <div className="vendor-workspace-empty"><FiPlus /><div><strong>No posts yet</strong><p>Share this vendor’s first campus update, menu photo, offer, or behind-the-scenes moment.</p></div><button type="button" onClick={() => setIsPostComposerOpen(true)}>Create first post</button></div>}</section> : null}
        {workspace && activeTab === 'settings' ? <section className="vendor-workspace-settings-grid">
          <section className="vendor-workspace-panel">
            <header><div><span>Vendor profile</span><h2>Edit vendor</h2></div></header>
            {canManageVendor ? <form className="vendor-workspace-form" onSubmit={saveVendor}>
              <div className="vendor-profile-photo-editor">
                <img src={normalizeZumbarlFileUrl(vendorDraft.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="Vendor profile preview" />
                <div><strong>Profile picture</strong><small>Use a clear square image for posts, stories, menus, and Explore Campus.</small><label><FiCamera /> {isUploadingAvatar ? 'Uploading…' : 'Change picture'}<input accept="image/*" disabled={isUploadingAvatar || isSaving} onChange={(event) => uploadVendorAvatar(event.target.files?.[0])} type="file" /></label></div>
              </div>
              <label><span>Name</span><input required value={vendorDraft.name} onChange={(event) => setVendorDraft({ ...vendorDraft, name: event.target.value })} /></label>
              <label><span>Type</span><select value={vendorDraft.type} onChange={(event) => setVendorDraft({ ...vendorDraft, type: event.target.value })}><option value="hotel">Hotel</option><option value="barber_shop">Barber shop</option><option value="service">Other service</option></select></label>
              <label><span>Location</span><input value={vendorDraft.locationLabel} onChange={(event) => setVendorDraft({ ...vendorDraft, locationLabel: event.target.value })} /></label>
              <label><span>Description</span><textarea value={vendorDraft.description} onChange={(event) => setVendorDraft({ ...vendorDraft, description: event.target.value })} /></label>
              <button disabled={isSaving || isUploadingAvatar} type="submit">{isSaving ? 'Saving…' : 'Save vendor'}</button>
            </form> : <p>Editors can operate this vendor. An owner or vendor admin controls profile settings and assignments.</p>}
          </section>
          <section className="vendor-workspace-panel">
            <header>
              <div><span>Access control</span><h2><FiUsers /> Vendor team</h2></div>
              {canManageVendor ? <button type="button" onClick={() => setIsTeammateFormOpen((current) => !current)}><FiPlus /> {isTeammateFormOpen ? 'Close' : 'Add teammate'}</button> : null}
            </header>
            <div className="vendor-workspace-list">
              {(shop.managers || []).map((manager) => <article key={manager.user.id}>
                <span><strong>{manager.user.name || manager.user.email}</strong><small>{manager.user.email} · {manager.role}</small></span>
                {canManageVendor && manager.role !== 'owner' ? <span className="vendor-manager-actions"><select aria-label={`Access level for ${manager.user.name || manager.user.email}`} disabled={isSaving} onChange={(event) => changeAssignmentRole(manager, event.target.value)} value={manager.role}><option value="editor">Editor</option><option value="admin">Admin</option></select><button disabled={isSaving} onClick={() => removeAssignment(manager.user.id)} type="button">Remove</button></span> : <em>{manager.role}</em>}
              </article>)}
            </div>
            {canManageVendor && isTeammateFormOpen ? <div className="vendor-assignment-form">
              <form className="vendor-teammate-search" onSubmit={searchTeammates}>
                <label htmlFor="vendor-teammate-query">Find a Zumbarl user</label>
                <div><FiSearch /><input id="vendor-teammate-query" value={teammateQuery} onChange={(event) => { setTeammateQuery(event.target.value); setSelectedTeammateId(''); setAssignment((current) => ({ ...current, email: '' })); setTeammateCandidates([]); setTeammateSearchStatus('') }} placeholder="Search name, username or email" /><button type="submit">Search</button></div>
              </form>
              {teammateSearchStatus ? <p className="vendor-teammate-search-status" role="status">{teammateSearchStatus}</p> : null}
              {teammateCandidates.length ? <div className="vendor-teammate-results">
                {teammateCandidates.map((candidate) => <button className={selectedTeammateId === candidate.id ? 'is-selected' : ''} disabled={candidate.currentRole === 'owner'} key={candidate.id} onClick={() => selectTeammate(candidate)} type="button">
                  <img src={normalizeZumbarlFileUrl(candidate.avatarUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" />
                  <span><strong>{candidate.name}</strong><small>{candidate.username ? `@${candidate.username} · ` : ''}{candidate.email}</small><small>{candidate.campus || 'Zumbarl member'}</small></span>
                  <em>{candidate.currentRole === 'owner' ? 'Owner' : selectedTeammateId === candidate.id ? 'Selected' : candidate.currentRole ? `Edit ${candidate.currentRole}` : 'Select'}</em>
                </button>)}
              </div> : null}
              <form className="vendor-workspace-form" onSubmit={saveAssignment}>
                <label><span>Access level</span><select value={assignment.role} onChange={(event) => setAssignment({ ...assignment, role: event.target.value })}><option value="editor">Editor · daily operations</option><option value="admin">Admin · settings and teammates</option></select></label>
                <small className="vendor-assignment-help">{selectedTeammateId ? 'The selected Zumbarl user will receive this access level.' : 'Search for and select a Zumbarl user first.'}</small>
                <button disabled={isSaving || !selectedTeammateId} type="submit">{isSaving ? 'Saving…' : teammateCandidates.find((candidate) => candidate.id === selectedTeammateId)?.currentRole ? 'Update teammate access' : 'Add selected teammate'}</button>
              </form>
            </div> : null}
          </section>
        </section> : null}
      </section>
    </div></div>
    {shop ? <ExplorePostComposer
      allowedTypes={['post', 'media', 'poll', 'feeling']}
      eyebrow="Vendor voice"
      identity={{ name: shop.name, avatarUrl: shop.logoUrl }}
      initialType="post"
      isOpen={isPostComposerOpen}
      onClose={() => setIsPostComposerOpen(false)}
      onPublish={publishPost}
      placeholder={`Share an update from ${shop.name} with Explore Campus…`}
      publishLabel="Publish as vendor"
      title={`Post as ${shop.name}`}
    /> : null}
    {shop ? <ExploreStoryComposer
      isOpen={isStoryComposerOpen}
      onClose={() => setIsStoryComposerOpen(false)}
      onPublish={publishStory}
      productsOverride={workspace?.listings || []}
      publishingAs={{ name: shop.name }}
    /> : null}
    <ExploreStoryViewer
      key={activeStoryId || 'vendor-story-viewer'}
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
    <ExploreShareModal key={shareTarget?.url || 'vendor-story-share'} target={shareTarget} onClose={() => setShareTarget(null)} />
    <ConfirmDialog
      confirmLabel="Cancel order"
      description="This will cancel the order and send the buyer’s held payment for refund review. No funds will be released to this vendor. This action cannot be undone."
      isOpen={Boolean(orderUnableToFulfil)}
      isPending={Boolean(orderUnableToFulfil && updatingOrderId === orderUnableToFulfil.id)}
      onCancel={() => setOrderUnableToFulfil(null)}
      onConfirm={async () => {
        const order = orderUnableToFulfil
        if (!order || updatingOrderId) return
        if (await progressOrder(order, 'cannot_fulfil')) setOrderUnableToFulfil(null)
      }}
      title={orderUnableToFulfil ? `Unable to fulfil order #${orderUnableToFulfil.id.slice(-8).toUpperCase()}?` : 'Unable to fulfil order?'}
    />
  </main>
}

export default CampusVendorWorkspacePage
