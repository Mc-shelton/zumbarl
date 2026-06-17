import { FiArrowRight, FiDownload, FiStar } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import {
  EXPERIENCE_CURRENT_STAGE,
  EXPERIENCE_STAGES,
  EXPERIENCE_STAGE_PROJECTS,
} from '../constants'

function ProfileExperiencePanel() {
  const canDownloadProgress = hasAccess(ACCESS_KEYS.profile.downloadCv)

  return (
    <section className="campus-profile-surface campus-experience-panel">
      <header className="campus-experience-head">
        <div>
          <h2>Career Pipeline & Experience</h2>
          <p>Your journey in the Marketing & Design career path</p>
        </div>
        <div className="campus-experience-head-actions">
          <button type="button" className="campus-experience-outline-btn">
            View Full Roadmap
            <FiArrowRight aria-hidden="true" />
          </button>
          {canDownloadProgress ? (
            <button type="button" className="campus-experience-outline-btn">
              <FiDownload aria-hidden="true" />
              Download Progress
            </button>
          ) : null}
        </div>
      </header>

      <div className="campus-experience-layout">
        <section className="campus-experience-stage-list" aria-label="Career pipeline stages">
          {EXPERIENCE_STAGES.map(({ step, title, description, status, statusTone, completion, projects, companies, Icon }, index) => (
            <article key={title} className={`campus-experience-stage-item is-${statusTone}`}>
              <div className="campus-experience-stage-rail" aria-hidden="true">
                <div className="campus-experience-stage-icon">
                  <Icon />
                </div>
                {index < EXPERIENCE_STAGES.length - 1 ? <span className="campus-experience-stage-line" /> : null}
              </div>

              <div className="campus-experience-stage-body">
                <div className="campus-experience-stage-head">
                  <div>
                    <h3>{step}. {title}</h3>
                    <p>{description}</p>
                  </div>
                  <div className="campus-experience-stage-status-block">
                    <em className={`campus-experience-stage-status is-${statusTone}`}>{status}</em>
                    <strong>{completion}</strong>
                  </div>
                </div>
                <p className="campus-experience-stage-foot">{projects} Projects · {companies} Companies</p>
              </div>
            </article>
          ))}
        </section>

        <div className="campus-experience-divider" aria-hidden="true">
          <span className="campus-experience-divider-dot is-top" />
          <span className="campus-experience-divider-dot is-active" />
          <span className="campus-experience-divider-dot is-bottom" />
        </div>

        <section className="campus-experience-current-card">
          <header className="campus-experience-current-head">
            <h2>
              Current Stage: {EXPERIENCE_CURRENT_STAGE.title}
              <em>{EXPERIENCE_CURRENT_STAGE.status}</em>
            </h2>
            <strong>{EXPERIENCE_CURRENT_STAGE.progress}% Complete</strong>
          </header>

          <div className="campus-experience-progress-bar" role="img" aria-label={`${EXPERIENCE_CURRENT_STAGE.progress}% complete`}>
            <span style={{ width: `${EXPERIENCE_CURRENT_STAGE.progress}%` }} />
          </div>

          <p className="campus-experience-current-summary">{EXPERIENCE_CURRENT_STAGE.summary}</p>

          <div className="campus-experience-project-list">
            {EXPERIENCE_STAGE_PROJECTS.map(({ title, company, date, status, statusTone, rating, image }) => (
              <article key={`${title}-${date}`}>
                <img src={image} alt={`${title} preview`} loading="lazy" />
                <div>
                  <h4>{title}</h4>
                  <p>{company}</p>
                  <time>{date}</time>
                </div>
                <div className="campus-experience-project-meta">
                  <em className={`campus-experience-stage-status is-${statusTone}`}>{status}</em>
                  <strong>{rating ? <><FiStar aria-hidden="true" /> {rating}</> : '-'}</strong>
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="campus-experience-project-btn">
            View all 5 projects in this stage
            <FiArrowRight aria-hidden="true" />
          </button>
        </section>
      </div>
    </section>
  )
}

export default ProfileExperiencePanel
