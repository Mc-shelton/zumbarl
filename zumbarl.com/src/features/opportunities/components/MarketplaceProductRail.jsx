import { FiBarChart2, FiEdit3, FiEye, FiHeart, FiMessageCircle, FiPackage, FiShield, FiShoppingCart } from 'react-icons/fi'
import { MARKETPLACE_DEFAULT_SELLER } from '../../../data/marketplace'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function MarketplaceProductRail({
  activeOffer,
  actionStatus,
  isActionPending,
  isOwner = false,
  item,
  onChatWithSeller,
  onAddToCart,
  onCheckoutAcceptedOffer,
  onCardKeyDown,
  onMakeOffer,
  onOpenItemDetail,
  onEditListing,
  onUpdateListingStatus,
  onViewSellerProfile,
  seller = MARKETPLACE_DEFAULT_SELLER,
  suggestedItems,
}) {
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy)
  const acceptsBuyerActions = !item.status || ['published', 'active'].includes(String(item.status).toLowerCase())

  return (
    <aside className="campus-rail opportunities-rail opportunities-marketplace-rail opportunities-marketplace-product-rail" aria-label="Product purchase and seller info">
      <section className="campus-rail-card opportunities-marketplace-product-price-card">
        <p>{item.price}</p>
        {isOwner ? (
          <>
            <span className="opportunities-marketplace-owner-label">Your listing</span>
            <button type="button" className="opportunities-marketplace-product-primary-btn" disabled={isActionPending} onClick={onEditListing}>
              <FiEdit3 aria-hidden="true" />
              Edit listing
            </button>
            <button type="button" className="opportunities-marketplace-product-secondary-btn" disabled={isActionPending} onClick={onUpdateListingStatus}>
              <FiPackage aria-hidden="true" />
              {item.status === 'paused' ? 'Publish listing' : 'Pause listing'}
            </button>
          </>
        ) : canBuy && acceptsBuyerActions ? (
          <>
            {!activeOffer ? <button type="button" className="opportunities-marketplace-product-primary-btn" disabled={isActionPending || Number(item.stock ?? 1) < 1} onClick={onAddToCart}>
              <FiShoppingCart aria-hidden="true" />
              {Number(item.stock ?? 1) < 1 ? 'Out of stock' : 'Add to cart'}
            </button> : null}
            <button type="button" className="opportunities-marketplace-product-primary-btn" disabled={isActionPending} onClick={onChatWithSeller}>
              <FiMessageCircle aria-hidden="true" />
              Chat with Seller
            </button>
            {activeOffer?.status === 'accepted' ? (
              <div className="opportunities-marketplace-offer-accepted" role="status">
                <strong>Offer accepted!</strong>
                <span>The seller accepted your KSh {Number(activeOffer.amount).toLocaleString('en-KE')} offer. Complete checkout to secure the item.</span>
                <button type="button" disabled={isActionPending} onClick={onCheckoutAcceptedOffer}>Checkout now</button>
              </div>
            ) : activeOffer?.status === 'declined' ? (
              <div className="opportunities-marketplace-offer-declined" role="status">
                <strong>Offer declined</strong>
                <span>Your KSh {Number(activeOffer.amount).toLocaleString('en-KE')} offer wasn’t accepted. You can adjust it and try again.</span>
                <button type="button" disabled={isActionPending} onClick={onMakeOffer}>Edit offer</button>
              </div>
            ) : activeOffer ? (
              <div className="opportunities-marketplace-offer-pending" role="status">
                <strong>Offer pending</strong>
                <span>Your KSh {Number(activeOffer.amount).toLocaleString('en-KE')} offer is awaiting the seller’s response.</span>
              </div>
            ) : (
              <button type="button" className="opportunities-marketplace-product-secondary-btn" disabled={isActionPending} onClick={onMakeOffer}>Make an Offer</button>
            )}
          </>
        ) : canBuy ? <span className="opportunities-marketplace-owner-label">Currently unavailable</span> : null}
        {actionStatus ? <p className="opportunities-marketplace-action-status" role="status">{actionStatus}</p> : null}

        {isOwner ? (
          <article>
            <FiBarChart2 aria-hidden="true" />
            <div>
              <h4>Listing performance</h4>
              <p>{item.viewCount || 0} views · {item.savedCount || 0} saves · {item.stock ?? 1} in stock</p>
            </div>
          </article>
        ) : (
          <article>
            <FiShield aria-hidden="true" />
            <div>
              <h4>Shop safely</h4>
              <p>Meet in a public place and check the item before paying.</p>
            </div>
          </article>
        )}
      </section>

      <section className="campus-rail-card opportunities-marketplace-product-seller-card">
        <h3>{isOwner ? 'Your shop' : 'Seller Information'}</h3>

        <div className="opportunities-marketplace-product-seller-head">
          <img src={seller.avatar} alt={seller.name} />
          <div>
            <h4>{seller.name}</h4>
            <p>{seller.role}</p>
            <span>{seller.campus}</span>
          </div>
        </div>

        <div className="opportunities-marketplace-product-seller-metrics">
          <article>
            <strong>{seller.itemsSold}</strong>
            <span>Items Sold</span>
          </article>
          <article>
            <strong>{seller.rating}</strong>
            <span>({seller.reviews} reviews)</span>
          </article>
          <article>
            <strong>{seller.joined}</strong>
            <span>Joined</span>
          </article>
        </div>

        <button type="button" className="opportunities-marketplace-product-secondary-btn" disabled={isActionPending} onClick={onViewSellerProfile}>
          {isOwner ? <FiEye aria-hidden="true" /> : null}
          {isOwner ? 'View your shop' : 'View Seller Profile'}
        </button>
      </section>

      <section className="campus-rail-card opportunities-marketplace-product-suggested-card">
        <div className="opportunities-section-head">
          <h3>{isOwner ? 'Market comparison' : 'You may also like'}</h3>
          <button type="button" className="campus-link-btn">View all</button>
        </div>

        <div className="opportunities-marketplace-product-suggested-list">
          {suggestedItems.map((suggested) => (
            <article
              key={suggested.id}
              className="opportunities-marketplace-product-suggested-item"
              role="link"
              tabIndex={0}
              onClick={() => onOpenItemDetail(suggested.id)}
              onKeyDown={(event) => onCardKeyDown(event, suggested.id)}
              aria-label={`Open ${suggested.title}`}
            >
              <img src={suggested.image} alt={suggested.title} loading="lazy" />
              <div>
                <h4>{suggested.title}</h4>
                <p>{suggested.price}</p>
              </div>
              <FiHeart aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default MarketplaceProductRail
