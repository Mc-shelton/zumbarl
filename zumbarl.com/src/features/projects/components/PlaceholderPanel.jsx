import { FiArrowRight } from 'react-icons/fi'

function PlaceholderPanel({ title }) {
  const isActivityLogs = title === 'Activity Logs'

  return (
    <section className="project-card project-placeholder-panel">
      <h2>{title}</h2>
      <p>{isActivityLogs ? 'Project updates and audit events will appear here as work progresses.' : 'Client feedback will appear here after review.'}</p>
      <button type="button" className="project-soft-btn">
        {isActivityLogs ? 'Add Update' : 'Request Review'}
        <FiArrowRight aria-hidden="true" />
      </button>
    </section>
  )
}

export default PlaceholderPanel
