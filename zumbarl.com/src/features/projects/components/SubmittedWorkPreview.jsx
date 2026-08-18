import { useState } from 'react'
import { FiDownload, FiFileText, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

const SUBMISSION_STATUS = {
  approved: { label: 'Approved', tone: 'is-approved' },
  changes_requested: { label: 'Changes requested', tone: 'is-changes' },
  submitted: { label: 'Under review', tone: 'is-review' },
  superseded: { label: 'Replaced by revision', tone: 'is-superseded' },
}

const SUBMISSION_KIND = {
  final: 'Final deliverable',
  progress: 'Progress update',
  revision: 'Revision',
}

function formatSubmissionDate(value, includeTime = true) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (!includeTime) return dateLabel
  return `${dateLabel} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function getSubmissionTarget(submission) {
  return submission.scopeItemLabel
    || (submission.milestoneId ? 'Project milestone' : 'Whole project')
}

function buildAttemptMeta(submissions) {
  const groups = submissions.reduce((result, submission) => {
    const key = submission.milestoneId || submission.scopeItemId || 'whole-project'
    result[key] = result[key] || []
    result[key].push(submission)
    return result
  }, {})
  const meta = {}
  Object.values(groups).forEach((group) => {
    const ordered = [...group].sort((left, right) => (
      new Date(left.submittedAt || 0).getTime() - new Date(right.submittedAt || 0).getTime()
    ))
    ordered.forEach((submission, index) => {
      meta[submission.id] = { attempt: index + 1, total: ordered.length }
    })
  })
  return meta
}

function SubmissionPreviewModal({ submission, onClose }) {
  const dialogRef = useDialog({ isOpen: Boolean(submission), onClose })
  if (!submission) return null
  const files = Array.isArray(submission.files) ? submission.files : []
  const status = SUBMISSION_STATUS[submission.status] || {
    label: submission.status || 'Submitted',
    tone: 'is-review',
  }

  return (
    <div className="project-modal-backdrop" role="presentation">
      <section ref={dialogRef} className="project-submission-preview-modal" role="dialog" aria-modal="true" aria-labelledby="submission-preview-title">
        <header>
          <div>
            <span><FiFileText aria-hidden="true" /></span>
            <div>
              <h2 id="submission-preview-title">{submission.title}</h2>
              <p>{getSubmissionTarget(submission)} · {formatSubmissionDate(submission.submittedAt)}</p>
            </div>
          </div>
          <button type="button" aria-label="Close submission preview" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="project-submission-preview-body">
          <dl>
            <div><dt>Submission type</dt><dd>{SUBMISSION_KIND[submission.kind] || 'Work submission'}</dd></div>
            <div><dt>Status</dt><dd><span className={`project-submitted-work-preview-status ${status.tone}`}>{status.label}</span></dd></div>
            {submission.notes ? <div><dt>Description</dt><dd>{submission.notes}</dd></div> : null}
            {submission.feedbackRequest ? <div><dt>Feedback requested</dt><dd>{submission.feedbackRequest}</dd></div> : null}
            {submission.feedback ? <div><dt>Business feedback</dt><dd>{submission.feedback}</dd></div> : null}
          </dl>

          <section>
            <h3>Submitted Files <span>{files.length}</span></h3>
            {files.length ? (
              <div className="project-submission-preview-files">
                {files.map((file, index) => (
                  <article key={`${submission.id}-preview-file-${index}`}>
                    <FiFileText aria-hidden="true" />
                    <div>
                      <strong>{file.name}</strong>
                      <span>{[file.size, file.mimeType].filter(Boolean).join(' · ') || 'Submitted file'}</span>
                    </div>
                    {file.url ? (
                      <a href={file.url} target="_blank" rel="noreferrer">
                        <FiDownload aria-hidden="true" />
                        Open
                      </a>
                    ) : <span>Unavailable</span>}
                  </article>
                ))}
              </div>
            ) : <p>No files were attached to this submission.</p>}
          </section>
        </div>

        <footer>
          <button type="button" className="project-soft-btn" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  )
}

function SubmittedWorkPreview({ embedded = false, limit, onViewAll, submissions = [] }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  if (!submissions.length) return null
  const visibleSubmissions = limit ? submissions.slice(0, limit) : submissions
  const hasMore = visibleSubmissions.length < submissions.length
  const attemptMeta = buildAttemptMeta(submissions)

  return (
    <section className={`${embedded ? '' : 'project-card '}project-submitted-work-preview`}>
      {!embedded ? (
        <header>
          <div>
            <h2>Submitted Work</h2>
            <p>Preview the work and files you have sent to the business for review.</p>
          </div>
          <div className="project-submitted-work-preview-actions">
            <span>{submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}</span>
            {onViewAll ? (
              <button type="button" onClick={onViewAll}>
                {hasMore ? `View all ${submissions.length}` : 'Open workspace'}
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <div className="project-submitted-work-business-list">
        {visibleSubmissions.map((submission) => {
          const status = SUBMISSION_STATUS[submission.status] || {
            label: submission.status || 'Submitted',
            tone: 'is-review',
          }
          const files = Array.isArray(submission.files) ? submission.files : []
          const meta = attemptMeta[submission.id]

          return (
            <article
              key={submission.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSubmission(submission)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedSubmission(submission)
                }
              }}
            >
              <div className="project-submitted-work-business-owner">
                <span><FiFileText aria-hidden="true" /></span>
                <div>
                  <strong>Your submission</strong>
                  <small>{getSubmissionTarget(submission)}</small>
                </div>
              </div>

              <div className="project-submitted-work-business-info">
                <strong>{submission.title}</strong>
                <span>
                  {files.length} file{files.length === 1 ? '' : 's'} · {formatSubmissionDate(submission.submittedAt, false)}
                </span>
                {meta ? (
                  <em className={meta.attempt > 1 ? 'is-revision' : ''}>
                    {meta.attempt > 1 ? `Revision ${meta.attempt - 1}` : 'First submission'}
                    {meta.total > 1 ? ` (${meta.attempt} of ${meta.total})` : ''}
                  </em>
                ) : null}
              </div>

              <span className={`project-submitted-work-preview-status ${status.tone}`}>{status.label}</span>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedSubmission(submission)
                }}
              >
                View
              </button>
            </article>
          )
        })}
      </div>

      <SubmissionPreviewModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
    </section>
  )
}

export default SubmittedWorkPreview
