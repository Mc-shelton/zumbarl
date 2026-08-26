import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArchive, FiArrowRight, FiBookOpen, FiGlobe, FiLock, FiPlus, FiShoppingBag, FiUsers, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import KnowledgeAvatarPicker from '../../learn/components/KnowledgeAvatarPicker'
import { createKnowledgeSpace, readKnowledgeHub } from '../../learn/services/learnService'
import { listMyCampusVendors } from '../../opportunities/services/marketplaceInteractionService'
import { listMyManagedProfiles } from '../services/managedProfileService'

const EMPTY_SPACE = {
  type: 'LIBRARY', name: '', description: '', visibility: 'CAMPUS', membershipMode: 'REQUEST', avatarUrl: '',
}

function isManager(space) {
  return space.membership?.role === 'owner' || space.membership?.role === 'admin'
}

function ProfilePagesPanel({ isOwnProfile = false, onOpenKnowledgeHub, profileName = '', profileStudentId = '' }) {
  const [data, setData] = useState({ libraries: [], groups: [], resources: [], managedProfiles: [], vendors: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_SPACE)
  const [avatarFile, setAvatarFile] = useState(null)

  const closeCreateDialog = () => {
    setIsCreateOpen(false)
    setAvatarFile(null)
  }
  const loadPages = useCallback(() => {
    setIsLoading(true)
    setError('')
    return Promise.all([
      readKnowledgeHub(),
      listMyManagedProfiles().catch(() => ({ data: [] })),
      listMyCampusVendors().catch(() => ({ vendors: [] })),
    ])
      .then(([payload, managed, vendorPayload]) => setData({
        ...(payload || { libraries: [], groups: [], resources: [] }),
        managedProfiles: managed?.data || [],
        vendors: vendorPayload?.vendors || [],
      }))
      .catch((requestError) => setError(requestError.message || 'Pages could not be loaded.'))
      .finally(() => setIsLoading(false))
  }, [])

  // Loading the account-owned pages is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPages() }, [loadPages])

  const spaces = useMemo(() => [...(data.libraries || []), ...(data.groups || [])], [data.groups, data.libraries])
  const managedProfiles = useMemo(() => data.managedProfiles || [], [data.managedProfiles])
  const vendors = useMemo(() => data.vendors || [], [data.vendors])
  const linkedVendorIds = useMemo(() => new Set(managedProfiles.flatMap((profile) => (
    vendors.filter((vendor) => vendor.campusManagedProfileId === profile.id).map((vendor) => vendor.id)
  ))), [managedProfiles, vendors])
  const unlinkedVendorsByCampus = useMemo(() => {
    const groups = new Map()
    vendors.filter((vendor) => !linkedVendorIds.has(vendor.id)).forEach((vendor) => {
      const key = vendor.campusManagedProfileId || vendor.campus || 'assigned-campus'
      const group = groups.get(key) || { id: key, name: vendor.campus || 'Assigned campus', vendors: [] }
      group.vendors.push(vendor)
      groups.set(key, group)
    })
    return [...groups.values()]
  }, [linkedVendorIds, vendors])
  const visibleSpaces = useMemo(() => spaces.filter((space) => (
    isOwnProfile ? isManager(space) : space.owner?.id === profileStudentId
  )), [isOwnProfile, profileStudentId, spaces])

  const submitSpace = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const avatarUpload = avatarFile
        ? await uploadZumbarlFile(avatarFile, { scope: 'knowledge-space-avatar', metadata: { purpose: 'knowledge-space-avatar', spaceType: form.type } })
        : null
      await createKnowledgeSpace({ ...form, avatarUrl: avatarUpload?.url || avatarUpload?.previewUrl || undefined })
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

      {isLoading ? <p className="campus-pages-empty">Loading pages…</p> : (
        <div className="campus-pages-grid">
          {isOwnProfile ? managedProfiles.map((profile) => {
            const type = String(profile.type || 'service').toLowerCase()
            const typeLabel = type === 'hotel' ? 'Hotel' : type === 'service' ? 'Campus service' : type[0].toUpperCase() + type.slice(1)
            const avatarUrl = normalizeZumbarlFileUrl(profile.avatarUrl) || '/assets/knowledge/default-group-avatar.svg'
            const linkedVendors = vendors.filter((vendor) => vendor.campusManagedProfileId === profile.id)
            return <article className={`campus-page-card is-managed-profile${linkedVendors.length ? ' has-vendors' : ''}`} key={profile.id}>
              <div className="campus-page-icon is-managed-profile"><img src={avatarUrl} alt={`${profile.name} avatar`} /></div>
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
          {isOwnProfile ? unlinkedVendorsByCampus.map((group) => <article className="campus-page-card is-managed-profile has-vendors is-vendor-campus" key={group.id}>
            <div className="campus-page-icon is-managed-profile"><FiUsers /></div>
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
              <div className={`campus-page-icon is-${space.type}`}>
                <img src={space.avatarUrl} alt={`${space.name} avatar`} />
              </div>
              <div className="campus-page-card-copy">
                <div className="campus-page-card-meta">
                  <span>{space.type === 'library' ? 'Library' : 'Study group'}</span>
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
              <p>{isOwnProfile ? 'Create a library or study group, or wait for a campus administrator to assign a page or vendor.' : `${profileName || 'This student'} has not published a managed page.`}</p>
              {isOwnProfile ? <button type="button" onClick={() => setIsCreateOpen(true)}>Create a library or group</button> : null}
            </div>
          ) : null}
        </div>
      )}

      {isCreateOpen ? (
        <div className="campus-pages-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreateDialog() }}>
          <form className="campus-pages-dialog" onSubmit={submitSpace}>
            <button type="button" className="campus-pages-dialog-close" onClick={closeCreateDialog} aria-label="Close"><FiX /></button>
            <span className="campus-pages-eyebrow">Create under your account</span>
            <h2>New library or study group</h2>
            <p>Libraries and study groups can be created by you. Campus vendors are created by administrators and assigned to operators.</p>
            <div className="campus-pages-type-switch">
              <button type="button" className={form.type === 'LIBRARY' ? 'is-active' : ''} onClick={() => setForm({ ...form, type: 'LIBRARY' })}><FiArchive /> Library</button>
              <button type="button" className={form.type === 'GROUP' ? 'is-active' : ''} onClick={() => setForm({ ...form, type: 'GROUP' })}><FiUsers /> Study group</button>
            </div>
            <label><span>Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label><span>Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="campus-pages-form-row">
              <label><span>Visibility</span><select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}><option value="CAMPUS">Campus</option><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
              <label><span>Membership</span><select value={form.membershipMode} onChange={(event) => setForm({ ...form, membershipMode: event.target.value })}><option value="REQUEST">Admin approval required</option><option value="INVITE">Invite only</option></select></label>
            </div>
            <KnowledgeAvatarPicker file={avatarFile} fallbackUrl={`/assets/knowledge/default-${form.type.toLowerCase()}-avatar.svg`} onChange={setAvatarFile} onClear={() => setAvatarFile(null)} disabled={isSaving} />
            <button type="submit" className="campus-pages-primary-btn" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create page'}</button>
          </form>
        </div>
      ) : null}

    </section>
  )
}

export default ProfilePagesPanel
