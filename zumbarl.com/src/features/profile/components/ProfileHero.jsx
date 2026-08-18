import { useEffect, useState } from 'react'
import { FiAtSign, FiCamera, FiCheck, FiEdit3, FiMapPin, FiPlus, FiSave, FiSettings, FiUserPlus, FiX } from 'react-icons/fi'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { OPPORTUNITY_INTENT_OPTIONS } from '../../opportunities/constants'
import {
  getPreferredOpportunityIntentId,
  setPreferredOpportunityIntentId,
} from '../../opportunities/services/opportunityIntentPreference'
import { PROFILE_TAGS } from '../constants'

function ProfileHero({ activeTab = '', canRelate = false, isOwnProfile = false, onEditShop, onSaveProfile, onToggleRelationship, profileHeader = null, relationship = {}, relationshipPending = '' }) {
  const fallbackAvatar = '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp'
  const canEditProfile = isOwnProfile && hasAccess(ACCESS_KEYS.profile.editOwn)
  const tags = profileHeader?.tags?.length ? profileHeader.tags : PROFILE_TAGS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [preferredIntentId, setPreferredIntentId] = useState(() => getPreferredOpportunityIntentId())
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (!isEditing) setDraft(null)
  }, [profileHeader, isEditing])

  function beginEditing() {
    const [fallbackFirst = '', ...fallbackLast] = String(profileHeader?.name || '').split(' ')
    setDraft({
      firstName: profileHeader?.firstName || fallbackFirst,
      lastName: profileHeader?.lastName || fallbackLast.join(' '),
      username: String(profileHeader?.handle || '').replace(/^@/, ''),
      location: profileHeader?.location || '',
      careerPath: profileHeader?.careerPath || '',
      bio: profileHeader?.bio || '',
      avatarUrl: profileHeader?.avatar || '',
      skills: [...tags],
      skillInput: '',
    })
    setError('')
    setIsEditing(true)
  }

  async function saveProfile() {
    setIsSaving(true); setError('')
    try { await onSaveProfile({ ...draft, skills: draft.skills }); setIsEditing(false) }
    catch (requestError) { setError(requestError.message || 'Could not update your profile.') }
    finally { setIsSaving(false) }
  }

  async function uploadAvatar(file) {
    if (!file) return
    try {
      const upload = await uploadZumbarlFile(file, { scope: 'profile', metadata: { purpose: 'profile-avatar' } })
      setDraft((current) => ({ ...current, avatarUrl: upload.url || upload.previewUrl }))
    } catch (requestError) { setError(requestError.message || 'Could not upload that image.') }
  }

  function changePreferredIntent(intentId) {
    setPreferredOpportunityIntentId(intentId)
    setPreferredIntentId(intentId)
  }

  return (
    <article className="campus-profile-surface campus-profile-hero">
      <div className="campus-profile-identity">
        <div className="campus-profile-photo-wrap">
          <img
            src={normalizeZumbarlFileUrl(isEditing ? draft?.avatarUrl : profileHeader?.avatar) || fallbackAvatar}
            alt={profileHeader?.name || 'Student profile'}
            onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackAvatar }}
          />
          <span aria-hidden="true" />
        </div>

        <div className="campus-profile-identity-copy">
          <h1>
            {profileHeader?.name || 'Brian Mwangi'}
            <em>{profileHeader?.role || 'Student'}</em>
          </h1>
          <p>{profileHeader?.headline || 'Kenyatta University · Year 3 · Marketing & Design'}</p>
          <div className="campus-profile-identity-meta">
            <span>
              <FiMapPin aria-hidden="true" />
              {profileHeader?.location || 'Nairobi, Kenya'}
            </span>
            <span>
              <FiAtSign aria-hidden="true" />
              {profileHeader?.handle || 'brian_mwangi'}
            </span>
          </div>
          <div className="campus-profile-tag-row" aria-label="Skills">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {canEditProfile ? (
        <div className="campus-profile-hero-actions">
          {activeTab === 'Shop' ? <button type="button" className="campus-profile-ghost-btn" onClick={onEditShop}>Edit Shop</button> : <button type="button" className="campus-profile-ghost-btn" onClick={beginEditing}><FiEdit3 /> Edit Profile</button>}
          <div className="campus-profile-settings-wrap">
            <button
              type="button"
              className="campus-profile-ghost-icon"
              aria-label="Profile settings"
              aria-expanded={isSettingsOpen}
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              <FiSettings aria-hidden="true" />
            </button>
            {isSettingsOpen ? (
              <div className="campus-profile-settings-menu" role="group" aria-label="Opportunity mode">
                <strong>Opportunity mode</strong>
                <p>Choose how jobs and gigs are prioritized for you across Zumbarl.</p>
                {OPPORTUNITY_INTENT_OPTIONS.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    className={preferredIntentId === intent.id ? 'is-active' : ''}
                    aria-pressed={preferredIntentId === intent.id}
                    onClick={() => changePreferredIntent(intent.id)}
                  >
                    <strong>{intent.label}</strong>
                    <span>{intent.summary}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : canRelate ? (
        <div className="campus-profile-hero-actions" aria-label="Profile relationship actions">
          <button type="button" className={`campus-profile-ghost-btn${relationship.isConnected ? ' is-active' : ''}`} disabled={Boolean(relationshipPending)} onClick={() => onToggleRelationship?.('connect', !relationship.isConnected)}>
            {relationship.isConnected ? <FiCheck /> : <FiUserPlus />}
            {relationshipPending === 'connect' ? 'Saving…' : relationship.isConnected ? 'Connected' : 'Connect'}
          </button>
          <button type="button" className={`campus-profile-ghost-btn${relationship.isFollowing ? ' is-active' : ''}`} disabled={Boolean(relationshipPending)} onClick={() => onToggleRelationship?.('follow', !relationship.isFollowing)}>
            {relationship.isFollowing ? <FiCheck /> : <FiPlus />}
            {relationshipPending === 'follow' ? 'Saving…' : relationship.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      ) : null}
      {isEditing && draft ? <div className="campus-profile-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsEditing(false) }}>
        <section className="campus-profile-editor-modal" role="dialog" aria-modal="true" aria-label="Edit profile">
          <header><div><span>Profile settings</span><h2>Make your profile feel like you</h2><p>Keep your identity, story and strongest skills up to date.</p></div><button type="button" disabled={isSaving} onClick={() => setIsEditing(false)} aria-label="Close profile editor"><FiX /></button></header>
          <div className="campus-profile-editor-body">
            <aside><div className="campus-profile-editor-avatar"><img src={normalizeZumbarlFileUrl(draft.avatarUrl) || fallbackAvatar} alt="Profile preview" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackAvatar }} /><label><FiCamera /> Change photo<input type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} /></label></div><strong>{draft.firstName} {draft.lastName}</strong><span>@{draft.username || 'username'}</span><p>{draft.bio || 'Add a short introduction so people know what you care about.'}</p></aside>
            <div className="campus-profile-editor-fields">
              <section><h3>Identity</h3><div className="campus-profile-edit-grid"><label>First name<input value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} /></label><label>Last name<input value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} /></label><label>Location<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><label>Username<div className="campus-profile-username-field"><span>@</span><input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase() })} /></div></label></div></section>
              <section><h3>About you</h3><label>Career path or headline<input value={draft.careerPath} onChange={(event) => setDraft({ ...draft, careerPath: event.target.value })} placeholder="Marketing & Design" /></label><label>Bio<textarea rows="3" value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} placeholder="What are you building, learning or looking for?" /></label></section>
              <section><h3>Skills</h3><div className="campus-profile-skill-input"><input value={draft.skillInput} onChange={(event) => setDraft({ ...draft, skillInput: event.target.value })} placeholder="Type a skill" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const skill = draft.skillInput.trim(); if (skill && !draft.skills.includes(skill)) setDraft({ ...draft, skills: [...draft.skills, skill], skillInput: '' }) } }} /><button type="button" onClick={() => { const skill = draft.skillInput.trim(); if (skill && !draft.skills.includes(skill)) setDraft({ ...draft, skills: [...draft.skills, skill], skillInput: '' }) }}><FiPlus /> Add</button></div><div className="campus-profile-editor-skills">{draft.skills.map((tag) => <button type="button" key={tag} onClick={() => setDraft({ ...draft, skills: draft.skills.filter((item) => item !== tag) })}>{tag}<FiX /></button>)}</div></section>
              {error ? <p className="campus-profile-edit-error">{error}</p> : null}
            </div>
          </div>
          <footer><button type="button" disabled={isSaving} onClick={() => setIsEditing(false)}>Cancel</button><button type="button" className="is-primary" disabled={isSaving} onClick={saveProfile}><FiSave /> {isSaving ? 'Saving changes…' : 'Save profile'}</button></footer>
        </section>
      </div> : null}
    </article>
  )
}

export default ProfileHero
