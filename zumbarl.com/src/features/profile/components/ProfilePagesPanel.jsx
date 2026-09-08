import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArchive, FiArrowRight, FiBookOpen, FiCoffee, FiGlobe, FiLock, FiPlus, FiShoppingBag, FiUsers, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import KnowledgeAvatarPicker from '../../learn/components/KnowledgeAvatarPicker'
import { createKnowledgeSpace, readKnowledgeHub } from '../../learn/services/learnService'
import { createStudentKitchen, listMyCampusVendors } from '../../opportunities/services/marketplaceInteractionService'
import { listMyManagedProfiles } from '../services/managedProfileService'
import { readMyStudentKyc } from '../services/profileKycService'

const EMPTY_SPACE = {
  type: 'LIBRARY', groupType: 'STUDY_GROUP', name: '', description: '', locationLabel: '', pickupSpotsText: '', contactEmail: '', contactPhone: '', visibility: 'CAMPUS', membershipMode: 'REQUEST', avatarUrl: '',
}

const GROUP_TYPE_OPTIONS = [
  { value: 'STUDY_GROUP', label: 'Study group' },
  { value: 'CLUB', label: 'Club' },
  { value: 'ASSOCIATION', label: 'Association' },
  { value: 'SOCIETY', label: 'Society' },
]

function groupTypeLabel(value) {
  return GROUP_TYPE_OPTIONS.find((option) => option.value.toLowerCase() === String(value || '').toLowerCase())?.label || 'Study group'
}

function isManager(space) {
  return space.membership?.role === 'owner' || space.membership?.role === 'admin'
}

