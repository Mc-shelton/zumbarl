import { TabNav } from '../../../components/ui'
import { BUSINESS_MARKETING_TABS } from '../marketingData'

export function BusinessMarketingTabs({ activeTab, onChangeTab }) {
  return (
    <TabNav
      activeId={activeTab}
      ariaLabel="Marketing campaign status"
      className="business-marketing-tabs"
      items={BUSINESS_MARKETING_TABS}
      onChange={onChangeTab}
      tabClassName="business-marketing-tab"
    />
  )
}
