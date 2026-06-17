import { FiHeart } from 'react-icons/fi'

function MarketplaceProductRelated({
  onCardKeyDown,
  onOpenItemDetail,
  relatedItems,
}) {
  return (
    <section className="opportunities-marketplace-product-related" aria-label="Related items">
      <div className="opportunities-section-head">
        <h3>Related Items</h3>
      </div>

      <div className="opportunities-marketplace-product-related-grid">
        {relatedItems.map((related) => (
          <article
            key={related.id}
            className="opportunities-marketplace-product-mini-card"
            role="link"
            tabIndex={0}
            onClick={() => onOpenItemDetail(related.id)}
            onKeyDown={(event) => onCardKeyDown(event, related.id)}
            aria-label={`Open ${related.title}`}
          >
            <img src={related.image} alt={related.title} loading="lazy" />
            <h4>{related.title}</h4>
            <p>{related.category}</p>
            <strong>{related.price}</strong>
            <button type="button" aria-label={`Save ${related.title}`}>
              <FiHeart aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MarketplaceProductRelated
