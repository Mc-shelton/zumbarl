import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiLayers,
  FiMapPin,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiTag,
} from 'react-icons/fi'

function getDetailRows(item) {
  const isService = String(item.kind || item.listingType || '').toLowerCase() === 'service'
  if (isService) {
    const fulfilment = item.serviceMode === 'order_ahead' ? 'Order ahead' : item.serviceMode === 'request_quote' ? 'Request a quote' : 'Appointment'
    return [
      { label: 'Service', value: item.categoryPath || item.category, Icon: FiTag },
      { label: 'How it works', value: fulfilment, Icon: FiCalendar },
      { label: 'Availability', value: item.availabilityText || 'Confirm with provider', Icon: FiClock },
      { label: 'Duration', value: item.duration || 'Varies by request', Icon: FiClock },
      { label: 'What is included', value: item.included || 'See service description', Icon: FiPackage },
      { label: 'Location', value: item.location, Icon: FiMapPin },
      { label: 'Listed on', value: item.postedOn || item.posted || 'Recently', Icon: FiClock },
    ]
  }
  const rows = [
    { label: 'Category', value: item.categoryPath || item.category, Icon: FiTag },
    { label: 'Condition', value: item.condition || 'Good', Icon: FiShield },
    { label: 'Brand', value: item.brand || 'N/A', Icon: FiShoppingBag },
    { label: 'Model', value: item.model || item.title, Icon: FiPackage },
    { label: 'Color', value: item.color || 'N/A', Icon: FiLayers },
    { label: 'Included', value: item.included || 'Item only', Icon: FiPackage },
    { label: 'Posted on', value: item.postedOn || item.posted || 'Recently', Icon: FiClock },
    { label: 'Location', value: item.location, Icon: FiMapPin },
  ]

  if (item.storage && item.storage !== 'N/A') {
    rows.splice(4, 0, { label: 'Storage', value: item.storage, Icon: FiPackage })
  }

  if (item.ram && item.ram !== 'N/A') {
    rows.splice(5, 0, { label: 'RAM', value: item.ram, Icon: FiLayers })
  }

  return rows
}

function MarketplaceProductDetails({
  activeImage,
  activeImageIndex,
  galleryImages,
  item,
  onImageSelect,
  onStepImage,
  overflowCount,
  showThumbOverflow,
  visibleThumbs,
}) {
  const detailRows = getDetailRows(item)

  return (
    <section className="opportunities-marketplace-product-grid" aria-label="Marketplace media and details">
      <article className="opportunities-marketplace-product-gallery-card">
        <div className="opportunities-marketplace-product-hero-wrap">
          <span>{activeImageIndex + 1}/{galleryImages.length}</span>
          <img src={activeImage} alt={item.title} loading="lazy" />

          <button
            type="button"
            className="opportunities-marketplace-product-image-nav is-prev"
            onClick={() => onStepImage(-1)}
            aria-label="Previous listing image"
          >
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="opportunities-marketplace-product-image-nav is-next"
            onClick={() => onStepImage(1)}
            aria-label="Next listing image"
          >
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="opportunities-marketplace-product-thumbs" role="tablist" aria-label="Listing images">
          {visibleThumbs.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={activeImageIndex === index ? 'is-active' : ''}
              onClick={() => onImageSelect(index)}
              aria-label={`Show image ${index + 1}`}
            >
              <img src={image} alt={`${item.title} preview ${index + 1}`} loading="lazy" />
            </button>
          ))}

          {showThumbOverflow ? (
            <button
              type="button"
              className="opportunities-marketplace-product-thumbs-more"
              onClick={() => onImageSelect(visibleThumbs.length)}
              aria-label={`Show ${overflowCount} more images`}
            >
              +{overflowCount}
              <small>more</small>
            </button>
          ) : null}
        </div>
      </article>

      <article className="opportunities-marketplace-product-detail-card">
        <h3>Details</h3>
        <dl>
          {detailRows.map(({ label, value, Icon }) => (
            <div key={label}>
              <dt>
                <Icon aria-hidden="true" />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section className="opportunities-marketplace-product-description">
          <h4>Description</h4>
          <p>{item.description}</p>
          <button type="button" className="campus-link-btn">See less</button>
        </section>
      </article>
    </section>
  )
}

export default MarketplaceProductDetails
