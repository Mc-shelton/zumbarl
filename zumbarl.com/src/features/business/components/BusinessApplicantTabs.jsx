import { TabNav } from '../../../components/ui'
import { BUSINESS_APPLICANT_TABS } from '../applicantProfileData'

const APPLICANT_TAB_ITEMS = BUSINESS_APPLICANT_TABS.map((tab) => ({ id: tab, label: tab }))

export function BusinessApplicantTabs({ activeTab, onTabChange }) {
  return (
    <TabNav
      activeId={activeTab}
      ariaLabel="Profile tabs"
      className="business-profile-tabs"
      items={APPLICANT_TAB_ITEMS}
      onChange={onTabChange}
      tabClassName="business-profile-tab"
    />
  )
}
