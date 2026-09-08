import { useState } from 'react'
import { FiArrowDownLeft, FiArrowUpRight, FiClock, FiCreditCard, FiDollarSign, FiRefreshCw, FiShield, FiTrendingUp, FiX } from 'react-icons/fi'
import './PageFinancePanel.css'

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function PageFinancePanel({ error = '', finance, loading = false, onRefresh, onWithdraw }) {
  const [withdrawal, setWithdrawal] = useState(null)
  const [form, setForm] = useState({ amount: '', method: 'mpesa', destination: '' })
  const [working, setWorking] = useState(false)
  const [formError, setFormError] = useState('')

  async function submitWithdrawal(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount > Number(finance?.availableBalance || 0)) {
      setFormError('Enter an amount within the page’s available balance.')
      return
    }
    setWorking(true)
    setFormError('')
    try {
      await onWithdraw({ ...form, amount, currency: finance.currency })
      setWithdrawal(null)
      setForm({ amount: '', method: 'mpesa', destination: '' })
    } catch (requestError) {
      setFormError(requestError.message || 'The withdrawal could not be requested.')
    } finally { setWorking(false) }
  }

  if (loading && !finance) return <section className="page-finance-panel"><div className="page-finance-empty">Loading page finances…</div></section>
  if (error && !finance) return <section className="page-finance-panel"><div className="page-finance-empty is-error"><strong>Finances unavailable</strong><p>{error}</p><button onClick={onRefresh} type="button">Try again</button></div></section>
  if (!finance) return null

  return <section className="page-finance-panel">
    <header className="page-finance-heading"><div><span>Page finance</span><h2>{finance.page?.name} earnings</h2><p>Track money earned by this page, funds still protected in escrow, and withdrawal activity.</p></div><button onClick={onRefresh} type="button"><FiRefreshCw /> Refresh</button></header>
    {error ? <p className="page-finance-feedback" role="alert">{error}</p> : null}
    <section className="page-finance-balance">
      <div><span>Available to withdraw</span><strong>{money(finance.availableBalance, finance.currency)}</strong><p>Released page earnings that are still available in the owner wallet.</p></div>
      <button disabled={Number(finance.availableBalance || 0) <= 0} onClick={() => { setWithdrawal(true); setForm((current) => ({ ...current, amount: String(finance.availableBalance || '') })) }} type="button"><FiArrowUpRight /> Withdraw</button>
    </section>
    <div className="page-finance-metrics">
      <article><span><FiClock /></span><div><small>Pending in escrow</small><strong>{money(finance.pendingBalance, finance.currency)}</strong><p>Released after verified delivery</p></div></article>
      <article><span><FiTrendingUp /></span><div><small>Lifetime page income</small><strong>{money(finance.lifetimeIncome, finance.currency)}</strong><p>Completed marketplace sales</p></div></article>
      <article><span><FiCreditCard /></span><div><small>Withdrawals processing</small><strong>{money(finance.processingWithdrawals, finance.currency)}</strong><p>Reserved for the payout queue</p></div></article>
    </div>
    <section className="page-finance-streams"><header><div><span>Income streams</span><h3>Where this page earns</h3></div></header><div className="page-finance-stream-list">{(finance.incomeStreams || []).map((stream) => <article key={stream.id}><span className={`is-${stream.status}`}><FiDollarSign /></span><div><strong>{stream.label}</strong><small>{stream.status === 'pending' ? 'Awaiting fulfilment and confirmation' : 'Successfully released'}</small></div><b>{money(stream.amount, finance.currency)}</b></article>)}</div></section>
    <section className="page-finance-ledger"><header><div><span>Activity</span><h3>Income and withdrawals</h3></div><FiShield /></header>{finance.entries?.length ? <div>{finance.entries.map((entry) => <article key={entry.id}><span className={`is-${entry.type}`}>{entry.amount >= 0 ? <FiArrowDownLeft /> : <FiArrowUpRight />}</span><div><strong>{entry.label}</strong><small>{entry.detail} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}</small></div><em className={`is-${entry.status}`}>{entry.status}</em><b className={entry.amount < 0 ? 'is-debit' : ''}>{entry.amount < 0 ? '−' : '+'}{money(Math.abs(entry.amount), entry.currency || finance.currency)}</b></article>)}</div> : <div className="page-finance-empty">This page has no financial activity yet.</div>}</section>
    {withdrawal ? <div className="page-finance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !working) setWithdrawal(null) }}><form aria-labelledby="page-withdraw-title" aria-modal="true" className="page-finance-modal" onSubmit={submitWithdrawal} role="dialog"><button aria-label="Close withdrawal" className="page-finance-modal-close" disabled={working} onClick={() => setWithdrawal(null)} type="button"><FiX /></button><span className="page-finance-modal-icon"><FiArrowUpRight /></span><h3 id="page-withdraw-title">Withdraw page earnings</h3><p>The amount is reserved immediately and sent to the finance payout queue for processing.</p><label><span>Amount</span><div className="page-finance-amount-input"><b>{finance.currency}</b><input min="1" max={finance.availableBalance} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required step="1" type="number" value={form.amount} /></div></label><label><span>Payout method</span><select onChange={(event) => setForm((current) => ({ ...current, method: event.target.value, destination: '' }))} value={form.method}><option value="mpesa">M-Pesa</option><option value="bank">Bank account</option></select></label><label><span>{form.method === 'mpesa' ? 'M-Pesa phone number' : 'Bank account details'}</span><input onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))} placeholder={form.method === 'mpesa' ? '+254 7XX XXX XXX' : 'Bank · account number'} required value={form.destination} /></label>{formError ? <p className="page-finance-modal-error" role="alert">{formError}</p> : null}<button className="page-finance-modal-submit" disabled={working} type="submit">{working ? 'Requesting…' : 'Request withdrawal'}</button><footer><FiShield /> Finance staff can see and process this request. It is not marked paid until payout processing is completed.</footer></form></div> : null}
  </section>
}

export default PageFinancePanel
