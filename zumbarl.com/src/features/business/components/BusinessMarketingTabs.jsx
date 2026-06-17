import { BUSINESS_MARKETING_TABS } from '../marketingData'

export function BusinessMarketingTabs({ activeTab, onChangeTab }) {
  return (
    <div className="business-marketing-tabs" role="tablist" aria-label="Marketing campaign status">
      {BUSINESS_MARKETING_TABS.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`business-marketing-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
