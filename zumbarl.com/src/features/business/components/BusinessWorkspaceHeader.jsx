import { FiBell, FiChevronDown, FiMessageCircle, FiPlus } from 'react-icons/fi'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_ROLE_STORAGE_KEY, ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { AUTH_TOKEN_KEY } from '../../../lib/sendZumbarlApiRequest'

export function BusinessWorkspaceHeader({
  description = 'Discover, engage and grow with top student talent.',
  onCreateOpportunity,
  onPrimaryAction,
  primaryActionAccess = ACCESS_KEYS.business.postOpportunities,
  primaryActionHref,
  primaryActionLabel = 'Create Opportunity',
  title = 'Welcome back, Zetech Studios!',
}) {
  const navigate = useNavigate()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const handlePrimaryAction = onPrimaryAction || onCreateOpportunity
  const canUsePrimaryAction = (primaryActionHref || handlePrimaryAction) && hasAccess(primaryActionAccess)
  const canOpenMessages = hasAccess(ACCESS_KEYS.business.messages)
  const canOpenNotifications = hasAccess(ACCESS_KEYS.business.notifications)

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
    navigate('/login', { replace: true })
  }

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
        <div className="business-profile-menu-wrap">
          <button
            type="button"
            className="business-profile-user-btn"
            aria-expanded={isProfileMenuOpen}
            aria-label="Open profile menu"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            ZS
          </button>
          <button
            type="button"
            className="business-profile-chevron-btn"
            aria-expanded={isProfileMenuOpen}
            aria-label="Expand user menu"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            <FiChevronDown aria-hidden="true" />
          </button>
          {isProfileMenuOpen ? (
            <div className="business-profile-menu" role="menu">
              <Link to="/business/workspace" role="menuitem">Business profile</Link>
              <Link to="/business/settings" role="menuitem">Settings</Link>
              <button type="button" role="menuitem" onClick={handleLogout}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
