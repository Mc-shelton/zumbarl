import { useState } from 'react'
import { FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCheck, FiChevronDown, FiCompass, FiCpu, FiEye, FiFeather, FiGlobe, FiMessageCircle, FiShield, FiTrendingUp, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

const SUGGESTED_INTERESTS = [
  { label: 'Career opportunities', Icon: FiBriefcase },
  { label: 'Entrepreneurship', Icon: FiTrendingUp },
  { label: 'Technology', Icon: FiCpu },
  { label: 'Creative work', Icon: FiFeather },
  { label: 'Campus events', Icon: FiCalendar },
  { label: 'Learning groups', Icon: FiBookOpen },
]

const VISIBILITY_HELP = {
  public: 'Your Connect activity can be discovered by the wider Zumbarl community.',
  campus: 'Only people connected to your campus can discover your activity.',
  connections: 'Only people you have connected with can see your activity.',
  private: 'Your Connect activity stays visible only to you.',
}

const STORY_SCOPE_HELP = {
  all: 'Discover campus moments from across the Zumbarl network.',
  campus: 'Keep your story feed focused on your own campus.',
  connections: 'See stories from the people you have connected with.',
}

function profileDraft(profile) {
  return {
    interests: profile?.interests || [],
    visibility: profile?.visibility || 'campus',
    storyFeedScope: profile?.storyFeedScope || 'all',
    showZumbarlPoints: profile?.showZumbarlPoints !== false,
    safetyPreferences: {
      allowMessages: profile?.safetyPreferences?.allowMessages !== false,
      showActivity: profile?.safetyPreferences?.showActivity !== false,
    },
  }
}

function ConnectProfileModal({ isOpen, onClose, onSave, profile }) {
  const dialogRef = useDialog({ isOpen, onClose })
  const [draft, setDraft] = useState(() => profileDraft(profile))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null
  const suggestedLabels = new Set(SUGGESTED_INTERESTS.map(({ label }) => label))
  const interestOptions = [
    ...SUGGESTED_INTERESTS,
    ...draft.interests.filter((interest) => !suggestedLabels.has(interest)).map((label) => ({ label, Icon: FiCompass, saved: true })),
  ]
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
      <form ref={dialogRef} className="connect-profile-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="connect-profile-title" aria-describedby="connect-profile-description">
        <header>
          <div className="connect-profile-icon"><img src="/assets/index/bee_nobg.png" alt="" /></div>
          <div><span>Zumbarl Connect</span><h2 id="connect-profile-title">Make Connect feel like yours</h2><p id="connect-profile-description">Shape what you discover, what others see, and how your campus community reaches you.</p></div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close"><FiX /></button>
        </header>

        <div className="connect-profile-body">
          <section className="connect-profile-card connect-profile-interest-card">
            <div className="connect-profile-section-head">
              <span><FiCompass aria-hidden="true" /></span>
              <div><h3>Your interests</h3><p>Pick at least one—we’ll use these signals to tune your feed and recommendations.</p></div>
              <small>{draft.interests.length} selected</small>
            </div>
            <div className="connect-profile-interests">{interestOptions.map(({ label, Icon, saved }) => {
              const selected = draft.interests.includes(label)
              return <button type="button" key={label} className={`${selected ? 'is-selected' : ''}${saved ? ' is-saved' : ''}`} aria-pressed={selected} onClick={() => toggleInterest(label)}><span><Icon aria-hidden="true" /></span>{label}{selected ? <FiCheck className="connect-profile-interest-check" aria-hidden="true" /> : null}</button>
            })}</div>
          </section>

          <div className="connect-profile-preference-grid">
            <section className="connect-profile-card connect-profile-choice-card">
              <div className="connect-profile-section-head">
                <span><FiEye aria-hidden="true" /></span>
                <div><h3>Your visibility</h3><p>Choose who can discover your activity.</p></div>
              </div>
              <label className="connect-profile-select" htmlFor="connect-profile-visibility">Connect activity<div><FiGlobe aria-hidden="true" /><select id="connect-profile-visibility" value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value })}><option value="public">Everyone on Zumbarl</option><option value="campus">My campus</option><option value="connections">Connections only</option><option value="private">Only me</option></select><FiChevronDown aria-hidden="true" /></div><small>{VISIBILITY_HELP[draft.visibility]}</small></label>
            </section>

            <section className="connect-profile-card connect-profile-choice-card">
              <div className="connect-profile-section-head">
                <span><FiBookOpen aria-hidden="true" /></span>
                <div><h3>Stories you see</h3><p>Choose how broad your story feed feels.</p></div>
              </div>
              <label className="connect-profile-select" htmlFor="connect-profile-story-scope">Story feed<div><FiCompass aria-hidden="true" /><select id="connect-profile-story-scope" value={draft.storyFeedScope} onChange={(event) => setDraft({ ...draft, storyFeedScope: event.target.value })}><option value="all">All campuses</option><option value="campus">My campus only</option><option value="connections">My connects only</option></select><FiChevronDown aria-hidden="true" /></div><small>{STORY_SCOPE_HELP[draft.storyFeedScope]}</small></label>
            </section>
          </div>

          <section className="connect-profile-card connect-profile-safety-card">
            <div className="connect-profile-section-head">
              <span><FiShield aria-hidden="true" /></span>
              <div><h3>Identity & safety</h3><p>Set the boundaries that make Connect comfortable for you.</p></div>
              <small>In your control</small>
            </div>
            <div className="connect-profile-toggles">
              <label className="connect-profile-toggle"><span className="connect-profile-toggle-icon"><FiAward aria-hidden="true" /></span><span><strong>Show Buzz on my posts</strong><small>Display your Buzz beside your university on posts and reshares.</small></span><input type="checkbox" checked={draft.showZumbarlPoints} onChange={(event) => setDraft({ ...draft, showZumbarlPoints: event.target.checked })} /></label>
              <label className="connect-profile-toggle"><span className="connect-profile-toggle-icon"><FiMessageCircle aria-hidden="true" /></span><span><strong>Allow direct messages</strong><small>Students on your campus can start a conversation.</small></span><input type="checkbox" checked={draft.safetyPreferences.allowMessages} onChange={(event) => setDraft({ ...draft, safetyPreferences: { ...draft.safetyPreferences, allowMessages: event.target.checked } })} /></label>
              <label className="connect-profile-toggle"><span className="connect-profile-toggle-icon"><FiEye aria-hidden="true" /></span><span><strong>Show my activity</strong><small>Let others see your public posts and group participation.</small></span><input type="checkbox" checked={draft.safetyPreferences.showActivity} onChange={(event) => setDraft({ ...draft, safetyPreferences: { ...draft.safetyPreferences, showActivity: event.target.checked } })} /></label>
            </div>
          </section>
          {error ? <p className="connect-profile-error" role="alert">{error}</p> : null}
        </div>

        <footer><span><strong>{draft.interests.length || 'No'} interest{draft.interests.length === 1 ? '' : 's'} selected</strong><small>You can change these settings any time.</small></span><div><button type="button" onClick={onClose} disabled={isSaving}>Cancel</button><button type="submit" disabled={isSaving}><FiCheck aria-hidden="true" />{isSaving ? 'Saving…' : profile?.id ? 'Save changes' : 'Complete setup'}</button></div></footer>
      </form>
    </div>
  )
}

export default ConnectProfileModal
