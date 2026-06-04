import { teamMilestones } from '../data/mockWorkspace'

function TeamDefaultRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Team project details">
      <section className="campus-rail-card team-rail-card">
        <h3>Milestones</h3>
        {teamMilestones.map((item) => (
          <p key={item.title}>
            <span>{item.id}</span>
            <strong>{item.title}</strong>
            <em>{item.due}</em>
          </p>
        ))}
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Sprint Summary</h3>
        <strong className="team-ring">60%</strong>
        <p>Completed 12 · In Progress 5 · Blocked 2</p>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Quick Actions</h3>
        {['Create Task', 'Invite Team Member', 'Upload File', 'Add Milestone', 'Sprint Settings'].map((item) => (
          <button key={item} type="button">{item}</button>
        ))}
      </section>
    </aside>
  )
}

export default TeamDefaultRail
