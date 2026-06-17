import { FiBarChart2, FiStar } from 'react-icons/fi'
import {
  ACHIEVEMENTS,
  EARNINGS_SUMMARY,
  ENDORSEMENTS,
  PROFILE_SCORE,
  SCORE_BARS,
  TOP_SKILLS,
  getScoreFillColor,
} from '../constants'
import { useProfileTrustSnapshot } from '../hooks/useProfileTrustSnapshot'

function ProfileOverviewPanel({ endorsements = [], workHighlights = [] }) {
  const trustSnapshot = useProfileTrustSnapshot()
  const profileScore = trustSnapshot?.score || PROFILE_SCORE
  const scoreBars = trustSnapshot?.scoreBars?.length ? trustSnapshot.scoreBars : SCORE_BARS
  const profileScoreColor = getScoreFillColor(profileScore, 100)
  const visibleEndorsements = endorsements.length ? [...endorsements, ...ENDORSEMENTS] : ENDORSEMENTS
  const endorsementCurrency = visibleEndorsements.reduce((total, item) => (
    total + (Number.parseInt(String(item.reward).replace(/\D/g, ''), 10) || 0)
  ), 0)
  const endorsementProgress = Math.min(100, Math.round((endorsementCurrency / 50) * 100))

  return (
    <>
      <div className="campus-profile-overview-top-grid">
        <article className="campus-profile-surface campus-profile-score-card">
          <header className="campus-profile-card-head">
            <div>
              <h2>Zumbarl Score Breakdown</h2>
              <p>Your overall performance across key areas</p>
            </div>
            <button type="button" className="campus-link-btn">What is this?</button>
          </header>

          <div className="campus-profile-score-grid">
            <div
              className="campus-profile-score-ring"
              style={{
                '--score-angle': `${Math.round((profileScore / 100) * 360)}deg`,
                '--score-color': profileScoreColor,
              }}
            >
              <div>
                <strong>{profileScore}</strong>
                <span>{trustSnapshot?.tier || 'Tier 3'}</span>
              </div>
            </div>

            <div className="campus-profile-score-bars">
              {scoreBars.map((item) => (
                <div key={item.label} className="campus-profile-score-row">
                  <p>{item.label}</p>
                  <div>
                    <span
                      style={{
                        width: `${(item.value / item.max) * 100}%`,
                        backgroundColor: getScoreFillColor(item.value, item.max),
                      }}
                    />
                  </div>
                  <strong>{item.value}/{item.max}</strong>
                </div>
              ))}
            </div>
          </div>

          <footer className="campus-profile-score-foot">
            <p>Average reviewed rating: {trustSnapshot?.averageRating || 'Pending'}</p>
            <p>{trustSnapshot?.nextStep || 'Complete one more reviewed project'}</p>
          </footer>
        </article>

        <article className="campus-profile-surface campus-profile-endorsement-card">
          <header className="campus-profile-card-head">
            <h2>Endorsements</h2>
            <button type="button" className="campus-link-btn">View all</button>
          </header>

          <div className="campus-profile-endorsement-list">
            {visibleEndorsements.map((item) => (
              <article key={`${item.company}-${item.date}`} className="campus-profile-endorsement-item">
                <img src="/assets/index/bee_nobg.png" alt={`${item.company} logo`} />
                <div>
                  <h3>{item.company}</h3>
                  <p>{item.person}</p>
                  <blockquote>{item.quote}</blockquote>
                </div>
                <div>
                  <strong>{item.reward}</strong>
                  <p>{item.date}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="campus-profile-endorsement-foot">
            <p>Endorsement Currencies (EC) earned: <strong>{endorsementCurrency}</strong></p>
            <div>
              <span style={{ width: `${endorsementProgress}%` }} />
            </div>
            <p>Next reward at 50 EC <strong>{endorsementCurrency}/50</strong></p>
          </footer>
        </article>
      </div>

      <div className="campus-profile-dual-grid">
        <article className="campus-profile-surface">
          <header className="campus-profile-card-head">
            <h2>Achievements</h2>
            <button type="button" className="campus-link-btn">View all</button>
          </header>

          <div className="campus-profile-achievement-list">
            {ACHIEVEMENTS.map(({ title, subtitle, Icon, tone }) => (
              <article key={title}>
                <div className={`campus-profile-achievement-icon is-${tone}`}>
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="campus-profile-surface">
          <header className="campus-profile-card-head">
            <h2>Earnings Summary</h2>
            <FiBarChart2 aria-hidden="true" />
          </header>
          <div className="campus-profile-earnings-list">
            {EARNINGS_SUMMARY.map((entry) => (
              <div key={entry.label}>
                <p>{entry.label}</p>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="campus-profile-surface">
          <header className="campus-profile-card-head">
            <h2>Top Skills</h2>
            <button type="button" className="campus-link-btn">View all</button>
          </header>
          <div className="campus-profile-skill-chip-list">
            {TOP_SKILLS.map((skill) => (
              <span key={skill.label} className="campus-profile-skill-chip">
                {skill.label}
                <em>{skill.level}</em>
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="campus-profile-surface campus-profile-work-card">
        <header className="campus-profile-card-head">
          <h2>Recent Work Highlights</h2>
          <button type="button" className="campus-link-btn">View full portfolio</button>
        </header>

        <div className="campus-profile-work-grid">
          {workHighlights.map((item) => (
            <article key={item.title} className="campus-profile-work-item">
              <img src={item.image} alt={`${item.title} sample`} loading="lazy" />
              <p>{item.title}</p>
              <span>{item.org}</span>
              <strong>
                <FiStar aria-hidden="true" />
                {item.rating}
              </strong>
            </article>
          ))}
        </div>
      </article>
    </>
  )
}

export default ProfileOverviewPanel
