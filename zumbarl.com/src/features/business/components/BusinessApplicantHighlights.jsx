import { FiChevronRight, FiStar } from 'react-icons/fi'
import { BUSINESS_APPLICANT_WORK_HIGHLIGHTS } from '../applicantProfileData'

export function BusinessApplicantHighlights() {
  return (
    <article className="business-profile-card">
      <header>
        <h2>Recent Work Highlights</h2>
        <button type="button" className="business-link-btn">View full portfolio</button>
      </header>
      <div className="business-highlights-grid">
        {BUSINESS_APPLICANT_WORK_HIGHLIGHTS.map((item) => (
          <article key={item.title} className="business-highlight-item">
            <img src={item.image} alt={`${item.title} sample`} loading="lazy" />
            <h4>{item.title}</h4>
            <p>{item.org}</p>
            <span>
              <FiStar aria-hidden="true" /> {item.rating}
            </span>
          </article>
        ))}
        <button type="button" className="business-highlight-next" aria-label="View more highlights">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
