import { FiCalendar } from 'react-icons/fi'

function SummaryCard({ campaign }) {
  const summary = [
    ['Campaign ID', campaign.detail.campaignId],
    ['Created on', campaign.detail.createdAt],
    ['Created by', campaign.detail.createdBy],
    ['Campaign Type', campaign.detail.campaignType],
    ['Engagement Mode', campaign.detail.engagementMode],
    ['Pickup Access', campaign.detail.pickupAccess],
    ['Auto Close', campaign.detail.autoClose],
  ]

  return (
    <section className="business-profile-card business-marketing-detail-summary">
      <h2>Campaign Summary</h2>
      <dl>
        {summary.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{label === 'Auto Close' ? <><FiCalendar aria-hidden="true" /> {value}</> : value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function BudgetCard({ campaign }) {
  return (
    <section className="business-profile-card business-marketing-budget-card">
      <h2>Budget Overview</h2>
      <div className="business-marketing-budget-body">
        <div className="business-marketing-budget-ring">
          <strong>{campaign.budget}</strong>
          <span>Budget</span>
        </div>
        <ul>
          {campaign.detail.budget.map((item) => (
            <li key={item.label}>
              <span className={`tone-${item.tone}`} aria-hidden="true" />
              <div>
                <strong>{item.label}</strong>
                <p>{item.amount} ({item.percent}%)</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PerformanceCard({ campaign }) {
  return (
    <section className="business-profile-card business-marketing-performance-card">
      <header>
        <h2>Performance Overview</h2>
        <button type="button" className="business-workspace-filter">This week</button>
      </header>
      <ul>
        {campaign.detail.performance.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <b aria-hidden="true"><i /></b>
            <strong>{item.value}</strong>
            <em>{item.change}</em>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function BusinessMarketingCampaignRail({ campaign }) {
  return (
    <aside className="campus-rail business-workspace-rail business-marketing-detail-rail">
      <SummaryCard campaign={campaign} />
      <BudgetCard campaign={campaign} />
      <PerformanceCard campaign={campaign} />
    </aside>
  )
}
