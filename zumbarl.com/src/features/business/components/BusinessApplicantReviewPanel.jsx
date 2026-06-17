import { FiBriefcase, FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiSend, FiShield } from 'react-icons/fi'
import { ACCESS_KEYS, hasAnyAccess } from '../../auth/roleConfig'

function getEventLabel(action) {
  const labels = {
    awarded: 'Awarded',
    guardrail_unlocked: 'Guardrail Unlocked',
    interview_scheduled: 'Interview Scheduled',
    opportunity_created: 'Opportunity Created',
    removed: 'Removed',
    shortlisted: 'Shortlisted',
  }

  return labels[action] || action
}

export function BusinessApplicantReviewPanel({
  awardResult,
  awardBudgetPaid,
  hiringGuardrail,
  opportunity,
  pipelineState,
  reviewEvents,
  onAwardProject,
  onPayAwardBudget,
  onScheduleInterview,
  onShortlistApplicant,
  onUnlockGuardrail,
}) {
  const canAward = hasAnyAccess([
    ACCESS_KEYS.business.pipelineFull,
    ACCESS_KEYS.business.formalOffers,
    ACCESS_KEYS.business.postOpportunities,
  ])
  const canShortlist = hasAnyAccess([
    ACCESS_KEYS.business.pipelineBasic,
    ACCESS_KEYS.business.pipelineFull,
    ACCESS_KEYS.business.flagPipelineCandidates,
  ])
  const isPipelineClosed = pipelineState?.isAwarded || pipelineState?.isRemoved

  if (!opportunity) return null

  return (
    <article className="business-profile-card business-review-panel">
      <header>
        <div>
          <p className="business-section-kicker">Applicant Review</p>
          <h2>{opportunity.title}</h2>
        </div>
        <span className="business-review-status">{pipelineState?.currentStageLabel || opportunity.status}</span>
      </header>

      <div className="business-review-brief">
        <p>{opportunity.summary}</p>
        <dl>
          <div>
            <dt>Budget</dt>
            <dd>{opportunity.budget}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{opportunity.mode}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{opportunity.deadline}</dd>
          </div>
        </dl>
      </div>

      <div className="business-review-skills" aria-label="Required skills">
        {opportunity.skills.split(',').map((skill) => (
          <span key={skill.trim()}>{skill.trim()}</span>
        ))}
      </div>

      <div className="business-review-actions">
        {canShortlist ? (
          <button
            type="button"
            className="business-profile-ghost-btn"
            disabled={isPipelineClosed}
            onClick={onShortlistApplicant}
          >
            <FiCheckCircle aria-hidden="true" />
            Shortlist
          </button>
        ) : null}
        {canShortlist ? (
          <button
            type="button"
            className="business-profile-ghost-btn"
            disabled={isPipelineClosed}
            onClick={onScheduleInterview}
          >
            <FiCalendar aria-hidden="true" />
            Schedule Interview
          </button>
        ) : null}
        {canAward ? (
          <button
            type="button"
            className="business-profile-primary-btn"
            disabled={!awardBudgetPaid || hiringGuardrail?.requiresUnlock || isPipelineClosed}
            onClick={onAwardProject}
          >
            <FiBriefcase aria-hidden="true" />
            Award Project
          </button>
        ) : null}
      </div>

      <section className={`business-guardrail-card${awardBudgetPaid ? '' : ' is-blocking'}`}>
        <FiCreditCard aria-hidden="true" />
        <div>
          <strong>Budget escrow gate</strong>
          <p>
            {awardBudgetPaid
              ? 'Budget is paid to Zumbarl. Award actions are now available.'
              : 'Pay the agreed budget to Zumbarl before awarding the bidder or reviewing future submissions.'}
          </p>
        </div>
        {!awardBudgetPaid ? (
          <button type="button" className="business-profile-ghost-btn" onClick={onPayAwardBudget}>
            Mark budget paid
          </button>
        ) : null}
      </section>

      {hiringGuardrail ? (
        <section className={`business-guardrail-card${hiringGuardrail.requiresUnlock ? ' is-blocking' : ''}`}>
          <FiShield aria-hidden="true" />
          <div>
            <strong>Hiring guardrail</strong>
            <p>
              {hiringGuardrail.awardedCount}/{hiringGuardrail.hireLimit} repeat hires used.{' '}
              {hiringGuardrail.requiresUnlock
                ? 'Mentorship or coaching must be recorded before another award.'
                : hiringGuardrail.status}
            </p>
          </div>
          {hiringGuardrail.requiresUnlock ? (
            <button type="button" className="business-profile-ghost-btn" onClick={onUnlockGuardrail}>
              Record mentorship plan
            </button>
          ) : null}
        </section>
      ) : null}

      {awardResult ? (
        <p className="business-review-result" role="status">
          <FiSend aria-hidden="true" />
          Project created: {awardResult.project.title}
        </p>
      ) : null}

      <section className="business-review-log" aria-label="Review activity">
        <h3>Activity Logs</h3>
        <ul>
          {reviewEvents.map((event) => (
            <li key={event.id}>
              <FiClock aria-hidden="true" />
              <div>
                <strong>{getEventLabel(event.action)}</strong>
                <p>{event.detail}</p>
                <span>{event.createdAt}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
