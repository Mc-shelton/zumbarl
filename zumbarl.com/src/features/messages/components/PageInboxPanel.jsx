import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiInbox, FiMessageCircle, FiPackage, FiRefreshCw, FiSend } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { listPageConversations, listPageMessages, sendPageMessage } from '../services/messageService'
import { decideMarketplaceOffer, readMarketplaceOffer } from '../../opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import '../../../styles/page-inbox.css'

function time(value) {
  return new Date(value).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
}

function money(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function upsertPageConversation(items, incoming) {
  if (!incoming?.id) return items
  const next = items.some((item) => item.id === incoming.id)
    ? items.map((item) => item.id === incoming.id ? { ...item, ...incoming } : item)
    : [incoming, ...items]
  return next.sort((left, right) => (
    new Date(right.latestMessage?.createdAt || 0).getTime()
      - new Date(left.latestMessage?.createdAt || 0).getTime()
  ))
}

function PageInboxPanel({ pageType, pageId, pageName }) {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('Loading page conversations…')
  const [sending, setSending] = useState(false)
  const [offerStates, setOfferStates] = useState({})
  const [decidingOfferId, setDecidingOfferId] = useState('')
  const active = conversations.find((conversation) => conversation.id === activeId) || conversations[0]
  const latestOfferMessageIds = useMemo(() => new Set(Object.values(messages.reduce((latest, message) => {
    const offerId = message.context?.offer?.id
    return offerId ? { ...latest, [offerId]: message.id } : latest
  }, {}))), [messages])

  const loadConversations = useCallback(async () => {
    try {
      const response = await listPageConversations({ pageType, pageId })
      const next = response.data || []
      setConversations(next)
      setActiveId((current) => next.some((item) => item.id === current) ? current : next[0]?.id || '')
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Page conversations could not be loaded.')
    }
  }, [pageId, pageType])

  useEffect(() => {
    const loadId = window.setTimeout(loadConversations, 0)
    return () => window.clearTimeout(loadId)
  }, [loadConversations])

  useEffect(() => {
    if (!active?.id) {
      return
    }
    listPageMessages(active.id)
      .then((response) => {
        setMessages(response || [])
        window.dispatchEvent(new Event('zumbarl:messages-read'))
      })
      .catch((error) => setStatus(error.message || 'This conversation could not be loaded.'))
  }, [active?.id])

  useEffect(() => {
    const offerIds = [...new Set(messages.map((message) => message.context?.offer?.id).filter(Boolean))]
    if (!offerIds.length) return
    Promise.all(offerIds.map((id) => readMarketplaceOffer(id).then((response) => response.offer).catch(() => null)))
      .then((offers) => setOfferStates((current) => offers.reduce((next, offer) => (
        offer ? { ...next, [offer.id]: offer } : next
      ), current)))
  }, [messages])

  useEffect(() => {
    const refresh = (event) => {
      const detail = event.detail
      const incoming = detail?.conversation || (detail?.kind === 'page' ? detail : null)
      if (incoming?.page?.id === pageId && incoming.page.type === pageType) {
        setConversations((current) => upsertPageConversation(current, {
          ...incoming,
          unreadCount: incoming.id === active?.id ? 0 : incoming.unreadCount,
        }))
        setActiveId((current) => current || incoming.id)
      }
      loadConversations()
      if ((detail?.conversationId || detail?.id) === active?.id) {
        listPageMessages(active.id).then((response) => {
          setMessages(response || [])
          window.dispatchEvent(new Event('zumbarl:messages-read'))
        }).catch(() => {})
      }
    }
    window.addEventListener('zumbarl:page-message-created', refresh)
    window.addEventListener('zumbarl:page-conversation-created', refresh)
    return () => {
      window.removeEventListener('zumbarl:page-message-created', refresh)
      window.removeEventListener('zumbarl:page-conversation-created', refresh)
    }
  }, [active?.id, loadConversations, pageId, pageType])

  async function submit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !active || sending) return
    setSending(true)
    setStatus('')
    try {
      const message = await sendPageMessage(active.id, { body, sendAsPage: true })
      setMessages((current) => [...current, message])
      setDraft('')
      await loadConversations()
    } catch (error) {
      setStatus(error.message || 'Your reply could not be sent.')
    } finally {
      setSending(false)
    }
  }

  async function decideOffer(offerId, decision) {
    if (decidingOfferId) return
    setDecidingOfferId(offerId)
    setStatus('')
    try {
      const response = await decideMarketplaceOffer(offerId, decision)
      setOfferStates((current) => ({ ...current, [offerId]: response.offer }))
    } catch (error) {
      setStatus(error.message || 'The offer could not be updated.')
    } finally {
      setDecidingOfferId('')
    }
  }

  return <section className="page-inbox">
    <header className="page-inbox-heading">
      <div><span>Shared page inbox</span><h2>Messages</h2><p>Every page admin sees the same customer threads. Replies are sent as {pageName}.</p></div>
      <button type="button" onClick={loadConversations}><FiRefreshCw /> Refresh</button>
    </header>
    {status ? <p className="page-inbox-status" role="status">{status}</p> : null}
    <div className="page-inbox-workspace">
      <aside>
        {conversations.map((conversation) => <button className={conversation.id === active?.id ? 'is-active' : ''} key={conversation.id} onClick={() => setActiveId(conversation.id)} type="button">
          <span className="page-inbox-avatar">{normalizeZumbarlFileUrl(conversation.customer?.avatarUrl) ? <img alt="" src={normalizeZumbarlFileUrl(conversation.customer.avatarUrl)} /> : conversation.customer?.name?.slice(0, 1)}</span>
          <span><strong>{conversation.customer?.name}</strong><small>{conversation.latestMessage?.body}</small></span>
          {conversation.unreadCount ? <em>{conversation.unreadCount}</em> : null}
        </button>)}
        {!conversations.length && !status ? <div className="page-inbox-empty"><FiInbox /><strong>No page messages yet</strong><p>Customer conversations will arrive here and in every admin’s main inbox.</p></div> : null}
      </aside>
      <section className="page-inbox-thread">
        {active ? <>
          <header>
            {active.customer?.studentId ? <Link className="page-inbox-customer-link" to={`/campus/profiles/${encodeURIComponent(active.customer.studentId)}`} aria-label={`View ${active.customer.name}'s profile`}>
              <span className="page-inbox-avatar">{normalizeZumbarlFileUrl(active.customer?.avatarUrl) ? <img alt="" src={normalizeZumbarlFileUrl(active.customer.avatarUrl)} /> : active.customer?.name?.slice(0, 1)}</span>
              <span><strong>{active.customer?.name}</strong><small>Replying as {active.page?.name}</small></span>
            </Link> : <div className="page-inbox-customer-link is-static">
              <span className="page-inbox-avatar">{normalizeZumbarlFileUrl(active.customer?.avatarUrl) ? <img alt="" src={normalizeZumbarlFileUrl(active.customer.avatarUrl)} /> : active.customer?.name?.slice(0, 1)}</span>
              <span><strong>{active.customer?.name}</strong><small>Replying as {active.page?.name}</small></span>
            </div>}
          </header>
          <div className="page-inbox-messages">
            {messages.map((message) => {
              const fromPage = message.senderKind === 'page'
              const order = message.context?.order
              const product = message.context?.product
              const offer = message.context?.offer?.id ? offerStates[message.context.offer.id] : null
              return <article className={fromPage ? 'is-page' : ''} key={message.id}>
                <div>
                  {order ? <Link className="page-inbox-order-card" to={order.pageHref || order.recipientHref}>
                    <span>{order.image ? <img alt="" src={normalizeZumbarlFileUrl(order.image)} /> : <FiPackage />}</span><span><small>MARKETPLACE ORDER · {order.identifier}</small><strong>{order.title}</strong><b>{order.total ? `${money(order.total, order.currency)} · ` : ''}{String(order.status).replaceAll('_', ' ')}</b></span><FiArrowRight />
                  </Link> : null}
                  {product ? <>
                    <Link className="page-inbox-context-card" to={product.href}>
                      <span>{product.image ? <img alt="" src={normalizeZumbarlFileUrl(product.image)} /> : <FiPackage />}</span>
                      <span><small>{message.context.type === 'marketplace_offer' ? 'MARKETPLACE OFFER' : 'MARKETPLACE LISTING'}</small><strong>{product.title}</strong><b>{message.context.offer ? money(message.context.offer.amount, message.context.offer.currency) : product.price}</b></span>
                      <FiArrowRight />
                    </Link>
                    {offer && latestOfferMessageIds.has(message.id) ? <div className="page-inbox-offer-actions">
                      <span className={`is-${offer.status}`}>{offer.status}</span>
                      {offer.status === 'pending' ? <><button disabled={decidingOfferId === offer.id} onClick={() => decideOffer(offer.id, 'declined')} type="button">Decline</button><button disabled={decidingOfferId === offer.id} onClick={() => decideOffer(offer.id, 'accepted')} type="button">Accept</button></> : null}
                    </div> : null}
                  </> : null}
                  <p>{message.body}</p><time>{time(message.createdAt)}</time>
                </div>
              </article>
            })}
          </div>
          <form onSubmit={submit}><input aria-label="Reply as page" onChange={(event) => setDraft(event.target.value)} placeholder={`Reply as ${active.page?.name || pageName}`} value={draft} /><button aria-label="Send reply" disabled={sending || !draft.trim()} type="submit"><FiSend /></button></form>
        </> : <div className="page-inbox-empty is-thread"><FiMessageCircle /><strong>Select a conversation</strong><p>Open a customer thread to reply as this page.</p></div>}
      </section>
    </div>
  </section>
}

export default PageInboxPanel
