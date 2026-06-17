import { FiBriefcase, FiCheckCircle, FiTrendingUp, FiUsers } from 'react-icons/fi'

const ICONS = {
  briefcase: FiBriefcase,
  check: FiCheckCircle,
  trending: FiTrendingUp,
  users: FiUsers,
}

export function BusinessDashboardMetrics({ metrics }) {
  return (
    <section className="business-dashboard-metrics" aria-label="Business dashboard metrics">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.icon]

        return (
          <article key={metric.label} className={`business-dashboard-metric tone-${metric.tone}`}>
            <span aria-hidden="true">{Icon ? <Icon /> : null}</span>
            <div>
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
              <em>{metric.meta}</em>
            </div>
          </article>
        )
      })}
    </section>
  )
}
