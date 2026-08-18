import { FiArrowRight, FiChevronRight, FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { SUGGESTED_PRODUCTS } from '../cartData'
import { formatKes } from '../pricing'

export function CartItemsPanel({ items, onFulfilmentChange, onQuantityChange, onRemoveItem, onZumbarlDeliveryQuote }) {
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
              onFulfilmentChange={onFulfilmentChange}
              onZumbarlDeliveryQuote={onZumbarlDeliveryQuote}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>
      )}

      <SuggestedProducts />
    </section>
  )
}

function CartItemRow({ item, onFulfilmentChange, onQuantityChange, onRemoveItem, onZumbarlDeliveryQuote }) {
  const fulfilmentValue = item.fulfilment?.method === 'seller_delivery' ? `delivery:${item.fulfilment.location}` : item.fulfilment?.method || 'unquoted'
  const [deliveryMode, setDeliveryMode] = useState(fulfilmentValue)
  const [destination, setDestination] = useState(item.fulfilment?.method === 'zumbarl_delivery' ? item.fulfilment.location : '')
  const [quoteError, setQuoteError] = useState('')
  const [isQuoting, setIsQuoting] = useState(false)

  async function requestZumbarlQuote() {
    setIsQuoting(true)
    setQuoteError('')
    try {
      if (!navigator.geolocation) throw new Error('Location is not supported by this browser.')
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }))
      await onZumbarlDeliveryQuote(item.id, destination.trim() || 'Buyer current location', { latitude: position.coords.latitude, longitude: position.coords.longitude })
    }
    catch (error) { setQuoteError(error.message) }
    finally { setIsQuoting(false) }
  }
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
          <label className="campus-cart-fulfilment-select">Fulfilment for this item
            <select value={deliveryMode} onChange={(event) => { setDeliveryMode(event.target.value); if (event.target.value !== 'zumbarl_delivery') onFulfilmentChange(item.id, event.target.value) }}>
              {(item.deliveryOptions || []).includes('Campus pickup') ? <option value="pickup">Campus pickup — Free</option> : null}
              {(item.deliveryOptions || []).includes('Digital delivery') ? <option value="digital">Digital delivery — Free</option> : null}
              {(item.deliveryZones || []).map((zone) => <option key={zone.location} value={`delivery:${zone.location}`}>{zone.location} — {formatKes(Number(zone.fee) || 0)}</option>)}
              <option value="zumbarl_delivery">Zumbarl Delivery — Get courier quote</option>
              {(!item.deliveryZones?.length && (item.deliveryOptions || []).includes('Seller delivery')) || fulfilmentValue === 'unquoted' ? <option value="unquoted">Seller delivery — Price not yet quoted</option> : null}
            </select>
          </label>
          {deliveryMode === 'zumbarl_delivery' ? <div className="campus-cart-zumbarl-quote"><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Delivery destination (optional label)" /><button type="button" disabled={isQuoting} onClick={requestZumbarlQuote}>{isQuoting ? 'Getting location…' : 'Use my location & calculate'}</button>{item.fulfilment?.method === 'zumbarl_delivery' && item.fulfilment.distanceKm ? <small>Approx. {item.fulfilment.distanceKm} km by {item.fulfilment.distanceSource === 'road_route' ? 'road' : 'estimated route'}{item.fulfilment.durationMinutes ? ` · ${item.fulfilment.durationMinutes} min` : ''}</small> : <small>We’ll ask for location access and calculate the road distance automatically.</small>}{quoteError ? <small>{quoteError}</small> : null}</div> : null}
        </div>
      </div>

      <p className="campus-cart-price-cell">{formatKes(item.unitPrice)}</p>

      <div className="campus-cart-qty-cell">
        <button
          type="button"
          aria-label={`Decrease quantity for ${item.title}`}
          disabled={item.lockedQuantity}
          onClick={() => onQuantityChange(item.id, -1)}
        >
          <FiMinus aria-hidden="true" />
        </button>
        <span title={item.lockedQuantity ? 'Accepted offers are reserved as one item' : undefined}>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity for ${item.title}`}
          disabled={item.lockedQuantity}
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
