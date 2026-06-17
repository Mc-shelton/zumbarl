import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiRepeat,
  FiShoppingBag,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function ExploreProductRail({
  activeRailProduct,
  activeRailProductGallery,
  activeRailProductImage,
  activeRailProductTab,
  normalizedRailProductImageIndex,
  onClose,
  onSelectImage,
  onSetTab,
  onStepImage,
}) {
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy)
  const canUseCart = canBuy && hasAccess(ACCESS_KEYS.cart.view)

  return (
    <section className="campus-rail-card explore-campus-right-card explore-campus-product-detail-card">
      <header className="explore-campus-product-detail-topbar">
        <button type="button" className="explore-campus-product-more-btn" onClick={() => onSetTab('details')}>
          More details
        </button>
        <div>
          <button type="button" aria-label="Previous product image" onClick={() => onStepImage(-1)}>
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next product image" onClick={() => onStepImage(1)}>
            <FiChevronRight aria-hidden="true" />
          </button>
          <button type="button" aria-label="Close product details" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </div>
      </header>

      {activeRailProductImage ? (
        <section className="explore-campus-product-gallery">
          <div className="explore-campus-product-thumbs">
            {activeRailProductGallery.map((image, index) => (
              <button
                key={`${activeRailProduct.id}-thumb-${index}`}
                type="button"
                className={index === normalizedRailProductImageIndex ? 'is-active' : ''}
                aria-label={`Show product image ${index + 1}`}
                onClick={() => onSelectImage(index)}
              >
                <img src={image} alt={`${activeRailProduct.title} thumbnail ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
          <div className="explore-campus-product-hero">
            <img src={activeRailProductImage} alt={`${activeRailProduct.title} preview`} loading="lazy" />
            <em>{activeRailProduct.badge}</em>
            <span>{normalizedRailProductImageIndex + 1}/{activeRailProductGallery.length}</span>
          </div>
        </section>
      ) : null}

      <div className="explore-campus-product-title-row">
        <div>
          <h3>{activeRailProduct.title}</h3>
          <p>by {activeRailProduct.seller}</p>
        </div>
        <strong>{activeRailProduct.price}</strong>
      </div>

      <p className="explore-campus-product-rating">
        <FiStar aria-hidden="true" />
        {activeRailProduct.rating} ({activeRailProduct.reviews} reviews) · {activeRailProduct.sold} sold
      </p>

      <p className="explore-campus-product-description">{activeRailProduct.description}</p>

      <div className="explore-campus-product-chip-grid">
        {activeRailProduct.featureChips.map((chip) => (
          <article key={`${activeRailProduct.id}-${chip.label}`}>
            <p>{chip.label}</p>
            <strong>{chip.value}</strong>
          </article>
        ))}
      </div>

      {canUseCart || canBuy ? (
        <div className="explore-campus-product-actions">
          {canUseCart ? (
            <button type="button" className="explore-campus-product-action-btn is-primary">
              <FiShoppingBag aria-hidden="true" />
              Add to Cart
            </button>
          ) : null}
          {canBuy ? (
            <button type="button" className="explore-campus-product-action-btn is-ghost">Buy Now</button>
          ) : null}
        </div>
      ) : null}

      <div className="explore-campus-product-switcher">
        <button type="button" className={activeRailProductTab === 'details' ? 'is-active' : ''} onClick={() => onSetTab('details')}>
          Details
        </button>
        <button type="button" className={activeRailProductTab === 'posts' ? 'is-active' : ''} onClick={() => onSetTab('posts')}>
          Posts ({activeRailProduct.posts.length})
        </button>
      </div>

      {activeRailProductTab === 'details' ? (
        <section className="explore-campus-product-copy">
          <h4>Product Details</h4>
          <p>{activeRailProduct.summary}</p>
          <ul>
            {activeRailProduct.details.map((detail) => (
              <li key={`${activeRailProduct.id}-${detail}`}>{detail}</li>
            ))}
          </ul>
          <h4>Available Colors</h4>
          <div className="explore-campus-product-color-row">
            {activeRailProduct.colors.map((color) => (
              <span key={`${activeRailProduct.id}-${color}`} style={{ background: color }} />
            ))}
          </div>
          <footer className="explore-campus-product-footer">
            <p>
              <FiMapPin aria-hidden="true" />
              Ships from Nairobi, Kenya
            </p>
            <p>
              <FiRepeat aria-hidden="true" />
              7-day easy returns
            </p>
          </footer>
        </section>
      ) : (
        <section className="explore-campus-product-posts">
          {activeRailProduct.posts.map((post) => (
            <article key={post.id}>
              <img src={post.image} alt={post.title} loading="lazy" />
              <div>
                <h4>{post.title}</h4>
                <p>{post.caption}</p>
                <span>{post.date}</span>
              </div>
              <footer>
                <p>
                  <FiHeart aria-hidden="true" />
                  {post.likes}
                </p>
                <p>
                  <FiMessageCircle aria-hidden="true" />
                  {post.comments}
                </p>
              </footer>
            </article>
          ))}
        </section>
      )}
    </section>
  )
}

export default ExploreProductRail
