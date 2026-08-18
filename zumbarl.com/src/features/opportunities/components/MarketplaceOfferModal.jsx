import { useEffect, useState } from 'react'
import { FiSend, FiTag, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import '../../../styles/opportunities.css'

function MarketplaceOfferModal({ initialAmount = '', isOpen, item, onClose, onSubmit, seller }) {
  const dialogRef = useDialog({ isOpen, onClose })
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) setAmount(initialAmount ? String(initialAmount) : '')
  }, [initialAmount, isOpen])

  function closeModal() {
    if (isSending) return
    setAmount('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(event) {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid offer amount greater than zero.')
      return
    }
    setIsSending(true)
    setError('')
    try {
      await onSubmit(numericAmount)
      setAmount('')
    } catch (requestError) {
      setError(requestError.message || 'Could not send your offer.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section
      ref={dialogRef}
      className="marketplace-offer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Make an offer for ${item.title}`}
      onClick={closeModal}
    >
      <form className="marketplace-offer-modal" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
        <header>
          <span><FiTag aria-hidden="true" /></span>
          <div><small>{initialAmount ? 'Edit your offer' : 'Make an offer'}</small><h2>{item.title}</h2></div>
          <button type="button" onClick={closeModal} aria-label="Close offer"><FiX aria-hidden="true" /></button>
        </header>

        <div className="marketplace-offer-product">
          <img src={item.image} alt="" />
          <div><strong>{item.price}</strong><span>Seller: {seller.name}</span></div>
        </div>

        <label htmlFor="marketplace-offer-amount">
          Your offer
          <span><b>KSh</b><input id="marketplace-offer-amount" type="number" min="1" step="1" inputMode="numeric" autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" /></span>
        </label>
        <p>The seller will receive your offer in Messages and as a notification.</p>
        {error ? <p className="marketplace-offer-error" role="alert">{error}</p> : null}

        <footer>
          <button type="button" onClick={closeModal}>Cancel</button>
          <button type="submit" disabled={isSending || !amount}><FiSend aria-hidden="true" />{isSending ? 'Sending…' : 'Send offer'}</button>
        </footer>
      </form>
    </section>
  )
}

export default MarketplaceOfferModal
