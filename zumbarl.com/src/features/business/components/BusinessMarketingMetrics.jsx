import { FiDollarSign, FiEye, FiRadio, FiSend, FiThumbsUp } from 'react-icons/fi'

const ICON_BY_TYPE = {
  campaign: FiRadio,
  eye: FiEye,
  send: FiSend,
  spend: FiDollarSign,
  thumbs: FiThumbsUp,
}

export function BusinessMarketingMetrics({ metrics }) {
  return (
    <section className="business-marketing-metrics" aria-label="Marketing performance summary">
      {metrics.map((metric) => {
        const Icon = ICON_BY_TYPE[metric.icon] || FiRadio

        return (
          <article key={metric.label} className="business-profile-card business-marketing-metric">
            <span className={`tone-${metric.tone}`} aria-hidden="true">
              <Icon />
            </span>
            <div>
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
              <em>{metric.trend}</em>
            </div>
          </article>
        )
      })}
    </section>
  )
}
