import { useMemo, useState } from 'react'
import {
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiShoppingBag,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function OpportunitiesServiceOrdersPanel({
  actionRequiredServiceOrdersCount,
  completedServiceOrdersCount,
  confirmedServiceOrdersCount,
  error = '',
  isLoading = false,
  onCreateBooking = () => {},
  onOpenMessages = () => {},
  onRefresh = () => {},
  onViewBooking,
  orders = [],
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const canCreateBooking = hasAccess(ACCESS_KEYS.opportunities.createServiceBooking)
  const canMessageProvider = hasAccess(ACCESS_KEYS.campus.messages)
  const filters = [
    { id: 'all', label: 'All orders', count: orders.length },
    { id: 'active', label: 'In fulfilment', count: confirmedServiceOrdersCount },
    { id: 'attention', label: 'Needs attention', count: actionRequiredServiceOrdersCount },
    { id: 'completed', label: 'Completed', count: completedServiceOrdersCount },
  ]
  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (activeFilter === 'active') return ['is-confirmed', 'is-scheduled'].includes(order.statusTone)
    if (activeFilter === 'attention') return order.statusTone === 'is-awaiting'
    if (activeFilter === 'completed') return order.statusTone === 'is-completed'
    return true
  }), [activeFilter, orders])
  return (
    <section className="opportunities-list-section opportunities-ongoing-section opportunities-orders-section" aria-label="Service orders">
      <div className="opportunities-work-directory opportunities-orders-directory">
        <div><span>Service activity</span><h3>Your service orders</h3><p>Track bookings from provider confirmation to collection or delivery.</p></div>
        <div className="opportunities-orders-directory-controls">
          <div className="opportunities-orders-directory-actions">
            {canCreateBooking ? <button type="button" onClick={onCreateBooking}><FiPlus aria-hidden="true" /> Find a service</button> : null}
            <button type="button" className="is-quiet" onClick={onRefresh}><FiRefreshCw aria-hidden="true" /> Refresh</button>
          </div>
          <nav aria-label="Filter service orders">
            {filters.map((filter) => (
              <button type="button" className={activeFilter === filter.id ? 'is-active' : ''} aria-pressed={activeFilter === filter.id} key={filter.id} onClick={() => setActiveFilter(filter.id)}>
                {filter.label}<span>{filter.count}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error ? (
        <div className="opportunities-orders-state is-error" role="alert">
          <FiPackage aria-hidden="true" /><div><h3>Service orders are unavailable</h3><p>{error}</p></div><button type="button" onClick={onRefresh}>Try again</button>
        </div>
      ) : null}
      {isLoading ? (
        <div className="opportunities-orders-state"><FiRefreshCw className="is-spinning" aria-hidden="true" /><div><h3>Loading your service desk…</h3><p>Checking the latest provider and fulfilment updates.</p></div></div>
      ) : null}
      {!isLoading && !error && orders.length === 0 ? (
        <div className="opportunities-orders-state">
          <FiShoppingBag aria-hidden="true" /><div><h3>Your first booking starts in Marketplace</h3><p>Book meals, appointments, tutoring and other trusted campus services, then track them here.</p></div>
          {canCreateBooking ? <button type="button" onClick={onCreateBooking}>Explore services <FiArrowUpRight aria-hidden="true" /></button> : null}
        </div>
      ) : null}
      {!isLoading && !error && orders.length > 0 && visibleOrders.length === 0 ? (
        <div className="opportunities-orders-state"><FiCheckCircle aria-hidden="true" /><div><h3>Nothing in this view</h3><p>Choose another filter to see your remaining service activity.</p></div></div>
      ) : null}

      {!isLoading && !error && visibleOrders.length ? (
        <div className="opportunities-orders-list">
          {visibleOrders.map((order) => (
            <article key={order.id} className={`opportunities-orders-card ${order.statusTone}`}>
              <div className="opportunities-orders-media">
                <img src={order.image} alt="" loading="lazy" />
                <span>{order.category}</span>
              </div>
              <div className="opportunities-orders-card-body">
                <header>
                  <div><small>ORDER #{order.id.slice(-8).toUpperCase()}</small><h3>{order.service}</h3><p>{order.provider}</p></div>
                  <span className={`opportunities-orders-status ${order.statusTone}`}><i aria-hidden="true" />{order.status}</span>
                </header>
                <div className="opportunities-orders-meta">
                  <p><FiCalendar aria-hidden="true" /><span><small>Timing</small><strong>{order.schedule}</strong></span></p>
                  <p><FiMapPin aria-hidden="true" /><span><small>Handoff</small><strong>{order.location}</strong></span></p>
                  <p><FiPackage aria-hidden="true" /><span><small>Method</small><strong>{order.contact}</strong></span></p>
                </div>
                <div className="opportunities-orders-progress">
                  <div><span>Order journey</span><strong>{order.progress}%</strong></div>
                  <div role="progressbar" aria-label={`${order.service} fulfilment progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={order.progress}><span style={{ width: `${order.progress}%` }} /></div>
                </div>
                <div className="opportunities-orders-note"><FiCheckCircle aria-hidden="true" /><p>{order.note}</p></div>
                <footer>
                  <div><strong>{order.amount}</strong><small>Placed {order.placedAt}</small></div>
                  <div>
                    {canMessageProvider ? <button type="button" className="is-message" onClick={onOpenMessages}><FiMessageCircle aria-hidden="true" /> Message</button> : null}
                    <button type="button" className="is-open" onClick={() => onViewBooking(order)}>View order <FiArrowUpRight aria-hidden="true" /></button>
                  </div>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default OpportunitiesServiceOrdersPanel
