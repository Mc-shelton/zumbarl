import { FiShoppingBag, FiStar } from 'react-icons/fi'
import {
  SHOP_ABOUT_STATS,
  SHOP_HIGHLIGHTS,
  SHOP_SOCIAL_LINKS,
  SHOP_TOP_PRODUCTS,
} from '../constants'

function ProfileShopRail({ shop }) {
  return (
    <>
      <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
        <header className="campus-shop-rail-head">
          <h2>About {shop?.name || 'My Shop'}</h2>
          <button type="button" className="campus-link-btn">Edit</button>
        </header>
        <p className="campus-shop-about-copy">
          {shop?.description || 'Curated products that blend style, quality and everyday practicality. Thank you for supporting my small business!'}
        </p>

        <div className="campus-shop-about-stats">
          {SHOP_ABOUT_STATS.map((item) => (
            <article key={item.label}>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="campus-shop-social-list">
          {SHOP_SOCIAL_LINKS.map(({ label, Icon }) => (
            <button key={label} type="button" aria-label={label}>
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
        <header className="campus-shop-rail-head">
          <h2>Shop Highlights</h2>
        </header>
        <div className="campus-shop-highlight-list">
          {SHOP_HIGHLIGHTS.map(({ title, description, Icon }) => (
            <article key={title}>
              <span>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
        <header className="campus-shop-rail-head">
          <h2>Top Products</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>
        <div className="campus-shop-top-product-list">
          {SHOP_TOP_PRODUCTS.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt={`${item.name} preview`} loading="lazy" />
              <div>
                <h3>{item.name}</h3>
                <p>{item.price}</p>
              </div>
              <strong>
                {item.rating}
                <FiStar aria-hidden="true" />
                <span>({item.reviews})</span>
              </strong>
            </article>
          ))}
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
        <header className="campus-shop-rail-head">
          <h2>Current Offer</h2>
          <button type="button" className="campus-link-btn">Edit</button>
        </header>

        <div className="campus-shop-offer-card">
          <div>
            <h3>Free Delivery Weekend!</h3>
            <p>Get free delivery on all orders above KES 2,000 this weekend only.</p>
            <strong>Valid till May 26, 2025</strong>
          </div>
          <span aria-hidden="true">
            <FiShoppingBag />
          </span>
        </div>
      </article>
    </>
  )
}

export default ProfileShopRail
