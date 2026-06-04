import { FiBell, FiCheck, FiCheckCircle, FiClock, FiDownload, FiFolder } from 'react-icons/fi'
import { project, submittedFiles } from '../data/mockWorkspace'

function SubmittedPanel({ onOverview }) {
  return (
    <>
      <section className="project-card project-success-card">
        <div className="project-success-mark">
          <FiCheck aria-hidden="true" />
        </div>
        <h2>Work Submitted Successfully!</h2>
        <p>Your work has been submitted and is now pending review from <strong>{project.client}</strong>.</p>

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
              Client Review
            </span>
          </article>
          <article>
            <FiBell aria-hidden="true" />
            <span>
              <strong>You'll be notified</strong>
              Once the client reviews your work
            </span>
          </article>
        </div>

        <div className="project-next-list">
          <strong>What happens next?</strong>
          {['The client will review your submission.', 'They may approve it, request changes, or ask for revisions.', "You'll be notified of their feedback.", 'Once approved, you can send your invoice.'].map((item) => (
            <p key={item}>
              <FiCheckCircle aria-hidden="true" />
              {item}
            </p>
          ))}
        </div>

        <footer>
          <button type="button" className="project-soft-btn">Go to Messages</button>
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
