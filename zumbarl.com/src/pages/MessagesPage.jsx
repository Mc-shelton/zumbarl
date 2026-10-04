import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FiArrowRight, FiEdit3, FiInbox, FiMessageCircle, FiPackage, FiPhone, FiPhoneOff, FiSearch, FiSend, FiTruck, FiUser, FiUsers, FiVideo, FiX } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { getCurrentLoginRole } from '../features/auth/roleConfig'
import { ensurePageConversation, listConversations, listMessageNetwork, listMessages, listPageConversations, listPageMessages, listProjectGroupConversations, listProjectGroupMessages, sendMessage, sendPageMessage, sendProjectGroupMessage } from '../features/messages/services/messageService'
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

function formatMoney(amount, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function participantAvatar(participant) {
  return normalizeZumbarlFileUrl(
    participant?.avatarUrl || participant?.avatar || participant?.student?.avatarUrl,
  )
}

const CONVERSATION_TABS = [
  { id: 'all', label: 'All', icon: FiInbox },
  { id: 'personal', label: 'Personal', icon: FiUser },
  { id: 'errand', label: 'Errands', icon: FiTruck },
  { id: 'page', label: 'Pages', icon: FiMessageCircle },
  { id: 'group', label: 'Groups', icon: FiUsers },
]

function conversationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}

function sortConversations(items) {
  return [...items].sort((left, right) => (
    new Date(right.latestMessage?.createdAt || 0).getTime()
      - new Date(left.latestMessage?.createdAt || 0).getTime()
  ))
}

function upsertConversation(items, incoming) {
  if (!incoming?.id) return items
  const existingIndex = items.findIndex((item) => item.id === incoming.id)
  if (existingIndex < 0) return sortConversations([incoming, ...items])
  const next = [...items]
  next[existingIndex] = { ...next[existingIndex], ...incoming }
  return sortConversations(next)
}

function normalizePageConversation(conversation) {
  if (!conversation?.id) return null
  return {
    ...conversation,
    id: `page:${conversation.id}`,
    conversationId: conversation.id,
  }
}

function normalizeGroupConversation(conversation) {
  if (!conversation?.id) return null
  return {
    ...conversation,
    id: `group:${conversation.id}`,
    projectGroupId: conversation.projectGroupId || conversation.id,
  }
}

function isErrandContext(context) {
  if (!context || typeof context !== 'object') return false
  const messageIntent = String(context.order?.messageIntent || context.messageIntent || '')
  const orderHrefs = [context.order?.senderHref, context.order?.recipientHref]
  return messageIntent.includes('errander')
    || String(context.automatedEventId || '').startsWith('errand-')
    || orderHrefs.some((href) => String(href || '').includes('tab=errands'))
}

