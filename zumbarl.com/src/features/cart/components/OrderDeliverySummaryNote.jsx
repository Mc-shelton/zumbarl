import { FiMapPin } from 'react-icons/fi'

export function OrderDeliverySummaryNote() {
  return (
    <article className="campus-order-placed-summary-note">
      <FiMapPin aria-hidden="true" />
      <div>
        <h3>Delivery to Westlands, Nairobi</h3>
        <p>Updates will appear in your orders tab.</p>
      </div>
    </article>
  )
}
