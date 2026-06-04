import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiCreditCard,
  FiHome,
  FiMail,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { CAMPUS_NAV_ITEMS, CAMPUS_VIEWER } from '../../features/campus/constants'

const ICON_BY_ID = {
  bell: FiBell,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  calendar: FiCalendar,
  'credit-card': FiCreditCard,
  home: FiHome,
  mail: FiMail,
  truck: FiTruck,
  users: FiUsers,
}

function CampusSidebar({
  activeItemId,
  isProfileCurrent = false,
  navItems = CAMPUS_NAV_ITEMS,
  viewer = CAMPUS_VIEWER,
}) {
  return (
    <aside className="campus-sidebar" aria-label="Student portal navigation">
      <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
        <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
        <span className="campus-brand-text">zumbarl.</span>
      </Link>

      <nav className="campus-nav">
        {navItems.map(({ id, label, icon, href }) => {
          const Icon = ICON_BY_ID[icon]
          const isActive = id === activeItemId
          const content = (
            <>
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{label}</span>
            </>
          )

          return href ? (
            <Link
              key={id}
              to={href}
              className={`campus-nav-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </Link>
          ) : (
            <button
              key={id}
              type="button"
              className={`campus-nav-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </button>
          )
        })}
      </nav>

      <Link
        className={`campus-profile-card${isProfileCurrent ? ' is-current' : ''}`}
        to="/campus/profile"
        aria-current={isProfileCurrent ? 'page' : undefined}
        aria-label="Student profile"
      >
        <img className="campus-avatar" src={viewer.avatar} alt={viewer.name} />
        <div>
          <p className="campus-profile-name">{viewer.name}</p>
          <p className="campus-profile-meta meta-category">{viewer.role}</p>
          <p className="campus-profile-meta">{viewer.campus}</p>
        </div>
        <FiChevronRight aria-hidden="true" />
      </Link>

      <section className="campus-sidebar-card">
        <h3>Invite your friends</h3>
        <p>Bring your squad and earn rewards together.</p>
        <button type="button" className="campus-pill-btn">
          Invite Now
          <FiArrowRight aria-hidden="true" />
        </button>
      </section>
    </aside>
  )
}

export default CampusSidebar
