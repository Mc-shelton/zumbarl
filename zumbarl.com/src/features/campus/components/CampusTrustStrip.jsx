import { TRUST_POINTS } from '../homeData'

function CampusTrustStrip() {
  return (
    <section className="campus-trust-strip" aria-label="Why students use Zumbarl">
      {TRUST_POINTS.map(({ title, body, Icon, tone }) => (
        <article key={title} className={`campus-trust-card tone-${tone}`}>
          <div className="campus-trust-icon">
            <Icon aria-hidden="true" />
          </div>
          <div>
            <h4>{title}</h4>
            <p>{body}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

export default CampusTrustStrip
