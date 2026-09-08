import { FiArrowRight, FiChevronRight, FiGift, FiMapPin, FiMinus, FiPlus, FiTruck, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { SUGGESTED_PRODUCTS } from '../cartData'
import { formatKes } from '../pricing'

export function CartItemsPanel({ items, onErrandDelivery, onFreeCampusDelivery, onFulfilmentChange, onQuantityChange, onRemoveItem, onZumbarlDeliveryQuote }) {
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
              key={`${item.id}:${item.fulfilment?.method}:${item.fulfilment?.location || ''}`}
              item={item}
              onErrandDelivery={onErrandDelivery}
              onFreeCampusDelivery={onFreeCampusDelivery}
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

function CartItemRow({ item, onErrandDelivery, onFreeCampusDelivery, onFulfilmentChange, onQuantityChange, onRemoveItem, onZumbarlDeliveryQuote }) {
  const isStudentKitchen = item.vendorType === 'student_kitchen'
  const isCampusEatery = ['hotel', 'student_kitchen'].includes(item.vendorType)
  const pickupSpots = item.pickupSpots || []
  const fulfilmentValue = item.fulfilment?.method === 'seller_delivery'
    ? `delivery:${item.fulfilment.location}`
    : item.fulfilment?.method === 'pickup' && isStudentKitchen
      ? `pickup:${item.fulfilment.location}`
      : item.fulfilment?.method || 'unquoted'
  const [deliveryMode, setDeliveryMode] = useState(fulfilmentValue)
  const [destination, setDestination] = useState(item.fulfilment?.method === 'zumbarl_delivery' ? item.fulfilment.location : '')
  const [errandDestination, setErrandDestination] = useState(item.fulfilment?.method === 'errand_delivery' ? item.fulfilment.location || '' : '')
  const [freeDeliveryDestination, setFreeDeliveryDestination] = useState(item.fulfilment?.method === 'free_campus_delivery' ? item.fulfilment.location || '' : '')
  const [erranderError, setErranderError] = useState('')
  const [isSelectingErrander, setIsSelectingErrander] = useState(false)
  const [freeDeliveryError, setFreeDeliveryError] = useState('')
  const [isSavingFreeDelivery, setIsSavingFreeDelivery] = useState(false)
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

  async function confirmErrandDelivery() {
    if (!errandDestination.trim()) {
      setErranderError('Enter your delivery location.')
      return
    }
    setIsSelectingErrander(true)
    setErranderError('')
    try {
      await onErrandDelivery(item.id, errandDestination.trim())
    } catch (error) {
      setErranderError(error.message || 'Campus errand delivery could not be selected.')
    } finally {
      setIsSelectingErrander(false)
    }
  }

  async function confirmFreeDelivery() {
    if (!freeDeliveryDestination.trim()) {
      setFreeDeliveryError('Enter your in-campus delivery location.')
      return
    }
    setIsSavingFreeDelivery(true)
    setFreeDeliveryError('')
    try {
      await onFreeCampusDelivery(item.id, freeDeliveryDestination.trim())
    } catch (error) {
      setFreeDeliveryError(error.message || 'Free delivery could not be selected.')
    } finally {
      setIsSavingFreeDelivery(false)
    }
  }

  const availableErranderCount = Number(item.availableErranderCount || 0)
  return (
    <article className="campus-cart-row">
      <div className="campus-cart-item-cell">
        <img src={item.image} alt={item.title} loading="lazy" />
        <div>
          <em className={item.badgeTone}>{item.badge}</em>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          {item.unavailable ? <p className="campus-cart-stock-warning" role="status">{item.availabilityMessage || 'This item is out of stock. Remove it to continue.'}</p> : null}
          {item.serviceRequest && item.serviceMode !== 'order_ahead' ? <p className="campus-cart-service-request"><strong>Booking requested:</strong> {item.serviceRequest.date ? `${item.serviceRequest.date} at ` : ''}{item.serviceRequest.time}{item.serviceRequest.notes ? ` · ${item.serviceRequest.notes}` : ''}</p> : null}
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
          disabled={item.lockedQuantity || item.unavailable}
          onClick={() => onQuantityChange(item.id, -1)}
        >
          <FiMinus aria-hidden="true" />
        </button>
        <span title={item.lockedQuantity ? 'Accepted offers are reserved as one item' : undefined}>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity for ${item.title}`}
          disabled={item.lockedQuantity || item.unavailable || item.quantity >= item.stock}
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

      <section className="campus-cart-fulfilment-panel">
        <div className="campus-cart-fulfilment-toolbar">
          <span className="campus-cart-fulfilment-icon"><FiTruck /></span>
          <div><strong>How should this order reach you?</strong><small>{item.shopName || 'This business'} · choose one option for this order</small></div>
          <label className="campus-cart-fulfilment-select"><span>{item.kind === 'service' ? 'Order fulfilment' : 'Item fulfilment'}</span>
            <select value={deliveryMode} onChange={(event) => { setDeliveryMode(event.target.value); setErranderError(''); setFreeDeliveryError(''); if (!['zumbarl_delivery', 'errand_delivery', 'free_campus_delivery'].includes(event.target.value)) onFulfilmentChange(item.id, event.target.value) }}>
              {(item.deliveryOptions || []).includes('Campus pickup') && isStudentKitchen ? pickupSpots.map((spot) => <option key={spot} value={`pickup:${spot}`}>Pick up at {spot}</option>) : null}
              {(item.deliveryOptions || []).includes('Campus pickup') && !isCampusEatery ? <option value="pickup">Collect from {item.shopName || 'business'} (pickup)</option> : null}
              {(item.deliveryOptions || []).includes('Digital delivery') ? <option value="digital">Digital delivery — Free</option> : null}
              {(item.deliveryZones || []).map((zone) => <option key={zone.location} value={`delivery:${zone.location}`}>{zone.location} — {formatKes(Number(zone.fee) || 0)}</option>)}
              {item.freeCampusDelivery ? <option value="free_campus_delivery">Free in-campus delivery — From {item.shopName || 'this page'}</option> : null}
              {item.errandsEnabled && !item.freeCampusDelivery ? <option disabled={!availableErranderCount} value="errand_delivery">{availableErranderCount ? `Campus errand delivery — ${formatKes(item.errandFee)}` : 'Campus errand delivery · Nobody online'}</option> : null}
              {item.kind !== 'service' ? <option value="zumbarl_delivery">Zumbarl Delivery — Get courier quote</option> : null}
              {(!item.deliveryZones?.length && (item.deliveryOptions || []).includes('Seller delivery')) || fulfilmentValue === 'unquoted' ? <option value="unquoted">{isStudentKitchen ? 'Choose a pickup location' : isCampusEatery ? 'Choose a delivery option' : 'Seller delivery — Price not yet quoted'}</option> : null}
            </select>
          </label>
        </div>
        {item.errandsEnabled && !item.freeCampusDelivery && !availableErranderCount ? <p className="campus-cart-errander-offline"><FiTruck /> No erranders from {item.shopName || 'this page'} have availability turned on right now.</p> : null}
        {deliveryMode === 'free_campus_delivery' ? <section className="campus-cart-free-delivery">
          <header><span><FiGift /></span><div><strong>Free in-campus delivery</strong><p>{item.shopName || 'This business'} will handle this delivery at no charge.</p></div><em>Free</em></header>
          <label><span><FiMapPin /> Deliver to</span><input onChange={(event) => setFreeDeliveryDestination(event.target.value)} placeholder="e.g. Hall 4, Room 21" type="text" value={freeDeliveryDestination} /></label>
          <footer><p>No student errander is needed for this order.</p><button disabled={isSavingFreeDelivery || !freeDeliveryDestination.trim()} onClick={confirmFreeDelivery} type="button">{isSavingFreeDelivery ? 'Saving…' : item.fulfilment?.method === 'free_campus_delivery' ? 'Update location' : 'Use free delivery'}</button></footer>
          {freeDeliveryError ? <p className="campus-cart-errander-error" role="alert">{freeDeliveryError}</p> : null}
        </section> : null}
        {deliveryMode === 'errand_delivery' ? <section className="campus-cart-errander-picker">
          <header><span><FiTruck /></span><div><strong>Campus errand delivery</strong><p>Your request goes to every available errander for {item.shopName || 'this business'}. The first to accept will deliver it.</p></div><em>{formatKes(item.errandFee)}</em></header>
          <div className="campus-cart-errander-handoff">
            <label className="campus-cart-errander-destination"><span><FiMapPin /> Delivery location</span><input onChange={(event) => setErrandDestination(event.target.value)} placeholder="Hostel, building and room number" type="text" value={errandDestination} /></label>
            <button disabled={isSelectingErrander || !errandDestination.trim()} onClick={confirmErrandDelivery} type="button">{isSelectingErrander ? 'Saving…' : item.fulfilment?.method === 'errand_delivery' ? 'Update location' : 'Use errand delivery'}</button>
          </div>
          <footer><p>{availableErranderCount} {availableErranderCount === 1 ? 'errander is' : 'erranders are'} available now. The delivery price is fixed by the page.</p></footer>
          {erranderError ? <p className="campus-cart-errander-error" role="alert">{erranderError}</p> : null}
        </section> : null}
        {deliveryMode === 'zumbarl_delivery' ? <div className="campus-cart-zumbarl-quote"><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Delivery destination (optional label)" /><button type="button" disabled={isQuoting} onClick={requestZumbarlQuote}>{isQuoting ? 'Getting location…' : 'Use my location & calculate'}</button>{item.fulfilment?.method === 'zumbarl_delivery' && item.fulfilment.distanceKm ? <small>Approx. {item.fulfilment.distanceKm} km by {item.fulfilment.distanceSource === 'road_route' ? 'road' : 'estimated route'}{item.fulfilment.durationMinutes ? ` · ${item.fulfilment.durationMinutes} min` : ''}</small> : <small>We’ll ask for location access and calculate the road distance automatically.</small>}{quoteError ? <small>{quoteError}</small> : null}</div> : null}
      </section>
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

  if (!SUGGESTED_PRODUCTS.length) return null

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
