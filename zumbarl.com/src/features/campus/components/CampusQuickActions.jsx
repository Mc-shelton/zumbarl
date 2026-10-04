import {
  FiArrowUpRight,
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
    <section className="campus-section campus-quick-actions-section">
      <header className="campus-workspace-section-head">
        <div>
          <span>Quick access</span>
          <h3>Move around campus</h3>
        </div>
        <p>Your most useful spaces, one click away.</p>
      </header>
      <div className="campus-actions-grid">
        {actions.map(({ id, title, subtitle, Icon: ProvidedIcon, href, icon }, index) => {
          const Icon = ProvidedIcon ?? iconRegistry[icon] ?? FiMoreHorizontal
          const className = `campus-action-card${index === 0 ? ' is-featured' : ''}`
          const content = (
            <>
              <div className="campus-action-icon">
                <Icon aria-hidden="true" />
              </div>
              <div className="campus-action-copy">
                <h4>{title}</h4>
                <p>{subtitle}</p>
              </div>
              {href ? <FiArrowUpRight className="campus-action-arrow" aria-hidden="true" /> : null}
            </>
          )
          return href ? (
            <Link key={id ?? title} to={href} className={className} aria-label={`Open ${title}`}>
              {content}
            </Link>
          ) : (
            <article key={id ?? title} className={className}>
              {content}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CampusQuickActions
