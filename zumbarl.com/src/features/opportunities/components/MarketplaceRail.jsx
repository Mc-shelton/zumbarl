import { FiCalendar, FiCheckCircle, FiCoffee, FiMessageCircle, FiShield, FiTrendingUp } from 'react-icons/fi'

const SERVICE_FLOWS = [
  { icon: FiCoffee, title: 'Eateries', detail: 'Choose food and a pickup time.', tone: 'food' },
  { icon: FiCalendar, title: 'Appointments', detail: 'Reserve an available service slot.', tone: 'appointment' },
  { icon: FiMessageCircle, title: 'Custom services', detail: 'Agree scope and price before paying.', tone: 'quote' },
]

function MarketplaceRail({
  activeCategory,
  filteredTrendingItems,
  onCardKeyDown,
  onOpenItemDetail,
}) {
  return (
    <aside className="campus-rail opportunities-rail opportunities-marketplace-rail" aria-label="Marketplace guidance and trends">
      <section className="campus-rail-card marketplace-service-guide-card">
        <header>
          <div>
            <span>Campus services</span>
            <h3>One place, the right flow</h3>
          </div>
          <FiCheckCircle aria-hidden="true" />
        </header>
        <p>Every provider shows exactly how the service will be fulfilled before you pay.</p>
        <div>
          {SERVICE_FLOWS.map(({ icon: Icon, title, detail, tone }) => (
            <article key={title} className={`is-${tone}`}>
              <i><Icon aria-hidden="true" /></i>
              <span><strong>{title}</strong><small>{detail}</small></span>
            </article>
          ))}
        </div>
        <footer><FiShield aria-hidden="true" /> Payment is protected until the order is accepted.</footer>
      </section>

      <section className="campus-rail-card opportunities-marketplace-trending-card">
        <header>
          <h3>Popular now</h3>
        </header>

        <div className="opportunities-marketplace-trending-list">
          {filteredTrendingItems.map((item) => (
            <article
              key={item.id}
              className="opportunities-marketplace-trending-item"
              role="link"
              tabIndex={0}
              onClick={() => onOpenItemDetail(item.id)}
              onKeyDown={(event) => onCardKeyDown(event, item.id)}
              aria-label={`Open ${item.title}`}
            >
              <img src={item.image} alt={item.title} loading="lazy" />

              <div>
                <h4>{item.title}</h4>
                <p>{item.price}</p>
              </div>

              <span>
                <FiTrendingUp aria-hidden="true" />
                {item.trend}
              </span>
            </article>
          ))}

          {filteredTrendingItems.length === 0 ? (
            <article className="opportunities-marketplace-empty-state is-compact" aria-live="polite">
              <p>No popular listings in {activeCategory} yet.</p>
            </article>
          ) : null}
        </div>

      </section>
    </aside>
  )
}

export default MarketplaceRail
