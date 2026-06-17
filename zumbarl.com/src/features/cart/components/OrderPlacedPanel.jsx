import { FiArrowRight, FiCheck, FiClock, FiTruck } from 'react-icons/fi'
import {
  CUSTOMER_DETAILS,
  DELIVERY_ESTIMATE,
  ORDER_ID,
  ORDER_TIMELINE_ITEMS,
  PAYMENT_SUMMARY,
} from '../checkoutData'
import { formatKes } from '../pricing'

export function OrderPlacedPanel({ onContinueShopping, onViewOrders, totals }) {
  return (
    <section className="campus-checkout-panel campus-order-placed-stack">
      <article className="campus-order-placed-hero">
        <span className="campus-order-placed-check" aria-hidden="true">
          <FiCheck />
        </span>
        <div>
          <h2>Thank you! Your order has been placed.</h2>
          <p>
            We&apos;ve sent a confirmation to <strong>{CUSTOMER_DETAILS.email}</strong> and will update you as your
            order moves.
          </p>
        </div>
        <p className="campus-order-placed-order-id">Order ID: {ORDER_ID}</p>
      </article>

      <section className="campus-order-placed-meta-grid" aria-label="Order details">
        <article className="campus-order-placed-meta-card">
          <h3>Delivery Address</h3>
          <p>{CUSTOMER_DETAILS.name}</p>
          <p>{DELIVERY_ESTIMATE.addressSummary}</p>
          <p>{CUSTOMER_DETAILS.phone}</p>
        </article>
        <article className="campus-order-placed-meta-card">
          <h3>Payment Method</h3>
          <p>{PAYMENT_SUMMARY.method}</p>
          <p>{PAYMENT_SUMMARY.card}</p>
          <p>Paid {formatKes(totals.finalTotal)}</p>
        </article>
        <article className="campus-order-placed-meta-card">
          <h3>Estimated Delivery</h3>
          <p>{DELIVERY_ESTIMATE.dateRange}</p>
          <p>{DELIVERY_ESTIMATE.location}</p>
          <p>Standard campus delivery</p>
        </article>
      </section>

      <article className="campus-order-placed-timeline">
        <header>
          <h2>What happens next?</h2>
          <p>You can follow every step until delivery is complete.</p>
        </header>

        <div className="campus-order-placed-timeline-list">
          {ORDER_TIMELINE_ITEMS.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </div>
      </article>

      <footer className="campus-checkout-actions">
        <button type="button" className="campus-checkout-back-btn" onClick={onViewOrders}>
          <FiArrowRight aria-hidden="true" />
          My Orders
        </button>
        <button type="button" className="campus-checkout-next-btn" onClick={onContinueShopping}>
          Continue Shopping
          <FiArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}

function TimelineItem({ item }) {
  return (
    <article className={`campus-order-placed-timeline-item is-${item.state}`}>
      <span aria-hidden="true">
        {item.state === 'done' ? <FiCheck /> : item.state === 'active' ? <FiClock /> : <FiTruck />}
      </span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
      </div>
    </article>
  )
}
