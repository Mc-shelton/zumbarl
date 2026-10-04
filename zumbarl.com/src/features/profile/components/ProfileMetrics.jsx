import { FiAward, FiBarChart2, FiBriefcase, FiStar, FiTrendingUp, FiUsers } from 'react-icons/fi'

const METRIC_ICONS = {
  'Avg. Rating': FiStar,
  'Delivery Rate': FiTrendingUp,
  'Gigs Completed': FiBriefcase,
  'Repeat Clients': FiUsers,
  'Zumbarl Score': FiAward,
}

function ProfileMetrics({ metrics = [] }) {
  const resolvedMetrics = metrics || []

  return (
    <section className="campus-profile-metrics" aria-label="Profile metrics">
      <header className="campus-profile-metrics-heading"><strong>Work reputation</strong><span>Verified on Zumbarl</span></header>
      <div className="campus-profile-metric-list">
        {resolvedMetrics.map(({ label, value, meta, Icon, tone = 'purple' }) => {
          const MetricIcon = Icon || METRIC_ICONS[label] || FiBarChart2
          return (
            <article key={label} className={`campus-profile-surface campus-profile-metric-card is-${tone}`}>
              <div className="campus-profile-metric-icon">
                <MetricIcon aria-hidden="true" />
              </div>
              <div className="campus-profile-metric-tab">
                <p>{label}</p>
                <h3>{value}</h3>
                <span>{meta}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ProfileMetrics
