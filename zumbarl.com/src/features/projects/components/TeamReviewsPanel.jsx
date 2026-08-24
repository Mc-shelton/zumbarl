import { useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiMessageCircle,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Awaiting review' },
  { id: 'changes_requested', label: 'Changes requested' },
  { id: 'approved', label: 'Approved' },
]

const STATUS_META = {
  submitted: { label: 'Awaiting review', tone: 'is-review', icon: FiClock },
  changes_requested: { label: 'Changes requested', tone: 'is-changes', icon: FiRefreshCw },
  approved: { label: 'Approved', tone: 'is-approved', icon: FiCheckCircle },
  superseded: { label: 'Superseded', tone: 'is-muted', icon: FiFileText },
}

const DEFAULT_SCORE_REVIEW = {
  deliveryQualityRating: 4,
  briefAdherenceRating: 4,
  communicationRating: 4,
  conductRating: 4,
  clientSatisfactionRating: 4,
  wouldHireAgain: true,
  deadlineOutcome: 'on_time',
  submissionCompleteness: 'complete',
}

const RATING_FIELDS = [
  ['deliveryQualityRating', 'Work quality'],
  ['briefAdherenceRating', 'Matched the brief'],
  ['communicationRating', 'Communication'],
  ['conductRating', 'Professionalism'],
  ['clientSatisfactionRating', 'Overall satisfaction'],
]

