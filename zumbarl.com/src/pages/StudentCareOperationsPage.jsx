import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiActivity, FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiHeart, FiRefreshCw, FiShield, FiUserCheck } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import ProfileAvatar from '../components/ui/ProfileAvatar'
import { ACCESS_KEYS, hasAccess } from '../features/auth/roleConfig'
import { readStudentCareOperations, reviewStudentCareCircle, updateStudentCareCase, updateStudentCareEnrollment } from '../features/community/services/studentCareOperationsService'
import '../styles/student-care-operations.css'

const STATUS_LABELS = { in_review: 'In review', no_show: 'No show' }
function labelStatus(value = '') { return STATUS_LABELS[value] || value.replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase()) }
function when(value) { return value ? new Date(value).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled' }

function StudentCareOperationsPage() {
  const canOpenAdministration = hasAccess(ACCESS_KEYS.platform.all)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('pathways')
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { setData(await readStudentCareOperations()) }
    catch (requestError) { setError(requestError.message || 'Student Care operations could not be loaded.') }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(load, 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  const orderedReports = useMemo(() => {
    const priority = { high: 0, normal: 1, low: 2 }
    return [...(data?.reports || [])].sort((left, right) => (priority[left.urgency] ?? 1) - (priority[right.urgency] ?? 1) || new Date(right.createdAt) - new Date(left.createdAt))
  }, [data?.reports])

  async function changeCase(type, id, payload) {
    setWorkingId(id); setError(''); setNotice('')
    try { await updateStudentCareCase(type, id, payload); setNotice('The support record was updated.'); await load() }
    catch (requestError) { setError(requestError.message || 'The support record could not be updated.') }
    finally { setWorkingId('') }
  }

  async function changeEnrollment(id, status) {
    const studentVisibleNote = window.prompt('Student-visible update (optional):', status === 'active' ? 'Your care pathway is active. The support team will contact you with the next step.' : '')
    if (studentVisibleNote === null) return
    setWorkingId(id); setError(''); setNotice('')
    try { await updateStudentCareEnrollment(id, { status, studentVisibleNote: studentVisibleNote.trim() || undefined }); setNotice('The care pathway was updated and recorded in its timeline.'); await load() }
    catch (requestError) { setError(requestError.message || 'The care pathway could not be updated.') }
    finally { setWorkingId('') }
  }

  async function reviewCircle(item, status) {
    const moderationOwner = window.prompt('Verified moderation owner:', item.payload?.moderationOwner || 'Campus Student Affairs')
    if (!moderationOwner?.trim()) return
    const note = window.prompt('Review note shared with the creator:', status === 'active' ? 'Approved with a verified campus moderation owner.' : 'This circle cannot open until its safeguarding plan is revised.')
    if (!note?.trim()) return
    setWorkingId(item.id); setError(''); setNotice('')
    try { await reviewStudentCareCircle(item.id, { status, moderationOwner: moderationOwner.trim(), note: note.trim() }); setNotice(`The support circle was ${status === 'active' ? 'approved' : 'rejected'}.`); await load() }
    catch (requestError) { setError(requestError.message || 'The support circle review could not be saved.') }
    finally { setWorkingId('') }
  }

  return <main className="student-care-ops-page">
    <Seo title="Student Care Operations | Zumbarl" description="Restricted Student Affairs and wellbeing support operations." path="/admin/student-care" />
    <section className="student-care-ops-shell">
      <header className="student-care-ops-hero"><div><Link to={canOpenAdministration ? '/admin/super-admin' : '/'}><FiArrowLeft /> {canOpenAdministration ? 'Administration' : 'Zumbarl home'}</Link><span>Restricted support workspace</span><h1>Student Care Operations</h1><p>Move private requests from first contact to an owned plan, confirmed appointment and accountable follow-up.</p></div><aside><FiShield /><strong>Need-to-know access</strong><small>Use only for care coordination and safeguarding.</small></aside></header>
      {notice ? <p className="student-care-ops-notice"><FiCheckCircle /> {notice}</p> : null}
      {error ? <p className="student-care-ops-error">{error}</p> : null}
      <section className="student-care-ops-metrics"><article><FiHeart /><span><strong>{data?.summary?.openReports || 0}</strong> open requests</span></article><article><FiCalendar /><span><strong>{data?.summary?.requestedBookings || 0}</strong> appointments to confirm</span></article><article><FiActivity /><span><strong>{data?.summary?.activeEnrollments || 0}</strong> active pathways</span></article><article><FiUserCheck /><span><strong>{data?.summary?.followUpsNeeded || 0}</strong> follow-ups requested</span></article></section>
      <nav className="student-care-ops-tabs" aria-label="Student Care queues"><button type="button" className={tab === 'pathways' ? 'is-active' : ''} onClick={() => setTab('pathways')}>Care pathways <span>{data?.enrollments?.length || 0}</span></button><button type="button" className={tab === 'requests' ? 'is-active' : ''} onClick={() => setTab('requests')}>Support requests <span>{orderedReports.length}</span></button><button type="button" className={tab === 'appointments' ? 'is-active' : ''} onClick={() => setTab('appointments')}>Appointments <span>{data?.bookings?.length || 0}</span></button><button type="button" className={tab === 'circles' ? 'is-active' : ''} onClick={() => setTab('circles')}>Circle reviews <span>{data?.pendingCircles?.length || 0}</span></button><button type="button" onClick={load}><FiRefreshCw /> Refresh</button></nav>

      {tab === 'pathways' ? <section className="student-care-ops-list"><header><div><span>Owned plans</span><h2>Program enrollment and follow-up</h2></div><p>Setbacks request care; they never lower a student score or remove access.</p></header>{(data?.enrollments || []).map((item) => <article key={item.id} className={item.progress?.[0]?.status === 'setback' ? 'needs-attention' : ''}><div className="student-care-ops-person"><span><ProfileAvatar src={item.student.avatarUrl} alt="" /></span><div><strong>{item.student.firstName} {item.student.lastName}</strong><small>{item.student.campus.name}</small></div></div><div className="student-care-ops-detail"><small>{item.program.category.replaceAll('_', ' ')}</small><h3>{item.program.name}</h3><p>{item.goal}</p>{item.studentVisibleNote ? <em>{item.studentVisibleNote}</em> : null}</div><div className="student-care-ops-state"><span className={`is-${item.status}`}>{labelStatus(item.status)}</span><small>Step {Math.min(item.currentStep + 1, item.program.steps.length || 1)} of {item.program.steps.length || 1}</small><small><FiClock /> {item.lastCheckInAt ? `Checked in ${when(item.lastCheckInAt)}` : 'No check-in yet'}</small></div><footer><button type="button" disabled={workingId === item.id} onClick={() => changeEnrollment(item.id, 'active')}>Accept plan</button><button type="button" disabled={workingId === item.id} onClick={() => changeEnrollment(item.id, 'paused')}>Pause</button><button type="button" disabled={workingId === item.id} onClick={() => changeEnrollment(item.id, 'completed')}>Complete</button></footer></article>)}{!data?.enrollments?.length ? <p className="student-care-ops-empty">No care pathway requests yet.</p> : null}</section> : null}

      {tab === 'requests' ? <section className="student-care-ops-list"><header><div><span>Human support</span><h2>Prioritized support requests</h2></div><p>High urgency is shown first. This queue is not a replacement for emergency services.</p></header>{orderedReports.map((item) => <article key={item.id} className={item.urgency === 'high' ? 'needs-attention' : ''}><div className="student-care-ops-person"><span><FiHeart /></span><div><strong>{item.anonymous ? 'Anonymous request' : `Student ${item.studentId?.slice(-6) || ''}`}</strong><small>{labelStatus(item.category)}</small></div></div><div className="student-care-ops-detail"><small>{item.urgency} urgency</small><p>{item.message}</p></div><div className="student-care-ops-state"><span className={`is-${item.status}`}>{labelStatus(item.status)}</span><small>{when(item.createdAt)}</small></div><footer><button type="button" disabled={workingId === item.id} onClick={() => changeCase('wellness', item.id, { status: 'in_review', note: 'Support team accepted this request.' })}>Take case</button><button type="button" disabled={workingId === item.id} onClick={() => changeCase('wellness', item.id, { status: 'resolved', note: 'Follow-up completed.' })}>Resolve</button></footer></article>)}</section> : null}

      {tab === 'appointments' ? <section className="student-care-ops-list"><header><div><span>Counselor coordination</span><h2>Appointment requests</h2></div><p>A requested time is not confirmed until a support team member accepts it.</p></header>{(data?.bookings || []).map((item) => <article key={item.id}><div className="student-care-ops-person"><span><FiCalendar /></span><div><strong>Student {item.studentId?.slice(-6) || 'unlinked'}</strong><small>{when(item.scheduledAt)}</small></div></div><div className="student-care-ops-detail"><small>Student note</small><p>{item.reason || 'No additional note provided.'}</p></div><div className="student-care-ops-state"><span className={`is-${item.status}`}>{labelStatus(item.status)}</span></div><footer><button type="button" disabled={workingId === item.id} onClick={() => changeCase('booking', item.id, { status: 'confirmed', note: 'Appointment confirmed by Student Care.' })}>Confirm</button><button type="button" disabled={workingId === item.id} onClick={() => changeCase('booking', item.id, { status: 'completed', note: 'Session completed.' })}>Complete</button><button type="button" disabled={workingId === item.id} onClick={() => changeCase('booking', item.id, { status: 'no_show', note: 'Student did not attend; follow-up required.' })}>No show</button></footer></article>)}</section> : null}

      {tab === 'circles' ? <section className="student-care-ops-list"><header><div><span>Safeguarding review</span><h2>Proposed support circles</h2></div><p>Student-created wellbeing circles remain private until a verified moderation owner accepts responsibility.</p></header>{(data?.pendingCircles || []).map((item) => <article key={item.id}><div className="student-care-ops-person"><span><FiHeart /></span><div><strong>{item.name}</strong><small>{item.campus || 'Campus-wide'}</small></div></div><div className="student-care-ops-detail"><small>Purpose</small><p>{item.purpose}</p></div><div className="student-care-ops-state"><span>Pending review</span><small>{when(item.createdAt)}</small></div><footer><button type="button" disabled={workingId === item.id} onClick={() => reviewCircle(item, 'active')}>Approve</button><button type="button" disabled={workingId === item.id} onClick={() => reviewCircle(item, 'rejected')}>Reject</button></footer></article>)}{!data?.pendingCircles?.length ? <p className="student-care-ops-empty">No support circles are awaiting review.</p> : null}</section> : null}
    </section>
  </main>
}

export default StudentCareOperationsPage
