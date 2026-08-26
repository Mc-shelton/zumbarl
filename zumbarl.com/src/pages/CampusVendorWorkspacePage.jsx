import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBox, FiBriefcase, FiChevronRight, FiClock, FiMapPin, FiPlus, FiRefreshCw, FiSettings, FiShield, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import ExplorePostComposer from '../features/explore/components/ExplorePostComposer'
import { addManagedCampusVendorManager, createCampusVendorPost, createCampusVendorPromotion, readCampusVendorWorkspace, removeManagedCampusVendorManager, updateManagedCampusVendor } from '../features/opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import '../styles/campus.css'
import '../styles/explore-campus.css'
import '../styles/vendor-workspace.css'

const TABS = [
  { id: 'overview', label: 'Overview', Icon: FiBriefcase },
  { id: 'inventory', label: 'Inventory', Icon: FiBox },
  { id: 'orders', label: 'Orders', Icon: FiShoppingBag },
  { id: 'posts', label: 'Posts', Icon: FiPlus },
  { id: 'promotions', label: 'Promotions', Icon: FiTrendingUp },
  { id: 'settings', label: 'Settings & team', Icon: FiSettings },
]

function CampusVendorWorkspacePage() {
  const { vendorSlug } = useParams()
  const [workspace, setWorkspace] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [status, setStatus] = useState('Loading vendor workspace…')
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false)
  const [promotion, setPromotion] = useState({ headline: '', description: '', callToAction: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [vendorDraft, setVendorDraft] = useState({ name: '', type: 'service', description: '', locationLabel: '' })
  const [assignment, setAssignment] = useState({ email: '', role: 'editor' })

  const load = useCallback(async () => {
    try {
      const nextWorkspace = await readCampusVendorWorkspace(vendorSlug)
      setWorkspace(nextWorkspace)
      setVendorDraft({ name: nextWorkspace.shop.name || '', type: nextWorkspace.shop.type || 'service', description: nextWorkspace.shop.description || '', locationLabel: nextWorkspace.shop.locationLabel || '' })
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'This vendor workspace could not be loaded.')
    }
  }, [vendorSlug])

  // Loading the selected vendor is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const promotions = useMemo(() => (workspace?.posts || []).filter((post) => post.type === 'promotion' || post.isPromoted || post.promotion), [workspace?.posts])
  const posts = useMemo(() => (workspace?.posts || []).filter((post) => post.type !== 'promotion' && !post.isPromoted && !post.promotion), [workspace?.posts])
  const shop = workspace?.shop

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

  async function publishPromotion(event) {
    event.preventDefault()
    if (await runAction(() => createCampusVendorPromotion(vendorSlug, promotion), 'Promotion published.')) setPromotion({ headline: '', description: '', callToAction: '' })
  }

  async function saveVendor(event) {
    event.preventDefault()
    await runAction(() => updateManagedCampusVendor(vendorSlug, vendorDraft), 'Vendor profile updated.')
  }

  async function saveAssignment(event) {
    event.preventDefault()
    if (await runAction(() => addManagedCampusVendorManager(vendorSlug, assignment), 'Vendor assignment updated.')) setAssignment({ email: '', role: 'editor' })
  }

  async function removeAssignment(userId) {
    await runAction(() => removeManagedCampusVendorManager(vendorSlug, userId), 'Vendor operator removed.')
  }

  const inventoryHref = shop ? `/campus/marketplace/listings/new?vendorId=${encodeURIComponent(shop.id)}&vendorSlug=${encodeURIComponent(shop.slug)}` : '#'

  return <main className="campus-page vendor-workspace-page">
    <Seo title={`${shop?.name || 'Vendor'} workspace | Zumbarl`} description="Manage campus vendor inventory, orders, posts and promotions." path={`/campus/vendors/${vendorSlug}/manage`} />
    <div className="campus-stage"><div className="campus-shell vendor-workspace-shell">
      <CampusSidebar activeItemId="marketplace" supportCard={null} />
      <section className="campus-main vendor-workspace-main">
        <header className="vendor-workspace-intro">
          <div className="vendor-workspace-breadcrumb"><Link to="/campus/profile?tab=pages"><FiArrowLeft /> My pages</Link><FiChevronRight /><span>Vendor workspace</span></div>
          <div className="vendor-workspace-title-row">
            <div className="vendor-workspace-identity">
              <img src={normalizeZumbarlFileUrl(shop?.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" />
              <div><span>Campus vendor</span><h1>{shop?.name || 'Loading vendor…'}</h1><p>{shop?.description || 'Inventory, orders, content, promotions, and vendor access in one place.'}</p></div>
            </div>
            <div className="vendor-workspace-actions">
              {workspace ? <Link className="is-primary" to={inventoryHref}><FiPlus /> Add inventory</Link> : null}
              <button type="button" onClick={load}><FiRefreshCw /> Refresh</button>
            </div>
          </div>
          {shop ? <div className="vendor-workspace-meta"><span><FiMapPin /> {shop.campus || shop.locationLabel || 'Campus vendor'}</span><span><FiBriefcase /> {(shop.type || 'service').replaceAll('_', ' ')}</span><span><FiShield /> {shop.viewerRole || 'editor'} access</span><span className="is-live">Active</span></div> : null}
        </header>

        <nav className="vendor-workspace-tabs" aria-label="Vendor tools">
          {TABS.map(({ id, label, Icon }) => <button className={activeTab === id ? 'is-active' : ''} key={id} onClick={() => setActiveTab(id)} type="button"><Icon /> {label}</button>)}
        </nav>
        {status ? <p className="vendor-workspace-status">{status}</p> : null}
        {feedback ? <p className={`vendor-workspace-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p> : null}
        {workspace && activeTab === 'overview' ? <>
          <section className="vendor-workspace-metrics">
            <button type="button" onClick={() => setActiveTab('inventory')}><span><FiBox /> Inventory</span><strong>{workspace.listings.length}</strong><small>Products and services <FiArrowRight /></small></button>
            <button type="button" onClick={() => setActiveTab('orders')}><span><FiShoppingBag /> Orders</span><strong>{workspace.orders.length}</strong><small>Customer activity <FiArrowRight /></small></button>
            <button type="button" onClick={() => setActiveTab('posts')}><span><FiPlus /> Posts</span><strong>{posts.length}</strong><small>Vendor updates <FiArrowRight /></small></button>
            <button type="button" onClick={() => setActiveTab('promotions')}><span><FiTrendingUp /> Promotions</span><strong>{promotions.length}</strong><small>Active offers <FiArrowRight /></small></button>
          </section>
          <section className="vendor-workspace-overview-grid">
            <section className="vendor-workspace-panel vendor-workspace-overview-list">
              <header><div><span>Sell on Zumbarl</span><h2>Inventory at a glance</h2></div><button type="button" onClick={() => setActiveTab('inventory')}>View all <FiArrowRight /></button></header>
              {workspace.listings.length ? <div className="vendor-workspace-list">{workspace.listings.slice(0, 4).map((listing) => <article key={listing.id}><span><strong>{listing.title}</strong><small>{listing.category} · {listing.stock ?? listing.stockCount ?? 0} available</small></span><b>KSh {Number(listing.priceAmount || 0).toLocaleString()}</b></article>)}</div> : <div className="vendor-workspace-empty"><FiBox /><div><strong>Your vendor has no inventory yet</strong><p>Add rooms, products, services, menus, or bookable offers so students can discover and order them.</p></div><Link to={inventoryHref}>Add first item <FiArrowRight /></Link></div>}
            </section>
            <aside className="vendor-workspace-panel vendor-workspace-access-card">
              <header><div><span>Workspace</span><h2>Team & access</h2></div><FiUsers /></header>
              <div className="vendor-workspace-access-summary"><strong>{shop.managers?.length || 0}</strong><span>assigned operators</span></div>
              <ul>{(shop.managers || []).slice(0, 4).map((manager) => <li key={manager.user.id}><span>{(manager.user.name || manager.user.email || '?').slice(0, 1).toUpperCase()}</span><div><strong>{manager.user.name || manager.user.email}</strong><small>{manager.role}</small></div></li>)}</ul>
              <button type="button" onClick={() => setActiveTab('settings')}>{shop.canManageAssignments ? 'Manage team' : 'View team'} <FiArrowRight /></button>
            </aside>
          </section>
          <section className="vendor-workspace-activity-strip">
            <div><FiClock /><span><strong>Recent activity</strong><small>{workspace.orders[0] ? `Latest order ${new Date(workspace.orders[0].createdAt).toLocaleDateString('en-KE')}` : workspace.posts[0] ? `Latest post ${new Date(workspace.posts[0].createdAt).toLocaleDateString('en-KE')}` : 'Activity will appear here as the vendor starts operating.'}</small></span></div>
            <button type="button" onClick={() => setActiveTab(workspace.orders.length ? 'orders' : 'posts')}>Open activity <FiArrowRight /></button>
          </section>
        </> : null}
        {workspace && activeTab === 'inventory' ? <section className="vendor-workspace-panel">
          <header><div><span>Products and services</span><h2>Inventory</h2></div><Link to={inventoryHref}><FiPlus /> Add inventory</Link></header>
          <div className="vendor-workspace-list">{workspace.listings.map((listing) => <article key={listing.id}><span><strong>{listing.title}</strong><small>{listing.category} · {listing.stock ?? listing.stockCount ?? 0} in stock</small></span><b>KSh {Number(listing.priceAmount || 0).toLocaleString()}</b></article>)}{!workspace.listings.length ? <p>No inventory yet. Add the vendor’s first product or service.</p> : null}</div>
        </section> : null}
        {workspace && activeTab === 'orders' ? <section className="vendor-workspace-panel"><header><div><span>Customer activity</span><h2>Orders</h2></div></header><div className="vendor-workspace-list">{workspace.orders.map((order) => <article key={order.id}><span><strong>Order #{order.id.slice(-8).toUpperCase()}</strong><small>{order.fulfillmentStatus.replaceAll('_', ' ')} · {new Date(order.createdAt).toLocaleString()}</small></span><b>KSh {Number(order.totalAmount || 0).toLocaleString()}</b></article>)}{!workspace.orders.length ? <p>No vendor orders yet.</p> : null}</div></section> : null}
        {workspace && activeTab === 'posts' ? <section className="vendor-workspace-panel"><header><div><span>Vendor voice</span><h2>Posts</h2><p>Publish a normal Explore Campus post using {shop.name}’s profile.</p></div><button type="button" onClick={() => setIsPostComposerOpen(true)}><FiPlus /> Create post</button></header><div className="vendor-workspace-list">{posts.map((post) => <article key={post.id}><span><strong>{post.body}</strong><small>{String(post.type || 'post').replaceAll('_', ' ')} · {new Date(post.createdAt).toLocaleString()}</small></span></article>)}{!posts.length ? <p>No posts yet. Share the vendor’s first campus update.</p> : null}</div></section> : null}
        {workspace && activeTab === 'promotions' ? <section className="vendor-workspace-panel"><header><div><span>Offers and reach</span><h2>Promotions</h2></div></header><form className="vendor-workspace-form" onSubmit={publishPromotion}><label><span>Headline</span><input required value={promotion.headline} onChange={(event) => setPromotion({ ...promotion, headline: event.target.value })} /></label><label><span>Description</span><textarea required value={promotion.description} onChange={(event) => setPromotion({ ...promotion, description: event.target.value })} /></label><label><span>Call to action</span><input value={promotion.callToAction} onChange={(event) => setPromotion({ ...promotion, callToAction: event.target.value })} placeholder="e.g. Order now" /></label><button disabled={isSaving} type="submit">{isSaving ? 'Publishing…' : 'Publish promotion'}</button></form><div className="vendor-workspace-list">{promotions.map((item) => <article key={item.id}><span><strong>{item.headline}</strong><small>{item.description}</small></span><em>Active</em></article>)}</div></section> : null}
        {workspace && activeTab === 'settings' ? <section className="vendor-workspace-settings-grid">
          <section className="vendor-workspace-panel"><header><div><span>Vendor profile</span><h2>Edit vendor</h2></div></header>{shop.canManageAssignments ? <form className="vendor-workspace-form" onSubmit={saveVendor}><label><span>Name</span><input required value={vendorDraft.name} onChange={(event) => setVendorDraft({ ...vendorDraft, name: event.target.value })} /></label><label><span>Type</span><select value={vendorDraft.type} onChange={(event) => setVendorDraft({ ...vendorDraft, type: event.target.value })}><option value="hotel">Hotel</option><option value="barber_shop">Barber shop</option><option value="service">Other service</option></select></label><label><span>Location</span><input value={vendorDraft.locationLabel} onChange={(event) => setVendorDraft({ ...vendorDraft, locationLabel: event.target.value })} /></label><label><span>Description</span><textarea value={vendorDraft.description} onChange={(event) => setVendorDraft({ ...vendorDraft, description: event.target.value })} /></label><button disabled={isSaving} type="submit">Save vendor</button></form> : <p>Editors can operate this vendor. An owner or vendor admin controls profile settings and assignments.</p>}</section>
          <section className="vendor-workspace-panel"><header><div><span>Access control</span><h2><FiUsers /> Vendor team</h2></div></header><div className="vendor-workspace-list">{(shop.managers || []).map((manager) => <article key={manager.user.id}><span><strong>{manager.user.name || manager.user.email}</strong><small>{manager.user.email} · {manager.role}</small></span>{shop.canManageAssignments && manager.role !== 'owner' ? <button disabled={isSaving} onClick={() => removeAssignment(manager.user.id)} type="button">Remove</button> : <em>{manager.role}</em>}</article>)}</div>{shop.canManageAssignments ? <form className="vendor-workspace-form vendor-assignment-form" onSubmit={saveAssignment}><label><span>Operator email</span><input required type="email" value={assignment.email} onChange={(event) => setAssignment({ ...assignment, email: event.target.value })} placeholder="operator@example.com" /></label><label><span>Role</span><select value={assignment.role} onChange={(event) => setAssignment({ ...assignment, role: event.target.value })}><option value="admin">Admin · settings and assignments</option><option value="editor">Editor · daily operations</option></select></label><button disabled={isSaving} type="submit">Add or update operator</button></form> : null}</section>
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
  </main>
}

export default CampusVendorWorkspacePage
