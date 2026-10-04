function formatStatus(value) {
  return String(value || 'updated').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function TeamMembersRail({ activityData }) {
  const members = Array.isArray(activityData?.members) ? activityData.members : []
  const tasks = Array.isArray(activityData?.tasks) ? activityData.tasks : []
  const milestones = Array.isArray(activityData?.milestones) ? activityData.milestones : []
  const invites = Array.isArray(activityData?.invites) ? activityData.invites : []
  const completedTasks = tasks.filter((task) => ['done', 'completed', 'approved'].includes(String(task.status).toLowerCase()))
  const recentActivity = [
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      label: `${task.title} · ${formatStatus(task.status)}`,
      time: task.updatedAt || task.createdAt,
    })),
    ...invites.map((invite) => ({
      id: `invite-${invite.id}`,
      label: `Invite for ${invite.studentName || invite.name || 'team member'} · ${formatStatus(invite.status)}`,
      time: invite.updatedAt || invite.createdAt,
    })),
  ].sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0)).slice(0, 5)

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Team project details">
      <section className="campus-rail-card team-rail-card">
        <h3>Team Overview</h3>
        <div className="team-rail-metrics">
          <article><strong>{members.length}</strong><span>Total Members</span></article>
          <article><strong>{tasks.length - completedTasks.length}</strong><span>Open Tasks</span></article>
          <article><strong>{completedTasks.length}</strong><span>Completed Tasks</span></article>
          <article><strong>{milestones.length}</strong><span>Milestones</span></article>
        </div>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Recent Team Activity</h3>
        {recentActivity.length ? recentActivity.map((item) => (
          <p key={item.id}>{item.label}</p>
        )) : <p>No team activity has been recorded yet.</p>}
      </section>
    </aside>
  )
}

export default TeamMembersRail
