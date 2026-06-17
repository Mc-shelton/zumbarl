import { FiArrowRight, FiCheck, FiClock, FiInfo, FiMessageCircle } from 'react-icons/fi'
function MilestonesRail() {
  return (
    <aside className="campus-rail project-workspace-rail project-milestones-rail" aria-label="Milestone guidance">
      <section className="campus-rail-card project-milestone-help-card">
        <FiInfo aria-hidden="true" />
        <h3>About Milestones</h3>
        <p>
          Milestones help you break the project into key deliverables and track progress step by step.
          Complete milestones to keep the project on track and deliver on time.
        </p>
      </section>

      <section className="campus-rail-card project-milestone-status-card">
        <h3>Milestone Status</h3>
        <article className="is-complete">
          <FiCheck aria-hidden="true" />
          <div>
            <strong>Completed</strong>
            <p>Milestone completed successfully</p>
          </div>
        </article>
        <article className="is-progress">
          <FiClock aria-hidden="true" />
          <div>
            <strong>In Progress</strong>
            <p>Work in progress</p>
          </div>
        </article>
        <article className="is-pending">
          <FiClock aria-hidden="true" />
          <div>
            <strong>Pending</strong>
            <p>Not started yet</p>
          </div>
        </article>
      </section>

      <section className="campus-rail-card project-milestone-tips-card">
        <h3>Tips for Success</h3>
        {['Keep milestones clear and achievable', 'Set realistic due dates', 'Communicate early if delays occur', 'Celebrate completed milestones'].map((tip) => (
          <p key={tip}>
            <FiCheck aria-hidden="true" />
            {tip}
          </p>
        ))}
      </section>

      <section className="campus-rail-card project-support-card">
        <FiMessageCircle aria-hidden="true" />
        <div>
          <h3>Need help with this project?</h3>
          <p>Contact support or message the project owner for assistance.</p>
        </div>
        <button type="button" className="project-soft-btn">
          Contact Support
          <FiArrowRight aria-hidden="true" />
        </button>
      </section>
    </aside>
  )
}

export default MilestonesRail
