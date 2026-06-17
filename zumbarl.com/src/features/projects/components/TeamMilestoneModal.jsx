import { FiPaperclip, FiX } from 'react-icons/fi'

function TeamMilestoneModal({ onClose }) {
  return (
    <div className="project-modal-backdrop team-modal-backdrop" role="presentation">
      <section className="project-submit-modal team-milestone-modal" role="dialog" aria-modal="true" aria-labelledby="add-milestone-title">
        <button type="button" className="project-modal-close" aria-label="Close add milestone modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <h2 id="add-milestone-title">Add New Milestone</h2>
        <div className="team-modal-grid">
          <label>Milestone Title *<input defaultValue="Content Review" /></label>
          <label>Status *<select defaultValue="In Progress"><option>In Progress</option></select></label>
        </div>
        <label>Milestone Description *<textarea defaultValue="Review and approve all content across platforms before publishing." /></label>
        <div className="team-modal-grid">
          <label>Due Date *<input defaultValue="May 24, 2024" /></label>
          <label>Owner *<select defaultValue="Lydia Achieng"><option>Lydia Achieng' (Social Media Manager)</option></select></label>
          <label>Priority<select defaultValue="Medium"><option>Medium</option></select></label>
          <label>Milestone Type<select defaultValue="Review"><option>Review</option></select></label>
        </div>
        <label>Link to Sprint (Optional)<select defaultValue="Sprint 3"><option>Sprint 3: Review & Optimization</option></select></label>
        <footer>
          <button type="button" className="campus-link-btn"><FiPaperclip aria-hidden="true" /> Add Attachments (Optional)</button>
          <button type="button" className="project-soft-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="project-primary-btn" onClick={onClose}>Create Milestone</button>
        </footer>
      </section>
    </div>
  )
}

export default TeamMilestoneModal
