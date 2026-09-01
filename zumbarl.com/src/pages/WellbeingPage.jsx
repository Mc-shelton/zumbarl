import { useEffect, useMemo, useRef, useState } from 'react'
import { FiActivity, FiArrowRight, FiCalendar, FiCheck, FiChevronRight, FiClock, FiCompass, FiEdit3, FiHeart, FiLink, FiLock, FiMessageCircle, FiSend, FiShield, FiSun, FiUser, FiUsers, FiX, FiZap } from 'react-icons/fi'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { CAMPUS_VIEWER } from '../features/campus/constants'
import { useViewerProfile } from '../features/auth/viewerProfile'
import { joinCommunityGroup, listCommunityGroups } from '../features/community/services/communityService'
import { getSupportCircleSplash } from '../features/community/supportCircleVisuals'
import { completeWellbeingReset, createDailyCheckIn, createTalkItOutConversation, readTalkItOutConversation, readWellbeingDashboard, requestCounselorSession, sendTalkItOutMessage, submitWellbeingCheckIn, updateWellbeingPreferences } from '../features/community/services/wellbeingService'
import '../styles/campus.css'
import '../styles/wellbeing.css'

const MOODS = [
  { id: 'good', emoji: '🙂', label: 'Good' }, { id: 'okay', emoji: '😌', label: 'Steady' },
  { id: 'meh', emoji: '😐', label: 'Flat' }, { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'overwhelmed', emoji: '😣', label: 'Overwhelmed' },
]
const MOOD_GUIDANCE = {
  good: { title: 'Hold onto what helped', detail: 'Add a private note about what felt good, if you want to remember it.', action: 'context', actionLabel: 'Add what helped' },
  okay: { title: 'Steady is enough', detail: 'You can simply save this moment. Nothing else is required.', action: 'save', actionLabel: 'Save privately' },
  meh: { title: 'You do not have to force it', detail: 'Putting a little of it into words may make the day feel less stuck.', action: 'talk', actionLabel: 'Talk it out privately' },
  low: { title: 'You do not have to carry this alone', detail: 'A trained campus support person can respond without this becoming a public post.', action: 'human-check-in', actionLabel: 'Ask for human support' },
  overwhelmed: { title: 'Make only the next two minutes smaller', detail: 'Start with breathing and grounding. You can stop whenever you want.', action: 'reset', actionLabel: 'Start a short reset' },
}
const STRESSORS = [['school', 'School'], ['money', 'Money'], ['relationships', 'Relationships'], ['family', 'Family'], ['work', 'Work'], ['loneliness', 'Loneliness'], ['anxiety', 'Anxiety'], ['sleep', 'Sleep']]
const SLEEP_OPTIONS = [['under_4', 'Under 4h'], ['4_6', '4–6h'], ['6_8', '6–8h'], ['over_8', '8h+']]
const CHECK_IN_TOPICS = [
  { id: 'counseling', label: 'I need someone to talk to' }, { id: 'anonymous-support', label: 'I want to share privately' },
  { id: 'program-request', label: 'I’m looking for ongoing support' }, { id: 'safety-report', label: 'I’m worried about someone’s safety' },
]
const GROUNDING_PROMPTS = ['5 things I can see', '4 things I can feel', '3 things I can hear', '2 things I can smell', '1 thing I can taste']

function createAlias() {
  const first = ['Calm', 'Brave', 'Kind', 'Hopeful', 'Quiet', 'Steady']
  const second = ['Acacia', 'Bee', 'River', 'Star', 'Sunbird', 'Baobab']
  const seed = Date.now()
  return `${first[seed % first.length]} ${second[Math.floor(seed / 11) % second.length]} ${String(seed).slice(-2)}`
}

function localDateTimeMinimum() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatStressor(value) { return STRESSORS.find(([id]) => id === value)?.[1] || value?.replaceAll('_', ' ') }

