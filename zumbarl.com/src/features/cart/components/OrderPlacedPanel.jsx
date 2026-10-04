import { FiArrowRight, FiCheck, FiClock, FiTruck } from 'react-icons/fi'
import { formatKes } from '../pricing'

const TIMELINE = [
  { id: 'seller_confirmation', title: 'Awaiting seller confirmation', detail: 'The seller is checking availability.' },
  { id: 'packaging', title: 'Preparing your order', detail: 'The seller is preparing the items or service.' },
  { id: 'ready', title: 'Ready for handoff', detail: 'Your order is ready for pickup or delivery.' },
  { id: 'delivered', title: 'Delivered', detail: 'Confirm receipt from My Orders when the handoff is complete.' },
]

function buildTimeline(status) {
  const stageIndex = ['seller_confirmation'].includes(status)
    ? 0
    : ['confirmed', 'packaging'].includes(status)
      ? 1
      : ['ready', 'in_transit'].includes(status)
        ? 2
        : ['delivered', 'completed'].includes(status)
          ? 3
          : 0
  return TIMELINE.map((item, index) => ({
    ...item,
    state: index < stageIndex || (stageIndex === TIMELINE.length - 1 && index === stageIndex) ? 'done' : index === stageIndex ? 'active' : 'pending',
  }))
}

export function OrderPlacedPanel({ onContinueShopping, onViewOrders, order, totals }) {
  const timeline = buildTimeline(order.fulfillmentStatus)

  return (
    <section className="campus-checkout-panel campus-order-placed-stack">
      <article className="campus-order-placed-hero">
        <span className="campus-order-placed-check" aria-hidden="true">
          <FiCheck />
        </span>
        <div>
          <h2>Thank you! Your order has been placed.</h2>
          <p>Your payment is held securely while the seller confirms and fulfils the order.</p>
        </div>
        <p className="campus-order-placed-order-id">Order ID: {order.id}</p>
      </article>

      <section className="campus-order-placed-meta-grid" aria-label="Order details">
        <article className="campus-order-placed-meta-card">
          <h3>Fulfilment</h3>
          <p>{order.buyerName || 'Signed-in student'}</p>
          <p>{order.handoffSpot || 'See item fulfilment details in My Orders'}</p>
          <p>{String(order.handoffType || 'handoff').replace(/_/g, ' ')}</p>
        </article>
        <article className="campus-order-placed-meta-card">
          <h3>Payment Method</h3>
          <p>Zumbarl Wallet</p>
          <p>{order.status === 'paid' ? 'Payment held in escrow' : String(order.status || 'Processing')}</p>
          <p>{formatKes(totals.finalTotal)}</p>
        </article>
        <article className="campus-order-placed-meta-card">
          <h3>Current Status</h3>
          <p>{String(order.fulfillmentStatus || 'seller_confirmation').replace(/_/g, ' ')}</p>
          <p>Live updates are available in My Orders.</p>
        </article>
      </section>

      <article className="campus-order-placed-timeline">
        <header>
          <h2>What happens next?</h2>
          <p>You can follow every step until delivery is complete.</p>
        </header>

        <div className="campus-order-placed-timeline-list">
          {timeline.map((item) => (
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
