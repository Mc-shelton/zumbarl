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
import { completeWellbeingReset, createDailyCheckIn, createTalkItOutConversation, enrollInStudentCareProgram, listStudentCarePrograms, readTalkItOutConversation, readWellbeingDashboard, recordStudentCareCheckIn, requestCounselorSession, requestTalkItOutHandoff, sendTalkItOutMessage, submitWellbeingCheckIn, updateOwnStudentCareEnrollment, updateWellbeingPreferences } from '../features/community/services/wellbeingService'
import '../styles/campus.css'
import '../styles/wellbeing.css'

const MOODS = [
  { id: 'good', label: 'Good' }, { id: 'okay', label: 'Steady' },
  { id: 'meh', label: 'Flat' }, { id: 'low', label: 'Low' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
]
const HERO_FEELINGS = [
  { id: 'overwhelmed', label: 'Overwhelmed', title: 'Let’s make the next few minutes smaller.', detail: 'You can start privately, or find a person who can help you carry what feels heavy.', tabs: ['support', 'today'] },
  { id: 'low', label: 'Low', title: 'You do not have to carry this by yourself.', detail: 'A private support option or a low-pressure space may feel easier than pushing through alone.', tabs: ['support', 'connection'] },
  { id: 'meh', label: 'Flat', title: 'You can start without having the right words.', detail: 'A short private check-in or a gentle connection can help you notice what you need.', tabs: ['today', 'connection'] },
  { id: 'okay', label: 'Steady', title: 'Steady is worth noticing.', detail: 'Capture what is helping today, or spend time with people who may understand.', tabs: ['today', 'connection'] },
  { id: 'good', label: 'Good', title: 'Hold onto what is helping.', detail: 'Record this moment privately or bring that energy into a supportive campus space.', tabs: ['today', 'connection'] },
]
const WELLBEING_TABS = {
  today: { label: 'Today · 30 seconds', shortLabel: 'Today · 30 sec', detail: 'Check in privately', actionLabel: 'Do a private check-in' },
  support: { label: 'Support', shortLabel: 'Care & support', detail: 'Structured and human help', actionLabel: 'See support options' },
  connection: { label: 'Low-pressure connection', shortLabel: 'Connection', detail: 'Find people who understand', actionLabel: 'Find gentle connection' },
}
const CARE_PROGRAM_VISUALS = {
  peer_pressure: { src: '/assets/wellbeing/care-boundaries.webp', tone: 'boundaries' },
  substance_use_recovery: { src: '/assets/wellbeing/care-recovery-navigation.webp', tone: 'recovery' },
  stress_and_mental_wellbeing: { src: '/assets/wellbeing/care-steady-pressure.webp', tone: 'steady' },
}
const CARE_STEP_PROMPTS = {
  peer_pressure: [
    'What would feel safer or more manageable by the end of this plan?',
    'Who or what creates pressure, and who helps you feel grounded?',
    'Which boundary could you practise this week, in your own words?',
    'Would a moderated peer circle help, or would you rather continue privately?',
    'What has changed, and what support would help you keep going?',
  ],
  substance_use_recovery: [
    'What kind of support feels safe enough to begin with?',
    'What situations need a safety or recovery plan around them?',
    'What would you like a qualified provider to help you with?',
    'Would an alias-first peer circle feel useful right now?',
    'What is helping you stay well, and where do you still need support?',
  ],
  stress_and_mental_wellbeing: [
    'What is creating the most pressure right now?',
    'What is one practical change you want in your personal support plan?',
    'Which skill would make this week feel more manageable?',
    'What have you noticed since your last private check-in?',
    'What should the support team know about your next step?',
  ],
}
const STRESSORS = [['school', 'School'], ['money', 'Money'], ['relationships', 'Relationships'], ['family', 'Family'], ['work', 'Work'], ['loneliness', 'Loneliness'], ['anxiety', 'Anxiety'], ['sleep', 'Sleep'], ['health', 'Health'], ['peer_pressure', 'Peer pressure'], ['substance_use', 'Substance use'], ['other', 'Something else']]
const SLEEP_OPTIONS = [['under_4', 'Under 4h'], ['4_6', '4–6h'], ['6_8', '6–8h'], ['over_8', '8h+']]
const CHECK_IN_TOPICS = [
  { id: 'counseling', label: 'I need someone to talk to' }, { id: 'anonymous-support', label: 'I want to share privately' },
  { id: 'program-request', label: 'I’m looking for ongoing support' }, { id: 'safety-report', label: 'I’m worried about someone’s safety' },
]
const GROUNDING_PROMPTS = ['5 things I can see', '4 things I can feel', '3 things I can hear', '2 things I can smell', '1 thing I can taste']
const MOOD_AVATAR_POSITION = { overwhelmed: '0%', low: '25%', meh: '50%', okay: '75%', good: '100%' }

function getMoodAvatarSet(gender) {
  const value = String(gender || '').trim().toLowerCase()
  if (/^(female|woman|lady|girl)$/.test(value)) return 'ladies'
  if (/^(male|man|gent|boy)$/.test(value)) return 'gents'
  return 'neutral'
}

function MoodFace({ mood, avatarSet = 'neutral', className = '' }) {
  return <i className={`wellbeing-mood-face is-${mood} ${className}`.trim()} aria-hidden="true" style={{ '--mood-avatar-image': `url(/assets/wellbeing/mood-avatars-${avatarSet}.webp)`, '--mood-avatar-position': MOOD_AVATAR_POSITION[mood] || '50%' }} />
}

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
  const moodAvatarSet = getMoodAvatarSet(viewer.gender)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dashboard, setDashboard] = useState(null)
  const [circles, setCircles] = useState([])
  const [carePrograms, setCarePrograms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [activeModal, setActiveModal] = useState('')
  const [activeWellbeingTab, setActiveWellbeingTab] = useState('today')
  const [heroFeelingIndex, setHeroFeelingIndex] = useState(null)
  const [working, setWorking] = useState(false)
  const [selectedCircle, setSelectedCircle] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [alias, setAlias] = useState(createAlias)
  const [daily, setDaily] = useState({ mood: '', stressors: [], sleep: '', note: '' })
  const [checkIn, setCheckIn] = useState({ category: 'anonymous-support', anonymous: true, urgency: 'normal', message: '' })
  const [booking, setBooking] = useState({ scheduledAt: localDateTimeMinimum(), reason: '' })
  const [programRequest, setProgramRequest] = useState({ goal: '', privacyMode: 'private', urgency: 'normal', consent: false })
  const [programCheckIn, setProgramCheckIn] = useState({ status: 'steady', note: '', requestFollowUp: false })
  const [careStepNote, setCareStepNote] = useState('')
  const [handoff, setHandoff] = useState({ shareLatestMessage: false, note: '', consent: false })
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

  async function loadDashboard() {
    const response = await readWellbeingDashboard()
    setDashboard(response)
    return response
  }

  useEffect(() => {
    let active = true
    Promise.all([readWellbeingDashboard(), listCommunityGroups(), listStudentCarePrograms()]).then(([wellbeing, community, programs]) => {
      if (!active) return
      setDashboard(wellbeing)
      setCircles((community?.data || []).filter((group) => group.category === 'support-circle'))
      setCarePrograms(programs?.data || [])
    }).catch((requestError) => { if (active) setError(requestError.message || 'Wellbeing could not be loaded.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const open = searchParams.get('open')
      if (open === 'booking') setActiveModal('booking')
      if (open === 'check-in') setActiveModal('human-check-in')
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [searchParams])

  useEffect(() => {
    if (!resetRunning || resetSeconds <= 0) return undefined
    const timer = window.setTimeout(() => setResetSeconds((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resetRunning, resetSeconds])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversation?.messages, working])

  const joinedCount = useMemo(() => circles.filter((circle) => circle.viewerMembership).length, [circles])
  const supportActivity = useMemo(() => [
    ...(dashboard?.supportActivity?.reports || []).map((item) => ({ ...item, kind: 'Support request', date: item.createdAt })),
    ...(dashboard?.supportActivity?.bookings || []).map((item) => ({ ...item, kind: 'Counselor appointment', date: item.scheduledAt })),
  ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 6), [dashboard?.supportActivity])
  const savedHeroFeelingIndex = HERO_FEELINGS.findIndex((feeling) => feeling.id === dashboard?.todayCheckIn?.mood)
  const activeHeroFeelingIndex = heroFeelingIndex ?? (savedHeroFeelingIndex >= 0 ? savedHeroFeelingIndex : 2)

  function closeModal() {
    if (working) return
    setActiveModal('')
    setSelectedCircle(null)
    setSelectedProgram(null)
    setCareStepNote('')
    setBrainDump('')
    setSearchParams({}, { replace: true })
  }

  function openCareDetails(program) {
    const enrollment = program.enrollments?.[0]
    setSelectedProgram(program)
    setCareStepNote(enrollment?.currentStep === 0 ? enrollment.goal || '' : '')
    setActiveModal('care-details')
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

  async function joinCareProgram(event) {
    event.preventDefault()
    if (!selectedProgram || !programRequest.consent) return
    setWorking(true); setError('')
    try {
      const enrollment = await enrollInStudentCareProgram(selectedProgram.id, {
        goal: programRequest.goal,
        privacyMode: programRequest.privacyMode,
        urgency: programRequest.urgency,
        consent: true,
        consentText: 'I agree that Student Affairs or the named wellbeing partner may use this request to coordinate this private care pathway.'
      })
      setCarePrograms((current) => current.map((program) => program.id === selectedProgram.id ? { ...program, enrollments: [enrollment] } : program))
      setNotice({ title: 'Your private care request was sent.', detail: 'Student Affairs can now review it, assign follow-up and keep the plan moving with you.' })
      setProgramRequest({ goal: '', privacyMode: 'private', urgency: 'normal', consent: false }); setActiveModal(''); setSelectedProgram(null)
      loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'The care pathway request could not be sent.') }
    finally { setWorking(false) }
  }

  async function submitProgramCheckIn(event) {
    event.preventDefault()
    const enrollment = selectedProgram?.enrollments?.[0]
    if (!enrollment) return
    setWorking(true); setError('')
    try {
      const response = await recordStudentCareCheckIn(enrollment.id, programCheckIn)
      setCarePrograms((current) => current.map((program) => program.id === selectedProgram.id ? { ...program, enrollments: [response.enrollment] } : program))
      setNotice({ title: programCheckIn.requestFollowUp ? 'Check-in saved and follow-up requested.' : 'Your private progress check-in was saved.', detail: programCheckIn.status === 'setback' ? 'A setback does not erase your progress. Your plan stays available.' : 'This does not affect your public profile, score or opportunities.' })
      setProgramCheckIn({ status: 'steady', note: '', requestFollowUp: false }); setActiveModal(''); setSelectedProgram(null)
    } catch (requestError) { setError(requestError.message || 'Your care check-in could not be saved.') }
    finally { setWorking(false) }
  }

  async function completeCurrentCareStep(event) {
    event.preventDefault()
    const enrollment = selectedProgram?.enrollments?.[0]
    const step = selectedProgram?.steps?.[enrollment?.currentStep || 0]
    if (!enrollment || !step || careStepNote.trim().length < 3) return
    setWorking(true); setError('')
    try {
      const response = await recordStudentCareCheckIn(enrollment.id, { status: 'completed_step', note: careStepNote.trim(), requestFollowUp: false })
      const updatedProgram = { ...selectedProgram, enrollments: [response.enrollment] }
      setCarePrograms((current) => current.map((program) => program.id === selectedProgram.id ? updatedProgram : program))
      setSelectedProgram(updatedProgram)
      setCareStepNote('')
      setNotice({ title: 'Your step was saved privately.', detail: response.enrollment.currentStep >= selectedProgram.steps.length ? 'You reached the end of this plan. Your support team can now review it with you.' : 'Your next step is ready whenever you are.' })
    } catch (requestError) { setError(requestError.message || 'This care step could not be saved.') }
    finally { setWorking(false) }
  }

  async function changeOwnCarePlanStatus(status) {
    const enrollment = selectedProgram?.enrollments?.[0]
    if (!enrollment) return
    if (status === 'withdrawn' && !window.confirm('Withdraw from this care pathway? Your existing private progress will be kept, and Student Affairs must help you restart it.')) return
    setWorking(true); setError('')
    try {
      const updatedEnrollment = await updateOwnStudentCareEnrollment(enrollment.id, { status })
      const updatedProgram = { ...selectedProgram, enrollments: [updatedEnrollment] }
      setCarePrograms((current) => current.map((program) => program.id === selectedProgram.id ? updatedProgram : program))
      if (status === 'withdrawn') {
        setNotice({ title: 'You withdrew from this care pathway.', detail: 'Your private history was kept. Contact Student Affairs if you want to restart later.' })
        setActiveModal(''); setSelectedProgram(null); setCareStepNote('')
      } else {
        setSelectedProgram(updatedProgram)
        setNotice({ title: status === 'paused' ? 'Your care pathway is paused.' : 'Your care pathway is active again.', detail: 'Your previous progress and private notes are unchanged.' })
      }
    } catch (requestError) { setError(requestError.message || 'The care pathway could not be updated.') }
    finally { setWorking(false) }
  }

  async function submitHumanHandoff(event) {
    event.preventDefault()
    if (!conversation?.id || !handoff.consent) return
    setWorking(true); setError('')
    try {
      await requestTalkItOutHandoff(conversation.id, { consent: true, shareLatestMessage: handoff.shareLatestMessage, note: handoff.note.trim() || undefined })
      setNotice({ title: 'A human follow-up was requested.', detail: handoff.shareLatestMessage ? 'The latest message was shared with the support team as you chose.' : 'Your Talk It Out words remain private; only the follow-up request was shared.' })
      setHandoff({ shareLatestMessage: false, note: '', consent: false }); setActiveModal(''); loadDashboard().catch(() => {})
    } catch (requestError) { setError(requestError.message || 'The human follow-up could not be requested.') }
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
    else if (action.kind === 'check-in') openWellbeingTab('today', 'daily-check-in')
    else if (action.kind === 'human-help') setActiveModal('booking')
    else if (action.kind === 'human-handoff') setActiveModal('handoff')
    else if (action.kind === 'care') openWellbeingTab('support', 'care-pathways')
  }

  function openWellbeingTab(tabId, targetId = 'wellbeing-sections') {
    setActiveWellbeingTab(tabId)
    setActiveModal('')
    window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function finishHeroFeeling() {
    const feeling = HERO_FEELINGS[activeHeroFeelingIndex]
    setDaily((current) => ({ ...current, mood: feeling.id }))
    setActiveModal('feeling-suggestions')
  }

  function skipDailyCheckIn() {
    setDaily({ mood: '', stressors: [], sleep: '', note: '' })
    openWellbeingTab('connection', 'support-circles')
  }

  const todayMood = MOODS.find((mood) => mood.id === dashboard?.todayCheckIn?.mood)
  const heroFeeling = HERO_FEELINGS[activeHeroFeelingIndex]
  const activeCarePlanCount = carePrograms.filter((program) => (
    program.enrollments?.some((enrollment) => ['requested', 'active', 'paused'].includes(enrollment.status))
  )).length
  const activeCareProgram = carePrograms.find((program) => (
    program.enrollments?.some((enrollment) => ['requested', 'active', 'paused'].includes(enrollment.status))
  ))
  const availableCarePrograms = carePrograms.filter((program) => program.id !== activeCareProgram?.id)
  const activeCareEnrollment = activeCareProgram?.enrollments?.[0]
  const activeCareStepCount = activeCareProgram?.steps?.length || 1
  const activeCareCurrentStep = Math.min(activeCareEnrollment?.currentStep || 0, activeCareStepCount)
  const activeCareVisual = activeCareProgram
    ? CARE_PROGRAM_VISUALS[activeCareProgram.category] || CARE_PROGRAM_VISUALS.stress_and_mental_wellbeing
    : null
  const selectedCareEnrollment = selectedProgram?.enrollments?.[0]
  const selectedCareStepIndex = Math.min(selectedCareEnrollment?.currentStep || 0, selectedProgram?.steps?.length || 0)
  const selectedCareStep = selectedProgram?.steps?.[selectedCareStepIndex]
  const selectedCarePrompt = CARE_STEP_PROMPTS[selectedProgram?.category]?.[selectedCareStepIndex]
    || 'What would you like to remember or share privately about this step?'
  const selectedCareIsActive = ['requested', 'active', 'paused'].includes(selectedCareEnrollment?.status)

  return <main className="campus-page wellbeing-page">
    <Seo title="Wellbeing | Zumbarl Campus" description="Private daily check-ins, immediate reset tools, peer support and campus mental health help." path="/campus/wellbeing" />
    <div className="campus-stage"><div className="campus-shell wellbeing-shell">
      <CampusSidebar activeItemId="wellbeing" />
      <section className="campus-main wellbeing-main">
        <header className="wellbeing-topbar"><div><span>Private to you</span><h1>Wellbeing</h1></div><div className="wellbeing-topbar-actions"><Link className="wellbeing-urgent-link" to="/help"><FiShield /> Urgent help</Link><CampusTopActions className="wellbeing-top-actions" primaryAction={activeWellbeingTab === 'support' ? null : <button type="button" className="wellbeing-private-action" onClick={() => setActiveModal('booking')}><FiUser /> Human support</button>} showUserButton={false} /></div></header>
        {notice ? <section className="wellbeing-notice"><FiCheck /><div><strong>{notice.title}</strong><span>{notice.detail}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><FiX /></button></section> : null}
        {error ? <p className="wellbeing-error">{error}</p> : null}

        <section className="wellbeing-section-switcher" id="wellbeing-sections">
          <nav className="wellbeing-section-tabs" role="tablist" aria-label="Wellbeing sections">
            {Object.entries(WELLBEING_TABS).map(([id, tab], index) => {
              const TabIcon = index === 0 ? FiSun : index === 1 ? FiShield : FiUsers
              return <button key={id} id={`wellbeing-tab-${id}`} type="button" role="tab" aria-selected={activeWellbeingTab === id} aria-controls="wellbeing-active-panel" className={activeWellbeingTab === id ? 'is-active' : ''} onClick={() => setActiveWellbeingTab(id)}><TabIcon /><strong>{tab.shortLabel}</strong></button>
            })}
          </nav>

          <div className="wellbeing-section-panel" id="wellbeing-active-panel" role="tabpanel" aria-labelledby={`wellbeing-tab-${activeWellbeingTab}`}>
          {activeWellbeingTab === 'today' ? <>
          <section className="wellbeing-hero">
            <div className="wellbeing-hero-copy">
              <span><FiHeart /> A steadier place to land</span>
              <h2>How are you, really?</h2>
              <div className="wellbeing-feeling-slider">
                <div className="wellbeing-feeling-readout" aria-live="polite">
                  <MoodFace mood={heroFeeling.id} avatarSet={moodAvatarSet} className="wellbeing-mood-face-readout" />
                  <div><small>Right now I feel</small><strong>{heroFeeling.label}</strong></div>
                </div>
                <input type="range" min="0" max={HERO_FEELINGS.length - 1} step="1" value={activeHeroFeelingIndex} aria-label={`How you feel right now: ${heroFeeling.label}`} style={{ '--wellbeing-feeling-progress': `${(activeHeroFeelingIndex / (HERO_FEELINGS.length - 1)) * 100}%` }} onChange={(event) => setHeroFeelingIndex(Number(event.target.value))} onPointerUp={finishHeroFeeling} onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) finishHeroFeeling() }} />
                <div className="wellbeing-feeling-ends"><span>Heavy</span><small>Drag and release</small><span>Good</span></div>
              </div>
              <div className="wellbeing-hero-actions"><button type="button" className="is-overwhelmed" onClick={openReset}><FiZap /> I’m overwhelmed</button><button type="button" onClick={openTalkItOut}><FiMessageCircle /> Talk it out</button></div>
            </div>
            <div className="wellbeing-hero-visual"><img src="/assets/wellbeing/calm-pause.webp" alt="" aria-hidden="true" /></div>
          </section>
          <section className="wellbeing-today-grid">
          <form className="wellbeing-daily" id="daily-check-in" onSubmit={saveDailyCheckIn}><header><div><span>Today · 30 seconds</span><h2>{dashboard?.todayCheckIn ? 'You checked in today' : 'Meet yourself where you are'}</h2></div><FiSun /></header>
            {dashboard?.todayCheckIn ? <div className="wellbeing-checked-in">{todayMood ? <MoodFace mood={todayMood.id} avatarSet={moodAvatarSet} className="wellbeing-mood-face-checked" /> : <span>✓</span>}<div><strong>{todayMood?.label || 'Checked in'}</strong><p>{dashboard.todayCheckIn.stressors?.length ? `What was present: ${dashboard.todayCheckIn.stressors.map(formatStressor).join(', ')}` : 'Nothing else was required.'}</p></div><button type="button" onClick={() => setDashboard((current) => ({ ...current, todayCheckIn: null }))}>Add another</button></div> : <>
              <fieldset className="wellbeing-moods"><legend>How does today feel?</legend>{MOODS.map((mood) => <label key={mood.id} className={daily.mood === mood.id ? 'is-selected' : ''}><input type="radio" name="mood" value={mood.id} checked={daily.mood === mood.id} onChange={(event) => setDaily((current) => ({ ...current, mood: event.target.value }))} /><MoodFace mood={mood.id} avatarSet={moodAvatarSet} /><span className="wellbeing-mood-label">{mood.label}</span></label>)}</fieldset>
              <details className="wellbeing-checkin-details"><summary>Add context <small>Optional</small></summary><label><span>What is weighing on you?</span><div className="wellbeing-stressors">{STRESSORS.map(([id, label]) => <button key={id} type="button" className={daily.stressors.includes(id) ? 'is-selected' : ''} onClick={() => setDaily((current) => ({ ...current, stressors: current.stressors.includes(id) ? current.stressors.filter((item) => item !== id) : [...current.stressors, id] }))}>{label}</button>)}</div></label><label><span>How much did you sleep?</span><div className="wellbeing-sleep">{SLEEP_OPTIONS.map(([id, label]) => <button key={id} type="button" className={daily.sleep === id ? 'is-selected' : ''} onClick={() => setDaily((current) => ({ ...current, sleep: current.sleep === id ? '' : id }))}>{label}</button>)}</div></label><label><span>A private note <small>Optional</small></span><textarea value={daily.note} onChange={(event) => setDaily((current) => ({ ...current, note: event.target.value }))} placeholder="A few words for your future self…" /></label></details>
              <footer><div><small><FiLock /> Visible only to you</small><button type="button" className="wellbeing-skip-checkin" onClick={skipDailyCheckIn}>Skip for now</button></div><button type="submit" disabled={!daily.mood || working}>{working ? 'Saving…' : 'Save check-in'} <FiArrowRight /></button></footer>
            </>}
            <details className="wellbeing-inline-privacy"><summary><FiLock /> How your privacy works</summary><ul><li>Check-ins attach to your account so only you can revisit your history; they never appear in the campus feed.</li><li>Talk It Out conversations are stored in your private account so you can continue them.</li><li>Brain-dump text in a reset stays in this browser and is cleared when you close it.</li><li>When you choose anonymous human support, the request is stored without your student ID.</li></ul></details>
          </form>

          <section className="wellbeing-pattern-card"><header><span><FiActivity /></span><div><small>Your pattern</small><h2>A gentle look back</h2></div><label><input type="checkbox" checked={dashboard?.preference?.insightsEnabled ?? true} onChange={toggleInsights} /><i /></label></header>
            {dashboard?.preference?.insightsEnabled === false ? <div className="wellbeing-pattern-off"><FiLock /><p>Pattern insights are off. Your check-ins stay available to you.</p></div> : dashboard?.pattern ? <><p>{dashboard.pattern.message}</p><div className="wellbeing-pattern-stats"><span><strong>{dashboard.pattern.checkInDays}</strong> days checked in</span><span><strong>{dashboard.pattern.direction}</strong> this week</span></div>{dashboard.pattern.dominantStressors?.length ? <div className="wellbeing-pattern-tags">{dashboard.pattern.dominantStressors.map(({ stressor }) => <span key={stressor}>{formatStressor(stressor)}</span>)}</div> : null}{dashboard.pattern.suggestion?.kind === 'link' ? <Link to={dashboard.pattern.suggestion.href}>{dashboard.pattern.suggestion.label}<FiArrowRight /></Link> : <button type="button" onClick={() => handleAction(dashboard.pattern.suggestion)}>{dashboard.pattern.suggestion.label}<FiArrowRight /></button>}</> : <div className="wellbeing-pattern-off"><FiActivity /><p>A few check-ins will reveal voluntary, private patterns.</p></div>}
          </section>
          </section></> : null}

        {activeWellbeingTab === 'support' ? <div className="wellbeing-support-panel">
          <section className="wellbeing-human-entry"><div><span>Human support</span><h2>Talk to someone</h2><p>Choose a counselor appointment or a private campus response.</p></div><div><button type="button" onClick={() => setActiveModal('booking')}><FiCalendar /> Request a counselor</button><button type="button" onClick={() => setActiveModal('human-check-in')}><FiMessageCircle /> Private support request</button></div></section>

          {activeCareProgram && activeCareEnrollment && activeCareVisual ? <section className="wellbeing-active-plan" id="care-pathways">
            <div className={`wellbeing-active-plan-visual is-${activeCareVisual.tone}`}><img src={activeCareVisual.src} alt="" aria-hidden="true" /></div>
            <div className="wellbeing-active-plan-copy"><header><div><span>Your active plan</span><h2>{activeCareProgram.name}</h2></div><em>{activeCareEnrollment.status}</em></header><p>{activeCareProgram.summary}</p><div className="wellbeing-active-plan-next"><FiCompass /><span><small>Next step</small><strong>{activeCareProgram.steps?.[activeCareCurrentStep] || 'Review your progress with the support team'}</strong></span></div><div className="wellbeing-care-progress"><span><i style={{ width: `${Math.round((activeCareCurrentStep / activeCareStepCount) * 100)}%` }} /></span><small>Step {Math.min(activeCareCurrentStep + 1, activeCareStepCount)} of {activeCareStepCount}</small></div><footer><button type="button" className="is-secondary" onClick={() => { setSelectedProgram(activeCareProgram); setActiveModal('care-check-in') }}>Quick check-in</button><button type="button" onClick={() => openCareDetails(activeCareProgram)}>Continue plan <FiArrowRight /></button></footer></div>
          </section> : null}

          {availableCarePrograms.length ? <section className="wellbeing-care-discovery" id={activeCareProgram ? undefined : 'care-pathways'}><header><div><span>Structured support</span><h2>{activeCareProgram ? 'Explore other support' : 'Find a support path'}</h2><p>Private plans coordinated by Student Affairs or a wellbeing partner.</p></div>{activeCarePlanCount ? <em>{activeCarePlanCount} active</em> : null}</header><div className="wellbeing-care-discovery-grid">{availableCarePrograms.map((program) => {
            const visual = CARE_PROGRAM_VISUALS[program.category] || CARE_PROGRAM_VISUALS.stress_and_mental_wellbeing
            return <article key={program.id}><div className={`wellbeing-care-visual is-${visual.tone}`}><img src={visual.src} alt="" aria-hidden="true" /></div><div className="wellbeing-care-discovery-copy"><small>{program.payload?.durationLabel || 'Individual pace'}</small><h3>{program.name}</h3><p>{program.summary}</p><button type="button" onClick={() => { if (program.enrollments?.[0]) openCareDetails(program); else { setSelectedProgram(program); setActiveModal('care-enroll') } }}>{program.enrollments?.[0] ? 'View this plan' : 'Explore this path'} <FiArrowRight /></button></div></article>
          })}</div></section> : null}

          <div className="wellbeing-support-secondary">
            {supportActivity.length ? <details className="wellbeing-support-disclosure"><summary><span><FiUser /></span><div><strong>Requests & appointments</strong><small>{supportActivity.length} private {supportActivity.length === 1 ? 'update' : 'updates'}</small></div><FiChevronRight /></summary><div className="wellbeing-support-activity-list">{supportActivity.map((item) => <article key={`${item.kind}-${item.id}`}><span>{item.kind === 'Counselor appointment' ? <FiCalendar /> : <FiMessageCircle />}</span><div><strong>{item.kind}</strong><small>{item.category ? item.category.replaceAll('-', ' ') : new Date(item.date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><em className={`is-${item.status}`}>{item.status.replaceAll('_', ' ')}</em></article>)}</div></details> : null}
            {dashboard?.resources?.length ? <details className="wellbeing-support-disclosure"><summary><span><FiLink /></span><div><strong>Campus contacts</strong><small>{dashboard.resources.length} available to you</small></div><FiChevronRight /></summary><div className="wellbeing-resources">{dashboard.resources.map((resource) => <Link key={resource.id} to={resource.href}><i>{resource.resourceType === 'counseling' ? <FiUser /> : <FiLink />}</i><span><strong>{resource.name}</strong><small>{resource.availability || resource.contactLabel}</small></span><FiChevronRight /></Link>)}</div></details> : null}
          </div>

          <aside className="wellbeing-care-boundary"><FiShield /><p><strong>Private support, at your pace.</strong> Plans, requests and check-ins never appear on your profile or score. Zumbarl coordinates care; diagnosis and treatment remain with qualified professionals.</p></aside>
        </div> : null}

        {activeWellbeingTab === 'connection' ? <section className="wellbeing-circles" id="support-circles"><header><div><span>Low-pressure connection</span><h2>People who may understand</h2><p>Small moderated spaces for shared experiences—not public pages or open feeds.</p></div><em>{joinedCount} joined</em></header>
          {isLoading ? <div className="wellbeing-loading"><span /><span /></div> : circles.length ? <div className="wellbeing-circle-grid">{circles.slice(0, 4).map((circle) => {
            const memberCount = Number(circle.memberCount || 0)
            const circleHref = `/campus/wellbeing/circles/${circle.id}`
            const splashImageUrl = getSupportCircleSplash(circle)
            const isPending = circle.status !== 'active'
            return <article key={circle.id} className={`${circle.viewerMembership ? 'is-joined ' : ''}${splashImageUrl ? 'has-splash ' : ''}${isPending ? 'is-pending' : ''}`.trim()} role={circle.viewerMembership && !isPending ? 'link' : undefined} tabIndex={circle.viewerMembership && !isPending ? 0 : undefined} onClick={circle.viewerMembership && !isPending ? () => navigate(circleHref) : undefined} onKeyDown={circle.viewerMembership && !isPending ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(circleHref) } } : undefined}>
              {splashImageUrl ? <div className="wellbeing-circle-splash" aria-hidden="true"><img src={splashImageUrl} alt="" loading="lazy" /><span><FiHeart /></span></div> : null}
              <header><span><FiHeart /></span><div><small>{isPending ? 'Awaiting safeguarding review' : 'Alias-first circle'}</small><h3>{circle.name}</h3></div><FiLock aria-label="Members-only space" /></header>
              <p>{circle.purpose}</p>
              <div className="wellbeing-circle-trust"><span><FiShield /><i>Moderated by</i><strong>{circle.moderationOwner || 'Campus wellbeing team'}</strong></span><span><FiClock /><i>Participation</i><strong>{circle.activityLabel || 'Ongoing · reply when ready'}</strong></span></div>
              <div className="wellbeing-circle-meta"><span><FiUsers /> {memberCount ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : 'New circle'}</span><span>{circle.campus || viewer.campus}</span></div>
              <footer><span><FiLock /> {isPending ? 'Only you and reviewers can see this proposal' : 'Your alias is shown to members'}</span>{isPending ? <strong>Pending review</strong> : circle.viewerMembership ? <Link to={circleHref} onClick={(event) => event.stopPropagation()}>Open circle <FiArrowRight /></Link> : <button type="button" onClick={() => { setSelectedCircle(circle); setAlias(createAlias()); setActiveModal('circle') }}>Join with alias</button>}</footer>
            </article>
          })}</div> : <div className="wellbeing-empty"><FiHeart /><h3>No campus circles are open yet.</h3><p>You can still talk privately with the wellbeing team.</p></div>}
        </section> : null}
          </div>
        </section>
      </section>
    </div></div>

    {activeModal ? <div className="wellbeing-modal-backdrop" role="presentation" onMouseDown={closeModal}>
      {activeModal === 'feeling-suggestions' ? <section className={`wellbeing-modal wellbeing-feeling-modal is-${heroFeeling.id}`} role="dialog" aria-modal="true" aria-labelledby="feeling-suggestion-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span className="wellbeing-feeling-kicker"><MoodFace mood={heroFeeling.id} avatarSet={moodAvatarSet} className="wellbeing-mood-face-kicker" /> You chose {heroFeeling.label.toLowerCase()}</span><h2 id="feeling-suggestion-title">{heroFeeling.title}</h2><p>{heroFeeling.detail}</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header>
        <div className="wellbeing-feeling-suggestions">
          {heroFeeling.tabs.map((tabId) => {
            const tab = WELLBEING_TABS[tabId]
            const TabIcon = tabId === 'today' ? FiSun : tabId === 'support' ? FiShield : FiUsers
            return <button className={`is-${tabId}`} key={tabId} type="button" onClick={() => openWellbeingTab(tabId)}><span><TabIcon /></span><div><strong>{tab.actionLabel}</strong><small>{tab.detail}</small></div><i><FiArrowRight /></i></button>
          })}
        </div>
        <footer><small><FiLock /> Your feeling was not saved or shared.</small><button className="wellbeing-feeling-dismiss" type="button" onClick={closeModal}>Maybe later</button></footer>
      </section> : null}

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

      {activeModal === 'care-enroll' && selectedProgram ? <form className="wellbeing-modal wellbeing-care-modal" onSubmit={joinCareProgram} onMouseDown={(event) => event.stopPropagation()}><header><div><span>Private care pathway</span><h2>{selectedProgram.name}</h2><p>{selectedProgram.summary}</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-care-steps">{selectedProgram.steps.map((step, index) => <span key={step}><i>{index + 1}</i>{step}</span>)}</div><label className="wellbeing-field"><span>What would you like this pathway to help with?</span><textarea required minLength="5" value={programRequest.goal} onChange={(event) => setProgramRequest((current) => ({ ...current, goal: event.target.value }))} placeholder="Describe a private, practical goal in your own words…" /></label><label className="wellbeing-field"><span>How soon would you like contact?</span><select value={programRequest.urgency} onChange={(event) => setProgramRequest((current) => ({ ...current, urgency: event.target.value }))}><option value="low">When a place is available</option><option value="normal">Within the normal support window</option><option value="high">As soon as the team can respond</option></select></label><label className="wellbeing-consent"><input type="checkbox" checked={programRequest.consent} onChange={(event) => setProgramRequest((current) => ({ ...current, consent: event.target.checked }))} /><span><strong>I agree to a named, private follow-up</strong><small>{selectedProgram.facilitatorName} may see my identity, goal and plan progress to coordinate support. Nothing is posted publicly.</small></span></label><footer><small><FiShield /> You can pause, resume or withdraw later without losing your private history.</small><button type="submit" disabled={working || !programRequest.consent || programRequest.goal.trim().length < 5}>{working ? 'Sending…' : 'Request this pathway'} <FiArrowRight /></button></footer></form> : null}

      {activeModal === 'care-details' && selectedProgram ? <section className="wellbeing-modal wellbeing-care-modal wellbeing-care-workspace" role="dialog" aria-modal="true" aria-labelledby="care-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>Your private care pathway</span><h2 id="care-details-title">{selectedProgram.name}</h2><p>{selectedProgram.summary}</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header>
        <div className="wellbeing-care-workspace-summary"><div className="wellbeing-care-detail-provider"><FiShield /><span><small>Coordinated by</small><strong>{selectedProgram.facilitatorName}</strong></span></div>{selectedCareEnrollment ? <div className="wellbeing-care-workspace-status"><em>{selectedCareEnrollment.status}</em><div className="wellbeing-care-progress"><span><i style={{ width: `${Math.round((selectedCareStepIndex / (selectedProgram.steps.length || 1)) * 100)}%` }} /></span><small>{selectedCareStepIndex >= selectedProgram.steps.length ? 'All plan steps reviewed' : `Step ${selectedCareStepIndex + 1} of ${selectedProgram.steps.length}`}</small></div></div> : null}</div>

        <ol className="wellbeing-care-workspace-steps" aria-label="Care pathway steps">{selectedProgram.steps.map((step, index) => <li key={step} className={index < selectedCareStepIndex ? 'is-complete' : index === selectedCareStepIndex ? 'is-current' : ''}><i>{index < selectedCareStepIndex ? <FiCheck /> : index + 1}</i><span><strong>{step}</strong><small>{index < selectedCareStepIndex ? 'Completed privately' : index === selectedCareStepIndex ? 'Current step' : 'Comes next'}</small></span></li>)}</ol>

        {selectedCareEnrollment && selectedCareIsActive ? <>
          {selectedCareEnrollment.status === 'requested' ? <section className="wellbeing-care-plan-finished"><FiClock /><div><h3>Your request is with the support team.</h3><p>You can begin the guided steps after they accept the pathway.</p></div><button type="button" onClick={() => setActiveModal('human-check-in')}>Ask a question</button></section> : selectedCareEnrollment.status === 'paused' ? <section className="wellbeing-care-plan-finished"><FiLock /><div><h3>Your plan is paused.</h3><p>Your place, progress and private notes are still here.</p></div><button type="button" disabled={working} onClick={() => changeOwnCarePlanStatus('active')}>Resume plan</button></section> : selectedCareStep ? <form className="wellbeing-care-current-step" onSubmit={completeCurrentCareStep}><span>Current step · {selectedCareStepIndex + 1}</span><h3>{selectedCareStep}</h3><p>{selectedCarePrompt}</p>{selectedProgram.payload?.circleId && /peer|circle|session/i.test(selectedCareStep) ? <Link className="wellbeing-care-circle-link" to={`/campus/wellbeing/circles/${selectedProgram.payload.circleId}`}><FiUsers /><span><strong>Open the moderated peer circle</strong><small>You can participate with your alias.</small></span><FiArrowRight /></Link> : null}<label><span>Private reflection</span><textarea value={careStepNote} onChange={(event) => setCareStepNote(event.target.value)} placeholder="A few words about what you tried, noticed or need next…" maxLength="1000" /></label><footer><small><FiLock /> Visible only to you and authorized Student Care staff.</small><button type="submit" disabled={working || careStepNote.trim().length < 3}>{working ? 'Saving…' : 'Complete this step'} <FiArrowRight /></button></footer></form> : <section className="wellbeing-care-plan-finished"><FiCheck /><div><h3>You reached the end of this plan.</h3><p>Use a private check-in to reflect or ask your support team to review the plan with you.</p></div><button type="button" onClick={() => setActiveModal('care-check-in')}>Private check-in</button></section>}

          {selectedCareEnrollment.progress?.length ? <details className="wellbeing-care-timeline"><summary>Recent private updates <span>{selectedCareEnrollment.progress.length}</span></summary><div>{selectedCareEnrollment.progress.slice(0, 4).map((item) => <article key={item.id}><i>{item.kind === 'student_check_in' ? <FiEdit3 /> : <FiShield />}</i><span><strong>{String(item.status).replaceAll('_', ' ')}</strong>{item.note ? <p>{item.note}</p> : null}<small>{new Date(item.occurredAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</small></span></article>)}</div></details> : null}

          <details className="wellbeing-care-plan-controls"><summary>Pause or leave this plan</summary><div><p>Pausing keeps your place and progress. Withdrawing closes the plan; Student Affairs must help you restart it.</p><div>{selectedCareEnrollment.status === 'active' ? <button type="button" disabled={working} onClick={() => changeOwnCarePlanStatus('paused')}>Pause plan</button> : null}{selectedCareEnrollment.status === 'paused' ? <button type="button" disabled={working} onClick={() => changeOwnCarePlanStatus('active')}>Resume plan</button> : null}<button type="button" className="is-danger" disabled={working} onClick={() => changeOwnCarePlanStatus('withdrawn')}>Withdraw</button></div></div></details>
        </> : selectedCareEnrollment ? <section className="wellbeing-care-plan-finished"><FiLock /><div><h3>This plan is {selectedCareEnrollment.status}.</h3><p>Your private history is still available. Contact Student Affairs if you need to restart or review it.</p></div><button type="button" onClick={() => setActiveModal('human-check-in')}>Contact support</button></section> : null}

        {!selectedCareEnrollment ? <footer><small><FiLock /> This pathway never appears on your public profile or score.</small><button type="button" onClick={() => setActiveModal('care-enroll')}>Request this pathway <FiArrowRight /></button></footer> : null}
      </section> : null}

      {activeModal === 'care-check-in' && selectedProgram?.enrollments?.[0] ? <form className="wellbeing-modal wellbeing-care-modal" onSubmit={submitProgramCheckIn} onMouseDown={(event) => event.stopPropagation()}><header><div><span>Private progress check-in</span><h2>{selectedProgram.name}</h2><p>This is for support, not scoring. A difficult week never removes earlier progress.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-care-statuses">{[['steady', 'I’m steady'], ['completed_step', 'I completed a step'], ['need_support', 'I need more support'], ['setback', 'I had a setback']].map(([id, label]) => <label key={id} className={programCheckIn.status === id ? 'is-selected' : ''}><input type="radio" name="care-status" value={id} checked={programCheckIn.status === id} onChange={(event) => setProgramCheckIn((current) => ({ ...current, status: event.target.value, requestFollowUp: ['need_support', 'setback'].includes(event.target.value) }))} /><span>{label}</span></label>)}</div><label className="wellbeing-field"><span>Anything you want your support team to know? <small>Optional</small></span><textarea value={programCheckIn.note} onChange={(event) => setProgramCheckIn((current) => ({ ...current, note: event.target.value }))} /></label><label className="wellbeing-consent"><input type="checkbox" checked={programCheckIn.requestFollowUp} onChange={(event) => setProgramCheckIn((current) => ({ ...current, requestFollowUp: event.target.checked }))} /><span><strong>Ask the support team to follow up</strong><small>This reopens your care request for a human response.</small></span></label><footer><small><FiLock /> Private to you and authorized Student Care staff.</small><button type="submit" disabled={working}>{working ? 'Saving…' : 'Save check-in'} <FiArrowRight /></button></footer></form> : null}

      {activeModal === 'handoff' && conversation ? <form className="wellbeing-modal wellbeing-care-modal" onSubmit={submitHumanHandoff} onMouseDown={(event) => event.stopPropagation()}><header><div><span>Explicit human handoff</span><h2>Ask a person to follow up</h2><p>Talk It Out is private by default. You decide whether the support team also receives your latest message.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><label className="wellbeing-consent"><input type="checkbox" checked={handoff.shareLatestMessage} onChange={(event) => setHandoff((current) => ({ ...current, shareLatestMessage: event.target.checked }))} /><span><strong>Share my latest Talk It Out message</strong><small>Leave this off to send only a request for contact.</small></span></label><label className="wellbeing-field"><span>Optional note for the support team</span><textarea value={handoff.note} onChange={(event) => setHandoff((current) => ({ ...current, note: event.target.value }))} /></label><label className="wellbeing-consent is-required"><input type="checkbox" checked={handoff.consent} onChange={(event) => setHandoff((current) => ({ ...current, consent: event.target.checked }))} /><span><strong>I understand this creates a named support case</strong><small>This is not an emergency service. If danger is immediate, move toward a trusted person, campus security or emergency care now.</small></span></label><footer><Link to="/help">Open urgent safety help</Link><button type="submit" disabled={working || !handoff.consent}>{working ? 'Requesting…' : 'Request human follow-up'} <FiArrowRight /></button></footer></form> : null}

      {activeModal === 'circle' && selectedCircle ? <section className="wellbeing-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><div><span>Alias participation</span><h2>Join {selectedCircle.name}</h2><p>Members will see your chosen alias instead of your student profile.</p></div><button type="button" onClick={closeModal} aria-label="Close"><FiX /></button></header><div className="wellbeing-alias"><span>{alias.slice(0, 1)}</span><div><small>You’ll appear as</small><strong>{alias}</strong></div><button type="button" onClick={() => setAlias(createAlias())}>Try another</button></div><div className="wellbeing-disclosure"><FiShield /><p><strong>Private to members, accountable to safety.</strong>Your profile is hidden from circle members. Authorized safety staff can connect the alias to your account only for moderation, safeguarding, or a required escalation.</p></div><footer><small>By joining, you agree to the circle rules and safety boundaries.</small><button type="button" disabled={working} onClick={joinCircle}>{working ? 'Joining…' : 'Join with this alias'} <FiArrowRight /></button></footer></section> : null}
    </div> : null}
  </main>
}

export default WellbeingPage
