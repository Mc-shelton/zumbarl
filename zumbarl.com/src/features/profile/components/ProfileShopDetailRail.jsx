import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiRefreshCw,
  FiSend,
  FiShoppingBag,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function ProfileShopDetailRail({
  activeShopDetailImage,
  activeShopDetailTab,
  normalizedShopDetailImageIndex,
  isOwner = false,
  onClose,
  onDetailImageChange,
  onDetailTabChange,
  onNextImage,
  onPreviousImage,
  onEditListing,
  selectedShopProduct,
  selectedShopProductDetail,
}) {
  const gallery = selectedShopProductDetail?.gallery || []
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy) && !isOwner
  const canUseCart = canBuy && hasAccess(ACCESS_KEYS.cart.view)

  return (
    <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card campus-shop-detail-card">
      <header className="campus-shop-detail-topbar">
        <div>
          <button
            type="button"
            className="campus-shop-detail-more-btn"
            onClick={() => onDetailTabChange('details')}
          >
            More details
          </button>
          <button type="button" aria-label="Previous product image" onClick={onPreviousImage}>
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next product image" onClick={onNextImage}>
            <FiChevronRight aria-hidden="true" />
          </button>
          <button
            type="button"
            className="campus-portfolio-detail-close"
            aria-label="Close product details"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="campus-shop-detail-gallery">
        <div className="campus-shop-detail-thumb-strip">
          {gallery.map((image, index) => (
            <button
              key={`${selectedShopProduct.uid}-thumb-${index}`}
              type="button"
              className={normalizedShopDetailImageIndex === index ? 'is-active' : ''}
              aria-label={`Preview image ${index + 1}`}
              onClick={() => onDetailImageChange(index)}
            >
              <img src={image} alt={`${selectedShopProduct.title} thumbnail ${index + 1}`} loading="lazy" />
            </button>
          ))}
        </div>

        <div className="campus-shop-detail-hero">
          <img src={activeShopDetailImage} alt={`${selectedShopProduct.title} preview`} loading="lazy" />
          <em className={`campus-shop-detail-badge ${selectedShopProduct.badgeTone}`}>{selectedShopProduct.badge}</em>
          <span>{normalizedShopDetailImageIndex + 1}/{gallery.length || 1}</span>
        </div>
      </section>

      <div className="campus-shop-detail-title-row">
        <h3>{selectedShopProduct.title}</h3>
        <strong>{selectedShopProduct.price}</strong>
      </div>

      <p className="campus-shop-detail-rating">
        <FiStar aria-hidden="true" />
        {selectedShopProductDetail?.rating || '4.8'} ({selectedShopProductDetail?.reviews || 0} reviews) · {selectedShopProductDetail?.sold || 0} sold
      </p>

      <p className="campus-shop-detail-description">{selectedShopProduct.description}</p>

      <div className="campus-shop-detail-chip-grid">
        {(selectedShopProductDetail?.featureChips || []).map((item) => (
          <article key={`${selectedShopProduct.uid}-${item.label}`}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      {isOwner ? (
        <div className="campus-shop-detail-actions">
          <button type="button" className="campus-shop-detail-action-btn is-primary" onClick={() => onEditListing(selectedShopProduct)}>
            <FiEdit3 aria-hidden="true" />
            Edit listing
          </button>
        </div>
      ) : canUseCart || canBuy ? (
        <div className="campus-shop-detail-actions">
          {canUseCart ? (
            <button type="button" className="campus-shop-detail-action-btn is-primary">
              <FiShoppingBag aria-hidden="true" />
              Add to Cart
            </button>
          ) : null}
          {canBuy ? (
            <button type="button" className="campus-shop-detail-action-btn is-ghost">Buy Now</button>
          ) : null}
        </div>
      ) : null}

      <div className="campus-shop-detail-switcher">
        <button
          type="button"
          className={activeShopDetailTab === 'details' ? 'is-active' : ''}
          onClick={() => onDetailTabChange('details')}
        >
          Details
        </button>
        <button
          type="button"
          className={activeShopDetailTab === 'posts' ? 'is-active' : ''}
          onClick={() => onDetailTabChange('posts')}
        >
          Posts ({selectedShopProductDetail?.posts || 0})
        </button>
      </div>

      {activeShopDetailTab === 'details' ? (
        <section className="campus-shop-detail-copy">
          <h4>Product Details</h4>
          <p>{selectedShopProductDetail?.summary}</p>
          <ul>
            {(selectedShopProductDetail?.details || []).map((item) => (
              <li key={`${selectedShopProduct.uid}-${item}`}>{item}</li>
            ))}
          </ul>

          <h4>Available Colors</h4>
          <div className="campus-shop-detail-color-row">
            {(selectedShopProductDetail?.colors || []).map((color) => (
              <span key={`${selectedShopProduct.uid}-${color}`} style={{ background: color }} />
            ))}
          </div>
        </section>
      ) : (
        <section className="campus-shop-detail-posts">
          {(selectedShopProductDetail?.postsFeed || []).map((post) => (
            <article key={post.id}>
              <img src={post.image} alt={`${post.title} preview`} loading="lazy" />
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
                <p>
                  <FiSend aria-hidden="true" />
                  {post.shares}
                </p>
              </footer>
            </article>
          ))}
        </section>
      )}

      <footer className="campus-shop-detail-footer">
        <p>
          <FiMapPin aria-hidden="true" />
          Ships from Nairobi, Kenya
        </p>
        <p>
          <FiRefreshCw aria-hidden="true" />
          7-day easy returns
        </p>
      </footer>
    </article>
  )
}

export default ProfileShopDetailRail
