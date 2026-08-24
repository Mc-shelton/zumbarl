import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiPhone, FiPhoneOff, FiSearch, FiSend, FiVideo } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { getCurrentLoginRole } from '../features/auth/roleConfig'
import { listConversations, listMessages, sendMessage } from '../features/messages/services/messageService'
import { cancelCall, createCall, readCall } from '../features/calls/services/callService'
import { openCallOverlay } from '../features/calls/getCallMeetingUrl'
import { playCallRingtone, playMessageSentSound } from '../features/communications/services/communicationSounds'
import { decideMarketplaceOffer, readMarketplaceOffer } from '../features/opportunities/services/marketplaceInteractionService'
import { getAuthUserSnapshot } from '../features/auth/services/authUserService'
import { useViewerProfile } from '../features/auth/viewerProfile'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/messages.css'

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
}

function participantAvatar(participant) {
  return normalizeZumbarlFileUrl(
    participant?.avatarUrl || participant?.avatar || participant?.student?.avatarUrl,
  )
}

function MessagesPage() {
  const [searchParams] = useSearchParams()
  const requestedParticipantId = searchParams.get('participantId') || ''
  const requestedParticipantName = searchParams.get('participantName') || 'New conversation'
  const requestedParticipantAvatar = searchParams.get('participantAvatar') || ''
  const requestedParticipantStudentId = searchParams.get('participantStudentId') || ''
  const requestedCallType = ['audio', 'video'].includes(searchParams.get('call')) ? searchParams.get('call') : ''
  const isBusiness = getCurrentLoginRole().side === 'company'
  const viewerProfile = useViewerProfile()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [offerStates, setOfferStates] = useState({})
  const [offerDecisionId, setOfferDecisionId] = useState('')
  const viewerUserId = getAuthUserSnapshot()?.user?.id || ''
  const [activeCall, setActiveCall] = useState(null)
  const [callStatus, setCallStatus] = useState('')
  const threadBodyRef = useRef(null)
  const messageEndRef = useRef(null)
  const shouldJumpToLatestRef = useRef(false)
  const shouldScrollAfterSendRef = useRef(false)
  const autoCallStartedRef = useRef('')
  const activeConversation = conversations.find((item) => item.id === activeConversationId) || conversations[0]
  const activeParticipantId = activeConversation?.participant.id
  const activeOpportunityId = activeConversation?.opportunityId
  const latestOfferMessageIds = new Set(Object.values(messages.reduce((latest, message) => {
    const offerId = message.context?.offer?.id
    return offerId ? { ...latest, [offerId]: message.id } : latest
  }, {})))

  const applyConversationResponse = useCallback((response) => {
    const loadedConversations = [...(response?.data || []).reduce((grouped, conversation) => {
      const existing = grouped.get(conversation.participant.id)
      if (!existing) {
        grouped.set(conversation.participant.id, { ...conversation, id: conversation.participant.id, opportunityId: null })
      } else {
        grouped.set(conversation.participant.id, {
          ...existing,
          unreadCount: Number(existing.unreadCount || 0) + Number(conversation.unreadCount || 0),
        })
      }
      return grouped
    }, new Map()).values()]
    const hasRequestedConversation = loadedConversations.some((item) => (
      item.participant.id === requestedParticipantId && !item.opportunityId
    ))
    const directConversation = requestedParticipantId && !hasRequestedConversation ? {
      id: `direct:${requestedParticipantId}`,
      participant: {
        id: requestedParticipantId,
        name: requestedParticipantName,
        avatarUrl: requestedParticipantAvatar || null,
        studentId: requestedParticipantStudentId || null,
      },
      opportunityId: null,
      latestMessage: { body: 'Start a conversation' },
      unreadCount: 0,
    } : null
    const nextConversations = directConversation
      ? [directConversation, ...loadedConversations]
      : loadedConversations
    setConversations(nextConversations)
    setActiveConversationId((current) => {
      const requestedDirectConversation = nextConversations.find((item) => (
        item.participant.id === requestedParticipantId && !item.opportunityId
      ))
      if (requestedDirectConversation) return requestedDirectConversation.id
      return nextConversations.some((item) => item.id === current)
        ? current
        : nextConversations[0]?.id || ''
    })
  }, [requestedParticipantAvatar, requestedParticipantId, requestedParticipantName, requestedParticipantStudentId])

  const refreshConversations = useCallback(async () => {
    const response = await listConversations()
    applyConversationResponse(response)
  }, [applyConversationResponse])

  useEffect(() => {
    listConversations()
      .then(applyConversationResponse)
      .catch((requestError) => setError(requestError.message))
  }, [applyConversationResponse])

  useEffect(() => {
    if (!activeParticipantId) return
    listMessages({
      participantId: activeParticipantId,
      opportunityId: activeOpportunityId,
    })
      .then((response) => {
        shouldJumpToLatestRef.current = true
        setMessages(response || [])
        setConversations((current) => current.map((conversation) => (
          conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
        )))
        window.dispatchEvent(new Event('zumbarl:messages-read'))
      })
      .catch((requestError) => setError(requestError.message))
  }, [activeConversationId, activeOpportunityId, activeParticipantId])

  useEffect(() => {
    const handleReceipt = (event) => {
      setMessages((current) => current.map((message) => (
        message.id === event.detail.messageId ? { ...message, ...event.detail, isRead: Boolean(event.detail.readAt) } : message
      )))
    }
    window.addEventListener('zumbarl:message-receipt', handleReceipt)
    return () => window.removeEventListener('zumbarl:message-receipt', handleReceipt)
  }, [])

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.detail
      refreshConversations().catch(() => {})
      if (
        activeParticipantId
        && message.senderId === activeParticipantId
        && (message.opportunityId || null) === (activeOpportunityId || null)
      ) {
        listMessages({
          participantId: activeParticipantId,
          opportunityId: activeOpportunityId,
        }).then((response) => {
          setMessages(response || [])
          setConversations((current) => current.map((conversation) => (
            conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
          )))
          window.dispatchEvent(new Event('zumbarl:messages-read'))
        }).catch(() => {})
      }
    }
    window.addEventListener('zumbarl:message-created', handleMessage)
    return () => window.removeEventListener('zumbarl:message-created', handleMessage)
  }, [activeConversationId, activeOpportunityId, activeParticipantId, refreshConversations])

  useLayoutEffect(() => {
    if (shouldJumpToLatestRef.current) {
      shouldJumpToLatestRef.current = false
      if (threadBodyRef.current) threadBodyRef.current.scrollTop = threadBodyRef.current.scrollHeight
      return
    }
    if (!shouldScrollAfterSendRef.current) return
    shouldScrollAfterSendRef.current = false
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    const offerIds = [...new Set(messages.map((message) => message.context?.offer?.id).filter(Boolean))]
    if (!offerIds.length) return
    Promise.all(offerIds.map((id) => readMarketplaceOffer(id).then((response) => response.offer).catch(() => null)))
      .then((offers) => setOfferStates((current) => offers.reduce((next, offer) => (
        offer ? { ...next, [offer.id]: offer } : next
      ), current)))
  }, [messages])

  async function handleOfferDecision(offerId, decision) {
    if (offerDecisionId) return
    setOfferDecisionId(offerId)
    setError('')
    try {
      const response = await decideMarketplaceOffer(offerId, decision)
      setOfferStates((current) => ({ ...current, [offerId]: response.offer }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setOfferDecisionId('')
    }
  }

  useEffect(() => {
    if (!activeCall?.id || activeCall.status !== 'ringing') return undefined
    playCallRingtone()
    const ringtoneInterval = window.setInterval(playCallRingtone, 2200)
    const statusInterval = window.setInterval(async () => {
      try {
        const call = await readCall(activeCall.id)
        setActiveCall(call)
        if (call.status === 'accepted') {
          setActiveCall(null)
          setCallStatus('')
          openCallOverlay(call)
        } else if (call.status !== 'ringing') {
          setCallStatus(`Call ${call.status}.`)
        }
      } catch (requestError) {
        setCallStatus(requestError.message)
      }
    }, 1200)
    return () => {
      window.clearInterval(ringtoneInterval)
      window.clearInterval(statusInterval)
    }
  }, [activeCall?.id, activeCall?.status])

  useEffect(() => {
    if (!requestedCallType || !activeParticipantId || activeParticipantId !== requestedParticipantId) return
    const requestKey = `${activeParticipantId}:${requestedCallType}`
    if (autoCallStartedRef.current === requestKey) return
    autoCallStartedRef.current = requestKey
    setCallStatus(`Starting ${requestedCallType} call…`)
    createCall({
      recipientId: activeParticipantId,
      opportunityId: activeOpportunityId,
      callType: requestedCallType,
    }).then((call) => {
      setActiveCall(call)
      setCallStatus(`Calling ${activeConversation?.participant.name || requestedParticipantName}…`)
    }).catch((requestError) => {
      setCallStatus(requestError.message)
    })
  }, [activeConversation?.participant.name, activeOpportunityId, activeParticipantId, requestedCallType, requestedParticipantId, requestedParticipantName])

  async function startCall(callType) {
    if (!activeConversation) return
    setCallStatus(`Starting ${callType} call…`)
    try {
      const call = await createCall({
        recipientId: activeConversation.participant.id,
        opportunityId: activeConversation.opportunityId,
        callType,
      })
      setActiveCall(call)
      setCallStatus(`Calling ${activeConversation.participant.name}…`)
    } catch (requestError) {
      setCallStatus(requestError.message)
    }
  }

  async function stopCalling() {
    if (!activeCall?.id) return
    await cancelCall(activeCall.id).catch(() => {})
    setActiveCall(null)
    setCallStatus('Call cancelled.')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !activeConversation || isSending) return
    setIsSending(true)
    setError('')
    try {
      const message = await sendMessage({
        recipientId: activeConversation.participant.id,
        opportunityId: activeConversation.opportunityId,
        body,
      })
      shouldScrollAfterSendRef.current = true
      setMessages((current) => [...current, message])
      setDraft('')
      playMessageSentSound()
      await refreshConversations()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="campus-page messages-page">
      <Seo title="Messages | Zumbarl" description="Your real-time Zumbarl conversations." path="/messages" />
      <div className="campus-stage">
        <div className="campus-shell messages-shell">
          {isBusiness ? <BusinessWorkspaceSidebar activeItemId="messages" /> : <CampusSidebar activeItemId="messages" />}
          <section className="campus-main messages-main">
            <header className="messages-page-header">
              <div>
                <h1>Messages</h1>
                <p>Conversations with your Zumbarl collaborators.</p>
              </div>
              <CampusTopActions
                className="messages-page-actions"
                scope={isBusiness ? 'business' : 'campus'}
                userButtonClassName="messages-user-btn"
              />
            </header>

            <div className="messages-workspace">
              <aside className="messages-conversations" aria-label="Conversations">
                <label>
                  <FiSearch aria-hidden="true" />
                  <input type="search" placeholder="Search conversations" />
                </label>
                {conversations.length ? conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={conversation.id === activeConversation?.id ? 'is-active' : ''}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <span className="messages-avatar">
                      {participantAvatar(conversation.participant)
                        ? <img src={participantAvatar(conversation.participant)} alt="" />
                        : conversation.participant.name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{conversation.participant.name}</strong>
                      <small>{conversation.latestMessage.body}</small>
                    </span>
                    {conversation.unreadCount ? <em>{conversation.unreadCount}</em> : null}
                  </button>
                )) : (
                  <div className="messages-empty-list">
                    <FiMessageCircle aria-hidden="true" />
                    <p>No conversations yet.</p>
                  </div>
                )}
              </aside>

              <section className="messages-thread">
                {activeConversation ? (
                  <>
                    <header>
                      {activeConversation.participant.studentId ? (
                        <Link
                          className="messages-participant-link"
                          to={`/campus/profiles/${activeConversation.participant.studentId}`}
                          aria-label={`View ${activeConversation.participant.name}'s profile`}
                        >
                          <span className="messages-avatar">
                            {participantAvatar(activeConversation.participant)
                              ? <img src={participantAvatar(activeConversation.participant)} alt="" />
                              : activeConversation.participant.name.slice(0, 1)}
                          </span>
                          <span>
                            <h2>{activeConversation.participant.name}</h2>
                            <p>View profile</p>
                          </span>
                        </Link>
                      ) : (
                        <div className="messages-participant-link is-static">
                          <span className="messages-avatar">
                            {participantAvatar(activeConversation.participant)
                              ? <img src={participantAvatar(activeConversation.participant)} alt="" />
                              : activeConversation.participant.name.slice(0, 1)}
                          </span>
                          <span>
                            <h2>{activeConversation.participant.name}</h2>
                            <p>Zumbarl conversation</p>
                          </span>
                        </div>
                      )}
                      <div className="messages-call-actions">
                        {activeCall?.status === 'ringing' ? (
                          <button type="button" aria-label="Cancel call" onClick={stopCalling}><FiPhoneOff aria-hidden="true" /></button>
                        ) : (
                          <>
                            <button type="button" aria-label="Start audio call" onClick={() => startCall('audio')}><FiPhone aria-hidden="true" /></button>
                            <button type="button" aria-label="Start video call" onClick={() => startCall('video')}><FiVideo aria-hidden="true" /></button>
                          </>
                        )}
                      </div>
                    </header>
                    {callStatus ? <p className="messages-call-status" role="status">{callStatus}</p> : null}
                    <div ref={threadBodyRef} className="messages-thread-body" aria-live="polite">
                      {messages.map((message) => {
                        const isMine = message.senderId !== activeConversation.participant.id
                        const offer = message.context?.offer?.id ? offerStates[message.context.offer.id] : null
                        const isOfferBuyer = Boolean(offer && offer.buyerId === viewerUserId)
                        const isOfferSeller = Boolean(offer && offer.sellerId === viewerUserId)
                        const isActiveOfferCard = latestOfferMessageIds.has(message.id)
                        return (
                          <article key={message.id} className={isMine ? 'is-mine' : ''}>
                            {!isMine ? (
                              <span className="messages-message-avatar">
                                {participantAvatar(activeConversation.participant)
                                  ? <img src={participantAvatar(activeConversation.participant)} alt="" />
                                  : activeConversation.participant.name.slice(0, 1)}
                              </span>
                            ) : null}
                            <div>
                              {message.context?.product ? (
                                <div className="messages-product-offer-wrap">
                                <Link className="messages-product-preview" to={message.context.product.href}>
                                  <img src={message.context.product.image} alt="" />
                                  <span>
                                    <small>{message.context.type === 'marketplace_offer' ? 'Marketplace offer' : 'Marketplace listing'}</small>
                                    <strong>{message.context.product.title}</strong>
                                    <b>{message.context.type === 'marketplace_offer' && message.context.offer
                                      ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: message.context.offer.currency, maximumFractionDigits: 0 }).format(message.context.offer.amount)
                                      : message.context.product.price}</b>
                                  </span>
                                </Link>
                                {message.context.type === 'marketplace_offer' && offer && isActiveOfferCard ? (
                                  <div className="messages-offer-actions">
                                    <span className={`is-${offer.status}`}>{offer.status}</span>
                                    {isOfferSeller && offer.status === 'pending' ? (
                                      <>
                                        <button type="button" disabled={offerDecisionId === offer.id} onClick={() => handleOfferDecision(offer.id, 'declined')}>Decline</button>
                                        <button type="button" disabled={offerDecisionId === offer.id} onClick={() => handleOfferDecision(offer.id, 'accepted')}>Accept</button>
                                      </>
                                    ) : null}
                                    {isOfferBuyer && ['pending', 'declined'].includes(offer.status) ? (
                                      <Link to={message.context.product.href}>Edit offer</Link>
                                    ) : null}
                                    {isOfferBuyer && offer.status === 'accepted' ? (
                                      <Link to={message.context.product.href}>Checkout</Link>
                                    ) : null}
                                  </div>
                                ) : null}
                                </div>
                              ) : null}
                              <p>{message.body}</p>
                              <time dateTime={message.createdAt}>
                                {formatTime(message.createdAt)}
                                {isMine ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}` : ''}
                              </time>
                            </div>
                            {isMine ? (
                              <span className="messages-message-avatar">
                                {viewerProfile.avatar
                                  ? <img src={viewerProfile.avatar} alt="" />
                                  : viewerProfile.initials}
                              </span>
                            ) : null}
                          </article>
                        )
                      })}
                      <div ref={messageEndRef} />
                    </div>
                    <form onSubmit={handleSubmit}>
                      <input
                        type="text"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={`Message ${activeConversation.participant.name}`}
                        aria-label="Message"
                      />
                      <button type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
                        <FiSend aria-hidden="true" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="messages-empty-thread">
                    <FiMessageCircle aria-hidden="true" />
                    <h2>Your conversations will appear here</h2>
                    <p>Start from an applicant, interview, opportunity, or project.</p>
                  </div>
                )}
              </section>
            </div>
            {error ? <p className="messages-error" role="alert">{error}</p> : null}
          </section>
        </div>
      </div>
    </main>
  )
}

export default MessagesPage
