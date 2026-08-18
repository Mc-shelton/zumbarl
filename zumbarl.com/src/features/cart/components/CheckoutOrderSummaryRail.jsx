import { Link } from 'react-router-dom'
import {
  formatKes,
  getLineItemPrice,
  getLineItemQuantity,
} from '../pricing'
import { CheckoutFeatureList } from './CheckoutFeatureList'

export function CheckoutOrderSummaryRail({
  children,
  compact = false,
  editLabel = 'Edit Cart',
  editPath = '/campus/cart',
  items,
  showImages = false,
  showQuantity = true,
  totals,
}) {
  const itemListClassName = `campus-checkout-mini-items${compact ? ' is-compact' : ''}`

  return (
    <section className="campus-rail-card campus-cart-summary-card">
      <header className="campus-checkout-summary-head">
        <h2>Order Summary <span>({items.length} items)</span></h2>
        <Link to={editPath}>{editLabel}</Link>
      </header>

      <div className={itemListClassName}>
        {items.map((item) => (
          <MiniOrderItem
            key={item.id}
            item={item}
            showImages={showImages}
            showQuantity={showQuantity}
          />
        ))}
      </div>

      <div className="campus-cart-summary-list">
        <article>
          <p>Subtotal</p>
          <strong>{formatKes(totals.subtotal)}</strong>
        </article>
        <article>
          <p>Delivery Fee</p>
          <strong>{totals.deliveryPending ? 'Not yet quoted' : totals.deliveryFee ? formatKes(totals.deliveryFee) : 'Free'}</strong>
        </article>
      </div>

      {totals.deliveryPending ? <p className="campus-cart-delivery-warning" role="status">Delivery is not included yet. Confirm the delivery price with the seller before paying.</p> : null}

      <div className="campus-cart-summary-total">
        <p>Total</p>
        <strong>{formatKes(totals.finalTotal)}</strong>
      </div>

      {children}

      <CheckoutFeatureList />
    </section>
  )
}

function MiniOrderItem({ item, showImages, showQuantity }) {
  const quantity = getLineItemQuantity(item)
  const lineTotal = getLineItemPrice(item) * quantity

  if (showImages) {
    return (
      <article>
        <img src={item.image} alt={item.title} loading="lazy" />
        <div>
          <h3>{item.title}</h3>
          <p>Qty: {quantity}</p>
        </div>
        <strong>{formatKes(lineTotal)}</strong>
      </article>
    )
  }

  return (
    <article>
      <h3>{item.title}</h3>
      {showQuantity ? <p>Qty: {quantity}</p> : null}
      <strong>{formatKes(lineTotal)}</strong>
    </article>
  )
}
