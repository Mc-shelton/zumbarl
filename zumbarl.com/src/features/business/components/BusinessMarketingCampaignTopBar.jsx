import { FiChevronDown, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { BUSINESS_VIEWER } from '../../auth/viewerProfile'

export function BusinessMarketingCampaignTopBar({ campaign }) {
  const canCreateCampaign = hasAccess(ACCESS_KEYS.business.marketingCreate)
  const primaryAction = canCreateCampaign ? (
    <Link to="/business/marketing/create" className="business-profile-primary-btn">
      <FiPlus aria-hidden="true" />
      Create Marketing Campaign
      <FiChevronDown aria-hidden="true" />
    </Link>
  ) : null

  return (
    <header className="business-marketing-detail-topbar">
      <Breadcrumb
        className="business-marketing-breadcrumb"
        items={[
          { label: 'Marketing', href: '/business/marketing' },
          { label: 'All Campaigns', href: '/business/marketing' },
          { label: campaign.title },
        ]}
      />

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
