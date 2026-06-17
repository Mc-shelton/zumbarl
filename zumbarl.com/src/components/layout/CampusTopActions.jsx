import { FiBell, FiChevronDown, FiMessageCircle } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../features/auth/roleConfig'
import { CAMPUS_VIEWER } from '../../features/campus/constants'

function CampusTopActions({
  as: Component = 'div',
  className = '',
  label,
  primaryAction = null,
  showUserButton = true,
  userButtonClassName = 'opportunities-user-btn',
  showUserChevron = false,
  viewer = CAMPUS_VIEWER,
}) {
  const canOpenMessages = hasAccess(ACCESS_KEYS.campus.messages)
  const canOpenNotifications = hasAccess(ACCESS_KEYS.campus.notifications)
  const canViewProfile = hasAccess(ACCESS_KEYS.profile.viewOwn)

  return (
    <Component className={className} aria-label={label}>
      {primaryAction}
      {canOpenMessages ? (
        <button type="button" className="campus-icon-btn" aria-label="Open messages">
          <FiMessageCircle aria-hidden="true" />
          <span className="campus-badge">3</span>
        </button>
      ) : null}
      {canOpenNotifications ? (
        <button type="button" className="campus-icon-btn" aria-label="Open notifications">
          <FiBell aria-hidden="true" />
          <span className="campus-badge">6</span>
        </button>
      ) : null}
      {showUserButton && canViewProfile ? (
        <button type="button" className={userButtonClassName} aria-label="Open profile menu">
          <img src={viewer.avatar} alt={`${viewer.name} avatar`} />
          {showUserChevron ? <FiChevronDown aria-hidden="true" /> : null}
        </button>
      ) : null}
    </Component>
  )
}

export default CampusTopActions