function WellbeingPage() {
  const viewer = useViewerProfile(CAMPUS_VIEWER)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dashboard, setDashboard] = useState(null)
  const [circles, setCircles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [activeModal, setActiveModal] = useState('')
  const [working, setWorking] = useState(false)
  const [selectedCircle, setSelectedCircle] = useState(null)
  const [alias, setAlias] = useState(createAlias)
  const [daily, setDaily] = useState({ mood: '', stressors: [], sleep: '', note: '' })
  const [checkIn, setCheckIn] = useState({ category: 'anonymous-support', anonymous: true, urgency: 'normal', message: '' })
  const [booking, setBooking] = useState({ scheduledAt: localDateTimeMinimum(), reason: '' })
  const [conversation, setConversation] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [resetStep, setResetStep] = useState(0)
  const [resetSeconds, setResetSeconds] = useState(30)
  const [resetRunning, setResetRunning] = useState(false)
  const [grounded, setGrounded] = useState([])
  const [brainDump, setBrainDump] = useState('')
  const [resetFocus, setResetFocus] = useState('')
  const resetStartedAt = useRef(null)
  const chatEndRef = useRef(null)
  const checkInDetailsRef = useRef(null)

  async function loadDashboard() {
    const response = await readWellbeingDashboard()
    setDashboard(response)
    return response
  }

  useEffect(() => {
    let active = true
    Promise.all([readWellbeingDashboard(), listCommunityGroups()]).then(([wellbeing, community]) => {
      if (!active) return
      setDashboard(wellbeing)
      setCircles((community?.data || []).filter((group) => group.category === 'support-circle'))
    }).catch((requestError) => { if (active) setError(requestError.message || 'Wellbeing could not be loaded.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const open = searchParams.get('open')
    if (open === 'booking') setActiveModal('booking')
    if (open === 'check-in') setActiveModal('human-check-in')
  }, [searchParams])

  useEffect(() => {
    if (!resetRunning || resetSeconds <= 0) return undefined
    const timer = window.setTimeout(() => setResetSeconds((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resetRunning, resetSeconds])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversation?.messages, working])

  const joinedCount = useMemo(() => circles.filter((circle) => circle.viewerMembership).length, [circles])
  const moodGuidance = daily.mood ? MOOD_GUIDANCE[daily.mood] : null

  function closeModal() {
    if (working) return
    setActiveModal('')
    setSelectedCircle(null)
    setBrainDump('')
    setSearchParams({}, { replace: true })
  }

  function openReset() {
    resetStartedAt.current = Date.now()
    setResetStep(0); setResetSeconds(30); setResetRunning(false); setGrounded([]); setBrainDump(''); setResetFocus('')
    setActiveModal('reset')
  }

  async function saveDailyCheckIn(event) {
    event.preventDefault()
    if (!daily.mood) return
    setWorking(true); setError('')
    try {
      const response = await createDailyCheckIn({ mood: daily.mood, stressors: daily.stressors, sleep: daily.sleep || undefined, note: daily.note.trim() || undefined, source: 'daily' })
      setDashboard((current) => ({ ...current, todayCheckIn: response.checkIn, recentCheckIns: [response.checkIn, ...(current?.recentCheckIns || [])].slice(0, 14), pattern: response.pattern }))
      setDaily({ mood: '', stressors: [], sleep: '', note: '' })
      setNotice({ title: 'Check-in saved privately.', detail: 'Only you can see your daily wellbeing history and patterns.' })
    } catch (requestError) { setError(requestError.message || 'Your daily check-in could not be saved.') }
    finally { setWorking(false) }
  }

  async function toggleInsights() {
    const enabled = !dashboard?.preference?.insightsEnabled
    try {
      const preference = await updateWellbeingPreferences({ insightsEnabled: enabled })
      setDashboard((current) => ({ ...current, preference, pattern: enabled ? current?.pattern : null }))
      if (enabled) await loadDashboard()
    } catch (requestError) { setError(requestError.message || 'Your preference could not be updated.') }
  }

  async function openTalkItOut() {
    setActiveModal('talk'); setWorking(true); setError('')
    try {
      const existing = dashboard?.conversations?.[0]
      setConversation(existing ? await readTalkItOutConversation(existing.id) : await createTalkItOutConversation())
    } catch (requestError) { setError(requestError.message || 'Talk It Out could not be opened.') }
    finally { setWorking(false) }
  }

  async function sendChatMessage(event) {
    event.preventDefault()
    const message = chatInput.trim()
    if (!message || !conversation?.id) return
    setChatInput('')
    setConversation((current) => ({ ...current, messages: [...(current.messages || []), { id: `local-${Date.now()}`, role: 'user', body: message }] }))
    setWorking(true)
    try {
      const response = await sendTalkItOutMessage(conversation.id, message)
      setConversation((current) => ({ ...current, riskLevel: response.riskLevel, messages: [...(current.messages || []), response.assistant] }))
      loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'Your message could not be sent.') }
    finally { setWorking(false) }
  }

  async function finishReset() {
    setWorking(true)
    try {
      await completeWellbeingReset({ breathingSeconds: 30 - resetSeconds, groundingCount: grounded.length, focus: resetFocus.trim() || undefined, durationSeconds: Math.round((Date.now() - resetStartedAt.current) / 1000) })
      setBrainDump('')
      setNotice({ title: 'You made a little room.', detail: resetFocus ? `For now, your one next step is: ${resetFocus}` : 'You do not need to solve everything at once.' })
      setActiveModal(''); loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'The reset could not be completed.') }
    finally { setWorking(false) }
  }

  async function sendHumanCheckIn(event) {
    event.preventDefault(); setWorking(true); setError('')
    try {
      const result = await submitWellbeingCheckIn(checkIn)
      setNotice({ title: checkIn.anonymous ? 'Your anonymous support request was received.' : 'Your support request was sent.', detail: checkIn.anonymous ? `Keep reference ${result.id}. Your student profile was not attached.` : 'The campus support team can follow up through your Zumbarl account.' })
      setCheckIn({ category: 'anonymous-support', anonymous: true, urgency: 'normal', message: '' }); setActiveModal(''); loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'Your request could not be sent.') }
    finally { setWorking(false) }
  }

  async function bookCounselor(event) {
    event.preventDefault(); setWorking(true)
    try {
      await requestCounselorSession({ scheduledAt: new Date(booking.scheduledAt).toISOString(), reason: booking.reason.trim() || undefined })
      setNotice({ title: 'Your session request is in.', detail: 'The wellbeing team will confirm the counselor and time through Zumbarl.' })
      setBooking({ scheduledAt: localDateTimeMinimum(), reason: '' }); setActiveModal(''); loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'The session could not be requested.') }
    finally { setWorking(false) }
  }

  async function joinCircle() {
    if (!selectedCircle) return
    setWorking(true)
    try {
      const membership = await joinCommunityGroup(selectedCircle.id, { participationMode: 'alias', alias })
      setCircles((current) => current.map((circle) => circle.id === selectedCircle.id ? { ...circle, viewerMembership: membership, memberCount: Number(circle.memberCount || 0) + 1 } : circle))
      setNotice({ title: `You joined ${selectedCircle.name}.`, detail: `Other members will know you as ${alias}.` }); setActiveModal('')
      navigate(`/campus/wellbeing/circles/${selectedCircle.id}`)
    } catch (requestError) { setError(requestError.message || 'The support circle could not be joined.') }
    finally { setWorking(false) }
  }

  function handleAction(action) {
    if (action.kind === 'reset') openReset()
    else if (action.kind === 'talk') openTalkItOut()
    else if (action.kind === 'check-in') document.getElementById('daily-check-in')?.scrollIntoView({ behavior: 'smooth' })
    else if (action.kind === 'human-help') setActiveModal('booking')
  }

  function handleMoodGuidance() {
    if (!moodGuidance) return
    if (moodGuidance.action === 'context') {
      if (checkInDetailsRef.current) checkInDetailsRef.current.open = true
      checkInDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else if (moodGuidance.action === 'save') {
      document.getElementById('daily-check-in')?.requestSubmit()
    } else if (moodGuidance.action === 'talk') {
      openTalkItOut()
    } else if (moodGuidance.action === 'human-check-in') {
      setActiveModal('human-check-in')
    } else if (moodGuidance.action === 'reset') {
      openReset()
    }
  }

  function skipDailyCheckIn() {
    setDaily({ mood: '', stressors: [], sleep: '', note: '' })
    document.getElementById('support-circles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const todayMood = MOODS.find((mood) => mood.id === dashboard?.todayCheckIn?.mood)

  return <main className="campus-page wellbeing-page">
    <Seo title="Wellbeing | Zumbarl Campus" description="Private daily check-ins, immediate reset tools, peer support and campus mental health help." path="/campus/wellbeing" />
    <div className="campus-stage"><div className="campus-shell wellbeing-shell">
      <CampusSidebar activeItemId="wellbeing" />
      <section className="campus-main wellbeing-main">
        <header className="wellbeing-topbar"><div><span>Private to you</span><h1>Wellbeing</h1></div><CampusTopActions className="wellbeing-top-actions" primaryAction={<button type="button" className="wellbeing-private-action" onClick={() => setActiveModal('booking')}><FiUser /> Human support</button>} showUserButton={false} /></header>

        <section className="wellbeing-hero"><div className="wellbeing-hero-copy"><span><FiHeart /> A steadier place to land</span><h2>How are you, really?</h2><p>Check in with yourself, make the next few minutes lighter, or reach someone who can help. No diagnosis. No public activity. You choose what happens next.</p><div className="wellbeing-hero-actions"><button type="button" className="is-overwhelmed" onClick={openReset}><FiZap /> I’m overwhelmed</button><button type="button" onClick={openTalkItOut}><FiMessageCircle /> Talk it out</button></div></div><div className="wellbeing-hero-pulse"><span><FiShield /></span><strong>Yours, not the feed’s.</strong><p>Your check-ins are not posted, scored, or shown to other students.</p></div></section>
        <section className="wellbeing-mobile-help" aria-label="Wellbeing support options"><button type="button" onClick={() => setActiveModal('human-check-in')}><FiUser /><span><strong>Talk to a person</strong><small>Private campus support</small></span><FiChevronRight /></button><Link to="/help"><FiShield /><span><strong>Urgent safety help</strong><small>Available without a check-in</small></span><FiChevronRight /></Link></section>
        {notice ? <section className="wellbeing-notice"><FiCheck /><div><strong>{notice.title}</strong><span>{notice.detail}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><FiX /></button></section> : null}
        {error ? <p className="wellbeing-error">{error}</p> : null}

        <section className="wellbeing-today-grid">
          <form className="wellbeing-daily" id="daily-check-in" onSubmit={saveDailyCheckIn}><header><div><span>Today · 30 seconds</span><h2>{dashboard?.todayCheckIn ? 'You checked in today' : 'Meet yourself where you are'}</h2></div><FiSun /></header>
            {dashboard?.todayCheckIn ? <div className="wellbeing-checked-in"><span>{todayMood?.emoji || '✓'}</span><div><strong>{todayMood?.label || 'Checked in'}</strong><p>{dashboard.todayCheckIn.stressors?.length ? `What was present: ${dashboard.todayCheckIn.stressors.map(formatStressor).join(', ')}` : 'Nothing else was required.'}</p></div><button type="button" onClick={() => setDashboard((current) => ({ ...current, todayCheckIn: null }))}>Add another</button></div> : <>
              <fieldset className="wellbeing-moods"><legend>How does today feel?</legend>{MOODS.map((mood) => <label key={mood.id} className={daily.mood === mood.id ? 'is-selected' : ''}><input type="radio" name="mood" value={mood.id} checked={daily.mood === mood.id} onChange={(event) => setDaily((current) => ({ ...current, mood: event.target.value }))} /><b aria-hidden="true">{mood.emoji}</b><span>{mood.label}</span></label>)}</fieldset>
              {moodGuidance ? <aside className={`wellbeing-mood-guidance is-${daily.mood}`} aria-live="polite"><span>{daily.mood === 'overwhelmed' ? <FiZap /> : daily.mood === 'low' ? <FiUser /> : daily.mood === 'meh' ? <FiMessageCircle /> : <FiHeart />}</span><div><strong>{moodGuidance.title}</strong><p>{moodGuidance.detail}</p></div><button type="button" onClick={handleMoodGuidance}>{moodGuidance.actionLabel}<FiArrowRight /></button></aside> : null}
              <details ref={checkInDetailsRef} className="wellbeing-checkin-details"><summary>Add context <small>Optional</small></summary><label><span>What is weighing on you?</span><div className="wellbeing-stressors">{STRESSORS.map(([id, label]) => <button key={id} type="button" className={daily.stressors.includes(id) ? 'is-selected' : ''} onClick={() => setDaily((current) => ({ ...current, stressors: current.stressors.includes(id) ? current.stressors.filter((item) => item !== id) : [...current.stressors, id] }))}>{label}</button>)}</div></label><label><span>How much did you sleep?</span><div className="wellbeing-sleep">{SLEEP_OPTIONS.map(([id, label]) => <button key={id} type="button" className={daily.sleep === id ? 'is-selected' : ''} onClick={() => setDaily((current) => ({ ...current, sleep: current.sleep === id ? '' : id }))}>{label}</button>)}</div></label><label><span>A private note <small>Optional</small></span><textarea value={daily.note} onChange={(event) => setDaily((current) => ({ ...current, note: event.target.value }))} placeholder="A few words for your future self…" /></label></details>
              <footer><div><small><FiLock /> Visible only to you</small><button type="button" className="wellbeing-skip-checkin" onClick={skipDailyCheckIn}>Skip for now</button></div><button type="submit" disabled={!daily.mood || working}>{working ? 'Saving…' : 'Save check-in'} <FiArrowRight /></button></footer>
            </>}
            <details className="wellbeing-inline-privacy"><summary><FiLock /> How your privacy works</summary><ul><li>Check-ins attach to your account so only you can revisit your history; they never appear in the campus feed.</li><li>Talk It Out conversations are stored in your private account so you can continue them.</li><li>Brain-dump text in a reset stays in this browser and is cleared when you close it.</li><li>When you choose anonymous human support, the request is stored without your student ID.</li></ul></details>
          </form>

          <section className="wellbeing-pattern-card"><header><span><FiActivity /></span><div><small>Your pattern</small><h2>A gentle look back</h2></div><label><input type="checkbox" checked={dashboard?.preference?.insightsEnabled ?? true} onChange={toggleInsights} /><i /></label></header>
            {dashboard?.preference?.insightsEnabled === false ? <div className="wellbeing-pattern-off"><FiLock /><p>Pattern insights are off. Your check-ins stay available to you.</p></div> : dashboard?.pattern ? <><p>{dashboard.pattern.message}</p><div className="wellbeing-pattern-stats"><span><strong>{dashboard.pattern.checkInDays}</strong> days checked in</span><span><strong>{dashboard.pattern.direction}</strong> this week</span></div>{dashboard.pattern.dominantStressors?.length ? <div className="wellbeing-pattern-tags">{dashboard.pattern.dominantStressors.map(({ stressor }) => <span key={stressor}>{formatStressor(stressor)}</span>)}</div> : null}{dashboard.pattern.suggestion?.kind === 'link' ? <Link to={dashboard.pattern.suggestion.href}>{dashboard.pattern.suggestion.label}<FiArrowRight /></Link> : <button type="button" onClick={() => handleAction(dashboard.pattern.suggestion)}>{dashboard.pattern.suggestion.label}<FiArrowRight /></button>}</> : <div className="wellbeing-pattern-off"><FiActivity /><p>A few check-ins will reveal voluntary, private patterns.</p></div>}
          </section>
        </section>

        <section className="wellbeing-circles" id="support-circles"><header><div><span>Low-pressure connection</span><h2>People who may understand</h2><p>Small moderated spaces for shared experiences—not public pages or open feeds.</p></div><em>{joinedCount} joined</em></header>
          {isLoading ? <div className="wellbeing-loading"><span /><span /></div> : circles.length ? <div className="wellbeing-circle-grid">{circles.slice(0, 4).map((circle) => {
            const memberCount = Number(circle.memberCount || 0)
            const circleHref = `/campus/wellbeing/circles/${circle.id}`
            const splashImageUrl = getSupportCircleSplash(circle)
            return <article key={circle.id} className={`${circle.viewerMembership ? 'is-joined ' : ''}${splashImageUrl ? 'has-splash' : ''}`.trim()} role={circle.viewerMembership ? 'link' : undefined} tabIndex={circle.viewerMembership ? 0 : undefined} onClick={circle.viewerMembership ? () => navigate(circleHref) : undefined} onKeyDown={circle.viewerMembership ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(circleHref) } } : undefined}>
              {splashImageUrl ? <div className="wellbeing-circle-splash" aria-hidden="true"><img src={splashImageUrl} alt="" loading="lazy" /><span><FiHeart /></span></div> : null}
              <header><span><FiHeart /></span><div><small>Alias-first circle</small><h3>{circle.name}</h3></div><FiLock aria-label="Members-only space" /></header>
              <p>{circle.purpose}</p>
              <div className="wellbeing-circle-trust"><span><FiShield /><i>Moderated by</i><strong>{circle.moderationOwner || 'Campus wellbeing team'}</strong></span><span><FiClock /><i>Participation</i><strong>{circle.activityLabel || 'Ongoing · reply when ready'}</strong></span></div>
              <div className="wellbeing-circle-meta"><span><FiUsers /> {memberCount ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : 'New circle'}</span><span>{circle.campus || viewer.campus}</span></div>
              <footer><span><FiLock /> Your alias is shown to members</span>{circle.viewerMembership ? <Link to={circleHref} onClick={(event) => event.stopPropagation()}>Open circle <FiArrowRight /></Link> : <button type="button" onClick={() => { setSelectedCircle(circle); setAlias(createAlias()); setActiveModal('circle') }}>Join with alias</button>}</footer>
            </article>
          })}</div> : <div className="wellbeing-empty"><FiHeart /><h3>No campus circles are open yet.</h3><p>You can still talk privately with the wellbeing team.</p></div>}
        </section>
        <section className="wellbeing-urgent" id="human-help"><FiShield /><div><strong>Are you or someone else in immediate danger?</strong><p>Zumbarl is not an emergency service. Move toward a trusted person, campus security or the nearest emergency department while you get urgent help.</p></div><Link to="/help">Open safety help <FiArrowRight /></Link></section>
      </section>

      <aside className="campus-rail wellbeing-rail"><section className="wellbeing-rail-card is-human"><span>Human help</span><h2>A real person when you need one.</h2><button type="button" onClick={() => setActiveModal('booking')}><FiCalendar /> Request a counselor</button><button type="button" onClick={() => setActiveModal('human-check-in')}><FiMessageCircle /> Private support request</button></section>
        {dashboard?.resources?.length ? <section className="wellbeing-rail-card"><span>Available to you</span><div className="wellbeing-resources">{dashboard.resources.map((resource) => <Link key={resource.id} to={resource.href}><i>{resource.resourceType === 'counseling' ? <FiUser /> : <FiLink />}</i><span><strong>{resource.name}</strong><small>{resource.availability || resource.contactLabel}</small></span><FiChevronRight /></Link>)}</div></section> : null}
        <section className="wellbeing-rail-card is-boundary"><FiShield /><div><span>Clear boundary</span><h2>Support, not diagnosis.</h2><p>Talk It Out cannot diagnose, prescribe, or replace a qualified professional or emergency service.</p></div></section>
      </aside>
    </div></div>

    {activeModal ? <div className="wellbeing-modal-backdrop" role="presentation" onMouseDown={closeModal}>
      {activeModal === 'talk' ? <section className="wellbeing-modal wellbeing-talk-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><span>Private support companion</span><h2>Talk It Out</h2><p>Supportive reflection—not therapy, diagnosis, or emergency care.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-chat-boundary"><FiShield /><span>Stored privately in your account. You control whether to continue.</span></div><div className="wellbeing-chat-log">
        {!conversation?.messages?.length && !working ? <div className="wellbeing-chat-welcome"><span><FiMessageCircle /></span><h3>You can start anywhere.</h3><p>What feels heaviest right now? You don’t need the right words.</p><div><button type="button" onClick={() => setChatInput('I feel overwhelmed and I do not know where to start.')}>I feel overwhelmed</button><button type="button" onClick={() => setChatInput('School is becoming too much.')}>School is too much</button><button type="button" onClick={() => setChatInput('I just need someone to listen.')}>Just listen</button></div></div> : null}
        {(conversation?.messages || []).map((message) => <article key={message.id} className={`wellbeing-message is-${message.role}`}><small>{message.role === 'assistant' ? 'Zumbarl' : 'You'}</small><p>{message.body}</p>{Array.isArray(message.actions) && message.actions.length ? <div>{message.actions.map((action) => action.kind === 'link' ? <Link key={action.id} to={action.href}>{action.label}</Link> : <button key={action.id} type="button" onClick={() => handleAction(action)}>{action.label}</button>)}</div> : null}</article>)}
        {working && conversation ? <article className="wellbeing-message is-assistant is-thinking"><span /><span /><span /></article> : null}<div ref={chatEndRef} /></div><form className="wellbeing-chat-compose" onSubmit={sendChatMessage}><textarea aria-label="Message Talk It Out" value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Say what’s on your mind…" /><button type="submit" disabled={!chatInput.trim() || working}><FiSend /></button></form><footer><small><FiShield /> If you may be in immediate danger, use human or emergency support instead.</small><button type="button" onClick={() => setActiveModal('booking')}>Get human help</button></footer></section> : null}

      {activeModal === 'reset' ? <section className="wellbeing-modal wellbeing-reset-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><span>2–5 minute reset · {resetStep + 1} of 4</span><h2>{['First, breathe', 'Come back to the room', 'Put it down for a moment', 'Choose only one thing'][resetStep]}</h2><p>{['Nothing needs solving for the next few breaths.', 'Use your senses to interrupt the rush.', 'This writing stays on this device and clears when you close.', 'Small and possible beats perfect.'][resetStep]}</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-reset-progress"><i style={{ width: `${(resetStep + 1) * 25}%` }} /></div>
        {resetStep === 0 ? <div className="wellbeing-breathe"><span className={resetRunning && resetSeconds > 0 ? 'is-breathing' : ''}><FiActivity /></span><strong>{resetSeconds}</strong><p>{resetSeconds === 0 ? 'You did it. Let the next breath be natural.' : resetRunning ? 'Slow in. Longer out.' : 'Start when you are ready.'}</p><button type="button" onClick={() => setResetRunning(true)} disabled={resetRunning}>{resetRunning ? 'Breathing…' : 'Start 30 seconds'}</button></div> : null}
        {resetStep === 1 ? <div className="wellbeing-grounding">{GROUNDING_PROMPTS.map((prompt, index) => <label key={prompt} className={grounded.includes(index) ? 'is-done' : ''}><input type="checkbox" checked={grounded.includes(index)} onChange={() => setGrounded((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} /><span>{prompt}</span><FiCheck /></label>)}</div> : null}
        {resetStep === 2 ? <div className="wellbeing-brain-dump"><FiEdit3 /><textarea autoFocus value={brainDump} onChange={(event) => setBrainDump(event.target.value)} placeholder="Everything circling in my head right now…" /><span><FiLock /> Not uploaded. Not saved. Cleared when you close.</span></div> : null}
        {resetStep === 3 ? <div className="wellbeing-one-step"><FiCompass /><label><span>What is one kind, manageable next step?</span><input autoFocus value={resetFocus} onChange={(event) => setResetFocus(event.target.value)} placeholder="For example: drink water, email my lecturer, call a friend…" /></label><p>You are choosing what comes next—not committing to fix everything.</p></div> : null}
        <footer><small>You can stop at any point.</small><button type="button" onClick={() => resetStep < 3 ? setResetStep((step) => step + 1) : finishReset()} disabled={working}>{resetStep < 3 ? 'Continue' : working ? 'Saving…' : 'Finish reset'} <FiArrowRight /></button></footer></section> : null}

      {activeModal === 'human-check-in' ? <form className="wellbeing-modal" onSubmit={sendHumanCheckIn} onMouseDown={(event) => event.stopPropagation()}><header><div><span>Human support request</span><h2>What would feel helpful right now?</h2><p>Share only what you are comfortable sharing.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-topic-grid">{CHECK_IN_TOPICS.map((topic) => <label key={topic.id} className={checkIn.category === topic.id ? 'is-selected' : ''}><input type="radio" name="topic" value={topic.id} checked={checkIn.category === topic.id} onChange={(event) => setCheckIn((current) => ({ ...current, category: event.target.value }))} /><span>{topic.label}</span></label>)}</div><label className="wellbeing-field"><span>What’s happening?</span><textarea required minLength="5" value={checkIn.message} onChange={(event) => setCheckIn((current) => ({ ...current, message: event.target.value }))} placeholder="Write in your own words…" /></label><div className="wellbeing-form-row"><label className="wellbeing-field"><span>Urgency</span><select value={checkIn.urgency} onChange={(event) => setCheckIn((current) => ({ ...current, urgency: event.target.value }))}><option value="low">I can wait</option><option value="normal">I’d like support soon</option><option value="high">This feels urgent</option></select></label><label className="wellbeing-anonymous-toggle"><input type="checkbox" checked={checkIn.anonymous} onChange={(event) => setCheckIn((current) => ({ ...current, anonymous: event.target.checked }))} /><span><FiLock /><strong>Send without my profile</strong><small>The report is stored without your student ID. Keep the reference shown after sending.</small></span></label></div><footer><small><FiShield /> This is reviewed by people, but it is not an emergency channel.</small><button type="submit" disabled={working}>{working ? 'Sending…' : 'Send request'} <FiArrowRight /></button></footer></form> : null}

      {activeModal === 'booking' ? <form className="wellbeing-modal" onSubmit={bookCounselor} onMouseDown={(event) => event.stopPropagation()}><header><div><span>One-to-one human support</span><h2>Request a counselor session</h2><p>Choose a preferred time. The wellbeing team will confirm availability.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-booking-banner"><FiCalendar /><div><strong>Private campus support</strong><span>Your request never appears on your profile or feed.</span></div></div><label className="wellbeing-field"><span>Preferred date and time</span><input required type="datetime-local" min={localDateTimeMinimum()} value={booking.scheduledAt} onChange={(event) => setBooking((current) => ({ ...current, scheduledAt: event.target.value }))} /></label><label className="wellbeing-field"><span>Anything the counselor should know? <small>Optional</small></span><textarea value={booking.reason} onChange={(event) => setBooking((current) => ({ ...current, reason: event.target.value }))} placeholder="You can keep this brief…" /></label><footer><small><FiClock /> This is a request, not a confirmed appointment.</small><button type="submit" disabled={working}>{working ? 'Requesting…' : 'Request session'} <FiArrowRight /></button></footer></form> : null}

      {activeModal === 'circle' && selectedCircle ? <section className="wellbeing-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><span>Alias participation</span><h2>Join {selectedCircle.name}</h2><p>Members will see your chosen alias instead of your student profile.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-alias"><span>{alias.slice(0, 1)}</span><div><small>You’ll appear as</small><strong>{alias}</strong></div><button type="button" onClick={() => setAlias(createAlias())}>Try another</button></div><div className="wellbeing-disclosure"><FiShield /><p><strong>Private to members, accountable to safety.</strong>Your profile is hidden from circle members. Authorized safety staff can connect the alias to your account only for moderation, safeguarding, or a required escalation.</p></div><footer><small>By joining, you agree to the circle rules and safety boundaries.</small><button type="button" disabled={working} onClick={joinCircle}>{working ? 'Joining…' : 'Join with this alias'} <FiArrowRight /></button></footer></section> : null}
    </div> : null}
  </main>
}

export default WellbeingPage
