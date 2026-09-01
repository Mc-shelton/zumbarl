import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FiArchive, FiArrowUpRight, FiBook, FiBookOpen, FiBookmark, FiCheck, FiClock, FiDollarSign,
  FiEye, FiFileText, FiLink, FiMessageCircle, FiPlus, FiSearch, FiTrash2, FiUploadCloud, FiUsers, FiX,
} from 'react-icons/fi'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import KnowledgeResourceCheckoutModal from './KnowledgeResourceCheckoutModal'
import KnowledgeAvatarPicker from './KnowledgeAvatarPicker'
import GeneratedResourceThumbnailPicker from './GeneratedResourceThumbnailPicker'
import AttachmentPreviewModal from './AttachmentPreviewModal'
import { generateResourceThumbnail } from '../lib/generateResourceThumbnail'
import {
  accessKnowledgeResource, createKnowledgeResource, createKnowledgeSpace, readKnowledgeHub,
  purchaseKnowledgeResource, readKnowledgeResourceCheckout,
  recordKnowledgeResourceDwell, recordKnowledgeResourceOpen,
  searchKnowledgeUnits,
  setKnowledgeSpaceFollowing, setKnowledgeSpaceMembership,
} from '../services/learnService'
import './learn-knowledge.css'

const TYPE_LABELS = {
  past_paper: 'Past paper', book: 'Book', notes: 'Notes', study_guide: 'Study guide', article: 'Article',
}
const ACCESS_LABELS = {
  free_read: 'Read free', borrow: 'Borrow', buy: 'Buy', members_only: 'Members only',
}
const EMPTY_RESOURCE = {
  title: '', description: '', resourceType: 'PAST_PAPER', accessMode: 'FREE_READ',
  courseCode: '', academicYear: '', price: '', fileUrl: '', previewText: '',
  availableCopies: '', spaceId: '', currency: 'KES',
}
const EMPTY_SPACE = { type: 'LIBRARY', name: '', description: '', visibility: 'CAMPUS', membershipMode: 'REQUEST', avatarUrl: '' }
const DEFAULT_MEMBER_AVATAR = '/assets/knowledge/default-member-avatar.svg'
const memberAvatar = (value) => normalizeZumbarlFileUrl(value) || DEFAULT_MEMBER_AVATAR
const useAvatarFallback = (event) => {
  event.currentTarget.onerror = null
  event.currentTarget.src = DEFAULT_MEMBER_AVATAR
}

function ResourceIcon({ type }) {
  if (type === 'past_paper') return <FiFileText aria-hidden="true" />
  if (type === 'book') return <FiBook aria-hidden="true" />
  if (type === 'notes') return <FiArchive aria-hidden="true" />
  return <FiBookOpen aria-hidden="true" />
}

const KNOWLEDGE_TABS = new Set(['resources', 'libraries', 'groups'])
const canManageResource = (resource) => resource.space?.membership?.status === 'active'
  && ['owner', 'admin'].includes(resource.space.membership.role)
const hasApprovedResourceAccess = (resource) => {
  const access = resource.accessMode === 'buy' ? resource.viewerActions.purchase : resource.viewerActions.borrow
  return ['active', 'completed'].includes(access?.status)
}
const canOpenResource = (resource) => resource.ownedByViewer || canManageResource(resource) || hasApprovedResourceAccess(resource)

