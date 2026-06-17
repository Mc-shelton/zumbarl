import { BUSINESS_OPPORTUNITY_TABS } from '../opportunitiesData'

export function BusinessOpportunityTabs({ activeTab, onChangeTab }) {
  return (
    <div className="business-opportunities-tabs" role="tablist" aria-label="Opportunity status">
      {BUSINESS_OPPORTUNITY_TABS.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`business-opportunities-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
