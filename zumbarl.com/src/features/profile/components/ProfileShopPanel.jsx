import {
  FiBookmark,
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiMessageCircle,
  FiMoreVertical,
  FiSend,
  FiShoppingBag,
  FiTruck,
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
  canManageShop = false,
  filteredShopProducts,
  onCreateListing,
  onEditListing,
  onDecideOffer,
  onOpenOffer,
  onProductSelect,
  onOpenOrders,
  onShopFilterChange,
  selectedShopProductUid,
  shop,
  pendingOffers = [],
  offerDecisionId = '',
}) {
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy) && !canManageShop

  return (
    <section className="campus-profile-surface campus-shop-panel">
      <div className="campus-shop-sticky-head">
        <header className="campus-shop-head">
          <div>
            <h2>
              <FiShoppingBag aria-hidden="true" />
              {shop?.name || 'My Product Shop'}
            </h2>
            <p>{shop?.tagline || 'Handpicked, stylish and quality products you’ll love.'}</p>
          </div>
          <div className="campus-shop-head-actions">
            {canManageShop ? <button type="button" className="campus-shop-orders-btn" onClick={onOpenOrders}><FiTruck aria-hidden="true" /> Orders</button> : null}
            <button type="button" className="campus-shop-catalogue-btn"><FiGrid aria-hidden="true" /> View Catalogue</button>
          </div>
        </header>

        {canManageShop ? (
          <>
          {pendingOffers.length ? (
            <section className="campus-shop-pending-offers" aria-label="Pending marketplace offers">
              <header>
                <div>
                  <span>{pendingOffers.length}</span>
                  <div><strong>Pending offers</strong><p>Buyers are waiting for your response.</p></div>
                </div>
                <small>Open one to negotiate</small>
              </header>
              <div className="campus-shop-pending-offer-list">
                {pendingOffers.slice(0, 3).map((offer) => (
                  <article key={offer.id}>
                    <img src={offer.product?.image || '/assets/index/bee_nobg.png'} alt="" />
                    <span><strong>{offer.buyer.name}</strong><small>{offer.product?.title || 'Marketplace item'}</small></span>
                    <b>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: offer.currency || 'KES', maximumFractionDigits: 0 }).format(offer.amount)}</b>
                    <div>
                      <button type="button" onClick={() => onOpenOffer(offer)}><FiMessageCircle aria-hidden="true" /> Chat</button>
                      <button type="button" disabled={offerDecisionId === offer.id} onClick={() => onDecideOffer(offer, 'declined')}>Decline</button>
                      <button type="button" disabled={offerDecisionId === offer.id} onClick={() => onDecideOffer(offer, 'accepted')}>Accept</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <article className="campus-shop-composer">
            <div className="campus-shop-composer-head">
              <img
                src={shop?.logoUrl || '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp'}
                alt={shop?.name || 'Shop'}
              />
              <p>What&apos;s new in your shop?</p>
            </div>
            <footer className="campus-shop-composer-foot">
              <div className="campus-shop-composer-tools">
                {SHOP_COMPOSER_TOOLS.map(({ label, Icon }) => (
                  <button key={label} type="button" onClick={onCreateListing}>
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className="campus-shop-post-btn" onClick={onCreateListing}>Post an item</button>
            </footer>
          </article>
          </>
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
                  onClick={(event) => {
                    event.stopPropagation()
                    onEditListing(item)
                  }}
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
