import { FiChevronDown, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { BUSINESS_VIEWER } from '../../auth/viewerProfile'
import { BUSINESS_APPLICANT_PROFILE } from '../applicantProfileData'

export function BusinessApplicantTopBar({ onCreateOpportunity }) {
  const canCreateOpportunity = hasAccess(ACCESS_KEYS.business.postOpportunities)
  const primaryAction = canCreateOpportunity ? (
    <Link to="/business/opportunities/create" className="business-profile-primary-btn" onClick={onCreateOpportunity}>
      <FiPlus aria-hidden="true" />
      Create Opportunity
      <FiChevronDown aria-hidden="true" />
    </Link>
  ) : null

  return (
    <header className="business-profile-topbar">
      <Breadcrumb
        className="business-profile-crumbs"
        items={[
          { label: 'Business', href: '/business/workspace' },
          { label: 'Applicants' },
          { label: BUSINESS_APPLICANT_PROFILE.name },
        ]}
      />

      <CampusTopActions
        className="business-profile-top-actions"
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
