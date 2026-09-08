import { createHash } from 'node:crypto'
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

function isErrandMessageContext(context: unknown) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return false
  const value = context as Record<string, any>
  const messageIntent = String(value.order?.messageIntent || value.messageIntent || '')
  const orderHrefs = [value.order?.senderHref, value.order?.recipientHref]
  return messageIntent.includes('errander')
    || String(value.automatedEventId || '').startsWith('errand-')
    || orderHrefs.some((href) => String(href || '').includes('tab=errands'))
}

type PageConversationType = 'marketplace_shop' | 'managed_profile'

type PageIdentity = {
  id: string
  type: PageConversationType
  name: string
  slug: string
  avatarUrl: string | null
  href: string
  inboxHref: string
  managerUserIds: string[]
}

function workflowData(record: { data: unknown }) {
  return record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? record.data as Record<string, any>
    : {}
}

function pageKey(pageType: string, pageId: string) {
  return `${pageType}:${pageId}`
}

function pageConversationKey(pageType: string, pageId: string, customerUserId: string) {
  return `${pageKey(pageType, pageId)}:${customerUserId}`
}

function deterministicPageConversationId(pageType: string, pageId: string, customerUserId: string) {
  const digest = createHash('sha256')
    .update(pageConversationKey(pageType, pageId, customerUserId))
    .digest('hex')
    .slice(0, 32)
  return `pageconv_${digest}`
}

async function readPageIdentity(pageType: PageConversationType, pageId: string): Promise<PageIdentity> {
  if (pageType === 'marketplace_shop') {
    const shop = await prisma.marketplaceShop.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        status: true,
        owner: { select: { userId: true } },
        managers: { select: { userId: true } }
      }
    })
    if (!shop || ['SUSPENDED', 'ARCHIVED'].includes(shop.status)) notFound('Page')
    return {
      id: shop.id,
      type: pageType,
      name: shop.name,
      slug: shop.slug,
      avatarUrl: shop.logoUrl,
      href: `/campus/vendors/${encodeURIComponent(shop.slug)}`,
      inboxHref: `/campus/vendors/${encodeURIComponent(shop.slug)}/manage?tab=messages`,
      managerUserIds: [...new Set([shop.owner.userId, ...shop.managers.map((manager) => manager.userId)])]
    }
  }

  const profile = await prisma.managedProfile.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      status: true,
      managers: { select: { userId: true } }
    }
  })
  if (!profile || profile.status === 'archived') notFound('Page')
  return {
    id: profile.id,
    type: pageType,
    name: profile.name,
    slug: profile.slug,
    avatarUrl: profile.avatarUrl,
    href: `/campus/organizations/${encodeURIComponent(profile.slug)}`,
    inboxHref: `/campus/organizations/${encodeURIComponent(profile.slug)}#messages`,
    managerUserIds: profile.managers.map((manager) => manager.userId)
  }
}

async function readPageConversationAccess(conversationId: string, userId: string) {
  const conversation = await prisma.workflowRecord.findFirst({
    where: { id: conversationId, collection: 'pageConversations' }
  })
  if (!conversation) notFound('Page conversation')
  const data = workflowData(conversation)
  const page = await readPageIdentity(data.pageType, data.pageId)
  const isCustomer = data.customerUserId === userId
  const isPageManager = page.managerUserIds.includes(userId)
  if (!isCustomer && !isPageManager) forbidden('You do not have access to this page conversation')
  return { conversation, data, page, isCustomer, isPageManager }
}

