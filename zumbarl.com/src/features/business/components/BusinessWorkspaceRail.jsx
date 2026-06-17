import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiSearch,
  FiTrendingUp,
  FiUserPlus,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

const ACTION_ICONS = [FiCalendar, FiBriefcase, FiCheckCircle, FiBarChart2]

export function BusinessWorkspaceRail({
  insights,
  upcomingActions,
}) {
  return (
    <aside className="campus-rail business-workspace-rail">
      <section className="business-profile-card business-upcoming-card">
        <header>
          <h2>Upcoming Actions</h2>
          <Link to="/business/applicant-profile" className="business-link-btn">View all</Link>
        </header>
        <ul className="business-upcoming-list">
          {upcomingActions.map((item, index) => {
            const Icon = ACTION_ICONS[index] || FiCalendar

            return (
              <li key={`${item.title}-${item.time}`}>
                <span className={`tone-${item.tone}`}><Icon aria-hidden="true" /></span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <time>{item.time}</time>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="business-profile-card business-insights-card">
        <header>
          <h2>Insights</h2>
          <button type="button" className="business-workspace-filter">This month</button>
        </header>
        <div className="business-insight-donut" aria-label="156 total applicants">
          <strong>156</strong>
          <span>Total Applicants</span>
        </div>
        <ul>
          {insights.map((item) => (
            <li key={item.label}>
              <span className={`tone-${item.tone}`} />
              <p>{item.label}</p>
              <strong>{item.value}%</strong>
            </li>
          ))}
        </ul>
        <p className="business-insight-note">
          Great! Your response rate is 28% higher than last month.
          <FiTrendingUp aria-hidden="true" />
        </p>
      </section>

      <section className="business-profile-card business-quick-card">
        <h2>Quick Actions</h2>
        <div>
          <Link to="/business/opportunities/create">
            <FiBriefcase aria-hidden="true" />
            Post New Opportunity
          </Link>
          <Link to="/business/applicant-profile">
            <FiSearch aria-hidden="true" />
            Search Talent
          </Link>
          <Link to="/business/applicant-profile">
            <FiUserPlus aria-hidden="true" />
            Invite to Opportunity
          </Link>
          <button type="button">
            <FiBarChart2 aria-hidden="true" />
            View Analytics
          </button>
        </div>
      </section>
    </aside>
  )
}
