import { TabNav } from '../../../components/ui'
import { BUSINESS_OPPORTUNITY_TABS } from '../opportunitiesData'

export function BusinessOpportunityTabs({ activeTab, onChangeTab }) {
  return (
    <TabNav
      activeId={activeTab}
      ariaLabel="Opportunity status"
      className="business-opportunities-tabs"
      items={BUSINESS_OPPORTUNITY_TABS}
      onChange={onChangeTab}
      tabClassName="business-opportunities-tab"
    />
  )
}
