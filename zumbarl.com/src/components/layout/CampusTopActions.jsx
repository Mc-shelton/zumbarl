import { useState } from 'react'
import { FiBell, FiChevronDown, FiMessageCircle } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { ACCESS_KEYS, AUTH_ROLE_STORAGE_KEY, hasAccess } from '../../features/auth/roleConfig'
import { AUTH_TOKEN_KEY } from '../../lib/sendZumbarlApiRequest'
import { getCurrentViewerProfile } from '../../features/auth/viewerProfile'

const ACTION_ACCESS_KEYS = {
  campus: {
    messages: ACCESS_KEYS.campus.messages,
    notifications: ACCESS_KEYS.campus.notifications,
    profile: ACCESS_KEYS.profile.viewOwn,
  },
  business: {
    messages: ACCESS_KEYS.business.messages,
    notifications: ACCESS_KEYS.business.notifications,
    profile: ACCESS_KEYS.business.dashboard,
  },
}

function CampusTopActions({
  as: Component = 'div',
  className = '',
  iconButtonClassName = 'campus-icon-btn',
  label,
  menuItems = [],
  onLogout,
  primaryAction = null,
  scope = 'campus',
  showMenu = false,
  showUserButton = true,
  userButtonClassName = 'opportunities-user-btn',
  showUserChevron = false,
  viewer,
}) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const accessKeys = ACTION_ACCESS_KEYS[scope] || ACTION_ACCESS_KEYS.campus
  const currentViewer = getCurrentViewerProfile(viewer)
  const canOpenMessages = hasAccess(accessKeys.messages)
  const canOpenNotifications = hasAccess(accessKeys.notifications)
  const canViewProfile = !accessKeys.profile || hasAccess(accessKeys.profile)

  function handleLogout() {
    if (onLogout) {
      onLogout()
      return
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
    navigate('/login', { replace: true })
  }

  return (
    <Component className={`app-top-actions ${className}`.trim()} aria-label={label}>
      {primaryAction}
      {canOpenMessages ? (
        <button type="button" className={iconButtonClassName} aria-label="Open messages">
          <FiMessageCircle aria-hidden="true" />
          <span className="campus-badge">3</span>
        </button>
      ) : null}
      {canOpenNotifications ? (
        <button type="button" className={iconButtonClassName} aria-label="Open notifications">
          <FiBell aria-hidden="true" />
          <span className="campus-badge">6</span>
        </button>
      ) : null}
      {showUserButton && canViewProfile ? (
        <div className="app-profile-menu-wrap">
          <button
            type="button"
            className={`app-user-btn ${userButtonClassName}`.trim()}
            aria-expanded={showMenu ? isMenuOpen : undefined}
            aria-label="Open profile menu"
            onClick={() => (showMenu ? setIsMenuOpen((current) => !current) : undefined)}
          >
            {currentViewer.avatar ? (
              <img src={currentViewer.avatar} alt={`${currentViewer.name} avatar`} />
            ) : (
              <span>{currentViewer.initials}</span>
            )}
            {showUserChevron ? <FiChevronDown aria-hidden="true" /> : null}
          </button>
          {showMenu ? (
            <>
              <button
                type="button"
                className="business-profile-chevron-btn"
                aria-expanded={isMenuOpen}
                aria-label="Expand user menu"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <FiChevronDown aria-hidden="true" />
              </button>
              {isMenuOpen ? (
                <div className="business-profile-menu" role="menu">
                  {menuItems.map((item) => (
                    <Link key={item.href} to={item.href} role="menuitem">{item.label}</Link>
                  ))}
                  <button type="button" role="menuitem" onClick={handleLogout}>Logout</button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </Component>
  )
}

export default CampusTopActions
