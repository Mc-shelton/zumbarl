import { FiClock } from 'react-icons/fi'

function getEventLabel(action) {
  const labels = {
    awarded: 'Awarded',
    guardrail_unlocked: 'Guardrail Unlocked',
    interview_scheduled: 'Interview Scheduled',
    opportunity_created: 'Opportunity Created',
    removed: 'Removed',
    shortlisted: 'Shortlisted',
  }

  return labels[action] || action
}

export function BusinessApplicantActivityPanel({ reviewEvents = [] }) {
  return (
    <article className="business-profile-card business-activity-panel">
      <header>
        <div>
          <p className="business-section-kicker">Activity</p>
          <h2>Pipeline activity</h2>
        </div>
      </header>
      <ul className="business-review-log-list">
        {reviewEvents.map((event) => (
          <li key={event.id}>
            <FiClock aria-hidden="true" />
            <div>
              <strong>{getEventLabel(event.action)}</strong>
              <p>{event.detail}</p>
              <span>{event.createdAt}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
