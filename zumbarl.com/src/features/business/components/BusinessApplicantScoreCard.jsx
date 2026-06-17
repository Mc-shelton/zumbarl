import { BUSINESS_APPLICANT_SCORE_BREAKDOWN } from '../applicantProfileData'

export function BusinessApplicantScoreCard() {
  return (
    <article className="business-profile-card business-score-card">
      <header>
        <div>
          <h2>Zumbarl Score Breakdown</h2>
          <p>How Aisha is performing across key areas</p>
        </div>
        <button type="button" className="business-link-btn">View details</button>
      </header>

      <div className="business-score-content">
        <div className="business-score-ring" aria-hidden="true">
          <div>
            <strong>74</strong>
            <span>Tier 3</span>
            <span>Silver</span>
          </div>
        </div>

        <div className="business-score-bars">
          {BUSINESS_APPLICANT_SCORE_BREAKDOWN.map((item) => (
            <div key={item.label} className="business-score-bar-row">
              <p>{item.label}</p>
              <div>
                <span style={{ width: `${(item.value / item.max) * 100}%` }} />
              </div>
              <strong>{item.value}/{item.max}</strong>
            </div>
          ))}
        </div>

        <aside className="business-score-note">
          <h3>What this means</h3>
          <p>
            Aisha is a reliable talent with strong delivery and good client satisfaction.
            She&apos;s building consistent relationships and ready for more responsibility.
          </p>
        </aside>
      </div>
    </article>
  )
}
