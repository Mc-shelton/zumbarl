import {
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiSearch,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

const SUMMARY_ICONS = {
  briefcase: FiBriefcase,
  check: FiCheckCircle,
  closed: FiCheckCircle,
  draft: FiFileText,
  review: FiZap,
  users: FiUsers,
}

export function BusinessOpportunityRail({ activity, summary, topSkills = [] }) {
  return (
    <aside className="campus-rail business-workspace-rail business-opportunities-rail">
      <section className="business-profile-card business-opportunity-summary-card">
        <header>
          <h2>Opportunity Summary</h2>
        </header>
        <dl>
          {summary.map((item) => {
            const Icon = SUMMARY_ICONS[item.icon] || FiBriefcase

            return (
              <div key={item.label}>
                <span className={`tone-${item.tone}`}><Icon aria-hidden="true" /></span>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            )
          })}
        </dl>
      </section>

      <section className="business-profile-card business-skill-demand-card">
        <header>
          <h2>Top Skills in Demand</h2>
          <Link to="/business/applicants" className="business-link-btn">View all</Link>
        </header>
        {topSkills.length === 0 ? (
          <p className="business-rail-empty">Skills from your opportunity briefs will appear here.</p>
        ) : (
          <ul>
            {topSkills.map((skill) => (
              <li key={skill.id}>
                <p>{skill.label}<span>{skill.value}%</span></p>
                <div role="img" aria-label={`${skill.label} demand ${skill.value}%`}>
                  <span className={`tone-${skill.tone}`} style={{ width: `${skill.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="business-profile-card business-opportunity-activity-card">
        <header>
          <h2>Recent Activity</h2>
          <Link to="/business/applicant-profile" className="business-link-btn">View all</Link>
        </header>
        {activity.length === 0 ? (
          <p className="business-rail-empty">Applicant and opportunity activity will appear here.</p>
        ) : (
          <ul>
            {activity.map((item) => (
              <li key={`${item.actor}-${item.time}-${item.detail}`}>
                <span className={`tone-${item.tone}`}>{item.initials}</span>
                <p><strong>{item.actor}</strong> {item.detail}</p>
                <time>{item.time}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="business-profile-card business-opportunity-help-card">
        <div>
          <h2>Need help finding the right talent?</h2>
          <p>Let our AI assistant help you find the best students for your project.</p>
          <Link to="/business/applicants" className="business-profile-ghost-btn">Find Talent</Link>
        </div>
        <span aria-hidden="true">
          <FiSearch />
        </span>
      </section>
    </aside>
  )
}
