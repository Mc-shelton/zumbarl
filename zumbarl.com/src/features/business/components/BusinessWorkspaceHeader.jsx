import { FiChevronDown, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { BUSINESS_VIEWER } from '../../auth/viewerProfile'

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
  const primaryAction = canUsePrimaryAction ? (
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
  ) : null

  return (
    <header className="business-workspace-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <CampusTopActions
        className="business-workspace-header-actions"
        iconButtonClassName="business-profile-icon-btn"
        menuItems={[
          { label: 'Business profile', href: '/business/workspace' },
          { label: 'Settings', href: '/business/settings' },
        ]}
        primaryAction={primaryAction}
        scope="business"
        showMenu
        userButtonClassName="business-profile-user-btn"
        viewer={BUSINESS_VIEWER}
      />
    </header>
  )
}
