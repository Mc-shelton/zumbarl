import {
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiSearch,
  FiStar,
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

export function BusinessOpportunityRail({ activity, summary, topFreelancers = [] }) {
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

      <section className="business-profile-card business-top-freelancers-card">
        <header>
          <h2>Top Freelancers</h2>
          <Link to="/business/applicants" className="business-link-btn">View all</Link>
        </header>
        <ul>
          {topFreelancers.map((freelancer) => (
            <li key={freelancer.id}>
              <span className={`tone-${freelancer.tone}`}>{freelancer.initials}</span>
              <div>
                <strong>{freelancer.name}</strong>
                <p>{freelancer.school} · {freelancer.skill}</p>
              </div>
              <em>
                <FiStar aria-hidden="true" />
                {freelancer.rating} · {freelancer.projects} projects
              </em>
            </li>
          ))}
        </ul>
      </section>

      <section className="business-profile-card business-opportunity-activity-card">
        <header>
          <h2>Recent Activity</h2>
          <Link to="/business/applicant-profile" className="business-link-btn">View all</Link>
        </header>
        <ul>
          {activity.map((item) => (
            <li key={`${item.actor}-${item.time}`}>
              <span className={`tone-${item.tone}`}>{item.initials}</span>
              <p><strong>{item.actor}</strong> {item.detail}</p>
              <time>{item.time}</time>
            </li>
          ))}
        </ul>
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
