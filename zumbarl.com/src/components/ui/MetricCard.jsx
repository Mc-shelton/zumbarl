function MetricCard({ change, className = '', icon: Icon, label, tone = 'blue', value }) {
  const classes = ['ui-metric-card', className].filter(Boolean).join(' ')

  return (
    <article className={classes}>
      {Icon ? (
        <span className={`ui-metric-card__icon tone-${tone}`}>
          <Icon aria-hidden="true" />
        </span>
      ) : null}
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {change ? <em>{change}</em> : null}
      </div>
    </article>
  )
}

export default MetricCard
