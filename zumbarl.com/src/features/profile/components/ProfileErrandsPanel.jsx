import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowUpRight, FiCheck, FiClock, FiKey, FiMapPin, FiMessageCircle, FiPackage, FiRadio, FiTruck, FiX } from 'react-icons/fi'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { progressErrand, readMyErrands, respondToErrand, updateErranderAvailability } from '../../opportunities/services/marketplaceInteractionService'
import { subscribeToRealtimeEvents } from '../../communications/services/realtimeService'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { buildOrderConversationHref, buyerOrderHref, erranderOrderHref } from '../../opportunities/orderMessaging'

const FALLBACK_AVATAR = '/assets/knowledge/default-group-avatar.svg'

function formatTime(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ErrandRow({ errand, highlighted = false, mode, onAction, onMessageBuyer, pending }) {
  const itemCount = Number(errand.itemCount || errand.items?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 0)
  const status = String(errand.status || '').toLowerCase().replaceAll('_', ' ')
  const readyForCollection = ['ready', 'in_transit'].includes(String(errand.order?.fulfillmentStatus || ''))
  const orderIdentifier = errand.orderId ? `#${errand.orderId.slice(-8).toUpperCase()}` : '#PENDING'
  const buyerName = errand.buyerName || errand.order?.buyerName || 'Campus buyer'
  return <li className={`profile-errand-row is-${mode}${highlighted ? ' is-highlighted' : ''}`}>
    <span className="profile-errand-shop"><FiPackage /><span><strong>{errand.shop?.name || 'Campus page'}</strong><small className="profile-errand-identity">Order {orderIdentifier} · {buyerName}</small><small>{itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatTime(errand.createdAt)}</small></span></span>
    <div className="profile-errand-route">
      <span><i /><span><small>Collect</small><strong>{errand.pickupLabel}</strong></span></span>
      <span><i /><span><small>Deliver</small><strong>{errand.dropoffLabel}</strong></span></span>
    </div>
    <div className="profile-errand-meta">
      <em>{mode === 'available' ? 'Live now' : status}</em>
      <span><strong>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: errand.currency || 'KES', maximumFractionDigits: 0 }).format(Number(errand.feeAmount || 0))}</strong><small>errand fee</small></span>
    </div>
    <div className="profile-errand-action">
      {mode === 'assigned' && errand.order?.buyerUserId ? <button className="is-message" onClick={() => onMessageBuyer(errand)} type="button"><FiMessageCircle /> Message buyer</button> : null}
      {mode === 'available' ? <button disabled={pending} onClick={() => onAction(errand, 'ACCEPTED')} type="button"><FiCheck /> {pending ? 'Claiming…' : 'Accept errand'}</button> : null}
      {mode === 'assigned' && errand.status === 'ASSIGNED' ? <button aria-label={readyForCollection ? `Mark ${errand.shop?.name || 'errand'} item as picked up` : `Waiting for ${errand.shop?.name || 'the vendor'} to prepare the order`} disabled={pending || !readyForCollection} onClick={() => onAction(errand, 'PICKED_UP')} type="button"><FiPackage /> {pending ? 'Updating…' : readyForCollection ? 'Picked item' : 'Waiting for vendor'}</button> : null}
      {mode === 'assigned' && errand.status === 'PICKED_UP' ? <button aria-label={`Mark ${errand.shop?.name || 'errand'} as delivered`} disabled={pending} onClick={() => onAction(errand, 'DELIVERED')} type="button"><FiCheck /> {pending ? 'Updating…' : 'Delivered'}</button> : null}
    </div>
  </li>
}

