import { FiBell, FiChevronDown, FiMessageCircle, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

export function BusinessMarketingCampaignTopBar({ campaign }) {
  const canCreateCampaign = hasAccess(ACCESS_KEYS.business.marketingCreate)
  const canOpenMessages = hasAccess(ACCESS_KEYS.business.messages)
  const canOpenNotifications = hasAccess(ACCESS_KEYS.business.notifications)

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

      <div className="business-workspace-header-actions">
        {canCreateCampaign ? (
          <Link to="/business/marketing/create" className="business-profile-primary-btn">
            <FiPlus aria-hidden="true" />
            Create Marketing Campaign
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
