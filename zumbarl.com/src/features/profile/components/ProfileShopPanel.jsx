import {
  FiBookmark,
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiMessageCircle,
  FiMoreVertical,
  FiSend,
  FiShoppingBag,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { SHOP_COMPOSER_TOOLS, SHOP_TAB_FILTERS } from '../constants'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function ProfileShopPanel({
  activeShopFilter,
  filteredShopProducts,
  onProductSelect,
  onShopFilterChange,
  selectedShopProductUid,
}) {
  const canManageShop = hasAccess(ACCESS_KEYS.profile.manageShop)
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy)

  return (
    <section className="campus-profile-surface campus-shop-panel">
      <div className="campus-shop-sticky-head">
        <header className="campus-shop-head">
          <div>
            <h2>
              <FiShoppingBag aria-hidden="true" />
              My Product Shop
            </h2>
            <p>Handpicked, stylish and quality products you&apos;ll love.</p>
          </div>
          <button type="button" className="campus-shop-catalogue-btn">
            <FiGrid aria-hidden="true" />
            View Catalogue
          </button>
        </header>

        {canManageShop ? (
          <article className="campus-shop-composer">
            <div className="campus-shop-composer-head">
              <img
                src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                alt="Aisha Mwangi"
              />
              <p>What&apos;s new in your shop?</p>
            </div>
            <footer className="campus-shop-composer-foot">
              <div className="campus-shop-composer-tools">
                {SHOP_COMPOSER_TOOLS.map(({ label, Icon }) => (
                  <button key={label} type="button">
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className="campus-shop-post-btn">Post</button>
            </footer>
          </article>
        ) : null}

        <div className="campus-shop-filter-bar">
          <div className="campus-shop-filter-list">
            {SHOP_TAB_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={activeShopFilter === key ? 'is-active' : ''}
                onClick={() => onShopFilterChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="campus-shop-sort-btn">
            Most Recent
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="campus-shop-product-grid">
        {filteredShopProducts.map((item) => (
          <article
            key={item.uid}
            className={`campus-shop-product-card${selectedShopProductUid === item.uid ? ' is-selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={selectedShopProductUid === item.uid}
            onClick={() => onProductSelect(item.uid)}
            onKeyDown={(event) => handleKeyboardActivation(event, () => onProductSelect(item.uid))}
          >
            <header className="campus-shop-product-top">
              <div>
                <img
                  src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
                  alt={`${item.seller} avatar`}
                />
                <p>{item.seller}</p>
                <span>{item.time}</span>
              </div>
              {canManageShop ? (
                <button
                  type="button"
                  aria-label={`More actions for ${item.title}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <FiMoreVertical aria-hidden="true" />
                </button>
              ) : null}
            </header>

            <div className="campus-shop-product-image-wrap">
              <img src={item.image} alt={`${item.title} preview`} loading="lazy" />
              <em className={`campus-shop-product-badge ${item.badgeTone}`}>{item.badge}</em>
            </div>

            <div className="campus-shop-product-body">
              <p className="campus-shop-product-title-row">
                <strong>{item.title}</strong>
                <span>{item.price}</span>
              </p>
              <p className="campus-shop-product-description">{item.description}</p>
            </div>

            <footer className="campus-shop-product-foot">
              <p>
                <FiHeart aria-hidden="true" />
                {item.likes}
              </p>
              <p>
                <FiMessageCircle aria-hidden="true" />
                {item.comments}
              </p>
              <p>
                <FiSend aria-hidden="true" />
                {item.shares}
              </p>
              {canBuy ? (
                <button
                  type="button"
                  aria-label={`Save ${item.title}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <FiBookmark aria-hidden="true" />
                </button>
              ) : null}
            </footer>
          </article>
        ))}
      </section>
    </section>
  )
}

export default ProfileShopPanel
