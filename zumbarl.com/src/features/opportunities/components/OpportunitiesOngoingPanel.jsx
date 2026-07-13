import { FiCalendar, FiCreditCard, FiUsers } from 'react-icons/fi'

function OpportunitiesOngoingPanel({ onOpenMessages = () => {}, onOpenProject, projects = [] }) {
  const dueSoonCount = projects.filter((project) => project.statusTone === 'is-scheduled').length
  const pendingInputCount = projects.filter((project) => project.statusTone === 'is-awaiting').length

  return (
    <section className="opportunities-list-section opportunities-service-orders-section" aria-label="Ongoing jobs, gigs and projects">
      <div className="opportunities-section-head opportunities-service-orders-head">
        <div>
          <h2>Ongoing</h2>
          <p>Active jobs, gigs and projects you have already won or accepted.</p>
        </div>
      </div>

      <div className="opportunities-service-orders-summary">
        <article>
          <p>Active</p>
          <strong>{projects.length}</strong>
          <span>Jobs and projects</span>
        </article>
        <article>
          <p>Due soon</p>
          <strong>{dueSoonCount}</strong>
          <span>Deadlines this month</span>
        </article>
        <article>
          <p>Pending input</p>
          <strong>{pendingInputCount}</strong>
          <span>Needs your action</span>
        </article>
      </div>

      <div className="opportunities-service-orders-list">
        {projects.length === 0 ? (
          <p className="opportunities-list-empty">
            Nothing ongoing yet. Projects you win or accept will appear here.
          </p>
        ) : null}
        {projects.map((project) => (
          <article key={project.id} className="opportunities-service-order-card">
            <header className="opportunities-service-order-head">
              <div>
                <p className="opportunities-service-order-id">{project.category}</p>
                <h3>{project.title}</h3>
                <p className="opportunities-job-meta">{project.client} · {project.progress} complete</p>
              </div>
              <span className={`opportunities-service-order-chip ${project.statusTone}`}>{project.status}</span>
            </header>

            <div className="opportunities-service-order-meta">
              <p>
                <FiCalendar aria-hidden="true" />
                Deadline: {project.deadline}
              </p>
              <p>
                <FiCreditCard aria-hidden="true" />
                {project.budget}
              </p>
              <p>
                <FiUsers aria-hidden="true" />
                {project.client}
              </p>
            </div>

            <p className="opportunities-service-order-note">{project.note}</p>

            <footer className="opportunities-service-order-foot">
              <p className="opportunities-service-order-amount">{project.progress}</p>
              <div className="opportunities-service-order-actions">
                <button type="button" className="campus-link-btn" onClick={onOpenMessages}>Message</button>
                <button
                  type="button"
                  className="opportunities-search-btn"
                  onClick={() => onOpenProject(project)}
                >
                  Open Project
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

export default OpportunitiesOngoingPanel
