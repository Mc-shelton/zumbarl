import { FiInfo, FiX } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { buildRadarRingPoints } from '../constants'

function ProfilePortfolioProjectRail({
  onClose,
  selectedPortfolioDetail,
  selectedPortfolioItem,
  selectedPortfolioScorePoints,
}) {
  const canShareProfile = hasAccess(ACCESS_KEYS.profile.share)

  return (
    <aside className="campus-rail campus-portfolio-detail-rail" aria-label={`${selectedPortfolioItem.title} details`}>
      <section className="campus-rail-card campus-portfolio-detail-panel">
        <header className="campus-portfolio-detail-head">
          <img src={selectedPortfolioItem.image} alt={`${selectedPortfolioItem.title} preview`} />
          <div>
            <h3>{selectedPortfolioItem.title}</h3>
            <p>
              <span>{selectedPortfolioItem.category}</span>
              <span>{selectedPortfolioItem.date}</span>
            </p>
          </div>
          <button
            type="button"
            className="campus-portfolio-detail-close"
            aria-label="Close project details"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <section className="campus-portfolio-detail-client-grid">
          <article>
            <h4>Client</h4>
            <div className="campus-portfolio-detail-client-row">
              <img src="/assets/index/bee_nobg.png" alt={`${selectedPortfolioItem.client} logo`} />
              <strong>{selectedPortfolioItem.client}</strong>
            </div>
          </article>
          <article>
            <h4>Pipeline Stage Achieved</h4>
            <strong>{selectedPortfolioDetail.pipelineStage}</strong>
            <p>{selectedPortfolioDetail.pipelineNote}</p>
          </article>
        </section>

        <section className="campus-portfolio-detail-score-block">
          <header>
            <div>
              <h4>Project Scores</h4>
              <p>Scores are based on client review and platform data.</p>
            </div>
          </header>

          <div className="campus-portfolio-detail-score-grid">
            <div className="campus-portfolio-radar-panel">
              <div className="campus-portfolio-radar-wrap">
                <svg viewBox="0 0 200 200" role="img" aria-label="Project score radar">
                  {[1, 2, 3, 4, 5].map((ring) => (
                    <polygon
                      key={ring}
                      points={buildRadarRingPoints(6, ring)}
                      className="campus-portfolio-radar-ring"
                    />
                  ))}
                  {Array.from({ length: 6 }).map((_, index) => {
                    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 6
                    const x = 100 + 84 * Math.cos(angle)
                    const y = 100 + 84 * Math.sin(angle)
                    return (
                      <line
                        key={index}
                        x1="100"
                        y1="100"
                        x2={x}
                        y2={y}
                        className="campus-portfolio-radar-axis"
                      />
                    )
                  })}
                  <polygon points={selectedPortfolioScorePoints} className="campus-portfolio-radar-shape" />
                </svg>
              </div>
              <div className="campus-portfolio-radar-labels" aria-hidden="true">
                {selectedPortfolioDetail.projectScores.map((score, index) => (
                  <div
                    key={`${selectedPortfolioItem.id}-radar-label-${score.label}`}
                    className={`campus-portfolio-radar-label is-pos-${index}`}
                  >
                    <p>{score.label}</p>
                    <strong>{score.score.toFixed(1)}/5</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="campus-portfolio-score-list">
              {selectedPortfolioDetail.projectScores.map((score) => (
                <article key={`${selectedPortfolioItem.id}-${score.label}`}>
                  <p>{score.label}</p>
                  <strong>{score.score.toFixed(1)}/5</strong>
                </article>
              ))}
            </div>
          </div>

          <p className="campus-portfolio-score-note">
            <FiInfo aria-hidden="true" />
            Scores are from client review after project completion.
          </p>
        </section>

        <section className="campus-portfolio-detail-skills">
          <h4>Skills Developed</h4>
          <p>Skills and competencies you strengthened by working on this project.</p>
          <div className="campus-portfolio-detail-skill-chips">
            {selectedPortfolioDetail.skillsDeveloped.map((skill) => (
              <span key={`${selectedPortfolioItem.id}-${skill.name}`}>
                {skill.name}
                <em>{skill.level}</em>
              </span>
            ))}
          </div>
        </section>

        <section className="campus-portfolio-detail-impact">
          <h4>Evidence & Impact</h4>
          <div className="campus-portfolio-detail-impact-grid">
            {selectedPortfolioDetail.impact.map((item) => (
              <article key={`${selectedPortfolioItem.id}-${item.label}`}>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="campus-portfolio-detail-feedback">
          <h4>Client Feedback</h4>
          <blockquote>&quot;{selectedPortfolioDetail.feedback.quote}&quot;</blockquote>
          <p>
            <strong>{selectedPortfolioDetail.feedback.author}</strong>
            <span>{selectedPortfolioDetail.feedback.role}</span>
          </p>
          <div className="campus-portfolio-detail-actions">
            <button type="button" className="campus-portfolio-detail-action-btn is-ghost">View Project Files</button>
            {canShareProfile ? (
              <button type="button" className="campus-portfolio-detail-action-btn is-primary">Share Project</button>
            ) : null}
          </div>
        </section>
      </section>
    </aside>
  )
}

export default ProfilePortfolioProjectRail
