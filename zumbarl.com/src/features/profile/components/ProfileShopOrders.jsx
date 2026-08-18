import { useMemo, useState } from 'react'
import { FiCheck, FiChevronLeft, FiClock, FiMapPin, FiMessageCircle, FiPackage, FiTruck, FiX } from 'react-icons/fi'

const FILTERS = [
  ['active', 'Active'], ['seller_confirmation', 'New'], ['packaging', 'Preparing'],
  ['ready', 'Ready'], ['in_transit', 'In transit'], ['completed', 'Completed'], ['cancelled', 'Cancelled'],
]

const STEPS = [
  ['seller_confirmation', 'Confirm order'],
  ['confirmed', 'Start preparing'],
  ['packaging', 'Mark ready'],
  ['ready', 'Start handoff'],
  ['in_transit', 'Mark delivered'],
]

const NEXT_STATUS = {
  seller_confirmation: 'confirmed', confirmed: 'packaging', packaging: 'ready',
  ready: 'in_transit', in_transit: 'delivered',
}

const CANCELLED = new Set(['cancelled', 'cannot_fulfil'])
const TERMINAL = new Set(['completed', ...CANCELLED])
const SELLER_CAN_CANCEL = new Set(['seller_confirmation', 'confirmed', 'packaging'])

function matchesFilter(order, filter) {
  if (filter === 'active') return !TERMINAL.has(order.fulfillmentStatus)
  if (filter === 'cancelled') return CANCELLED.has(order.fulfillmentStatus)
  return order.fulfillmentStatus === filter
}

function statusLabel(status) {
  if (status === 'delivered') return 'Awaiting buyer confirmation'
  return CANCELLED.has(status) ? 'Cancelled' : label(status)
}

