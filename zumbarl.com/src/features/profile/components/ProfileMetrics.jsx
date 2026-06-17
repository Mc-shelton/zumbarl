import { PROFILE_METRICS } from '../constants'

function ProfileMetrics() {
  return (
    <section className="campus-profile-metrics" aria-label="Profile metrics">
      {PROFILE_METRICS.map(({ label, value, meta, Icon, tone }) => (
        <article key={label} className={`campus-profile-surface campus-profile-metric-card is-${tone}`}>
          <div className="campus-profile-metric-icon">
            <Icon aria-hidden="true" />
          </div>
          <div className="campus-profile-metric-tab">
            <p>{label}</p>
            <h3>{value}</h3>
            <span>{meta}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

export default ProfileMetrics