async function pageConversationPayload(record: any, userId: string, page?: PageIdentity) {
  const data = workflowData(record)
  const identity = page || await readPageIdentity(data.pageType, data.pageId)
  const customer = await prisma.user.findUnique({
    where: { id: data.customerUserId },
    select: participantSelect
  })
  if (!customer) notFound('Customer')
  const actingAsPage = identity.managerUserIds.includes(userId) && data.customerUserId !== userId
  const latest = await prisma.workflowRecord.findFirst({
    where: {
      collection: 'pageMessages',
      data: { path: ['conversationId'], equals: record.id }
    },
    orderBy: { createdAt: 'desc' }
  })
  const latestData = latest ? workflowData(latest) : null
  const messages = await prisma.workflowRecord.findMany({
    where: {
      collection: 'pageMessages',
      data: { path: ['conversationId'], equals: record.id }
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  })
  const unreadCount = messages.filter((message) => {
    const value = workflowData(message)
    const readBy = Array.isArray(value.readByUserIds) ? value.readByUserIds : []
    const incoming = actingAsPage ? value.senderKind === 'user' : value.senderKind === 'page'
    return incoming && !readBy.includes(userId)
  }).length
  return {
    id: record.id,
    kind: 'page',
    page: identity,
    customer: participantPayload(customer),
    participant: actingAsPage ? participantPayload(customer) : {
      id: pageKey(identity.type, identity.id),
      name: identity.name,
      avatarUrl: identity.avatarUrl,
      pageType: identity.type,
      pageId: identity.id,
      href: identity.href
    },
    actingAsPage,
    latestMessage: latest ? {
      id: latest.id,
      body: latestData?.body || '',
      senderId: latestData?.senderId,
      senderKind: latestData?.senderKind,
      createdAt: latest.createdAt
    } : { body: `Start a conversation with ${identity.name}`, createdAt: record.createdAt },
    unreadCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

async function listPageConversationsService(
  userId: string | undefined,
  input: { pageType?: PageConversationType; pageId?: string } = {}
) {
  if (!userId) forbidden()
  const records = await prisma.workflowRecord.findMany({
    where: { collection: 'pageConversations' },
    orderBy: { updatedAt: 'desc' },
    take: 1000
  })
  const data = records.map(workflowData)
  const identities = new Map<string, PageIdentity>()
  await Promise.all(records.map(async (record, index) => {
    const value = data[index]
    if (input.pageType && value.pageType !== input.pageType) return
    if (input.pageId && value.pageId !== input.pageId) return
    try {
      const page = await readPageIdentity(value.pageType, value.pageId)
      identities.set(pageKey(value.pageType, value.pageId), page)
    } catch {
      // Ignore conversations whose page has since been removed.
    }
  }))
  const visible = records.filter((record, index) => {
    const value = data[index]
    if (input.pageType && value.pageType !== input.pageType) return false
    if (input.pageId && value.pageId !== input.pageId) return false
    const page = identities.get(pageKey(value.pageType, value.pageId))
    return Boolean(page && (value.customerUserId === userId || page.managerUserIds.includes(userId)))
  })
  const uniqueVisible = [...visible.reduce((grouped, record) => {
    const value = workflowData(record)
    const key = pageConversationKey(value.pageType, value.pageId, value.customerUserId)
    if (!grouped.has(key)) grouped.set(key, record)
    return grouped
  }, new Map<string, typeof visible[number]>()).values()]
  const conversations = await Promise.all(uniqueVisible.map((record) => {
    const value = workflowData(record)
    return pageConversationPayload(record, userId, identities.get(pageKey(value.pageType, value.pageId)))
  }))
  conversations.sort((left, right) => new Date(right.latestMessage.createdAt).getTime() - new Date(left.latestMessage.createdAt).getTime())
  return {
    data: conversations,
    unreadCount: conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
  }
}

async function createPageConversationService(
  userId: string | undefined,
  input: { pageType: PageConversationType; pageId: string; customerUserId?: string }
) {
  if (!userId) forbidden()
  const page = await readPageIdentity(input.pageType, input.pageId)
  const requestedCustomerId = input.customerUserId || userId
  const isPageManager = page.managerUserIds.includes(userId)
  if (input.customerUserId && input.customerUserId !== userId && !isPageManager) {
    forbidden('Only a page manager can open a page conversation for a customer')
  }
  if (requestedCustomerId === userId && isPageManager && !input.customerUserId) {
    forbidden('Open the page inbox to reply as this page')
  }
  const customer = await prisma.user.findUnique({ where: { id: requestedCustomerId }, select: { id: true, isActive: true } })
  if (!customer?.isActive) notFound('Customer')
  let conversation = await prisma.workflowRecord.findFirst({
    where: {
      collection: 'pageConversations',
      AND: [
        { data: { path: ['pageType'], equals: input.pageType } },
        { data: { path: ['pageId'], equals: input.pageId } },
        { data: { path: ['customerUserId'], equals: requestedCustomerId } }
      ]
    },
    orderBy: { updatedAt: 'desc' }
  })
  const wasCreated = !conversation
  if (!conversation) {
    conversation = await prisma.workflowRecord.upsert({
      where: { id: deterministicPageConversationId(input.pageType, input.pageId, requestedCustomerId) },
      update: {},
      create: {
        id: deterministicPageConversationId(input.pageType, input.pageId, requestedCustomerId),
        collection: 'pageConversations',
        data: {
          pageType: input.pageType,
          pageId: input.pageId,
          customerUserId: requestedCustomerId,
          createdByUserId: userId
        },
      }
    })
  }
  const payload = await pageConversationPayload(conversation, userId, page)
  if (wasCreated) {
    for (const recipientUserId of [...new Set([requestedCustomerId, ...page.managerUserIds])]) {
      if (recipientUserId !== userId) {
        const recipientConversation = await pageConversationPayload(conversation, recipientUserId, page)
        emitRealtimeEvent(recipientUserId, {
          type: 'page-conversation.created',
          data: recipientConversation
        })
      }
    }
  }
  return payload
}

async function listPageMessagesService(userId: string | undefined, conversationId: string) {
  if (!userId) forbidden()
  const access = await readPageConversationAccess(conversationId, userId)
  const records = await prisma.workflowRecord.findMany({
    where: {
      collection: 'pageMessages',
      data: { path: ['conversationId'], equals: conversationId }
    },
    orderBy: { createdAt: 'asc' },
    take: 500
  })
  const senderIds = [...new Set(records.map((record) => workflowData(record).senderId).filter(Boolean))]
  const senders = await prisma.user.findMany({ where: { id: { in: senderIds } }, select: participantSelect })
  const senderById = new Map(senders.map((sender) => [sender.id, participantPayload(sender)]))
  const unread = records.filter((record) => {
    const value = workflowData(record)
    const incoming = access.isPageManager ? value.senderKind === 'user' : value.senderKind === 'page'
    return incoming && !(Array.isArray(value.readByUserIds) ? value.readByUserIds : []).includes(userId)
  })
  await Promise.all(unread.map((record) => {
    const value = workflowData(record)
    return prisma.workflowRecord.update({
      where: { id: record.id },
      data: { data: { ...value, readByUserIds: [...new Set([...(value.readByUserIds || []), userId])] } }
    })
  }))
  return records.map((record) => {
    const value = workflowData(record)
    const readByUserIds = Array.isArray(value.readByUserIds) ? value.readByUserIds : []
    const isRead = value.senderKind === 'page'
      ? readByUserIds.includes(access.data.customerUserId)
      : access.page.managerUserIds.some((managerUserId) => readByUserIds.includes(managerUserId))
    return {
      id: record.id,
      conversationId,
      senderId: value.senderId,
      senderKind: value.senderKind,
      sender: value.senderKind === 'page' ? access.page : senderById.get(value.senderId) || null,
      body: value.body || '',
      fileUrls: Array.isArray(value.fileUrls) ? value.fileUrls : [],
      context: value.context || null,
      createdAt: record.createdAt,
      isRead
    }
  })
}

async function createPageMessageService(
  userId: string | undefined,
  conversationId: string,
  input: { body: string; fileUrls: string[]; context?: Record<string, any>; sendAsPage: boolean }
) {
  if (!userId) forbidden()
  const access = await readPageConversationAccess(conversationId, userId)
  if (input.sendAsPage && !access.isPageManager) forbidden('Only a page manager can reply as this page')
  if (!input.sendAsPage && !access.isCustomer) forbidden('Page managers reply using the page identity')
  const senderKind = input.sendAsPage ? 'page' : 'user'
  const context = input.context?.type === 'marketplace_order'
    ? {
        ...input.context,
        order: {
          ...input.context.order,
          customerHref: input.context.order.customerHref || input.context.order.senderHref,
          pageHref: input.context.order.pageHref || input.context.order.recipientHref
        }
      }
    : input.context
  const record = await prisma.workflowRecord.create({
    data: {
      collection: 'pageMessages',
      data: {
        conversationId,
        senderId: userId,
        senderKind,
        body: input.body,
        fileUrls: input.fileUrls,
        context,
        readByUserIds: [userId]
      }
    }
  })
  const conversationData = workflowData(access.conversation)
  const updatedConversation = await prisma.workflowRecord.update({
    where: { id: conversationId },
    data: { data: { ...conversationData, lastMessageAt: record.createdAt.toISOString() } }
  })
  const recipients = input.sendAsPage
    ? [access.data.customerUserId]
    : access.page.managerUserIds
  const sender = input.sendAsPage
    ? access.page
    : await prisma.user.findUnique({ where: { id: userId }, select: participantSelect }).then((user) => user ? participantPayload(user) : null)
  const payload = {
    id: record.id,
    conversationId,
    senderId: userId,
    senderKind,
    sender,
    body: input.body,
    fileUrls: input.fileUrls,
    context: context || null,
    createdAt: record.createdAt,
    isRead: false
  }
  for (const recipientUserId of [...new Set(recipients)]) {
    if (recipientUserId !== userId) {
      const recipientConversation = await pageConversationPayload(updatedConversation, recipientUserId, access.page)
      emitRealtimeEvent(recipientUserId, {
        type: 'page-message.created',
        data: { ...payload, conversation: recipientConversation }
      })
    }
  }
  return payload
}

async function listMessageNetworkService(userId: string | undefined) {
  if (!userId) forbidden()
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { studentProfile: { select: { id: true } } }
  })
  const viewerStudentId = viewer?.studentProfile?.id
  const relationships = viewerStudentId ? await prisma.connectRelationship.findMany({
    where: {
      type: { in: ['follow', 'connect'] },
      OR: [{ actorStudentId: viewerStudentId }, { targetStudentId: viewerStudentId }]
    }
  }) : []
  const relationshipLabels = new Map<string, Set<string>>()
  for (const relationship of relationships) {
    const otherStudentId = relationship.actorStudentId === viewerStudentId
      ? relationship.targetStudentId
      : relationship.actorStudentId
    if (otherStudentId === viewerStudentId) continue
    const labels = relationshipLabels.get(otherStudentId) || new Set<string>()
    if (relationship.type === 'connect') labels.add('Connected')
    if (relationship.type === 'follow' && relationship.actorStudentId === viewerStudentId) labels.add('Following')
    if (relationship.type === 'follow' && relationship.targetStudentId === viewerStudentId) labels.add('Follows you')
    relationshipLabels.set(otherStudentId, labels)
  }
  const networkUsers = relationshipLabels.size ? await prisma.user.findMany({
    where: {
      isActive: true,
      studentProfile: { is: { id: { in: [...relationshipLabels.keys()] } } }
    },
    select: participantSelect
  }) : []
  const people = networkUsers.map((user) => ({
    id: `person:${user.id}`,
    kind: 'person',
    participant: participantPayload(user),
    relationship: [...(relationshipLabels.get(user.studentProfile?.id || '') || [])].join(' · ')
  }))

  const [managedFollows, vendorFollowRecords] = await Promise.all([
    prisma.managedProfileFollower.findMany({
      where: { userId },
      select: { managedProfileId: true },
      take: 1000
    }),
    prisma.workflowRecord.findMany({
      where: {
        collection: 'campusVendorFollowers',
        data: { path: ['userId'], equals: userId }
      },
      take: 1000
    })
  ])
  const followedPageReferences = [...new Map([
    ...managedFollows.map((follow) => ({ type: 'managed_profile' as const, id: follow.managedProfileId })),
    ...vendorFollowRecords.map((record) => ({
      type: 'marketplace_shop' as const,
      id: String(workflowData(record).shopId || '')
    })).filter((reference) => reference.id)
  ].map((reference) => [pageKey(reference.type, reference.id), reference])).values()]
  const pages = (await Promise.all(followedPageReferences.map(async (reference) => {
    try {
      const identity = await readPageIdentity(reference.type, reference.id)
      if (identity.managerUserIds.includes(userId)) return null
      const page = {
        id: identity.id,
        type: identity.type,
        name: identity.name,
        slug: identity.slug,
        avatarUrl: identity.avatarUrl,
        href: identity.href,
        inboxHref: identity.inboxHref
      }
      return {
        id: `page:${pageKey(page.type, page.id)}`,
        kind: 'page',
        page,
        participant: {
          id: pageKey(page.type, page.id),
          name: page.name,
          avatarUrl: page.avatarUrl,
          href: page.href
        },
        relationship: 'Following'
      }
    } catch {
      return null
    }
  }))).filter(Boolean)

  return {
    data: [...people, ...pages].sort((left, right) => (
      String(left?.participant.name || '').localeCompare(String(right?.participant.name || ''))
    ))
  }
}

async function usersShareMessagingNetwork(senderId: string, recipientId: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: [senderId, recipientId] }, isActive: true },
    select: { id: true, studentProfile: { select: { id: true } } }
  })
  const senderStudentId = users.find((user) => user.id === senderId)?.studentProfile?.id
  const recipientStudentId = users.find((user) => user.id === recipientId)?.studentProfile?.id
  if (!senderStudentId || !recipientStudentId) return false
  return Boolean(await prisma.connectRelationship.findFirst({
    where: {
      type: { in: ['follow', 'connect'] },
      OR: [
        { actorStudentId: senderStudentId, targetStudentId: recipientStudentId },
        { actorStudentId: recipientStudentId, targetStudentId: senderStudentId }
      ]
    },
    select: { id: true }
  }))
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
    ...businessContacts.map((contact) => contact.userId),
    project.ownerId
  ].filter(Boolean))] as string[]
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

  const unread = records.filter((record, index) => {
    const readBy = Array.isArray(data[index].readByUserIds) ? data[index].readByUserIds : []
    return data[index].senderId !== userId && !readBy.includes(userId)
  })
  await Promise.all(unread.map((record) => {
    const value = workflowData(record)
    return prisma.workflowRecord.update({
      where: { id: record.id },
      data: { data: { ...value, readByUserIds: [...new Set([...(value.readByUserIds || []), userId])] } }
    })
  }))

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

