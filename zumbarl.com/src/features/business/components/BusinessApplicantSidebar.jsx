import CampusSidebar from '../../../components/layout/CampusSidebar'
import { ACCESS_KEYS } from '../../auth/roleConfig'
import { BUSINESS_NAV_ITEMS, BUSINESS_VIEWER } from '../navigation'

export function BusinessWorkspaceSidebar({ activeItemId = 'home' }) {
  return (
    <CampusSidebar
      activeItemId={activeItemId}
      ariaLabel="Business workspace navigation"
      navItems={BUSINESS_NAV_ITEMS}
      profileAccess={ACCESS_KEYS.business.companyProfile}
      profileHref="/business/workspace"
      profileLabel="Business profile"
      supportCard={{
        title: 'Need talent?',
        description: 'Create a brief and review matched student talent.',
        actionLabel: 'Post Brief',
        actionHref: '/business/opportunities/create',
      }}
      viewer={BUSINESS_VIEWER}
    />
  )
}

export function BusinessApplicantSidebar() {
  return <BusinessWorkspaceSidebar activeItemId="applicants" />
}
