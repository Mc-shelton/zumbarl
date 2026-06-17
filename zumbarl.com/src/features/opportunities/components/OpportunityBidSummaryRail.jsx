import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiMapPin,
  FiShield,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

function OpportunityBidSummaryRail({ selectedGig }) {
  return (
    <aside className="campus-rail opportunities-rail opportunities-bid-summary-rail" aria-label="Gig summary">
      <section className="campus-rail-card opportunities-bid-summary-card">
        <header>
          <h3>Gig Summary</h3>
        </header>

        <article className="opportunities-bid-summary-head">
          <div className="opportunities-bid-summary-logo">
            <img src="/assets/index/bee_nobg.png" alt={`${selectedGig.company} logo`} loading="lazy" />
          </div>
          <div>
            <h4>{selectedGig.title}</h4>
            <p>{selectedGig.company}</p>
            <span>
              <FiMapPin aria-hidden="true" />
              {selectedGig.mode}
            </span>
          </div>
        </article>

        <section className="opportunities-bid-summary-block">
          <h4>About this Gig</h4>
          <p>{selectedGig.summary}</p>
        </section>

        <section className="opportunities-bid-summary-block opportunities-bid-process-block">
          <h4>{selectedGig.careerPath}</h4>
          <p>{selectedGig.progressionOutcome}</p>
          <span>{selectedGig.trustOutcome}</span>
        </section>

        <section className="opportunities-bid-summary-meta">
          <article>
            <p>
              <FiBriefcase aria-hidden="true" />
              Category
            </p>
            <strong>{selectedGig.domain}</strong>
          </article>
          <article>
            <p>
              <FiFileText aria-hidden="true" />
              Type
            </p>
            <strong>{selectedGig.type}</strong>
          </article>
          <article>
            <p>
              <FiClock aria-hidden="true" />
              Posted on
            </p>
            <strong>{selectedGig.postedOn}</strong>
          </article>
          <article>
            <p>
              <FiCreditCard aria-hidden="true" />
              Budget
            </p>
            <strong>{selectedGig.budget}</strong>
          </article>
          <article>
            <p>
              <FiCheckCircle aria-hidden="true" />
              Experience
            </p>
            <strong>{selectedGig.experienceLevel}</strong>
          </article>
        </section>

        <section className="opportunities-bid-summary-skills">
          <h4>Skills</h4>
          <div>
            {selectedGig.skills.map((item) => (
              <span key={`${selectedGig.id}-${item}`}>{item}</span>
            ))}
          </div>
        </section>
      </section>

      <section className="campus-rail-card opportunities-bid-info-card">
        <div className="opportunities-bid-info-icon">
          <FiShield aria-hidden="true" />
        </div>
        <div>
          <h4>Your proposal is safe</h4>
          <p>Do not share personal contact information. All communication happens securely on Zumbarl.</p>
        </div>
      </section>

      <section className="campus-rail-card opportunities-bid-info-card">
        <div className="opportunities-bid-info-icon">
          <FiHelpCircle aria-hidden="true" />
        </div>
        <div>
          <h4>Need help?</h4>
          <p>Visit our Help Center for tips on writing a winning proposal.</p>
          <Link to="/help" className="opportunities-bid-help-link">
            Visit Help Center
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </aside>
  )
}

export default OpportunityBidSummaryRail