async function listProjectGroupConversationsService(userId: string | undefined) {
  if (!userId) forbidden()
  const records = await prisma.workflowRecord.findMany({
    where: { collection: 'projectGroupMessages' },
    orderBy: { createdAt: 'desc' },
    take: 1000
  })
  const grouped = records.reduce((result, record) => {
    const projectId = String(workflowData(record).projectId || '')
    if (!projectId) return result
    const messages = result.get(projectId) || []
    messages.push(record)
    result.set(projectId, messages)
    return result
  }, new Map<string, typeof records>())

  const conversations = (await Promise.all([...grouped.entries()].map(async ([projectId, messages]) => {
    try {
      const { project, recipientUserIds } = await readProjectGroupContext(projectId, userId)
      const latest = messages[0]
      const latestData = workflowData(latest)
      const unreadCount = messages.filter((message) => {
        const value = workflowData(message)
        const readBy = Array.isArray(value.readByUserIds) ? value.readByUserIds : []
        return value.senderId !== userId && !readBy.includes(userId)
      }).length
      return {
        id: projectId,
        kind: 'group',
        projectGroupId: projectId,
        opportunityId: project.opportunityId || null,
        participant: {
          id: `project-group:${projectId}`,
          name: `${project.title || 'Project'} group`,
          avatarUrl: null
        },
        participantCount: recipientUserIds.length,
        href: `/campus/projects/${encodeURIComponent(projectId)}`,
        latestMessage: {
          id: latest.id,
          body: latestData.body || '',
          senderId: latestData.senderId,
          createdAt: latest.createdAt
        },
        unreadCount,
        createdAt: messages.at(-1)?.createdAt || latest.createdAt,
        updatedAt: latest.createdAt
      }
    } catch {
      return null
    }
  }))).filter(Boolean)

  return {
    data: conversations,
    unreadCount: conversations.reduce((total, conversation) => total + Number(conversation?.unreadCount || 0), 0)
  }
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
        fileUrls: input.fileUrls,
        readByUserIds: [senderId]
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
  const conversation = {
    id: projectId,
    kind: 'group',
    projectGroupId: projectId,
    opportunityId: project.opportunityId || null,
    participant: {
      id: `project-group:${projectId}`,
      name: `${project.title || 'Project'} group`,
      avatarUrl: null
    },
    participantCount: recipientUserIds.length,
    href: `/campus/projects/${encodeURIComponent(projectId)}`,
    latestMessage: {
      id: record.id,
      body: input.body,
      senderId,
      createdAt: record.createdAt
    },
    unreadCount: 1,
    createdAt: record.createdAt,
    updatedAt: record.createdAt
  }
  for (const recipientUserId of recipientUserIds) {
    if (recipientUserId !== senderId) {
      emitRealtimeEvent(recipientUserId, { type: 'message.created', data: { ...payload, isMine: false, conversation } })
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
    const key = participant.id
    const current = conversations.get(key)
    if (!current) {
      conversations.set(key, {
        id: key,
        kind: isErrandMessageContext(message.context) ? 'errand' : 'personal',
        participant: participantPayload(participant),
        opportunityId: null,
        latestMessage: {
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          context: message.context,
          createdAt: message.createdAt
        },
        unreadCount: message.recipientId === userId && !message.isRead ? 1 : 0
      })
    } else {
      if (isErrandMessageContext(message.context)) current.kind = 'errand'
      if (message.recipientId === userId && !message.isRead) current.unreadCount += 1
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
  const opportunityFilter = input.opportunityId ? { opportunityId: input.opportunityId } : {}
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

  const context = input.context?.type === 'marketplace_order'
    ? {
        ...input.context,
        order: {
          ...input.context.order,
          senderUserId: senderId,
          recipientUserId: input.recipientId,
        }
    }
    : input.context

  const automatedEventId = String(context?.automatedEventId || '')
  if (automatedEventId) {
    const existingMessage = await prisma.message.findFirst({
      where: {
        senderId,
        recipientId: input.recipientId,
        context: { path: ['automatedEventId'], equals: automatedEventId }
      },
      include: {
        sender: { select: participantSelect },
        recipient: { select: participantSelect }
      }
    })
    if (existingMessage) {
      return {
        ...existingMessage,
        sender: participantPayload(existingMessage.sender),
        recipient: participantPayload(existingMessage.recipient)
      }
    }
  }

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
  const isMarketplaceMessage = ['marketplace_product', 'marketplace_offer', 'marketplace_order'].includes(String(context?.type || ''))
  const isNetworkMessage = existingConversation || input.opportunityId || isMarketplaceMessage
    ? false
    : await usersShareMessagingNetwork(senderId, input.recipientId)
  if (!existingConversation && !input.opportunityId && !isMarketplaceMessage && !isNetworkMessage) {
    forbidden('You can start a conversation with someone in your network or through a verified opportunity')
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId: input.recipientId,
      opportunityId: input.opportunityId,
      body: input.body,
      fileUrls: input.fileUrls,
      context,
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
  listPageConversationsService,
  createPageConversationService,
  listPageMessagesService,
  createPageMessageService,
  listMessageNetworkService,
  listProjectGroupConversationsService,
  listProjectGroupMessagesService,
  createProjectGroupMessageService
}
