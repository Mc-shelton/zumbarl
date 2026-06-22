import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiMoreHorizontal,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

const iconRegistry = {
  book: FiBookOpen,
  briefcase: FiBriefcase,
  calendar: FiCalendar,
  'more-horizontal': FiMoreHorizontal,
  'shopping-bag': FiShoppingBag,
  truck: FiTruck,
  users: FiUsers,
}

function CampusQuickActions({ actions = [] }) {
  if (!actions.length) {
    return null
  }

  return (
    <section className="campus-section">
      <h3>What would you like to do?</h3>
      <div className="campus-actions-grid">
        {actions.map(({ id, title, subtitle, Icon: ProvidedIcon, href, icon }) => {
          const Icon = ProvidedIcon ?? iconRegistry[icon] ?? FiMoreHorizontal
          return href ? (
            <Link key={id ?? title} to={href} className="campus-action-card" aria-label={`Open ${title}`}>
              <div className="campus-action-icon">
                <Icon aria-hidden="true" />
              </div>
              <h4>{title}</h4>
              <p>{subtitle}</p>
            </Link>
          ) : (
            <article key={id ?? title} className="campus-action-card">
              <div className="campus-action-icon">
                <Icon aria-hidden="true" />
              </div>
              <h4>{title}</h4>
              <p>{subtitle}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CampusQuickActions
