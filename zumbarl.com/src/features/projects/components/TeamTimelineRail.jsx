import { teamMilestones } from '../data/mockWorkspace'

function TeamTimelineRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Timeline details">
      <section className="campus-rail-card team-rail-card">
        <h3>Milestones</h3>
        {teamMilestones.map((item) => (
          <p key={item.title}><span>{item.id}</span><strong>{item.title}</strong><em>{item.due}</em></p>
        ))}
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Timeline Legend</h3>
        <p><span />Completed</p>
        <p><span />In Progress</p>
        <p><span />Upcoming</p>
        <p><span />Milestone</p>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Filters</h3>
        <button type="button">Assignee: All Members</button>
        <button type="button">Status: All Statuses</button>
        <button type="button">Sprint: All Sprints</button>
        <button type="button" className="project-primary-btn">Apply Filters</button>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Critical Path</h3>
        <p>5 tasks are on the critical path</p>
      </section>
    </aside>
  )
}

export default TeamTimelineRail
