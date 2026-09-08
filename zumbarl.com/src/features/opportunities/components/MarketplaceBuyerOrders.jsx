import { useMemo, useState } from 'react'
import { FiCheck, FiClock, FiCopy, FiKey, FiMapPin, FiMessageCircle, FiPackage, FiRefreshCw, FiShield, FiShoppingBag, FiTruck, FiX } from 'react-icons/fi'
import { readMarketplaceDeliveryCode } from '../services/marketplaceInteractionService'

const FILTERS = [['active', 'Active'], ['all', 'All orders'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
const FLOW = ['confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'completed']
const FINISHED = new Set(['completed', 'cannot_fulfil', 'cancelled'])
const STATUS_COPY = {
  seller_confirmation: 'Payment is protected while the seller confirms your order.',
  confirmed: 'The seller accepted your order and is getting it ready.',
  packaging: 'Your items are being packed for a safe campus handoff.',
  ready: 'Your order is ready. Contact the seller before heading to the pickup point.',
  in_transit: 'Your order has left the seller and is on its way.',
  delivered: 'Your order has arrived. Confirm receipt after checking your items.',
  completed: 'Order complete — thank you for shopping within the Zumbarl community.',
  cannot_fulfil: 'The seller could not fulfil this order. Your full payment has been returned to your wallet.',
  cancelled: 'This order was cancelled and your full held payment was returned to your wallet.',
}

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function label(value = '') {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function MarketplaceBuyerOrders({ error = '', initialOrderId = '', isLoading, onCancel, onConfirmReceived, onContinueShopping, onMessageOrderContact, onRefresh, orders, updatingOrderId = '' }) {
  const [filter, setFilter] = useState('active')
  const [selectedId, setSelectedId] = useState(initialOrderId)
  const [codeDialog, setCodeDialog] = useState(null)
  const filtered = useMemo(() => orders.filter((order) => {
    if (filter === 'all') return true
    if (filter === 'active') return !FINISHED.has(order.fulfillmentStatus)
    if (filter === 'cancelled') return ['cannot_fulfil', 'cancelled'].includes(order.fulfillmentStatus)
    return order.fulfillmentStatus === filter
  }), [filter, orders])
  const selected = orders.find((order) => order.id === selectedId) || filtered[0] || null
  const currentStep = selected ? FLOW.indexOf(selected.fulfillmentStatus) : -1
  const selectedUsesErrander = Boolean(selected?.items?.some((item) => item.fulfilment?.method === 'errand_delivery'))
  const messagesErrander = Boolean(selectedUsesErrander && selected?.fulfillmentStatus === 'in_transit' && selected?.assignedErrander?.userId)

  async function showDeliveryCode(order) {
    setCodeDialog({ order, loading: true, code: '', error: '' })
    try {
      const result = await readMarketplaceDeliveryCode(order.id)
      setCodeDialog({ order, loading: false, code: result.code, error: '' })
    } catch (requestError) {
      setCodeDialog({ order, loading: false, code: '', error: requestError.message || 'The delivery code is not available yet.' })
    }
  }

  return (
    <section className="marketplace-buyer-orders">
      <header className="marketplace-buyer-orders-hero">
        <div className="marketplace-buyer-orders-brand">
          <span className="marketplace-buyer-orders-mark"><img src="/assets/index/bee_nobg.png" alt="" /></span>
          <div>
            <span>Zumbarl marketplace</span>
            <h2>Your campus orders</h2>
            <p>From checkout to handoff, everything stays clear, local and protected.</p>
          </div>
        </div>
        <div className="marketplace-buyer-orders-hero-actions">
          <span><FiShield aria-hidden="true" /> Buyer protected</span>
          <button type="button" onClick={onRefresh}><FiRefreshCw aria-hidden="true" /> Refresh</button>
        </div>
      </header>

      <nav className="marketplace-buyer-orders-tabs" aria-label="Filter purchases">
        {FILTERS.map(([key, text]) => (
          <button type="button" className={filter === key ? 'is-active' : ''} key={key} onClick={() => setFilter(key)}>
            {text}
            <span>{orders.filter((order) => key === 'all' || (key === 'active' ? !FINISHED.has(order.fulfillmentStatus) : key === 'cancelled' ? ['cannot_fulfil', 'cancelled'].includes(order.fulfillmentStatus) : order.fulfillmentStatus === key)).length}</span>
          </button>
        ))}
      </nav>

      {error ? <div className="marketplace-buyer-orders-empty is-error"><h3>Orders unavailable</h3><p>{error}</p><button type="button" onClick={onRefresh}>Try again</button></div> : null}
      {isLoading ? <div className="marketplace-buyer-orders-empty"><FiPackage /><h3>Loading your orders…</h3></div> : null}
      {!isLoading && !error && !filtered.length ? <div className="marketplace-buyer-orders-empty"><FiShoppingBag /><h3>{orders.length ? `No ${filter} orders` : 'No purchases yet'}</h3><p>Your marketplace purchases will appear here after checkout.</p><button type="button" onClick={onContinueShopping}>Continue shopping</button></div> : null}

      {!isLoading && !error && filtered.length ? (
        <div className="marketplace-buyer-orders-layout">
          <aside className="marketplace-buyer-order-inbox">
            <header>
              <div><span>Order inbox</span><strong>{filter === 'all' ? 'Every purchase' : `${label(filter)} orders`}</strong></div>
              <em>{filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</em>
            </header>
            <div className="marketplace-buyer-order-list">
              {filtered.map((order) => {
                const item = order.items?.[0] || {}
                return (
                  <button type="button" aria-pressed={selected?.id === order.id} className={selected?.id === order.id ? 'is-selected' : ''} key={order.id} onClick={() => setSelectedId(order.id)}>
                    <img src={item.image || '/assets/index/bee_nobg.png'} alt="" />
                    <span>
                      <small>ORDER #{order.id.slice(-8).toUpperCase()}</small>
                      <strong>{item.title || 'Marketplace purchase'}{order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}</strong>
                      <em>{order.handoffType === 'pickup' ? 'Campus pickup' : 'Delivery'} · {money(order.totalAmount, order.currency)}</em>
                    </span>
                    <i className={`is-${order.fulfillmentStatus}`}>{label(order.fulfillmentStatus)}</i>
                  </button>
                )
              })}
            </div>
          </aside>

          {selected ? (
            <article className="marketplace-buyer-order-detail">
              <header>
                <div>
                  <small>ORDER #{selected.id.slice(-8).toUpperCase()}</small>
                  <h3>{label(selected.fulfillmentStatus)}</h3>
                  <p>{selectedUsesErrander && selected.fulfillmentStatus === 'ready' ? 'Your order is ready and waiting for the assigned errander to collect it.' : STATUS_COPY[selected.fulfillmentStatus] || 'Your order is moving through fulfilment.'}</p>
                </div>
                <div className="marketplace-buyer-order-total"><span>Order total</span><strong>{money(selected.totalAmount, selected.currency)}</strong></div>
              </header>

              {!['cannot_fulfil', 'cancelled'].includes(selected.fulfillmentStatus) ? (
                <div className="marketplace-buyer-order-progress" aria-label={`Order status: ${label(selected.fulfillmentStatus)}`}>
                  {FLOW.map((step, index) => (
                    <span className={currentStep > index ? 'is-done' : currentStep === index ? 'is-current' : ''} key={step}>
                      <i>{currentStep > index ? <FiCheck /> : index + 1}</i>
                      <small>{label(step)}</small>
                    </span>
                  ))}
                </div>
              ) : null}

              <section>
                <h4>Items in this order</h4>
                {(selected.items || []).map((item) => <div className="marketplace-buyer-order-item" key={item.listingId}><img src={item.image || '/assets/index/bee_nobg.png'} alt="" /><span><strong>{item.title}</strong><small>Quantity {item.quantity || 1}</small></span><b>{money(Number(item.unitAmount) * Number(item.quantity || 1), item.currency)}</b></div>)}
              </section>
              <section className="marketplace-buyer-order-handoff">
                <h4>{selected.handoffType === 'pickup' ? 'Campus pickup' : 'Delivery details'}</h4>
                <div>{selected.handoffType === 'pickup' ? <FiMapPin /> : <FiTruck />}<span><strong>{selected.handoffSpot || 'Coordinate with the seller'}</strong><p>{messagesErrander ? 'Your errander has the order. Message them directly if you need help with the handoff.' : selected.fulfillmentStatus === 'ready' ? 'Ready for collection — message the seller before you leave.' : 'We’ll keep this page updated as the seller progresses your order.'}</p></span></div>
              </section>
              <footer>
                <button className="is-message" type="button" onClick={() => onMessageOrderContact(selected)}><FiMessageCircle /> {messagesErrander ? 'Message errander' : 'Message seller'}</button>
                {['seller_confirmation', 'confirmed'].includes(selected.fulfillmentStatus) ? <button className="is-cancel" type="button" disabled={updatingOrderId === selected.id} onClick={() => onCancel(selected)}>Cancel order</button> : null}
                {selected.fulfillmentStatus === 'in_transit' && selectedUsesErrander ? <button className="is-confirm" type="button" onClick={() => showDeliveryCode(selected)}><FiKey /> Show delivery code</button> : null}
                {selected.fulfillmentStatus === 'delivered' && !selectedUsesErrander ? <button className="is-confirm" type="button" disabled={updatingOrderId === selected.id} onClick={() => onConfirmReceived(selected)}><FiCheck /> {updatingOrderId === selected.id ? 'Confirming…' : 'Confirm order received'}</button> : null}
                <span><FiClock /> Placed {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : 'recently'}</span>
              </footer>
            </article>
          ) : null}
        </div>
      ) : null}
      {codeDialog ? <div className="marketplace-delivery-code-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCodeDialog(null) }}>
        <section aria-labelledby="delivery-code-title" aria-modal="true" className="marketplace-delivery-code-dialog" role="dialog">
          <button aria-label="Close delivery code" className="marketplace-delivery-code-close" onClick={() => setCodeDialog(null)} type="button"><FiX /></button>
          <span className="marketplace-delivery-code-icon"><FiKey /></span>
          <small>ORDER #{codeDialog.order.id.slice(-8).toUpperCase()}</small>
          <h3 id="delivery-code-title">Your delivery code</h3>
          <p>Check your items first. Only give this code to the errander when the order is in your hands.</p>
          {codeDialog.loading ? <div className="marketplace-delivery-code-value is-loading">Loading…</div> : codeDialog.error ? <p className="marketplace-delivery-code-error">{codeDialog.error}</p> : <>
            <strong className="marketplace-delivery-code-value">{codeDialog.code}</strong>
            <button className="marketplace-delivery-code-copy" onClick={() => navigator.clipboard?.writeText(codeDialog.code)} type="button"><FiCopy /> Copy code</button>
          </>}
          <footer><FiShield /><span>This code completes delivery and releases payment. Don’t share it before receiving the order.</span></footer>
        </section>
      </div> : null}
    </section>
  )
}

export default MarketplaceBuyerOrders
