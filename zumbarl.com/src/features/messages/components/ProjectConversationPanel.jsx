import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiSend,
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
import { useViewerProfile } from '../../auth/viewerProfile'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import '../../../styles/messages.css'

function avatarSource(value) {
  return normalizeZumbarlFileUrl(value)
}

function formatTime(value) {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
    : ''
}

function conversationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toDateString() === new Date().toDateString()
    ? formatTime(value)
    : date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}

// The project conversation, shared by the business review workspace and the
// student project workspace. Both sides talk in the same thread, so both must
// render it from the same component rather than one real view and one mock.
function ProjectConversationPanel({ conversation = null, opportunity = null, participants = [], projectId = null }) {
  const viewerProfile = useViewerProfile()
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
  const chatBodyRef = useRef(null)
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

  useEffect(() => {
    if (isLoadingMessages || !chatBodyRef.current) return undefined
    const frameId = window.requestAnimationFrame(() => {
      chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [activeConversation?.id, displayedMessages.length, isLoadingMessages])

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

    const applyCallStatus = (status) => {
      const nextCall = { ...activeCall, status }
      if (status === 'accepted') {
        setActiveCall(null)
        setCallMessage('')
        openCallOverlay(nextCall)
      } else if (status !== 'ringing') {
        setActiveCall(null)
        setCallMessage(`Call ${status}.`)
      }
    }
    const handleCallUpdate = (event) => {
      if (event.detail?.id === activeCall.id) applyCallStatus(event.detail.status)
    }
    const reconcileCall = async () => {
      try {
        const call = await readCall(activeCall.id)
        applyCallStatus(call.status)
      } catch (error) {
        setCallMessage(error.message)
      }
    }
    const expiryDelay = Math.max(0, new Date(activeCall.expiresAt).getTime() - Date.now())
    const expiryTimeoutId = window.setTimeout(() => applyCallStatus('missed'), expiryDelay)
    window.addEventListener('zumbarl:call-updated', handleCallUpdate)
    window.addEventListener('zumbarl:realtime-connected', reconcileCall)
    return () => {
      window.clearInterval(ringtoneIntervalId)
      window.clearTimeout(expiryTimeoutId)
      window.removeEventListener('zumbarl:call-updated', handleCallUpdate)
      window.removeEventListener('zumbarl:realtime-connected', reconcileCall)
    }
  }, [activeCall])

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
    <section className="messages-workspace project-messages-workspace">
      <aside className="messages-conversations" aria-label="Project conversations">
        <div className="messages-search-row project-messages-search-row">
          <label className="messages-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={conversationQuery}
              placeholder="Search conversations"
              onChange={(event) => setConversationQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="messages-conversation-list">
          {visibleConversations.map((item) => {
            const avatar = avatarSource(item.participant.avatarUrl)
            return (
              <button
                key={item.id}
                type="button"
                className={`messages-conversation-row${item.id === activeConversation?.id ? ' is-active' : ''}`}
                onClick={() => setActiveConversationId(item.id)}
              >
                <span className={`messages-avatar is-${item.isGroup ? 'group' : 'personal'}`}>
                  {item.isGroup
                    ? <FiUsers aria-hidden="true" />
                    : avatar
                      ? <img src={avatar} alt="" />
                      : item.participant.name?.slice(0, 1) || '?'}
                </span>
                <span className="messages-conversation-copy">
                  <span className="messages-conversation-title">
                    <strong>{item.participant.name}</strong>
                    <time dateTime={item.latestMessage?.createdAt}>{conversationTime(item.latestMessage?.createdAt)}</time>
                  </span>
                  <i className={`messages-kind-label is-${item.isGroup ? 'group' : 'personal'}`}>
                    {item.isGroup ? item.participant.role : item.participant.role || 'Project participant'}
                  </i>
                  <small>{item.latestMessage?.body || (item.isGroup ? 'Start the group conversation' : 'Start a conversation')}</small>
                </span>
                {item.unreadCount ? <em aria-label={`${item.unreadCount} unread`}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</em> : null}
              </button>
            )
          })}
          {isLoadingConversations ? <p className="project-messages-loading">Loading project conversations…</p> : null}
          {!isLoadingConversations && !visibleConversations.length ? (
            <div className="messages-empty-list">
              <FiMessageCircle aria-hidden="true" />
              <strong>{availableConversations.length ? 'No matching conversations' : 'No project conversations yet'}</strong>
              <p>{availableConversations.length ? 'Try another name or message.' : 'Project participants will appear here when they join.'}</p>
            </div>
          ) : null}
        </div>
      </aside>

      {activeConversation ? (
        <section className="messages-thread">
          <header>
            <div className="messages-participant-link is-static">
              <span className={`messages-avatar${activeConversation.isGroup ? ' is-group' : ''}`}>
                {activeConversation.isGroup
                  ? <FiUsers aria-hidden="true" />
                  : avatarSource(activeConversation.participant.avatarUrl)
                    ? <img src={avatarSource(activeConversation.participant.avatarUrl)} alt="" />
                    : activeConversation.participant.name?.slice(0, 1) || '?'}
              </span>
              <span>
                <h2>{activeConversation.participant.name || 'Project participant'}</h2>
                <p>{activeConversation.isGroup ? activeConversation.participant.role : opportunity?.title || 'Project conversation'}</p>
              </span>
            </div>
            {!activeConversation.isGroup ? (
              <div className="messages-call-actions">
                <button type="button" aria-label="Start audio call" onClick={() => startCall('audio')}><FiPhone aria-hidden="true" /></button>
                <button type="button" aria-label="Start video call" onClick={() => startCall('video')}><FiVideo aria-hidden="true" /></button>
              </div>
            ) : null}
          </header>

          {callMessage ? (
            <p className="messages-call-status" role="status">
              <span>{callMessage}</span>
              {activeCall?.status === 'ringing' ? <button type="button" onClick={stopCalling}>Cancel</button> : null}
            </p>
          ) : null}

          <div ref={chatBodyRef} className="messages-thread-body" aria-live="polite">
            <p className="project-messages-thread-note">
              {activeConversation.isGroup
                ? 'This group includes the business and all active project members.'
                : `This is the beginning of your conversation for ${opportunity?.title || 'this project'}.`}
            </p>
            {isLoadingMessages ? <p className="project-messages-loading">Loading messages…</p> : null}
            {displayedMessages.map((message) => {
              const isMine = activeConversation.isGroup
                ? message.isMine
                : message.senderId !== activeConversation.participant.id
              const sender = activeConversation.isGroup ? message.sender : activeConversation.participant
              const senderName = sender?.name || 'Project participant'
              const senderAvatar = avatarSource(sender?.avatarUrl)
              return (
                <article key={message.id} className={isMine ? 'is-mine' : ''}>
                  {!isMine ? (
                    <span className="messages-message-avatar">
                      {senderAvatar ? <img src={senderAvatar} alt="" /> : senderName.slice(0, 1)}
                    </span>
                  ) : null}
                  <div>
                    {activeConversation.isGroup && !isMine ? <strong className="project-message-sender">{senderName}</strong> : null}
                    <p>{message.body}</p>
                    <time dateTime={message.createdAt}>
                      {formatTime(message.createdAt)}
                      {isMine && !activeConversation.isGroup
                        ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}`
                        : ''}
                    </time>
                  </div>
                  {isMine ? (
                    <span className="messages-message-avatar">
                      {viewerProfile.avatar ? <img src={viewerProfile.avatar} alt="" /> : viewerProfile.initials}
                    </span>
                  ) : null}
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
              aria-label="Message"
            />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || isSending}>
              <FiSend aria-hidden="true" />
            </button>
          </form>
          {messageError ? <p className="messages-error project-messages-error" role="alert">{messageError}</p> : null}
        </section>
      ) : (
        <section className="messages-thread">
          <div className="messages-empty-thread">
            <FiMessageSquare aria-hidden="true" />
            <h2>No conversation selected</h2>
            <p>A conversation with a project participant will appear here when messaging begins.</p>
          </div>
        </section>
      )}
    </section>
  )
}

export default ProjectConversationPanel
