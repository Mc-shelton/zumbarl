import { useEffect, useState } from 'react'
import { FiCalendar, FiCheckCircle, FiClock, FiExternalLink, FiVideo, FiXCircle } from 'react-icons/fi'
import { useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { readStudentInterview, respondToStudentInterview } from '../features/opportunities/services/interviewService'
import '../styles/campus.css'
import '../styles/opportunities.css'

function formatInterviewDate(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  }).format(new Date(value))
}

function StudentInterviewPage() {
  const { interviewId } = useParams()
  const [interview, setInterview] = useState(null)
  const [selectedAction, setSelectedAction] = useState('rsvp')
  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    readStudentInterview(interviewId)
      .then((response) => {
        if (isCurrent) setInterview(response)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Could not load this interview.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [interviewId])

  async function submitResponse() {
    if (selectedAction !== 'rsvp' && !note.trim()) {
      setError('Add a note when suggesting another time or cancelling.')
      return
    }
    if (selectedAction === 'propose_new_time' && (!proposedDate || !proposedTime)) {
      setError('Choose the date and time you want to suggest.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const response = await respondToStudentInterview(interviewId, {
        action: selectedAction,
        note: note.trim() || undefined,
        proposedAt: selectedAction === 'propose_new_time'
          ? new Date(`${proposedDate}T${proposedTime}:00`).toISOString()
          : undefined,
      })
      setInterview((current) => ({ ...current, ...response.interview }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save your response.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="campus-page opportunities-page student-interview-page">
      <Seo
        title="Interview Invitation | Zumbarl"
        description="Review and respond to your Zumbarl opportunity interview."
        path={`/campus/interviews/${interviewId}`}
      />
      <div className="campus-stage">
        <div className="campus-shell opportunities-bid-shell">
          <CampusSidebar activeItemId="opportunities" />
          <section className="campus-main opportunities-main student-interview-main">
            {isLoading ? <p className="student-interview-state">Loading interview...</p> : null}
            {!isLoading && error && !interview ? <p className="student-interview-state is-error" role="alert">{error}</p> : null}
            {interview ? (
              <>
                <header className="student-interview-hero">
                  <span><FiVideo aria-hidden="true" /></span>
                  <div>
                    <p>You have been shortlisted</p>
                    <h1>{interview.opportunity.title}</h1>
                    <strong>{interview.opportunity.company}</strong>
                  </div>
                </header>

                <section className="student-interview-card">
                  <header>
                    <div>
                      <h2>Interview details</h2>
                      <p>Review the schedule and let the business know whether it works.</p>
                    </div>
                    <span className={`student-interview-status is-${interview.status}`}>{interview.status.replaceAll('_', ' ')}</span>
                  </header>
                  <dl>
                    <div><dt><FiCalendar aria-hidden="true" /> Date and time</dt><dd>{formatInterviewDate(interview.scheduledAt)}</dd></div>
                    <div><dt><FiClock aria-hidden="true" /> Duration</dt><dd>{interview.durationMinutes} minutes</dd></div>
                    <div><dt>Interview type</dt><dd>{interview.interviewType === 'audio' ? 'Audio call' : 'Video call'}</dd></div>
                    <div><dt>Time zone</dt><dd>{interview.timezone}</dd></div>
                  </dl>
                  {interview.note ? <p className="student-interview-note"><strong>Preparation note</strong>{interview.note}</p> : null}
                  {interview.meetingUrl ? (
                    <a className="student-interview-meeting-link" href={interview.meetingUrl} target="_blank" rel="noreferrer">
                      Open meeting room <FiExternalLink aria-hidden="true" />
                    </a>
                  ) : null}
                </section>

                {['confirmed', 'proposed_new_time', 'cancelled'].includes(interview.status) ? (
                  <section className="student-interview-card student-interview-response-saved">
                    <FiCheckCircle aria-hidden="true" />
                    <div>
                      <h2>Response saved</h2>
                      <p>
                        {interview.status === 'confirmed' ? 'You confirmed that you will attend.' : null}
                        {interview.status === 'proposed_new_time' ? `You suggested ${formatInterviewDate(interview.proposedAt)}.` : null}
                        {interview.status === 'cancelled' ? 'You cancelled this interview.' : null}
                      </p>
                      {interview.studentResponseNote ? <blockquote>{interview.studentResponseNote}</blockquote> : null}
                    </div>
                  </section>
                ) : (
                  <section className="student-interview-card student-interview-response">
                    <header>
                      <div>
                        <h2>Respond to the interview</h2>
                        <p>Choose one response. A note is required unless you RSVP.</p>
                      </div>
                    </header>
                    <div className="student-interview-action-grid">
                      <button type="button" className={selectedAction === 'rsvp' ? 'is-active' : ''} onClick={() => setSelectedAction('rsvp')}>
                        <FiCheckCircle aria-hidden="true" /><strong>RSVP</strong><span>I will attend</span>
                      </button>
                      <button type="button" className={selectedAction === 'propose_new_time' ? 'is-active' : ''} onClick={() => setSelectedAction('propose_new_time')}>
                        <FiClock aria-hidden="true" /><strong>Suggest new time</strong><span>Request another slot</span>
                      </button>
                      <button type="button" className={selectedAction === 'cancel' ? 'is-active' : ''} onClick={() => setSelectedAction('cancel')}>
                        <FiXCircle aria-hidden="true" /><strong>Cancel</strong><span>Decline this interview</span>
                      </button>
                    </div>
                    {selectedAction === 'propose_new_time' ? (
                      <div className="student-interview-proposed-time">
                        <label><span>Suggested date</span><input type="date" value={proposedDate} onChange={(event) => setProposedDate(event.target.value)} /></label>
                        <label><span>Suggested time</span><input type="time" value={proposedTime} onChange={(event) => setProposedTime(event.target.value)} /></label>
                      </div>
                    ) : null}
                    {selectedAction !== 'rsvp' ? (
                      <label className="student-interview-response-note">
                        <span>Note <b>*</b></span>
                        <textarea value={note} maxLength={1000} placeholder="Explain your request to the business..." onChange={(event) => setNote(event.target.value)} />
                      </label>
                    ) : null}
                    {error ? <p className="student-interview-form-error" role="alert">{error}</p> : null}
                    <button type="button" className="opportunities-detail-bid-btn" disabled={isSubmitting} onClick={submitResponse}>
                      {isSubmitting ? 'Saving response...' : 'Send response'}
                    </button>
                  </section>
                )}
              </>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}

export default StudentInterviewPage
