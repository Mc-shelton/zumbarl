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
import { Link } from 'react-router-dom'
import { getMarketplaceItemPath } from '../../../data/marketplace'
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
  const rating = Number(selectedShopProductDetail?.rating || 0)
  const reviewCount = Number(selectedShopProductDetail?.reviews || 0)
  const soldCount = Number(selectedShopProductDetail?.sold || 0)
  const productId = selectedShopProduct.id || selectedShopProduct.uid

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

      {rating || reviewCount || soldCount ? (
        <p className="campus-shop-detail-rating">
          <FiStar aria-hidden="true" />
          {rating ? `${rating.toFixed(1)} · ` : ''}{reviewCount} reviews · {soldCount} sold
        </p>
      ) : null}

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
      ) : canBuy ? (
        <div className="campus-shop-detail-actions">
          <Link className="campus-shop-detail-action-btn is-primary" to={getMarketplaceItemPath(productId)}>
            <FiShoppingBag aria-hidden="true" />
            View listing
          </Link>
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
          <p>{selectedShopProductDetail?.summary || 'No additional product details have been provided.'}</p>
          <ul>
            {(selectedShopProductDetail?.details || []).map((item) => (
              <li key={`${selectedShopProduct.uid}-${item}`}>{item}</li>
            ))}
          </ul>

          {selectedShopProductDetail?.colors?.length ? (
            <>
              <h4>Available Colors</h4>
              <div className="campus-shop-detail-color-row">
                {selectedShopProductDetail.colors.map((color) => (
                  <span key={`${selectedShopProduct.uid}-${color}`} style={{ background: color }} />
                ))}
              </div>
            </>
          ) : null}
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
          {!selectedShopProductDetail?.postsFeed?.length ? <p>No product posts have been published.</p> : null}
        </section>
      )}

      {selectedShopProduct.location || selectedShopProduct.returnPolicy ? (
        <footer className="campus-shop-detail-footer">
          {selectedShopProduct.location ? (
            <p><FiMapPin aria-hidden="true" />{selectedShopProduct.location}</p>
          ) : null}
          {selectedShopProduct.returnPolicy ? (
            <p><FiRefreshCw aria-hidden="true" />{selectedShopProduct.returnPolicy}</p>
          ) : null}
        </footer>
      ) : null}
    </article>
  )
}

export default ProfileShopDetailRail
