import { FiPaperclip, FiX } from 'react-icons/fi'

function TeamTaskModal({ onClose }) {
  return (
    <div className="project-modal-backdrop team-modal-backdrop" role="presentation">
      <section className="project-submit-modal team-task-modal" role="dialog" aria-modal="true" aria-labelledby="add-task-title">
        <button type="button" className="project-modal-close" aria-label="Close add task modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <h2 id="add-task-title">Add New Task</h2>
        <label>Task Title *<input defaultValue="Create Instagram Story Slides" /></label>
        <label>Description<textarea defaultValue="Design 4 Instagram Story slides to promote our new blog post." /></label>
        <div className="team-modal-grid">
          <label>Status<select defaultValue="To Do"><option>To Do</option></select></label>
          <label>Priority<select defaultValue="Medium"><option>Medium</option><option>High</option></select></label>
          <label>Assignee<select defaultValue="Mercy Wanjiku"><option>Mercy Wanjiku</option></select></label>
          <label>Due Date<input defaultValue="May 6, 2024" /></label>
          <label>Sprint<select defaultValue="Sprint 2"><option>Sprint 2 (May 6 - May 19)</option></select></label>
          <label>Tags<input defaultValue="Instagram, Design" /></label>
        </div>
        <div className="project-upload-box">
          <FiPaperclip aria-hidden="true" />
          <strong>Drag and drop files here, or browse</strong>
        </div>
        <footer>
          <span />
          <button type="button" className="project-soft-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="project-primary-btn" onClick={onClose}>Add Task</button>
        </footer>
      </section>
    </div>
  )
}

export default TeamTaskModal
