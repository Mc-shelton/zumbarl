import { FiBriefcase, FiCalendar, FiFileText, FiMoreHorizontal } from 'react-icons/fi'
import { milestoneProject, milestoneItems } from '../data/mockWorkspace'

function MilestonesPanel() {
  return (
    <section className="project-milestones-panel" aria-label="Project milestones">
      <section className="project-milestones-summary" aria-label="Milestone summary">
        <article>
          <FiBriefcase aria-hidden="true" />
          <div>
            <span>Project</span>
            <strong>{milestoneProject.title}</strong>
          </div>
        </article>
        <article>
          <FiFileText aria-hidden="true" />
          <div>
            <span>Client</span>
            <strong>{milestoneProject.client}</strong>
          </div>
        </article>
        <article>
          <div>
            <span>Project Progress</span>
            <strong>3 of 5 milestones completed</strong>
          </div>
          <em>
            <i />
          </em>
          <b>60%</b>
        </article>
        <article>
          <FiCalendar aria-hidden="true" />
          <div>
            <span>Project Timeline</span>
            <strong>Apr 30, 2024 - Jun 15, 2024</strong>
          </div>
        </article>
      </section>

      <nav className="project-milestones-filter" aria-label="Milestone filters">
        <button type="button" className="is-active">All Milestones (5)</button>
        <button type="button">Completed (2)</button>
        <button type="button">In Progress (1)</button>
        <button type="button">Pending (2)</button>
      </nav>

      <div className="project-milestones-list">
        {milestoneItems.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.id} className={`project-milestone-item is-${item.tone}`}>
              <span className="project-milestone-index">{item.id}</span>
              <div className="project-milestone-card">
                <span className="project-milestone-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div className="project-milestone-copy">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <strong>Deliverables: {item.deliverables}</strong>
                </div>
                <div className="project-milestone-meta">
                  <p>Due: {item.due}</p>
                  <strong>{item.amount}</strong>
                  <span>{item.status}</span>
                </div>
                <button type="button" className="project-icon-btn" aria-label={`More actions for ${item.title}`}>
                  <FiMoreHorizontal aria-hidden="true" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <p className="project-milestones-count">Showing 1 to 5 of 5 milestones</p>
    </section>
  )
}

export default MilestonesPanel
