export function BusinessMarketingCampaignTabs({ activeTab, onChangeTab, tabs }) {
  return (
    <div className="business-marketing-detail-tabs" role="tablist" aria-label="Campaign detail sections">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`business-marketing-detail-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}{tab.count ? ` (${tab.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
