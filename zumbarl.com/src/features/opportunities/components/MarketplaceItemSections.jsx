import { FiClock, FiHeart, FiMapPin } from 'react-icons/fi'
import { TabNav } from '../../../components/ui'
import { RECENT_FILTERS } from '../../../data/marketplace'

function MarketplaceItemCard({
  item,
  onCardKeyDown,
  onOpenItemDetail,
  onToggleSavedItem,
  savedItemIds = [],
  variant = 'featured',
}) {
  const isRecent = variant === 'recent'
  const isService = String(item.kind || item.listingType || '').toLowerCase() === 'service'
  const modeLabel = item.serviceMode === 'order_ahead'
    ? 'Order ahead'
    : item.serviceMode === 'request_quote'
      ? 'Request a quote'
      : 'Book a time'

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
          <button type="button" className={savedItemIds.includes(item.id) ? 'is-saved' : ''} aria-label={`${savedItemIds.includes(item.id) ? 'Remove' : 'Save'} ${item.title}`} aria-pressed={savedItemIds.includes(item.id)} onClick={(event) => { event.stopPropagation(); onToggleSavedItem(item.id) }}>
            <FiHeart aria-hidden="true" />
          </button>
        ) : (
          <span>{item.badge}</span>
        )}
      </div>

      <div className="opportunities-marketplace-card-body">
        {isService ? <span className={`marketplace-service-mode is-${item.serviceMode || 'appointment'}`}>{modeLabel}</span> : null}
        <h3>{item.title}</h3>
        <p className="opportunities-marketplace-card-category">
          {item.category}{isService && item.duration ? ` · ${item.duration}` : ''}
        </p>
        <p className="opportunities-marketplace-card-price">{item.price}</p>
        <footer>
          <p>
            <FiMapPin aria-hidden="true" />
            {isService && item.availabilityText ? item.availabilityText : item.location}
          </p>
          {isRecent ? (
            <span>
              <FiClock aria-hidden="true" />
              {item.posted}
            </span>
          ) : (
            <button type="button" className={savedItemIds.includes(item.id) ? 'is-saved' : ''} aria-label={`${savedItemIds.includes(item.id) ? 'Remove' : 'Save'} ${item.title}`} aria-pressed={savedItemIds.includes(item.id)} onClick={(event) => { event.stopPropagation(); onToggleSavedItem(item.id) }}>
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
  activeRecentFilter = 'All',
  filteredFeaturedItems,
  filteredRecentItems,
  onCardKeyDown,
  onCategoryChange = () => {},
  onOpenItemDetail,
  onRecentFilterChange = () => {},
  onToggleSavedItem,
  savedItemIds = [],
}) {
  return (
    <>
      <section className="opportunities-marketplace-block" aria-label="Featured marketplace listings">
        <div className="opportunities-section-head">
          <div>
            <h2>{activeCategory === 'Everything' ? 'Featured on campus' : activeCategory}</h2>
            <p>{activeCategory === 'Products' ? 'Items ready to buy' : activeCategory === 'Everything' ? 'Products and services students are choosing now' : 'Providers available around your campus'}</p>
          </div>
          {activeCategory !== 'Everything' ? (
            <button type="button" className="campus-link-btn" onClick={() => onCategoryChange('Everything')}>View all</button>
          ) : null}
        </div>

        <div className="opportunities-marketplace-featured-grid">
          {filteredFeaturedItems.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              item={item}
              onCardKeyDown={onCardKeyDown}
              onOpenItemDetail={onOpenItemDetail}
              onToggleSavedItem={onToggleSavedItem}
              savedItemIds={savedItemIds}
            />
          ))}

          {filteredFeaturedItems.length === 0 ? (
            <article className="opportunities-marketplace-empty-state" aria-live="polite">
              <strong>Nothing listed here yet</strong>
              <p>Be the first provider to offer {activeCategory.toLowerCase()} on your campus.</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="opportunities-marketplace-block" aria-label="Recently added items">
        <div className="opportunities-section-head">
          <div>
            <h2>Recently added</h2>
            <p>New products and services from verified campus accounts</p>
          </div>
          {activeCategory !== 'Everything' || activeRecentFilter !== 'All' ? (
            <button
              type="button"
              className="campus-link-btn"
              onClick={() => {
                onCategoryChange('Everything')
                onRecentFilterChange('All')
              }}
            >
              View all
            </button>
          ) : null}
        </div>

        <TabNav
          activeId={activeRecentFilter}
          ariaLabel="Recently added filters"
          className="opportunities-marketplace-filters"
          items={RECENT_FILTERS.map((filter) => ({ id: filter, label: filter }))}
          onChange={onRecentFilterChange}
        />

        <div className="opportunities-marketplace-recent-grid">
          {filteredRecentItems.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              item={item}
              onCardKeyDown={onCardKeyDown}
              onOpenItemDetail={onOpenItemDetail}
              onToggleSavedItem={onToggleSavedItem}
              savedItemIds={savedItemIds}
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
