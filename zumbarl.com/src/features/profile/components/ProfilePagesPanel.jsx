import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArchive, FiBookOpen, FiGlobe, FiLock, FiPlus, FiUsers, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import KnowledgeAvatarPicker from '../../learn/components/KnowledgeAvatarPicker'
import { createKnowledgeSpace, readKnowledgeHub } from '../../learn/services/learnService'

const EMPTY_SPACE = {
  type: 'LIBRARY',
  name: '',
  description: '',
  visibility: 'CAMPUS',
  membershipMode: 'REQUEST',
  avatarUrl: '',
}

function isManager(space) {
  return space.membership?.role === 'owner' || space.membership?.role === 'admin'
}

function ProfilePagesPanel({ isOwnProfile = false, onOpenKnowledgeHub, profileName = '', profileStudentId = '' }) {
  const [data, setData] = useState({ libraries: [], groups: [], resources: [] })
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
  }

  const loadPages = useCallback(() => {
    setIsLoading(true)
    setError('')
    return readKnowledgeHub()
      .then((payload) => setData(payload || { libraries: [], groups: [], resources: [] }))
      .catch((requestError) => setError(requestError.message || 'Pages could not be loaded.'))
      .finally(() => setIsLoading(false))
  }, [])

  // Loading the account-owned pages is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPages() }, [loadPages])

  const spaces = useMemo(() => [...(data.libraries || []), ...(data.groups || [])], [data.groups, data.libraries])
  const visibleSpaces = useMemo(() => spaces.filter((space) => (
    isOwnProfile ? isManager(space) : space.owner?.id === profileStudentId
  )), [isOwnProfile, profileStudentId, spaces])

  const submitSpace = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const avatarUpload = avatarFile
        ? await uploadZumbarlFile(avatarFile, {
            scope: 'knowledge-space-avatar',
            metadata: { purpose: 'knowledge-space-avatar', spaceType: form.type },
          })
        : null
      await createKnowledgeSpace({
        ...form,
        avatarUrl: avatarUpload?.url || avatarUpload?.previewUrl || undefined,
      })
      setForm(EMPTY_SPACE)
      setAvatarFile(null)
      setIsCreateOpen(false)
      setNotice(`${form.type === 'LIBRARY' ? 'Library' : 'Study group'} created.`)
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
          <p>{isOwnProfile ? 'Manage the libraries and study groups you publish through Learn & Grow.' : `Libraries and study groups managed by ${profileName || 'this student'}.`}</p>
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
          {!visibleSpaces.length ? (
            <div className="campus-pages-empty">
              <FiArchive />
              <h3>{isOwnProfile ? 'Create your first page' : 'No published pages yet'}</h3>
              <p>{isOwnProfile ? 'A library can lend resources; a study group can gather members and followers around a subject.' : `${profileName || 'This student'} has not published a library or study group.`}</p>
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
            <p>This page uses your current Zumbarl account—there is no separate login.</p>
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
            <KnowledgeAvatarPicker
              file={avatarFile}
              fallbackUrl={`/assets/knowledge/default-${form.type.toLowerCase()}-avatar.svg`}
              onChange={setAvatarFile}
              onClear={() => setAvatarFile(null)}
              disabled={isSaving}
            />
            <button type="submit" className="campus-pages-primary-btn" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create page'}</button>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default ProfilePagesPanel
