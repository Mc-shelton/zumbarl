import { FiBell, FiChevronDown, FiMessageCircle } from 'react-icons/fi'
import { CAMPUS_VIEWER } from '../../features/campus/constants'

function CampusTopActions({
  className = '',
  primaryAction = null,
  userButtonClassName = 'opportunities-user-btn',
  showUserChevron = false,
  viewer = CAMPUS_VIEWER,
}) {
  return (
    <div className={className}>
      {primaryAction}
      <button type="button" className="campus-icon-btn" aria-label="Open messages">
        <FiMessageCircle aria-hidden="true" />
        <span className="campus-badge">3</span>
      </button>
      <button type="button" className="campus-icon-btn" aria-label="Open notifications">
        <FiBell aria-hidden="true" />
        <span className="campus-badge">6</span>
      </button>
      <button type="button" className={userButtonClassName} aria-label="Open profile menu">
        <img src={viewer.avatar} alt={`${viewer.name} avatar`} />
        {showUserChevron ? <FiChevronDown aria-hidden="true" /> : null}
      </button>
    </div>
  )
}

export default CampusTopActions
