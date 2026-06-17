import { FiAward, FiChevronDown, FiMapPin, FiMessageCircle, FiMoreVertical } from 'react-icons/fi'
import { ACCESS_KEYS, hasAnyAccess, hasAccess } from '../../auth/roleConfig'
import {
  BUSINESS_APPLICANT_METRICS,
  BUSINESS_APPLICANT_PROFILE,
  BUSINESS_APPLICANT_TAGS,
} from '../applicantProfileData'

export function BusinessApplicantHero() {
  const canMessage = hasAccess(ACCESS_KEYS.business.messages)
  const canMoveStage = hasAnyAccess([ACCESS_KEYS.business.pipelineBasic, ACCESS_KEYS.business.pipelineFull])

  return (
    <article className="business-profile-hero-card">
      <div className="business-profile-hero-top">
        <div className="business-profile-person">
          <div className="business-profile-photo-wrap">
            <img
              className="business-profile-photo"
              src={BUSINESS_APPLICANT_PROFILE.avatar}
              alt={BUSINESS_APPLICANT_PROFILE.name}
            />
            <i aria-hidden="true" />
          </div>

          <div className="business-profile-person-copy">
            <h1>
              {BUSINESS_APPLICANT_PROFILE.name}
              <span>{BUSINESS_APPLICANT_PROFILE.role}</span>
            </h1>
            <p>
              {BUSINESS_APPLICANT_PROFILE.school} - {BUSINESS_APPLICANT_PROFILE.year} -{' '}
              {BUSINESS_APPLICANT_PROFILE.focus}
            </p>
            <div className="business-profile-person-meta">
              <span><FiMapPin aria-hidden="true" />{BUSINESS_APPLICANT_PROFILE.location}</span>
              <span><FiMessageCircle aria-hidden="true" />{BUSINESS_APPLICANT_PROFILE.email}</span>
            </div>
            <div className="business-profile-tags">
              {BUSINESS_APPLICANT_TAGS.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="business-profile-hero-actions">
          {canMessage ? <button type="button" className="business-profile-ghost-btn">Message</button> : null}
          {canMoveStage ? (
            <button type="button" className="business-profile-primary-btn small">
              Move Stage
              <FiChevronDown aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className="business-profile-dots-btn" aria-label="More profile actions">
            <FiMoreVertical aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="business-profile-metrics-row">
        {BUSINESS_APPLICANT_METRICS.map((item) => (
          <article key={item.label} className="business-profile-metric">
            <p>{item.label}</p>
            <h3>{item.value}</h3>
            <span>
              {item.award ? <FiAward aria-hidden="true" /> : null}
              {item.sub}
            </span>
          </article>
        ))}
      </div>
    </article>
  )
}
