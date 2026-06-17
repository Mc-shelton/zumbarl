import { FiSend, FiUploadCloud, FiX } from 'react-icons/fi'
import { submittedFiles } from '../data/mockWorkspace'

function SubmitWorkModal({ onClose, onSubmit }) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-submit-modal" role="dialog" aria-modal="true" aria-labelledby="submit-work-title">
        <button type="button" className="project-modal-close" aria-label="Close submit work modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <header>
          <span>
            <FiUploadCloud aria-hidden="true" />
          </span>
          <div>
            <h2 id="submit-work-title">Submit Work</h2>
            <p>Upload your final work for review. Once submitted, the client will be notified.</p>
          </div>
        </header>

        <label>
          What are you submitting? *
          <select defaultValue="Final deliverable">
            <option>Final deliverable</option>
            <option>Progress update</option>
            <option>Revision</option>
          </select>
        </label>
        <label>
          Work Title *
          <input type="text" defaultValue="Social Media Content - May 1st to May 7th" />
        </label>
        <label>
          Description (optional)
          <textarea defaultValue="Please find attached the content for May 1st to May 7th across Instagram, LinkedIn and Facebook as per the content calendar and brand guidelines." />
        </label>

        <div className="project-upload-box">
          <FiUploadCloud aria-hidden="true" />
          <strong>Drag & drop files here or click to browse</strong>
          <span>You can upload up to 10 files (max 200MB each)</span>
          <small>Allowed formats: JPG, PNG, MP4, PDF, ZIP, DOCX</small>
        </div>

        <div className="project-submitted-file-list">
          {submittedFiles.map((file) => (
            <p key={file.name}>
              <span>{file.name}</span>
              <em>{file.size}</em>
              <button type="button" aria-label={`Remove ${file.name}`}>
                <FiX aria-hidden="true" />
              </button>
            </p>
          ))}
        </div>

        <label>
          Request Feedback (optional)
          <textarea defaultValue="Kindly review and share feedback. Let me know if any adjustments are needed." />
        </label>

        <footer>
          <p>By submitting, you confirm that this work is original and you own the rights to it.</p>
          <button type="button" className="project-soft-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="project-primary-btn" onClick={onSubmit}>
            <FiSend aria-hidden="true" />
            Submit Work
          </button>
        </footer>
      </section>
    </div>
  )
}

export default SubmitWorkModal
