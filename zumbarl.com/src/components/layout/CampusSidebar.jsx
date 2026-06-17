import {
  FiArrowRight,
  FiActivity,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiMail,
  FiRadio,
  FiSearch,
  FiSettings,
  FiTruck,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, filterByAccess, hasAccess } from '../../features/auth/roleConfig'
import { CAMPUS_NAV_ITEMS, CAMPUS_VIEWER } from '../../features/campus/constants'

const ICON_BY_ID = {
  activity: FiActivity,
  analytics: FiBarChart2,
  bell: FiBell,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  calendar: FiCalendar,
  'credit-card': FiCreditCard,
  file: FiFileText,
  home: FiHome,
  mail: FiMail,
  marketing: FiRadio,
  search: FiSearch,
  settings: FiSettings,
  trending: FiTrendingUp,
  truck: FiTruck,
  user: FiUser,
  users: FiUsers,
}

function CampusSidebar({
  activeItemId,
  ariaLabel = 'Student portal navigation',
  isProfileCurrent = false,
  navItems = CAMPUS_NAV_ITEMS,
  profileAccess = ACCESS_KEYS.profile.viewOwn,
  profileHref = '/campus/profile',
  profileLabel = 'Student profile',
  supportCard = {
    title: 'Invite your friends',
    description: 'Bring your squad and earn rewards together.',
    actionLabel: 'Invite Now',
  },
  viewer = CAMPUS_VIEWER,
}) {
  const accessibleNavItems = filterByAccess(navItems)
  const canViewProfile = hasAccess(profileAccess)

  return (
    <aside className="campus-sidebar" aria-label={ariaLabel}>
      <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
        <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
        <span className="campus-brand-text">zumbarl.</span>
      </Link>

      <nav className="campus-nav">
        {accessibleNavItems.map(({ id, label, icon, href, badge }) => {
          const Icon = ICON_BY_ID[icon]
          const isActive = id === activeItemId
          const content = (
            <>
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{label}</span>
              {badge ? <em>{badge}</em> : null}
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

      {canViewProfile ? (
        <Link
          className={`campus-profile-card${isProfileCurrent ? ' is-current' : ''}`}
          to={profileHref}
          aria-current={isProfileCurrent ? 'page' : undefined}
          aria-label={profileLabel}
        >
          <img className="campus-avatar" src={viewer.avatar} alt={viewer.name} />
          <div>
            <p className="campus-profile-name">{viewer.name}</p>
            <p className="campus-profile-meta meta-category">{viewer.role}</p>
            <p className="campus-profile-meta">{viewer.campus || viewer.meta}</p>
          </div>
          <FiChevronRight aria-hidden="true" />
        </Link>
      ) : null}

      {supportCard ? (
        <section className="campus-sidebar-card">
          <h3>{supportCard.title}</h3>
          <p>{supportCard.description}</p>
          {supportCard.actionHref ? (
            <Link to={supportCard.actionHref} className="campus-pill-btn">
              {supportCard.actionLabel}
              <FiArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" className="campus-pill-btn" onClick={supportCard.onAction}>
              {supportCard.actionLabel}
              <FiArrowRight aria-hidden="true" />
            </button>
          )}
        </section>
      ) : null}
    </aside>
  )
}

export default CampusSidebar
