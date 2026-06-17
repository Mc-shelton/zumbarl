import { FiHeart, FiMessageCircle, FiShield } from 'react-icons/fi'
import { MARKETPLACE_DEFAULT_SELLER } from '../../../data/marketplace'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'

function MarketplaceProductRail({
  item,
  onCardKeyDown,
  onOpenItemDetail,
  suggestedItems,
}) {
  const canBuy = hasAccess(ACCESS_KEYS.marketplace.buy)

  return (
    <aside className="campus-rail opportunities-rail opportunities-marketplace-rail opportunities-marketplace-product-rail" aria-label="Product purchase and seller info">
      <section className="campus-rail-card opportunities-marketplace-product-price-card">
        <p>{item.price}</p>
        {canBuy ? (
          <>
            <button type="button" className="opportunities-marketplace-product-primary-btn">
              <FiMessageCircle aria-hidden="true" />
              Chat with Seller
            </button>
            <button type="button" className="opportunities-marketplace-product-secondary-btn">Make an Offer</button>
          </>
        ) : null}

        <article>
          <FiShield aria-hidden="true" />
          <div>
            <h4>Shop safely</h4>
            <p>Meet in a public place and check the item before paying.</p>
          </div>
        </article>
      </section>

      <section className="campus-rail-card opportunities-marketplace-product-seller-card">
        <h3>Seller Information</h3>

        <div className="opportunities-marketplace-product-seller-head">
          <img src={MARKETPLACE_DEFAULT_SELLER.avatar} alt={MARKETPLACE_DEFAULT_SELLER.name} />
          <div>
            <h4>{MARKETPLACE_DEFAULT_SELLER.name}</h4>
            <p>{MARKETPLACE_DEFAULT_SELLER.role}</p>
            <span>{MARKETPLACE_DEFAULT_SELLER.campus}</span>
          </div>
        </div>

        <div className="opportunities-marketplace-product-seller-metrics">
          <article>
            <strong>{MARKETPLACE_DEFAULT_SELLER.itemsSold}</strong>
            <span>Items Sold</span>
          </article>
          <article>
            <strong>{MARKETPLACE_DEFAULT_SELLER.rating}</strong>
            <span>({MARKETPLACE_DEFAULT_SELLER.reviews} reviews)</span>
          </article>
          <article>
            <strong>{MARKETPLACE_DEFAULT_SELLER.joined}</strong>
            <span>Joined</span>
          </article>
        </div>

        <button type="button" className="opportunities-marketplace-product-secondary-btn">View Seller Profile</button>
      </section>

      <section className="campus-rail-card opportunities-marketplace-product-suggested-card">
        <div className="opportunities-section-head">
          <h3>You may also like</h3>
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
