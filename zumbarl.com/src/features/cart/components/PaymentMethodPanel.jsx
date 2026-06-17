import { FiArrowRight, FiShield } from 'react-icons/fi'

const PAYMENT_METHODS = [
  {
    id: 'card',
    title: 'Card Payment',
    copy: 'Visa, Mastercard, Maestro',
    brand: 'VISA - Mastercard',
    selected: true,
  },
  {
    id: 'mpesa',
    title: 'Mobile Money (M-Pesa)',
    copy: 'Pay securely using M-Pesa',
    brand: 'M-Pesa',
  },
  {
    id: 'apple-pay',
    title: 'Apple Pay',
    copy: 'Pay quickly and securely',
    brand: 'Apple Pay',
  },
  {
    id: 'bank-transfer',
    title: 'Bank Transfer',
    copy: 'Pay via bank transfer',
    brand: 'Bank',
  },
]

export function PaymentMethodPanel({ onBack, onNext }) {
  return (
    <section className="campus-checkout-panel">
      <h2>Choose Payment Method</h2>

      {PAYMENT_METHODS.map((method) => (
        <PaymentMethodCard key={method.id} method={method} />
      ))}

      <article className="campus-checkout-security-box">
        <FiShield aria-hidden="true" />
        <div>
          <h3>Your payment is secure</h3>
          <p>We use industry-standard encryption to protect your information.</p>
        </div>
      </article>

      <footer className="campus-checkout-actions">
        <button type="button" className="campus-checkout-back-btn" onClick={onBack}>
          <FiArrowRight aria-hidden="true" />
          Back to Delivery
        </button>

        <button type="button" className="campus-checkout-next-btn" onClick={onNext}>
          Review Order
          <FiArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}

function PaymentMethodCard({ method }) {
  const cardClassName = `campus-payment-method-card${method.selected ? ' is-selected' : ''}`
  const radioClassName = `campus-payment-radio${method.selected ? '' : ' is-empty'}`

  return (
    <article className={cardClassName}>
      <header>
        <div>
          <span className={radioClassName} aria-hidden="true" />
          <div>
            <h3>{method.title}</h3>
            <p>{method.copy}</p>
          </div>
        </div>
        <strong>{method.brand}</strong>
      </header>

      {method.selected ? (
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
      ) : null}
    </article>
  )
}
