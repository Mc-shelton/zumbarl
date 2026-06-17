import { FiCheckCircle, FiChevronRight, FiLink2, FiLock } from 'react-icons/fi'
import { ACCESS_KEYS, hasAnyAccess } from '../../auth/roleConfig'
import { resolveApplicantPipelineState } from '../services/businessPipelineService'

export function BusinessApplicantPipelineCard({ pipelineState }) {
  const canViewPipeline = hasAnyAccess([
    ACCESS_KEYS.business.pipelineBasic,
    ACCESS_KEYS.business.pipelineFull,
    ACCESS_KEYS.business.pipelineRead,
  ])
  const resolvedPipeline = pipelineState || resolveApplicantPipelineState()

  if (!canViewPipeline) {
    return null
  }

  return (
    <article className="business-profile-card">
      <header>
        <div>
          <h2>Pipeline Relationship</h2>
          <p>Your relationship with Aisha</p>
        </div>
      </header>

      <div className="business-pipeline-head">
        <div className="business-pipeline-account">
          <span>BM</span>
          <div>
            <h3>BrandMasters Agency</h3>
            <p>7 gigs - 2 endorsements</p>
          </div>
        </div>
        <p className="business-pipeline-status">{resolvedPipeline.currentStageLabel}</p>
        <span className="business-pipeline-date">Since {resolvedPipeline.since}</span>
        <button type="button" className="business-profile-icon-btn plain" aria-label="Open pipeline details">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="business-pipeline-track" aria-label="Pipeline journey">
        {resolvedPipeline.steps.map((step, index) => (
          <article key={step.label} className={`business-pipeline-step is-${step.status}`}>
            <i aria-hidden="true">
              {step.status === 'done' ? (
                <FiCheckCircle aria-hidden="true" />
              ) : step.status === 'active' ? (
                index + 1
              ) : (
                <FiLock aria-hidden="true" />
              )}
            </i>
            <h4>{step.label}</h4>
            <p>{step.date}</p>
          </article>
        ))}
      </div>

      <div className="business-pipeline-note">
        <FiLink2 aria-hidden="true" />
        <p>
          This talent is in an active pipeline with your company. Keep engaging to move closer to making an offer.
        </p>
      </div>
    </article>
  )
}
