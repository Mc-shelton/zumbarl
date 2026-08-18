import { useEffect, useState } from 'react'
import { FiCheck, FiShield, FiUser, FiX } from 'react-icons/fi'

const SUGGESTED_INTERESTS = ['Career opportunities', 'Entrepreneurship', 'Technology', 'Creative work', 'Campus events', 'Learning groups']

function ConnectProfileModal({ isOpen, onClose, onSave, profile }) {
  const [draft, setDraft] = useState({ interests: [], visibility: 'campus', storyFeedScope: 'all', safetyPreferences: { allowMessages: true, showActivity: true } })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDraft({
      interests: profile?.interests || [],
      visibility: profile?.visibility || 'campus',
      storyFeedScope: profile?.storyFeedScope || 'all',
      safetyPreferences: {
        allowMessages: profile?.safetyPreferences?.allowMessages !== false,
        showActivity: profile?.safetyPreferences?.showActivity !== false,
      },
    })
    setError('')
  }, [isOpen, profile])

  if (!isOpen) return null
  const toggleInterest = (interest) => setDraft((current) => ({
    ...current,
    interests: current.interests.includes(interest)
      ? current.interests.filter((item) => item !== interest)
      : [...current.interests, interest],
  }))

  async function submit(event) {
    event.preventDefault()
    if (!draft.interests.length) { setError('Choose at least one interest.'); return }
    setIsSaving(true); setError('')
    try { await onSave(draft); onClose() }
    catch (requestError) { setError(requestError.message || 'Could not save your Connect profile.') }
    finally { setIsSaving(false) }
  }

  return (
    <div className="connect-profile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
      <form className="connect-profile-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="connect-profile-title">
        <header>
          <div className="connect-profile-icon"><FiUser aria-hidden="true" /></div>
          <div><span>Zumbarl Connect</span><h2 id="connect-profile-title">Set up your Connect profile</h2><p>Control what shapes your campus feed and how people can interact with you.</p></div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close"><FiX /></button>
        </header>
        <section>
          <h3>Your interests</h3><p>Select at least one. We’ll use these to improve your feed and recommendations.</p>
          <div className="connect-profile-interests">{SUGGESTED_INTERESTS.map((interest) => <button type="button" key={interest} className={draft.interests.includes(interest) ? 'is-selected' : ''} onClick={() => toggleInterest(interest)}>{draft.interests.includes(interest) ? <FiCheck /> : null}{interest}</button>)}</div>
        </section>
        <section>
          <h3>Visibility</h3>
          <label className="connect-profile-select">Who can see your Connect activity?<select value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value })}><option value="public">Everyone</option><option value="campus">My campus</option><option value="connections">Connections only</option><option value="private">Only me</option></select></label>
        </section>
        <section>
          <h3>Stories you see</h3>
          <p>Choose how broad your story feed should be. New profiles start with stories from every campus.</p>
          <label className="connect-profile-select">Story feed<select value={draft.storyFeedScope} onChange={(event) => setDraft({ ...draft, storyFeedScope: event.target.value })}><option value="all">All campuses</option><option value="campus">My campus only</option><option value="connections">My connects only</option></select></label>
        </section>
        <section>
          <h3><FiShield /> Safety preferences</h3>
          <label className="connect-profile-toggle"><span><strong>Allow direct messages</strong><small>Students on your campus can start a conversation.</small></span><input type="checkbox" checked={draft.safetyPreferences.allowMessages} onChange={(event) => setDraft({ ...draft, safetyPreferences: { ...draft.safetyPreferences, allowMessages: event.target.checked } })} /></label>
          <label className="connect-profile-toggle"><span><strong>Show my activity</strong><small>Let others see your public posts and group participation.</small></span><input type="checkbox" checked={draft.safetyPreferences.showActivity} onChange={(event) => setDraft({ ...draft, safetyPreferences: { ...draft.safetyPreferences, showActivity: event.target.checked } })} /></label>
        </section>
        {error ? <p className="connect-profile-error" role="alert">{error}</p> : null}
        <footer><button type="button" onClick={onClose} disabled={isSaving}>Cancel</button><button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : profile ? 'Save changes' : 'Complete setup'}</button></footer>
      </form>
    </div>
  )
}

export default ConnectProfileModal