function statusMeta(value) {
  return STATUS_META[String(value || '').toLowerCase()]
    || { label: 'Submitted', tone: 'is-muted', icon: FiFileText }
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

function uniqueOwners(tasks) {
  const owners = tasks.map((task) => task.owner).filter(Boolean)
  return owners.filter((owner, index) => owners.findIndex((candidate) => candidate.id === owner.id) === index)
}

function TeamReviewsPanel({
  isBusinessViewer = false,
  milestones = [],
  onReview,
  reviewState = {},
  submissions = [],
  tasks = [],
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [scoreReview, setScoreReview] = useState(DEFAULT_SCORE_REVIEW)
  const milestoneById = useMemo(() => new Map(milestones.map((item) => [item.id, item.title])), [milestones])
  const submissionRows = useMemo(() => submissions
    .filter((submission) => submission.status !== 'superseded')
    .map((submission) => {
      const coveredTasks = tasks.filter((task) => task.submissionId === submission.id)
      const owners = uniqueOwners(coveredTasks)
      return {
        ...submission,
        coveredTasks,
        owners,
        targetLabel: submission.scopeItemLabel
          || milestoneById.get(submission.milestoneId)
          || 'Project submission',
      }
    })
    .sort((left, right) => new Date(right.submittedAt || 0) - new Date(left.submittedAt || 0)), [milestoneById, submissions, tasks])
  const filteredRows = submissionRows.filter((submission) => {
    if (filter !== 'all' && submission.status !== filter) return false
    const search = query.trim().toLowerCase()
    if (!search) return true
    return `${submission.title} ${submission.targetLabel} ${submission.notes} ${submission.owners.map((owner) => owner.name).join(' ')}`
      .toLowerCase()
      .includes(search)
  })
  const selected = filteredRows.find((submission) => submission.id === selectedId) || filteredRows[0] || null
  const selectedStatus = selected ? statusMeta(selected.status) : null
  const pending = reviewState.pendingId === selected?.id

  async function decide(decision) {
    if (!selected || !onReview) return
    if (decision === 'changes_requested' && !feedback.trim()) return
    const succeeded = await onReview(selected.id, {
      decision,
      feedback: feedback.trim(),
      ...(decision === 'approved' ? {
        review: { ...scoreReview, publicFeedback: feedback.trim() || undefined },
      } : {}),
    })
    if (succeeded) {
      setFeedback('')
      setScoreReview(DEFAULT_SCORE_REVIEW)
    }
  }

  return (
    <section className="team-reviews-panel project-review-workspace">
      <header className="project-review-header">
        <div>
          <h2>Work reviews</h2>
          <p>Review submitted evidence, feedback, and the tasks covered by each submission.</p>
        </div>
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search submissions"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      <nav className="project-review-filters" aria-label="Review filters">
        {FILTERS.map((item) => {
          const count = item.id === 'all'
            ? submissionRows.length
            : submissionRows.filter((submission) => submission.status === item.id).length
          return (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'is-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label} <span>{count}</span>
            </button>
          )
        })}
      </nav>

      {filteredRows.length ? (
        <div className="project-review-layout">
          <aside className="project-card project-review-list" aria-label="Submitted work">
            {filteredRows.map((submission) => {
              const meta = statusMeta(submission.status)
              const StatusIcon = meta.icon
              return (
                <button
                  key={submission.id}
                  type="button"
                  className={submission.id === selected?.id ? 'is-active' : ''}
                  onClick={() => {
                    setSelectedId(submission.id)
                    setFeedback('')
                    setScoreReview(DEFAULT_SCORE_REVIEW)
                  }}
                >
                  <span className={`project-review-list-icon ${meta.tone}`}><StatusIcon aria-hidden="true" /></span>
                  <span>
                    <strong>{submission.title}</strong>
                    <em>{submission.targetLabel}</em>
                    <small>{formatDate(submission.submittedAt)} · {submission.files.length} file{submission.files.length === 1 ? '' : 's'}</small>
                  </span>
                  <i className={meta.tone}>{meta.label}</i>
                </button>
              )
            })}
          </aside>

          <article className="project-card project-review-detail">
            <header>
              <div>
                <span className={`project-review-status ${selectedStatus.tone}`}>{selectedStatus.label}</span>
                <h3>{selected.title}</h3>
                <p>{selected.targetLabel}</p>
              </div>
              <time>{formatDate(selected.submittedAt, true)}</time>
            </header>

            <dl className="project-review-facts">
              <div><dt>Contributors</dt><dd>{selected.owners.map((owner) => owner.name).join(', ') || 'Project team'}</dd></div>
              <div><dt>Tasks covered</dt><dd>{selected.coveredTasks.length}</dd></div>
              <div><dt>Revision</dt><dd>{selected.revisionNumber ? `Revision ${selected.revisionNumber}` : 'Original submission'}</dd></div>
              <div><dt>Evidence</dt><dd>{selected.files.length} file{selected.files.length === 1 ? '' : 's'}</dd></div>
            </dl>

            {(selected.notes || selected.feedbackRequest) ? (
              <section className="project-review-copy">
                <h4>Submission note</h4>
                <p>{selected.notes || selected.feedbackRequest}</p>
              </section>
            ) : null}

            <section className="project-review-covered">
              <h4><FiUsers aria-hidden="true" /> Tasks included</h4>
              {selected.coveredTasks.length ? (
                <ul>{selected.coveredTasks.map((task) => (
                  <li key={task.id}>
                    <span>{task.title}</span>
                    <small>{task.owner?.name || 'Unassigned'} · {task.weight || 1} pt{Number(task.weight || 1) === 1 ? '' : 's'}</small>
                  </li>
                ))}</ul>
              ) : <p>No task records were attached to this submission.</p>}
            </section>

            <section className="project-review-files">
              <h4><FiFileText aria-hidden="true" /> Submitted evidence</h4>
              {selected.files.length ? (
                <ul>{selected.files.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span><strong>{file.name}</strong><small>{file.size || file.mimeType || 'File'}</small></span>
                    {file.url ? (
                      <a href={normalizeZumbarlFileUrl(file.url)} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}>
                        <FiDownload aria-hidden="true" /> Open
                      </a>
                    ) : <em>Unavailable</em>}
                  </li>
                ))}</ul>
              ) : <p>No files were attached.</p>}
            </section>

            {selected.feedback ? (
              <section className={`project-review-existing-feedback ${selectedStatus.tone}`}>
                <h4>Business feedback</h4>
                <p>{selected.feedback}</p>
              </section>
            ) : null}

            {isBusinessViewer && selected.status === 'submitted' ? (
              <section className="project-review-decision">
                <fieldset className="project-score-review">
                  <legend>Rate this completed work</legend>
                  <p>These ratings update the student’s Zumbarl Score after the full project is completed.</p>
                  <div>
                    <label htmlFor={`review-deadline-${selected.id}`}>
                      <span>Deadline outcome</span>
                      <select
                        id={`review-deadline-${selected.id}`}
                        value={scoreReview.deadlineOutcome}
                        onChange={(event) => setScoreReview((current) => ({ ...current, deadlineOutcome: event.target.value }))}
                      >
                        <option value="on_time">Delivered on time</option>
                        <option value="student_delay">Late · student-related</option>
                        <option value="client_delay">Late · client-related</option>
                      </select>
                    </label>
                    <label htmlFor={`review-completeness-${selected.id}`}>
                      <span>Initial submission</span>
                      <select
                        id={`review-completeness-${selected.id}`}
                        value={scoreReview.submissionCompleteness}
                        onChange={(event) => setScoreReview((current) => ({ ...current, submissionCompleteness: event.target.value }))}
                      >
                        <option value="complete">Complete</option>
                        <option value="partial">Partially complete</option>
                        <option value="missing_major">Missing major elements</option>
                      </select>
                    </label>
                    {RATING_FIELDS.map(([field, label]) => (
                      <label key={field} htmlFor={`review-${field}-${selected.id}`}>
                        <span>{label}</span>
                        <select
                          id={`review-${field}-${selected.id}`}
                          value={scoreReview[field]}
                          onChange={(event) => setScoreReview((current) => ({
                            ...current,
                            [field]: Number(event.target.value),
                          }))}
                        >
                          <option value={1}>1 · Poor</option>
                          <option value={2}>2 · Below expectations</option>
                          <option value={3}>3 · Met expectations</option>
                          <option value={4}>4 · Above expectations</option>
                          <option value={5}>5 · Exceptional</option>
                        </select>
                      </label>
                    ))}
                    <label className="project-score-review-repeat" htmlFor={`review-repeat-${selected.id}`}>
                      <input
                        id={`review-repeat-${selected.id}`}
                        type="checkbox"
                        checked={scoreReview.wouldHireAgain}
                        onChange={(event) => setScoreReview((current) => ({ ...current, wouldHireAgain: event.target.checked }))}
                      />
                      <span>I would hire this student again</span>
                    </label>
                  </div>
                </fieldset>
                <label htmlFor={`review-feedback-${selected.id}`}>Feedback</label>
                <textarea
                  id={`review-feedback-${selected.id}`}
                  value={feedback}
                  placeholder="Share a clear approval note or explain what needs to change…"
                  onChange={(event) => setFeedback(event.target.value)}
                />
                <div>
                  <button
                    type="button"
                    className="project-soft-btn"
                    disabled={pending || !feedback.trim()}
                    onClick={() => decide('changes_requested')}
                  >
                    Request changes
                  </button>
                  <button type="button" className="project-primary-btn" disabled={pending} onClick={() => decide('approved')}>
                    <FiCheckCircle aria-hidden="true" /> Approve work
                  </button>
                </div>
              </section>
            ) : null}
            {reviewState.error && reviewState.pendingId === selected.id ? <p className="project-review-error" role="alert">{reviewState.error}</p> : null}
          </article>
        </div>
      ) : (
        <section className="project-card project-review-empty">
          <FiCheckCircle aria-hidden="true" />
          <h3>{submissionRows.length ? 'No reviews match this view' : 'No work is waiting for review'}</h3>
          <p>{submissionRows.length
            ? 'Try another status or clear your search.'
            : 'Submitted task evidence will appear here with its contributors, files, and review history.'}</p>
        </section>
      )}
      {reviewState.notice ? <p className="project-review-notice" role="status">{reviewState.notice}</p> : null}
    </section>
  )
}

export default TeamReviewsPanel
