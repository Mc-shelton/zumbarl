import { useCallback, useEffect, useRef, useState } from 'react'
import { FiAlertCircle, FiArrowLeft, FiCalendar, FiCheck, FiChevronDown, FiClock, FiCopy, FiFileText, FiGlobe, FiHeadphones, FiHeart, FiImage, FiLink, FiLock, FiMessageCircle, FiMic, FiPlus, FiSend, FiShield, FiTrash2, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import VoiceShieldConference from '../features/calls/VoiceShieldConference'
import { VOICE_SHIELD_PROFILES } from '../features/calls/voiceShieldProfiles'
import { createSupportCirclePost, createSupportCircleSchedule, decideSupportCircleScheduleAdmission, joinCommunityGroup, joinSupportCircleAudioRoom, readSupportCircle, removeSupportCircleMember, removeSupportCircleMessage, removeSupportCirclePost, respondToSupportCircleSchedule, sendSupportCircleMessage, updateSupportCircleMemberRole } from '../features/community/services/communityService'
import { getSupportCircleSplash } from '../features/community/supportCircleVisuals'
import ExplorePostComposer from '../features/explore/components/ExplorePostComposer'
import ManagedEntityFeed from '../features/explore/components/ManagedEntityFeed'
import { uploadZumbarlFile } from '../lib/uploadZumbarlFile'
import '../styles/campus.css'
import '../styles/explore-campus.css'
import '../styles/support-circle.css'

const INITIAL_CLOCK_TIME = Date.now()

function makeAlias() {
  const first = ['Calm', 'Brave', 'Kind', 'Hopeful', 'Quiet', 'Steady']
  const second = ['Acacia', 'Bee', 'River', 'Star', 'Sunbird', 'Baobab']
  const seed = Date.now()
  return `${first[seed % first.length]} ${second[Math.floor(seed / 7) % second.length]} ${String(seed).slice(-2)}`
}

function formatTime(value) { return new Intl.DateTimeFormat('en-KE', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) }
function formatScheduleTime(value) { return new Intl.DateTimeFormat('en-KE', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) }
function toLocalInputValue(date = new Date(Date.now() + 86400000)) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16) }
function isMeetingLive(item, now = Date.now()) { const startsAt = new Date(item.startsAt).getTime(); const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : startsAt + 7200000; return Number.isFinite(startsAt) && now >= startsAt && now <= endsAt }

function appendCircleMessage(current, message) {
  if (!current || !message?.id) return current
  const messages = current.messages || []
  const existingIndex = messages.findIndex((item) => item.id === message.id)
  if (existingIndex >= 0) {
    return {
      ...current,
      messages: messages.map((item, index) => index === existingIndex
        ? { ...item, ...message, isViewer: item.isViewer || message.isViewer }
        : item),
    }
  }
  return {
    ...current,
    messages: [...messages, message],
    group: { ...current.group, messageCount: Number(current.group?.messageCount || 0) + 1 },
  }
}

