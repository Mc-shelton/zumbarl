import { FiBell, FiChevronDown, FiMessageCircle, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

export function BusinessWorkspaceHeader({
  description = 'Discover, engage and grow with top student talent.',
  onCreateOpportunity,
  onPrimaryAction,
  primaryActionAccess = ACCESS_KEYS.business.postOpportunities,
  primaryActionHref,
  primaryActionLabel = 'Create Opportunity',
  title = 'Welcome back, Zetech Studios!',
}) {
  const handlePrimaryAction = onPrimaryAction || onCreateOpportunity
  const canUsePrimaryAction = (primaryActionHref || handlePrimaryAction) && hasAccess(primaryActionAccess)
  const canOpenMessages = hasAccess(ACCESS_KEYS.business.messages)
  const canOpenNotifications = hasAccess(ACCESS_KEYS.business.notifications)

  return (
    <header className="business-workspace-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="business-workspace-header-actions">
        {canUsePrimaryAction ? (
          primaryActionHref ? (
            <Link to={primaryActionHref} className="business-profile-primary-btn">
              <FiPlus aria-hidden="true" />
              {primaryActionLabel}
              <FiChevronDown aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" className="business-profile-primary-btn" onClick={handlePrimaryAction}>
              <FiPlus aria-hidden="true" />
              {primaryActionLabel}
              <FiChevronDown aria-hidden="true" />
            </button>
          )
        ) : null}
        {canOpenMessages ? (
          <button type="button" className="business-profile-icon-btn" aria-label="Open messages">
            <FiMessageCircle aria-hidden="true" />
            <b>6</b>
          </button>
        ) : null}
        {canOpenNotifications ? (
          <button type="button" className="business-profile-icon-btn" aria-label="Open notifications">
            <FiBell aria-hidden="true" />
            <b>3</b>
          </button>
        ) : null}
        <button type="button" className="business-profile-user-btn" aria-label="Open profile menu">ZS</button>
        <button type="button" className="business-profile-chevron-btn" aria-label="Expand user menu">
          <FiChevronDown aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
