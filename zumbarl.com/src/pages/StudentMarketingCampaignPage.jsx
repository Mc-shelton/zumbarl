import { useState } from 'react'
import { FiAward, FiCheckCircle, FiSend, FiUploadCloud } from 'react-icons/fi'
import { Link, Navigate, useParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { getBusinessMarketingCampaign } from '../features/business/services/businessMarketingService'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import { MARKETING_WORKFLOW_MOCK } from '../features/workflows/workflowData'
import '../styles/campus.css'
import '../styles/opportunities.css'
import '../styles/workflows.css'

function StudentMarketingCampaignPage() {
  const { campaignId } = useParams()
  const campaign = getBusinessMarketingCampaign(campaignId)
  const [accepted, setAccepted] = useState(false)
  const [proofSubmitted, setProofSubmitted] = useState(false)
  const [endorsed, setEndorsed] = useState(false)

  if (!campaign) return <Navigate to="/campus/opportunities" replace />

  const isEligible = true

  return (
    <main className="campus-page opportunities-page student-marketing-page">
      <Seo
        title={`${campaign.title} | Student Marketing Campaign | Zumbarl`}
        description="Accept a Zumbarl student creator campaign, submit proof, and track endorsement readiness."
        path={`/campus/opportunities/marketing/${campaign.id}`}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-bid-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main opportunities-bid-main">
            <nav className="student-marketing-back">
              <Link to="/campus/opportunities">Back to opportunities</Link>
            </nav>

            <section className="opportunities-bid-form-card student-marketing-hero">
              <header>
                <span>Student campaign workflow</span>
                <h1>{campaign.title}</h1>
                <p>{campaign.description}</p>
              </header>

              <div className="workflow-inline-metrics">
                {MARKETING_WORKFLOW_MOCK.proofStats.map((item) => (
                  <article key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </section>

            <WorkflowStatusPanel
              title="Student campaign gates"
              items={[
                { label: 'Eligibility check', status: isEligible ? 'done' : 'blocked', detail: MARKETING_WORKFLOW_MOCK.eligibility.join(', ') },
                { label: 'Budget cap', status: 'done', detail: `${MARKETING_WORKFLOW_MOCK.remainingBudget} still available for eligible campaigners.` },
                { label: 'Campaign accepted', status: accepted ? 'done' : 'blocked', detail: accepted ? 'You can now execute the campaign.' : 'Accept the campaign to begin.' },
                { label: 'Proof submitted', status: proofSubmitted ? 'done' : 'blocked', detail: proofSubmitted ? 'Proof is ready for stats generation.' : 'Submit social links, screenshots, and reach evidence.' },
                { label: 'Endorsement', status: endorsed ? 'done' : 'blocked', detail: endorsed ? 'Top campaigner endorsement recorded.' : 'Endorsement unlocks after result review.' },
              ]}
              actions={(
                <>
                  <button type="button" className="project-primary-btn" disabled={!isEligible || accepted} onClick={() => setAccepted(true)}>
                    <FiCheckCircle aria-hidden="true" />
                    Accept campaign
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!accepted || proofSubmitted} onClick={() => setProofSubmitted(true)}>
                    <FiUploadCloud aria-hidden="true" />
                    Submit proof
                  </button>
                  <button type="button" className="project-soft-btn" disabled={!proofSubmitted || endorsed} onClick={() => setEndorsed(true)}>
                    <FiAward aria-hidden="true" />
                    Mock top endorsement
                  </button>
                </>
              )}
            />

            <section className="opportunities-bid-form-card student-marketing-proof">
              <header>
                <h2>Proof package</h2>
                <p>Use this mock proof form to represent the student side of the campaign workflow.</p>
              </header>
              <div className="opportunities-bid-field">
                <label htmlFor="campaign-proof-link">Post link</label>
                <input id="campaign-proof-link" type="url" defaultValue="https://www.instagram.com/reel/zetech-level-up" />
              </div>
              <div className="opportunities-bid-field">
                <label htmlFor="campaign-proof-summary">Proof notes</label>
                <textarea
                  id="campaign-proof-summary"
                  defaultValue="Posted an Instagram reel and TikTok story with approved hashtags, CTA, and product mention."
                />
              </div>
              <footer className="opportunities-bid-form-foot">
                <button type="button" className="opportunities-detail-bid-btn" disabled={!accepted} onClick={() => setProofSubmitted(true)}>
                  Submit proof package
                  <FiSend aria-hidden="true" />
                </button>
              </footer>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

export default StudentMarketingCampaignPage
