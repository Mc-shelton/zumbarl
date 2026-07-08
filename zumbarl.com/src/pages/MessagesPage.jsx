import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiPhone, FiPhoneOff, FiSearch, FiSend, FiVideo } from 'react-icons/fi'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { getCurrentLoginRole } from '../features/auth/roleConfig'
import { listConversations, listMessages, sendMessage } from '../features/messages/services/messageService'
import { cancelCall, createCall, readCall } from '../features/calls/services/callService'
import { openCallOverlay } from '../features/calls/getCallMeetingUrl'
import { playCallRingtone, playMessageSentSound } from '../features/communications/services/communicationSounds'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/messages.css'

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
}

function MessagesPage() {
  const isBusiness = getCurrentLoginRole().side === 'company'
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [callStatus, setCallStatus] = useState('')
  const messageEndRef = useRef(null)
  const activeConversation = conversations.find((item) => item.id === activeConversationId) || conversations[0]

  async function loadConversations() {
    const response = await listConversations()
    const nextConversations = response?.data || []
    setConversations(nextConversations)
    setActiveConversationId((current) => (
      nextConversations.some((item) => item.id === current) ? current : nextConversations[0]?.id || ''
    ))
  }

  useEffect(() => {
    listConversations()
      .then((response) => {
        const nextConversations = response?.data || []
        setConversations(nextConversations)
        setActiveConversationId(nextConversations[0]?.id || '')
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  useEffect(() => {
    if (!activeConversation) return
    listMessages({
      participantId: activeConversation.participant.id,
      opportunityId: activeConversation.opportunityId,
    })
      .then((response) => {
        setMessages(response || [])
        setConversations((current) => current.map((conversation) => (
          conversation.id === activeConversation.id ? { ...conversation, unreadCount: 0 } : conversation
        )))
        window.dispatchEvent(new Event('zumbarl:messages-read'))
      })
      .catch((requestError) => setError(requestError.message))
  }, [activeConversation?.id])

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
      loadConversations().catch(() => {})
      if (
        activeConversation
        && message.senderId === activeConversation.participant.id
        && (message.opportunityId || null) === (activeConversation.opportunityId || null)
      ) {
        listMessages({
          participantId: activeConversation.participant.id,
          opportunityId: activeConversation.opportunityId,
        }).then((response) => {
          setMessages(response || [])
          setConversations((current) => current.map((conversation) => (
            conversation.id === activeConversation.id ? { ...conversation, unreadCount: 0 } : conversation
          )))
          window.dispatchEvent(new Event('zumbarl:messages-read'))
        }).catch(() => {})
      }
    }
    window.addEventListener('zumbarl:message-created', handleMessage)
    return () => window.removeEventListener('zumbarl:message-created', handleMessage)
  }, [activeConversation?.id])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      setMessages((current) => [...current, message])
      setDraft('')
      playMessageSentSound()
      await loadConversations()
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
                      {conversation.participant.avatarUrl
                        ? <img src={conversation.participant.avatarUrl} alt="" />
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
                      <span className="messages-avatar">
                        {activeConversation.participant.avatarUrl
                          ? <img src={activeConversation.participant.avatarUrl} alt="" />
                          : activeConversation.participant.name.slice(0, 1)}
                      </span>
                      <div>
                        <h2>{activeConversation.participant.name}</h2>
                        <p>Zumbarl conversation</p>
                      </div>
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
                    <div className="messages-thread-body" aria-live="polite">
                      {messages.map((message) => {
                        const isMine = message.senderId !== activeConversation.participant.id
                        return (
                          <article key={message.id} className={isMine ? 'is-mine' : ''}>
                            <div>
                              <p>{message.body}</p>
                              <time dateTime={message.createdAt}>
                                {formatTime(message.createdAt)}
                                {isMine ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}` : ''}
                              </time>
                            </div>
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