export default function SupportCirclePage() {
  const { groupId } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [showPostComposer, setShowPostComposer] = useState(false)
  const [alias, setAlias] = useState(makeAlias)
  const [joinAnonymously, setJoinAnonymously] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState({ title: '', description: '', kind: 'audio_circle', startsAt: toLocalInputValue(), endsAt: '', location: '', membersOnly: true, publishToExplore: false, createZumbarlLink: false, joinPolicy: 'open' })
  const [scheduleThumbnail, setScheduleThumbnail] = useState(null)
  const [linkCopiedId, setLinkCopiedId] = useState('')
  const [audioRoom, setAudioRoom] = useState(null)
  const [audioStage, setAudioStage] = useState('closed')
  const [audioDisclosureAccepted, setAudioDisclosureAccepted] = useState(false)
  const [voiceProfileId, setVoiceProfileId] = useState('cedar')
  const [voiceShieldEnabled, setVoiceShieldEnabled] = useState(true)
  const [audioUseAlias, setAudioUseAlias] = useState(true)
  const [audioLoading, setAudioLoading] = useState(false)
  const [openMessageMenuId, setOpenMessageMenuId] = useState('')
  const endRef = useRef(null)
  const openedScheduleLinkRef = useRef('')

  const load = useCallback(({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true)
    return readSupportCircle(groupId).then(setData).catch((requestError) => setError(requestError.message || 'This support circle could not be opened.')).finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    let isCurrent = true
    readSupportCircle(groupId).then((response) => { if (isCurrent) setData(response) }).catch((requestError) => { if (isCurrent) setError(requestError.message || 'This support circle could not be opened.') }).finally(() => { if (isCurrent) setLoading(false) })
    return () => { isCurrent = false }
  }, [groupId])
  useEffect(() => {
    const handleCreated = (event) => {
      if (event.detail?.groupId !== groupId) return
      setData((current) => appendCircleMessage(current, event.detail.message))
    }
    const handleRemoved = (event) => {
      if (event.detail?.groupId !== groupId) return
      setData((current) => current ? {
        ...current,
        messages: (current.messages || []).filter((message) => message.id !== event.detail.messageId),
      } : current)
    }
    window.addEventListener('zumbarl:circle-message-created', handleCreated)
    window.addEventListener('zumbarl:circle-message-removed', handleRemoved)
    return () => {
      window.removeEventListener('zumbarl:circle-message-created', handleCreated)
      window.removeEventListener('zumbarl:circle-message-removed', handleRemoved)
    }
  }, [groupId])
  useEffect(() => { if (activeTab === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [data?.messages, activeTab])
  useEffect(() => {
    if (!openMessageMenuId) return undefined
    const closeMenu = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && event.target.closest('.support-circle-message-actions')) return
      setOpenMessageMenuId('')
    }
    window.addEventListener('pointerdown', closeMenu)
    window.addEventListener('keydown', closeMenu)
    return () => {
      window.removeEventListener('pointerdown', closeMenu)
      window.removeEventListener('keydown', closeMenu)
    }
  }, [openMessageMenuId])
  useEffect(() => {
    if (audioStage === 'closed') return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') closeAudioRoom() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [audioStage])
  useEffect(() => () => {
    if (scheduleThumbnail?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(scheduleThumbnail.previewUrl)
  }, [scheduleThumbnail?.previewUrl])
  async function joinCircle() {
    setWorking(true); setError('')
    try { await joinCommunityGroup(groupId, joinAnonymously ? { participationMode: 'alias', alias: alias.trim() } : { participationMode: 'named' }); openedScheduleLinkRef.current = ''; await load() }
    catch (requestError) { setError(requestError.message || 'You could not join this circle.') }
    finally { setWorking(false) }
  }

  async function sendMessage(event) {
    event.preventDefault(); const message = body.trim(); if (!message) return
    setWorking(true); setError(''); setBody('')
    try { const created = await sendSupportCircleMessage(groupId, message); setData((current) => appendCircleMessage(current, created)) }
    catch (requestError) { setBody(message); setError(requestError.message || 'Your message could not be shared.') }
    finally { setWorking(false) }
  }

  async function saveSchedule(event) {
    event.preventDefault(); setWorking(true); setError('')
    try {
      const thumbnailUpload = scheduleDraft.publishToExplore && scheduleThumbnail?.file
        ? await uploadZumbarlFile(scheduleThumbnail.file, { scope: 'connect-event-thumbnail', metadata: { purpose: 'support-circle-schedule', groupId } })
        : null
      const created = await createSupportCircleSchedule(groupId, { ...scheduleDraft, startsAt: new Date(scheduleDraft.startsAt).toISOString(), endsAt: scheduleDraft.endsAt ? new Date(scheduleDraft.endsAt).toISOString() : undefined, thumbnailUrl: thumbnailUpload?.url || thumbnailUpload?.previewUrl || null })
      setData((current) => ({ ...current, schedules: [...(current.schedules || []), created].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)) }))
      setScheduleDraft({ title: '', description: '', kind: 'audio_circle', startsAt: toLocalInputValue(), endsAt: '', location: '', membersOnly: true, publishToExplore: false, createZumbarlLink: false, joinPolicy: 'open' }); setScheduleThumbnail(null); setShowScheduleForm(false); await load({ showLoading: false })
    } catch (requestError) { setError(requestError.message || 'This session could not be scheduled.') }
    finally { setWorking(false) }
  }

  function chooseScheduleThumbnail(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image for the Explore Campus thumbnail.'); return }
    setError('')
    setScheduleThumbnail({ file, previewUrl: URL.createObjectURL(file) })
  }

  async function respondToSchedule(scheduleId, requestedStatus) {
    setWorking(true); setError('')
    try {
      const current = (data?.schedules || []).find((schedule) => schedule.id === scheduleId)
      const status = current?.viewerResponse === requestedStatus ? 'CANCELLED' : requestedStatus
      const response = await respondToSupportCircleSchedule(groupId, scheduleId, status)
      setData((existing) => ({
        ...existing,
        schedules: (existing.schedules || []).map((schedule) => schedule.id === scheduleId ? { ...schedule, ...response } : schedule),
      }))
    } catch (requestError) { setError(requestError.message || 'Your RSVP could not be saved.') }
    finally { setWorking(false) }
  }

  async function decideAdmission(scheduleId, studentId, status) {
    setWorking(true); setError('')
    try {
      await decideSupportCircleScheduleAdmission(groupId, scheduleId, studentId, status)
      await load({ showLoading: false })
    } catch (requestError) { setError(requestError.message || 'That waiting-room request could not be updated.') }
    finally { setWorking(false) }
  }

  async function publishPost(payload) {
    setWorking(true); setError('')
    try {
      const created = await createSupportCirclePost(groupId, payload)
      setData((current) => ({ ...current, posts: [created, ...(current.posts || [])] }))
    } catch (requestError) {
      setError(requestError.message || 'This post could not be published.')
      throw requestError
    }
    finally { setWorking(false) }
  }

  async function deletePost(postId) {
    if (!window.confirm('Remove this circle post?')) return
    setWorking(true); setError('')
    try { await removeSupportCirclePost(groupId, postId); setData((current) => ({ ...current, posts: (current.posts || []).filter((post) => post.id !== postId) })) }
    catch (requestError) { setError(requestError.message || 'This post could not be removed.') }
    finally { setWorking(false) }
  }

  async function deleteMessage(messageId) {
    setOpenMessageMenuId('')
    if (!window.confirm('Remove this message from the circle?')) return
    setWorking(true); setError('')
    try { await removeSupportCircleMessage(groupId, messageId); setData((current) => ({ ...current, messages: (current.messages || []).filter((message) => message.id !== messageId) })) }
    catch (requestError) { setError(requestError.message || 'This message could not be removed.') }
    finally { setWorking(false) }
  }

  async function changeMemberRole(membershipId, role) {
    setWorking(true); setError('')
    try { await updateSupportCircleMemberRole(groupId, membershipId, role); await load({ showLoading: false }) }
    catch (requestError) { setError(requestError.message || 'That member role could not be changed.') }
    finally { setWorking(false) }
  }

  async function removeMember(membershipId, displayName) {
    if (!window.confirm(`Remove ${displayName} from this circle? They can join again later.`)) return
    setWorking(true); setError('')
    try { await removeSupportCircleMember(groupId, membershipId); await load({ showLoading: false }) }
    catch (requestError) { setError(requestError.message || 'That member could not be removed.') }
    finally { setWorking(false) }
  }

  const prepareAudioRoom = useCallback(async (scheduleId = '') => {
    const linkedScheduleId = typeof scheduleId === 'string' ? scheduleId : ''
    setAudioLoading(true); setError('')
    try {
      const room = await joinSupportCircleAudioRoom(groupId, { useAlias: audioUseAlias, voiceShieldEnabled, scheduleId: linkedScheduleId })
      setAudioRoom(room); setAudioDisclosureAccepted(false); setAudioStage(room.waitingForAdmission ? 'waiting' : 'disclosure')
      await load({ showLoading: false })
    }
    catch (requestError) { setError(requestError.message || 'The audio circle could not be opened.') }
    finally { setAudioLoading(false) }
  }, [audioUseAlias, groupId, load, voiceShieldEnabled])

  useEffect(() => {
    if (audioStage !== 'waiting' || !audioRoom?.scheduleId) return undefined
    let requestInFlight = false
    const checkAdmission = async () => {
      if (requestInFlight) return
      requestInFlight = true
      try {
        const room = await joinSupportCircleAudioRoom(groupId, { useAlias: audioUseAlias, voiceShieldEnabled, scheduleId: audioRoom.scheduleId })
        if (!room.waitingForAdmission) { setAudioRoom(room); setAudioDisclosureAccepted(false); setAudioStage('disclosure') }
      } catch (requestError) {
        setError(requestError.message || 'The host did not admit this request.')
        closeAudioRoom()
      } finally { requestInFlight = false }
    }
    const intervalId = window.setInterval(checkAdmission, 2500)
    return () => window.clearInterval(intervalId)
  }, [audioRoom?.scheduleId, audioStage, audioUseAlias, groupId, voiceShieldEnabled])

  useEffect(() => {
    const scheduleId = searchParams.get('join') || ''
    if (!scheduleId || loading || !data?.group || openedScheduleLinkRef.current === scheduleId) return
    openedScheduleLinkRef.current = scheduleId
    prepareAudioRoom(scheduleId)
  }, [data?.group, loading, prepareAudioRoom, searchParams])

  useEffect(() => {
    if (activeTab !== 'schedule' || !data?.group?.viewerCanManage) return undefined
    const intervalId = window.setInterval(() => load({ showLoading: false }), 5000)
    return () => window.clearInterval(intervalId)
  }, [activeTab, data?.group?.viewerCanManage, load])
  useEffect(() => {
    const hasLiveAudioCircle = (data?.messages || []).some((message) => message.type === 'call_started' && new Date(message.expiresAt || 0).getTime() > Date.now())
    if (activeTab !== 'chat' || !hasLiveAudioCircle) return undefined
    const intervalId = window.setInterval(() => load({ showLoading: false }), 10000)
    return () => window.clearInterval(intervalId)
  }, [activeTab, data?.messages, load])

  async function enterAudioRoom() {
    setAudioLoading(true); setError('')
    try { const room = await joinSupportCircleAudioRoom(groupId, { useAlias: audioUseAlias, voiceShieldEnabled, scheduleId: audioRoom?.scheduleId }); setAudioRoom(room); setAudioStage('active') }
    catch (requestError) { setError(requestError.message || 'The audio circle could not be entered.') }
    finally { setAudioLoading(false) }
  }

  function closeAudioRoom() { setAudioStage('closed'); setAudioRoom(null); setAudioDisclosureAccepted(false) }

  async function copyScheduleLink(schedule) {
    try {
      await navigator.clipboard.writeText(new URL(schedule.meetingPath, window.location.origin).toString())
      setLinkCopiedId(schedule.id)
      window.setTimeout(() => setLinkCopiedId((current) => current === schedule.id ? '' : current), 1800)
    } catch { setError('The Zumbarl call link could not be copied.') }
  }

  function renderMessage(message) {
    if (message.type === 'call_started') {
      const isOpen = new Date(message.expiresAt || 0) > new Date()
      const participantCount = Number(message.participantCount || 0)
      const isLive = isOpen && participantCount > 0
      return <article key={message.id} className={`support-circle-timeline-event${isLive ? ' is-live' : ''}`}><p><strong>{message.authorAlias}</strong> started an audio circle <span>{isLive ? `Live · ${participantCount} ${participantCount === 1 ? 'person' : 'people'} in call` : isOpen ? 'No one in the call' : 'Call ended'}</span><time>{formatTime(message.createdAt)}</time>{isOpen ? <button type="button" onClick={prepareAudioRoom}>Join</button> : null}</p></article>
    }
    if (message.type === 'schedule_created') return <article key={message.id} className="support-circle-timeline-event is-schedule"><p><strong>{message.title || 'A circle session'}</strong> was scheduled for <span>{message.startsAt ? formatScheduleTime(message.startsAt) : message.body}</span><time>{formatTime(message.createdAt)}</time><button type="button" onClick={() => setActiveTab('schedule')}>View</button></p></article>
    const menuIsOpen = openMessageMenuId === message.id
    return <article key={message.id} className={`${message.isViewer ? 'is-viewer ' : ''}${group?.viewerCanManage ? 'has-actions' : ''}`}><div><span>{message.authorAlias?.slice(0, 1)}</span><strong>{message.isViewer ? `${message.authorAlias} · You` : message.authorAlias}</strong><time>{formatTime(message.createdAt)}</time></div><p>{message.body}</p>{group?.viewerCanManage ? <div className="support-circle-message-actions"><button className="support-circle-message-menu-toggle" type="button" onClick={() => setOpenMessageMenuId((current) => current === message.id ? '' : message.id)} aria-label="Message actions" aria-expanded={menuIsOpen} aria-haspopup="menu"><FiChevronDown /></button>{menuIsOpen ? <div className="support-circle-message-menu" role="menu"><button type="button" role="menuitem" disabled={working} onClick={() => deleteMessage(message.id)}><FiTrash2 /> Delete message</button></div> : null}</div> : null}</article>
  }

  const group = data?.group
  const membership = group?.viewerMembership
  const membershipIsAlias = membership?.participationMode !== 'named'
  const membershipAlias = membershipIsAlias ? (membership?.alias || alias) : 'your profile'
  const splashImageUrl = getSupportCircleSplash(group)
  const upcomingSchedules = (data?.schedules || []).filter((item) => {
    const startsAt = new Date(item.startsAt).getTime()
    const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : startsAt + 7200000
    return endsAt >= Date.now() - 3600000
  })

  return <main className="campus-page support-circle-page">
    <Seo title={`${group?.name || 'Support circle'} | Zumbarl Wellbeing`} description="A private, moderated peer support circle on Zumbarl." path={`/campus/wellbeing/circles/${groupId}`} />
    <div className="campus-stage"><div className="campus-shell support-circle-shell">
      <CampusSidebar activeItemId="wellbeing" />
      <section className="campus-main support-circle-main">
        <header className="support-circle-topbar"><Link to="/campus/wellbeing"><FiArrowLeft /> Wellbeing</Link><CampusTopActions showUserButton={false} /></header>
        {loading ? <section className="support-circle-loading"><span /><span /><span /></section> : error && !group ? <section className="support-circle-error"><FiHeart /><h1>We couldn’t open this circle.</h1><p>{error}</p><Link to="/campus/wellbeing">Return to Wellbeing</Link></section> : <>
          <section className={`support-circle-hero${splashImageUrl ? ' has-splash' : ''}`}>{splashImageUrl ? <div className="support-circle-hero-splash" aria-hidden="true"><img src={splashImageUrl} alt="" /></div> : null}<div className="support-circle-icon"><FiHeart /></div><div><span>Private support circle</span><h1>{group.name}</h1><p>{group.purpose}</p><div><em><FiUsers /> {group.memberCount} members</em><em><FiMessageCircle /> {group.messageCount} updates</em><em><FiShield /> Moderated</em></div></div><aside><FiLock /><strong>{membership ? (membershipIsAlias ? `You’re ${membershipAlias}` : 'You joined with your profile') : 'Private by default'}</strong><p>You decide whether members see an alias or your profile.</p></aside></section>

          {!membership ? <JoinPanel alias={alias} setAlias={setAlias} anonymous={joinAnonymously} setAnonymous={setJoinAnonymously} working={working} join={joinCircle} /> : <section className="support-circle-room">
            <header><div><span>Circle space</span><h2>A place to be heard—not judged.</h2></div><div className="support-circle-room-actions"><em><FiLock /> Members only</em><button type="button" onClick={prepareAudioRoom} disabled={audioLoading}><FiHeadphones /> {audioLoading ? 'Opening…' : 'Start audio circle'}</button></div></header>
            <div className="support-circle-tabs-stack"><nav className="support-circle-tabs" role="tablist" aria-label="Circle space"><button type="button" role="tab" aria-selected={activeTab === 'chat'} className={activeTab === 'chat' ? 'is-active' : ''} onClick={() => setActiveTab('chat')}><FiMessageCircle /> Chat</button><button type="button" role="tab" aria-selected={activeTab === 'posts'} className={activeTab === 'posts' ? 'is-active' : ''} onClick={() => setActiveTab('posts')}><FiFileText /> Posts <span>{data.posts?.length || 0}</span></button><button type="button" role="tab" aria-selected={activeTab === 'schedule'} className={activeTab === 'schedule' ? 'is-active' : ''} onClick={() => setActiveTab('schedule')}><FiCalendar /> Schedule <span>{upcomingSchedules.length}</span></button>{group.viewerCanManage ? <button type="button" role="tab" aria-selected={activeTab === 'manage'} className={activeTab === 'manage' ? 'is-active' : ''} onClick={() => setActiveTab('manage')}><FiUserCheck /> Manage <span>{data.members?.length || 0}</span></button> : null}</nav>{error ? <CircleFeedback message={error} linkedSchedule={(data.schedules || []).find((schedule) => schedule.id === searchParams.get('join'))} dismiss={() => setError('')} viewSchedule={() => { setActiveTab('schedule'); setError('') }} /> : null}</div>
            {activeTab === 'chat' ? <ChatPanel messages={data.messages || []} renderMessage={renderMessage} endRef={endRef} body={body} setBody={setBody} working={working} sendMessage={sendMessage} membershipAlias={membershipAlias} /> : activeTab === 'posts' ? <PostsPanel group={group} posts={data.posts || []} openComposer={() => setShowPostComposer(true)} remove={deletePost} working={working} /> : activeTab === 'schedule' ? <SchedulePanel schedules={upcomingSchedules} draft={scheduleDraft} setDraft={setScheduleDraft} thumbnail={scheduleThumbnail} chooseThumbnail={chooseScheduleThumbnail} removeThumbnail={() => setScheduleThumbnail(null)} showForm={showScheduleForm} setShowForm={setShowScheduleForm} save={saveSchedule} working={working} openRoom={prepareAudioRoom} respond={respondToSchedule} decideAdmission={decideAdmission} copyLink={copyScheduleLink} linkCopiedId={linkCopiedId} canManage={group.viewerCanManage} /> : <ManagementPanel members={data.members || []} messages={data.messages || []} working={working} changeRole={changeMemberRole} removeMember={removeMember} removeMessage={deleteMessage} />}
            <footer><span><FiShield /> Be kind, avoid graphic details, and do not give medical instructions.</span><Link to="/campus/wellbeing?open=booking">Need a counselor instead?</Link></footer>
          </section>}
        </>}
      </section>
      <aside className="campus-rail support-circle-rail"><section><span>Circle boundaries</span><h2>Safety makes honesty possible.</h2><ul>{(group?.rules || []).map((rule) => <li key={rule}><FiCheck /> {rule}</li>)}</ul></section><section className="is-care"><FiShield /><div><span>Peer support</span><h2>This is not clinical care.</h2><p>Members can listen and share experience. Diagnosis and treatment belong with qualified professionals.</p></div></section><Link className="support-circle-human" to="/campus/wellbeing?open=booking"><span>Talk to a real person</span><strong>Request human support</strong></Link></aside>
    </div></div>
    {group?.viewerCanManage ? <ExplorePostComposer
      allowSpaceTags={false}
      eyebrow="Circle voice"
      fixedOrganizer={{ id: group.id, type: 'campus', name: group.name, handle: 'Support circle', avatarUrl: splashImageUrl }}
      identity={{ name: group.name, avatarUrl: splashImageUrl }}
      isOpen={showPostComposer}
      onClose={() => setShowPostComposer(false)}
      onPublish={publishPost}
      placeholder={`Share an update, resource or campus moment from ${group.name}…`}
      publishLabel="Publish as circle"
      title={`Post as ${group.name}`}
    /> : null}
    {audioStage !== 'closed' ? <AudioDialog room={audioRoom} stage={audioStage} close={closeAudioRoom} enter={enterAudioRoom} loading={audioLoading} accepted={audioDisclosureAccepted} setAccepted={setAudioDisclosureAccepted} useAlias={audioUseAlias} setUseAlias={setAudioUseAlias} membershipAlias={membership?.alias} shieldEnabled={voiceShieldEnabled} setShieldEnabled={setVoiceShieldEnabled} profileId={voiceProfileId} setProfileId={setVoiceProfileId} /> : null}
  </main>
}

function CircleFeedback({ message, linkedSchedule, dismiss, viewSchedule }) {
  const isNotStarted = message.toLowerCase().includes('scheduled meeting starts')
  const isEnded = message.toLowerCase().includes('scheduled call has ended')
  const title = isNotStarted ? 'This call has not started yet' : isEnded ? 'This call has ended' : 'Something needs your attention'
  const detail = isNotStarted && linkedSchedule
    ? `${linkedSchedule.title} opens ${formatScheduleTime(linkedSchedule.startsAt)}. RSVP is optional—use this link again when the meeting begins.`
    : isEnded ? 'The scheduled meeting window is over. Check the schedule for another session.' : message
  return <aside className={`support-circle-feedback${isNotStarted || isEnded ? ' is-schedule' : ''}`} role={isNotStarted || isEnded ? 'status' : 'alert'}><span>{isNotStarted ? <FiClock /> : isEnded ? <FiCalendar /> : <FiAlertCircle />}</span><div><strong>{title}</strong><p>{detail}</p></div><div className="support-circle-feedback-actions">{isNotStarted || isEnded ? <button type="button" onClick={viewSchedule}>View schedule</button> : null}<button type="button" className="is-dismiss" onClick={dismiss} aria-label="Dismiss notice"><FiX /></button></div></aside>
}

function JoinPanel({ alias, setAlias, anonymous, setAnonymous, working, join }) {
  return <section className="support-circle-join"><div><span>Before entering</span><h2>Choose how you show up.</h2><p>An alias is recommended and on by default, but you can participate with your student profile if you prefer.</p></div><label className="support-circle-switch"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /><span><strong>Use a circle alias</strong><small>{anonymous ? 'Members will not see your student profile.' : 'Members will see your name and student profile.'}</small></span></label>{anonymous ? <label><span>Choose your circle alias</span><input value={alias} minLength="2" maxLength="40" onChange={(event) => setAlias(event.target.value)} /><button type="button" onClick={() => setAlias(makeAlias())}>Try another</button></label> : <aside className="support-circle-identity-warning"><FiUsers /><span>Your real profile identity will be visible inside this circle.</span></aside>}<button type="button" disabled={working || (anonymous && alias.trim().length < 2)} onClick={join}>{working ? 'Joining…' : 'Join this circle'} <FiHeart /></button></section>
}

function ChatPanel({ messages, renderMessage, endRef, body, setBody, working, sendMessage, membershipAlias }) {
  return <><div className="support-circle-messages">{messages.length ? messages.map(renderMessage) : <section className="support-circle-empty"><FiMessageCircle /><h3>This conversation is just beginning.</h3><p>You can share how today feels, ask what helped someone else, or simply let the circle know you’re here.</p></section>}<div ref={endRef} /></div><form onSubmit={sendMessage}><span>{membershipAlias?.slice(0, 1)}</span><textarea value={body} maxLength="2000" onChange={(event) => setBody(event.target.value)} placeholder={`Share as ${membershipAlias}…`} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} /><button type="submit" disabled={working || !body.trim()} aria-label="Share with circle"><FiSend /></button></form></>
}

