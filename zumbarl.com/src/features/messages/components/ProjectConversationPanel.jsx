import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiMessageSquare,
  FiPhone,
  FiSend,
  FiSettings,
  FiUsers,
  FiVideo,
} from 'react-icons/fi'
import { cancelCall, createCall, readCall } from '../../calls/services/callService'
import { openCallOverlay } from '../../calls/getCallMeetingUrl'
import {
  listConversations,
  listMessages,
  listProjectGroupMessages,
  sendMessage,
  sendProjectGroupMessage,
} from '../services/messageService'
import { playCallRingtone, playMessageSentSound } from '../../communications/services/communicationSounds'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import '../../../styles/business.css'

const FALLBACK_AVATAR = '/assets/index/bee_nobg.png'

function avatarSource(value) {
  return normalizeZumbarlFileUrl(value) || FALLBACK_AVATAR
}

// The project conversation, shared by the business review workspace and the
// student project workspace. Both sides talk in the same thread, so both must
// render it from the same component rather than one real view and one mock.
function ProjectConversationPanel({ conversation = null, opportunity = null, participants = [], projectId = null }) {
  const [activeCall, setActiveCall] = useState(null)
  const [callMessage, setCallMessage] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [groupMessages, setGroupMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [conversationQuery, setConversationQuery] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [loadedConversationId, setLoadedConversationId] = useState('')
  const [loadedGroupId, setLoadedGroupId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const opportunityId = conversation?.opportunityId || opportunity?.backendId || null
  const groupConversationId = projectId ? `project-group:${projectId}` : ''
  const preferredConversationId = conversation
    ? `${conversation.participant.id}:${conversation.opportunityId || ''}`
    : ''
  const availableConversations = useMemo(() => [
    ...(projectId ? [{
      id: groupConversationId,
      isGroup: true,
      participant: {
        id: groupConversationId,
        name: `${opportunity?.title || 'Project'} group`,
        avatarUrl: null,
        role: `${participants.length + 1} participants`,
      },
      opportunityId,
      latestMessage: groupMessages.at(-1) || null,
      unreadCount: 0,
    }] : []),
    ...conversations,
    ...participants
      .filter((participant) => !conversations.some((item) => item.participant.id === participant.userId))
      .map((participant) => ({
        id: `${participant.userId}:${opportunityId || ''}`,
        participant: {
          id: participant.userId,
          name: participant.name,
          avatarUrl: participant.avatarUrl || null,
          role: participant.role,
        },
        opportunityId,
        latestMessage: null,
        unreadCount: 0,
      })),
  ], [conversations, groupConversationId, groupMessages, opportunity?.title, opportunityId, participants, projectId])
  const activeConversation = useMemo(() => (
    availableConversations.find((item) => item.id === activeConversationId)
      || availableConversations[0]
      || null
  ), [activeConversationId, availableConversations])
  const isLoadingMessages = Boolean(activeConversation && (
    activeConversation.isGroup
      ? loadedGroupId !== projectId
      : loadedConversationId !== activeConversation.id
  ))
  const displayedMessages = activeConversation?.isGroup ? groupMessages : messages
  const conversationItems = availableConversations.map((item) => (
    !item.isGroup && item.id === loadedConversationId && messages.length
      ? { ...item, latestMessage: messages.at(-1) }
      : item
  ))
  const visibleConversations = conversationItems.filter((item) => {
    const query = conversationQuery.trim().toLowerCase()
    if (!query) return true
    return `${item.participant.name || ''} ${item.latestMessage?.body || ''}`.toLowerCase().includes(query)
  })

  const loadOpportunityConversations = useCallback(async (preferredId = preferredConversationId) => {
    const response = await listConversations()
    const matching = (response?.data || []).filter((item) => (
      !opportunityId || item.opportunityId === opportunityId
    ))
    setConversations(matching)
    setActiveConversationId((current) => {
      if (preferredId && matching.some((item) => item.id === preferredId)) return preferredId
      if (current === groupConversationId) return current
      if (matching.some((item) => item.id === current)) return current
      return groupConversationId || matching[0]?.id || ''
    })
  }, [groupConversationId, opportunityId, preferredConversationId])

  const updateDirectConversationSummary = useCallback((message, participant) => {
    if (!participant?.id || (message.opportunityId || null) !== (opportunityId || null)) return
    const id = `${participant.id}:${message.opportunityId || ''}`
    setConversations((current) => {
      const summary = {
        id,
        participant,
        opportunityId: message.opportunityId || null,
        latestMessage: {
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
        unreadCount: 0,
      }
      return current.some((item) => item.id === id)
        ? current.map((item) => (item.id === id ? { ...item, ...summary } : item))
        : [summary, ...current]
    })
  }, [opportunityId])

  useEffect(() => {
    listConversations()
      .then((response) => {
        const matching = (response?.data || []).filter((item) => (
          !opportunityId || item.opportunityId === opportunityId
        ))
        setConversations(matching)
        setActiveConversationId((current) => {
          if (matching.some((item) => item.id === preferredConversationId)) return preferredConversationId
          if (current === groupConversationId) return current
          return groupConversationId || matching[0]?.id || ''
        })
      })
      .catch((error) => setMessageError(error.message))
      .finally(() => setIsLoadingConversations(false))
  }, [groupConversationId, opportunityId, preferredConversationId])

  useEffect(() => {
    if (!projectId) return
    listProjectGroupMessages(projectId)
      .then((response) => {
        setGroupMessages(response || [])
        setLoadedGroupId(projectId)
      })
      .catch((error) => {
        setMessageError(error.message)
        setLoadedGroupId(projectId)
      })
  }, [projectId])

  useEffect(() => {
    if (!activeConversation || activeConversation.isGroup) return
    const conversationId = activeConversation.id
    listMessages({
      participantId: activeConversation.participant.id,
      opportunityId: activeConversation.opportunityId,
    })
      .then((response) => {
        setMessages(response || [])
        setMessageError('')
        setLoadedConversationId(conversationId)
      })
      .catch((error) => {
        setMessageError(error.message)
        setLoadedConversationId(conversationId)
      })
  }, [activeConversation])

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.detail
      if (message.projectGroupId === projectId) {
        setGroupMessages((current) => (
          current.some((item) => item.id === message.id) ? current : [...current, message]
        ))
        return
      }
      updateDirectConversationSummary(message, message.sender)
      loadOpportunityConversations().catch(() => {})
      if (
        activeConversation
        && message.senderId === activeConversation.participant.id
        && (message.opportunityId || null) === (activeConversation.opportunityId || null)
      ) {
        listMessages({
          participantId: activeConversation.participant.id,
          opportunityId: activeConversation.opportunityId,
        }).then((response) => setMessages(response || [])).catch(() => {})
      }
    }
    const handleReceipt = (event) => {
      setMessages((current) => current.map((message) => (
        message.id === event.detail.messageId
          ? { ...message, ...event.detail, isRead: Boolean(event.detail.readAt) }
          : message
      )))
    }
    window.addEventListener('zumbarl:message-created', handleMessage)
    window.addEventListener('zumbarl:message-receipt', handleReceipt)
    return () => {
      window.removeEventListener('zumbarl:message-created', handleMessage)
      window.removeEventListener('zumbarl:message-receipt', handleReceipt)
    }
  }, [activeConversation, loadOpportunityConversations, projectId, updateDirectConversationSummary])

  useEffect(() => {
    if (!activeCall?.id || activeCall.status !== 'ringing') return undefined
    playCallRingtone()
    const ringtoneIntervalId = window.setInterval(playCallRingtone, 2200)
    const intervalId = window.setInterval(async () => {
      try {
        const call = await readCall(activeCall.id)
        setActiveCall(call)
        if (call.status === 'accepted') {
          setActiveCall(null)
          setCallMessage('')
          openCallOverlay(call)
        } else if (call.status !== 'ringing') {
          setCallMessage(`Call ${call.status}.`)
        }
      } catch (error) {
        setCallMessage(error.message)
      }
    }, 1500)
    return () => {
      window.clearInterval(ringtoneIntervalId)
      window.clearInterval(intervalId)
    }
  }, [activeCall?.id, activeCall?.status])

  async function startCall(callType) {
    if (!activeConversation?.participant?.id || activeConversation.isGroup) {
      setCallMessage('This conversation does not have a real recipient yet.')
      return
    }
    setCallMessage(`Starting ${callType} call…`)
    try {
      const call = await createCall({
        recipientId: activeConversation.participant.id,
        opportunityId: activeConversation.opportunityId,
        callType,
      })
      setActiveCall(call)
      setCallMessage(`Calling ${activeConversation.participant.name || 'student'}…`)
    } catch (error) {
      setCallMessage(error.message)
    }
  }

  async function stopCalling() {
    if (!activeCall?.id) return
    await cancelCall(activeCall.id).catch(() => {})
    setActiveCall(null)
    setCallMessage('Call cancelled.')
  }

  async function submitMessage(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !activeConversation || isSending) return
    setIsSending(true)
    setMessageError('')
    try {
      const message = activeConversation.isGroup
        ? await sendProjectGroupMessage(projectId, { body })
        : await sendMessage({
            recipientId: activeConversation.participant.id,
            opportunityId: activeConversation.opportunityId,
            body,
          })
      if (activeConversation.isGroup) {
        setGroupMessages((current) => [...current, message])
      } else {
        setMessages((current) => [...current, message])
        updateDirectConversationSummary(message, activeConversation.participant)
      }
      setDraft('')
      playMessageSentSound()
    } catch (error) {
      setMessageError(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="business-review-messages-grid">
      <aside className="business-review-message-list">
        <h3>Project messages</h3>
        <label>
          <FiMessageSquare aria-hidden="true" />
          <input
            type="search"
            value={conversationQuery}
            placeholder="Search conversations"
            onChange={(event) => setConversationQuery(event.target.value)}
          />
        </label>
        {visibleConversations.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeConversation?.id ? 'is-active' : ''}
            onClick={() => setActiveConversationId(item.id)}
          >
            {item.isGroup ? (
              <span className="business-review-group-avatar"><FiUsers aria-hidden="true" /></span>
            ) : <img src={avatarSource(item.participant.avatarUrl)} alt="" />}
            <span>
              <strong>{item.participant.name}</strong>
              <em>{item.latestMessage?.body || (item.isGroup ? 'Start the group conversation' : 'Start a conversation')}</em>
            </span>
            {item.unreadCount ? <small>{item.unreadCount}</small> : null}
          </button>
        ))}
        {isLoadingConversations ? <p>Loading project conversations…</p> : null}
        {!isLoadingConversations && !visibleConversations.length ? (
          <p>{availableConversations.length ? 'No conversations match your search.' : 'No project participants are available yet.'}</p>
        ) : null}
      </aside>

      {activeConversation ? (
        <section className="business-review-chat">
          <header className={activeConversation.isGroup ? 'is-group' : ''}>
            {activeConversation.isGroup ? (
              <span className="business-review-group-avatar"><FiUsers aria-hidden="true" /></span>
            ) : <img src={avatarSource(activeConversation.participant.avatarUrl)} alt="" />}
            <div>
              <h3>{activeConversation.participant.name || 'Student applicant'}</h3>
              <p>{activeConversation.isGroup ? activeConversation.participant.role : opportunity?.title || 'Project conversation'}</p>
            </div>
            {!activeConversation.isGroup ? (
              <>
                <button type="button" aria-label="Call" onClick={() => startCall('audio')}><FiPhone aria-hidden="true" /></button>
                <button type="button" aria-label="Video call" onClick={() => startCall('video')}><FiVideo aria-hidden="true" /></button>
              </>
            ) : null}
            <button type="button" aria-label="Thread info"><FiSettings aria-hidden="true" /></button>
          </header>

          <div className="business-review-chat-body">
            {callMessage ? (
              <div className="business-call-status" role="status">
                <span>{callMessage}</span>
                {activeCall?.status === 'ringing' ? <button type="button" onClick={stopCalling}>Cancel</button> : null}
              </div>
            ) : null}
            <p className="business-review-chat-start">
              {activeConversation.isGroup
                ? 'This group includes the business and all active project members.'
                : `This is the beginning of your conversation for ${opportunity?.title || 'this project'}.`}
            </p>
            {isLoadingMessages ? <p className="business-review-chat-loading">Loading messages…</p> : null}
            {displayedMessages.map((message) => {
              const isMine = activeConversation.isGroup
                ? message.isMine
                : message.senderId !== activeConversation.participant.id
              const senderName = activeConversation.isGroup
                ? message.sender?.name || 'Project participant'
                : activeConversation.participant.name
              const senderAvatar = activeConversation.isGroup
                ? message.sender?.avatarUrl
                : activeConversation.participant.avatarUrl
              return (
                <article key={message.id} className={isMine ? 'is-mine' : ''}>
                  {!isMine ? <img src={avatarSource(senderAvatar)} alt="" /> : null}
                  <div>
                    <p>
                      <strong>{isMine ? 'You' : senderName}</strong>
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}
                        {isMine && !activeConversation.isGroup
                          ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}`
                          : ''}
                      </span>
                    </p>
                    <div className="business-review-chat-bubble">{message.body}</div>
                  </div>
                </article>
              )
            })}
          </div>
          <form onSubmit={submitMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeConversation.isGroup ? 'Message the project group' : `Message ${activeConversation.participant.name}`}
              aria-label="Opportunity message"
            />
            <button type="submit" className="business-profile-primary-btn" aria-label="Send opportunity message" disabled={!draft.trim() || isSending}>
              <FiSend aria-hidden="true" />
            </button>
          </form>
          {messageError ? <p className="business-message-error" role="alert">{messageError}</p> : null}
        </section>
      ) : (
        <section className="business-review-chat business-review-chat-empty">
          <FiMessageSquare aria-hidden="true" />
          <h3>No conversation selected</h3>
          <p>A conversation with a project participant will appear here when messaging begins.</p>
        </section>
      )}
    </section>
  )
}

export default ProjectConversationPanel
