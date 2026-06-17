export function BusinessApplicantFactsPanel({ items, kicker, title }) {
  return (
    <article className="business-profile-card business-facts-panel">
      <header>
        <div>
          <p className="business-section-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
      </header>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
