import {
  FiBell,
  FiChevronDown,
  FiMessageCircle,
  FiPlus,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { BUSINESS_APPLICANT_PROFILE } from '../applicantProfileData'

export function BusinessApplicantTopBar({ onCreateOpportunity }) {
  const canCreateOpportunity = hasAccess(ACCESS_KEYS.business.postOpportunities)
  const canOpenMessages = hasAccess(ACCESS_KEYS.business.messages)
  const canOpenNotifications = hasAccess(ACCESS_KEYS.business.notifications)

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

      <div className="business-profile-top-actions">
        {canCreateOpportunity ? (
          <Link to="/business/opportunities/create" className="business-profile-primary-btn" onClick={onCreateOpportunity}>
            <FiPlus aria-hidden="true" />
            Create Opportunity
            <FiChevronDown aria-hidden="true" />
          </Link>
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
