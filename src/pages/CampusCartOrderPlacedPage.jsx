import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiHome,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { CAMPUS_CART_ORDER_PLACED_SEO } from '../features/seo/constants'
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

const ORDER_ITEMS = [
  {
    id: 'wireless-earbuds',
    title: 'Wireless Earbuds',
    price: 2499,
    qty: 1,
  },
  {
    id: 'aesthetic-hair-clips',
    title: 'Aesthetic Hair Clips (Set of 4)',
    price: 650,
    qty: 1,
  },
  {
    id: 'gold-plated-jewelry-set',
    title: 'Gold Plated Jewelry Set',
    price: 1299,
    qty: 1,
  },
]

const CHECKOUT_FEATURES = [
  { title: 'Secure Payment', detail: 'Your payment information is safe with us.', Icon: FiLock },
  { title: 'Easy Returns', detail: '7-day easy returns on eligible items.', Icon: FiRefreshCw },
  { title: 'Buyer Protection', detail: "Get help if your item doesn't arrive.", Icon: FiShield },
]

const STEP_ITEMS = [
  { id: 'delivery', label: 'Delivery', copy: 'Enter delivery details', state: 'done' },
  { id: 'payment', label: 'Payment', copy: 'Choose payment method', state: 'done' },
  { id: 'review', label: 'Review', copy: 'Review your order', state: 'done' },
  { id: 'confirmation', label: 'Confirmation', copy: 'Order placed successfully', state: 'active', number: 4 },
]

const TIMELINE_ITEMS = [
  {
    id: 'confirmed',
    title: 'Order Confirmed',
    detail: 'We have received your order and payment confirmation.',
    state: 'done',
  },
  {
    id: 'packed',
    title: 'Packaging Your Order',
    detail: 'Seller is preparing your products for dispatch.',
    state: 'active',
  },
  {
    id: 'dispatch',
    title: 'Out for Delivery',
    detail: 'A rider will pick and deliver to your selected location.',
    state: 'pending',
  },
  {
    id: 'arrival',
    title: 'Delivered',
    detail: 'Expected between May 27 - May 29, 2024.',
    state: 'pending',
  },
]

function formatKes(amount) {
  return `KES ${amount.toLocaleString()}`
}

