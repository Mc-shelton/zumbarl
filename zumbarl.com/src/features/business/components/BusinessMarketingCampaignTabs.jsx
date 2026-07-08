import { TabNav } from '../../../components/ui'

export function BusinessMarketingCampaignTabs({ activeTab, onChangeTab, tabs }) {
  return (
    <TabNav
      activeId={activeTab}
      ariaLabel="Campaign detail sections"
      className="business-marketing-detail-tabs"
      items={tabs}
      onChange={onChangeTab}
      renderTab={(tab) => `${tab.label}${tab.count ? ` (${tab.count})` : ''}`}
      tabClassName="business-marketing-detail-tab"
    />
  )
}