function PostsPanel({ group, posts, openComposer, remove, working }) {
  const identity = { id: group.id, profileType: 'support-circle', name: group.name, handle: 'Support circle', avatar: getSupportCircleSplash(group), campus: group.campus || null }
  return <section className="support-circle-posts" role="tabpanel"><header><div><span>Explore Campus</span><h3>Posts from this circle</h3><p>Updates, media, events and polls publish to Explore Campus under the circle’s identity.</p></div>{group.viewerCanManage ? <div className="support-circle-post-publish"><em><FiShield /> Admin publishing</em><button type="button" disabled={working} onClick={openComposer}><FiPlus /> New post</button></div> : null}</header><aside className="support-circle-post-privacy"><FiLock /><span><strong>Published as {group.name}</strong><small>The publishing admin’s profile and circle alias are never attached.</small></span></aside><div className="support-circle-post-list">{posts.length ? <ManagedEntityFeed identity={identity} onTakeDownPost={(post) => remove(post.id)} posts={posts} /> : <section className="support-circle-post-empty"><FiFileText /><h4>No circle posts yet.</h4><p>{group.viewerCanManage ? 'Publish the first update, photo, event or poll for Explore Campus.' : 'Circle administrators have not published an Explore Campus post yet.'}</p>{group.viewerCanManage ? <button type="button" onClick={openComposer}><FiPlus /> Create first post</button> : null}</section>}</div></section>
}

