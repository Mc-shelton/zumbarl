import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function OpportunitiesServiceOrdersPanel({
  actionRequiredServiceOrdersCount,
  completedServiceOrdersCount,
  confirmedServiceOrdersCount,
  onCreateBooking = () => {},
  onOpenMessages = () => {},
  onViewBooking,
  orders = [],
}) {
  const canCreateBooking = hasAccess(ACCESS_KEYS.opportunities.createServiceBooking)
  const canMessageProvider = hasAccess(ACCESS_KEYS.campus.messages)

  return (
    <section className="opportunities-list-section opportunities-service-orders-section" aria-label="Service orders">
      <div className="opportunities-section-head opportunities-service-orders-head">
        <div>
          <h2>Service Orders</h2>
          <p>Bookings for services, deliveries and scheduled support requests.</p>
        </div>
        {canCreateBooking ? <button type="button" className="campus-link-btn" onClick={onCreateBooking}>Create booking</button> : null}
      </div>

      <div className="opportunities-service-orders-summary">
        <article>
          <p>Confirmed</p>
          <strong>{confirmedServiceOrdersCount}</strong>
          <span>Upcoming bookings</span>
        </article>
        <article>
          <p>Completed</p>
          <strong>{completedServiceOrdersCount}</strong>
          <span>Closed orders</span>
        </article>
        <article>
          <p>Action needed</p>
          <strong>{actionRequiredServiceOrdersCount}</strong>
          <span>Requires your input</span>
        </article>
      </div>

      <div className="opportunities-service-orders-list">
        {orders.length === 0 ? (
          <p className="opportunities-list-empty">
            No service orders yet. Bookings for services, deliveries and support requests will appear here.
          </p>
        ) : null}
        {orders.map((order) => (
          <article key={order.id} className="opportunities-service-order-card">
            <header className="opportunities-service-order-head">
              <div>
                <p className="opportunities-service-order-id">{order.id.toUpperCase()}</p>
                <h3>{order.service}</h3>
                <p className="opportunities-job-meta">{order.provider} · {order.category}</p>
              </div>
              <span className={`opportunities-service-order-chip ${order.statusTone}`}>{order.status}</span>
            </header>

            <div className="opportunities-service-order-meta">
              <p>
                <FiCalendar aria-hidden="true" />
                {order.schedule}
              </p>
              <p>
                <FiMapPin aria-hidden="true" />
                {order.location}
              </p>
              <p>
                <FiUsers aria-hidden="true" />
                {order.contact}
              </p>
            </div>

            <p className="opportunities-service-order-note">{order.note}</p>

            <footer className="opportunities-service-order-foot">
              <p className="opportunities-service-order-amount">{order.amount}</p>
              <div className="opportunities-service-order-actions">
                {canMessageProvider ? <button type="button" className="campus-link-btn" onClick={onOpenMessages}>Message</button> : null}
                <button
                  type="button"
                  className="opportunities-search-btn"
                  onClick={onViewBooking}
                >
                  View Booking
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}

export default OpportunitiesServiceOrdersPanel
