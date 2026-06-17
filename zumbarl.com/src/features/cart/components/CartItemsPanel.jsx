import { FiArrowRight, FiChevronRight, FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { SUGGESTED_PRODUCTS } from '../cartData'
import { formatKes } from '../pricing'

export function CartItemsPanel({ items, onQuantityChange, onRemoveItem }) {
  return (
    <section className="campus-cart-list-card" aria-label="Cart items">
      <header className="campus-cart-list-head">
        <p>Item</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
      </header>

      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="campus-cart-row-list">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>
      )}

      <SuggestedProducts />
    </section>
  )
}

function CartItemRow({ item, onQuantityChange, onRemoveItem }) {
  return (
    <article className="campus-cart-row">
      <div className="campus-cart-item-cell">
        <img src={item.image} alt={item.title} loading="lazy" />
        <div>
          <em className={item.badgeTone}>{item.badge}</em>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="campus-cart-item-actions">
            <button type="button">Save for later</button>
            <button type="button" onClick={() => onRemoveItem(item.id)}>Remove</button>
          </div>
        </div>
      </div>

      <p className="campus-cart-price-cell">{formatKes(item.unitPrice)}</p>

      <div className="campus-cart-qty-cell">
        <button
          type="button"
          aria-label={`Decrease quantity for ${item.title}`}
          onClick={() => onQuantityChange(item.id, -1)}
        >
          <FiMinus aria-hidden="true" />
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity for ${item.title}`}
          onClick={() => onQuantityChange(item.id, 1)}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      <div className="campus-cart-total-cell">
        <strong>{formatKes(item.unitPrice * item.quantity)}</strong>
        <button type="button" aria-label={`Remove ${item.title}`} onClick={() => onRemoveItem(item.id)}>
          <FiX aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

function CartEmptyState() {
  return (
    <section className="campus-cart-empty-state">
      <h2>Your cart is empty</h2>
      <p>Add products from Explore Campus or Marketplace to see them here.</p>
      <Link to="/campus/explore" className="campus-cart-empty-btn">
        Explore products
        <FiArrowRight aria-hidden="true" />
      </Link>
    </section>
  )
}

function SuggestedProducts() {
  const canUseCart = hasAccess(ACCESS_KEYS.cart.view)

  return (
    <section className="campus-cart-suggested">
      <header>
        <h2>You might also like</h2>
      </header>
      <div className="campus-cart-suggested-row">
        {SUGGESTED_PRODUCTS.map((product) => (
          <article key={product.id}>
            <img src={product.image} alt={product.title} loading="lazy" />
            <div>
              <h3>{product.title}</h3>
              <p>{formatKes(product.price)}</p>
              {canUseCart ? <button type="button">Add to Cart</button> : null}
            </div>
          </article>
        ))}
        <button type="button" className="campus-cart-suggested-next" aria-label="More suggested products">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
