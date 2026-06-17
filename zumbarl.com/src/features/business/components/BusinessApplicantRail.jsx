import { FiArrowRight, FiCalendar, FiCheckCircle, FiChevronRight, FiMoreVertical, FiPlus, FiStar } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, hasAnyAccess, hasAccess } from '../../auth/roleConfig'
import {
  BUSINESS_APPLICANT_ENGAGEMENT_SUMMARY,
  BUSINESS_APPLICANT_QUICK_ACTIONS,
} from '../applicantProfileData'

export function BusinessApplicantRail({
  pipelineState,
  awardBudgetPaid,
  onAwardProject,
  onCreateOpportunity,
  onMoveToNextStage,
  onRemoveFromPipeline,
  onScheduleInterview,
  onShortlistApplicant,
  onPayAwardBudget,
}) {
  const canViewPipeline = hasAnyAccess([
    ACCESS_KEYS.business.pipelineBasic,
    ACCESS_KEYS.business.pipelineFull,
    ACCESS_KEYS.business.pipelineRead,
  ])
  const canManagePipeline = hasAnyAccess([ACCESS_KEYS.business.pipelineBasic, ACCESS_KEYS.business.pipelineFull])
  const canUseNotes = hasAccess(ACCESS_KEYS.business.notes)

  return (
    <aside className="business-profile-rail">
      {canViewPipeline ? (
        <TalentStageCard
          canManagePipeline={canManagePipeline}
          awardBudgetPaid={awardBudgetPaid}
          pipelineState={pipelineState}
          onAwardProject={onAwardProject}
          onMoveToNextStage={onMoveToNextStage}
          onRemoveFromPipeline={onRemoveFromPipeline}
          onScheduleInterview={onScheduleInterview}
          onShortlistApplicant={onShortlistApplicant}
          onPayAwardBudget={onPayAwardBudget}
        />
      ) : null}
      <EngagementSummaryCard />
      {canUseNotes ? <NotesCard /> : null}
      {BUSINESS_APPLICANT_QUICK_ACTIONS.length ? (
        <QuickActionsCard
          actions={BUSINESS_APPLICANT_QUICK_ACTIONS}
          onCreateOpportunity={onCreateOpportunity}
        />
      ) : null}
      <AiRecommendationCard />
    </aside>
  )
}

function TalentStageCard({
  canManagePipeline,
  awardBudgetPaid,
  pipelineState,
  onAwardProject,
  onMoveToNextStage,
  onRemoveFromPipeline,
  onScheduleInterview,
  onShortlistApplicant,
  onPayAwardBudget,
}) {
  const isClosed = pipelineState?.isAwarded || pipelineState?.isRemoved

  return (
    <article className="business-profile-card business-rail-stage">
      <header>
        <h2>Talent Stage</h2>
        <button type="button" className="business-profile-dots-btn" aria-label="Stage settings">
          <FiMoreVertical aria-hidden="true" />
        </button>
      </header>

      <div className="business-stage-status">
        <p>
          <FiCheckCircle aria-hidden="true" />
          {pipelineState?.currentStageLabel || 'Pipeline Active'}
        </p>
        <span>Since {pipelineState?.since || 'Apr 8, 2025'}</span>
        <small>{pipelineState?.nextAction?.label || 'No further stage action pending.'}</small>
      </div>

      {canManagePipeline ? (
        <>
          <h3>Stage actions</h3>
          {pipelineState?.nextAction ? (
            <button type="button" className="business-stage-btn" onClick={onMoveToNextStage}>
              {pipelineState.nextAction.label}
              <FiChevronRight aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className="business-stage-btn" disabled={isClosed} onClick={onShortlistApplicant}>
            Shortlist
            <FiChevronRight aria-hidden="true" />
          </button>
          <button type="button" className="business-stage-btn" disabled={isClosed} onClick={onScheduleInterview}>
            Schedule Interview
            <FiCalendar aria-hidden="true" />
          </button>
          {!awardBudgetPaid ? (
            <button type="button" className="business-stage-btn" disabled={isClosed} onClick={onPayAwardBudget}>
              Pay budget to Zumbarl
              <FiChevronRight aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className="business-stage-btn" disabled={isClosed || !awardBudgetPaid} onClick={onAwardProject}>
            Award Project
            <FiChevronRight aria-hidden="true" />
          </button>
          <button type="button" className="business-stage-btn danger" disabled={isClosed} onClick={onRemoveFromPipeline}>
            Remove from Pipeline
            <FiChevronRight aria-hidden="true" />
          </button>
        </>
      ) : null}
    </article>
  )
}

function EngagementSummaryCard() {
  return (
    <article className="business-profile-card">
      <h2>Engagement Summary</h2>
      <ul className="business-compact-list">
        {BUSINESS_APPLICANT_ENGAGEMENT_SUMMARY.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  )
}

function NotesCard() {
  return (
    <article className="business-profile-card">
      <header>
        <h2>Notes</h2>
        <button type="button" className="business-link-btn">View all</button>
      </header>
      <p className="business-note-copy">
        Discussed social media strategy role. Impressed with creativity and communication.
        Concern for long-term retainer.
      </p>
      <p className="business-note-meta">Sarah K. - May 15, 2025</p>
      <button type="button" className="business-note-add-btn">
        <FiPlus aria-hidden="true" /> Add Note
      </button>
    </article>
  )
}

function QuickActionsCard({ actions, onCreateOpportunity }) {
  return (
    <article className="business-profile-card">
      <h2>Quick Actions</h2>
      <div className="business-quick-actions">
        {actions.map(({ label, Icon }) => {
          const content = (
            <>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <FiChevronRight aria-hidden="true" />
            </>
          )

          return label === 'Invite to Opportunity' ? (
            <Link key={label} to="/business/opportunities/create" className="business-quick-action-btn" onClick={onCreateOpportunity}>
              {content}
            </Link>
          ) : (
            <button key={label} type="button" className="business-quick-action-btn">
              {content}
            </button>
          )
        })}
      </div>
    </article>
  )
}

function AiRecommendationCard() {
  return (
    <article className="business-profile-card business-ai-card">
      <header>
        <p><FiStar aria-hidden="true" /> AI Recommendation</p>
        <span>Beta</span>
      </header>
      <h3>High potential talent</h3>
      <strong>94% match</strong>
      <ul>
        <li>Social Media Manager</li>
        <li>Content Creator</li>
        <li>Marketing Assistant</li>
        <li>Brand Designer</li>
      </ul>
      <button type="button">
        View Recommended Roles
        <FiArrowRight aria-hidden="true" />
      </button>
    </article>
  )
}
