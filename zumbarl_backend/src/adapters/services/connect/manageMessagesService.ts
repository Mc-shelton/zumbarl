import { prisma } from '../../../lib/prisma.js'
import { forbidden, notFound } from '../../../lib/http.js'
import { emitRealtimeEvent, hasRealtimeSubscribers } from '../../../lib/realtimeEvents.js'
import { projectWorkflowsRepository } from '../../repositories/projects/projectWorkflows.repository.js'

const participantSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  role: true,
  studentProfile: { select: { id: true, avatarUrl: true } },
  companyContact: {
    select: {
      company: { select: { name: true, logoUrl: true } }
    }
  }
} as const

function participantPayload(user: any) {
  return {
    id: user.id,
    name: user.companyContact?.company?.name
      || user.name
      || [user.firstName, user.lastName].filter(Boolean).join(' ')
      || 'Zumbarl user',
    role: user.role,
    studentId: user.studentProfile?.id || null,
    avatarUrl: user.studentProfile?.avatarUrl || user.companyContact?.company?.logoUrl || null
  }
}

async function readProjectGroupContext(projectId: string, userId: string) {
  const project = await projectWorkflowsRepository.findProject(projectId)
  if (!project) notFound('Project')
  const [participants, actor, businessContacts] = await Promise.all([
    projectWorkflowsRepository.listProjectMessageParticipants(projectId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        studentProfile: { select: { id: true } },
        companyContact: { select: { companyId: true } }
      }
    }),
    project.businessId
      ? prisma.companyContact.findMany({
          where: { companyId: project.businessId },
          select: { userId: true }
        })
      : []
  ])
  const canAccess = participants.some((participant) => participant.userId === userId)
    || project.ownerId === userId
    || actor?.studentProfile?.id === project.studentId
    || actor?.companyContact?.companyId === project.businessId
    || actor?.role === 'SUPER_ADMIN'
  if (!canAccess) {
    forbidden('You are not a participant in this project')
  }
  const recipientUserIds = [...new Set([
    ...participants.map((participant) => participant.userId),
    ...businessContacts.map((contact) => contact.userId)
  ])]
  return { participants, project, recipientUserIds }
}

async function listProjectGroupMessagesService(userId: string | undefined, projectId: string) {
  if (!userId) forbidden()
  await readProjectGroupContext(projectId, userId)

  const records = await prisma.workflowRecord.findMany({
    where: {
      collection: 'projectGroupMessages',
      data: { path: ['projectId'], equals: projectId }
    },
    orderBy: { createdAt: 'asc' },
    take: 500
  })
  const data = records.map((record) => (
    record.data && typeof record.data === 'object' && !Array.isArray(record.data)
      ? record.data as Record<string, any>
      : {}
  ))
  const senderIds = [...new Set(data.map((message) => String(message.senderId || '')).filter(Boolean))]
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: participantSelect
  })
  const senderById = new Map(senders.map((sender) => [sender.id, participantPayload(sender)]))

  return records.map((record, index) => ({
    id: record.id,
    projectGroupId: projectId,
    opportunityId: data[index].opportunityId || null,
    senderId: data[index].senderId,
    sender: senderById.get(data[index].senderId) || null,
    body: data[index].body || '',
    fileUrls: Array.isArray(data[index].fileUrls) ? data[index].fileUrls : [],
    createdAt: record.createdAt,
    isMine: data[index].senderId === userId
  }))
}

async function createProjectGroupMessageService(
  senderId: string | undefined,
  projectId: string,
  input: { body: string; fileUrls: string[] }
) {
  if (!senderId) forbidden()
  const { project, recipientUserIds } = await readProjectGroupContext(projectId, senderId)
  const sender = await prisma.user.findUnique({ where: { id: senderId }, select: participantSelect })
  if (!sender) notFound('Sender')

  const record = await prisma.workflowRecord.create({
    data: {
      collection: 'projectGroupMessages',
      data: {
        projectId,
        opportunityId: project.opportunityId || null,
        senderId,
        body: input.body,
        fileUrls: input.fileUrls
      }
    }
  })
  const payload = {
    id: record.id,
    projectGroupId: projectId,
    opportunityId: project.opportunityId || null,
    senderId,
    sender: participantPayload(sender),
    body: input.body,
    fileUrls: input.fileUrls,
    createdAt: record.createdAt,
    isMine: true
  }
  for (const recipientUserId of recipientUserIds) {
    if (recipientUserId !== senderId) {
      emitRealtimeEvent(recipientUserId, { type: 'message.created', data: { ...payload, isMine: false } })
    }
  }
  return payload
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
  input: { recipientId: string; opportunityId?: string; body: string; fileUrls: string[]; context?: Record<string, any> }
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
  const isMarketplaceMessage = ['marketplace_product', 'marketplace_offer'].includes(String(input.context?.type || ''))
  if (!existingConversation && !input.opportunityId && !isMarketplaceMessage) {
    forbidden('A verified opportunity or existing conversation is required to start messaging')
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId: input.recipientId,
      opportunityId: input.opportunityId,
      body: input.body,
      fileUrls: input.fileUrls,
      context: input.context,
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
  createMessageService,
  listProjectGroupMessagesService,
  createProjectGroupMessageService
}