function ManagementPanel({ members, messages, working, changeRole, removeMember, removeMessage }) {
  const memberMessages = messages.filter((message) => message.type === 'message')
  return <section className="support-circle-management" role="tabpanel"><header><div><span>Circle management</span><h3>Care for the people and the conversation</h3><p>Promote moderators, remove members and handle messages that cross circle boundaries.</p></div><aside><FiLock /><span><strong>Aliases stay private</strong><small>You can manage an alias, but cannot reveal who is behind it.</small></span></aside></header><section><div className="support-circle-management-heading"><div><span>Membership</span><h4>{members.length} active members</h4></div><p>Named members chose to show their profile. Alias members remain alias-only.</p></div><div className="support-circle-member-list">{members.map((member) => <article key={member.id}><span>{member.displayName?.slice(0, 1)}</span><div><strong>{member.displayName}{member.isViewer ? ' · You' : ''}</strong><small>{member.participationMode === 'named' ? 'Profile name visible' : 'Alias only'} · Joined {formatTime(member.joinedAt)}</small></div><em className={member.role === 'admin' ? 'is-admin' : ''}>{member.isOwner ? 'Owner' : member.role}</em><div className="support-circle-member-actions">{!member.isOwner && !member.isViewer ? <button type="button" disabled={working} onClick={() => changeRole(member.id, member.role === 'admin' ? 'member' : 'admin')}><FiUserCheck /> {member.role === 'admin' ? 'Make member' : 'Make admin'}</button> : null}{!member.isOwner && !member.isViewer ? <button className="is-danger" type="button" disabled={working} onClick={() => removeMember(member.id, member.displayName)}><FiTrash2 /> Remove</button> : null}</div></article>)}</div></section><section><div className="support-circle-management-heading"><div><span>Conversation moderation</span><h4>Recent member messages</h4></div><p>System activity such as calls and schedules is retained as a circle record.</p></div><div className="support-circle-moderation-list">{memberMessages.length ? memberMessages.map((message) => <article key={message.id}><span>{message.authorAlias?.slice(0, 1)}</span><div><strong>{message.authorAlias}</strong><small>{formatTime(message.createdAt)}</small><p>{message.body}</p></div><button type="button" disabled={working} onClick={() => removeMessage(message.id)} aria-label={`Remove message from ${message.authorAlias}`}><FiTrash2 /> Delete</button></article>) : <div className="support-circle-management-empty"><FiMessageCircle /> No member messages to moderate.</div>}</div></section></section>
}

