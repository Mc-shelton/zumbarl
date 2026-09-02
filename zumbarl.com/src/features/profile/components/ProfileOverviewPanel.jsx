import { useState } from 'react'
import { FiBarChart2, FiStar } from 'react-icons/fi'
import {
  getScoreFillColor,
} from '../constants'

function ProfileOverviewPanel({ achievements = [], earningsSummary = [], endorsements = [], score = null, workHighlights = [] }) {
  const [showScoreExplanation, setShowScoreExplanation] = useState(false)
  const trustSnapshot = score ? {
    score: Number(score.currentScore || 0),
    tier: score.tier,
    confidence: score.confidence,
    averageRating: score.avgRating ? Number(score.avgRating).toFixed(1) : 'Pending',
    nextStep: score.confidence === 'PROVISIONAL'
      ? `Complete verified work with ${Math.max(0, 2 - Number(score.uniqueClients || 0))} more client${Math.max(0, 2 - Number(score.uniqueClients || 0)) === 1 ? '' : 's'}`
      : 'Keep completing verified work to strengthen confidence',
    scoreBars: [
      { label: 'Quality', value: Math.round(Number(score.qualityScore || 0)), max: 100 },
      { label: 'Reliability', value: Math.round(Number(score.reliabilityScore || score.deliveryScore || 0)), max: 100 },
      { label: 'Professionalism', value: Math.round(Number(score.professionalismScore || score.trustScore || 0)), max: 100 },
      { label: 'Client relationship', value: Math.round(Number(score.relationshipScore || score.loyaltyScore || 0)), max: 100 },
    ],
  } : {
    score: 0,
    tier: 'BRONZE',
    confidence: 'PROVISIONAL',
    averageRating: 'Pending',
    nextStep: 'Complete verified work to build your score',
    scoreBars: [
      { label: 'Quality', value: 0, max: 100 },
      { label: 'Reliability', value: 0, max: 100 },
      { label: 'Professionalism', value: 0, max: 100 },
      { label: 'Client relationship', value: 0, max: 100 },
    ],
  }
  const profileScore = trustSnapshot.score
  const scoreBars = trustSnapshot.scoreBars
  const profileScoreColor = getScoreFillColor(profileScore, 100)
  const visibleEndorsements = endorsements
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
            <button
              type="button"
              className="campus-link-btn"
              aria-expanded={showScoreExplanation}
              onClick={() => setShowScoreExplanation((visible) => !visible)}
            >
              What is this?
            </button>
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
                <strong>{trustSnapshot?.confidence === 'PROVISIONAL' ? '—' : profileScore}</strong>
                <span>{trustSnapshot?.confidence === 'PROVISIONAL' ? 'Provisional' : trustSnapshot?.tier || 'Tier 3'}</span>
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

          {showScoreExplanation ? (
            <div className="campus-profile-score-explanation" role="note">
              <strong>A confidence-weighted work score</strong>
              <p>
                Verified project outcomes update quality, reliability, professionalism, and client relationship using a Bayesian model. Recent work counts more, repeat work from one client is discounted, and unverified evidence does not count.
              </p>
              <p>
                {Number(score?.effectiveEngagements || 0).toFixed(1)} effective engagements across {Number(score?.uniqueClients || 0)} clients · {String(score?.confidence || 'provisional').toLowerCase()} confidence.
              </p>
            </div>
          ) : null}

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
            {visibleEndorsements.length ? visibleEndorsements.map((item) => (
              <article key={`${item.company}-${item.date}`} className="campus-profile-endorsement-item">
                <img src="/assets/index/bee_nobg.png" alt={`${item.company} logo`} />
                <div>
                  <h3>{item.company}</h3>
                  <p>{item.person || [item.author, item.role].filter(Boolean).join(' · ')}</p>
                  <blockquote>{item.quote || item.note}</blockquote>
                </div>
                <div>
                  <strong>{item.reward || item.value}</strong>
                  <p>{item.date}</p>
                </div>
              </article>
            )) : <p>No endorsements yet.</p>}
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
            {achievements.length ? achievements.map(({ id, title, name, subtitle, description }) => (
              <article key={id || title || name}>
                <div className="campus-profile-achievement-icon is-purple">
                  <FiStar aria-hidden="true" />
                </div>
                <div>
                  <h3>{title || name}</h3>
                  <p>{subtitle || description}</p>
                </div>
              </article>
            )) : <p>No achievements yet.</p>}
          </div>
        </article>

        <article className="campus-profile-surface">
          <header className="campus-profile-card-head">
            <h2>Earnings Summary</h2>
            <FiBarChart2 aria-hidden="true" />
          </header>
          <div className="campus-profile-earnings-list">
            {earningsSummary.length ? earningsSummary.map((entry) => (
              <div key={entry.id || entry.label || entry.title}>
                <p>{entry.label || entry.title}</p>
                <strong>{entry.value}</strong>
              </div>
            )) : <p>No earnings yet.</p>}
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
