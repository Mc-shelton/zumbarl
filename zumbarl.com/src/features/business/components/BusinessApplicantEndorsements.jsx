import { BUSINESS_APPLICANT_ENDORSEMENTS } from '../applicantProfileData'

export function BusinessApplicantEndorsements() {
  return (
    <article className="business-profile-card">
      <header>
        <h2>Endorsements</h2>
        <button type="button" className="business-link-btn">View all</button>
      </header>

      <div className="business-endorsement-list">
        {BUSINESS_APPLICANT_ENDORSEMENTS.map((item) => (
          <article key={`${item.company}-${item.date}`} className="business-endorsement-row">
            <span>{item.initials}</span>
            <div>
              <h4>{item.company}</h4>
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

      <footer className="business-endorsement-foot">
        <p>Endorsement Currencies (EC) earned: <strong>36</strong></p>
        <div>
          <span style={{ width: '72%' }} />
        </div>
        <p>Next reward at 50 EC <strong>36/50</strong></p>
      </footer>
    </article>
  )
}
