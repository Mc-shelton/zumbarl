import { FiBell, FiCheck, FiCheckCircle, FiClock, FiDownload, FiFolder, FiRefreshCw, FiStar } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import ProjectDeliverablesStatus from './ProjectDeliverablesStatus'

function formatSubmittedAt(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function SubmittedPanel({
  activeProject,
  onOverview,
  onResubmit,
}) {
  const canOpenMessages = hasAccess(ACCESS_KEYS.projects.messages)
  const isBackedProject = activeProject?.source === 'database'
  if (!isBackedProject) return null
  const deliverable = activeProject.latestDeliverable
  const opportunityDetails = Array.isArray(activeProject.details) ? activeProject.details : []
  const hasOpportunityDetails = activeProject.overview || opportunityDetails.length
  const isApproved = deliverable?.status === 'approved'
  const isChangesRequested = deliverable?.status === 'changes_requested'

  const submittedFilesList = deliverable?.files || []
  const workTitle = deliverable?.title || 'Submitted work'
  const workDescription = deliverable?.notes || 'No submission note was provided.'
  const feedbackRequest = deliverable?.feedbackRequest || ''
  const submittedAt = formatSubmittedAt(deliverable?.submittedAt)
  const decisionFeedback = deliverable?.feedback

  const statusCopy = isApproved
    ? 'Work approved and endorsement recorded.'
    : isChangesRequested
      ? 'The client requested changes to this submission.'
      : 'Your work has been submitted and is now pending review.'

  return (
    <>
      <section className="project-card project-success-card">
        <div className="project-success-mark">
          <FiCheck aria-hidden="true" />
        </div>
        <h2>{isApproved ? 'Work Approved' : isChangesRequested ? 'Changes Requested' : 'Work Submitted Successfully!'}</h2>
        <p>{statusCopy} Client: <strong>{activeProject.client}</strong>.</p>

        <div className="project-success-summary">
          <article>
            <FiClock aria-hidden="true" />
            <span>
              <strong>Submitted on</strong>
              {submittedAt}
            </span>
          </article>
          <article>
            <FiClock aria-hidden="true" />
            <span>
              <strong>Next step</strong>
              {isApproved ? 'Payment and endorsement' : isChangesRequested ? 'Revise and resubmit' : 'Client Review'}
            </span>
          </article>
          <article>
            <FiBell aria-hidden="true" />
            <span>
              <strong>You'll be notified</strong>
              {isApproved || isChangesRequested ? 'The client has reviewed your work' : 'Once the client reviews your work'}
            </span>
          </article>
        </div>

        {(isApproved || isChangesRequested) && decisionFeedback ? (
          <div className="project-review-outcome" role="status">
            <FiStar aria-hidden="true" />
            <div>
              <strong>{isApproved ? 'Approved — client feedback' : 'Requested changes'}</strong>
              <p>{decisionFeedback}</p>
            </div>
          </div>
        ) : null}

        {isChangesRequested && onResubmit ? (
          <div className="project-review-decision-card">
            <div>
              <strong>Revise your submission</strong>
              <p>Address the client&apos;s feedback and submit an updated version of your work.</p>
            </div>
            <footer>
              <button type="button" className="project-primary-btn" onClick={onResubmit}>
                <FiRefreshCw aria-hidden="true" />
                Resubmit Work
              </button>
            </footer>
          </div>
        ) : null}

        {!isApproved && !isChangesRequested ? (
          <div className="project-next-list">
            <strong>What happens next?</strong>
            {['The client will review your submission.', 'They may approve it, request changes, or ask for revisions.', "You'll be notified of their feedback.", 'The activity log will capture approval and next steps.'].map((item) => (
              <p key={item}>
                <FiCheckCircle aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        ) : null}

        <footer>
          {canOpenMessages ? <button type="button" className="project-soft-btn">Go to Messages</button> : null}
          <button type="button" className="project-primary-btn" onClick={onOverview}>View Project Overview</button>
        </footer>
      </section>

      <section className="project-submit-summary">
        <article className="project-card">
          <h2>Submission Summary</h2>
          <dl>
            <div>
              <dt>Work Title</dt>
              <dd>{workTitle}</dd>
            </div>
            {deliverable?.scopeItemLabel ? (
              <div>
                <dt>Deliverable</dt>
                <dd>{deliverable.scopeItemLabel}</dd>
              </div>
            ) : null}
            <div>
              <dt>Submitted Files</dt>
              <dd>{submittedFilesList.length} file{submittedFilesList.length === 1 ? '' : 's'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{workDescription}</dd>
            </div>
            <div>
              <dt>Feedback Request</dt>
              <dd>{feedbackRequest}</dd>
            </div>
          </dl>
        </article>

        <article className="project-card">
          <header>
            <h2>Submitted Files</h2>
            <button type="button">
              Download All
              <FiDownload aria-hidden="true" />
            </button>
          </header>
          {submittedFilesList.length ? submittedFilesList.map((file) => (
            <p key={file.name}>
              <FiFolder aria-hidden="true" />
              <strong>{file.name}</strong>
              <span>{file.size}</span>
              {file.url ? (
                <a href={file.url} target="_blank" rel="noreferrer" aria-label={`Download ${file.name}`}>
                  <FiDownload aria-hidden="true" />
                </a>
              ) : <FiDownload aria-hidden="true" />}
            </p>
          )) : <p className="project-empty-note">No files were attached to this submission.</p>}
        </article>
      </section>

      <ProjectDeliverablesStatus project={activeProject} onSubmit={onResubmit} />

      {hasOpportunityDetails ? (
        <section className="project-card project-opportunity-details">
          <h2>Opportunity Details</h2>
          {activeProject.overview ? <p>{activeProject.overview}</p> : null}
          {opportunityDetails.length ? (
            <div className="project-detail-list">
              {opportunityDetails.map((detail) => (
                <article key={detail.label}>
                  <FiCheckCircle aria-hidden="true" />
                  <div>
                    <span>{detail.label}</span>
                    <strong>{detail.value}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          <dl>
            <div><dt>Category</dt><dd>{activeProject.category || 'Not specified'}</dd></div>
            <div><dt>Skills</dt><dd>{activeProject.skills || 'Not specified'}</dd></div>
            <div><dt>Budget</dt><dd>{activeProject.budget}</dd></div>
            <div><dt>Deadline</dt><dd>{activeProject.deadline}</dd></div>
            {activeProject.paymentTerms ? <div><dt>Payment Terms</dt><dd>{activeProject.paymentTerms}</dd></div> : null}
            {activeProject.acceptanceCriteria ? <div><dt>Acceptance Criteria</dt><dd>{activeProject.acceptanceCriteria}</dd></div> : null}
          </dl>
        </section>
      ) : null}
    </>
  )
}

export default SubmittedPanel
