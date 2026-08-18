import { ACCESS_KEYS, filterByAccess } from '../../auth/roleConfig'
import { teamMilestones } from '../data/mockWorkspace'

const TEAM_QUICK_ACTIONS = [
  { label: 'Create Task', requiredAccess: ACCESS_KEYS.projects.createTask },
  { label: 'Invite Team Member', requiredAccess: ACCESS_KEYS.projects.team },
  { label: 'Upload File', requiredAccess: ACCESS_KEYS.projects.manageFiles },
  { label: 'Add Milestone', requiredAccess: ACCESS_KEYS.projects.createMilestone },
  { label: 'Sprint Settings', requiredAccess: ACCESS_KEYS.projects.createSprint },
]

function TeamDefaultRail({ onInviteMember }) {
  const quickActions = filterByAccess(TEAM_QUICK_ACTIONS)

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
      {quickActions.length ? (
        <section className="campus-rail-card team-rail-card">
          <h3>Quick Actions</h3>
          {quickActions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.label === 'Invite Team Member' ? onInviteMember : undefined}
            >
              {item.label}
            </button>
          ))}
        </section>
      ) : null}
    </aside>
  )
}

export default TeamDefaultRail
