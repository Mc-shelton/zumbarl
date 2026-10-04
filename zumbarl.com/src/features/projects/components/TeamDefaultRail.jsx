import { ACCESS_KEYS, filterByAccess } from '../../auth/roleConfig'

const TEAM_QUICK_ACTIONS = [
  { label: 'Create Task', requiredAccess: ACCESS_KEYS.projects.createTask },
  { label: 'Invite Team Member', requiredAccess: ACCESS_KEYS.projects.team },
  { label: 'Upload File', requiredAccess: ACCESS_KEYS.projects.manageFiles },
  { label: 'Add Milestone', requiredAccess: ACCESS_KEYS.projects.createMilestone },
  { label: 'Sprint Settings', requiredAccess: ACCESS_KEYS.projects.createSprint },
]

function TeamDefaultRail({ activityData, onInviteMember }) {
  const quickActions = filterByAccess(TEAM_QUICK_ACTIONS)
  const milestones = Array.isArray(activityData?.milestones) ? activityData.milestones : []
  const tasks = Array.isArray(activityData?.tasks) ? activityData.tasks : []
  const completedTasks = tasks.filter((task) => ['done', 'completed', 'approved'].includes(String(task.status).toLowerCase())).length
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Team project details">
      <section className="campus-rail-card team-rail-card">
        <h3>Milestones</h3>
        {milestones.length ? milestones.map((item, index) => (
          <p key={item.id}>
            <span>{index + 1}</span>
            <strong>{item.title}</strong>
            <em>{item.dueAt ? new Date(item.dueAt).toLocaleDateString('en-KE') : item.status}</em>
          </p>
        )) : <p>No milestones yet.</p>}
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Task Summary</h3>
        <strong className="team-ring">{progress}%</strong>
        <p>Completed {completedTasks} · Open {Math.max(0, tasks.length - completedTasks)}</p>
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
