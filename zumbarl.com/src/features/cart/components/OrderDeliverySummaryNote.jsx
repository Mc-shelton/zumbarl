import { FiMapPin } from 'react-icons/fi'

export function OrderDeliverySummaryNote({ location }) {
  return (
    <article className="campus-order-placed-summary-note">
      <FiMapPin aria-hidden="true" />
      <div>
        <h3>{location || 'Fulfilment location recorded with the order'}</h3>
        <p>Updates will appear in your orders tab.</p>
      </div>
    </article>
  )
}
