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
          <strong>{formatKes(totals.deliveryFee)}</strong>
        </article>
        <article>
          <p>Platform Fee</p>
          <strong>{formatKes(totals.platformFee)}</strong>
        </article>
      </div>

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

      {canCheckout ? (
        <Link to="/campus/cart/payment" className="campus-cart-checkout-btn">
          Proceed to Checkout
          <FiArrowRight aria-hidden="true" />
        </Link>
      ) : null}

      <p className="campus-cart-secure-note">
        <FiLock aria-hidden="true" />
        Secure checkout powered by Zumbarl
      </p>

      <CheckoutFeatureList />
    </section>
  )
}
