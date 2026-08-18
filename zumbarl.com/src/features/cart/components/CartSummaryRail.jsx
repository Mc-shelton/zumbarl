import { FiArrowRight, FiLock } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { formatKes } from '../pricing'
import { CheckoutFeatureList } from './CheckoutFeatureList'
import { DeliveryEstimateCard } from './DeliveryEstimateCard'

export function CartSummaryRail({ promoCode, setPromoCode, totals }) {
  const canCheckout = hasAccess(ACCESS_KEYS.cart.checkout)

  return (
    <section className="campus-rail-card campus-cart-summary-card">
      <h2>Order Summary</h2>

      <div className="campus-cart-summary-list">
        <article>
          <p>Subtotal ({totals.itemCount} items)</p>
          <strong>{formatKes(totals.subtotal)}</strong>
        </article>
        <article>
          <p>Delivery Fee</p>
          <strong>{totals.deliveryPending ? 'Not yet quoted' : totals.deliveryFee ? formatKes(totals.deliveryFee) : 'Free'}</strong>
        </article>
      </div>

      {totals.deliveryPending ? <p className="campus-cart-delivery-warning" role="status">Delivery has not been included in this total. The seller must confirm a delivery price before payment.</p> : null}

      <div className="campus-cart-summary-total">
        <p>Total</p>
        <strong>{formatKes(totals.finalTotal)}</strong>
      </div>

      <DeliveryEstimateCard />

      <form className="campus-cart-promo-row" onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value)}
          placeholder="Have a promo code?"
          aria-label="Promo code"
        />
        <button type="submit">Apply</button>
      </form>

      {canCheckout && totals.itemCount > 0 && !totals.deliveryPending ? (
        <Link to="/campus/cart/payment" className="campus-cart-checkout-btn">
          Proceed to Checkout
          <FiArrowRight aria-hidden="true" />
        </Link>
      ) : canCheckout && totals.itemCount > 0 ? <button type="button" className="campus-cart-checkout-btn" disabled>Awaiting delivery quote</button> : null}

      <p className="campus-cart-secure-note">
        <FiLock aria-hidden="true" />
        Secure checkout powered by Zumbarl
      </p>

      <CheckoutFeatureList />
    </section>
  )
}
