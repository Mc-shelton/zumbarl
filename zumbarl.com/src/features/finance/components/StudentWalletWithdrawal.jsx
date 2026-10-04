import { useState } from 'react'
import { FiArrowUpRight, FiCheckCircle, FiShield, FiX } from 'react-icons/fi'
import { requestStudentMpesaPayout, waitForMpesaPayout } from '../services/mpesaPaymentService'
import './StudentWalletWithdrawal.css'

function StudentWalletWithdrawal({ availableBalance = 0, currency = 'KES', onCompleted }) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const normalizedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '254')
  const validPhone = /^254(?:1|7)\d{8}$/.test(normalizedPhone)
  const numericAmount = Number(amount)
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= Number(availableBalance)

  function close() {
    if (isWorking) return
    setIsOpen(false)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (!validAmount || !validPhone || isWorking) return
    setIsWorking(true)
    setError('')
    setNotice('Sending the payout request to M-Pesa…')
    try {
      const response = await requestStudentMpesaPayout({
        amount: numericAmount,
        currency,
        phoneNumber,
        reference: `wallet-withdrawal-${Date.now()}`,
      })
      if (!response?.payment?.id) throw new Error('The payout request did not return a tracking reference.')
      setNotice('M-Pesa is processing your withdrawal. Keep this page open…')
      const payment = response.payment.status === 'COMPLETED'
        ? response.payment
        : await waitForMpesaPayout(response.payment.id)
      setNotice(`${currency} ${Number(payment.amount).toLocaleString()} sent successfully. Receipt: ${payment.providerReceipt}`)
      setAmount('')
      setIsOpen(false)
      await onCompleted?.(payment)
    } catch (requestError) {
      setNotice('')
      setError(requestError.message || 'The M-Pesa withdrawal could not be completed.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="student-wallet-withdrawal">
      <button
        type="button"
        className="project-soft-btn student-wallet-withdraw-button"
        disabled={Number(availableBalance) <= 0}
        onClick={() => { setIsOpen(true); setError(''); setNotice('') }}
      >
        Withdraw to M-Pesa <FiArrowUpRight aria-hidden="true" />
      </button>
      {notice ? <p className="student-wallet-withdraw-notice" role="status"><FiCheckCircle /> {notice}</p> : null}
      {error && !isOpen ? <p className="student-wallet-withdraw-error" role="alert">{error}</p> : null}
      {isOpen ? (
        <div className="student-wallet-withdraw-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <form className="student-wallet-withdraw-modal" role="dialog" aria-modal="true" aria-labelledby="student-wallet-withdraw-title" onSubmit={submit}>
            <button type="button" className="student-wallet-withdraw-close" aria-label="Close withdrawal" disabled={isWorking} onClick={close}><FiX /></button>
            <span className="student-wallet-withdraw-icon"><FiArrowUpRight /></span>
            <h3 id="student-wallet-withdraw-title">Withdraw to M-Pesa</h3>
            <p>Your wallet is reserved immediately. If M-Pesa rejects or times out, the full amount returns automatically.</p>
            <label>
              <span>Amount</span>
              <div><b>{currency}</b><input type="number" min="1" max={availableBalance} step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
              <em>Available: {currency} {Number(availableBalance).toLocaleString()}</em>
            </label>
            <label>
              <span>M-Pesa phone number</span>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} aria-invalid={Boolean(phoneNumber) && !validPhone} />
              {phoneNumber && !validPhone ? <em className="is-error">Enter a valid Kenyan Safaricom number.</em> : null}
            </label>
            {error ? <p className="student-wallet-withdraw-error" role="alert">{error}</p> : null}
            <button type="submit" disabled={!validAmount || !validPhone || isWorking}>{isWorking ? 'Waiting for M-Pesa…' : 'Confirm withdrawal'}</button>
            <footer><FiShield /> Payout is marked complete only after Safaricom returns a matching receipt.</footer>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default StudentWalletWithdrawal