function CampusCartOrderPlacedPage() {
  const navigate = useNavigate()
  const subtotal = ORDER_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = 150
  const platformFee = 100
  const total = subtotal + deliveryFee + platformFee

  return (
    <main className="campus-page campus-cart-page campus-checkout-page">
      <Seo
        title={CAMPUS_CART_ORDER_PLACED_SEO.title}
        description={CAMPUS_CART_ORDER_PLACED_SEO.description}
        path={CAMPUS_CART_ORDER_PLACED_SEO.path}
        keywords={CAMPUS_CART_ORDER_PLACED_SEO.keywords}
        jsonLd={[CAMPUS_CART_ORDER_PLACED_SEO.pageJsonLd]}
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
                Explore Campus
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

            <header className="campus-checkout-header">
              <p className="campus-cart-breadcrumb">
                <span>Campus</span>
                <FiChevronRight aria-hidden="true" />
                <span>Cart</span>
                <FiChevronRight aria-hidden="true" />
                <span>Checkout</span>
                <FiChevronRight aria-hidden="true" />
                <span>Review Order</span>
                <FiChevronRight aria-hidden="true" />
                <strong>Order Placed</strong>
              </p>
              <h1>Order Placed</h1>
              <p>Your order has been confirmed. Track progress and delivery updates from here.</p>
            </header>

            <section className="campus-checkout-stepper" aria-label="Checkout steps">
              {STEP_ITEMS.map((step, index) => (
                <article key={step.id} className={`campus-checkout-step ${step.state}`}>
                  <span className="campus-checkout-step-icon" aria-hidden="true">
                    {step.state === 'done' ? <FiCheck /> : step.number}
                  </span>
                  <div>
                    <h3>{step.label}</h3>
                    <p>{step.copy}</p>
                  </div>
                  {index < STEP_ITEMS.length - 1 ? <i aria-hidden="true" /> : null}
                </article>
              ))}
            </section>

            <section className="campus-checkout-panel campus-order-placed-stack">
              <article className="campus-order-placed-hero">
                <span className="campus-order-placed-check" aria-hidden="true">
                  <FiCheck />
                </span>
                <div>
                  <h2>Thank you! Your order has been placed.</h2>
                  <p>
                    We&apos;ve sent a confirmation to <strong>brian.mwangi@student.ku.ac.ke</strong> and will update
                    you as your order moves.
                  </p>
                </div>
                <p className="campus-order-placed-order-id">Order ID: ZMB-2026-0525-019</p>
              </article>

              <section className="campus-order-placed-meta-grid" aria-label="Order details">
                <article className="campus-order-placed-meta-card">
                  <h3>Delivery Address</h3>
                  <p>Brian Mwangi</p>
                  <p>Westlands, Nairobi County, 00100</p>
                  <p>+254 712 345 678</p>
                </article>
                <article className="campus-order-placed-meta-card">
                  <h3>Payment Method</h3>
                  <p>Card Payment</p>
                  <p>Visa ending in 3456</p>
                  <p>Paid {formatKes(total)}</p>
                </article>
                <article className="campus-order-placed-meta-card">
                  <h3>Estimated Delivery</h3>
                  <p>May 27 - May 29, 2024</p>
                  <p>Nairobi, Kenya</p>
                  <p>Standard campus delivery</p>
                </article>
              </section>

              <article className="campus-order-placed-timeline">
                <header>
                  <h2>What happens next?</h2>
                  <p>You can follow every step until delivery is complete.</p>
                </header>

                <div className="campus-order-placed-timeline-list">
                  {TIMELINE_ITEMS.map((item) => (
                    <article key={item.id} className={`campus-order-placed-timeline-item is-${item.state}`}>
                      <span aria-hidden="true">
                        {item.state === 'done' ? <FiCheck /> : item.state === 'active' ? <FiClock /> : <FiTruck />}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <footer className="campus-checkout-actions">
                <button
                  type="button"
                  className="campus-checkout-back-btn"
                  onClick={() => navigate('/campus/opportunities?tab=service-orders')}
                >
                  <FiArrowRight aria-hidden="true" />
                  My Orders
                </button>
                <button
                  type="button"
                  className="campus-checkout-next-btn"
                  onClick={() => navigate('/campus/opportunities/buy-sell')}
                >
                  Continue Shopping
                  <FiArrowRight aria-hidden="true" />
                </button>
              </footer>
            </section>

            <p className="campus-checkout-powered-note">
              <FiLock aria-hidden="true" />
              Secure checkout powered by Zumbarl
            </p>
          </section>

          <aside className="campus-rail campus-cart-rail" aria-label="Order summary">
            <section className="campus-rail-card campus-cart-summary-card">
              <header className="campus-checkout-summary-head">
                <h2>Order Summary <span>({ORDER_ITEMS.length} items)</span></h2>
                <Link to="/campus/opportunities?tab=service-orders">View Orders</Link>
              </header>

              <div className="campus-checkout-mini-items is-compact">
                {ORDER_ITEMS.map((item) => (
                  <article key={item.id}>
                    <h3>{item.title}</h3>
                    <p>Qty: {item.qty}</p>
                    <strong>{formatKes(item.price)}</strong>
                  </article>
                ))}
              </div>

              <div className="campus-cart-summary-list">
                <article>
                  <p>Subtotal</p>
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
                <strong>{formatKes(total)}</strong>
              </div>

              <article className="campus-order-placed-summary-note">
                <FiMapPin aria-hidden="true" />
                <div>
                  <h3>Delivery to Westlands, Nairobi</h3>
                  <p>Updates will appear in your orders tab.</p>
                </div>
              </article>

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

export default CampusCartOrderPlacedPage
