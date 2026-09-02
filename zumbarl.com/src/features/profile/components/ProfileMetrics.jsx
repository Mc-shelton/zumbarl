function ProfileMetrics({ metrics = [] }) {
  const resolvedMetrics = metrics || []

  return (
    <section className="campus-profile-metrics" aria-label="Profile metrics">
      {resolvedMetrics.map(({ label, value, meta, Icon, tone = 'purple' }) => (
        <article key={label} className={`campus-profile-surface campus-profile-metric-card is-${tone}`}>
          {Icon ? (
            <div className="campus-profile-metric-icon">
              <Icon aria-hidden="true" />
            </div>
          ) : null}
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
