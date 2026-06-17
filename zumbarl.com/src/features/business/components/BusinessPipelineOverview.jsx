import { FiArrowRight, FiChevronDown } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export function BusinessPipelineOverview({ stages }) {
  return (
    <section className="business-profile-card business-pipeline-overview" aria-labelledby="business-pipeline-title">
      <header>
        <div>
          <h2 id="business-pipeline-title">Your Pipeline Overview</h2>
          <p>Track your talent pipeline at a glance.</p>
        </div>
        <button type="button" className="business-workspace-filter">
          All Stages
          <FiChevronDown aria-hidden="true" />
        </button>
      </header>

      <div className="business-pipeline-overview-grid">
        {stages.map((stage) => (
          <article key={stage.label} className={`business-pipeline-summary tone-${stage.tone}`}>
            <h3>{stage.label}</h3>
            <strong>{stage.value}</strong>
            <p>
              Applicants
              <span>{stage.trend}</span>
            </p>
          </article>
        ))}
      </div>

      <Link to="/business/applicant-profile" className="business-dashboard-link">
        View full pipeline
        <FiArrowRight aria-hidden="true" />
      </Link>
    </section>
  )
}
