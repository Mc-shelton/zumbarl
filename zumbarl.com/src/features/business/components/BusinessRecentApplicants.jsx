import { FiArrowRight, FiMoreHorizontal } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export function BusinessRecentApplicants({ applicants }) {
  return (
    <section className="business-profile-card business-recent-applicants" aria-labelledby="business-recent-applicants-title">
      <header>
        <div>
          <h2 id="business-recent-applicants-title">Recent Applicants</h2>
          <p>New applicants for your opportunities.</p>
        </div>
        <Link to="/business/applicant-profile" className="business-link-btn">View all</Link>
      </header>

      <div className="business-applicant-table">
        {applicants.map((applicant) => (
          <article key={applicant.id} className="business-applicant-row">
            <img src={applicant.avatar} alt={`${applicant.name} avatar`} />
            <div>
              <h3>{applicant.name}</h3>
              <p>{applicant.role}</p>
              <span>{applicant.school}</span>
            </div>
            <dl>
              <div>
                <dt>Zumbarl Score</dt>
                <dd>{applicant.score} <span>{applicant.match}</span></dd>
              </div>
              <div>
                <dt>Applied</dt>
                <dd>{applicant.applied}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><em className={`tone-${applicant.tone}`}>{applicant.status}</em></dd>
              </div>
            </dl>
            <Link to="/business/applicant-profile" aria-label={`Open ${applicant.name}`}>
              <FiMoreHorizontal aria-hidden="true" />
              <FiArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>

      <Link to="/business/applicant-profile" className="business-dashboard-link">
        View all applicants
        <FiArrowRight aria-hidden="true" />
      </Link>
    </section>
  )
}
