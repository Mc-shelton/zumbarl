import { FiArrowRight } from 'react-icons/fi'

function TeamMilestonesSideRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Milestone details">
      <section className="campus-rail-card team-rail-card">
        <h3>Milestone Summary</h3>
        <p>Total Milestones <strong>5</strong></p>
        <p>Completed <strong>2</strong></p>
        <p>In Progress <strong>1</strong></p>
        <p>Upcoming <strong>2</strong></p>
        <p>Overdue <strong>0</strong></p>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Upcoming Milestones</h3>
        <p><span>4</span><strong>Content Review</strong><em>May 24, 2024</em></p>
        <p><span>5</span><strong>Project Delivery</strong><em>May 28, 2024</em></p>
      </section>
      <section className="campus-rail-card team-rail-card team-help-purple">
        <h3>Milestones help you track key achievements and keep your project on schedule.</h3>
        <button type="button">Learn more <FiArrowRight aria-hidden="true" /></button>
      </section>
    </aside>
  )
}

export default TeamMilestonesSideRail
