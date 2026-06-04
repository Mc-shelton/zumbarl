import { FiMessageCircle, FiPlus } from 'react-icons/fi'
import { teamMilestones } from '../data/mockWorkspace'

function TeamMilestonesPanel({ onAddMilestone }) {
  return (
    <section className="team-milestones-tab">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search milestones..." />
        </label>
        <button type="button" className="project-soft-btn">Filters</button>
        <button type="button" className="project-soft-btn">View: Timeline</button>
        <button type="button" className="project-primary-btn" onClick={onAddMilestone}>
          <FiPlus aria-hidden="true" />
          Add Milestone
        </button>
      </div>
      <section className="project-card team-milestone-table">
        <div className="team-milestone-row is-head">
          <span>Milestone</span>
          <span>Status</span>
          <span>Due Date</span>
          <span>Owner</span>
          <span>Progress</span>
        </div>
        {teamMilestones.map((item) => (
          <div key={item.id} className="team-milestone-row">
            <span>
              <b>{item.id}</b>
              <strong>{item.title}</strong>
              <em>{item.detail}</em>
            </span>
            <span>{item.status}</span>
            <span>{item.due}</span>
            <span>
              <img src="/assets/index/bee_nobg.png" alt="" />
              {item.owner}
            </span>
            <span>
              {item.progress}
              <i style={{ '--progress': item.progress }}><b /></i>
            </span>
          </div>
        ))}
      </section>
      <section className="team-milestone-analytics">
        <article className="project-card">
          <h2>Milestone Progress</h2>
          <strong>28%</strong>
          <p>Overall Progress</p>
        </article>
        <article className="project-card">
          <h2>Milestone Burndown</h2>
          <div className="team-line-chart" />
        </article>
      </section>
    </section>
  )
}

export default TeamMilestonesPanel
