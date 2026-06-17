import { FiArrowRight, FiInfo } from 'react-icons/fi'
import {
  SKILLS_PROGRESS_TIMELINE,
  SKILLS_RECENT_ACHIEVEMENTS,
  SKILLS_SUMMARY,
} from '../constants'

function ProfileSkillsRail({
  skillsTrendCoordinates,
  skillsTrendFillPoints,
  skillsTrendPoints,
}) {
  return (
    <>
      <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
        <header className="campus-skills-rail-head">
          <h2>Overall Skills Score</h2>
          <FiInfo aria-hidden="true" />
        </header>

        <div className="campus-skills-rail-score-block">
          <div
            className="campus-skills-rail-score-ring"
            style={{ '--skills-overall-angle': `${Math.round((76 / 100) * 360)}deg` }}
          >
            <strong>76</strong>
          </div>
          <div className="campus-skills-rail-score-copy">
            <h3>Advanced</h3>
            <p>You&apos;re performing better than 72% of students on Zumbarl</p>
            <div>
              <em>+ 8 points</em>
              <span>from last month</span>
            </div>
          </div>
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
        <header className="campus-skills-rail-subhead">
          <h2>Skills Summary</h2>
        </header>
        <div className="campus-skills-summary-grid">
          {SKILLS_SUMMARY.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
        <header className="campus-skills-rail-subhead">
          <h2>Skills Progress Over Time</h2>
          <button type="button" className="campus-link-btn">View full report</button>
        </header>
        <div className="campus-skills-chart-wrap">
          <svg viewBox="0 0 344 112" role="img" aria-label="Skills progress line chart">
            <line x1="14" y1="14" x2="330" y2="14" className="campus-skills-chart-grid-line" />
            <line x1="14" y1="42" x2="330" y2="42" className="campus-skills-chart-grid-line" />
            <line x1="14" y1="70" x2="330" y2="70" className="campus-skills-chart-grid-line" />
            <line x1="14" y1="98" x2="330" y2="98" className="campus-skills-chart-grid-line" />
            {skillsTrendFillPoints ? <polygon points={skillsTrendFillPoints} className="campus-skills-chart-area" /> : null}
            {skillsTrendPoints ? <polyline points={skillsTrendPoints} className="campus-skills-chart-line" /> : null}
            {skillsTrendCoordinates.map((point) => (
              <g key={point.month}>
                <circle cx={point.x} cy={point.y} r="3.2" className="campus-skills-chart-point" />
                <text x={point.x} y={point.y - 8} textAnchor="middle" className="campus-skills-chart-point-label">{point.value}</text>
              </g>
            ))}
          </svg>
          <div className="campus-skills-chart-months">
            {SKILLS_PROGRESS_TIMELINE.map((point) => (
              <span key={point.month}>{point.month}</span>
            ))}
          </div>
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-skills-rail-card">
        <header className="campus-skills-rail-subhead">
          <h2>Recent Skill Achievements</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>
        <div className="campus-skills-achievements-list">
          {SKILLS_RECENT_ACHIEVEMENTS.map((item) => (
            <article key={item.id}>
              <span className={`campus-skills-achievement-badge ${item.tone}`}>{item.badge}</span>
              <div>
                <h3>{item.skill}</h3>
                <p>{item.detail}</p>
              </div>
              <time>{item.date}</time>
            </article>
          ))}
        </div>

        <button type="button" className="campus-skills-resources-btn">
          Browse Skill Learning Resources
          <FiArrowRight aria-hidden="true" />
        </button>
      </article>
    </>
  )
}

export default ProfileSkillsRail
