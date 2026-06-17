import { FiAward, FiBarChart2, FiCheckCircle, FiDownload, FiFileText, FiUploadCloud } from 'react-icons/fi'
import { WorkflowStatusPanel } from '../../workflows/components/WorkflowStatusPanel'
import { MARKETING_WORKFLOW_MOCK } from '../../workflows/workflowData'
import { BusinessMarketingCreatorTable } from './BusinessMarketingCreatorTable'

function DetailList({ rows }) {
  return (
    <dl className="business-marketing-about-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{String(value).split('\n').map((line) => <span key={line}>{line}</span>)}</dd>
        </div>
      ))}
    </dl>
  )
}

function Timeline({ events }) {
  return (
    <ol className="business-marketing-timeline">
      {events.map((event) => (
        <li key={event.label} className={`is-${event.status}`}>
          <span aria-hidden="true" />
          <div>
            <strong>{event.label}</strong>
            <p>{event.date}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function CampaignWorkflowPanel({
  campaign,
  onEndorseTopCampaigners,
  onGenerateStats,
  onSubmitProof,
}) {
  const workflow = campaign.workflow || {}
  const items = [
    { label: 'Campaign funding', status: 'done', detail: `${MARKETING_WORKFLOW_MOCK.budgetCap} budget confirmed.` },
    { label: 'Proof collection', status: workflow.proofSubmitted ? 'done' : 'blocked', detail: workflow.proofSubmitted ? 'Latest campaigner proof submitted.' : 'Waiting for campaigner proof uploads.' },
    { label: 'Stats generation', status: workflow.statsGenerated ? 'done' : 'blocked', detail: workflow.statsGenerated ? 'Reach, engagement, and proof quality are available.' : 'Generate stats after proof is submitted.' },
    { label: 'Endorsement', status: workflow.endorsed ? 'done' : 'blocked', detail: workflow.endorsed ? 'Top campaigners endorsed.' : 'Endorse top campaigners after reviewing results.' },
  ]

  return (
    <WorkflowStatusPanel
      title="Campaign workflow controls"
      items={items}
      actions={(
        <>
          <button type="button" className="business-profile-ghost-btn" onClick={onSubmitProof}>
            <FiUploadCloud aria-hidden="true" />
            Mock proof submitted
          </button>
          <button type="button" className="business-profile-ghost-btn" onClick={onGenerateStats}>
            <FiBarChart2 aria-hidden="true" />
            Generate stats
          </button>
          <button type="button" className="business-profile-primary-btn" onClick={onEndorseTopCampaigners}>
            <FiAward aria-hidden="true" />
            Endorse top campaigners
          </button>
        </>
      )}
    />
  )
}

function ProofStats() {
  return (
    <section className="business-profile-card">
      <h2>Proof + Generated Stats</h2>
      <div className="workflow-inline-metrics">
        {MARKETING_WORKFLOW_MOCK.proofStats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
      <p>
        <FiCheckCircle aria-hidden="true" /> Stats are generated from submitted links, screenshots, and campaign proof.
      </p>
    </section>
  )
}

function Overview({ campaign, onEndorseTopCampaigners, onGenerateStats, onSubmitProof }) {
  return (
    <>
      <CampaignWorkflowPanel
        campaign={campaign}
        onEndorseTopCampaigners={onEndorseTopCampaigners}
        onGenerateStats={onGenerateStats}
        onSubmitProof={onSubmitProof}
      />
      <section className="business-profile-card business-marketing-overview-card">
        <div>
          <h2>About This Campaign</h2>
          <DetailList rows={campaign.detail.overview} />
          <div className="business-marketing-document-actions">
            <button type="button" className="business-profile-ghost-btn">
              <FiFileText aria-hidden="true" />
              View Brand Guidelines
            </button>
            <button type="button" className="business-profile-ghost-btn">
              <FiDownload aria-hidden="true" />
              Download Brief
            </button>
          </div>
        </div>
        <aside>
          <h2>Campaign Timeline</h2>
          <Timeline events={campaign.detail.timeline} />
        </aside>
      </section>
      <ProofStats />
      <BusinessMarketingCreatorTable campaign={campaign} />
    </>
  )
}

function Applications({ applications }) {
  return (
    <section className="business-marketing-simple-grid">
      {applications.map((item) => (
        <article key={item.label}>
          <strong>{item.value}</strong>
          <h2>{item.label}</h2>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  )
}

function SimpleList({ items, title }) {
  return (
    <section className="business-profile-card business-marketing-simple-list">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function BusinessMarketingCampaignBody({
  activeTab,
  campaign,
  onEndorseTopCampaigners,
  onGenerateStats,
  onSubmitProof,
}) {
  if (activeTab === 'creators') {
    return <BusinessMarketingCreatorTable campaign={campaign} />
  }

  if (activeTab === 'applications') {
    return <Applications applications={campaign.detail.applications} />
  }

  if (activeTab === 'performance') {
    return <Applications applications={campaign.detail.performance.map((item) => ({ label: item.label, value: item.value, detail: `${item.change} this week` }))} />
  }

  if (activeTab === 'payments') {
    return <Applications applications={campaign.detail.budget.map((item) => ({ label: item.label, value: item.amount, detail: `${item.percent}% of campaign budget` }))} />
  }

  if (activeTab === 'activity') {
    return <SimpleList title="Campaign Activity" items={campaign.detail.activity} />
  }

  return (
    <Overview
      campaign={campaign}
      onEndorseTopCampaigners={onEndorseTopCampaigners}
      onGenerateStats={onGenerateStats}
      onSubmitProof={onSubmitProof}
    />
  )
}
