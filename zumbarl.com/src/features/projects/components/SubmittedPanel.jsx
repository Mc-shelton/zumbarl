import { FiBell, FiCheck, FiCheckCircle, FiClock, FiDownload, FiEdit3, FiFolder, FiRefreshCw, FiStar } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess, hasAnyAccess } from '../../auth/roleConfig'
import { project, submittedFiles as mockSubmittedFiles } from '../data/mockWorkspace'
import ProjectDeliverablesStatus from './ProjectDeliverablesStatus'

function formatSubmittedAt(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function SubmittedPanel({
  activeProject = project,
  onApproveSubmission,
  onOverview,
  onRequestRevision,
  onResubmit,
  payment,
  reviewDecision,
  reviewLocked = false,
}) {
  const canOpenMessages = hasAccess(ACCESS_KEYS.projects.messages)
  const canReviewSubmission = hasAccess(ACCESS_KEYS.business.submissionReview)
  const canEndorse = hasAnyAccess([ACCESS_KEYS.business.endorsements, ACCESS_KEYS.business.rateStudents])

  // Real awarded projects drive the panel from the actual latest deliverable;
  // demo/mock routes keep the canned review-decision flow.
  const isBackedProject = activeProject.source === 'database'
  const deliverable = isBackedProject ? activeProject.latestDeliverable : null
  const opportunityDetails = Array.isArray(activeProject.details) ? activeProject.details : []
  const hasOpportunityDetails = isBackedProject && (activeProject.overview || opportunityDetails.length)
  const isApproved = deliverable ? deliverable.status === 'approved' : reviewDecision?.decision === 'approved'
  const isChangesRequested = deliverable
    ? deliverable.status === 'changes_requested'
    : reviewDecision?.decision === 'revision_requested'

  const submittedFilesList = deliverable
    ? deliverable.files
    : mockSubmittedFiles
  const workTitle = deliverable?.title || 'Social Media Content - May 1st to May 7th'
  const workDescription = deliverable?.notes
    || 'Please find attached the content for May 1st to May 7th across Instagram, LinkedIn and Facebook.'
  const feedbackRequest = deliverable?.feedbackRequest
    || 'Kindly review and share feedback. Let me know if any adjustments are needed.'
  const submittedAt = deliverable ? formatSubmittedAt(deliverable.submittedAt) : 'May 12, 2024 at 4:32 PM'
  const decisionFeedback = deliverable?.feedback || reviewDecision?.feedback

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

        {payment ? (
          <div className="project-payment-readiness">
            <strong>{payment.status}</strong>
            <dl>
              <div>
                <dt>Amount</dt>
                <dd>{payment.amount}</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{payment.recipient}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{payment.method}</dd>
              </div>
            </dl>
            <p>{payment.note}</p>
            <p>{payment.nextStep}</p>
          </div>
        ) : null}

        {!deliverable && !reviewDecision && canReviewSubmission ? (
          <div className="project-review-decision-card">
            <div>
              <strong>Business review</strong>
              <p>
                {reviewLocked
                  ? 'Submitted work is visible, but approval and revision actions are locked until pending budget is paid to Zumbarl.'
                  : 'Approve the submitted work to update portfolio evidence and issue endorsement currency.'}
              </p>
            </div>
            <footer>
              <button type="button" className="project-soft-btn" disabled={reviewLocked} onClick={onRequestRevision}>
                <FiEdit3 aria-hidden="true" />
                Request Revision
              </button>
              <button type="button" className="project-primary-btn" disabled={reviewLocked} onClick={onApproveSubmission}>
                <FiStar aria-hidden="true" />
                {canEndorse ? 'Approve + Endorse' : 'Approve Work'}
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
