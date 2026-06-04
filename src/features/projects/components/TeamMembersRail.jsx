function TeamMembersRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Team project details">
      <section className="campus-rail-card team-rail-card">
        <h3>Team Overview</h3>
        <div className="team-rail-metrics">
          <article><strong>6</strong><span>Total Members</span></article>
          <article><strong>5</strong><span>Active This Week</span></article>
          <article><strong>64%</strong><span>Avg. Workload</span></article>
          <article><strong>34</strong><span>Velocity</span></article>
        </div>
      </section>
      <section className="campus-rail-card team-rail-card">
        <h3>Recent Team Activity</h3>
        {['Shadrach completed task', 'Lydia moved task to review', 'Brian uploaded Brand Guidelines.pdf'].map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>
    </aside>
  )
}

export default TeamMembersRail
