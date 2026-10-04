import { useEffect, useState } from 'react'
import { FiArrowRight, FiCreditCard, FiShield } from 'react-icons/fi'
import { readMyFinanceWallets } from '../../opportunities/services/marketplaceInteractionService'

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: currency || 'KES' }).format(Number(amount || 0))
}

export function PaymentMethodPanel({ onBack, onNext, total = 0 }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    readMyFinanceWallets()
      .then((response) => {
        if (!active) return
        const wallets = Array.isArray(response?.data) ? response.data : []
        setWallet(wallets.find((item) => item.type === 'MAIN') || wallets[0] || null)
      })
      .catch((requestError) => {
        if (!active) return
        setWallet(null)
        setError(requestError.message || 'Your wallet could not be loaded.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const availableBalance = Number(wallet?.availableBalance ?? wallet?.balance ?? 0)
  const hasEnoughBalance = Boolean(wallet) && availableBalance >= Number(total || 0)

  return (
    <section className="campus-checkout-panel">
      <h2>Choose Payment Method</h2>

      <article className="campus-payment-method-card is-selected">
        <header>
          <div>
            <span className="campus-payment-radio" aria-hidden="true" />
            <div>
              <h3>Zumbarl Wallet</h3>
              <p>The final order total is deducted atomically when you place the order.</p>
            </div>
          </div>
          <strong><FiCreditCard aria-hidden="true" /> WALLET</strong>
        </header>
        <div className="campus-payment-form-grid">
          <label className="is-full">
            <span>Available balance</span>
            <input type="text" value={loading ? 'Loading…' : wallet ? formatMoney(wallet.availableBalance ?? wallet.balance, wallet.currency) : 'Wallet unavailable'} readOnly />
          </label>
        </div>
      </article>

      <article className="campus-checkout-security-box">
        <FiShield aria-hidden="true" />
        <div>
          <h3>Your payment is secure</h3>
          <p>The server rechecks your balance, item prices, delivery fees, and stock together before any money moves.</p>
        </div>
      </article>

      {error ? <p className="campus-checkout-order-error" role="alert">{error}</p> : null}
      {!loading && wallet && !hasEnoughBalance ? <p className="campus-checkout-order-error" role="alert">Your available wallet balance does not cover this order total.</p> : null}

      <footer className="campus-checkout-actions">
        <button type="button" className="campus-checkout-back-btn" onClick={onBack}>
          <FiArrowRight aria-hidden="true" />
          Back to Delivery
        </button>

        <button type="button" className="campus-checkout-next-btn" disabled={loading || !hasEnoughBalance} onClick={onNext}>
          Review Order
          <FiArrowRight aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}
