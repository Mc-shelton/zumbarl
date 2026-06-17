import { FiChevronDown, FiTrendingUp } from 'react-icons/fi'

function MarketplaceRail({
  activeCategory,
  filteredTrendingItems,
  onCardKeyDown,
  onOpenItemDetail,
}) {
  return (
    <aside className="campus-rail opportunities-rail opportunities-marketplace-rail" aria-label="Marketplace filters and trends">
      <section className="campus-rail-card opportunities-marketplace-filter-card">
        <header>
          <h3>Filter Items</h3>
          <button type="button" className="campus-link-btn">Clear all</button>
        </header>

        <div className="opportunities-marketplace-filter-group">
          <h4>Category</h4>
          <button type="button" className="opportunities-select">
            All Categories
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>

        <div className="opportunities-marketplace-filter-group">
          <h4>Condition</h4>
          <button type="button" className="opportunities-select">
            All Conditions
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>

        <div className="opportunities-marketplace-filter-group">
          <h4>Price Range</h4>
          <div className="opportunities-budget-row">
            <input type="text" placeholder="Min" />
            <input type="text" placeholder="Max" />
          </div>
        </div>

        <div className="opportunities-marketplace-filter-group">
          <h4>Location</h4>
          <button type="button" className="opportunities-select">
            All Locations
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="opportunities-search-btn opportunities-marketplace-apply-btn">
          Apply Filters
        </button>
      </section>

      <section className="campus-rail-card opportunities-marketplace-trending-card">
        <header>
          <h3>Trending on Campus</h3>
          <button type="button" className="campus-link-btn">View all</button>
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
              <p>No trending items in {activeCategory} right now.</p>
            </article>
          ) : null}
        </div>

        <button type="button" className="opportunities-marketplace-trending-cta">
          See more trending
        </button>
      </section>
    </aside>
  )
}

export default MarketplaceRail
