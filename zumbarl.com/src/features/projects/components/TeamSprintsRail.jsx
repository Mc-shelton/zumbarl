import { ACCESS_KEYS, filterByAccess } from '../../auth/roleConfig'

const SPRINT_RAIL_ACTIONS = [
  { label: 'Create Sprint', requiredAccess: ACCESS_KEYS.projects.createSprint },
  { label: 'Sprint Settings', requiredAccess: ACCESS_KEYS.projects.createSprint },
  { label: 'Backlog', requiredAccess: ACCESS_KEYS.projects.board },
  { label: 'View Timeline', requiredAccess: ACCESS_KEYS.projects.timeline },
]

function TeamSprintsRail() {
  const actions = filterByAccess(SPRINT_RAIL_ACTIONS)

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Sprint details">
      <section className="campus-rail-card team-rail-card">
        <h3>Sprint Summary</h3>
        <p>Total Sprints <strong>4</strong></p>
        <p>Completed <strong>1</strong></p>
        <p>In Progress <strong>1</strong></p>
        <p>Upcoming <strong>2</strong></p>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Overall Progress</h3>
        <strong className="team-ring">28%</strong>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Team Velocity (Average)</h3>
        <strong>20</strong>
        <p>Points per sprint</p>
        <div className="team-small-chart" />
      </section>
      {actions.length ? (
        <section className="campus-rail-card team-rail-card">
          <h3>Quick Actions</h3>
          {actions.map((item) => <button key={item.label} type="button">{item.label}</button>)}
        </section>
      ) : null}
    </aside>
  )
}

export default TeamSprintsRail
