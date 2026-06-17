import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'
import { teamActivityLogStats, teamActivityLogs } from '../data/teamActivityLogs'

function TeamActivityLogsRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Activity log details">
      <section className="campus-rail-card team-rail-card team-activity-summary-card">
        <h3>Activity Summary</h3>
        <dl>
          {teamActivityLogStats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="campus-rail-card team-rail-card team-activity-health-card">
        <h3>Log Health</h3>
        <div>
          <strong className="team-activity-health-ring">92%<span>Tracked</span></strong>
          <ul>
            <li><FiCheckCircle aria-hidden="true" /> Audit trail current</li>
            <li><FiClock aria-hidden="true" /> Last sync 3 minutes ago</li>
            <li><FiAlertCircle aria-hidden="true" /> 2 blockers need attention</li>
          </ul>
        </div>
      </section>

      <section className="campus-rail-card team-rail-card team-recent-activity-card">
        <header>
          <h3>Recent Critical Events</h3>
          <button type="button">View all</button>
        </header>
        {teamActivityLogs.slice(0, 3).map((item) => (
          <article key={item.id}>
            <span><FiActivity aria-hidden="true" /></span>
            <strong>{item.type}</strong>
            <em>{item.time}</em>
          </article>
        ))}
      </section>
    </aside>
  )
}

export default TeamActivityLogsRail
