import { CHECKOUT_FEATURES } from '../checkoutData'

export function CheckoutFeatureList() {
  return (
    <div className="campus-cart-feature-list">
      {CHECKOUT_FEATURES.map(({ title, detail, Icon }) => (
        <article key={title}>
          <div className="campus-cart-feature-icon">
            <Icon aria-hidden="true" />
          </div>
          <div>
            <h3>{title}</h3>
            <p>{detail}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
