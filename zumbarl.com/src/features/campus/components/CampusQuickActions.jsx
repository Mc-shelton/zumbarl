import { FiMoreHorizontal } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { QUICK_ACTIONS } from '../homeData'

function CampusQuickActions() {
  return (
    <section className="campus-section">
      <h3>What would you like to do?</h3>
      <div className="campus-actions-grid">
        {QUICK_ACTIONS.map(({ title, subtitle, Icon, href }) =>
          href ? (
            <Link key={title} to={href} className="campus-action-card" aria-label={`Open ${title}`}>
              <div className="campus-action-icon">
                <Icon aria-hidden="true" />
              </div>
              <h4>{title}</h4>
              <p>{subtitle}</p>
            </Link>
          ) : (
            <article key={title} className="campus-action-card">
              <div className="campus-action-icon">
                <Icon aria-hidden="true" />
              </div>
              <h4>{title}</h4>
              <p>{subtitle}</p>
            </article>
          )
        )}
        <article className="campus-action-card is-more">
          <div className="campus-action-icon">
            <FiMoreHorizontal aria-hidden="true" />
          </div>
          <h4>More</h4>
          <p>Explore all</p>
        </article>
      </div>
    </section>
  )
}

export default CampusQuickActions