function LearnKnowledgeHub({ initialTab = 'resources', onDataChange }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ resources: [], libraries: [], groups: [], summary: {} })
  const [tab, setTab] = useState(KNOWLEDGE_TABS.has(initialTab) ? initialTab : 'resources')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE)
  const [resourceSource, setResourceSource] = useState('FILES')
  const [resourceFiles, setResourceFiles] = useState([])
  const [resourceCoverFile, setResourceCoverFile] = useState(null)
  const [resourceGeneratedCoverFile, setResourceGeneratedCoverFile] = useState(null)
  const [thumbnailGenerationStatus, setThumbnailGenerationStatus] = useState('idle')
  const thumbnailGenerationRef = useRef(0)
  const [unitQuery, setUnitQuery] = useState('')
  const [unitOptions, setUnitOptions] = useState([])
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [createNewUnit, setCreateNewUnit] = useState(false)
  const [unitSearching, setUnitSearching] = useState(false)
  const [spaceForm, setSpaceForm] = useState(EMPTY_SPACE)
  const [spaceAvatarFile, setSpaceAvatarFile] = useState(null)
  const [purchaseCheckout, setPurchaseCheckout] = useState(null)
  const [purchaseError, setPurchaseError] = useState('')
  const [attachmentPreview, setAttachmentPreview] = useState(null)

  useEffect(() => {
    // This keeps a route-selected Knowledge Hub view synchronized with its tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (KNOWLEDGE_TABS.has(initialTab)) setTab(initialTab)
  }, [initialTab])

  const applyData = useCallback((payload) => {
    setData(payload)
    onDataChange?.(payload)
  }, [onDataChange])

  const load = (filters = {}) => {
    setLoading(true)
    setError('')
    return readKnowledgeHub(filters).then(applyData).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }
  useEffect(() => {
    let active = true
    readKnowledgeHub()
      .then((payload) => { if (active) applyData(payload) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applyData])

  const publishableSpaces = useMemo(() => data.libraries.filter((space) => space.membership?.status === 'active'), [data.libraries])
  const selectedDestination = publishableSpaces.find((space) => space.id === resourceForm.spaceId) || null
  const submitSearch = (event) => { event.preventDefault(); load({ q: query, type }) }
  const showResourceDetails = (resource) => {
    recordKnowledgeResourceOpen(resource.id)
    const next = new URLSearchParams(searchParams)
    next.set('view', 'knowledge')
    next.set('resource', resource.id)
    setSearchParams(next, { replace: false })
  }
  const closeDialog = () => {
    if (searchParams.has('resource')) {
      const next = new URLSearchParams(searchParams)
      next.delete('resource')
      setSearchParams(next, { replace: true })
    }
    setSpaceAvatarFile(null)
    setDialog(null)
  }
  const mutate = async (id, action, successMessage) => {
    setWorkingId(id); setError(''); setNotice('')
    try { await action(); setNotice(successMessage); await load({ q: query, type }); return true }
    catch (requestError) { setError(requestError.message); return false }
    finally { setWorkingId('') }
  }

  const openResource = async (resource) => {
    if (canOpenResource(resource) || resource.accessMode === 'free_read' || resource.accessMode === 'members_only') {
      const isAllowed = canOpenResource(resource) || resource.accessMode === 'free_read' || resource.space?.membership?.status === 'active' || resource.space?.membership?.role === 'owner'
      if (!isAllowed) { setError(`Join ${resource.space?.name || 'this space'} to read this resource.`); return }
      const opened = await mutate(resource.id, () => accessKnowledgeResource(resource.id, 'READ'), 'Added to your reading history.')
      if (opened) setDialog({ type: 'reader', resource })
      return
    }
    if (resource.accessMode === 'borrow') {
      await mutate(resource.id, () => accessKnowledgeResource(resource.id, 'BORROW'), 'Borrow request sent to the library owner.')
      return
    }
    setWorkingId(resource.id); setError(''); setPurchaseError('')
    try { setPurchaseCheckout(await readKnowledgeResourceCheckout(resource.id)) }
    catch (requestError) { setError(requestError.message || 'Checkout could not be opened.') }
    finally { setWorkingId('') }
  }

  const confirmResourcePurchase = async () => {
    if (!purchaseCheckout || workingId === 'purchase') return
    setWorkingId('purchase'); setPurchaseError('')
    try {
      const purchased = await purchaseKnowledgeResource(purchaseCheckout.resource.id)
      setData((current) => ({ ...current, resources: current.resources.map((resource) => resource.id === purchased.id ? purchased : resource) }))
      setPurchaseCheckout(null)
      setNotice('Payment complete. The resource is now available in your account.')
      setDialog({ type: 'reader', resource: purchased })
    } catch (requestError) {
      setPurchaseError(requestError.message || 'Payment could not be completed.')
    } finally {
      setWorkingId('')
    }
  }

  const submitResource = async (event) => {
    event.preventDefault()
    if (!selectedUnit && !createNewUnit) {
      setError('Choose an existing unit, or create the typed unit as new.')
      return
    }
    if (resourceSource === 'FILES' && !resourceFiles.length) {
      setError('Choose at least one file to publish this resource.')
      return
    }
    if (resourceSource === 'LINK' && !resourceForm.fileUrl.trim()) {
      setError('Add the link to this resource.')
      return
    }
    const created = await mutate('create-resource', async () => {
      const fileUrls = resourceSource === 'FILES'
        ? await Promise.all(resourceFiles.map(async (file) => {
          const upload = await uploadZumbarlFile(file, { scope: 'learn-resource', metadata: { purpose: 'knowledge-resource', title: resourceForm.title } })
          return upload.url || upload.previewUrl
        }))
        : []
      const effectiveCoverFile = resourceCoverFile || resourceGeneratedCoverFile
      const coverUpload = effectiveCoverFile
        ? await uploadZumbarlFile(effectiveCoverFile, { scope: 'learn-resource-cover', metadata: { purpose: resourceCoverFile ? 'knowledge-resource-cover' : 'knowledge-resource-generated-cover', title: resourceForm.title } })
        : null
      const accessMode = !selectedDestination ? 'FREE_READ' : selectedDestination.type === 'group' ? 'MEMBERS_ONLY' : resourceForm.accessMode
      const payload = {
        ...resourceForm,
        accessMode,
        academicYear: resourceForm.academicYear ? Number(resourceForm.academicYear) : undefined,
        price: resourceForm.price ? Number(resourceForm.price) : undefined,
        availableCopies: resourceForm.availableCopies === '' ? undefined : Number(resourceForm.availableCopies),
        spaceId: resourceForm.spaceId || undefined,
        unitId: selectedUnit?.id || undefined,
        unitName: createNewUnit ? unitQuery.trim() : undefined,
        createUnit: createNewUnit,
        sourceMode: resourceSource,
        fileUrl: resourceSource === 'LINK' ? resourceForm.fileUrl.trim() : undefined,
        fileUrls,
        coverImageUrl: coverUpload?.url || coverUpload?.previewUrl || undefined,
      }
      return createKnowledgeResource(payload)
    }, 'Your resource is now available in Learn & Grow.')
    if (created) { setResourceForm(EMPTY_RESOURCE); setResourceFiles([]); setResourceCoverFile(null); setResourceGeneratedCoverFile(null); setThumbnailGenerationStatus('idle'); setUnitQuery(''); setUnitOptions([]); setSelectedUnit(null); setCreateNewUnit(false); setResourceSource('FILES'); setDialog(null) }
  }

  const selectResourceFiles = async (incoming) => {
    const files = Array.from(incoming || []).slice(0, 12)
    setResourceFiles(files)
    setResourceGeneratedCoverFile(null)
    const generationId = ++thumbnailGenerationRef.current
    const candidate = files.find((file) => file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    if (!candidate) { setThumbnailGenerationStatus(files.length ? 'default' : 'idle'); return }
    setThumbnailGenerationStatus('loading')
    const generated = await generateResourceThumbnail(candidate)
    if (generationId !== thumbnailGenerationRef.current) return
    setResourceGeneratedCoverFile(generated)
    setThumbnailGenerationStatus(generated ? 'generated' : 'default')
  }

  const selectResourceOwner = (spaceId) => {
    const destination = publishableSpaces.find((space) => space.id === spaceId)
    setResourceForm({
      ...resourceForm,
      spaceId,
      accessMode: !destination ? 'FREE_READ' : destination.type === 'group' ? 'MEMBERS_ONLY' : resourceForm.accessMode,
    })
  }

  const updateResourceUnitQuery = (value) => {
    setUnitQuery(value)
    setSelectedUnit(null)
    setCreateNewUnit(false)
    setUnitOptions([])
    setUnitSearching(false)
  }

  useEffect(() => {
    const queryValue = unitQuery.trim()
    if (dialog?.type !== 'resource-form' || queryValue.length < 2 || selectedUnit || createNewUnit) {
      return undefined
    }
    let active = true
    const timer = window.setTimeout(() => {
      setUnitSearching(true)
      searchKnowledgeUnits(queryValue)
        .then((options) => { if (active) setUnitOptions(options) })
        .catch((requestError) => { if (active) setError(requestError.message || 'Units could not be searched.') })
        .finally(() => { if (active) setUnitSearching(false) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [createNewUnit, dialog?.type, selectedUnit, unitQuery])

  const routedResource = data.resources.find((resource) => resource.id === searchParams.get('resource')) || null
  const visibleDialog = dialog || (routedResource ? { type: 'reader', resource: routedResource } : null)

  useEffect(() => {
    if (visibleDialog?.type !== 'reader' || !visibleDialog.resource?.id) return undefined
    const resourceId = visibleDialog.resource.id
    const startedAt = Date.now()
    return () => recordKnowledgeResourceDwell(resourceId, (Date.now() - startedAt) / 1000)
  }, [visibleDialog?.resource?.id, visibleDialog?.type])

  const submitSpace = async (event) => {
    event.preventDefault()
    const created = await mutate('create-space', async () => {
      const avatarUpload = spaceAvatarFile
        ? await uploadZumbarlFile(spaceAvatarFile, {
            scope: 'knowledge-space-avatar',
            metadata: { purpose: 'knowledge-space-avatar', spaceType: spaceForm.type },
          })
        : null
      return createKnowledgeSpace({
        ...spaceForm,
        avatarUrl: avatarUpload?.url || avatarUpload?.previewUrl || undefined,
      })
    }, `${spaceForm.type === 'LIBRARY' ? 'Library' : 'Study group'} created.`)
    if (created) { setSpaceForm(EMPTY_SPACE); setSpaceAvatarFile(null); setDialog(null) }
  }

  return (
    <div className="knowledge-hub">
      <section className="knowledge-hero">
        <div>
          <span className="learn-eyebrow">Knowledge hub</span>
          <h1>Study resources from your campus</h1>
          <p>Find past papers, books, notes and study guides shared by students, libraries and learning groups.</p>
          <div className="knowledge-hero-actions">
            <button type="button" className="learn-primary-btn" onClick={() => setDialog({ type: 'resource-form' })}><FiPlus /> Post a resource</button>
            <button type="button" className="learn-secondary-btn" onClick={() => setDialog({ type: 'space-form' })}><FiArchive /> Create a library or group</button>
          </div>
        </div>
        <div className="knowledge-summary" aria-label="Knowledge hub totals">
          <span title="Resources"><FiBookOpen aria-hidden="true" /><strong>{data.summary.resources || 0}</strong><small className="sr-only">Resources</small></span>
          <span title="Libraries"><FiArchive aria-hidden="true" /><strong>{data.summary.libraries || 0}</strong><small className="sr-only">Libraries</small></span>
          <span title="Study groups"><FiUsers aria-hidden="true" /><strong>{data.summary.groups || 0}</strong><small className="sr-only">Study groups</small></span>
          <span title="Borrowed"><FiClock aria-hidden="true" /><strong>{data.summary.borrowed || 0}</strong><small className="sr-only">Borrowed resources</small></span>
        </div>
      </section>

      <nav className="knowledge-tabs zumbarl-segmented-tabs" aria-label="Knowledge hub sections">
        <button className={tab === 'resources' ? 'is-active' : ''} onClick={() => setTab('resources')}><FiBookOpen /> Resources</button>
        <button className={tab === 'libraries' ? 'is-active' : ''} onClick={() => setTab('libraries')}><FiArchive /> Libraries</button>
        <button className={tab === 'groups' ? 'is-active' : ''} onClick={() => setTab('groups')}><FiUsers /> Study groups</button>
      </nav>
      {error && <div className="knowledge-feedback is-error" role="alert">{error}</div>}
      {notice && <div className="knowledge-feedback" role="status"><FiCheck /> {notice}</div>}

      {tab === 'resources' && (
        <>
          <form className="knowledge-search" onSubmit={submitSearch}>
            <FiSearch aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, subject or course code" aria-label="Search learning resources" />
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Resource type">
              <option value="all">All resources</option><option value="past_paper">Past papers</option><option value="book">Books</option><option value="notes">Notes</option><option value="study_guide">Study guides</option>
            </select>
            <button type="submit">Search</button>
          </form>
          <div className="knowledge-section-heading"><div><h2>Campus learning shelf</h2><p>Open access, borrowing and student-priced material in one place.</p></div><span>{data.resources.length} results</span></div>
          <div className="knowledge-resource-grid">
            {loading ? <div className="knowledge-empty">Loading the campus shelf…</div> : data.resources.map((resource) => (
              <article className="knowledge-resource-card" key={resource.id}>
                <div className="knowledge-resource-cover" style={resource.coverImageUrl ? { backgroundImage: `url(${normalizeZumbarlFileUrl(resource.coverImageUrl)})` } : undefined}>
                  <button type="button" className="knowledge-resource-page-link" aria-label={`View ${resource.title}`} onClick={() => showResourceDetails(resource)} />
                  {!resource.coverImageUrl && <ResourceIcon type={resource.type} />}
                  <span>{TYPE_LABELS[resource.type]}</span>
                  <button type="button" title={resource.viewerActions.save ? 'Remove saved resource' : 'Save resource'} onClick={() => mutate(resource.id, () => accessKnowledgeResource(resource.id, 'SAVE'), resource.viewerActions.save ? 'Removed from saved resources.' : 'Saved for later.')}>
                    <FiBookmark className={resource.viewerActions.save ? 'is-saved' : ''} />
                  </button>
                </div>
                <div className="knowledge-resource-body">
                  <div className="knowledge-resource-meta"><span>{resource.courseCode || resource.subject || 'General learning'}</span><strong>{canOpenResource(resource) ? 'Available now' : ACCESS_LABELS[resource.accessMode]}</strong></div>
                  <button type="button" className="knowledge-resource-title-button" onClick={() => showResourceDetails(resource)}><h3>{resource.title}</h3></button><p>{resource.description}</p>
                  {resource.space ? <Link className="knowledge-owner knowledge-owner-link" to={`/campus/learn/spaces/${encodeURIComponent(resource.space.slug || resource.space.id)}`}><img src={normalizeZumbarlFileUrl(resource.space.avatarUrl) || memberAvatar(resource.owner.avatarUrl)} alt="" onError={useAvatarFallback} /><span><strong>{resource.space.name}</strong><small>{resource.space.type} · {resource.owner.name}</small></span></Link> : <Link className="knowledge-owner knowledge-owner-link" to={`/campus/profiles/${resource.owner.id}`}><img src={memberAvatar(resource.owner.avatarUrl)} alt="" onError={useAvatarFallback} /><span><strong>{resource.owner.name}</strong><small>{resource.owner.campus}</small></span></Link>}
                  <div className="knowledge-resource-actions">
                    <button type="button" disabled={workingId === resource.id || (!canOpenResource(resource) && resource.viewerActions.borrow?.status === 'pending')} onClick={() => openResource(resource)}>
                      {canOpenResource(resource) ? <FiEye /> : resource.accessMode === 'buy' ? <FiDollarSign /> : resource.accessMode === 'borrow' ? <FiClock /> : <FiEye />}
                      {canOpenResource(resource) ? 'Open resource' : resource.viewerActions.borrow?.status === 'pending' ? 'Borrow requested' : resource.accessMode === 'buy' ? `${resource.currency} ${resource.price?.toLocaleString()}` : ACCESS_LABELS[resource.accessMode]}
                    </button>
                    <button type="button" onClick={() => showResourceDetails(resource)}>Details</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {(tab === 'libraries' || tab === 'groups') && (
        <div className="knowledge-spaces-grid">
          {(tab === 'libraries' ? data.libraries : data.groups).map((space) => (
            <article className="knowledge-space-card" key={space.id}>
              <Link className="knowledge-space-cover" to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`} style={space.coverImageUrl ? { backgroundImage: `linear-gradient(110deg, rgba(14,19,35,.82), rgba(14,19,35,.34)), url(${normalizeZumbarlFileUrl(space.coverImageUrl)})` } : undefined}>
                <img src={normalizeZumbarlFileUrl(space.avatarUrl)} alt={`${space.name} avatar`} /><span>{space.type}</span>
              </Link>
              <div className="knowledge-space-card-body">
                <header><Link className="knowledge-space-title-link" to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`}><h3>{space.name}</h3></Link><p>{space.description}</p></header>
                <div className="knowledge-space-stats">
                  <span title="Resources"><FiBookOpen aria-hidden="true" /><strong>{space.resourceCount}</strong><small>Resources</small></span>
                  <span title="Members"><FiUsers aria-hidden="true" /><strong>{space.memberCount}</strong><small>Members</small></span>
                  {space.type === 'library' && <span title="Rooms"><FiMessageCircle aria-hidden="true" /><strong>{space.roomCount}</strong><small>Rooms</small></span>}
                </div>
                {space.owner.id ? <Link className="knowledge-owner knowledge-owner-link" to={`/campus/profiles/${space.owner.id}`}><img src={memberAvatar(space.owner.avatarUrl)} alt="" onError={useAvatarFallback} /><span><small>Managed by</small><strong>{space.owner.name}</strong><small>{space.owner.campus}</small></span></Link> : <div className="knowledge-owner"><img src={DEFAULT_MEMBER_AVATAR} alt="" /><span><strong>{space.owner.name}</strong><small>Awaiting a new community manager</small></span></div>}
                <div className="knowledge-space-actions">
                  <button type="button" className={space.membership?.status === 'active' ? 'is-leave' : ''} disabled={space.membershipMode === 'invite' && !space.membership && Boolean(space.owner.id)} onClick={() => mutate(space.id, () => setKnowledgeSpaceMembership(space.id, !space.membership), space.membership?.status === 'active' ? 'You left the space.' : space.membership?.status === 'pending' ? 'Membership request cancelled.' : space.owner.id ? 'Membership request sent for admin approval.' : 'You became this space’s manager.')}> 
                    {space.membership?.status === 'pending' ? 'Cancel request' : space.membership?.status === 'active' ? 'Leave' : space.membershipMode === 'invite' && space.owner.id ? 'Invite only' : space.owner.id ? 'Request to join' : 'Become manager'}
                  </button>
                  <button type="button" onClick={() => mutate(space.id, () => setKnowledgeSpaceFollowing(space.id, !space.followed), space.followed ? 'Updates unfollowed.' : 'You’ll receive updates from this space.')}> 
                    {space.followed ? 'Following' : 'Follow'}
                  </button>
                  <Link className="knowledge-space-open" to={`/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`} aria-label={`View ${space.name}`} title="View page"><FiArrowUpRight aria-hidden="true" /></Link>
                </div>
              </div>
            </article>
          ))}
          {!loading && !(tab === 'libraries' ? data.libraries : data.groups).length && <div className="knowledge-empty">No spaces yet. Create the first student-owned {tab === 'libraries' ? 'library' : 'study group'}.</div>}
        </div>
      )}

      <KnowledgeResourceCheckoutModal checkout={purchaseCheckout} error={purchaseError} working={workingId === 'purchase'} onClose={() => { setPurchaseCheckout(null); setPurchaseError('') }} onConfirm={confirmResourcePurchase} />
      {visibleDialog && <div className="knowledge-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}>
        <section className="knowledge-dialog" role="dialog" aria-modal="true">
          <button type="button" className="knowledge-dialog-close" onClick={closeDialog} aria-label="Close"><FiX /></button>
          {error && <div className="knowledge-feedback is-error knowledge-dialog-feedback" role="alert">{error}</div>}
          {visibleDialog.type === 'reader' && <>
            <span className="learn-eyebrow">{TYPE_LABELS[visibleDialog.resource.type]}</span><h2>{visibleDialog.resource.title}</h2>
            <p>{visibleDialog.resource.description}</p><div className="knowledge-reader">{visibleDialog.resource.previewText || 'The owner has not added a text preview. Use the attached source to open the complete resource.'}</div>
            <div className="knowledge-reader-files">
              {visibleDialog.resource.fileUrl && <button type="button" className="learn-primary-btn" onClick={() => setAttachmentPreview({ url: visibleDialog.resource.fileUrl, name: visibleDialog.resource.title, resourceId: visibleDialog.resource.id })}>Preview resource link <FiLink /></button>}
              {(visibleDialog.resource.fileUrls || []).map((url, index) => <button type="button" key={url} className="learn-primary-btn" onClick={() => setAttachmentPreview({ url, name: `${visibleDialog.resource.title} · File ${index + 1}`, resourceId: visibleDialog.resource.id })}>Preview file {index + 1} <FiFileText /></button>)}
            </div>
          </>}
          {visibleDialog.type === 'resource-form' && <form onSubmit={submitResource} className="knowledge-form">
            <span className="learn-eyebrow">Share knowledge</span><h2>Post a learning resource</h2><p>Publish it from your profile or contribute it to a library. Study-group resources are marked directly from group chat.</p>
            <label><span>Title</span><input required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} /></label>
            <div className="knowledge-form-row"><label><span>Resource type</span><select value={resourceForm.resourceType} onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })}><option value="PAST_PAPER">Past paper</option><option value="BOOK">Book</option><option value="NOTES">Notes</option><option value="STUDY_GUIDE">Study guide</option><option value="ARTICLE">Article</option></select></label><label><span>Access</span><select value={!selectedDestination ? 'FREE_READ' : selectedDestination.type === 'group' ? 'MEMBERS_ONLY' : resourceForm.accessMode} disabled={!selectedDestination || selectedDestination.type === 'group'} onChange={(e) => setResourceForm({ ...resourceForm, accessMode: e.target.value })}>{!selectedDestination ? <option value="FREE_READ">Public · Read free</option> : selectedDestination.type === 'group' ? <option value="MEMBERS_ONLY">Members only</option> : <><option value="FREE_READ">Read free</option><option value="BORROW">Borrow</option><option value="BUY">Buy</option><option value="MEMBERS_ONLY">Members only</option></>}</select></label></div>
            {publishableSpaces.length ? <label><span>Publish in</span><select value={resourceForm.spaceId} onChange={(e) => selectResourceOwner(e.target.value)}><option value="">My profile · public and free</option>{publishableSpaces.map((space) => <option key={space.id} value={space.id}>{space.name} · library</option>)}</select><small className="knowledge-field-note">Personal resources are always public and free. Library access is set by the publisher.</small></label> : <div className="knowledge-personal-publish-note"><FiCheck /><span><strong>Publishing from your profile</strong><small>This resource will be public and free to read. Join a library to publish there.</small></span></div>}
            <div className="knowledge-unit-picker knowledge-hub-unit-picker">
              <label><span>Unit</span><input value={unitQuery} onChange={(event) => updateResourceUnitQuery(event.target.value)} placeholder="Search unit name or code" autoComplete="off" required /></label>
              {selectedUnit && <div className="knowledge-unit-selection"><FiCheck /><span>Using existing unit <strong>{selectedUnit.name}</strong></span><button type="button" onClick={() => updateResourceUnitQuery('')}><FiX /></button></div>}
              {createNewUnit && <div className="knowledge-unit-selection is-new"><FiPlus /><span>Will create <strong>{unitQuery.trim()}</strong> as a new unit</span><button type="button" onClick={() => updateResourceUnitQuery(unitQuery)}><FiX /></button></div>}
              {!selectedUnit && !createNewUnit && unitQuery.trim().length >= 2 && <div className="knowledge-unit-results">{unitSearching ? <span>Searching units…</span> : <>{unitOptions.map((unit) => <button type="button" key={unit.id} onClick={() => { setSelectedUnit(unit); setUnitQuery(unit.name); setUnitOptions([]) }}><FiBookOpen /><span><strong>{unit.name}</strong><small>Use existing unit</small></span><FiCheck /></button>)}{!unitOptions.some((unit) => unit.name.trim().toLowerCase() === unitQuery.trim().toLowerCase()) && <button type="button" className="is-create" onClick={() => { setCreateNewUnit(true); setUnitOptions([]) }}><FiPlus /><span><strong>Create “{unitQuery.trim()}”</strong><small>No exact unit found — add it as new</small></span><FiCheck /></button>}</>}</div>}
            </div>
            <div className="knowledge-form-row"><label><span>Course code <small>(optional)</small></span><input value={resourceForm.courseCode} onChange={(e) => setResourceForm({ ...resourceForm, courseCode: e.target.value })} placeholder="e.g. BAC 1101" maxLength={40} /></label><label><span>Academic year</span><input type="number" min="1900" max="2100" placeholder="e.g. 2025" value={resourceForm.academicYear} onChange={(e) => setResourceForm({ ...resourceForm, academicYear: e.target.value })} /></label></div>
            <small className="knowledge-field-note knowledge-institution-note">Institution is filled automatically from your campus profile.</small>
            {(resourceForm.accessMode === 'BUY' || resourceForm.accessMode === 'BORROW') && <label><span>{resourceForm.accessMode === 'BUY' ? 'Price (KES)' : 'Available copies'}</span><input required type="number" min="0" value={resourceForm.accessMode === 'BUY' ? resourceForm.price : resourceForm.availableCopies} onChange={(e) => setResourceForm({ ...resourceForm, [resourceForm.accessMode === 'BUY' ? 'price' : 'availableCopies']: e.target.value })} /></label>}
            <label><span>Description</span><textarea value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} /></label>
            <GeneratedResourceThumbnailPicker customFile={resourceCoverFile} generatedFile={resourceGeneratedCoverFile} generationStatus={thumbnailGenerationStatus} onChange={setResourceCoverFile} disabled={workingId === 'create-resource'} />
            <label><span>Preview text</span><textarea value={resourceForm.previewText} onChange={(e) => setResourceForm({ ...resourceForm, previewText: e.target.value })} /></label>
            <fieldset className="knowledge-source-fieldset">
              <legend>Resource source</legend>
              <p>Choose one way to provide the complete material.</p>
              <div className="knowledge-source-switch" role="radiogroup" aria-label="Resource source">
                <button type="button" role="radio" aria-checked={resourceSource === 'FILES'} className={resourceSource === 'FILES' ? 'is-selected' : ''} onClick={() => { setResourceSource('FILES'); setResourceForm({ ...resourceForm, fileUrl: '' }) }}><FiUploadCloud /><span><strong>Upload file(s)</strong><small>PDF, documents, slides or images</small></span></button>
                <button type="button" role="radio" aria-checked={resourceSource === 'LINK'} className={resourceSource === 'LINK' ? 'is-selected' : ''} onClick={() => { setResourceSource('LINK'); selectResourceFiles([]) }}><FiLink /><span><strong>Use a link</strong><small>Website, drive or online reader</small></span></button>
              </div>
              {resourceSource === 'FILES' ? <div className="knowledge-file-picker">
                <label><FiUploadCloud /><span><strong>Choose one or more files</strong><small>Up to 12 files can be attached</small></span><input type="file" multiple required={!resourceFiles.length} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.webp,video/*" onChange={(event) => selectResourceFiles(event.target.files)} /></label>
                {resourceFiles.length > 0 && <ul>{resourceFiles.map((file, index) => <li key={`${file.name}-${file.lastModified}`}><FiFileText /><span><strong>{file.name}</strong><small>{Math.max(1, Math.round(file.size / 1024))} KB</small></span><button type="button" onClick={() => selectResourceFiles(resourceFiles.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><FiTrash2 /></button></li>)}</ul>}
              </div> : <label className="knowledge-link-field"><span>Resource link</span><div><FiLink /><input required type="url" placeholder="https://…" value={resourceForm.fileUrl} onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })} /></div></label>}
            </fieldset>
            <button className="learn-primary-btn" disabled={workingId === 'create-resource'}>Publish resource</button>
          </form>}
          {visibleDialog.type === 'space-form' && <form onSubmit={submitSpace} className="knowledge-form">
            <span className="learn-eyebrow">Student-owned spaces</span><h2>Create a library or study group</h2><p>Libraries organise and circulate resources. Study groups bring people together around a subject.</p>
            <div className="knowledge-form-row"><button type="button" className={spaceForm.type === 'LIBRARY' ? 'is-selected' : ''} onClick={() => setSpaceForm({ ...spaceForm, type: 'LIBRARY' })}><FiArchive /> Library</button><button type="button" className={spaceForm.type === 'GROUP' ? 'is-selected' : ''} onClick={() => setSpaceForm({ ...spaceForm, type: 'GROUP' })}><FiUsers /> Study group</button></div>
            <label><span>Name</span><input required value={spaceForm.name} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} /></label>
            <label><span>Description</span><textarea value={spaceForm.description} onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })} /></label>
            <div className="knowledge-form-row"><label><span>Visibility</span><select value={spaceForm.visibility} onChange={(e) => setSpaceForm({ ...spaceForm, visibility: e.target.value })}><option value="CAMPUS">Campus</option><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label><label><span>Membership</span><select value={spaceForm.membershipMode} onChange={(e) => setSpaceForm({ ...spaceForm, membershipMode: e.target.value })}><option value="REQUEST">Admin approval required</option><option value="INVITE">Invite only</option></select></label></div>
            <KnowledgeAvatarPicker
              file={spaceAvatarFile}
              fallbackUrl={`/assets/knowledge/default-${spaceForm.type.toLowerCase()}-avatar.svg`}
              onChange={setSpaceAvatarFile}
              onClear={() => setSpaceAvatarFile(null)}
              disabled={workingId === 'create-space'}
            />
            <button className="learn-primary-btn" disabled={workingId === 'create-space'}>Create space</button>
          </form>}
        </section>
      </div>}
      <AttachmentPreviewModal attachment={attachmentPreview} onClose={() => setAttachmentPreview(null)} />
    </div>
  )
}

export default LearnKnowledgeHub
