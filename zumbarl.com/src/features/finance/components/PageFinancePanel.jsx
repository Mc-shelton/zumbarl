import { useState } from 'react'
import { FiArrowDownLeft, FiArrowUpRight, FiCheck, FiClock, FiCreditCard, FiDollarSign, FiRefreshCw, FiSearch, FiShield, FiTrendingUp, FiUser, FiUsers, FiX } from 'react-icons/fi'
import './PageFinancePanel.css'

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function recipientInitials(recipient) {
  return String(recipient?.name || recipient?.username || 'Z')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function RecipientAvatar({ recipient }) {
  if (recipient?.avatarUrl) return <img alt="" src={recipient.avatarUrl} />
  return <span aria-hidden="true">{recipientInitials(recipient)}</span>
}

const emptyForm = {
  amount: '',
  method: 'mpesa',
  destination: '',
  recipientMode: 'self',
  recipient: null,
}

function PageFinancePanel({ error = '', finance, loading = false, onRefresh, onSearchRecipients, onWithdraw }) {
  const [withdrawal, setWithdrawal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientCandidates, setRecipientCandidates] = useState([])
  const [recipientSearchStatus, setRecipientSearchStatus] = useState('')
  const [working, setWorking] = useState(false)
  const [formError, setFormError] = useState('')

  function closeWithdrawal() {
    if (working) return
    setWithdrawal(false)
    setForm(emptyForm)
    setRecipientQuery('')
    setRecipientCandidates([])
    setRecipientSearchStatus('')
    setFormError('')
  }

  function openWithdrawal() {
    const recipientMode = finance.viewer ? 'self' : 'other'
    setForm({ ...emptyForm, amount: String(finance.availableBalance || ''), recipientMode })
    setWithdrawal(true)
  }

  function chooseRecipientMode(recipientMode) {
    setForm((current) => ({ ...current, recipientMode, recipient: null }))
    setRecipientQuery('')
    setRecipientCandidates([])
    setRecipientSearchStatus('')
    setFormError('')
  }

  async function searchRecipients() {
    const query = recipientQuery.trim()
    if (query.length < 2) {
      setRecipientSearchStatus('Enter at least 2 characters.')
      setRecipientCandidates([])
      return
    }
    setRecipientSearchStatus('Searching Zumbarl…')
    try {
      const response = await onSearchRecipients(query)
      const candidates = (response?.candidates || []).filter((candidate) => candidate.id !== finance.viewer?.id)
      setRecipientCandidates(candidates)
      setRecipientSearchStatus(candidates.length ? '' : 'No matching users found.')
    } catch (searchError) {
      setRecipientCandidates([])
      setRecipientSearchStatus(searchError.message || 'Users could not be loaded.')
    }
  }

  async function submitWithdrawal(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    const recipient = form.recipientMode === 'self' ? finance.viewer : form.recipient
    if (!recipient) {
      setFormError('Choose the Zumbarl user who should receive this payout.')
      return
    }
    if (!amount || amount > Number(finance?.availableBalance || 0)) {
      setFormError('Enter an amount within the page’s available balance.')
      return
    }
    setWorking(true)
    setFormError('')
    try {
      await onWithdraw({
        amount,
        currency: finance.currency,
        method: form.method,
        destination: form.destination,
        recipientUserId: recipient.id,
      })
      setWithdrawal(false)
      setForm(emptyForm)
      setRecipientQuery('')
      setRecipientCandidates([])
      setRecipientSearchStatus('')
    } catch (requestError) {
      setFormError(requestError.message || 'The withdrawal could not be requested.')
    } finally {
      setWorking(false)
    }
  }

  if (loading && !finance) return <section className="page-finance-panel"><div className="page-finance-empty">Loading page finances…</div></section>
  if (error && !finance) return <section className="page-finance-panel"><div className="page-finance-empty is-error"><strong>Finances unavailable</strong><p>{error}</p><button onClick={onRefresh} type="button">Try again</button></div></section>
  if (!finance) return null

  const selectedRecipient = form.recipientMode === 'self' ? finance.viewer : form.recipient

  return <section className="page-finance-panel">
    <header className="page-finance-heading"><div><span>Page finance</span><h2>{finance.page?.name} earnings</h2><p>Track money earned by this page, funds still protected in escrow, and withdrawal activity.</p></div><button onClick={onRefresh} type="button"><FiRefreshCw /> Refresh</button></header>
    {error ? <p className="page-finance-feedback" role="alert">{error}</p> : null}
    <section className="page-finance-balance">
      <div><span>Available to withdraw</span><strong>{money(finance.availableBalance, finance.currency)}</strong><p>Released page earnings that are still available in the owner wallet.</p></div>
      <button disabled={Number(finance.availableBalance || 0) <= 0} onClick={openWithdrawal} type="button"><FiArrowUpRight /> Withdraw</button>
    </section>
    <div className="page-finance-metrics">
      <article><span><FiClock /></span><div><small>Pending in escrow</small><strong>{money(finance.pendingBalance, finance.currency)}</strong><p>Released after verified delivery</p></div></article>
      <article><span><FiTrendingUp /></span><div><small>Lifetime page income</small><strong>{money(finance.lifetimeIncome, finance.currency)}</strong><p>Completed marketplace sales</p></div></article>
      <article><span><FiCreditCard /></span><div><small>Withdrawals processing</small><strong>{money(finance.processingWithdrawals, finance.currency)}</strong><p>Reserved for the payout queue</p></div></article>
    </div>
    <section className="page-finance-streams"><header><div><span>Income streams</span><h3>Where this page earns</h3></div></header><div className="page-finance-stream-list">{(finance.incomeStreams || []).map((stream) => <article key={stream.id}><span className={`is-${stream.status}`}><FiDollarSign /></span><div><strong>{stream.label}</strong><small>{stream.status === 'pending' ? 'Awaiting fulfilment and confirmation' : 'Successfully released'}</small></div><b>{money(stream.amount, finance.currency)}</b></article>)}</div></section>
    <section className="page-finance-ledger"><header><div><span>Activity</span><h3>Income and withdrawals</h3></div><FiShield /></header>{finance.entries?.length ? <div>{finance.entries.map((entry) => <article key={entry.id}><span className={`is-${entry.type}`}>{entry.amount >= 0 ? <FiArrowDownLeft /> : <FiArrowUpRight />}</span><div><strong>{entry.label}</strong><small>{entry.detail} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}</small></div><em className={`is-${entry.status}`}>{entry.status}</em><b className={entry.amount < 0 ? 'is-debit' : ''}>{entry.amount < 0 ? '−' : '+'}{money(Math.abs(entry.amount), entry.currency || finance.currency)}</b></article>)}</div> : <div className="page-finance-empty">This page has no financial activity yet.</div>}</section>

    {withdrawal ? <div className="page-finance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeWithdrawal() }}>
      <form aria-labelledby="page-withdraw-title" aria-modal="true" className="page-finance-modal" onSubmit={submitWithdrawal} role="dialog">
        <button aria-label="Close withdrawal" className="page-finance-modal-close" disabled={working} onClick={closeWithdrawal} type="button"><FiX /></button>
        <span className="page-finance-modal-icon"><FiArrowUpRight /></span>
        <h3 id="page-withdraw-title">Withdraw page earnings</h3>
        <p>Choose who receives the payout. The page remains the source of the funds.</p>

        <fieldset className="page-finance-recipient-fieldset">
          <legend>Pay to</legend>
          <div className="page-finance-recipient-modes">
            <button className={form.recipientMode === 'self' ? 'is-active' : ''} disabled={!finance.viewer} onClick={() => chooseRecipientMode('self')} type="button"><FiUser /> Myself</button>
            <button className={form.recipientMode === 'other' ? 'is-active' : ''} onClick={() => chooseRecipientMode('other')} type="button"><FiUsers /> Someone else</button>
          </div>

          {form.recipientMode === 'self' && finance.viewer ? <div className="page-finance-selected-recipient"><RecipientAvatar recipient={finance.viewer} /><div><strong>{finance.viewer.name}</strong><small>{finance.viewer.username ? `@${finance.viewer.username}` : 'Your Zumbarl account'}</small></div><FiCheck /></div> : null}

          {form.recipientMode === 'other' ? <div className="page-finance-recipient-search">
            {form.recipient ? <div className="page-finance-selected-recipient"><RecipientAvatar recipient={form.recipient} /><div><strong>{form.recipient.name}</strong><small>{form.recipient.username ? `@${form.recipient.username}` : form.recipient.campus || 'Zumbarl member'}</small></div><FiCheck /></div> : null}
            <div className="page-finance-search-row"><FiSearch /><input aria-label="Search payout recipient" onChange={(event) => { setRecipientQuery(event.target.value); setForm((current) => ({ ...current, recipient: null })); setRecipientCandidates([]); setRecipientSearchStatus('') }} placeholder="Search name, username or email" value={recipientQuery} /><button disabled={!onSearchRecipients} onClick={searchRecipients} type="button">Search</button></div>
            {recipientSearchStatus ? <small className="page-finance-search-status">{recipientSearchStatus}</small> : null}
            {recipientCandidates.length ? <div className="page-finance-recipient-results">{recipientCandidates.map((candidate) => <button key={candidate.id} onClick={() => { setForm((current) => ({ ...current, recipient: candidate })); setRecipientQuery(candidate.name); setRecipientCandidates([]); setRecipientSearchStatus('') }} type="button"><RecipientAvatar recipient={candidate} /><span><strong>{candidate.name}</strong><small>{candidate.username ? `@${candidate.username}` : candidate.campus || 'Zumbarl member'}</small></span>{form.recipient?.id === candidate.id ? <FiCheck /> : null}</button>)}</div> : null}
          </div> : null}
        </fieldset>

        <label><span>Amount</span><div className="page-finance-amount-input"><b>{finance.currency}</b><input min="1" max={finance.availableBalance} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required step="1" type="number" value={form.amount} /></div></label>
        <label><span>Payout method</span><select onChange={(event) => setForm((current) => ({ ...current, method: event.target.value, destination: '' }))} value={form.method}><option value="mpesa">M-Pesa</option><option value="bank">Bank account</option></select></label>
        <label><span>{form.method === 'mpesa' ? 'Recipient’s M-Pesa number' : 'Recipient’s bank account details'}</span><input onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))} placeholder={form.method === 'mpesa' ? '+254 7XX XXX XXX' : 'Bank · account number'} required value={form.destination} /></label>
        {selectedRecipient ? <p className="page-finance-recipient-note"><FiShield /> This payout will be recorded for <strong>{selectedRecipient.name}</strong>.</p> : null}
        {formError ? <p className="page-finance-modal-error" role="alert">{formError}</p> : null}
        <button className="page-finance-modal-submit" disabled={working || !selectedRecipient} type="submit">{working ? 'Requesting…' : 'Request withdrawal'}</button>
        <footer><FiShield /> Finance staff can see the page, requester, recipient and payout destination. It is not marked paid until processing is completed.</footer>
      </form>
    </div> : null}
  </section>
}

export default PageFinancePanel
