import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBox, FiBriefcase, FiCamera, FiChevronRight, FiClock, FiDollarSign, FiEdit2, FiGift, FiMapPin, FiMessageCircle, FiMinus, FiPause, FiPlay, FiPlus, FiPower, FiRefreshCw, FiSearch, FiSettings, FiShield, FiShoppingBag, FiTruck, FiUsers } from 'react-icons/fi'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import Seo from '../components/Seo'
import { ConfirmDialog } from '../components/ui'
import ExplorePostComposer from '../features/explore/components/ExplorePostComposer'
import ExploreShareModal from '../features/explore/components/ExploreShareModal'
import ExploreStoryComposer from '../features/explore/components/ExploreStoryComposer'
import ExploreStoryViewer from '../features/explore/components/ExploreStoryViewer'
import ManagedEntityFeed from '../features/explore/components/ManagedEntityFeed'
import PageFinancePanel from '../features/finance/components/PageFinancePanel'
import PageInboxPanel from '../features/messages/components/PageInboxPanel'
import { createStory, listStories } from '../features/explore/services/storyService'
import { buildVendorStoryCreator, markVendorStoryViewed } from '../features/explore/utils/vendorStories'
import { CampusVendorInventoryPreview, CampusVendorMetricGrid, CampusVendorOverviewBanner } from '../features/opportunities/components/CampusVendorOverview'
import ProfileShopOrders from '../features/profile/components/ProfileShopOrders'
import { addManagedCampusVendorManager, createCampusVendorPost, manageVendorErrander, readCampusVendorFinance, readCampusVendorWorkspace, removeManagedCampusVendorManager, requestCampusVendorWithdrawal, searchManagedCampusVendorManagerCandidates, updateCampusVendorAvailability, updateCampusVendorOrderStatus, updateCampusVendorPost, updateManagedCampusVendor, updateMarketplaceListing, updateShopErrands } from '../features/opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import { buildPageOrderConversationHref, buyerOrderHref, sellerOrderHref } from '../features/opportunities/orderMessaging'
import { uploadZumbarlFile } from '../lib/uploadZumbarlFile'
import '../styles/campus.css'
import '../styles/explore-campus.css'
import '../styles/vendor-workspace.css'
import '../styles/vendor-overview.css'