function SchedulePanel({ schedules, draft, setDraft, thumbnail, chooseThumbnail, removeThumbnail, showForm, setShowForm, save, working, openRoom, respond, decideAdmission, copyLink, linkCopiedId, canManage }) {
  const [now, setNow] = useState(INITIAL_CLOCK_TIME)
  useEffect(() => { const timeoutId = window.setTimeout(() => setNow(Date.now()), 0); const intervalId = window.setInterval(() => setNow(Date.now()), 30000); return () => { window.clearTimeout(timeoutId); window.clearInterval(intervalId) } }, [])
  return <section className="support-circle-schedule" role="tabpanel">
    <header><div><span>Circle schedule</span><h3>Sessions and moments to meet</h3><p>{canManage ? 'Plan a session, choose its audience and collect RSVPs.' : 'See upcoming sessions and let the circle know if you can join.'}</p></div>{canManage ? <button type="button" onClick={() => setShowForm((current) => !current)}><FiPlus /> Schedule</button> : null}</header>
    {canManage && showForm ? <form onSubmit={save}>
      <label><span>Type</span><select value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value, createZumbarlLink: event.target.value === 'audio_circle' ? current.createZumbarlLink : false }))}><option value="audio_circle">Audio circle</option><option value="event">Circle event</option></select></label>
      <label><span>Title</span><input required minLength="3" maxLength="120" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Sunday evening check-in" /></label>
      <label><span>Starts</span><input required type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
      <label><span>Ends <em>Optional</em></span><input type="datetime-local" min={draft.startsAt} value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
      <label className="is-wide"><span>Location <em>Optional</em></span><input maxLength="160" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder={draft.kind === 'audio_circle' ? 'Online audio circle' : 'e.g. Student centre, room 4'} /></label>
      <label className="is-wide"><span>What should people expect? <em>Optional</em></span><textarea maxLength="500" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
      <fieldset className="support-circle-schedule-audience"><legend>Audience and visibility</legend><label><input type="checkbox" checked={draft.membersOnly} onChange={(event) => setDraft((current) => ({ ...current, membersOnly: event.target.checked }))} /><span><strong><FiLock /> Members only</strong><small>Only circle members can RSVP and attend.</small></span></label><label><input type="checkbox" checked={draft.publishToExplore} onChange={(event) => setDraft((current) => ({ ...current, publishToExplore: event.target.checked }))} /><span><strong><FiGlobe /> Publish on Explore Campus</strong><small>Create an event post under the circle’s identity.</small></span></label>{draft.kind === 'audio_circle' ? <label className="is-call-link"><input type="checkbox" checked={draft.createZumbarlLink} onChange={(event) => setDraft((current) => ({ ...current, createZumbarlLink: event.target.checked }))} /><span><strong><FiLink /> Create a Zumbarl call link</strong><small>Generate a reusable link that opens this audio circle with the usual alias and Voice Shield choices.</small></span></label> : null}</fieldset>
      {draft.kind === 'audio_circle' && draft.createZumbarlLink ? <fieldset className="support-circle-join-policy"><legend>How should people enter the call?</legend><label className={draft.joinPolicy === 'open' ? 'is-selected' : ''}><input type="radio" name="joinPolicy" value="open" checked={draft.joinPolicy === 'open'} onChange={(event) => setDraft((current) => ({ ...current, joinPolicy: event.target.value }))} /><span><strong>Open link</strong><small>Eligible attendees join immediately during the meeting.</small></span></label><label className={draft.joinPolicy === 'host_approval' ? 'is-selected' : ''}><input type="radio" name="joinPolicy" value="host_approval" checked={draft.joinPolicy === 'host_approval'} onChange={(event) => setDraft((current) => ({ ...current, joinPolicy: event.target.value }))} /><span><strong>Host approval</strong><small>People wait until the owner or an admin admits them.</small></span></label></fieldset> : null}
      {draft.publishToExplore ? <section className="support-circle-schedule-thumbnail"><div><span>Explore Campus thumbnail <em>Optional</em></span><p>Upload an image for this event post. It will not replace the circle’s wellness artwork.</p><label><FiImage /><strong>{thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}</strong><input type="file" accept="image/*" onChange={(event) => { chooseThumbnail(event.target.files?.[0]); event.target.value = '' }} /></label></div>{thumbnail ? <figure><img src={thumbnail.previewUrl} alt="Explore Campus event thumbnail preview" /><button type="button" onClick={removeThumbnail}><FiTrash2 /> Remove</button></figure> : null}</section> : null}
      <div><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" disabled={working}>{working ? 'Saving…' : 'Add to schedule'}</button></div>
    </form> : null}
    <div className="support-circle-schedule-list">{schedules.length ? schedules.map((item) => {
      const meetingLive = isMeetingLive(item, now)
      const canJoinCall = meetingLive
      return <article key={item.id}>
      <span>{item.kind === 'audio_circle' ? <FiHeadphones /> : <FiCalendar />}</span>
      <div className="support-circle-schedule-details"><div className="support-circle-schedule-badges"><small>{item.kind === 'audio_circle' ? 'Audio circle' : 'Circle event'}</small><em>{item.membersOnly !== false ? <><FiLock /> Members only</> : <><FiUsers /> Open RSVP</>}</em>{item.publishToExplore ? <em className="is-explore"><FiGlobe /> Explore Campus</em> : null}{item.meetingPath ? <em className="is-call"><FiLink /> {item.joinPolicy === 'host_approval' ? 'Host admits' : 'Open call'}</em> : null}{item.meetingPath && meetingLive ? <em className="is-live">Live now</em> : null}</div><h4>{item.title}</h4><p>{item.description || 'A low-pressure space to meet and connect.'}</p><time><FiClock /> {formatScheduleTime(item.startsAt)}{item.endsAt ? ` – ${new Date(item.endsAt).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}` : ''}{item.location ? ` · ${item.location}` : ''}</time></div>
      <div className="support-circle-schedule-actions"><div role="group" aria-label={`RSVP for ${item.title}`}><button type="button" className={item.viewerResponse === 'GOING' ? 'is-selected' : ''} disabled={working} onClick={() => respond(item.id, 'GOING')}><FiCheck /> Going</button><button type="button" className={item.viewerResponse === 'INTERESTED' ? 'is-selected' : ''} disabled={working} onClick={() => respond(item.id, 'INTERESTED')}><FiHeart /> Interested</button></div><small>{item.goingCount || 0} going{item.interestedCount ? ` · ${item.interestedCount} interested` : ''}</small>{item.meetingPath && (canJoinCall || canManage) ? <div className="support-circle-call-actions">{canJoinCall ? <button type="button" className="is-join" disabled={working} onClick={() => openRoom(item.id)}><FiHeadphones /> Join call</button> : null}{canManage ? <button type="button" disabled={working} onClick={() => copyLink(item)}><FiCopy /> {linkCopiedId === item.id ? 'Copied' : 'Copy link'}</button> : null}</div> : !item.meetingPath && item.kind === 'audio_circle' && canJoinCall ? <button type="button" disabled={working} onClick={() => openRoom()}>Open room</button> : null}</div>
      {canManage && item.joinPolicy === 'host_approval' && item.admissionRequests?.length ? <section className="support-circle-admission-queue"><header><span><FiUsers /></span><div><strong>Waiting room</strong><small>{item.admissionRequests.length} waiting</small></div></header>{item.admissionRequests.map((request) => <div key={request.studentId}><span>{request.displayName?.slice(0, 1)}</span><strong>{request.displayName}</strong><button type="button" disabled={working} onClick={() => decideAdmission(item.id, request.studentId, 'denied')}><FiX /> Deny</button><button type="button" className="is-admit" disabled={working} onClick={() => decideAdmission(item.id, request.studentId, 'admitted')}><FiUserCheck /> Admit</button></div>)}</section> : null}
    </article>
    }) : <section className="support-circle-schedule-empty"><FiCalendar /><h4>Nothing scheduled yet.</h4><p>{canManage ? 'Create the first audio circle or group moment.' : 'Circle administrators have not added a session yet.'}</p></section>}</div>
  </section>
}

