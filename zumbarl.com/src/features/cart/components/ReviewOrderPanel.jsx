import {
  FiArrowRight,
  FiGift,
  FiLock,
  FiMapPin,
  FiTruck,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { formatKes, getLineItemPrice, getLineItemQuantity } from '../pricing'

export function ReviewOrderPanel({ customer, error = '', hasUnavailableItems = false, isPlacingOrder = false, items, onBack, onPlaceOrder }) {
  return (
    <section className="campus-checkout-panel campus-review-stack">
      <DeliveryInformationCard customer={customer} items={items} />
      <PaymentInformationCard />
      <ReviewItemsCard items={items} />

      {error ? <p className="campus-checkout-order-error" role="alert">{error}</p> : null}

      <footer className="campus-checkout-actions">
        <button type="button" className="campus-checkout-back-btn" onClick={onBack}>
          <FiArrowRight aria-hidden="true" />
          Back to Payment
        </button>
        <button type="button" className="campus-checkout-next-btn" disabled={isPlacingOrder || hasUnavailableItems || !items.length} onClick={onPlaceOrder}>
          <FiLock aria-hidden="true" />
          {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
          <FiArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}

function DeliveryInformationCard({ customer, items }) {
  const locations = [...new Set(items.map((item) => item.fulfilment?.location).filter(Boolean))]
  const customerName = customer?.user?.name || [customer?.student?.firstName, customer?.student?.lastName].filter(Boolean).join(' ')

  return (
    <article className="campus-review-card">
      <header>
        <h2>Delivery Information</h2>
        <Link to="/campus/cart">Edit</Link>
      </header>
      <div className="campus-review-delivery-grid">
        <div className="campus-review-detail-list">
          <p><FiUser aria-hidden="true" /> {customerName || 'Signed-in student'}</p>
        </div>
        <div className="campus-review-detail-list">
          {locations.map((location) => <p key={location}><FiMapPin aria-hidden="true" /> {location}</p>)}
        </div>
        <article className="campus-review-mini-delivery">
          <FiTruck aria-hidden="true" />
          <div>
            <h3>Selected fulfilment</h3>
            <strong>{items.every((item) => item.fulfilment?.quoted) ? 'Ready for checkout' : 'Selection required'}</strong>
            <p>{locations.join(' · ') || 'Return to the cart and choose pickup or delivery.'}</p>
          </div>
          <Link to="/campus/cart">Change</Link>
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
        <Link to="/campus/cart/payment">Edit</Link>
      </header>
      <div className="campus-review-payment-row">
        <span>WALLET</span>
        <p>Zumbarl Wallet <strong>Balance rechecked when placing the order</strong></p>
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
                {item.fulfilment?.method === 'errand_delivery' ? <p className="campus-review-selected-errander"><FiTruck aria-hidden="true" /> Campus errand delivery · {formatKes(Number(item.fulfilment.fee || 0))}</p> : null}
                {item.fulfilment?.method === 'free_campus_delivery' ? <p className="campus-review-selected-errander is-free"><FiGift aria-hidden="true" /> Free delivery by {item.shopName || 'the business'}</p> : null}
              </div>
              <strong>{formatKes(lineTotal)}</strong>
            </article>
          )
        })}
      </div>
    </article>
  )
}
