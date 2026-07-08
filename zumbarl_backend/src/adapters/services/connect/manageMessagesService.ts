import { prisma } from '../../../lib/prisma.js'
import { forbidden, notFound } from '../../../lib/http.js'
import { emitRealtimeEvent, hasRealtimeSubscribers } from '../../../lib/realtimeEvents.js'

const participantSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  role: true,
  studentProfile: { select: { avatarUrl: true } },
  companyContact: {
    select: {
      company: { select: { name: true, logoUrl: true } }
    }
  }
} as const

function participantPayload(user: any) {
  return {
    id: user.id,
    name: user.name
      || user.companyContact?.company?.name
      || [user.firstName, user.lastName].filter(Boolean).join(' ')
      || 'Zumbarl user',
    role: user.role,
    avatarUrl: user.studentProfile?.avatarUrl || user.companyContact?.company?.logoUrl || null
  }
}

async function listConversationsService(userId?: string) {
  if (!userId) forbidden()
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: {
      sender: { select: participantSelect },
      recipient: { select: participantSelect }
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  })

  const newlyDelivered = messages.filter((message) => (
    message.recipientId === userId && !message.deliveredAt
  ))
  if (newlyDelivered.length) {
    const deliveredAt = new Date()
    await prisma.message.updateMany({
      where: { id: { in: newlyDelivered.map((message) => message.id) } },
      data: { deliveredAt }
    })
    for (const message of newlyDelivered) {
      message.deliveredAt = deliveredAt
      emitRealtimeEvent(message.senderId, {
        type: 'message.delivered',
        data: { messageId: message.id, deliveredAt: deliveredAt.toISOString() }
      })
    }
  }

  const conversations = new Map<string, any>()
  for (const message of messages) {
    const participant = message.senderId === userId ? message.recipient : message.sender
    const key = `${participant.id}:${message.opportunityId || ''}`
    const current = conversations.get(key)
    if (!current) {
      conversations.set(key, {
        id: key,
        participant: participantPayload(participant),
        opportunityId: message.opportunityId,
        latestMessage: {
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt
        },
        unreadCount: message.recipientId === userId && !message.isRead ? 1 : 0
      })
    } else if (message.recipientId === userId && !message.isRead) {
      current.unreadCount += 1
    }
  }

  const data = [...conversations.values()]
  return {
    data,
    unreadCount: data.reduce((total, conversation) => total + conversation.unreadCount, 0)
  }
}

async function listMessagesService(
  userId: string | undefined,
  input: { participantId: string; opportunityId?: string }
) {
  if (!userId) forbidden()
  const opportunityFilter = input.opportunityId
    ? { opportunityId: input.opportunityId }
    : { opportunityId: null }
  const where = {
    ...opportunityFilter,
    OR: [
      { senderId: userId, recipientId: input.participantId },
      { senderId: input.participantId, recipientId: userId }
    ]
  }
  const readAt = new Date()
  const [messages] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      include: {
        sender: { select: participantSelect },
        recipient: { select: participantSelect }
      },
      orderBy: { createdAt: 'asc' },
      take: 500
    }),
    prisma.message.updateMany({
      where: {
        ...opportunityFilter,
        senderId: input.participantId,
        recipientId: userId,
        deliveredAt: null
      },
      data: { deliveredAt: readAt }
    }),
    prisma.message.updateMany({
      where: {
        ...opportunityFilter,
        senderId: input.participantId,
        recipientId: userId,
        isRead: false
      },
      data: { isRead: true, readAt }
    })
  ])
  const newlyRead = messages.filter((message) => (
    message.recipientId === userId && !message.isRead
  ))
  for (const message of newlyRead) {
    emitRealtimeEvent(message.senderId, {
      type: 'message.read',
      data: {
        messageId: message.id,
        deliveredAt: (message.deliveredAt || readAt).toISOString(),
        readAt: readAt.toISOString()
      }
    })
  }
  return messages.map((message) => ({
    ...message,
    ...(message.recipientId === userId
      ? { deliveredAt: message.deliveredAt || readAt, isRead: true, readAt }
      : {}),
    sender: participantPayload(message.sender),
    recipient: participantPayload(message.recipient)
  }))
}

async function createMessageService(
  senderId: string | undefined,
  input: { recipientId: string; opportunityId?: string; body: string; fileUrls: string[] }
) {
  if (!senderId) forbidden()
  if (senderId === input.recipientId) forbidden('You cannot message yourself')
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: { id: true, isActive: true }
  })
  if (!recipient?.isActive) notFound('Recipient')

  const existingConversation = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId, recipientId: input.recipientId },
        { senderId: input.recipientId, recipientId: senderId }
      ],
      ...(input.opportunityId ? { opportunityId: input.opportunityId } : {})
    },
    select: { id: true }
  })
  if (!existingConversation && !input.opportunityId) {
    forbidden('A verified opportunity or existing conversation is required to start messaging')
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId: input.recipientId,
      opportunityId: input.opportunityId,
      body: input.body,
      fileUrls: input.fileUrls,
      deliveredAt: hasRealtimeSubscribers(input.recipientId) ? new Date() : null
    },
    include: {
      sender: { select: participantSelect },
      recipient: { select: participantSelect }
    }
  })
  const payload = {
    ...message,
    sender: participantPayload(message.sender),
    recipient: participantPayload(message.recipient)
  }
  emitRealtimeEvent(input.recipientId, { type: 'message.created', data: payload })
  return payload
}

export {
  listConversationsService,
  listMessagesService,
  createMessageService
}
