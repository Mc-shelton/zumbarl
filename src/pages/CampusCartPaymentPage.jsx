import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
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
import { CAMPUS_CART_PAYMENT_SEO } from '../features/seo/constants'
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
    image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
  {
    id: 'aesthetic-hair-clips',
    title: 'Aesthetic Hair Clips (Set of 4)',
    price: 650,
    qty: 1,
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'gold-plated-jewelry-set',
    title: 'Gold Plated Jewelry Set',
    price: 1299,
    qty: 1,
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
  },
]

const CHECKOUT_FEATURES = [
  { title: 'Secure Payment', detail: 'Your payment information is safe with us.', Icon: FiLock },
  { title: 'Easy Returns', detail: '7-day easy returns on eligible items.', Icon: FiRefreshCw },
  { title: 'Buyer Protection', detail: "Get help if your item doesn't arrive.", Icon: FiShield },
]

const STEP_ITEMS = [
  { id: 'delivery', label: 'Delivery', copy: 'Enter delivery details', state: 'done' },
  { id: 'payment', label: 'Payment', copy: 'Choose payment method', state: 'active', number: 2 },
  { id: 'review', label: 'Review', copy: 'Review your order', state: 'pending', number: 3 },
  { id: 'confirmation', label: 'Confirmation', copy: 'Order placed successfully', state: 'pending', number: 4 },
]

function formatKes(amount) {
  return `KES ${amount.toLocaleString()}`
}

function CampusCartPaymentPage() {
  const navigate = useNavigate()
  const subtotal = ORDER_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = 150
  const platformFee = 100
  const total = subtotal + deliveryFee + platformFee

  return (
    <main className="campus-page campus-cart-page campus-checkout-page">
      <Seo
        title={CAMPUS_CART_PAYMENT_SEO.title}
        description={CAMPUS_CART_PAYMENT_SEO.description}
        path={CAMPUS_CART_PAYMENT_SEO.path}
        keywords={CAMPUS_CART_PAYMENT_SEO.keywords}
        jsonLd={[CAMPUS_CART_PAYMENT_SEO.pageJsonLd]}
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

            <header className="campus-checkout-header">
              <div className="campus-cart-head-copy">
                <p className="campus-cart-breadcrumb">
                  <span>Campus</span>
                  <FiChevronRight aria-hidden="true" />
                  <span>Cart</span>
                  <FiChevronRight aria-hidden="true" />
                  <strong>Checkout</strong>
                </p>
                <h1>Payment</h1>
                <p>Choose your preferred payment method and complete your purchase securely.</p>
              </div>
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

            <section className="campus-checkout-panel">
              <h2>Choose Payment Method</h2>

              <article className="campus-payment-method-card is-selected">
                <header>
                  <div>
                    <span className="campus-payment-radio" aria-hidden="true" />
                    <div>
                      <h3>Card Payment</h3>
                      <p>Visa, Mastercard, Maestro</p>
                    </div>
                  </div>
                  <strong>VISA • Mastercard</strong>
                </header>

                <div className="campus-payment-form-grid">
                  <label>
                    <span>Card Number</span>
                    <input type="text" value="1234 5678 9012 3456" readOnly />
                  </label>
                  <label>
                    <span>Expiry Date</span>
                    <input type="text" value="MM / YY" readOnly />
                  </label>
                  <label>
                    <span>CVV</span>
                    <input type="text" value="123" readOnly />
                  </label>
                  <label className="is-full">
                    <span>Name on Card</span>
                    <input type="text" value="Brian Mwangi" readOnly />
                  </label>
                </div>
              </article>

              <article className="campus-payment-method-card">
                <header>
                  <div>
                    <span className="campus-payment-radio is-empty" aria-hidden="true" />
                    <div>
                      <h3>Mobile Money (M-Pesa)</h3>
                      <p>Pay securely using M-Pesa</p>
                    </div>
                  </div>
                  <strong>M-Pesa</strong>
                </header>
              </article>

              <article className="campus-payment-method-card">
                <header>
                  <div>
                    <span className="campus-payment-radio is-empty" aria-hidden="true" />
                    <div>
                      <h3>Apple Pay</h3>
                      <p>Pay quickly and securely</p>
                    </div>
                  </div>
                  <strong>Apple Pay</strong>
                </header>
              </article>

              <article className="campus-payment-method-card">
                <header>
                  <div>
                    <span className="campus-payment-radio is-empty" aria-hidden="true" />
                    <div>
                      <h3>Bank Transfer</h3>
                      <p>Pay via bank transfer</p>
                    </div>
                  </div>
                  <strong>Bank</strong>
                </header>
              </article>

              <article className="campus-checkout-security-box">
                <FiShield aria-hidden="true" />
                <div>
                  <h3>Your payment is secure</h3>
                  <p>We use industry-standard encryption to protect your information.</p>
                </div>
              </article>

              <footer className="campus-checkout-actions">
                <button type="button" className="campus-checkout-back-btn" onClick={() => navigate('/campus/cart')}>
                  <FiArrowRight aria-hidden="true" />
                  Back to Delivery
                </button>

                <button type="button" className="campus-checkout-next-btn" onClick={() => navigate('/campus/cart/review')}>
                  Review Order
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
                <Link to="/campus/cart">Edit Cart</Link>
              </header>

              <div className="campus-checkout-mini-items">
                {ORDER_ITEMS.map((item) => (
                  <article key={item.id}>
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div>
                      <h3>{item.title}</h3>
                      <p>Qty: {item.qty}</p>
                    </div>
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

export default CampusCartPaymentPage
