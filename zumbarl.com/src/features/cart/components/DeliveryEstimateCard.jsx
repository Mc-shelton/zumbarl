import { FiTruck } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const METHOD_LABELS = {
  digital: 'Digital delivery',
  errand_delivery: 'Campus errander',
  free_campus_delivery: 'Free campus delivery',
  pickup: 'Student kitchen pickup',
  seller_delivery: 'Business delivery',
  zumbarl_delivery: 'Zumbarl delivery',
}

export function DeliveryEstimateCard({ items = [] }) {
  const fulfilments = items.map((item) => item.fulfilment).filter((fulfilment) => fulfilment?.quoted)
  const methods = [...new Set(fulfilments.map((fulfilment) => fulfilment.method))]
  const locations = [...new Set(fulfilments.map((fulfilment) => fulfilment.location).filter(Boolean))]
  const primary = fulfilments[0]
  const title = methods.length > 1 ? 'Multiple fulfilment options' : METHOD_LABELS[primary?.method] || 'Choose fulfilment'
  const detail = primary?.method === 'errand_delivery'
    ? 'The first available errander to accept will deliver it'
    : primary?.method === 'pickup'
      ? 'Collect your order at the selected point'
      : primary?.method === 'free_campus_delivery'
        ? 'Provided by the business at no charge'
        : primary ? 'Delivery details confirmed' : 'Select an option before checkout'

  return (
    <article className="campus-cart-delivery-card">
      <div className="campus-cart-delivery-icon">
        <FiTruck aria-hidden="true" />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
        {locations.length ? <span>{locations.join(' · ')}</span> : null}
      </div>
      <Link to="/campus/cart">Change</Link>
    </article>
  )
}