function ProfilePagesPanel({ isOwnProfile = false, onOpenKnowledgeHub, profileName = '', profileStudentId = '' }) {
  const [data, setData] = useState({ libraries: [], groups: [], resources: [], managedProfiles: [], vendors: [], kyc: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_SPACE)
  const [avatarFile, setAvatarFile] = useState(null)

  const closeCreateDialog = () => {
    setIsCreateOpen(false)
    setAvatarFile(null)
    setForm(EMPTY_SPACE)
  }
  const loadPages = useCallback(() => {
    setIsLoading(true)
    setError('')
    return Promise.all([
      readKnowledgeHub(),
      listMyManagedProfiles().catch(() => ({ data: [] })),
      listMyCampusVendors().catch(() => ({ vendors: [] })),
      isOwnProfile ? readMyStudentKyc().catch(() => null) : Promise.resolve(null),
    ])
      .then(([payload, managed, vendorPayload, kyc]) => setData({
        ...(payload || { libraries: [], groups: [], resources: [] }),
        managedProfiles: managed?.data || [],
        vendors: vendorPayload?.vendors || [],
        kyc,
      }))
      .catch((requestError) => setError(requestError.message || 'Pages could not be loaded.'))
      .finally(() => setIsLoading(false))
  }, [isOwnProfile])

  // Loading the account-owned pages is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPages() }, [loadPages])

  const spaces = useMemo(() => [...(data.libraries || []), ...(data.groups || [])], [data.groups, data.libraries])
  const managedProfiles = useMemo(() => data.managedProfiles || [], [data.managedProfiles])
  const vendors = useMemo(() => data.vendors || [], [data.vendors])
  const studentKitchens = useMemo(() => vendors.filter((vendor) => vendor.type === 'student_kitchen'), [vendors])
  const shops = useMemo(() => vendors.filter((vendor) => vendor.type === 'shop'), [vendors])
  const campusVendors = useMemo(() => vendors.filter((vendor) => !['student_kitchen', 'shop'].includes(vendor.type)), [vendors])
  const hasCurrentKitchen = useMemo(() => studentKitchens.some((kitchen) => !['rejected', 'archived'].includes(String(kitchen.approvalStatus || kitchen.status).toLowerCase())), [studentKitchens])
  const kitchenReady = Boolean(data.kyc?.eligibility?.studentKitchen?.approved)
  const kitchenLockReason = hasCurrentKitchen
    ? 'You already have a student kitchen'
    : 'Complete KYC first: your National ID and Student ID must be approved'
  const isKitchenFormLocked = form.type === 'STUDENT_KITCHEN' && !kitchenReady
  const linkedVendorIds = useMemo(() => new Set(managedProfiles.flatMap((profile) => (
    campusVendors.filter((vendor) => vendor.campusManagedProfileId === profile.id).map((vendor) => vendor.id)
  ))), [managedProfiles, campusVendors])
  const unlinkedVendorsByCampus = useMemo(() => {
    const groups = new Map()
    campusVendors.filter((vendor) => !linkedVendorIds.has(vendor.id)).forEach((vendor) => {
      const key = vendor.campusManagedProfileId || vendor.campus || 'assigned-campus'
      const group = groups.get(key) || { id: key, name: vendor.campus || 'Assigned campus', vendors: [] }
      group.vendors.push(vendor)
      groups.set(key, group)
    })
    return [...groups.values()]
  }, [campusVendors, linkedVendorIds])
  const visibleSpaces = useMemo(() => spaces.filter((space) => (
    isOwnProfile ? isManager(space) : space.owner?.id === profileStudentId
  )), [isOwnProfile, profileStudentId, spaces])

  const submitSpace = async (event) => {
    event.preventDefault()
    if (form.type === 'STUDENT_KITCHEN' && !kitchenReady) {
      setError('Complete KYC before creating a student kitchen. Your National ID and Student ID must both be approved.')
      return
    }
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const avatarUpload = avatarFile
        ? await uploadZumbarlFile(avatarFile, { scope: form.type === 'STUDENT_KITCHEN' ? 'marketplace' : 'knowledge-space-avatar', metadata: { purpose: form.type === 'STUDENT_KITCHEN' ? 'shop-logo' : 'knowledge-space-avatar', spaceType: form.type } })
        : null
      const avatarUrl = avatarUpload?.url || avatarUpload?.previewUrl || undefined
      if (form.type === 'STUDENT_KITCHEN') {
        const pickupSpots = [...new Set([form.locationLabel, ...form.pickupSpotsText.split('\n')].map((spot) => spot.trim()).filter(Boolean))]
        await createStudentKitchen({ name: form.name, description: form.description, locationLabel: form.locationLabel, pickupSpots, contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined, logoUrl: avatarUrl })
        setNotice('Your student kitchen was submitted. It will stay private until an admin approves it.')
      } else {
        await createKnowledgeSpace({ ...form, avatarUrl })
        setNotice('Your page was created.')
      }
      setForm(EMPTY_SPACE)
      setAvatarFile(null)
      setIsCreateOpen(false)
      await loadPages()
    } catch (requestError) {
      setError(requestError.message || 'The page could not be created.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="campus-profile-surface campus-pages-panel">
      <header className="campus-pages-head">
        <div>
          <span className="campus-pages-eyebrow">Managed identities</span>
          <h2>Pages</h2>
          <p>{isOwnProfile ? 'Manage assigned campus pages and your operating vendors. Vendors have inventory, orders, posts, and promotions.' : `Pages managed by ${profileName || 'this student'}.`}</p>
        </div>
        <div className="campus-pages-actions">
          <button type="button" className="campus-pages-secondary-btn" onClick={() => onOpenKnowledgeHub?.('resources')}><FiBookOpen /> Open Knowledge Hub</button>
          {isOwnProfile ? <button type="button" className="campus-pages-primary-btn" onClick={() => setIsCreateOpen(true)}><FiPlus /> Create page</button> : null}
        </div>
      </header>

      {error ? <p className="campus-pages-feedback is-error" role="alert">{error}</p> : null}
      {notice ? <p className="campus-pages-feedback" role="status">{notice}</p> : null}

      {isLoading ? <p className="campus-pages-empty">Loading pages…</p> : (
        <div className="campus-pages-grid">
          {isOwnProfile ? managedProfiles.map((profile) => {
            const type = String(profile.type || 'service').toLowerCase()
            const typeLabel = type === 'hotel' ? 'Hotel' : type === 'service' ? 'Campus service' : type[0].toUpperCase() + type.slice(1)
            const avatarUrl = normalizeZumbarlFileUrl(profile.avatarUrl) || '/assets/knowledge/default-group-avatar.svg'
            const coverUrl = normalizeZumbarlFileUrl(profile.coverImageUrl) || avatarUrl
            const linkedVendors = campusVendors.filter((vendor) => vendor.campusManagedProfileId === profile.id)
            return <article className={`campus-page-card is-managed-profile${linkedVendors.length ? ' has-vendors' : ''}`} key={profile.id}>
              <Link className="campus-page-cover" to={`/campus/organizations/${encodeURIComponent(profile.slug || profile.id)}`} aria-label={`Open ${profile.name}`}>
                <img src={coverUrl} alt={`${profile.name} thumbnail`} />
                <span>{typeLabel}</span>
              </Link>
              <div className="campus-page-card-copy">
                <div className="campus-page-card-meta"><span>{typeLabel}</span><span><FiUsers /> {profile.managers?.[0]?.role || 'manager'}</span></div>
                <h3>{profile.name}</h3>
                <p>{profile.bio || profile.locationLabel || 'Admin-created campus page assigned for management.'}</p>
              </div>
              <div className="campus-page-card-stats"><span><strong>{profile._count?.posts || 0}</strong> updates</span><span><strong>{profile._count?.followers || 0}</strong> followers</span></div>
              {linkedVendors.length ? <section className="campus-page-vendors" aria-label={`Vendors at ${profile.name}`}>
                <header><span>Campus vendors</span><strong>{linkedVendors.length}</strong></header>
                {linkedVendors.map((vendor) => <Link className="campus-page-vendor-row" key={vendor.id} to={`/campus/vendors/${encodeURIComponent(vendor.slug)}/manage`}>
                  <img src={normalizeZumbarlFileUrl(vendor.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" />
                  <span><strong>{vendor.name}</strong><small>{vendor.type?.replaceAll('_', ' ') || 'Service'} · {vendor.inventoryCount || 0} inventory items</small></span>
                  <span className="campus-page-vendor-role">{vendor.role || 'editor'}</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>)}
              </section> : null}
              <footer className="campus-page-card-actions"><Link to={`/campus/organizations/${encodeURIComponent(profile.slug || profile.id)}`}>Open campus page</Link></footer>
            </article>
          }) : null}
          {isOwnProfile ? shops.map((shop) => {
            const shopCoverUrl = normalizeZumbarlFileUrl(shop.coverImageUrl || shop.logoUrl) || '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp'
            return <article className="campus-page-card is-marketplace-shop" key={shop.id}>
              <Link className="campus-page-cover" to={`/campus/vendors/${encodeURIComponent(shop.slug)}`} aria-label={`Open ${shop.name}`}>
                <img src={shopCoverUrl} alt={`${shop.name} thumbnail`} />
                <span>Shop page</span>
              </Link>
              <div className="campus-page-card-copy">
                <div className="campus-page-card-meta"><span>Shop</span><span><FiShoppingBag /> {shop.role || 'owner'}</span></div>
                <h3>{shop.name}</h3>
                <p>{shop.description || shop.tagline || 'A student-run campus shop.'}</p>
              </div>
              <div className="campus-page-card-stats"><span><strong>{shop.inventoryCount || 0}</strong> items</span><span><strong>{shop.orderCount || 0}</strong> orders</span><span><strong>{shop.errandsEnabled ? 'On' : 'Off'}</strong> errands</span></div>
              <footer className="campus-page-card-actions"><Link to={`/campus/vendors/${encodeURIComponent(shop.slug)}/manage`}>Manage shop page</Link></footer>
            </article>
          }) : null}
          {isOwnProfile ? studentKitchens.map((kitchen) => {
            const approvalStatus = String(kitchen.approvalStatus || kitchen.status || 'pending').toLowerCase()
            const statusLabel = approvalStatus === 'approved' || approvalStatus === 'open' || approvalStatus === 'closed' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending approval'
            const kitchenCoverUrl = normalizeZumbarlFileUrl(kitchen.coverImageUrl || kitchen.logoUrl) || '/assets/knowledge/default-group-avatar.svg'
            return <article className="campus-page-card is-student-kitchen" key={kitchen.id}>
              <Link className="campus-page-cover is-student-kitchen" to={`/campus/vendors/${encodeURIComponent(kitchen.slug)}/manage`} aria-label={`Manage ${kitchen.name}`}>
                <img src={kitchenCoverUrl} alt={`${kitchen.name} thumbnail`} />
                <span>Student kitchen</span>
              </Link>
              <div className="campus-page-card-copy">
                <div className="campus-page-card-meta"><span>Student kitchen</span><span className={`campus-page-approval-status is-${approvalStatus}`}>{statusLabel}</span></div>
                <h3>{kitchen.name}</h3>
                <p>{kitchen.description || 'A student-owned kitchen page.'}</p>
              </div>
              <div className="campus-page-card-stats"><span><strong>{kitchen.inventoryCount || 0}</strong> menu items</span><span><strong>{kitchen.role || 'owner'}</strong> access</span><span><strong>{approvalStatus === 'approved' || approvalStatus === 'open' || approvalStatus === 'closed' ? 'Public' : 'Private'}</strong> visibility</span></div>
              <Link className={`campus-page-kitchen-operations is-${approvalStatus}`} to={`/campus/vendors/${encodeURIComponent(kitchen.slug)}/manage`} aria-label={`Manage ${kitchen.name} menu and orders`}>
                <header><span>Kitchen operations</span><FiCoffee aria-hidden="true" /></header>
                <div><span><FiShoppingBag aria-hidden="true" /><strong>Menu & orders</strong></span><small>{approvalStatus === 'pending' ? 'Unlocks after admin approval' : approvalStatus === 'rejected' ? 'Submission was not approved' : `${kitchen.inventoryCount || 0} menu items · Ready to manage`}</small></div>
                <p>{kitchen.locationLabel || kitchen.campus || 'Campus pickup location'}</p>
              </Link>
              <footer className="campus-page-card-actions"><Link to={`/campus/vendors/${encodeURIComponent(kitchen.slug)}/manage`}>{approvalStatus === 'pending' ? 'View submission' : 'Manage kitchen'}</Link></footer>
            </article>
          }) : null}
          {isOwnProfile ? unlinkedVendorsByCampus.map((group) => <article className="campus-page-card is-managed-profile has-vendors is-vendor-campus" key={group.id}>
            <div className="campus-page-cover is-placeholder"><FiUsers aria-hidden="true" /><span>Campus</span></div>
            <div className="campus-page-card-copy"><div className="campus-page-card-meta"><span>Campus</span><span><FiShoppingBag /> Vendor access</span></div><h3>{group.name}</h3><p>Vendors assigned to you at this campus.</p></div>
            <section className="campus-page-vendors" aria-label={`Vendors at ${group.name}`}>
              <header><span>Campus vendors</span><strong>{group.vendors.length}</strong></header>
              {group.vendors.map((vendor) => <Link className="campus-page-vendor-row" key={vendor.id} to={`/campus/vendors/${encodeURIComponent(vendor.slug)}/manage`}>
                <img src={normalizeZumbarlFileUrl(vendor.logoUrl) || '/assets/knowledge/default-group-avatar.svg'} alt="" />
                <span><strong>{vendor.name}</strong><small>{vendor.type?.replaceAll('_', ' ') || 'Service'} · {vendor.inventoryCount || 0} inventory items</small></span>
                <span className="campus-page-vendor-role">{vendor.role || 'editor'}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>)}
            </section>
          </article>) : null}
          {visibleSpaces.map((space) => (
            <article className="campus-page-card" key={space.id}>
              <Link className={`campus-page-cover is-${space.type}`} to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`} aria-label={`Open ${space.name}`}>
                <img src={normalizeZumbarlFileUrl(space.coverImageUrl || space.avatarUrl) || '/assets/knowledge/default-group-avatar.svg'} alt={`${space.name} thumbnail`} />
                <span>{space.type === 'library' ? 'Library' : groupTypeLabel(space.groupType)}</span>
              </Link>
              <div className="campus-page-card-copy">
                <div className="campus-page-card-meta">
                  <span>{space.type === 'library' ? 'Library' : groupTypeLabel(space.groupType)}</span>
                  <span>{space.visibility === 'private' ? <FiLock /> : <FiGlobe />}{space.visibility || 'campus'}</span>
                </div>
                <h3>{space.name}</h3>
                <p>{space.description || 'No description has been added yet.'}</p>
              </div>
              <div className="campus-page-card-stats">
                <span><strong>{space.resourceCount || 0}</strong> resources</span>
                <span><strong>{space.memberCount || 0}</strong> members</span>
                <span><strong>{space.followerCount || 0}</strong> followers</span>
              </div>
              <Link to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`}>Open page</Link>
            </article>
          ))}
          {!visibleSpaces.length && !managedProfiles.length && !vendors.length ? (
            <div className="campus-pages-empty">
              <FiArchive />
              <h3>{isOwnProfile ? 'Create your first page' : 'No published pages yet'}</h3>
              <p>{isOwnProfile ? 'Create a library, group, club, or student kitchen—or wait for a campus administrator to assign a page.' : `${profileName || 'This student'} has not published a managed page.`}</p>
              {isOwnProfile ? <button type="button" onClick={() => setIsCreateOpen(true)}>Create a page</button> : null}
            </div>
          ) : null}
        </div>
      )}

      {isCreateOpen ? (
        <div className="campus-pages-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreateDialog() }}>
          <form className="campus-pages-dialog" onSubmit={submitSpace}>
            <button type="button" className="campus-pages-dialog-close" onClick={closeCreateDialog} aria-label="Close"><FiX /></button>
            <span className="campus-pages-eyebrow">Create under your account</span>
            <h2>{form.type === 'STUDENT_KITCHEN' ? 'New student kitchen' : 'New library, group or club'}</h2>
            <p>{form.type === 'STUDENT_KITCHEN' ? 'Create a student-owned food page. An admin will review it before it appears in Eatery or accepts orders.' : 'Create a resource library or give your student community its own page. Mental-health support circles are created separately inside Wellbeing.'}</p>
            <div className="campus-pages-type-switch">
              <button type="button" className={form.type === 'LIBRARY' ? 'is-active' : ''} onClick={() => setForm({ ...form, type: 'LIBRARY' })}><FiArchive /> Library</button>
              <button type="button" className={form.type === 'GROUP' ? 'is-active' : ''} onClick={() => setForm({ ...form, type: 'GROUP' })}><FiUsers /> Groups & clubs</button>
              <button type="button" disabled={hasCurrentKitchen} title={hasCurrentKitchen || !kitchenReady ? kitchenLockReason : ''} className={form.type === 'STUDENT_KITCHEN' ? 'is-active' : ''} onClick={() => setForm({ ...form, type: 'STUDENT_KITCHEN' })}><FiCoffee /> Student kitchen</button>
            </div>
            {isKitchenFormLocked && !hasCurrentKitchen ? <p className="campus-pages-kyc-lock" role="status"><FiLock /><span><strong>KYC required for student kitchens</strong>Your National ID and Student ID must be approved first. Open <b>Edit Profile → KYC</b> to submit them.</span></p> : null}
            {!isKitchenFormLocked ? <>{form.type === 'GROUP' ? <label><span>Type</span><select required value={form.groupType} onChange={(event) => setForm({ ...form, groupType: event.target.value })}>{GROUP_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : null}
            <label><span>Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label><span>Description</span><textarea required={form.type === 'STUDENT_KITCHEN'} minLength={form.type === 'STUDENT_KITCHEN' ? 10 : undefined} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            {form.type === 'STUDENT_KITCHEN' ? <><label><span>Primary campus pickup location</span><input required value={form.locationLabel} placeholder="e.g. Hostel B entrance" onChange={(event) => setForm({ ...form, locationLabel: event.target.value })} /></label><label><span>Other pickup locations</span><textarea rows="3" value={form.pickupSpotsText} placeholder={'Student centre entrance\nLibrary courtyard'} onChange={(event) => setForm({ ...form, pickupSpotsText: event.target.value })} /><small>Optional · add one public campus pickup point per line. Buyers will choose from this list.</small></label><div className="campus-pages-form-row"><label><span>Kitchen email</span><input type="email" value={form.contactEmail} placeholder="orders@example.com" onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} /></label><label><span>Phone or WhatsApp</span><input type="tel" minLength="6" value={form.contactPhone} placeholder="e.g. +254 700 000 000" onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></label></div></> : <div className="campus-pages-form-row">
              <label><span>Visibility</span><select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}><option value="CAMPUS">Campus</option><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
              <label><span>Membership</span><select value={form.membershipMode} onChange={(event) => setForm({ ...form, membershipMode: event.target.value })}><option value="REQUEST">Admin approval required</option><option value="INVITE">Invite only</option></select></label>
            </div>}
            {form.type === 'STUDENT_KITCHEN' ? <p className="campus-pages-approval-note">Your kitchen remains private while the admin checks its identity, location, and food-safety details. You can edit its page during review.</p> : null}
            <KnowledgeAvatarPicker file={avatarFile} fallbackUrl={form.type === 'STUDENT_KITCHEN' ? '/assets/knowledge/default-group-avatar.svg' : `/assets/knowledge/default-${form.type.toLowerCase()}-avatar.svg`} onChange={setAvatarFile} onClear={() => setAvatarFile(null)} disabled={isSaving} />
            <button type="submit" className="campus-pages-primary-btn" disabled={isSaving || isKitchenFormLocked}>{isSaving ? 'Creating…' : form.type === 'STUDENT_KITCHEN' ? 'Submit for approval' : 'Create page'}</button></> : null}
          </form>
        </div>
      ) : null}

    </section>
  )
}

export default ProfilePagesPanel
