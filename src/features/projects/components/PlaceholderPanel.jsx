import { FiArrowRight } from 'react-icons/fi'

function PlaceholderPanel({ title }) {
  return (
    <section className="project-card project-placeholder-panel">
      <h2>{title}</h2>
      <p>{title === 'Invoices' ? 'No invoices have been created for this project yet.' : 'Client feedback will appear here after review.'}</p>
      <button type="button" className="project-soft-btn">
        {title === 'Invoices' ? 'Create Invoice' : 'Request Review'}
        <FiArrowRight aria-hidden="true" />
      </button>
    </section>
  )
}

export default PlaceholderPanel
