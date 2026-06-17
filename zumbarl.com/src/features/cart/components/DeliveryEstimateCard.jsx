import { FiTruck } from 'react-icons/fi'
import { DELIVERY_ESTIMATE } from '../checkoutData'

export function DeliveryEstimateCard() {
  return (
    <article className="campus-cart-delivery-card">
      <div className="campus-cart-delivery-icon">
        <FiTruck aria-hidden="true" />
      </div>
      <div>
        <h3>Estimated Delivery</h3>
        <p>{DELIVERY_ESTIMATE.dateRange}</p>
        <span>{DELIVERY_ESTIMATE.location}</span>
      </div>
      <button type="button">Change</button>
    </article>
  )
}
