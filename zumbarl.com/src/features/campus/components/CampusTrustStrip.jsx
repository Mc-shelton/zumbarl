import {
  FiBookOpen,
  FiCreditCard,
  FiShield,
  FiUsers,
} from 'react-icons/fi'

const iconRegistry = {
  book: FiBookOpen,
  'credit-card': FiCreditCard,
  shield: FiShield,
  users: FiUsers,
}

function CampusTrustStrip({ trustPoints = [] }) {
  if (!trustPoints.length) {
    return null
  }

  return (
    <section className="campus-trust-strip" aria-label="Why students use Zumbarl">
      {trustPoints.map(({ id, title, body, description, Icon: ProvidedIcon, icon, tone }) => {
        const Icon = ProvidedIcon ?? iconRegistry[icon] ?? FiShield
        return (
          <article key={id ?? title} className={`campus-trust-card tone-${tone ?? 'purple'}`}>
            <div className="campus-trust-icon">
              <Icon aria-hidden="true" />
            </div>
            <div>
              <h4>{title}</h4>
              <p>{body ?? description}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default CampusTrustStrip
