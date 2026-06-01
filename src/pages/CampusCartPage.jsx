import { useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiHome,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_CART_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', Icon: FiHome, active: false, href: '/campus' },
  { label: 'Opportunities', Icon: FiBriefcase, active: true, href: '/campus/opportunities' },
  { label: 'Explore Campus', Icon: FiCalendar, active: false, href: '/campus/explore' },
  { label: 'Learn & Grow', Icon: FiBookOpen, active: false },
  { label: 'Community', Icon: FiUsers, active: false },
  { label: 'Finance', Icon: FiCreditCard, active: false },
  { label: 'Services', Icon: FiTruck, active: false },
  { label: 'Messages', Icon: FiMail, active: false },
  { label: 'Notifications', Icon: FiBell, active: false },
]

const INITIAL_CART_ITEMS = [
  {
    id: 'wireless-earbuds',
    title: 'Wireless Earbuds',
    badge: 'New Arrival',
    badgeTone: 'is-purple',
    description: 'High quality sound, long battery life and noise cancellation for your everyday vibe.',
    unitPrice: 2499,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
  {
    id: 'aesthetic-hair-clips',
    title: 'Aesthetic Hair Clips (Set of 4)',
    badge: 'Best Seller',
    badgeTone: 'is-orange',
    description: 'Trendy, durable and perfect for every outfit. Includes 4 stylish clips.',
    unitPrice: 650,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'gold-plated-jewelry-set',
    title: 'Gold Plated Jewelry Set',
    badge: 'Limited Stock',
    badgeTone: 'is-pink',
    description: 'Elegant and timeless pieces to elevate your everyday look.',
    unitPrice: 1299,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
  },
]

const SUGGESTED_PRODUCTS = [
  {
    id: 'portable-speaker',
    title: 'Portable Bluetooth Speaker',
    price: 1799,
    image: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
  {
    id: 'canvas-tote',
    title: 'Canvas Tote Bag',
    price: 980,
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
  },
  {
    id: 'scented-candle',
    title: 'Scented Soy Candle',
    price: 850,
    image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
  },
  {
    id: 'phone-stand',
    title: 'Phone Stand',
    price: 450,
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  },
]

const CHECKOUT_FEATURES = [
  { title: 'Secure Payment', detail: 'Your payment information is safe with us.', Icon: FiLock },
  { title: 'Easy Returns', detail: '7-day easy returns on eligible items.', Icon: FiRefreshCw },
  { title: 'Buyer Protection', detail: "Get help if your item doesn't arrive.", Icon: FiShield },
]

function formatKes(amount) {
  return `KES ${amount.toLocaleString()}`
}

function CampusCartPage() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS)
  const [promoCode, setPromoCode] = useState('')

  const totalItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  )

  const deliveryFee = cartItems.length > 0 ? 150 : 0
  const platformFee = cartItems.length > 0 ? 100 : 0
  const finalTotal = subtotal + deliveryFee + platformFee

  const handleQuantityChange = (itemId, delta) => {
    setCartItems((current) => current.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      const nextQuantity = Math.max(1, item.quantity + delta)
      return {
        ...item,
        quantity: nextQuantity,
      }
    }))
  }

  const handleRemoveItem = (itemId) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  return (
    <main className="campus-page campus-cart-page">
      <Seo
        title={CAMPUS_CART_SEO.title}
        description={CAMPUS_CART_SEO.description}
        path={CAMPUS_CART_SEO.path}
        keywords={CAMPUS_CART_SEO.keywords}
        jsonLd={[CAMPUS_CART_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell campus-cart-shell">
          <aside className="campus-sidebar" aria-label="Student portal navigation">
            <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
              <img className="campus-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
              <span className="campus-brand-text">zumbarl.</span>
            </Link>

            <nav className="campus-nav">
              {SIDEBAR_NAV_ITEMS.map(({ label, Icon, active, href }) =>
                href ? (
                  <Link
                    key={label}
                    to={href}
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    className={`campus-nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <Link className="campus-profile-card" to="/campus/profile" aria-label="Student profile">
              <img className="campus-avatar" src="/assets/index/bee_nobg.png" alt="Brian Mwangi" />
              <div>
                <p className="campus-profile-name">Brian Mwangi</p>
                <p className="campus-profile-meta meta-category">Student</p>
                <p className="campus-profile-meta">Kenyatta University</p>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>

            <section className="campus-sidebar-card">
              <h3>Invite your friends</h3>
              <p>Bring your squad and earn rewards together.</p>
              <button type="button" className="campus-pill-btn">
                Invite Now
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          </aside>

          <section className="campus-main campus-cart-main">
            <section className="campus-cart-top-actions" aria-label="Campus cart actions">
              <button type="button" className="campus-cart-find-btn">
                <FiPlus aria-hidden="true" />
                Find Opportunities
                <FiChevronDown aria-hidden="true" />
              </button>
              <button type="button" className="campus-icon-btn" aria-label="Open messages">
                <FiMessageCircle aria-hidden="true" />
                <span className="campus-badge">3</span>
              </button>
              <button type="button" className="campus-icon-btn" aria-label="Open notifications">
                <FiBell aria-hidden="true" />
                <span className="campus-badge">6</span>
              </button>
              <button type="button" className="campus-cart-user-btn" aria-label="Open profile menu">
                <img src="/assets/index/bee_nobg.png" alt="Brian avatar" />
                <FiChevronDown aria-hidden="true" />
              </button>
            </section>

            <header className="campus-cart-header">
              <div className="campus-cart-head-copy">
                <p className="campus-cart-breadcrumb">
                  <span>Campus</span>
                  <FiChevronRight aria-hidden="true" />
                  <strong>Cart</strong>
                </p>
                <h1>My Cart ({totalItemCount})</h1>
                <p>Review your items and proceed to checkout.</p>
              </div>

              <button type="button" className="campus-cart-clear-btn" onClick={handleClearCart}>
                <FiTrash2 aria-hidden="true" />
                Clear Cart
              </button>
            </header>

            <section className="campus-cart-list-card" aria-label="Cart items">
              <header className="campus-cart-list-head">
                <p>Item</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
              </header>

              {cartItems.length === 0 ? (
                <section className="campus-cart-empty-state">
                  <h2>Your cart is empty</h2>
                  <p>Add products from Explore Campus or Marketplace to see them here.</p>
                  <Link to="/campus/explore" className="campus-cart-empty-btn">
                    Explore products
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </section>
              ) : (
                <div className="campus-cart-row-list">
                  {cartItems.map((item) => (
                    <article key={item.id} className="campus-cart-row">
                      <div className="campus-cart-item-cell">
                        <img src={item.image} alt={item.title} loading="lazy" />
                        <div>
                          <em className={item.badgeTone}>{item.badge}</em>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                          <div className="campus-cart-item-actions">
                            <button type="button">Save for later</button>
                            <button type="button" onClick={() => handleRemoveItem(item.id)}>Remove</button>
                          </div>
                        </div>
                      </div>

                      <p className="campus-cart-price-cell">{formatKes(item.unitPrice)}</p>

                      <div className="campus-cart-qty-cell">
                        <button type="button" aria-label={`Decrease quantity for ${item.title}`} onClick={() => handleQuantityChange(item.id, -1)}>
                          <FiMinus aria-hidden="true" />
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label={`Increase quantity for ${item.title}`} onClick={() => handleQuantityChange(item.id, 1)}>
                          <FiPlus aria-hidden="true" />
                        </button>
                      </div>

                      <div className="campus-cart-total-cell">
                        <strong>{formatKes(item.unitPrice * item.quantity)}</strong>
                        <button type="button" aria-label={`Remove ${item.title}`} onClick={() => handleRemoveItem(item.id)}>
                          <FiX aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <section className="campus-cart-suggested">
                <header>
                  <h2>You might also like</h2>
                </header>
                <div className="campus-cart-suggested-row">
                  {SUGGESTED_PRODUCTS.map((product) => (
                    <article key={product.id}>
                      <img src={product.image} alt={product.title} loading="lazy" />
                      <div>
                        <h3>{product.title}</h3>
                        <p>{formatKes(product.price)}</p>
                        <button type="button">Add to Cart</button>
                      </div>
                    </article>
                  ))}
                  <button type="button" className="campus-cart-suggested-next" aria-label="More suggested products">
                    <FiChevronRight aria-hidden="true" />
                  </button>
                </div>
              </section>
            </section>
          </section>

          <aside className="campus-rail campus-cart-rail" aria-label="Order summary">
            <section className="campus-rail-card campus-cart-summary-card">
              <h2>Order Summary</h2>

              <div className="campus-cart-summary-list">
                <article>
                  <p>Subtotal ({totalItemCount} items)</p>
                  <strong>{formatKes(subtotal)}</strong>
                </article>
                <article>
                  <p>Delivery Fee</p>
                  <strong>{formatKes(deliveryFee)}</strong>
                </article>
                <article>
                  <p>Platform Fee</p>
                  <strong>{formatKes(platformFee)}</strong>
                </article>
              </div>

              <div className="campus-cart-summary-total">
                <p>Total</p>
                <strong>{formatKes(finalTotal)}</strong>
              </div>

              <article className="campus-cart-delivery-card">
                <div className="campus-cart-delivery-icon">
                  <FiTruck aria-hidden="true" />
                </div>
                <div>
                  <h3>Estimated Delivery</h3>
                  <p>May 27 - May 29, 2024</p>
                  <span>Nairobi, Kenya</span>
                </div>
                <button type="button">Change</button>
              </article>

              <form className="campus-cart-promo-row" onSubmit={(event) => event.preventDefault()}>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Have a promo code?"
                  aria-label="Promo code"
                />
                <button type="submit">Apply</button>
              </form>

              <Link to="/campus/cart/payment" className="campus-cart-checkout-btn">
                Proceed to Checkout
                <FiArrowRight aria-hidden="true" />
              </Link>

              <p className="campus-cart-secure-note">
                <FiLock aria-hidden="true" />
                Secure checkout powered by Zumbarl
              </p>

              <div className="campus-cart-feature-list">
                {CHECKOUT_FEATURES.map(({ title, detail, Icon }) => (
                  <article key={title}>
                    <div className="campus-cart-feature-icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <div>
                      <h3>{title}</h3>
                      <p>{detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CampusCartPage