function ErranderRegistrationRow({ onToggleAvailability, pendingAvailability, registration }) {
  return <li className={`profile-errands-page-row ${registration.status === 'ACTIVE' ? 'is-active-registration' : ''} ${registration.isAvailable ? 'is-available' : ''}`}>
    <div className="profile-errands-page-summary">
      <Link to={`/campus/vendors/${encodeURIComponent(registration.shop.slug)}`}>
        <img alt="" src={normalizeZumbarlFileUrl(registration.shop.logoUrl) || FALLBACK_AVATAR} />
        <span><small>Business page</small><strong>{registration.shop.name}</strong><span>{registration.shop.campus || registration.shop.locationLabel || 'Campus business'}</span></span>
        <FiArrowUpRight />
      </Link>
      <em className={`is-${String(registration.status).toLowerCase()}`}>{String(registration.status).toLowerCase()}</em>
    </div>
    {registration.status === 'ACTIVE' ? <>
      <div className="profile-errands-page-availability">
        <span><i /><span><small>Availability</small><strong>{registration.isAvailable ? 'Receiving errands' : 'Errands paused'}</strong><span>For this page only</span></span></span>
        <button aria-checked={Boolean(registration.isAvailable)} aria-label={`${registration.isAvailable ? 'Turn off' : 'Turn on'} errands for ${registration.shop.name}`} className={registration.isAvailable ? 'is-active' : ''} disabled={pendingAvailability} onClick={() => onToggleAvailability(registration)} role="switch" type="button"><span><i /></span><b>{pendingAvailability ? 'Saving…' : registration.isAvailable ? 'On' : 'Off'}</b></button>
      </div>
      <div className="profile-errands-page-pay"><small>Pay per delivery</small><strong>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(registration.shop.errandFee || 0))}</strong><span>Set by {registration.shop.name}</span></div>
    </> : null}
  </li>
}

