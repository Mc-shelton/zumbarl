import { FiCheck, FiCreditCard, FiLock, FiX } from 'react-icons/fi'
import './knowledge-resource-checkout.css'

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

export default function KnowledgeResourceCheckoutModal({ checkout, error, working, onClose, onConfirm }) {
  if (!checkout) return null
  const { resource, payment, wallet } = checkout
  return (
    <div className="knowledge-checkout-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !working) onClose() }}>
      <section className="knowledge-checkout-modal" role="dialog" aria-modal="true" aria-label={`Buy ${resource.title}`}>
        <button type="button" className="knowledge-checkout-close" onClick={onClose} disabled={working} aria-label="Close checkout"><FiX /></button>
        <header><span>Secure checkout</span><h2>Complete your purchase</h2><p>Access is added to your account immediately after payment.</p></header>
        <article className="knowledge-checkout-resource">
          <img src={resource.coverImageUrl} alt="" />
          <div><small>{resource.space?.name || 'Knowledge Hub'}</small><strong>{resource.title}</strong><span>Published by {resource.publisher.name}</span></div>
          <b>{money(payment.amount, payment.currency)}</b>
        </article>
        <div className="knowledge-checkout-method">
          <FiCreditCard /><div><strong>Zumbarl wallet</strong><span>Available balance: {money(wallet.balance, wallet.currency)}</span></div><FiCheck />
        </div>
        {!wallet.sufficient && <p className="knowledge-checkout-error">Your wallet needs {money(Math.max(0, payment.amount - wallet.balance), payment.currency)} more to complete this purchase.</p>}
        {error && <p className="knowledge-checkout-error" role="alert">{error}</p>}
        <dl><div><dt>Resource</dt><dd>{money(payment.amount, payment.currency)}</dd></div><div><dt>Total</dt><dd>{money(payment.amount, payment.currency)}</dd></div></dl>
        <p className="knowledge-checkout-security"><FiLock /> Payment is recorded in your Zumbarl wallet ledger. The publisher is credited immediately.</p>
        <button type="button" className="knowledge-checkout-pay" disabled={working || !wallet.sufficient} onClick={onConfirm}>{working ? 'Processing payment…' : `Pay ${money(payment.amount, payment.currency)}`}</button>
      </section>
    </div>
  )
}
