import { useMemo, useState } from 'react'
import { FiCheck, FiClock, FiMapPin, FiMessageCircle, FiPackage, FiRefreshCw, FiShoppingBag, FiTruck } from 'react-icons/fi'

const FILTERS = [['active', 'Active'], ['all', 'All orders'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
const FLOW = ['confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'completed']
const FINISHED = new Set(['completed', 'cannot_fulfil', 'cancelled'])

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function label(value = '') {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function MarketplaceBuyerOrders({ error = '', isLoading, onCancel, onConfirmReceived, onContinueShopping, onMessageSeller, onRefresh, orders, updatingOrderId = '' }) {
  const [filter, setFilter] = useState('active')
  const [selectedId, setSelectedId] = useState('')
  const filtered = useMemo(() => orders.filter((order) => {
    if (filter === 'all') return true
    if (filter === 'active') return !FINISHED.has(order.fulfillmentStatus)
    if (filter === 'cancelled') return ['cannot_fulfil', 'cancelled'].includes(order.fulfillmentStatus)
    return order.fulfillmentStatus === filter
  }), [filter, orders])
  const selected = orders.find((order) => order.id === selectedId) || filtered[0] || null

  return <section className="marketplace-buyer-orders">
    <header><div><span>Buyer workspace</span><h2>Track your orders</h2><p>Follow each purchase from seller confirmation to pickup or delivery.</p></div><button type="button" onClick={onRefresh}><FiRefreshCw /> Refresh</button></header>
    <nav aria-label="Filter purchases">{FILTERS.map(([key, text]) => <button type="button" className={filter === key ? 'is-active' : ''} key={key} onClick={() => setFilter(key)}>{text}<span>{orders.filter((order) => key === 'all' || (key === 'active' ? !FINISHED.has(order.fulfillmentStatus) : key === 'cancelled' ? ['cannot_fulfil', 'cancelled'].includes(order.fulfillmentStatus) : order.fulfillmentStatus === key)).length}</span></button>)}</nav>
    {error ? <div className="marketplace-buyer-orders-empty is-error"><h3>Orders unavailable</h3><p>{error}</p><button type="button" onClick={onRefresh}>Try again</button></div> : null}
    {isLoading ? <div className="marketplace-buyer-orders-empty"><FiPackage /><h3>Loading your orders…</h3></div> : null}
    {!isLoading && !error && !filtered.length ? <div className="marketplace-buyer-orders-empty"><FiShoppingBag /><h3>{orders.length ? `No ${filter} orders` : 'No purchases yet'}</h3><p>Your marketplace purchases will appear here after checkout.</p><button type="button" onClick={onContinueShopping}>Continue shopping</button></div> : null}
    {!isLoading && !error && filtered.length ? <div className="marketplace-buyer-orders-layout">
      <div className="marketplace-buyer-order-list">{filtered.map((order) => { const item = order.items?.[0] || {}; return <button type="button" className={selected?.id === order.id ? 'is-selected' : ''} key={order.id} onClick={() => setSelectedId(order.id)}><img src={item.image || '/assets/index/bee_nobg.png'} alt="" /><span><small>ORDER #{order.id.slice(-8).toUpperCase()}</small><strong>{item.title || 'Marketplace purchase'}{order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}</strong><em>{order.handoffType === 'pickup' ? 'Campus pickup' : 'Delivery'} · {money(order.totalAmount, order.currency)}</em></span><i className={`is-${order.fulfillmentStatus}`}>{label(order.fulfillmentStatus)}</i></button> })}</div>
      {selected ? <article className="marketplace-buyer-order-detail">
        <header><div><small>ORDER #{selected.id.slice(-8).toUpperCase()}</small><h3>{label(selected.fulfillmentStatus)}</h3><p>{selected.fulfillmentStatus === 'seller_confirmation' ? 'Your payment is confirmed. The seller has been asked to accept the order.' : selected.fulfillmentStatus === 'cannot_fulfil' ? 'The seller could not fulfil this order. A refund is required.' : 'Your order is moving through fulfilment.'}</p></div><strong>{money(selected.totalAmount, selected.currency)}</strong></header>
        {selected.fulfillmentStatus !== 'cannot_fulfil' ? <div className="marketplace-buyer-order-progress">{FLOW.map((step, index) => { const current = ['seller_confirmation', ...FLOW].indexOf(selected.fulfillmentStatus); return <span className={current > index ? 'is-done' : current === index ? 'is-current' : ''} key={step}><i>{current > index ? <FiCheck /> : index + 1}</i><small>{label(step)}</small></span> })}</div> : null}
        <section><h4>Items</h4>{(selected.items || []).map((item) => <div className="marketplace-buyer-order-item" key={item.listingId}><img src={item.image || '/assets/index/bee_nobg.png'} alt="" /><span><strong>{item.title}</strong><small>Quantity {item.quantity || 1}</small></span><b>{money(Number(item.unitAmount) * Number(item.quantity || 1), item.currency)}</b></div>)}</section>
        <section className="marketplace-buyer-order-handoff"><h4>{selected.handoffType === 'pickup' ? 'Pickup details' : 'Delivery details'}</h4><div>{selected.handoffType === 'pickup' ? <FiMapPin /> : <FiTruck />}<span><strong>{selected.handoffSpot || 'Coordinate with the seller'}</strong><p>{selected.fulfillmentStatus === 'ready' ? 'Your order is ready—contact the seller before heading to the pickup point.' : 'We’ll keep this page updated as the seller progresses your order.'}</p></span></div></section>
        <footer>
          <button type="button" onClick={() => onMessageSeller(selected)}><FiMessageCircle /> Message seller</button>
          {['seller_confirmation', 'confirmed'].includes(selected.fulfillmentStatus) ? <button type="button" disabled={updatingOrderId === selected.id} onClick={() => onCancel(selected)}>Cancel order</button> : null}
          {selected.fulfillmentStatus === 'delivered' ? <button type="button" disabled={updatingOrderId === selected.id} onClick={() => onConfirmReceived(selected)}><FiCheck /> {updatingOrderId === selected.id ? 'Confirming…' : 'Confirm order received'}</button> : null}
          <span><FiClock /> Placed {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : 'recently'}</span>
        </footer>
      </article> : null}
    </div> : null}
  </section>
}

export default MarketplaceBuyerOrders
