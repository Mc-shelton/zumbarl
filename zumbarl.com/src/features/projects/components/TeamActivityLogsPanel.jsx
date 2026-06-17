import {
  FiActivity,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiFilter,
  FiLock,
  FiMessageCircle,
  FiMoreHorizontal,
  FiSearch,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import { teamActivityLogFilters, teamActivityLogs } from '../data/teamActivityLogs'

const LOG_ICON_BY_TONE = {
  comment: FiMessageCircle,
  file: FiFileText,
  milestone: FiActivity,
  security: FiShield,
  status: FiCheckCircle,
  success: FiCheckCircle,
  team: FiUsers,
  warning: FiLock,
}

function TeamActivityLogsPanel() {
  return (
    <section className="team-activity-logs-panel">
      <div className="team-tab-tools">
        <label>
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Search activity logs..." />
        </label>
        <button type="button" className="project-soft-btn">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
        <button type="button" className="project-primary-btn">
          <FiDownload aria-hidden="true" />
          Export Logs
        </button>
      </div>

      <section className="project-card team-activity-log-table">
        <header>
          <div>
            <h2>Activity Logs ({teamActivityLogs.length})</h2>
            <p>Audit trail for project updates, files, task movement, access changes and comments.</p>
          </div>
          <div className="team-activity-filter-row" aria-label="Activity filters">
            {teamActivityLogFilters.map((filter, index) => (
              <button key={filter} type="button" className={index === 0 ? 'is-active' : ''}>
                {filter}
              </button>
            ))}
          </div>
        </header>

        <div className="team-activity-log-list">
          {teamActivityLogs.map((item) => (
            <ActivityLogRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </section>
  )
}

function ActivityLogRow({ item }) {
  const Icon = LOG_ICON_BY_TONE[item.tone] || FiActivity

  return (
    <article className={`team-activity-log-row is-${item.tone}`}>
      <span className="team-activity-log-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="team-activity-log-copy">
        <h3>
          <strong>{item.actor}</strong> {item.action} <em>{item.target}</em>
        </h3>
        <p>{item.detail}</p>
        <span>{item.time}</span>
      </div>
      <b>{item.type}</b>
      <button type="button" aria-label={`More actions for ${item.id}`}>
        <FiMoreHorizontal aria-hidden="true" />
      </button>
    </article>
  )
}

export default TeamActivityLogsPanel