const TABS = [
  { id: 'overview', label: 'Overview', Icon: FiBriefcase },
  { id: 'inventory', label: 'Inventory', Icon: FiBox },
  { id: 'orders', label: 'Orders', Icon: FiShoppingBag },
  { id: 'messages', label: 'Messages', Icon: FiMessageCircle },
  { id: 'finance', label: 'Finance', Icon: FiDollarSign },
  { id: 'errands', label: 'Errands', Icon: FiTruck },
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
  const [searchParams] = useSearchParams()
  const [workspace, setWorkspace] = useState(null)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview')
  const [status, setStatus] = useState('Loading vendor workspace…')
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false)
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false)
  const [vendorStoryCreator, setVendorStoryCreator] = useState(null)
  const [activeStoryId, setActiveStoryId] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [vendorDraft, setVendorDraft] = useState({ name: '', type: 'service', description: '', locationLabel: '', pickupSpots: [], logoUrl: '' })
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
  const [acceptingErranders, setAcceptingErranders] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('0')
  const [savingErrandSetting, setSavingErrandSetting] = useState('')
  const [finance, setFinance] = useState(null)
  const [financeLoading, setFinanceLoading] = useState(false)
  const [financeError, setFinanceError] = useState('')

  const load = useCallback(async () => {
    try {
      const [nextWorkspace, storyResponse] = await Promise.all([
        readCampusVendorWorkspace(vendorSlug),
        listStories().catch(() => ({ data: [] })),
      ])
      setWorkspace(nextWorkspace)
      setVendorStoryCreator(buildVendorStoryCreator(nextWorkspace.shop, storyResponse?.data || []))
      setVendorDraft({ name: nextWorkspace.shop.name || '', type: nextWorkspace.shop.type || 'service', description: nextWorkspace.shop.description || '', locationLabel: nextWorkspace.shop.locationLabel || '', pickupSpots: nextWorkspace.shop.pickupSpots?.length ? nextWorkspace.shop.pickupSpots : nextWorkspace.shop.locationLabel ? [nextWorkspace.shop.locationLabel] : [], logoUrl: nextWorkspace.shop.logoUrl || '' })
      setAcceptingErranders(Boolean(nextWorkspace.shop.acceptingErranders))
      setDeliveryFee(String(Number(nextWorkspace.shop.errandFee || 0)))
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'This vendor workspace could not be loaded.')
    }
  }, [vendorSlug])

  // Loading the selected vendor is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true)
    setFinanceError('')
    try { setFinance(await readCampusVendorFinance(vendorSlug)) }
    catch (error) { setFinanceError(error.message || 'Page finances could not be loaded.') }
    finally { setFinanceLoading(false) }
  }, [vendorSlug])

  // Finance is also directly linkable through ?tab=finance.
  useEffect(() => {
    // Loading the selected finance workspace is the external synchronization performed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'finance') loadFinance()
  }, [activeTab, loadFinance])

  const posts = useMemo(() => (workspace?.posts || []).filter((post) => post.type !== 'promotion' && !post.isPromoted && !post.promotion), [workspace?.posts])
  const shop = workspace?.shop
  const vendorId = shop?.id || ''
  const canManageVendor = Boolean(shop?.canManageAssignments || ['owner', 'admin'].includes(String(shop?.viewerRole || '').toLowerCase()))
  const isApproved = Boolean(shop && (shop.type !== 'student_kitchen' || ['approved', 'open', 'closed'].includes(String(shop.approvalStatus || shop.status).toLowerCase())))
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

  async function saveErrandSettings({ enabled = shop?.errandsEnabled, accepting = acceptingErranders, freeDelivery = shop?.freeCampusDelivery, fee = deliveryFee } = {}, setting = 'enabled') {
    const normalizedFee = Number(fee)
    if (!Number.isFinite(normalizedFee) || normalizedFee < 0 || normalizedFee > 5000) {
      setFeedback({ type: 'error', text: 'Enter a delivery price between KES 0 and KES 5,000.' })
      return false
    }
    setSavingErrandSetting(setting)
    try {
      return await runAction(
        () => updateShopErrands(vendorSlug, { acceptingErranders: Boolean(accepting), deliveryFee: normalizedFee, enabled: Boolean(enabled), freeCampusDelivery: Boolean(freeDelivery) }),
        setting === 'rate' ? `Every completed errand now pays KES ${normalizedFee.toLocaleString()}.` : freeDelivery ? 'Free in-campus delivery is on.' : enabled ? 'Errand delivery is on. The first available errander to accept gets each delivery.' : 'Delivery settings saved.',
      )
    } finally {
      setSavingErrandSetting('')
    }
  }

  async function saveDeliveryFee(event) {
    event.preventDefault()
    await saveErrandSettings({ fee: deliveryFee }, 'rate')
  }

  async function changeErrander(registration, action) {
    const messages = {
      REMOVE: `${registration.student.name} was removed from this page.`,
      FLAG: `${registration.student.name} was flagged and will not receive new errands.`,
      RESTORE: `${registration.student.name} can receive this page’s errands again.`,
    }
    await runAction(
      () => manageVendorErrander(vendorSlug, registration.student.id, action, action === 'FLAG' ? 'Flagged by the business for review.' : undefined),
      messages[action],
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
              {workspace ? <button className={`vendor-order-availability-toggle ${isAcceptingOrders ? 'is-open' : 'is-closed'}`} disabled={isSaving || !isApproved} onClick={toggleOrderAvailability} type="button"><FiPower /> {isApproved ? (isAcceptingOrders ? 'Close orders' : 'Open for orders') : 'Awaiting approval'}</button> : null}
              {workspace && isApproved ? <Link className="is-primary" to={inventoryHref}><FiPlus /> Add inventory</Link> : null}
              <button type="button" onClick={load}><FiRefreshCw /> Refresh</button>
            </div>
          </div>
          {shop ? <div className="vendor-workspace-meta">{shop.campusProfileSlug ? <Link className="vendor-workspace-campus-link" to={`/campus/organizations/${encodeURIComponent(shop.campusProfileSlug)}`}><FiMapPin /> {shop.campus || shop.locationLabel || 'Campus vendor'}</Link> : <span><FiMapPin /> {shop.campus || shop.locationLabel || 'Campus vendor'}</span>}<span><FiBriefcase /> {(shop.type || 'service').replaceAll('_', ' ')}</span><span><FiShield /> {shop.viewerRole || 'editor'} access</span><span className={isAcceptingOrders ? 'is-live' : 'is-closed'}>{isAcceptingOrders ? 'Accepting orders' : 'Closed to orders'}</span></div> : null}
        </header>

        <nav className="vendor-workspace-tabs zumbarl-segmented-tabs" aria-label="Vendor tools">
          {TABS.filter((tab) => tab.id !== 'finance' || (canManageVendor && shop?.handlesFinances !== false)).map(({ id, label, Icon }) => <button className={activeTab === id ? 'is-active' : ''} key={id} onClick={() => setActiveTab(id)} type="button"><Icon /> {label}</button>)}
        </nav>
        {status ? <p className="vendor-workspace-status">{status}</p> : null}
        {workspace && !isApproved ? <p className="vendor-workspace-approval-note" role="status"><FiShield /> <span><strong>Admin review in progress</strong>Your kitchen page is private for now. You can update its profile and team, but menus, posts, promotions, and orders unlock after approval.</span></p> : null}
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
            <CampusVendorInventoryPreview emptyAction={isApproved ? <Link to={inventoryHref}>Add first item <FiArrowRight /></Link> : null} emptyText={isApproved ? 'Add a menu item or service so students can discover and order it.' : 'Menu publishing unlocks after an admin approves this kitchen.'} eyebrow="Sell on Zumbarl" items={workspace.listings.slice(0, 4).map((listing) => ({ id: listing.id, image: listingImage(listing), category: listing.category, title: listing.title, stock: Number(listing.stock ?? listing.stockCount ?? 0), price: `KES ${Number(listing.priceAmount || 0).toLocaleString()}`, onAction: () => editListing(listing), actionLabel: 'Manage' }))} onViewAll={() => setActiveTab('inventory')} title="Inventory at a glance" />
            <aside className="vendor-workspace-panel vendor-workspace-access-card">
              <header><div><span>Workspace</span><h2>Team & access</h2></div><FiUsers /></header>
              <div className="vendor-workspace-access-summary"><strong>{shop.managers?.length || 0}</strong><span>assigned operators</span></div>
              <ul>{(shop.managers || []).slice(0, 4).map((manager) => <li key={manager.user.id}><span><ProfileAvatar src={manager.user.avatarUrl} alt="" /></span><div><strong>{manager.user.name || manager.user.email}</strong><small>{manager.role}</small></div></li>)}</ul>
              <button type="button" onClick={() => setActiveTab('settings')}>{canManageVendor ? 'Manage team' : 'View team'} <FiArrowRight /></button>
            </aside>
          </section>
          <section className="vendor-workspace-activity-strip">
            <div><FiClock /><span><strong>Recent activity</strong><small>{workspace.orders[0] ? `Latest order ${new Date(workspace.orders[0].createdAt).toLocaleDateString('en-KE')}` : workspace.posts[0] ? `Latest post ${new Date(workspace.posts[0].createdAt).toLocaleDateString('en-KE')}` : 'Activity will appear here as the vendor starts operating.'}</small></span></div>
            <button type="button" onClick={() => setActiveTab(workspace.orders.length ? 'orders' : 'posts')}>Open activity <FiArrowRight /></button>
          </section>
        </> : null}
        {workspace && activeTab === 'inventory' ? <section className="vendor-workspace-panel">
          <header><div><span>Products and services</span><h2>Inventory</h2><p>{workspace.listings.length ? `${workspace.listings.length} item${workspace.listings.length === 1 ? '' : 's'} · ${workspace.listings.filter((listing) => ['published', 'active'].includes(String(listing.status || '').toLowerCase())).length} live in the marketplace.` : isApproved ? 'Showcase the vendor’s products and services.' : 'Inventory unlocks when this kitchen is approved.'}</p></div>{isApproved ? <Link to={inventoryHref}><FiPlus /> Add inventory</Link> : null}</header>
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
                      <b>KES {Number(listing.priceAmount || 0).toLocaleString()}</b>
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
            description="Confirm paid campus orders and prepare each item. Once ready, the assigned errander controls collection and delivery."
            eyebrow={`${shop.name} seller workspace`}
            error=""
            initialOrderId={searchParams.get('orderId') || ''}
            isLoading={false}
            onBack={() => setActiveTab('inventory')}
            onMessageBuyer={(order) => navigate(buildPageOrderConversationHref({
              order,
              page: { id: shop.id, type: 'marketplace_shop', slug: shop.slug, name: shop.name, avatarUrl: shop.logoUrl },
              customerUserId: order.buyerUserId,
              customerHref: buyerOrderHref(order.id),
              pageHref: sellerOrderHref(order.id, vendorSlug),
            }))}
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
        {workspace && activeTab === 'finance' && canManageVendor && shop?.handlesFinances !== false ? <section className="vendor-workspace-panel"><PageFinancePanel error={financeError} finance={finance} loading={financeLoading} onRefresh={loadFinance} onSearchRecipients={(query) => searchManagedCampusVendorManagerCandidates(vendorSlug, query)} onWithdraw={async (payload) => { await requestCampusVendorWithdrawal(vendorSlug, payload); await loadFinance(); setFeedback({ type: 'success', text: 'Withdrawal requested and sent to the selected recipient.' }) }} /></section> : null}
        {workspace && activeTab === 'messages' ? <PageInboxPanel pageId={shop.id} pageName={shop.name} pageType="marketplace_shop" /> : null}
        {workspace && activeTab === 'errands' ? <section className="vendor-workspace-panel vendor-workspace-errands">
          <header><div><span>Campus delivery</span><h2>Errands</h2><p>Set one delivery price for this page. Every available errander receives each offer, and the first to accept gets it.</p></div><span className={`vendor-errand-state ${shop.errandsEnabled || shop.freeCampusDelivery ? 'is-on' : 'is-off'}`}>{shop.freeCampusDelivery ? 'Free delivery' : shop.errandsEnabled ? 'Erranders on' : 'Deliveries off'}</span></header>
          {canManageVendor ? <div className="vendor-errand-settings-grid">
            <article className="vendor-errand-price-setting is-enabled"><div><FiTruck /><span><strong>Delivery pay</strong><small>One fixed amount paid to whichever errander accepts first.</small></span></div><form onSubmit={saveDeliveryFee}><label htmlFor="vendor-errand-fee"><b>KES</b><input id="vendor-errand-fee" max="5000" min="0" onChange={(event) => setDeliveryFee(event.target.value)} required step="1" type="number" value={deliveryFee} /></label><button disabled={isSaving} type="submit">{savingErrandSetting === 'rate' ? 'Saving…' : 'Save price'}</button></form></article>
            <article className={acceptingErranders ? 'is-enabled' : 'is-disabled'}><div><FiUsers /><span><strong>Accept new erranders</strong><small>Students can register from this business page.</small></span></div><button aria-checked={acceptingErranders} aria-label={`${acceptingErranders ? 'Turn off' : 'Turn on'} new errander registrations`} className={`vendor-setting-toggle ${acceptingErranders ? 'is-active' : ''}`} disabled={isSaving} onClick={async () => { const previous = acceptingErranders; const next = !previous; setAcceptingErranders(next); const saved = await saveErrandSettings({ accepting: next }, 'accepting'); if (!saved) setAcceptingErranders(previous) }} role="switch" type="button"><span className="vendor-setting-toggle-track" aria-hidden="true"><i /></span><span className="vendor-setting-toggle-copy"><strong>{acceptingErranders ? 'Accepting' : 'Closed'}</strong><small>{savingErrandSetting === 'accepting' ? 'Saving…' : acceptingErranders ? 'Click to close' : 'Click to accept'}</small></span></button></article>
            <article className={shop.errandsEnabled ? 'is-enabled' : 'is-disabled'}><div><FiPower /><span><strong>Use student erranders</strong><small>Broadcast new deliveries to every active errander who is available.</small></span></div><button aria-checked={Boolean(shop.errandsEnabled)} aria-label={`${shop.errandsEnabled ? 'Turn off' : 'Turn on'} student errander delivery`} className={`vendor-setting-toggle ${shop.errandsEnabled ? 'is-active' : ''}`} disabled={isSaving} onClick={() => saveErrandSettings({ enabled: !shop.errandsEnabled, freeDelivery: false }, 'enabled')} role="switch" type="button"><span className="vendor-setting-toggle-track" aria-hidden="true"><i /></span><span className="vendor-setting-toggle-copy"><strong>{shop.errandsEnabled ? 'Enabled' : 'Disabled'}</strong><small>{savingErrandSetting === 'enabled' ? 'Saving…' : shop.errandsEnabled ? 'Click to disable' : 'Click to enable'}</small></span></button></article>
            <article className={shop.freeCampusDelivery ? 'is-enabled' : 'is-disabled'}><div><FiGift /><span><strong>Offer free in-campus delivery</strong><small>Your page handles delivery for free. Buyers will not be shown erranders.</small></span></div><button aria-checked={Boolean(shop.freeCampusDelivery)} aria-label={`${shop.freeCampusDelivery ? 'Turn off' : 'Turn on'} free in-campus delivery`} className={`vendor-setting-toggle ${shop.freeCampusDelivery ? 'is-active' : ''}`} disabled={isSaving} onClick={() => saveErrandSettings({ enabled: false, freeDelivery: !shop.freeCampusDelivery }, 'free-delivery')} role="switch" type="button"><span className="vendor-setting-toggle-track" aria-hidden="true"><i /></span><span className="vendor-setting-toggle-copy"><strong>{shop.freeCampusDelivery ? 'Free' : 'Not offered'}</strong><small>{savingErrandSetting === 'free-delivery' ? 'Saving…' : shop.freeCampusDelivery ? 'Click to disable' : 'Click to offer'}</small></span></button></article>
          </div> : <p>Only the page owner or an admin can change errand settings.</p>}

          <section className="vendor-erranders-roster">
            <header><div><span>Registered people</span><h3>Erranders for this page</h3><p>Remove or flag a student to stop future offers. Existing assigned deliveries remain visible.</p></div><strong>{(workspace.erranders || []).filter((item) => item.status === 'ACTIVE').length} active</strong></header>
            <div>
              {(workspace.erranders || []).map((registration) => <article key={registration.id}>
                <span className="vendor-errander-person"><ProfileAvatar alt="" src={registration.student?.avatarUrl} /><span><strong>{registration.student?.name}</strong><small>{registration.student?.isAvailable ? 'Available now' : 'Unavailable'} · {registration.student?.completedCount || 0} completed · KES {Number(shop.errandFee || 0).toLocaleString()} / delivery</small></span></span>
                <span className={`vendor-errander-status is-${String(registration.status).toLowerCase()}`}>{String(registration.status).toLowerCase()}</span>
                {canManageVendor ? <span className="vendor-errander-actions">{registration.status === 'ACTIVE' ? <><button disabled={isSaving} onClick={() => changeErrander(registration, 'FLAG')} type="button">Flag</button><button disabled={isSaving} onClick={() => changeErrander(registration, 'REMOVE')} type="button">Remove</button></> : <button disabled={isSaving} onClick={() => changeErrander(registration, 'RESTORE')} type="button">Restore</button>}</span> : null}
              </article>)}
              {!workspace.erranders?.length ? <div className="vendor-workspace-empty"><FiUsers /><div><strong>No registered erranders yet</strong><p>{acceptingErranders ? 'Students can join from this business’s public Errands tab.' : 'Turn on new errander registrations when you are ready to build your roster.'}</p></div></div> : null}
            </div>
          </section>

          <section className="vendor-errand-history"><header><div><span>Delivery activity</span><h3>Errand history</h3></div></header>
          <div className="vendor-errand-list">
            {(workspace.errands || []).map((errand) => <article key={errand.id}><span><FiTruck /><span><strong>Order #{errand.orderId.slice(-8).toUpperCase()}</strong><small>{errand.pickupLabel} → {errand.dropoffLabel}</small></span></span><span><strong>{String(errand.status).toLowerCase().replaceAll('_', ' ')}</strong><small>{errand.assignedErrander?.name || 'Waiting for an errander'}</small></span></article>)}
            {!workspace.errands?.length ? <div className="vendor-workspace-empty"><FiTruck /><div><strong>No errands yet</strong><p>New order deliveries will appear here after errands are enabled.</p></div></div> : null}
          </div>
          </section>
        </section> : null}
        {workspace && activeTab === 'posts' ? <section className="vendor-workspace-panel vendor-workspace-social-panel"><header><div><span>Vendor voice</span><h2>Posts & stories</h2><p>{isApproved ? `Publish rich Explore Campus posts and 24-hour stories using ${shop.name}’s profile.` : 'Publishing unlocks after the kitchen passes admin review.'}</p></div>{isApproved ? <div className="vendor-workspace-publish-actions"><button className="is-story" type="button" onClick={() => setIsStoryComposerOpen(true)}><FiPlay /> Create story</button><button className="is-post" type="button" onClick={() => setIsPostComposerOpen(true)}><FiPlus /> Create post</button></div> : null}</header>{posts.length ? <ManagedEntityFeed identity={{ id: shop.id, slug: shop.slug, profileType: 'vendor', name: shop.name, handle: 'Campus vendor', avatar: shop.logoUrl, campus: shop.campus || shop.locationLabel }} onEditPost={editPost} posts={posts} /> : <div className="vendor-workspace-empty"><FiPlus /><div><strong>No posts yet</strong><p>{isApproved ? 'Share this vendor’s first campus update, menu photo, offer, or behind-the-scenes moment.' : 'Your first update can be published once this kitchen is approved.'}</p></div>{isApproved ? <button type="button" onClick={() => setIsPostComposerOpen(true)}>Create first post</button> : null}</div>}</section> : null}
        {workspace && activeTab === 'settings' ? <section className="vendor-workspace-settings-grid">
          <section className="vendor-workspace-panel">
            <header><div><span>Vendor profile</span><h2>Edit vendor</h2></div></header>
            {canManageVendor ? <form className="vendor-workspace-form" onSubmit={saveVendor}>
              <div className="vendor-profile-photo-editor">
                <img src={normalizeZumbarlFileUrl(vendorDraft.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="Vendor profile preview" />
                <div><strong>Profile picture</strong><small>Use a clear square image for posts, stories, menus, and Explore Campus.</small><label><FiCamera /> {isUploadingAvatar ? 'Uploading…' : 'Change picture'}<input accept="image/*" disabled={isUploadingAvatar || isSaving} onChange={(event) => uploadVendorAvatar(event.target.files?.[0])} type="file" /></label></div>
              </div>
              <label><span>Name</span><input required value={vendorDraft.name} onChange={(event) => setVendorDraft({ ...vendorDraft, name: event.target.value })} /></label>
              <label><span>Type</span><select disabled={shop.type === 'student_kitchen'} value={vendorDraft.type} onChange={(event) => setVendorDraft({ ...vendorDraft, type: event.target.value })}><option value="hotel">Hotel</option><option value="student_kitchen">Student kitchen</option><option value="barber_shop">Barber shop</option><option value="service">Other service</option></select></label>
              <label><span>{shop.type === 'student_kitchen' ? 'Kitchen base location' : 'Location'}</span><input value={vendorDraft.locationLabel} onChange={(event) => setVendorDraft({ ...vendorDraft, locationLabel: event.target.value })} /></label>
              {shop.type === 'student_kitchen' ? <label><span>Buyer pickup locations</span><textarea rows="4" value={(vendorDraft.pickupSpots || []).join('\n')} onChange={(event) => setVendorDraft({ ...vendorDraft, pickupSpots: event.target.value.split('\n').map((spot) => spot.trim()).filter(Boolean) })} placeholder={'Hostel B entrance\nStudent centre gate'} /><small>Add one public campus pickup point per line. Buyers must choose one at checkout.</small></label> : null}
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
                  <ProfileAvatar src={candidate.avatarUrl} alt="" />
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
      description="This will cancel the order and immediately return the buyer’s full held payment to their wallet. No funds will be released to this vendor or an errander. This action cannot be undone."
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