function escrowReleaseMessage(order) {
  if (order.fulfillmentStatus !== 'delivered') return ''
  if (!order.autoReleaseAt) return 'Funds remain in escrow until the buyer confirms receipt or the 7-day confirmation window ends.'
  const releaseAt = new Date(order.autoReleaseAt)
  return `Funds remain in escrow until the buyer confirms receipt. If they do not respond, funds release automatically on ${releaseAt.toLocaleDateString('en-KE', { dateStyle: 'medium' })}.`
}

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function label(value = '') {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function ProfileShopOrders({ error = '', isLoading, orders, onBack, onMessageBuyer, onRefresh, onUpdateStatus, updatingOrderId }) {
  const [filter, setFilter] = useState('active')
  const [selectedId, setSelectedId] = useState('')
  const filtered = useMemo(() => orders.filter((order) => matchesFilter(order, filter)), [filter, orders])
  const selected = orders.find((order) => order.id === selectedId) || filtered[0] || null
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([key]) => [key, orders.filter((order) => matchesFilter(order, key)).length])), [orders])

  return (
    <section className="campus-shop-orders" aria-label="Seller order fulfilment">
      <header className="campus-shop-orders-head">
        <button type="button" onClick={onBack}><FiChevronLeft aria-hidden="true" /> Shop</button>
        <div><span>Seller workspace</span><h2>Orders &amp; fulfilment</h2><p>Confirm paid orders, prepare items and coordinate every handoff.</p></div>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </header>

      <div className="campus-shop-order-summary">
        <article><FiClock /><span><strong>{counts.seller_confirmation || 0}</strong>Need attention</span></article>
        <article><FiPackage /><span><strong>{(counts.packaging || 0) + (counts.ready || 0)}</strong>Being fulfilled</span></article>
        <article><FiTruck /><span><strong>{counts.in_transit || 0}</strong>In handoff</span></article>
        <article><FiCheck /><span><strong>{counts.completed || 0}</strong>Completed</span></article>
      </div>

      <nav className="campus-shop-order-filters" aria-label="Filter orders">
        {FILTERS.map(([key, text]) => <button type="button" className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)} key={key}>{text}<span>{counts[key] || 0}</span></button>)}
      </nav>

      {error ? <div className="campus-shop-orders-notice is-error"><p>{error}</p><button type="button" onClick={onRefresh}>Try again</button></div> : null}
      {isLoading ? <div className="campus-shop-orders-empty"><FiPackage /><h3>Loading orders…</h3></div> : null}
      {!isLoading && !error && !filtered.length ? <div className="campus-shop-orders-empty"><FiPackage /><h3>No {filter === 'active' ? 'active' : label(filter).toLowerCase()} orders</h3><p>Orders will appear here as soon as customers check out.</p></div> : null}

      {!isLoading && filtered.length ? (
        <div className="campus-shop-orders-workspace">
          <div className="campus-shop-order-list">
            {filtered.map((order) => {
              const first = order.items?.[0] || {}
              const units = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0)
              return <button type="button" className={selected?.id === order.id ? 'is-selected' : ''} key={order.id} onClick={() => setSelectedId(order.id)}>
                <img src={first.image || '/assets/index/bee_nobg.png'} alt="" />
                <span><small>#{order.id.slice(-8).toUpperCase()}</small><strong>{first.title || 'Marketplace order'}{order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}</strong><em>{units} item{units === 1 ? '' : 's'} · {order.handoffType === 'drop-off' ? 'Delivery' : 'Pickup'}</em></span>
                <span><b>{money(order.totalAmount, order.currency)}</b><i className={`is-${order.fulfillmentStatus}`}>{statusLabel(order.fulfillmentStatus)}</i></span>
              </button>
            })}
          </div>

          {selected ? <article className="campus-shop-order-detail">
            <header><div><span>ORDER #{selected.id.slice(-8).toUpperCase()}</span><h3>{statusLabel(selected.fulfillmentStatus)}</h3><p>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently placed'} · {selected.fulfillmentStatus === 'delivered' ? 'Payment held in escrow' : `Payment ${label(selected.status)}`}</p></div><strong>{money(selected.totalAmount, selected.currency)}</strong></header>
            {selected.fulfillmentStatus === 'delivered' ? <div className="campus-shop-orders-notice"><FiClock /><p><strong>Waiting for the buyer to confirm receipt.</strong> {escrowReleaseMessage(selected)}</p></div> : null}
            {!CANCELLED.has(selected.fulfillmentStatus) ? <div className="campus-shop-order-progress">
              {['confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'completed'].map((step, index) => {
                const current = ['seller_confirmation', 'confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'completed'].indexOf(selected.fulfillmentStatus)
                return <span className={current > index ? 'is-done' : current === index ? 'is-current' : ''} key={step}><i>{current > index ? <FiCheck /> : index + 1}</i><small>{label(step)}</small></span>
              })}
            </div> : null}
            <section><h4>Items to fulfil</h4>{(selected.items || []).map((item) => <div className="campus-shop-order-item" key={item.listingId}><img src={item.image || '/assets/index/bee_nobg.png'} alt="" /><span><strong>{item.title || 'Marketplace item'}</strong><small>Qty {item.quantity || 1}{item.variant ? ` · ${item.variant}` : ''}</small></span><b>{money(Number(item.unitAmount) * Number(item.quantity || 1), item.currency)}</b></div>)}</section>
            <section className="campus-shop-order-handoff"><h4>Handoff</h4><div><FiMapPin /><span><strong>{selected.handoffType === 'drop-off' ? 'Deliver to customer' : 'Customer pickup'}</strong><p>{selected.handoffSpot || selected.items?.[0]?.fulfilment?.location || 'Coordinate the location with the buyer.'}</p></span></div></section>
            <footer>
              <button type="button" onClick={() => onMessageBuyer(selected)}><FiMessageCircle /> Message buyer</button>
              {SELLER_CAN_CANCEL.has(selected.fulfillmentStatus) ? <button type="button" className="is-danger" disabled={updatingOrderId === selected.id} onClick={() => onUpdateStatus(selected, 'cannot_fulfil')}><FiX /> Cannot fulfil</button> : null}
              {NEXT_STATUS[selected.fulfillmentStatus] ? <button type="button" className="is-primary" disabled={updatingOrderId === selected.id} onClick={() => onUpdateStatus(selected, NEXT_STATUS[selected.fulfillmentStatus])}>{updatingOrderId === selected.id ? 'Updating…' : STEPS.find(([status]) => status === selected.fulfillmentStatus)?.[1]} <FiCheck /></button> : null}
            </footer>
          </article> : null}
        </div>
      ) : null}
    </section>
  )
}

export default ProfileShopOrders
