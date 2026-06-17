import { FiClock, FiHeart, FiMapPin } from 'react-icons/fi'
import { RECENT_FILTERS } from '../../../data/marketplace'

function MarketplaceItemCard({
  item,
  onCardKeyDown,
  onOpenItemDetail,
  variant = 'featured',
}) {
  const isRecent = variant === 'recent'

  return (
    <article
      className={`opportunities-marketplace-card${isRecent ? ' is-recent' : ''} is-clickable`}
      role="link"
      tabIndex={0}
      onClick={() => onOpenItemDetail(item.id)}
      onKeyDown={(event) => onCardKeyDown(event, item.id)}
      aria-label={`Open ${item.title}`}
    >
      <div className="opportunities-marketplace-card-image-wrap">
        <img src={item.image} alt={item.title} loading="lazy" />
        {isRecent ? (
          <button type="button" aria-label={`Save ${item.title}`} onClick={(event) => event.stopPropagation()}>
            <FiHeart aria-hidden="true" />
          </button>
        ) : (
          <span>{item.badge}</span>
        )}
      </div>

      <div className="opportunities-marketplace-card-body">
        <h3>{item.title}</h3>
        <p className="opportunities-marketplace-card-category">{item.category}</p>
        <p className="opportunities-marketplace-card-price">{item.price}</p>
        <footer>
          <p>
            <FiMapPin aria-hidden="true" />
            {item.location}
          </p>
          {isRecent ? (
            <span>
              <FiClock aria-hidden="true" />
              {item.posted}
            </span>
          ) : (
            <button type="button" aria-label={`Save ${item.title}`} onClick={(event) => event.stopPropagation()}>
              <FiHeart aria-hidden="true" />
            </button>
          )}
        </footer>
      </div>
    </article>
  )
}

function MarketplaceItemSections({
  activeCategory,
  filteredFeaturedItems,
  filteredRecentItems,
  onCardKeyDown,
  onOpenItemDetail,
}) {
  return (
    <>
      <section className="opportunities-marketplace-block" aria-label="Featured items">
        <div className="opportunities-section-head">
          <div>
            <h2>Featured Items</h2>
          </div>
          <button type="button" className="campus-link-btn">View all</button>
        </div>

        <div className="opportunities-marketplace-featured-grid">
          {filteredFeaturedItems.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              item={item}
              onCardKeyDown={onCardKeyDown}
              onOpenItemDetail={onOpenItemDetail}
            />
          ))}

          {filteredFeaturedItems.length === 0 ? (
            <article className="opportunities-marketplace-empty-state" aria-live="polite">
              <p>No featured items in {activeCategory} right now.</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="opportunities-marketplace-block" aria-label="Recently added items">
        <div className="opportunities-section-head">
          <div>
            <h2>Recently Added</h2>
          </div>
          <button type="button" className="campus-link-btn">View all</button>
        </div>

        <div className="opportunities-marketplace-filters" role="tablist" aria-label="Recently added filters">
          {RECENT_FILTERS.map((filter, index) => (
            <button key={filter} type="button" className={index === 0 ? 'is-active' : ''}>
              {filter}
            </button>
          ))}
        </div>

        <div className="opportunities-marketplace-recent-grid">
          {filteredRecentItems.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              item={item}
              onCardKeyDown={onCardKeyDown}
              onOpenItemDetail={onOpenItemDetail}
              variant="recent"
            />
          ))}

          {filteredRecentItems.length === 0 ? (
            <article className="opportunities-marketplace-empty-state" aria-live="polite">
              <p>No recently added items in {activeCategory} yet.</p>
            </article>
          ) : null}
        </div>
      </section>
    </>
  )
}

export default MarketplaceItemSections
