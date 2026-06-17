import { teamActivityLogs } from '../data/teamActivityLogs'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { teamBoardColumns, teamMembers } from '../data/mockWorkspace'

function TeamOverviewPanel() {
  const canCreateTask = hasAccess(ACCESS_KEYS.projects.createTask)
  const canManageTeam = hasAccess(ACCESS_KEYS.projects.team)

  return (
    <section className="team-overview-panel">
      <section className="team-overview-grid">
        <article className="project-card team-sprint-card">
          <header>
            <span>Current Sprint</span>
            <strong>Sprint 2: Content Production</strong>
            <em>Active</em>
          </header>
          <p>May 6 - May 19, 2024 (14 days left)</p>
          <div>
            <span>
              <strong>60%</strong>
              Progress
            </span>
            <span>
              <strong>12 / 20</strong>
              Tasks
            </span>
            <span>
              <strong>32 / 53</strong>
              Story Points
            </span>
            <span>
              <strong>2</strong>
              Blocked
            </span>
          </div>
          <i><b /></i>
        </article>

        <article className="project-card team-sprint-board">
          <header>
            <h2>Sprint Board</h2>
            <button type="button" className="project-soft-btn">View Board</button>
          </header>
          <div className="team-mini-board">
            {teamBoardColumns.slice(0, 4).map((column) => (
              <section key={column.title} className={`team-board-column is-${column.tone}`}>
                <h3>{column.title}</h3>
                {column.tasks.slice(0, 3).map(([title, , badge]) => (
                  <article key={title}>
                    <strong>{title}</strong>
                    <span>{badge}</span>
                  </article>
                ))}
                {canCreateTask ? <button type="button">+ Add task</button> : null}
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="project-card team-overview-timeline">
        <header>
          <h2>Timeline</h2>
          <button type="button" className="project-soft-btn">Today</button>
        </header>
        {['Project Started', 'Content Strategy', 'Content Production (Sprint 2)', 'Content Review (Sprint 3)', 'Project Delivery'].map((item, index) => (
          <article key={item}>
            <span>{item}</span>
            <i style={{ '--offset': `${index * 14}%`, '--width': `${index === 2 ? 34 : 20}%` }} />
          </article>
        ))}
      </section>

      <section className="team-overview-bottom">
        <article className="project-card team-roster-card">
          <header>
            <h2>Team (6)</h2>
            {canManageTeam ? <button type="button">Manage Team</button> : null}
          </header>
          {teamMembers.slice(0, 4).map((member) => (
            <p key={member.name}>
              <img src="/assets/index/bee_nobg.png" alt="" />
              <strong>{member.name}</strong>
              <span>{member.role}</span>
              <em>{member.tasks}</em>
              <b>{member.availability}</b>
            </p>
          ))}
        </article>
        <article className="project-card team-activity-card">
          <header>
            <h2>Activity Feed</h2>
            <button type="button">View all</button>
          </header>
          {teamActivityLogs.slice(0, 4).map((item) => (
            <p key={item.id}>
              <img src="/assets/index/bee_nobg.png" alt="" />
              <span>{item.actor} {item.action} "{item.target}"</span>
            </p>
          ))}
        </article>
      </section>
    </section>
  )
}

export default TeamOverviewPanel