function ProfileErrandsPanel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusedOrderId = searchParams.get('orderId') || ''
  const [data, setData] = useState({ enrollment: null, registrations: [], available: [], assigned: [] })
  const [status, setStatus] = useState('Loading errands…')
  const [feedback, setFeedback] = useState('')
  const [pending, setPending] = useState('')
  const [workTab, setWorkTab] = useState(() => focusedOrderId ? 'deliveries' : 'available')
  const [deliveryTarget, setDeliveryTarget] = useState(null)
  const [deliveryCode, setDeliveryCode] = useState('')
  const [deliveryError, setDeliveryError] = useState('')

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setStatus('Loading errands…')
    try {
      const response = await readMyErrands()
      setData({ enrollment: null, registrations: [], available: [], assigned: [], ...response })
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Errands could not be loaded.')
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(load, 0)
    const timer = window.setInterval(() => load({ quiet: true }), 120000)
    const controller = new AbortController()
    const onFocus = () => load({ quiet: true })
    window.addEventListener('focus', onFocus)
    subscribeToRealtimeEvents((event) => {
      if (event.type === 'connected') {
        load({ quiet: true })
      } else if (event.type === 'notification.created') {
        if (event.data?.kind === 'ERRAND_AVAILABLE') setWorkTab('available')
        load({ quiet: true })
      }
    }, controller.signal).catch(() => {})
    return () => { window.clearTimeout(initialLoad); window.clearInterval(timer); window.removeEventListener('focus', onFocus); controller.abort() }
  }, [load])

  const activeRegistrations = useMemo(() => data.registrations.filter((item) => item.status === 'ACTIVE'), [data.registrations])
  const availableRegistrations = useMemo(() => activeRegistrations.filter((item) => item.isAvailable), [activeRegistrations])
  const completedCount = Number(data.enrollment?.completedCount || 0)

  async function toggleAvailability(registration) {
    setPending(`availability:${registration.id}`)
    setFeedback('')
    try {
      const next = !registration.isAvailable
      await updateErranderAvailability(registration.id, next)
      setFeedback(next ? `You are now receiving errands from ${registration.shop.name}.` : `Errands from ${registration.shop.name} are paused.`)
      await load({ quiet: true })
    } catch (error) { setFeedback(error.message || 'Availability could not be changed.') }
    finally { setPending('') }
  }

  async function act(errand, action, confirmationCode) {
    if (action === 'DELIVERED' && !confirmationCode) {
      setDeliveryTarget(errand)
      setDeliveryCode('')
      setDeliveryError('')
      return false
    }
    setPending(errand.id)
    setFeedback('')
    try {
      if (action === 'ACCEPTED') {
        await respondToErrand(errand.id, action)
        setWorkTab('deliveries')
      } else await progressErrand(errand.id, action, confirmationCode)
      setFeedback(action === 'ACCEPTED' ? `You got the errand from ${errand.shop?.name}.` : action === 'PICKED_UP' ? 'Item marked as picked up. The buyer has been notified.' : 'Delivery confirmed. Payment has been released.')
      if (action === 'ACCEPTED') setWorkTab('deliveries')
      await load({ quiet: true })
      return true
    } catch (error) {
      setFeedback(error.message || 'That errand was already taken or could not be updated.')
      if (action === 'DELIVERED') setDeliveryError(error.message || 'The delivery code could not be confirmed.')
      await load({ quiet: true })
      return false
    } finally { setPending('') }
  }

  async function confirmDelivery(event) {
    event.preventDefault()
    if (!deliveryTarget || !/^\d{6}$/.test(deliveryCode)) {
      setDeliveryError('Enter the buyer’s 6-digit code.')
      return
    }
    setDeliveryError('')
    if (await act(deliveryTarget, 'DELIVERED', deliveryCode)) setDeliveryTarget(null)
  }

  function messageBuyer(errand) {
    navigate(buildOrderConversationHref({
      order: errand.order || { id: errand.orderId, items: errand.items, fulfillmentStatus: String(errand.status || '').toLowerCase() },
      participant: { userId: errand.order?.buyerUserId, name: errand.buyerName || errand.order?.buyerName || 'Buyer' },
      senderHref: erranderOrderHref(errand.orderId),
      recipientHref: buyerOrderHref(errand.orderId),
      messageIntent: 'errander_to_buyer',
    }))
  }

  function selectWorkTab(event, nextTab) {
    if (event.key && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setWorkTab(nextTab)
    event.currentTarget.parentElement.querySelector(`[data-tab="${nextTab}"]`)?.focus()
  }

  return <><section className="campus-profile-surface profile-errands-panel">
    <header className="profile-errands-head">
      <div className="profile-errands-head-copy"><span className="profile-errands-head-icon"><FiTruck /></span><div><span>Campus delivery</span><h2>Your errands hub</h2><p>Choose where you want to receive errands and manage every delivery.</p></div></div>
      <div className="profile-errands-stats" aria-label="Errand summary">
        <span><strong>{availableRegistrations.length}</strong><small>{availableRegistrations.length === 1 ? 'Page online' : 'Pages online'}</small></span>
        <span><strong>{data.available.length}</strong><small>Live offers</small></span>
        <span><strong>{completedCount}</strong><small>Completed</small></span>
      </div>
    </header>
    {status ? <p className="profile-errands-feedback" role="status">{status}</p> : null}
    {feedback ? <p className="profile-errands-feedback" role="status">{feedback}</p> : null}

    <section className="profile-errands-pages">
      <header><div><span className="profile-errands-section-icon"><FiRadio /></span><span><h3>Your errand pages</h3><p>Confirm availability and see what each page pays per delivery.</p></span></div><strong>{data.registrations.length}</strong></header>
      {data.registrations.length ? <div className="profile-errands-page-list"><div className="profile-errands-page-list-head" aria-hidden="true"><span>Business page</span><span>Availability</span><span>Pay per delivery</span></div><ul>{data.registrations.map((registration) => <ErranderRegistrationRow key={registration.id} onToggleAvailability={toggleAvailability} pendingAvailability={pending === `availability:${registration.id}`} registration={registration} />)}</ul></div> : <div className="profile-errands-empty"><FiTruck /><strong>You have not joined a business yet</strong><p>Open a hotel, shop, or student kitchen page and use its Errands tab to register.</p><Link to="/campus/explore">Explore business pages</Link></div>}
    </section>

    <section className="profile-errands-work">
      <div className="profile-errands-tabs" role="tablist" aria-label="Errand activity">
        <button aria-controls="profile-errands-available-panel" aria-selected={workTab === 'available'} className={workTab === 'available' ? 'is-active' : ''} data-tab="available" id="profile-errands-available-tab" onClick={() => setWorkTab('available')} onKeyDown={(event) => selectWorkTab(event, 'deliveries')} role="tab" tabIndex={workTab === 'available' ? 0 : -1} type="button"><FiClock /><span><strong>Available now</strong><small>Live offers ready to claim</small></span><b>{data.available.length}</b></button>
        <button aria-controls="profile-errands-deliveries-panel" aria-selected={workTab === 'deliveries'} className={workTab === 'deliveries' ? 'is-active' : ''} data-tab="deliveries" id="profile-errands-deliveries-tab" onClick={() => setWorkTab('deliveries')} onKeyDown={(event) => selectWorkTab(event, 'available')} role="tab" tabIndex={workTab === 'deliveries' ? 0 : -1} type="button"><FiTruck /><span><strong>Your deliveries</strong><small>Collection and delivery progress</small></span><b>{data.assigned.length}</b></button>
      </div>

      <div aria-labelledby="profile-errands-deliveries-tab" className="profile-errands-tab-panel" hidden={workTab !== 'deliveries'} id="profile-errands-deliveries-panel" role="tabpanel" tabIndex={0}>
        {data.assigned.length ? <ul className="profile-errands-list">{data.assigned.map((errand) => <ErrandRow errand={errand} highlighted={errand.orderId === focusedOrderId} key={errand.id} mode="assigned" onAction={act} onMessageBuyer={messageBuyer} pending={pending === errand.id} />)}</ul> : <div className="profile-errands-empty"><FiPackage /><strong>No active deliveries</strong><p>Errands you accept will move here.</p></div>}
      </div>
      <div aria-labelledby="profile-errands-available-tab" className="profile-errands-tab-panel" hidden={workTab !== 'available'} id="profile-errands-available-panel" role="tabpanel" tabIndex={0}>
        {data.available.length ? <ul className="profile-errands-list">{data.available.map((errand) => <ErrandRow errand={errand} key={errand.id} mode="available" onAction={act} onMessageBuyer={messageBuyer} pending={pending === errand.id} />)}</ul> : <div className="profile-errands-empty"><FiMapPin /><strong>{availableRegistrations.length ? 'You’re all caught up' : activeRegistrations.length ? 'Your pages are paused' : 'No errand pages yet'}</strong><p>{availableRegistrations.length ? 'New delivery offers will appear here automatically.' : activeRegistrations.length ? 'Turn on a page above when you want to receive its offers.' : 'Join a business page to start receiving delivery offers.'}</p></div>}
      </div>
    </section>
  </section>
  {deliveryTarget ? <div className="errand-delivery-code-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setDeliveryTarget(null) }}>
    <form aria-labelledby="errand-delivery-code-title" aria-modal="true" className="errand-delivery-code-dialog" onSubmit={confirmDelivery} role="dialog">
      <button aria-label="Close delivery confirmation" className="errand-delivery-code-close" disabled={Boolean(pending)} onClick={() => setDeliveryTarget(null)} type="button"><FiX /></button>
      <span className="errand-delivery-code-icon"><FiKey /></span>
      <small>{deliveryTarget.shop?.name} · ORDER #{deliveryTarget.orderId?.slice(-8).toUpperCase()}</small>
      <h3 id="errand-delivery-code-title">Confirm delivery</h3>
      <p>Ask the buyer to open their order and show you the delivery code after they have checked the items.</p>
      <label><span>6-digit delivery code</span><input autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={6} onChange={(event) => setDeliveryCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" value={deliveryCode} /></label>
      {deliveryError ? <p className="errand-delivery-code-error" role="alert">{deliveryError}</p> : null}
      <button className="errand-delivery-code-submit" disabled={Boolean(pending) || deliveryCode.length !== 6} type="submit"><FiCheck /> {pending ? 'Confirming…' : 'Confirm delivery'}</button>
      <footer>The order completes and payment is released only after the code is verified.</footer>
    </form>
  </div> : null}</>
}

export default ProfileErrandsPanel
