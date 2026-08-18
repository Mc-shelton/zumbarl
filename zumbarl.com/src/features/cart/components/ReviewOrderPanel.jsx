import {
  FiArrowRight,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiTruck,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import {
  CUSTOMER_DETAILS,
  DELIVERY_ESTIMATE,
  PAYMENT_SUMMARY,
} from '../checkoutData'
import { formatKes, getLineItemPrice, getLineItemQuantity } from '../pricing'

export function ReviewOrderPanel({ error = '', isPlacingOrder = false, items, onBack, onPlaceOrder }) {
  return (
    <section className="campus-checkout-panel campus-review-stack">
      <DeliveryInformationCard />
      <PaymentInformationCard />
      <ReviewItemsCard items={items} />

      {error ? <p className="campus-checkout-order-error" role="alert">{error}</p> : null}

      <footer className="campus-checkout-actions">
        <button type="button" className="campus-checkout-back-btn" onClick={onBack}>
          <FiArrowRight aria-hidden="true" />
          Back to Payment
        </button>
        <button type="button" className="campus-checkout-next-btn" disabled={isPlacingOrder || !items.length} onClick={onPlaceOrder}>
          <FiLock aria-hidden="true" />
          {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
          <FiArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}

function DeliveryInformationCard() {
  return (
    <article className="campus-review-card">
      <header>
        <h2>Delivery Information</h2>
        <button type="button">Edit</button>
      </header>
      <div className="campus-review-delivery-grid">
        <div className="campus-review-detail-list">
          <p><FiUser aria-hidden="true" /> {CUSTOMER_DETAILS.name}</p>
          <p><FiMessageCircle aria-hidden="true" /> {CUSTOMER_DETAILS.phone}</p>
          <p><FiMail aria-hidden="true" /> {CUSTOMER_DETAILS.email}</p>
        </div>
        <div className="campus-review-detail-list">
          <p><FiMapPin aria-hidden="true" /> {CUSTOMER_DETAILS.location}</p>
          <p>{CUSTOMER_DETAILS.county}</p>
          <p>{CUSTOMER_DETAILS.postal}</p>
        </div>
        <article className="campus-review-mini-delivery">
          <FiTruck aria-hidden="true" />
          <div>
            <h3>Estimated Delivery</h3>
            <strong>{DELIVERY_ESTIMATE.dateRange}</strong>
            <p>{DELIVERY_ESTIMATE.location}</p>
          </div>
          <button type="button">Change</button>
        </article>
      </div>
    </article>
  )
}

function PaymentInformationCard() {
  return (
    <article className="campus-review-card">
      <header>
        <h2>Payment Information</h2>
        <button type="button">Edit</button>
      </header>
      <div className="campus-review-payment-row">
        <span>{PAYMENT_SUMMARY.brand}</span>
        <p>{PAYMENT_SUMMARY.method} <strong>{PAYMENT_SUMMARY.card}</strong></p>
        <em><FiLock aria-hidden="true" /> Secure Payment</em>
      </div>
    </article>
  )
}

function ReviewItemsCard({ items }) {
  return (
    <article className="campus-review-card">
      <header>
        <h2>Order Items ({items.length})</h2>
        <Link to="/campus/cart">Edit Cart</Link>
      </header>
      <div className="campus-review-item-list">
        {items.map((item) => {
          const quantity = getLineItemQuantity(item)
          const lineTotal = getLineItemPrice(item) * quantity

          return (
            <article key={item.id}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div>
                <h3>{item.title}</h3>
                <p>Qty: {quantity}</p>
              </div>
              <strong>{formatKes(lineTotal)}</strong>
            </article>
          )
        })}
      </div>
    </article>
  )
}