function AudioDialog({ room, stage, close, enter, loading, accepted, setAccepted, useAlias, setUseAlias, membershipAlias, shieldEnabled, setShieldEnabled, profileId, setProfileId }) {
  return <div className="support-circle-audio-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className={`support-circle-audio-dialog${stage === 'active' ? ' is-active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="support-circle-audio-title"><header><div><span><FiHeadphones /></span><div><small>Circle audio room</small><h2 id="support-circle-audio-title">{room?.groupName}</h2></div></div><button type="button" onClick={close} aria-label="Close audio room"><FiX /></button></header>{stage === 'waiting' ? <div className="support-circle-audio-waiting"><span><FiClock /></span><h3>Waiting for a host to let you in</h3><p>Your request is visible to the circle owner and admins. You’ll enter the privacy lobby automatically when one of them admits you.</p><div><i /><small>Waiting for approval…</small></div><button type="button" onClick={close}>Leave waiting room</button></div> : stage === 'disclosure' ? <div className="support-circle-audio-lobby"><div className="support-circle-audio-intro"><FiMic /><div><h3>Choose how you enter this audio circle.</h3><p>Audio only. Alias and Voice Shield are recommended and enabled by default, but both are your choice.</p></div></div><section className="support-circle-audio-privacy"><label><input type="checkbox" checked={useAlias} onChange={(event) => setUseAlias(event.target.checked)} /><span><strong>Use my circle alias</strong><small>{useAlias ? `Members see ${membershipAlias || 'your alias'}.` : 'Members see your student profile name.'}</small></span></label><label><input type="checkbox" checked={shieldEnabled} onChange={(event) => { setShieldEnabled(event.target.checked); setAccepted(false) }} /><span><strong>Disguise my voice</strong><small>{shieldEnabled ? 'Your microphone is transformed locally before it is sent.' : 'Your natural voice will be heard and may be recognized.'}</small></span></label></section>{shieldEnabled ? <fieldset className="voice-shield-profile-picker"><legend>Choose a voice feel</legend><p>The exact transformation changes subtly each room. These names describe the sound—not gender.</p><div>{VOICE_SHIELD_PROFILES.map((profile) => <button type="button" key={profile.id} className={profileId === profile.id ? 'is-selected' : ''} onClick={() => setProfileId(profile.id)} aria-pressed={profileId === profile.id}><span><FiShield /></span><strong>{profile.label}</strong><small>{profile.description}</small></button>)}</div></fieldset> : <aside className="support-circle-natural-warning"><FiMic /><div><strong>Voice Shield is off.</strong><p>Your natural voice will be sent to every participant in the room.</p></div></aside>}<aside className={shieldEnabled ? 'is-shielded' : 'is-natural'}><FiShield /><div><span>{shieldEnabled ? 'Voice Shield beta' : 'Privacy reminder'}</span><strong>{shieldEnabled ? 'Your natural microphone track will not enter the room.' : 'Using an alias does not hide your natural voice.'}</strong><p>Accent, cadence, background sounds, or details you share can still identify you, and another participant could record externally.</p></div></aside><label><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I understand these settings and that Zumbarl cannot guarantee anonymity.</span></label><footer><button type="button" onClick={close}>Not now</button><button type="button" disabled={!accepted || loading} onClick={enter}>{shieldEnabled ? <FiShield /> : <FiMic />} {loading ? 'Connecting…' : `Enter ${shieldEnabled ? 'with Voice Shield' : 'with natural voice'}`}</button></footer></div> : <VoiceShieldConference room={room} profileId={profileId} shieldEnabled={shieldEnabled} onLeave={close} />}</section></div>
}
