function TeamSprintsRail() {
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
      <section className="campus-rail-card team-rail-card">
        <h3>Quick Actions</h3>
        {['Create Sprint', 'Sprint Settings', 'Backlog', 'View Timeline'].map((item) => <button key={item} type="button">{item}</button>)}
      </section>
    </aside>
  )
}

export default TeamSprintsRail
