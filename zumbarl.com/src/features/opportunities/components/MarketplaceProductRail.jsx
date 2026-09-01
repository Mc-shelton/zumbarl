import { FiBarChart2, FiCalendar, FiCoffee, FiEdit3, FiEye, FiHeart, FiMessageCircle, FiPackage, FiShield, FiShoppingCart } from 'react-icons/fi'
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
  onRequestService,
  onOpenItemDetail,
  onEditListing,
  onUpdateListingStatus,
  onViewSellerProfile,
  seller = MARKETPLACE_DEFAULT_SELLER,
  suggestedItems,
}) {
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy)
  const acceptsBuyerActions = (!item.status || ['published', 'active'].includes(String(item.status).toLowerCase())) && item.shop?.acceptingOrders !== false
  const isService = String(item.kind || item.listingType || '').toLowerCase() === 'service'
  const isQuoteService = isService && item.serviceMode === 'request_quote'
  const ServiceActionIcon = item.serviceMode === 'order_ahead' ? FiCoffee : FiCalendar
  const serviceActionLabel = item.serviceMode === 'order_ahead' ? 'Choose pickup time' : 'Choose a time'

  return (
    <aside className="campus-rail opportunities-rail opportunities-marketplace-rail opportunities-marketplace-product-rail" aria-label="Marketplace checkout and provider information">
      <section className="campus-rail-card opportunities-marketplace-product-price-card">
        <span className="opportunities-marketplace-product-price-label">{isService ? 'Starting price' : 'Marketplace price'}</span>
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
            {!activeOffer && !isService ? <button type="button" className="opportunities-marketplace-product-primary-btn is-cart" disabled={isActionPending || Number(item.stock ?? 1) < 1} onClick={onAddToCart}><FiShoppingCart aria-hidden="true" />{Number(item.stock ?? 1) < 1 ? 'Out of stock' : 'Add to cart'}</button> : null}
            {!activeOffer && isService && !isQuoteService ? <button type="button" className="opportunities-marketplace-product-primary-btn is-cart" disabled={isActionPending || Number(item.stock ?? 1) < 1} onClick={onRequestService}><ServiceActionIcon aria-hidden="true" />{Number(item.stock ?? 1) < 1 ? 'Fully booked' : serviceActionLabel}</button> : null}
            {!activeOffer && isQuoteService ? <button type="button" className="opportunities-marketplace-product-primary-btn is-cart" disabled={isActionPending} onClick={onChatWithSeller}><FiMessageCircle aria-hidden="true" />Request service</button> : null}
            {!isQuoteService ? (
              <button type="button" className="opportunities-marketplace-product-primary-btn is-chat" disabled={isActionPending} onClick={onChatWithSeller}>
                <FiMessageCircle aria-hidden="true" />
                Chat with {isService ? 'provider' : 'seller'}
              </button>
            ) : null}
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
            ) : !isService ? (
              <button type="button" className="opportunities-marketplace-product-secondary-btn" disabled={isActionPending} onClick={onMakeOffer}>Make an Offer</button>
            ) : null}
          </>
        ) : canBuy ? <span className="opportunities-marketplace-owner-label">{item.shop?.acceptingOrders === false ? `${item.shop.name || 'This campus service'} is currently closed` : 'Currently unavailable'}</span> : null}
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
              <p>{isService ? 'Your payment is protected while the provider confirms and fulfils the request.' : 'Meet in a public place and check the item before paying.'}</p>
            </div>
          </article>
        )}
      </section>

      <section className="campus-rail-card opportunities-marketplace-product-seller-card">
        <h3>{isOwner ? 'Your shop' : (isService ? 'Provider information' : 'Seller information')}</h3>

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
            <span>{isService ? 'Orders' : 'Items sold'}</span>
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
          {isOwner ? 'View your shop' : `View ${isService ? 'provider' : 'seller'} profile`}
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