function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedParticipantId = searchParams.get('participantId') || ''
  const requestedParticipantName = searchParams.get('participantName') || 'New conversation'
  const requestedParticipantAvatar = searchParams.get('participantAvatar') || ''
  const requestedParticipantStudentId = searchParams.get('participantStudentId') || ''
  const requestedPageType = searchParams.get('pageType') || ''
  const requestedPageId = searchParams.get('pageId') || ''
  const requestedCustomerUserId = searchParams.get('customerUserId') || ''
  const requestedOrderId = searchParams.get('orderId') || ''
  const requestedOrderIdentifier = searchParams.get('orderIdentifier') || ''
  const requestedOrderTitle = searchParams.get('orderTitle') || ''
  const requestedOrderStatus = searchParams.get('orderStatus') || ''
  const requestedOrderImage = searchParams.get('orderImage') || ''
  const requestedOrderTotal = Number(searchParams.get('orderTotal') || 0)
  const requestedOrderCurrency = searchParams.get('orderCurrency') || 'KES'
  const requestedOrderSenderHref = searchParams.get('orderSenderHref') || ''
  const requestedOrderRecipientHref = searchParams.get('orderRecipientHref') || ''
  const requestedOrderCustomerHref = searchParams.get('orderCustomerHref') || ''
  const requestedOrderPageHref = searchParams.get('orderPageHref') || ''
  const requestedOrderMessageIntent = searchParams.get('orderMessageIntent') || 'order_inquiry'
  const shouldStartOrderInquiry = searchParams.get('orderInquiry') === '1'
  const requestedCallType = ['audio', 'video'].includes(searchParams.get('call')) ? searchParams.get('call') : ''
  const isBusiness = getCurrentLoginRole().side === 'company'
  const viewerProfile = useViewerProfile()
  const [conversations, setConversations] = useState([])
  const initialConversationTab = requestedPageId ? 'page' : requestedOrderMessageIntent.includes('errander') ? 'errand' : requestedParticipantId ? 'personal' : 'all'
  const [conversationTab, setConversationTab] = useState(initialConversationTab)
  const conversationTabRef = useRef(initialConversationTab)
  const [conversationQuery, setConversationQuery] = useState('')
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [stagedOrderInquiry, setStagedOrderInquiry] = useState(null)
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [offerStates, setOfferStates] = useState({})
  const [offerDecisionId, setOfferDecisionId] = useState('')
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const [networkTargets, setNetworkTargets] = useState([])
  const [networkQuery, setNetworkQuery] = useState('')
  const [networkKind, setNetworkKind] = useState('all')
  const [networkStatus, setNetworkStatus] = useState('')
  const [networkStartingId, setNetworkStartingId] = useState('')
  const viewerUserId = getAuthUserSnapshot()?.user?.id || ''
  const requestedOrderContext = useMemo(() => requestedOrderId ? {
    id: requestedOrderId,
    identifier: requestedOrderIdentifier || `#${requestedOrderId.slice(-8).toUpperCase()}`,
    title: requestedOrderTitle || 'Marketplace order',
    status: requestedOrderStatus || 'active',
    image: requestedOrderImage || undefined,
    total: requestedOrderTotal,
    currency: requestedOrderCurrency,
    ...(viewerUserId ? { senderUserId: viewerUserId } : {}),
    ...(requestedParticipantId ? { recipientUserId: requestedParticipantId } : {}),
    senderHref: requestedOrderSenderHref || '/campus/opportunities/buy-sell?view=orders',
    recipientHref: requestedOrderRecipientHref || '/campus/opportunities/buy-sell?view=orders',
    customerHref: requestedOrderCustomerHref || requestedOrderSenderHref || '/campus/opportunities/buy-sell?view=orders',
    pageHref: requestedOrderPageHref || requestedOrderRecipientHref || '/campus/opportunities/buy-sell?view=orders',
    messageIntent: requestedOrderMessageIntent,
  } : null, [requestedOrderCurrency, requestedOrderCustomerHref, requestedOrderId, requestedOrderIdentifier, requestedOrderImage, requestedOrderMessageIntent, requestedOrderPageHref, requestedOrderRecipientHref, requestedOrderSenderHref, requestedOrderStatus, requestedOrderTitle, requestedOrderTotal, requestedParticipantId, viewerUserId])
  const [activeCall, setActiveCall] = useState(null)
  const [callStatus, setCallStatus] = useState('')
  const threadBodyRef = useRef(null)
  const messageEndRef = useRef(null)
  const composerInputRef = useRef(null)
  const shouldJumpToLatestRef = useRef(false)
  const shouldScrollAfterSendRef = useRef(false)
  const autoCallStartedRef = useRef('')
  const orderDraftStartedRef = useRef('')
  const requestedConversationAppliedRef = useRef('')
  const requestedConversationKey = requestedPageId
    ? `page:${requestedPageId}:${requestedCustomerUserId}`
    : requestedParticipantId
      ? `personal:${requestedParticipantId}`
      : ''
  const conversationCounts = useMemo(() => CONVERSATION_TABS.reduce((counts, tab) => ({
    ...counts,
    [tab.id]: tab.id === 'all' ? conversations.length : conversations.filter((item) => (item.kind || 'personal') === tab.id).length,
  }), {}), [conversations])
  const visibleConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase()
    return conversations.filter((conversation) => {
      if (conversationTab !== 'all' && (conversation.kind || 'personal') !== conversationTab) return false
      if (!query) return true
      return [
        conversation.participant?.name,
        conversation.page?.name,
        conversation.latestMessage?.body,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [conversationQuery, conversationTab, conversations])
  const visibleNetworkTargets = useMemo(() => {
    const query = networkQuery.trim().toLowerCase()
    return networkTargets.filter((target) => {
      if (networkKind !== 'all' && target.kind !== networkKind) return false
      return !query || [target.participant?.name, target.relationship, target.page?.slug]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [networkKind, networkQuery, networkTargets])
  const selectedConversation = conversations.find((item) => item.id === activeConversationId)
  const activeConversation = selectedConversation && (conversationTab === 'all' || (selectedConversation.kind || 'personal') === conversationTab)
    ? selectedConversation
    : conversationTab === 'all'
      ? conversations[0] || null
      : conversations.find((item) => (item.kind || 'personal') === conversationTab) || null
  const isPageConversation = activeConversation?.kind === 'page'
  const isGroupConversation = activeConversation?.kind === 'group'
  const activePageConversationId = activeConversation?.conversationId || ''
  const activeProjectGroupId = activeConversation?.projectGroupId || ''
  const activeActsAsPage = Boolean(activeConversation?.actingAsPage)
  const activePageName = activeConversation?.page?.name || ''
  const activeParticipantId = activeConversation?.participant.id
  const activeOpportunityId = activeConversation?.opportunityId
  const latestOfferMessageIds = new Set(Object.values(messages.reduce((latest, message) => {
    const offerId = message.context?.offer?.id
    return offerId ? { ...latest, [offerId]: message.id } : latest
  }, {})))
  const viewerName = getAuthUserSnapshot()?.user?.name
    || [getAuthUserSnapshot()?.user?.firstName, getAuthUserSnapshot()?.user?.lastName].filter(Boolean).join(' ')
    || 'a Zumbarl member'

  useEffect(() => {
    if (!isNewConversationOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsNewConversationOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isNewConversationOpen])

  useEffect(() => {
    if (!shouldStartOrderInquiry || !requestedOrderContext || !activeConversationId) return undefined
    const matchesRequestedConversation = isPageConversation
      ? activeConversation?.page?.id === requestedPageId
        && (!requestedCustomerUserId || activeConversation?.customer?.id === requestedCustomerUserId)
      : activeParticipantId === requestedParticipantId
    if (!matchesRequestedConversation) return undefined
    const conversationReference = isPageConversation
      ? `page:${requestedPageId}:${requestedCustomerUserId}`
      : `personal:${requestedParticipantId}`
    const draftKey = `${conversationReference}:${requestedOrderContext.id}:${requestedOrderMessageIntent}:${activeActsAsPage ? 'page' : 'user'}`
    if (orderDraftStartedRef.current === draftKey) return undefined
    const startDraftId = window.setTimeout(() => {
      orderDraftStartedRef.current = draftKey
      const firstName = requestedParticipantName.trim().split(/\s+/)[0] || requestedParticipantName
      const body = activeActsAsPage
        ? `Hi, this is ${activePageName}. We're following up about your ${requestedOrderContext.title} order (${requestedOrderContext.identifier}). `
        : requestedOrderMessageIntent === 'buyer_to_errander'
          ? `Hi ${firstName}, I'm checking on my ${requestedOrderContext.title} order (${requestedOrderContext.identifier}). Could you share a delivery update? `
          : requestedOrderMessageIntent === 'errander_to_buyer'
            ? `Hi ${firstName}, I'm your errander for the ${requestedOrderContext.title} order (${requestedOrderContext.identifier}). I wanted to update you about the delivery. `
            : requestedOrderMessageIntent === 'seller_to_buyer'
              ? `Hi ${firstName}, I'm following up about your ${requestedOrderContext.title} order (${requestedOrderContext.identifier}). `
              : `Hi, I'm ${viewerName}. I have an inquiry about my ${requestedOrderContext.title} order (${requestedOrderContext.identifier}). `
      setDraft(body)
      setStagedOrderInquiry({ conversationId: activeConversationId, order: requestedOrderContext })
      window.requestAnimationFrame(() => {
        composerInputRef.current?.focus()
        composerInputRef.current?.setSelectionRange(body.length, body.length)
      })
    }, 0)
    return () => window.clearTimeout(startDraftId)
  }, [activeActsAsPage, activeConversation?.customer?.id, activeConversation?.page?.id, activeConversationId, activePageName, activeParticipantId, isPageConversation, requestedCustomerUserId, requestedOrderContext, requestedOrderMessageIntent, requestedPageId, requestedParticipantId, requestedParticipantName, shouldStartOrderInquiry, viewerName])

  // URL identity fields are the only changing inputs; React state setters are stable.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const applyConversationResponse = useCallback((response, pageResponse = { data: [] }, groupResponse = { data: [] }) => {
    const loadedConversations = [...(response?.data || []).reduce((grouped, conversation) => {
      const existing = grouped.get(conversation.participant.id)
      if (!existing) {
        grouped.set(conversation.participant.id, { ...conversation, id: conversation.participant.id, kind: conversation.kind || 'personal', opportunityId: null })
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
      kind: conversationTabRef.current === 'errand' ? 'errand' : 'personal',
    } : null
    const loadedPageConversations = (pageResponse?.data || []).map(normalizePageConversation).filter(Boolean)
    const loadedGroupConversations = (groupResponse?.data || []).map(normalizeGroupConversation).filter(Boolean)
    const nextConversations = sortConversations([
      ...loadedPageConversations,
      ...loadedGroupConversations,
      ...(directConversation ? [directConversation, ...loadedConversations] : loadedConversations),
    ])
    setConversations(nextConversations)
    setActiveConversationId((current) => {
      const requestedDirectConversation = nextConversations.find((item) => (
        item.participant.id === requestedParticipantId && !item.opportunityId
      ))
      const requestedPageConversation = nextConversations.find((item) => (
        item.kind === 'page' && item.page?.id === requestedPageId && (!requestedCustomerUserId || item.customer?.id === requestedCustomerUserId)
      ))
      const shouldApplyRequestedConversation = requestedConversationKey
        && requestedConversationAppliedRef.current !== requestedConversationKey
      if (shouldApplyRequestedConversation && requestedPageConversation) {
        requestedConversationAppliedRef.current = requestedConversationKey
        return requestedPageConversation.id
      }
      if (shouldApplyRequestedConversation && requestedDirectConversation) {
        requestedConversationAppliedRef.current = requestedConversationKey
        return requestedDirectConversation.id
      }
      const activeTab = conversationTabRef.current
      const currentConversation = nextConversations.find((item) => item.id === current)
      if (currentConversation && (activeTab === 'all' || (currentConversation.kind || 'personal') === activeTab)) return current
      return activeTab === 'all'
        ? nextConversations[0]?.id || ''
        : nextConversations.find((item) => (item.kind || 'personal') === activeTab)?.id || ''
    })
  }, [requestedCustomerUserId, requestedConversationKey, requestedPageId, requestedParticipantAvatar, requestedParticipantId, requestedParticipantName, requestedParticipantStudentId])

  const refreshConversations = useCallback(async () => {
    const [response, pageResponse, groupResponse] = await Promise.all([listConversations(), listPageConversations(), listProjectGroupConversations()])
    applyConversationResponse(response, pageResponse, groupResponse)
  }, [applyConversationResponse])

  useEffect(() => {
    const prepareRequestedPage = requestedPageId && requestedPageType
      ? ensurePageConversation({ pageType: requestedPageType, pageId: requestedPageId, customerUserId: requestedCustomerUserId || undefined })
      : Promise.resolve(null)
    prepareRequestedPage
      .then(() => Promise.all([listConversations(), listPageConversations(), listProjectGroupConversations()]))
      .then(([response, pageResponse, groupResponse]) => applyConversationResponse(response, pageResponse, groupResponse))
      .catch((requestError) => setError(requestError.message))
  }, [applyConversationResponse, requestedCustomerUserId, requestedPageId, requestedPageType])

  useEffect(() => {
    if (!activeConversationId) return
    let cancelled = false
    const request = isPageConversation
      ? listPageMessages(activePageConversationId)
      : isGroupConversation
        ? listProjectGroupMessages(activeProjectGroupId)
        : listMessages({ participantId: activeParticipantId, opportunityId: activeOpportunityId })
    request
      .then((response) => {
        if (cancelled) return
        const loadedMessages = response || []
        shouldJumpToLatestRef.current = true
        setMessages(loadedMessages)
        setConversations((current) => current.map((conversation) => (
          conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
        )))
        window.dispatchEvent(new Event('zumbarl:messages-read'))
      })
      .catch((requestError) => setError(requestError.message))
    return () => { cancelled = true }
  }, [activeConversationId, activeOpportunityId, activePageConversationId, activeParticipantId, activeProjectGroupId, isGroupConversation, isPageConversation])

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
      if (!message) return
      if (message.conversation?.kind === 'group') {
        const incomingGroup = normalizeGroupConversation(message.conversation)
        if (incomingGroup) {
          setConversations((current) => upsertConversation(current, {
            ...incomingGroup,
            unreadCount: isGroupConversation && incomingGroup.projectGroupId === activeProjectGroupId
              ? 0
              : incomingGroup.unreadCount,
          }))
          if (['all', 'group'].includes(conversationTabRef.current)) {
            setActiveConversationId((current) => current || incomingGroup.id)
          }
        }
      } else if (!message.projectGroupId && message.senderId) {
        const incomingKind = isErrandContext(message.context) ? 'errand' : 'personal'
        setConversations((current) => {
          const existing = current.find((conversation) => (
            conversation.kind !== 'page'
            && conversation.kind !== 'group'
            && conversation.participant?.id === message.senderId
          ))
          const isActive = !isPageConversation
            && !isGroupConversation
            && activeParticipantId === message.senderId
            && (message.opportunityId || null) === (activeOpportunityId || null)
          const incoming = {
            ...(existing || {}),
            id: existing?.id || message.senderId,
            kind: existing?.kind === 'errand' ? 'errand' : incomingKind,
            participant: message.sender || existing?.participant || { id: message.senderId, name: 'Zumbarl user' },
            opportunityId: null,
            latestMessage: {
              id: message.id,
              body: message.body,
              senderId: message.senderId,
              context: message.context,
              createdAt: message.createdAt,
            },
            unreadCount: isActive ? 0 : Number(existing?.unreadCount || 0) + 1,
          }
          return upsertConversation(current, incoming)
        })
        if (['all', incomingKind].includes(conversationTabRef.current)) {
          setActiveConversationId((current) => current || message.senderId)
        }
      }
      refreshConversations().catch(() => {})
      if (isGroupConversation && message.projectGroupId === activeProjectGroupId) {
        listProjectGroupMessages(activeProjectGroupId).then((response) => {
          setMessages(response || [])
          setConversations((current) => current.map((conversation) => (
            conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
          )))
          window.dispatchEvent(new Event('zumbarl:messages-read'))
        }).catch(() => {})
        return
      }
      if (
        !isGroupConversation
        && activeParticipantId
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
  }, [activeConversationId, activeOpportunityId, activeParticipantId, activeProjectGroupId, isGroupConversation, isPageConversation, refreshConversations])

  useEffect(() => {
    const handlePageMessage = (event) => {
      const detail = event.detail
      const incomingPage = normalizePageConversation(detail?.conversation || (detail?.kind === 'page' ? detail : null))
      if (incomingPage) {
        setConversations((current) => upsertConversation(current, {
          ...incomingPage,
          unreadCount: isPageConversation && incomingPage.conversationId === activePageConversationId
            ? 0
            : incomingPage.unreadCount,
        }))
        if (['all', 'page'].includes(conversationTabRef.current)) {
          setActiveConversationId((current) => current || incomingPage.id)
        }
      }
      refreshConversations().catch(() => {})
      if (isPageConversation && (detail?.conversationId || detail?.id) === activePageConversationId) {
        listPageMessages(activePageConversationId).then((response) => {
          setMessages(response || [])
          setConversations((current) => current.map((conversation) => (
            conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
          )))
          window.dispatchEvent(new Event('zumbarl:messages-read'))
        }).catch(() => {})
      }
    }
    window.addEventListener('zumbarl:page-message-created', handlePageMessage)
    window.addEventListener('zumbarl:page-conversation-created', handlePageMessage)
    return () => {
      window.removeEventListener('zumbarl:page-message-created', handlePageMessage)
      window.removeEventListener('zumbarl:page-conversation-created', handlePageMessage)
    }
  }, [activeConversationId, activePageConversationId, isPageConversation, refreshConversations])

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

    const applyCallStatus = (status) => {
      const nextCall = { ...activeCall, status }
      if (status === 'accepted') {
        setActiveCall(null)
        setCallStatus('')
        openCallOverlay(nextCall)
      } else if (status !== 'ringing') {
        setActiveCall(null)
        setCallStatus(`Call ${status}.`)
      }
    }
    const handleCallUpdate = (event) => {
      if (event.detail?.id === activeCall.id) applyCallStatus(event.detail.status)
    }
    const reconcileCall = async () => {
      try {
        const call = await readCall(activeCall.id)
        applyCallStatus(call.status)
      } catch (requestError) {
        setCallStatus(requestError.message)
      }
    }
    const expiryDelay = Math.max(0, new Date(activeCall.expiresAt).getTime() - Date.now())
    const expiryTimeout = window.setTimeout(() => applyCallStatus('missed'), expiryDelay)
    window.addEventListener('zumbarl:call-updated', handleCallUpdate)
    window.addEventListener('zumbarl:realtime-connected', reconcileCall)
    return () => {
      window.clearInterval(ringtoneInterval)
      window.clearTimeout(expiryTimeout)
      window.removeEventListener('zumbarl:call-updated', handleCallUpdate)
      window.removeEventListener('zumbarl:realtime-connected', reconcileCall)
    }
  }, [activeCall])

  useEffect(() => {
    if (isPageConversation || isGroupConversation || !requestedCallType || !activeParticipantId || activeParticipantId !== requestedParticipantId) return
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
  }, [activeConversation?.participant.name, activeOpportunityId, activeParticipantId, isGroupConversation, isPageConversation, requestedCallType, requestedParticipantId, requestedParticipantName])

  async function startCall(callType) {
    if (!activeConversation || isPageConversation || isGroupConversation) return
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

  function selectConversationTab(nextTab) {
    conversationTabRef.current = nextTab
    setConversationTab(nextTab)
    const currentConversation = conversations.find((conversation) => conversation.id === activeConversationId)
    if (nextTab === 'all' || (currentConversation?.kind || 'personal') === nextTab) return
    const nextConversation = conversations.find((conversation) => (conversation.kind || 'personal') === nextTab)
    setActiveConversationId(nextConversation?.id || '')
    setDraft('')
    setStagedOrderInquiry(null)
  }

  function selectConversation(conversation) {
    setActiveConversationId(conversation.id)
    setDraft('')
    setStagedOrderInquiry(null)
    if (requestedConversationKey) {
      requestedConversationAppliedRef.current = requestedConversationKey
      setSearchParams(new URLSearchParams(), { replace: true })
    }
  }

  async function openNewConversation() {
    setIsNewConversationOpen(true)
    setNetworkTargets([])
    setNetworkQuery('')
    setNetworkKind('all')
    setNetworkStatus('Loading your network…')
    try {
      const response = await listMessageNetwork()
      setNetworkTargets(response.data || [])
      setNetworkStatus('')
    } catch (requestError) {
      setNetworkStatus(requestError.message || 'Your network could not be loaded.')
    }
  }

  async function startNetworkConversation(target) {
    if (networkStartingId) return
    setNetworkStartingId(target.id)
    setNetworkStatus('')
    try {
      if (target.kind === 'page') {
        const conversation = await ensurePageConversation({
          pageType: target.page.type,
          pageId: target.page.id,
        })
        const normalized = normalizePageConversation(conversation)
        setConversations((current) => upsertConversation(current, normalized))
        conversationTabRef.current = 'page'
        setConversationTab('page')
        setActiveConversationId(normalized.id)
        setSearchParams(new URLSearchParams({
          pageType: target.page.type,
          pageId: target.page.id,
          pageName: target.page.name,
          pageSlug: target.page.slug || '',
        }), { replace: true })
      } else {
        const existing = conversations.find((conversation) => (
          !['page', 'group'].includes(conversation.kind)
          && conversation.participant?.id === target.participant.id
        ))
        const conversation = existing || {
          id: `direct:${target.participant.id}`,
          kind: 'personal',
          participant: target.participant,
          opportunityId: null,
          latestMessage: { body: 'Start a conversation' },
          unreadCount: 0,
        }
        setConversations((current) => upsertConversation(current, conversation))
        conversationTabRef.current = conversation.kind || 'personal'
        setConversationTab(conversation.kind || 'personal')
        setActiveConversationId(conversation.id)
        const params = new URLSearchParams({
          participantId: target.participant.id,
          participantName: target.participant.name,
        })
        if (target.participant.avatarUrl) params.set('participantAvatar', target.participant.avatarUrl)
        if (target.participant.studentId) params.set('participantStudentId', target.participant.studentId)
        setSearchParams(params, { replace: true })
      }
      setDraft('')
      setStagedOrderInquiry(null)
      setIsNewConversationOpen(false)
      window.requestAnimationFrame(() => composerInputRef.current?.focus())
    } catch (requestError) {
      setNetworkStatus(requestError.message || 'This conversation could not be started.')
    } finally {
      setNetworkStartingId('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !activeConversation || isSending) return
    setIsSending(true)
    setError('')
    try {
      const context = stagedOrderInquiry?.conversationId === activeConversationId
        ? { type: 'marketplace_order', order: stagedOrderInquiry.order }
        : undefined
      const message = isPageConversation
        ? await sendPageMessage(activePageConversationId, { body, context, sendAsPage: activeConversation.actingAsPage })
        : isGroupConversation
          ? await sendProjectGroupMessage(activeProjectGroupId, { body })
          : await sendMessage({
            recipientId: activeConversation.participant.id,
            opportunityId: activeConversation.opportunityId,
            body,
            context,
          })
      shouldScrollAfterSendRef.current = true
      setMessages((current) => [...current, message])
      setDraft('')
      setStagedOrderInquiry(null)
      if (shouldStartOrderInquiry) {
        const nextSearchParams = new URLSearchParams(searchParams)
        nextSearchParams.delete('orderInquiry')
        setSearchParams(nextSearchParams, { replace: true })
      }
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
                <div className="messages-search-row">
                  <label className="messages-search">
                    <FiSearch aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search conversations"
                      value={conversationQuery}
                      onChange={(event) => setConversationQuery(event.target.value)}
                    />
                  </label>
                  <button className="messages-new-button" onClick={openNewConversation} type="button" aria-label="Start a new conversation" title="New conversation"><FiEdit3 aria-hidden="true" /></button>
                </div>
                <nav className="messages-conversation-tabs" aria-label="Conversation types" role="tablist">
                  {CONVERSATION_TABS.map((tab) => {
                    const Icon = tab.icon
                    return <button
                      aria-selected={conversationTab === tab.id}
                      className={conversationTab === tab.id ? 'is-active' : ''}
                      key={tab.id}
                      onClick={() => selectConversationTab(tab.id)}
                      role="tab"
                      title={`${tab.label} conversations`}
                      type="button"
                    >
                      <Icon aria-hidden="true" />
                      <span>{tab.label}</span>
                      <b>{conversationCounts[tab.id]}</b>
                    </button>
                  })}
                </nav>
                <div className="messages-conversation-list" role="tabpanel">
                {visibleConversations.length ? visibleConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`messages-conversation-row${conversation.id === activeConversation?.id ? ' is-active' : ''}`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <span className={`messages-avatar is-${conversation.kind || 'personal'}`}>
                      {conversation.kind === 'group'
                        ? <FiUsers aria-hidden="true" />
                        : participantAvatar(conversation.participant)
                        ? <img src={participantAvatar(conversation.participant)} alt="" />
                        : conversation.participant.name.slice(0, 1)}
                    </span>
                    <span className="messages-conversation-copy">
                      <span className="messages-conversation-title"><strong>{conversation.participant.name}</strong><time>{conversationTime(conversation.latestMessage?.createdAt)}</time></span>
                      <i className={`messages-kind-label is-${conversation.kind || 'personal'}`}>
                        {conversation.kind === 'group'
                          ? `Project group${conversation.participantCount ? ` · ${conversation.participantCount} members` : ''}`
                          : conversation.kind === 'page'
                            ? (conversation.actingAsPage ? `${conversation.page.name} inbox` : 'Official page')
                            : conversation.kind === 'errand'
                              ? 'Order delivery'
                              : 'Personal'}
                      </i>
                      <small>{conversation.latestMessage.body}</small>
                    </span>
                    {conversation.unreadCount ? <em aria-label={`${conversation.unreadCount} unread`}>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</em> : null}
                  </button>
                )) : (
                  <div className="messages-empty-list">
                    {conversationTab === 'group' ? <FiUsers aria-hidden="true" /> : conversationTab === 'errand' ? <FiTruck aria-hidden="true" /> : conversationTab === 'personal' ? <FiUser aria-hidden="true" /> : <FiMessageCircle aria-hidden="true" />}
                    <strong>{conversationQuery ? 'No matching conversations' : `No ${conversationTab === 'all' ? '' : `${conversationTab} `}conversations yet`}</strong>
                    <p>{conversationQuery ? 'Try another name or message.' : conversationTab === 'group' ? 'Project group chats will appear after the team starts talking.' : conversationTab === 'page' ? 'Messages with pages and shared page inboxes appear here.' : conversationTab === 'errand' ? 'Buyer and errander delivery updates appear here.' : 'New conversations will appear here in real time.'}</p>
                  </div>
                )}
                </div>
              </aside>

              <section className="messages-thread">
                {activeConversation ? (
                  <>
                    <header>
                      {isPageConversation ? (
                        <Link className="messages-participant-link" to={activeConversation.actingAsPage ? activeConversation.page.inboxHref : activeConversation.page.href}>
                          <span className="messages-avatar">
                            {participantAvatar(activeConversation.participant)
                              ? <img src={participantAvatar(activeConversation.participant)} alt="" />
                              : activeConversation.participant.name.slice(0, 1)}
                          </span>
                          <span>
                            <h2>{activeConversation.participant.name}</h2>
                            <p>{activeConversation.actingAsPage ? `Shared ${activeConversation.page.name} inbox · replying as page` : 'Official page conversation'}</p>
                          </span>
                        </Link>
                      ) : isGroupConversation ? (
                        <Link className="messages-participant-link" to={activeConversation.href}>
                          <span className="messages-avatar is-group"><FiUsers aria-hidden="true" /></span>
                          <span>
                            <h2>{activeConversation.participant.name}</h2>
                            <p>{activeConversation.participantCount ? `${activeConversation.participantCount} project members` : 'Shared project conversation'}</p>
                          </span>
                        </Link>
                      ) : activeConversation.participant.studentId ? (
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
                            <p>{activeConversation.kind === 'errand' ? 'Order delivery · View profile' : 'View profile'}</p>
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
                      {!isPageConversation && !isGroupConversation ? <div className="messages-call-actions">
                        {activeCall?.status === 'ringing' ? (
                          <button type="button" aria-label="Cancel call" onClick={stopCalling}><FiPhoneOff aria-hidden="true" /></button>
                        ) : (
                          <>
                            <button type="button" aria-label="Start audio call" onClick={() => startCall('audio')}><FiPhone aria-hidden="true" /></button>
                            <button type="button" aria-label="Start video call" onClick={() => startCall('video')}><FiVideo aria-hidden="true" /></button>
                          </>
                        )}
                      </div> : null}
                    </header>
                    {callStatus ? <p className="messages-call-status" role="status">{callStatus}</p> : null}
                    <div ref={threadBodyRef} className="messages-thread-body" aria-live="polite">
                      {messages.map((message) => {
                        const isMine = isPageConversation
                          ? (activeConversation.actingAsPage ? message.senderKind === 'page' : message.senderKind === 'user')
                          : isGroupConversation
                            ? Boolean(message.isMine || message.senderId === viewerUserId)
                            : message.senderId !== activeConversation.participant.id
                        const offer = message.context?.offer?.id ? offerStates[message.context.offer.id] : null
                        const isOfferBuyer = Boolean(offer && offer.buyerId === viewerUserId)
                        const isOfferSeller = Boolean(offer && (offer.sellerId === viewerUserId || offer.canManage))
                        const isActiveOfferCard = latestOfferMessageIds.has(message.id)
                        return (
                          <article key={message.id} className={isMine ? 'is-mine' : ''}>
                            {!isMine ? (
                              <span className="messages-message-avatar">
                                {participantAvatar(isGroupConversation ? message.sender : activeConversation.participant)
                                  ? <img src={participantAvatar(isGroupConversation ? message.sender : activeConversation.participant)} alt="" />
                                  : (isGroupConversation ? message.sender?.name : activeConversation.participant.name)?.slice(0, 1) || '?'}
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
                              {message.context?.order ? (() => {
                                const order = message.context.order
                                const href = isPageConversation
                                  ? (activeConversation.actingAsPage ? order.pageHref || order.recipientHref : order.customerHref || order.senderHref)
                                  : viewerUserId === order.senderUserId ? order.senderHref : order.recipientHref
                                return <Link className="messages-order-preview" to={href}>
                                  <span>{order.image ? <img src={order.image} alt="" /> : <FiPackage />}</span>
                                  <span><small>MARKETPLACE ORDER · {order.identifier}</small><strong>{order.title}</strong><b>{order.total ? formatMoney(order.total, order.currency) : String(order.status).replaceAll('_', ' ')}</b></span>
                                  <FiArrowRight />
                                </Link>
                              })() : null}
                              <p>{message.body}</p>
                              <time dateTime={message.createdAt}>
                                {formatTime(message.createdAt)}
                                {isMine ? ` · ${message.isRead ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}` : ''}
                              </time>
                            </div>
                            {isMine ? (
                              <span className="messages-message-avatar">
                                {isPageConversation && activeConversation.actingAsPage
                                  ? (participantAvatar(activeConversation.page) ? <img src={participantAvatar(activeConversation.page)} alt="" /> : activeConversation.page.name.slice(0, 1))
                                  : viewerProfile.avatar
                                    ? <img src={viewerProfile.avatar} alt="" />
                                    : viewerProfile.initials}
                              </span>
                            ) : null}
                          </article>
                        )
                      })}
                      <div ref={messageEndRef} />
                    </div>
                    <form className={stagedOrderInquiry?.conversationId === activeConversationId ? 'has-order-inquiry' : ''} onSubmit={handleSubmit}>
                      {stagedOrderInquiry?.conversationId === activeConversationId ? <div className="messages-composer-order">
                        <Link className="messages-composer-order-link" to={activeActsAsPage ? stagedOrderInquiry.order.pageHref : stagedOrderInquiry.order.customerHref || stagedOrderInquiry.order.senderHref}>
                          <span>{stagedOrderInquiry.order.image ? <img alt="" src={stagedOrderInquiry.order.image} /> : <FiPackage />}</span>
                          <span><small>ATTACHED ORDER · {stagedOrderInquiry.order.identifier}</small><strong>{stagedOrderInquiry.order.title}</strong><b>{stagedOrderInquiry.order.total ? formatMoney(stagedOrderInquiry.order.total, stagedOrderInquiry.order.currency) : stagedOrderInquiry.order.status.replaceAll('_', ' ')}</b></span>
                          <FiArrowRight />
                        </Link>
                        <button className="messages-composer-order-detach" onClick={() => setStagedOrderInquiry(null)} type="button" aria-label={`Detach ${stagedOrderInquiry.order.title} order`} title="Detach order"><FiX /></button>
                      </div> : null}
                      <input
                        ref={composerInputRef}
                        type="text"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={isPageConversation && activeConversation.actingAsPage ? `Reply as ${activeConversation.page.name}` : isGroupConversation ? 'Message the project group' : `Message ${activeConversation.participant.name}`}
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
                    <p>Message someone you follow, someone following you, or a page in your network.</p>
                    <button className="messages-empty-new" onClick={openNewConversation} type="button"><FiEdit3 aria-hidden="true" /> New conversation</button>
                  </div>
                )}
              </section>
            </div>
            {error ? <p className="messages-error" role="alert">{error}</p> : null}
          </section>
        </div>
      </div>
      {isNewConversationOpen ? <div className="messages-new-overlay" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsNewConversationOpen(false)
      }}>
        <section className="messages-new-dialog" role="dialog" aria-modal="true" aria-labelledby="messages-new-title">
          <header>
            <span><small>Your network</small><h2 id="messages-new-title">New conversation</h2><p>Choose someone you follow, someone following you, or a page you follow.</p></span>
            <button onClick={() => setIsNewConversationOpen(false)} type="button" aria-label="Close new conversation"><FiX aria-hidden="true" /></button>
          </header>
          <label className="messages-network-search">
            <FiSearch aria-hidden="true" />
            <input autoFocus type="search" value={networkQuery} onChange={(event) => setNetworkQuery(event.target.value)} placeholder="Search your network" />
          </label>
          <nav className="messages-network-filters" aria-label="Network types">
            {[['all', 'All'], ['person', 'People'], ['page', 'Pages']].map(([id, label]) => <button className={networkKind === id ? 'is-active' : ''} key={id} onClick={() => setNetworkKind(id)} type="button">{label}</button>)}
          </nav>
          <div className="messages-network-results">
            {visibleNetworkTargets.map((target) => <button disabled={Boolean(networkStartingId)} key={target.id} onClick={() => startNetworkConversation(target)} type="button">
              <span className={`messages-network-avatar is-${target.kind}`}>
                {participantAvatar(target.participant) ? <img alt="" src={participantAvatar(target.participant)} /> : target.kind === 'page' ? <FiMessageCircle aria-hidden="true" /> : target.participant.name.slice(0, 1)}
              </span>
              <span><strong>{target.participant.name}</strong><small>{target.kind === 'page' ? 'Page' : 'Person'} · {target.relationship}</small></span>
              <FiArrowRight aria-hidden="true" />
            </button>)}
            {!visibleNetworkTargets.length && !networkStatus ? <div className="messages-network-empty"><FiUsers aria-hidden="true" /><strong>{networkQuery ? 'No matches in your network' : 'Your network is empty'}</strong><p>{networkQuery ? 'Try another name or switch the filter.' : 'Follow people or pages to start conversations from here.'}</p></div> : null}
            {networkStatus ? <p className="messages-network-status" role="status">{networkStatus}</p> : null}
          </div>
        </section>
      </div> : null}
    </main>
  )
}

export default MessagesPage
