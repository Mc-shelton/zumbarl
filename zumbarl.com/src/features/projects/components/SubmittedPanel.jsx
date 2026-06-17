import { FiBell, FiCheck, FiCheckCircle, FiClock, FiDownload, FiEdit3, FiFolder, FiStar } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess, hasAnyAccess } from '../../auth/roleConfig'
import { project, submittedFiles } from '../data/mockWorkspace'

function SubmittedPanel({
  activeProject = project,
  onApproveSubmission,
  onOverview,
  onRequestRevision,
  payment,
  reviewDecision,
  reviewLocked = false,
}) {
  const canOpenMessages = hasAccess(ACCESS_KEYS.projects.messages)
  const canReviewSubmission = hasAccess(ACCESS_KEYS.business.submissionReview)
  const canEndorse = hasAnyAccess([ACCESS_KEYS.business.endorsements, ACCESS_KEYS.business.rateStudents])
  const isApproved = reviewDecision?.decision === 'approved'
  const isRevisionRequested = reviewDecision?.decision === 'revision_requested'
  const statusCopy = isApproved
    ? 'Work approved and endorsement recorded.'
    : isRevisionRequested
      ? 'Revision requested from the student.'
      : 'Your work has been submitted and is now pending review.'

  return (
    <>
      <section className="project-card project-success-card">
        <div className="project-success-mark">
          <FiCheck aria-hidden="true" />
        </div>
        <h2>{isApproved ? 'Work Approved' : isRevisionRequested ? 'Revision Requested' : 'Work Submitted Successfully!'}</h2>
        <p>{statusCopy} Client: <strong>{activeProject.client}</strong>.</p>

        <div className="project-success-summary">
          <article>
            <FiClock aria-hidden="true" />
            <span>
              <strong>Submitted on</strong>
              May 12, 2024 at 4:32 PM
            </span>
          </article>
          <article>
            <FiClock aria-hidden="true" />
            <span>
              <strong>Next step</strong>
              {isApproved ? 'Payment and endorsement' : isRevisionRequested ? 'Student revision' : 'Client Review'}
            </span>
          </article>
          <article>
            <FiBell aria-hidden="true" />
            <span>
              <strong>You'll be notified</strong>
              {reviewDecision ? reviewDecision.createdAt : 'Once the client reviews your work'}
            </span>
          </article>
        </div>

        {reviewDecision ? (
          <div className="project-review-outcome" role="status">
            <FiStar aria-hidden="true" />
            <div>
              <strong>{isApproved ? `${reviewDecision.rating}/5 approved review` : 'Revision feedback'}</strong>
              <p>{reviewDecision.feedback}</p>
            </div>
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

        {!reviewDecision && canReviewSubmission ? (
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

        {!reviewDecision ? <div className="project-next-list">
          <strong>What happens next?</strong>
          {['The client will review your submission.', 'They may approve it, request changes, or ask for revisions.', "You'll be notified of their feedback.", 'The activity log will capture approval and next steps.'].map((item) => (
            <p key={item}>
              <FiCheckCircle aria-hidden="true" />
              {item}
            </p>
          ))}
        </div> : null}

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
              <dd>Social Media Content - May 1st to May 7th</dd>
            </div>
            <div>
              <dt>Submitted Files</dt>
              <dd>3 files (68.5 MB)</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>Please find attached the content for May 1st to May 7th across Instagram, LinkedIn and Facebook.</dd>
            </div>
            <div>
              <dt>Feedback Request</dt>
              <dd>Kindly review and share feedback. Let me know if any adjustments are needed.</dd>
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
          {submittedFiles.map((file) => (
            <p key={file.name}>
              <FiFolder aria-hidden="true" />
              <strong>{file.name}</strong>
              <span>{file.size}</span>
              <FiDownload aria-hidden="true" />
            </p>
          ))}
        </article>
      </section>
    </>
  )
}

export default SubmittedPanel
