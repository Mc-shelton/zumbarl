import type { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'
import { rankWithRecommendations } from '../../services/recommendations/index.js'

const moderationCases = createPrismaRecordRepository('moderationCases')
const legacyProjects = createPrismaRecordRepository('projects')

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function payloadObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function pollForViewer(value: unknown, viewerStudentId?: string) {
  const storedPoll = payloadObject(value)
  if (!Object.keys(storedPoll).length) return null
  const options = Array.isArray(storedPoll.options) ? storedPoll.options.map((option) => payloadObject(option)) : []
  const votes = payloadObject(storedPoll.votes)
  const voterSelections = Object.values(votes).map((selection) => (
    Array.isArray(selection) ? selection.map(String) : typeof selection === 'string' ? [selection] : []
  ))
  const viewerOptionIds = viewerStudentId
    ? (Array.isArray(votes[viewerStudentId]) ? votes[viewerStudentId].map(String) : typeof votes[viewerStudentId] === 'string' ? [String(votes[viewerStudentId])] : [])
    : []
  const totalVotes = voterSelections.length
  const expiresAt = storedPoll.expiresAt ? validDate(storedPoll.expiresAt, new Date(0)) : null
  const publicPoll = { ...storedPoll }
  delete publicPoll.votes
  return {
    ...publicPoll,
    options: options.map((option) => {
      const voteCount = voterSelections.filter((selection) => selection.includes(String(option.id))).length
      return {
        ...option,
        voteCount,
        percentage: totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0
      }
    }),
    totalVotes,
    viewerOptionIds,
    hasVoted: viewerOptionIds.length > 0,
    isClosed: Boolean(expiresAt && expiresAt.getTime() <= Date.now())
  }
}

function validDate(value: unknown, fallback = new Date()) {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? fallback : date
}

function campusEventData(payload: Record<string, any>, campusId: string | null, fallbackStartsAt = new Date()) {
  const event = payloadObject(payload.event)
  const organizer = payloadObject(event.organizer)
  const startsAt = validDate(event.startsAt, fallbackStartsAt)
  const endsAt = event.endsAt ? validDate(event.endsAt, startsAt) : null
  return {
    campusId,
    title: String(event.title || payload.body || 'Campus event'),
    description: String(payload.body || event.title || 'Campus event'),
    category: String(event.category || 'Campus event'),
    organizerName: String(organizer.name || 'Zumbarl community'),
    organizerType: organizer.type === 'business' ? 'BUSINESS' : organizer.type === 'person' ? 'STUDENT' : 'CAMPUS',
    coverImageUrl: event.thumbnailUrl || payload.mediaUrls?.[0] || null,
    locationName: String(event.location || ''),
    locationAddress: String(event.location || ''),
    latitude: event.latitude == null ? null : Number(event.latitude),
    longitude: event.longitude == null ? null : Number(event.longitude),
    startsAt,
    endsAt,
    capacity: event.capacity == null ? null : Number(event.capacity),
    priceAmount: Number(event.priceAmount || 0),
    currency: String(event.currency || 'KES'),
    tags: Array.isArray(payload.tags) ? payload.tags.map((tag: any) => String(tag?.label || tag)).filter(Boolean) : [],
    status: 'PUBLISHED'
  }
}

function toRecord(record: Record<string, any>) {
  const { payload, ...rest } = record
  return { ...payloadObject(payload), ...rest }
}

class ConnectCommunityRepository {
  async listManagedProfiles(userId: string) {
    return prisma.managedProfile.findMany({
      where: { managers: { some: { userId } }, status: 'active' },
      include: { campus: true, communityGroup: true, managers: { select: { role: true, user: { select: { id: true, name: true, email: true, username: true } } } }, _count: { select: { posts: true, followers: true } } },
      orderBy: { name: 'asc' }
    })
  }

  async createManagedProfile(ownerUserId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      let communityGroupId: string | null = null
      let companyId: string | null = null
      if (payload.type === 'club' || payload.type === 'association') {
        const group = await tx.communityGroup.create({ data: { name: payload.name, category: payload.type, purpose: payload.details?.purpose || payload.details?.mandate || payload.bio || payload.name, campus: payload.details?.campus || null, status: 'active', payload: jsonInput(payload.details ?? {}) } })
        communityGroupId = group.id
      }
      if (payload.type === 'business') {
        const company = await tx.company.create({ data: { name: payload.name, sector: payload.details?.sector || 'Other', size: payload.details?.size || 'MICRO', website: payload.websiteUrl || null, description: payload.bio || null, locationCity: payload.details?.city || 'Nairobi', isActive: true } })
        companyId = company.id
      }
      return tx.managedProfile.create({ data: { type: payload.type, slug: payload.slug, name: payload.name, handle: payload.handle.replace(/^@/, ''), bio: payload.bio || null, avatarUrl: payload.avatarUrl || null, coverImageUrl: payload.coverImageUrl || null, locationLabel: payload.locationLabel || null, websiteUrl: payload.websiteUrl || null, email: payload.email || null, phone: payload.phone || null, details: jsonInput(payload.details ?? {}), campusId: payload.campusId ?? null, communityGroupId, companyId, status: 'active', managers: { create: { userId: ownerUserId, role: 'owner' } } }, include: { campus: true, communityGroup: true, company: true, managers: true } })
    })
  }

  async readManagedProfileManager(userId: string, managedProfileId: string) {
    return prisma.managedProfileManager.findUnique({ where: { managedProfileId_userId: { managedProfileId, userId } } })
  }

  async addManagedProfileManager(managedProfileId: string, email: string, role: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return null
    return prisma.managedProfileManager.upsert({ where: { managedProfileId_userId: { managedProfileId, userId: user.id } }, update: { role }, create: { managedProfileId, userId: user.id, role }, include: { user: { select: { id: true, name: true, email: true, username: true } } } })
  }

  async removeManagedProfileManager(managedProfileId: string, managerUserId: string) {
    return prisma.managedProfileManager.deleteMany({ where: { managedProfileId, userId: managerUserId, role: { not: 'owner' } } })
  }

  async findManagedProfile(reference: string, viewerUserId?: string) {
    const profile = await prisma.managedProfile.findFirst({
      where: { OR: [{ id: reference }, { slug: reference }], status: 'active' },
      include: {
        campus: true,
        communityGroup: true,
        company: true,
        posts: { where: { status: 'published' }, include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 30 },
        managers: { select: { role: true, user: { select: { id: true, name: true, username: true } } } },
        _count: { select: { followers: true, posts: true, managers: true } }
      }
    })
    if (!profile) return null
    const attachedServices = profile.type === 'campus'
      ? (await prisma.marketplaceShop.findMany({
          where: {
            status: 'ACTIVE',
            payload: { path: ['campusManagedProfileId'], equals: profile.id }
          },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            logoUrl: true,
            locationLabel: true,
            payload: true,
            _count: { select: { listings: true } }
          },
          orderBy: { name: 'asc' }
        })).map((vendor) => {
          const vendorPayload = payloadObject(vendor.payload)
          return {
            id: vendor.id,
            type: vendorPayload.vendorType || 'service',
            slug: vendor.slug,
            name: vendor.name,
            bio: vendor.description,
            avatarUrl: vendor.logoUrl,
            locationLabel: vendor.locationLabel,
            isVendor: true,
            capabilities: vendorPayload.capabilities || ['inventory', 'orders', 'posts', 'promotions'],
            _count: { listings: vendor._count.listings }
          }
        })
      : []
    const [followRecord, viewerStudent] = viewerUserId ? await Promise.all([
      prisma.managedProfileFollower.findUnique({ where: { managedProfileId_userId: { managedProfileId: profile.id, userId: viewerUserId } } }),
      prisma.studentProfile.findUnique({ where: { userId: viewerUserId }, select: { id: true } })
    ]) : [null, null]
    const posts = profile.posts.map((post) => {
      const reactions = payloadObject(post.reactions)
      const storedPayload = payloadObject(post.payload)
      return {
        ...post,
        payload: { ...storedPayload, poll: pollForViewer(storedPayload.poll, viewerStudent?.id) },
        poll: pollForViewer(storedPayload.poll, viewerStudent?.id),
        reactionCount: Object.keys(reactions).length,
        viewerReacted: Boolean(viewerStudent?.id && reactions[viewerStudent.id]),
        commentCount: post.comments.length,
        comments: post.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt,
          author: {
            name: 'Zumbarl member',
            handle: '@member',
            avatarUrl: null
          }
        }))
      }
    })
    return { ...profile, posts, attachedServices, isFollowing: Boolean(followRecord) }
  }

  async setManagedProfileFollow(managedProfileId: string, userId: string, active: boolean) {
    if (active) await prisma.managedProfileFollower.upsert({ where: { managedProfileId_userId: { managedProfileId, userId } }, update: {}, create: { managedProfileId, userId } })
    else await prisma.managedProfileFollower.deleteMany({ where: { managedProfileId, userId } })
    return { isFollowing: active, followerCount: await prisma.managedProfileFollower.count({ where: { managedProfileId } }) }
  }

  async userManagesProfile(userId: string, managedProfileId: string) {
    return Boolean(await prisma.managedProfileManager.findUnique({
      where: { managedProfileId_userId: { managedProfileId, userId } }
    }))
  }

  async findManagedVendorStoryTarget(userId: string, slug: string) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: {
        slug,
        status: { notIn: ['ARCHIVED', 'SUSPENDED'] },
        managers: { some: { userId } }
      },
      include: { campus: true }
    })
    return shop && payloadObject(shop.payload).entityType === 'campus_vendor' ? shop : null
  }

  async updateManagedProfile(id: string, patch: Record<string, any>) {
    return prisma.managedProfile.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
        ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
        ...(patch.coverImageUrl !== undefined ? { coverImageUrl: patch.coverImageUrl } : {}),
        ...(patch.locationLabel !== undefined ? { locationLabel: patch.locationLabel } : {}),
        ...(patch.websiteUrl !== undefined ? { websiteUrl: patch.websiteUrl } : {}),
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.details !== undefined ? { details: jsonInput(patch.details) } : {})
      },
      include: { campus: true, communityGroup: true }
    })
  }

  async createManagedProfilePost(managedProfileId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      let storedPayload = { ...payload }
      if (payload.type === 'event' && Object.keys(payloadObject(payload.event)).length) {
        const profile = await tx.managedProfile.findUnique({ where: { id: managedProfileId }, select: { campusId: true } })
        const event = await tx.campusEvent.create({ data: campusEventData(payload, profile?.campusId ?? null) })
        storedPayload = { ...payload, event: { ...payloadObject(payload.event), id: event.id, goingCount: 0, interestedCount: 0, responseCount: 0, viewerResponse: null } }
      }
      return tx.connectPost.create({
        data: {
          managedProfileId,
          type: payload.type ?? 'post',
          body: payload.body,
          tags: jsonInput(payload.tags ?? []),
          visibility: payload.visibility ?? 'public',
          status: 'published',
          reactions: {},
          saves: 0,
          reposts: 0,
          payload: jsonInput(storedPayload)
        }
      })
    })
  }

  async updateManagedProfilePost(managedProfileId: string, postId: string, payload: Record<string, any>) {
    const post = await prisma.connectPost.findFirst({ where: { id: postId, managedProfileId, status: 'published' } })
    if (!post) return null
    return prisma.connectPost.update({
      where: { id: post.id },
      data: {
        body: payload.body,
        payload: jsonInput({ ...payloadObject(post.payload), ...payload })
      }
    })
  }

  async listFeed(query: Record<string, unknown>, viewerStudentId?: string) {
    const records = await prisma.connectPost.findMany({
      where: { status: { not: 'removed' } },
      include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    })
    const studentIds = [...new Set(records.flatMap((record) => [record.studentId, ...record.comments.map((comment) => comment.studentId)]).filter(Boolean))] as string[]
    const students = await prisma.studentProfile.findMany({ where: { id: { in: studentIds } }, include: { user: true, campus: true, zumbarl: true } })
    const managedProfileIds = [...new Set(records.map((record) => record.managedProfileId).filter(Boolean))] as string[]
    const managedProfiles = await prisma.managedProfile.findMany({ where: { id: { in: managedProfileIds } }, include: { campus: true, communityGroup: true } })
    const communityGroupIds = [...new Set(records.map((record) => record.communityGroupId).filter(Boolean))] as string[]
    const communityGroups = communityGroupIds.length ? await prisma.communityGroup.findMany({ where: { id: { in: communityGroupIds } } }) : []
    const vendorShopIds = [...new Set(records.map((record) => {
      const storedPayload = payloadObject(record.payload)
      return String(storedPayload.vendorShopId || payloadObject(storedPayload.vendorSnapshot).id || '')
    }).filter(Boolean))]
    const vendorShops = vendorShopIds.length ? await prisma.marketplaceShop.findMany({
      where: { id: { in: vendorShopIds } },
      include: { campus: true }
    }) : []
    const knowledgeSpaceIds = [...new Set(records.map((record) => record.knowledgeSpaceId).filter(Boolean))] as string[]
    const knowledgeSpaces = knowledgeSpaceIds.length ? await prisma.knowledgeSpace.findMany({
      where: { id: { in: knowledgeSpaceIds }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, type: true, avatarUrl: true }
    }) : []
    const eventIds = [...new Set(records.map((record) => String(payloadObject(payloadObject(record.payload).event).id || '')).filter(Boolean))]
    const [eventResponseGroups, viewerEventResponses] = await Promise.all([
      eventIds.length ? prisma.campusEventRsvp.groupBy({
        by: ['eventId', 'status'],
        where: { eventId: { in: eventIds }, status: { in: ['GOING', 'INTERESTED'] } },
        _count: { _all: true }
      }) : [],
      eventIds.length && viewerStudentId ? prisma.campusEventRsvp.findMany({
        where: { eventId: { in: eventIds }, studentId: viewerStudentId, status: { in: ['GOING', 'INTERESTED'] } },
        select: { eventId: true, status: true }
      }) : []
    ])
    const eventResponseCounts = new Map<string, { goingCount: number, interestedCount: number }>()
    eventResponseGroups.forEach((group) => {
      const counts = eventResponseCounts.get(group.eventId) ?? { goingCount: 0, interestedCount: 0 }
      if (group.status === 'GOING') counts.goingCount = group._count._all
      if (group.status === 'INTERESTED') counts.interestedCount = group._count._all
      eventResponseCounts.set(group.eventId, counts)
    })
    const viewerEventResponseById = new Map(viewerEventResponses.map((response) => [response.eventId, response.status]))
    const viewer = viewerStudentId ? await prisma.studentProfile.findUnique({ where: { id: viewerStudentId }, select: { campusId: true } }) : null
    const viewerGroups = viewerStudentId ? await prisma.communityGroupMembership.findMany({ where: { studentId: viewerStudentId, status: 'active' }, select: { groupId: true } }) : []
    const [viewerKnowledgeMemberships, viewerKnowledgeFollows] = viewerStudentId ? await Promise.all([
      prisma.knowledgeSpaceMembership.findMany({ where: { studentId: viewerStudentId, status: 'ACTIVE' }, select: { spaceId: true } }),
      prisma.knowledgeSpaceFollower.findMany({ where: { studentId: viewerStudentId }, select: { spaceId: true } })
    ]) : [[], []]
    const followed = viewerStudentId ? await prisma.connectRelationship.findMany({ where: { actorStudentId: viewerStudentId, type: 'follow' }, select: { targetStudentId: true } }) : []
    const followedIds = new Set(followed.map((entry) => entry.targetStudentId))
    const viewerGroupIds = new Set(viewerGroups.map((entry) => entry.groupId))
    const priorityKnowledgeSpaceIds = new Set([...viewerKnowledgeMemberships, ...viewerKnowledgeFollows].map((entry) => entry.spaceId))
    const studentById = new Map(students.map((student) => [student.id, student]))
    const managedProfileById = new Map(managedProfiles.map((profile) => [profile.id, profile]))
    const communityGroupById = new Map(communityGroups.map((group) => [group.id, group]))
    const vendorShopById = new Map(vendorShops.map((shop) => [shop.id, shop]))
    const knowledgeSpaceById = new Map(knowledgeSpaces.map((space) => [space.id, space]))
    const recordById = new Map(records.map((record) => [record.id, record]))
    const creatorFor = (candidate: typeof records[number]) => {
      const candidateKnowledgeSpace = candidate.knowledgeSpaceId ? knowledgeSpaceById.get(candidate.knowledgeSpaceId) : null
      const candidateStudent = candidate.studentId ? studentById.get(candidate.studentId) : null
      const candidateManagedProfile = candidate.managedProfileId ? managedProfileById.get(candidate.managedProfileId) : null
      const candidateCommunityGroup = candidate.communityGroupId ? communityGroupById.get(candidate.communityGroupId) : null
      const candidateSnapshot = payloadObject(payloadObject(candidate.payload).sourceSnapshot)
      const candidatePayload = payloadObject(candidate.payload)
      const vendorSnapshot = payloadObject(candidatePayload.vendorSnapshot)
      const liveVendor = vendorShopById.get(String(candidatePayload.vendorShopId || vendorSnapshot.id || ''))
      return candidateCommunityGroup ? {
        id: candidateCommunityGroup.id,
        profileType: candidateCommunityGroup.category === 'support-circle' ? 'support-circle' : 'community-group',
        name: candidateCommunityGroup.name,
        handle: candidateCommunityGroup.category === 'support-circle' ? 'Support circle' : 'Campus group',
        avatarUrl: candidateCommunityGroup.category === 'support-circle' ? payloadObject(candidateCommunityGroup.payload).splashImageUrl || null : null,
        campus: candidateCommunityGroup.campus || null,
        isVerified: candidateCommunityGroup.category === 'support-circle',
      } : liveVendor || vendorSnapshot.id ? {
        id: liveVendor?.id || vendorSnapshot.id,
        profileType: 'vendor',
        slug: liveVendor?.slug || vendorSnapshot.slug,
        name: liveVendor?.name || vendorSnapshot.name,
        handle: 'Campus vendor',
        avatarUrl: liveVendor?.logoUrl || vendorSnapshot.avatarUrl || null,
        campus: liveVendor?.campus?.name || liveVendor?.locationLabel || vendorSnapshot.campus || null,
        isVerified: vendorSnapshot.isVerified !== false
      } : candidateKnowledgeSpace ? {
        id: candidateKnowledgeSpace.id,
        profileType: `knowledge-${candidateKnowledgeSpace.type.toLowerCase()}`,
        slug: candidateKnowledgeSpace.slug,
        name: candidateKnowledgeSpace.name,
        handle: candidateKnowledgeSpace.type === 'LIBRARY' ? 'Library' : 'Study group',
        avatarUrl: candidateKnowledgeSpace.avatarUrl || `/assets/knowledge/default-${candidateKnowledgeSpace.type.toLowerCase()}-avatar.svg`,
        campus: candidateStudent?.campus?.name || null,
        isVerified: false
      } : candidateManagedProfile ? {
        id: candidateManagedProfile.id,
        profileType: candidateManagedProfile.type,
        slug: candidateManagedProfile.slug,
        name: candidateManagedProfile.name,
        handle: `@${candidateManagedProfile.handle}`,
        avatarUrl: candidateManagedProfile.avatarUrl,
        campus: candidateManagedProfile.campus?.name || candidateManagedProfile.communityGroup?.campus || null,
        isVerified: candidateManagedProfile.isVerified
      } : candidateStudent ? {
        id: candidateStudent.id,
        profileType: 'student',
        name: [candidateStudent.firstName, candidateStudent.lastName].filter(Boolean).join(' '),
        handle: `@${candidateStudent.user?.username || candidateStudent.user?.email?.split('@')[0] || 'student'}`,
        avatarUrl: candidateStudent.avatarUrl,
        campus: candidateStudent.campus?.name || null,
        ...(candidateStudent.showZumbarlPoints !== false ? {
          zumbarlPoints: Math.round(candidateStudent.zumbarl?.currentScore || 0),
          zumbarlTier: candidateStudent.zumbarl?.tier || null
        } : {})
      } : candidateSnapshot.creator ? payloadObject(candidateSnapshot.creator) : null
    }
    const mappedRecords = records.filter((record) => {
      if (!record.communityGroupId) return true
      const postGroup = communityGroupById.get(record.communityGroupId)
      if (postGroup?.category === 'support-circle') {
        return record.visibility !== 'circle' || viewerGroupIds.has(record.communityGroupId)
      }
      return viewerGroupIds.has(record.communityGroupId)
    }).map((record) => {
      const publicRecord = toRecord(record)
      if (record.communityGroupId) delete publicRecord.studentId
      const comments = record.comments.map((comment) => {
        const author = comment.studentId ? studentById.get(comment.studentId) : null
        return {
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt,
          author: author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : 'Zumbarl student',
          handle: author ? `@${author.user?.username || author.user?.email?.split('@')[0] || 'student'}` : '@student',
          avatar: author?.avatarUrl || null
        }
      })
      const announcement = payloadObject(record.payload).announcementRequest
      const sourceSnapshot = payloadObject(payloadObject(record.payload).sourceSnapshot)
      const storedRecord = payloadObject(record.payload)
      const storedEvent = payloadObject(storedRecord.event)
      const storedEventId = String(storedEvent.id || '')
      const storedEventCounts = eventResponseCounts.get(storedEventId) ?? { goingCount: 0, interestedCount: 0 }
      const resharedPost = payloadObject(storedRecord.resharedPost)
      const originalRecord = storedRecord.reshareOfPostId ? recordById.get(String(storedRecord.reshareOfPostId)) : null
      const originalPayload = originalRecord ? payloadObject(originalRecord.payload) : {}
      const originalReshares = payloadObject(originalPayload.reshares)
      const reactions = payloadObject(record.reactions)
      const reshares = payloadObject(payloadObject(record.payload).reshares)
      const baseReactionCount = Number(sourceSnapshot.reactionCount || 0)
      const baseCommentCount = Number(sourceSnapshot.commentCount || 0)
      const announcementVisible = Boolean(payloadObject(record.payload).isPinnedAnnouncement) || (announcement?.status === 'approved' && ((announcement.targetType === 'campus' && announcement.targetId === viewer?.campusId) || (announcement.targetType === 'group' && viewerGroupIds.has(announcement.targetId))))
      return {
        ...publicRecord,
        comments,
        reactionCount: baseReactionCount + Object.keys(reactions).length,
        viewerReacted: Boolean(viewerStudentId && reactions[viewerStudentId]),
        commentCount: baseCommentCount + comments.length,
        repostCount: record.reposts,
        viewerReshared: Boolean(viewerStudentId && reshares[viewerStudentId]),
        viewerReshareCommentary: viewerStudentId ? String(payloadObject(reshares[viewerStudentId]).commentary || '') : '',
        creator: creatorFor(record),
        poll: pollForViewer(storedRecord.poll, viewerStudentId),
        knowledgeSpace: record.knowledgeSpaceId ? knowledgeSpaceById.get(record.knowledgeSpaceId) || null : null,
        event: Object.keys(storedEvent).length ? {
          ...storedEvent,
          ...storedEventCounts,
          responseCount: storedEventCounts.goingCount + storedEventCounts.interestedCount,
          viewerResponse: viewerEventResponseById.get(storedEventId) ?? null
        } : undefined,
        ...(Object.keys(resharedPost).length ? {
          resharedPost: {
            ...resharedPost,
            creator: originalRecord ? creatorFor(originalRecord) ?? resharedPost.creator : resharedPost.creator,
            repostCount: originalRecord?.reposts ?? resharedPost.repostCount ?? 0,
            viewerReshared: Boolean(viewerStudentId && originalReshares[viewerStudentId]),
            viewerReshareCommentary: viewerStudentId ? String(payloadObject(originalReshares[viewerStudentId]).commentary || '') : '',
            isMine: Boolean(viewerStudentId && originalRecord?.studentId === viewerStudentId)
          }
        } : {}),
        isMine: Boolean(viewerStudentId && !record.communityGroupId && record.studentId === viewerStudentId),
        isFollowing: Boolean(!record.communityGroupId && record.studentId && followedIds.has(record.studentId))
        ,isPriorityForViewer: Boolean(record.knowledgeSpaceId && priorityKnowledgeSpaceIds.has(record.knowledgeSpaceId)) || (Array.isArray(record.tags) && record.tags.some((tag) => {
          const candidate = payloadObject(tag)
          return String(candidate.type || '').startsWith('knowledge-') && priorityKnowledgeSpaceIds.has(String(candidate.id || ''))
        }))
        ,announcementRequest: record.studentId === viewerStudentId ? announcement ?? null : undefined
        ,isPinnedAnnouncement: Boolean(announcementVisible)
      }
    })
    const focusedPostId = String(query.postId || query.post || '').trim()
    const priorityRecords = mappedRecords.sort((left, right) => Number(right.isPriorityForViewer) - Number(left.isPriorityForViewer) || new Date(String((right as Record<string, any>).createdAt)).getTime() - new Date(String((left as Record<string, any>).createdAt)).getTime())
    const rankedRecords = await rankWithRecommendations({
      studentId: viewerStudentId,
      surface: 'connect_feed',
      entityType: 'connect_post',
      items: priorityRecords
    })
    const priorityFocusedIndex = focusedPostId
      ? rankedRecords.findIndex((record) => String((record as Record<string, any>).id || '') === focusedPostId)
      : -1
    const orderedRecords = priorityFocusedIndex > 0
      ? [rankedRecords[priorityFocusedIndex], ...rankedRecords.filter((_, index) => index !== priorityFocusedIndex)]
      : rankedRecords
    return pageEnvelope(orderedRecords, query)
  }

  async findProfile(studentId?: string) {
    if (!studentId) return null
    const profile = await prisma.connectProfile.findUnique({ where: { studentId } })
    return profile ? toRecord(profile) : null
  }

  async updateProfile(id: string, patch: Record<string, any>) {
    const existing = await prisma.connectProfile.findUnique({ where: { id } })
    if (!existing) return null
    return toRecord(await prisma.connectProfile.update({
      where: { id },
      data: {
        ...(patch.interests ? { interests: patch.interests } : {}),
        ...(patch.safetyPreferences ? { safetyPreferences: jsonInput(patch.safetyPreferences) } : {}),
        ...(patch.visibility ? { visibility: patch.visibility } : {}),
        payload: jsonInput({ ...payloadObject(existing.payload), ...patch })
      }
    }))
  }

  async createProfile(payload: Record<string, any>) {
    return toRecord(await prisma.connectProfile.create({
      data: {
        studentId: payload.studentId ?? null,
        interests: payload.interests ?? [],
        safetyPreferences: jsonInput(payload.safetyPreferences ?? {}),
        visibility: payload.visibility ?? 'campus',
        payload: jsonInput(payload)
      }
    }))
  }

  async createStory(payload: Record<string, any>) {
    return toRecord(await prisma.connectStory.create({
      data: {
        sourceId: payload.sourceId ?? null,
        studentId: payload.studentId ?? null,
        knowledgeSpaceId: payload.knowledgeSpaceId ?? null,
        text: payload.text,
        mediaUrl: payload.mediaUrl ?? null,
        visibility: payload.visibility ?? 'campus',
        context: payload.context ?? null,
        expiresAt: new Date(payload.expiresAt),
        status: payload.status ?? 'live',
        payload: jsonInput(payload)
      }
    }))
  }

  async listStories(viewerStudentId?: string) {
    const [viewer, connectProfile] = viewerStudentId ? await Promise.all([
      prisma.studentProfile.findUnique({ where: { id: viewerStudentId }, select: { campusId: true } }),
      prisma.connectProfile.findUnique({ where: { studentId: viewerStudentId }, select: { payload: true } })
    ]) : [null, null]
    const storyFeedScope = String(payloadObject(connectProfile?.payload).storyFeedScope || 'all')
    const connections = viewerStudentId && storyFeedScope === 'connections'
      ? await prisma.connectRelationship.findMany({
        where: { type: 'connect', OR: [{ actorStudentId: viewerStudentId }, { targetStudentId: viewerStudentId }] },
        select: { actorStudentId: true, targetStudentId: true }
      })
      : []
    const connectedStudentIds = viewerStudentId
      ? [viewerStudentId, ...connections.map((entry) => entry.actorStudentId === viewerStudentId ? entry.targetStudentId : entry.actorStudentId)]
      : []
    const records = await prisma.connectStory.findMany({
      where: {
        status: 'live',
        expiresAt: { gt: new Date() },
        ...(viewer && storyFeedScope === 'campus' ? { OR: [{ visibility: 'public' }, { student: { campusId: viewer.campusId } }] } : {}),
        ...(viewerStudentId && storyFeedScope === 'connections' ? { studentId: { in: connectedStudentIds } } : {})
      },
      include: { student: { include: { user: true, campus: true } }, _count: { select: { reactions: true, comments: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const storySpaceIds = [...new Set(records.map((record) => record.knowledgeSpaceId).filter(Boolean))] as string[]
    const storyManagedProfileIds = [...new Set(records.map((record) => String(payloadObject(record.payload).managedProfileId || '')).filter(Boolean))]
    const storySpaces = storySpaceIds.length ? await prisma.knowledgeSpace.findMany({
      where: { id: { in: storySpaceIds }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, type: true, avatarUrl: true }
    }) : []
    const storyManagedProfiles = storyManagedProfileIds.length ? await prisma.managedProfile.findMany({
      where: { id: { in: storyManagedProfileIds }, status: 'active' },
      include: { campus: true, communityGroup: true }
    }) : []
    const storySpaceById = new Map(storySpaces.map((space) => [space.id, space]))
    const storyManagedProfileById = new Map(storyManagedProfiles.map((profile) => [profile.id, profile]))
    return {
      data: records.map((record) => {
        const { _count, student, ...story } = record
        const storedPayload = payloadObject(record.payload)
        const managedProfile = storyManagedProfileById.get(String(storedPayload.managedProfileId || ''))
        const vendorSnapshot = payloadObject(storedPayload.vendorSnapshot)
        const creator = vendorSnapshot.id ? {
          id: vendorSnapshot.id,
          slug: vendorSnapshot.slug,
          profileType: 'vendor',
          name: vendorSnapshot.name,
          handle: 'Campus vendor',
          avatarUrl: vendorSnapshot.avatarUrl || null,
          campus: vendorSnapshot.campus || null,
          isSameCampus: true
        } : managedProfile ? {
          id: managedProfile.id,
          slug: managedProfile.slug,
          profileType: managedProfile.type,
          name: managedProfile.name,
          handle: `@${managedProfile.handle}`,
          avatarUrl: managedProfile.avatarUrl,
          campus: managedProfile.campus?.name || managedProfile.communityGroup?.campus || null,
          isSameCampus: managedProfile.campusId === viewer?.campusId
        } : student ? {
          id: student.id,
          profileType: 'student',
          name: [student.firstName, student.lastName].filter(Boolean).join(' '),
          handle: `@${student.user.username || student.user.email.split('@')[0]}`,
          avatarUrl: student.avatarUrl,
          campus: student.campus.name,
          isSameCampus: student.campusId === viewer?.campusId
        } : null
        return {
          ...toRecord(story),
          isMine: Boolean(viewerStudentId && record.studentId === viewerStudentId),
          creator,
          knowledgeSpace: record.knowledgeSpaceId ? storySpaceById.get(record.knowledgeSpaceId) || null : null,
          reactionCount: _count.reactions,
          commentCount: _count.comments
        }
      })
    }
  }

  async readRelationship(actorStudentId: string, targetStudentId: string) {
    const records = await prisma.connectRelationship.findMany({
      where: {
        OR: [
          { actorStudentId, targetStudentId, type: 'follow' },
          { type: 'connect', OR: [{ actorStudentId, targetStudentId }, { actorStudentId: targetStudentId, targetStudentId: actorStudentId }] }
        ]
      }
    })
    return {
      isFollowing: records.some((record) => record.type === 'follow' && record.actorStudentId === actorStudentId),
      isConnected: records.some((record) => record.type === 'connect')
    }
  }

  async listSuggestedProfiles(viewerStudentId: string, limit = 12) {
    const viewer = await prisma.studentProfile.findUnique({
      where: { id: viewerStudentId },
      select: { campusId: true }
    })
    if (!viewer) return []
    const candidates = await prisma.studentProfile.findMany({
      where: {
        id: { not: viewerStudentId },
        user: { isActive: true },
        incomingRelationships: {
          none: { actorStudentId: viewerStudentId, type: 'follow' }
        }
      },
      include: { user: true, campus: true },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(24, limit * 3)
    })
    const candidateIds = candidates.map((candidate) => candidate.id)
    const relationships = candidateIds.length ? await prisma.connectRelationship.findMany({
      where: {
        OR: [
          { actorStudentId: viewerStudentId, targetStudentId: { in: candidateIds }, type: 'follow' },
          { type: 'connect', OR: [
            { actorStudentId: viewerStudentId, targetStudentId: { in: candidateIds } },
            { targetStudentId: viewerStudentId, actorStudentId: { in: candidateIds } }
          ] }
        ]
      }
    }) : []
    const followedIds = new Set(relationships.filter((relationship) => relationship.type === 'follow').map((relationship) => relationship.targetStudentId))
    const connectedIds = new Set(relationships.filter((relationship) => relationship.type === 'connect').map((relationship) => relationship.actorStudentId === viewerStudentId ? relationship.targetStudentId : relationship.actorStudentId))
    const fallbackCandidates = candidates
      // A follow can be created between the candidate and relationship queries.
      // Keep this guard so a stale candidate never reaches the suggestion rail.
      .filter((candidate) => !followedIds.has(candidate.id))
      .sort((left, right) => {
        const campusDifference = Number(right.campusId === viewer.campusId) - Number(left.campusId === viewer.campusId)
        if (campusDifference) return campusDifference
        return right.updatedAt.getTime() - left.updatedAt.getTime()
      })
      .map((candidate) => ({
        id: candidate.id,
        name: [candidate.firstName, candidate.lastName].filter(Boolean).join(' '),
        handle: `@${candidate.user.username || candidate.user.email.split('@')[0]}`,
        avatarUrl: candidate.avatarUrl,
        campus: candidate.campus.name,
        careerPath: candidate.careerPath,
        isFollowing: false,
        isConnected: connectedIds.has(candidate.id),
        isOnline: Boolean(candidate.user.lastLoginAt && Date.now() - candidate.user.lastLoginAt.getTime() < 15 * 60 * 1000)
      }))
    const ranked = await rankWithRecommendations({
      studentId: viewerStudentId,
      surface: 'people',
      entityType: 'student_profile',
      items: fallbackCandidates
    })
    return ranked.slice(0, Math.max(1, Math.min(limit, 30)))
  }

  async setRelationship(actorStudentId: string, targetStudentId: string, type: 'follow' | 'connect', active: boolean) {
    if (active) {
      await prisma.connectRelationship.upsert({
        where: { actorStudentId_targetStudentId_type: { actorStudentId, targetStudentId, type } },
        update: {},
        create: { actorStudentId, targetStudentId, type }
      })
    } else if (type === 'connect') {
      await prisma.connectRelationship.deleteMany({
        where: { type, OR: [{ actorStudentId, targetStudentId }, { actorStudentId: targetStudentId, targetStudentId: actorStudentId }] }
      })
    } else {
      await prisma.connectRelationship.deleteMany({ where: { actorStudentId, targetStudentId, type } })
    }
    return this.readRelationship(actorStudentId, targetStudentId)
  }

  async findStory(reference: string) {
    const story = await prisma.connectStory.findFirst({
      where: { OR: [{ id: reference }, { sourceId: reference }] }
    })
    return story ? toRecord(story) : null
  }

  async ensureStory(reference: string, snapshot: Record<string, any>) {
    const existing = await this.findStory(reference)
    if (existing) return existing

    return toRecord(await prisma.connectStory.upsert({
      where: { sourceId: reference },
      update: {},
      create: {
        sourceId: reference,
        studentId: null,
        text: snapshot.text || snapshot.caption || snapshot.title || 'Story',
        mediaUrl: snapshot.mediaUrl || snapshot.media || null,
        visibility: snapshot.visibility || 'campus',
        context: snapshot.storyKind || 'personal',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'live',
        payload: jsonInput({ ...snapshot, sourceId: reference, curated: true })
      }
    }))
  }

  async readStoryEngagement(reference: string, viewerStudentId?: string) {
    const story = await prisma.connectStory.findFirst({
      where: { OR: [{ id: reference }, { sourceId: reference }] },
      include: {
        reactions: { select: { studentId: true } },
        comments: {
          where: { status: 'published' },
          orderBy: { createdAt: 'asc' },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                user: { select: { username: true } }
              }
            },
            reactions: { select: { studentId: true } }
          }
        }
      }
    })
    if (!story) return null

    return {
      storyId: story.id,
      sourceId: story.sourceId,
      reactionCount: story.reactions.length,
      viewerReacted: Boolean(viewerStudentId && story.reactions.some((entry) => entry.studentId === viewerStudentId)),
      comments: story.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: `${comment.student.firstName} ${comment.student.lastName}`.trim(),
        handle: comment.student.user.username ? `@${comment.student.user.username}` : '',
        avatar: comment.student.avatarUrl,
        reactionCount: comment.reactions.length,
        viewerReacted: Boolean(viewerStudentId && comment.reactions.some((entry) => entry.studentId === viewerStudentId))
      }))
    }
  }

  async toggleStoryReaction(storyId: string, studentId: string, reaction: string) {
    return prisma.$transaction(async (tx) => {
      const key = { storyId_studentId: { storyId, studentId } }
      const existing = await tx.connectStoryReaction.findUnique({ where: key })
      if (existing) {
        await tx.connectStoryReaction.delete({ where: key })
      } else {
        await tx.connectStoryReaction.create({ data: { storyId, studentId, reaction } })
      }
      return {
        storyId,
        viewerReacted: !existing,
        reactionCount: await tx.connectStoryReaction.count({ where: { storyId } })
      }
    })
  }

  async createStoryComment(storyId: string, studentId: string, body: string) {
    const comment = await prisma.connectStoryComment.create({
      data: { storyId, studentId, body, status: 'published', payload: jsonInput({ body }) },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            user: { select: { username: true } }
          }
        }
      }
    })
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: `${comment.student.firstName} ${comment.student.lastName}`.trim(),
      handle: comment.student.user.username ? `@${comment.student.user.username}` : '',
      avatar: comment.student.avatarUrl,
      reactionCount: 0,
      viewerReacted: false
    }
  }

  async toggleStoryCommentReaction(commentId: string, studentId: string, reaction: string) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.connectStoryComment.findUnique({ where: { id: commentId } })
      if (!comment) return null
      const key = { commentId_studentId: { commentId, studentId } }
      const existing = await tx.connectStoryCommentReaction.findUnique({ where: key })
      if (existing) {
        await tx.connectStoryCommentReaction.delete({ where: key })
      } else {
        await tx.connectStoryCommentReaction.create({ data: { commentId, studentId, reaction } })
      }
      return {
        commentId,
        viewerReacted: !existing,
        reactionCount: await tx.connectStoryCommentReaction.count({ where: { commentId } })
      }
    })
  }

  async createPost(payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      let storedPayload = { ...payload }
      if (payload.type === 'event' && Object.keys(payloadObject(payload.event)).length) {
        const student = payload.studentId ? await tx.studentProfile.findUnique({ where: { id: payload.studentId }, select: { campusId: true } }) : null
        const event = await tx.campusEvent.create({ data: campusEventData(payload, student?.campusId ?? null) })
        storedPayload = { ...payload, event: { ...payloadObject(payload.event), id: event.id, goingCount: 0, interestedCount: 0, responseCount: 0, viewerResponse: null } }
      }
      return toRecord(await tx.connectPost.create({
        data: {
          studentId: payload.studentId ?? null,
          knowledgeSpaceId: payload.knowledgeSpaceId ?? null,
          communityGroupId: payload.communityGroupId ?? null,
          type: payload.type ?? 'post',
          body: payload.body,
          tags: jsonInput(payload.tags ?? []),
          visibility: payload.visibility ?? 'campus',
          status: payload.status ?? 'published',
          reactions: jsonInput(payload.reactions ?? {}),
          saves: Number(payload.saves ?? 0),
          reposts: Number(payload.reposts ?? 0),
          payload: jsonInput(storedPayload)
        }
      }))
    })
  }

  async setEventResponse(postId: string, studentId: string, status: 'GOING' | 'INTERESTED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const post = await tx.connectPost.findUnique({ where: { id: postId } })
      if (!post) return null
      const payload = payloadObject(post.payload)
      const eventPayload = payloadObject(payload.event)
      if (post.type !== 'event' || !Object.keys(eventPayload).length) return { invalidEvent: true as const }

      let eventId = String(eventPayload.id || '')
      let event = eventId ? await tx.campusEvent.findUnique({ where: { id: eventId } }) : null
      if (!event) {
        const [student, managedProfile] = await Promise.all([
          tx.studentProfile.findUnique({ where: { id: post.studentId || studentId }, select: { campusId: true } }),
          post.managedProfileId ? tx.managedProfile.findUnique({ where: { id: post.managedProfileId }, select: { campusId: true } }) : null
        ])
        event = await tx.campusEvent.create({ data: campusEventData(payload, managedProfile?.campusId ?? student?.campusId ?? null, post.createdAt) })
        eventId = event.id
        await tx.connectPost.update({
          where: { id: postId },
          data: { payload: jsonInput({ ...payload, event: { ...eventPayload, id: eventId } }) }
        })
      }

      const previousResponse = await tx.campusEventRsvp.findUnique({
        where: { eventId_studentId: { eventId, studentId } }
      })
      if (status === 'GOING' && event.capacity && previousResponse?.status !== 'GOING') {
        const goingCount = await tx.campusEventRsvp.count({ where: { eventId, status: 'GOING' } })
        if (goingCount >= event.capacity) return { capacityReached: true as const, capacity: event.capacity }
      }

      await tx.campusEventRsvp.upsert({
        where: { eventId_studentId: { eventId, studentId } },
        update: { status },
        create: { eventId, studentId, status }
      })
      const [goingCount, interestedCount] = await Promise.all([
        tx.campusEventRsvp.count({ where: { eventId, status: 'GOING' } }),
        tx.campusEventRsvp.count({ where: { eventId, status: 'INTERESTED' } })
      ])
      return {
        postId,
        eventId,
        viewerResponse: status === 'CANCELLED' ? null : status,
        goingCount,
        interestedCount,
        responseCount: goingCount + interestedCount
      }
    })
  }

  async setPollVote(postId: string, studentId: string, optionIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // Serialize votes on the same JSON-backed poll so simultaneous voters do
      // not overwrite one another's selections.
      await tx.$queryRaw`SELECT id FROM connect_posts WHERE id = ${postId} FOR UPDATE`
      const post = await tx.connectPost.findUnique({ where: { id: postId } })
      if (!post) return null
      const payload = payloadObject(post.payload)
      const poll = payloadObject(payload.poll)
      const options = Array.isArray(poll.options) ? poll.options.map((option) => payloadObject(option)) : []
      if (post.type !== 'poll' || options.length < 2) return { invalidPoll: true as const }
      if (poll.expiresAt && validDate(poll.expiresAt, new Date(0)).getTime() <= Date.now()) return { pollClosed: true as const }
      if (poll.selectionMode !== 'multiple' && optionIds.length > 1) return { tooManyOptions: true as const }
      const allowedOptionIds = new Set(options.map((option) => String(option.id)))
      if (optionIds.some((optionId) => !allowedOptionIds.has(optionId))) return { invalidOptions: true as const }

      const votes = payloadObject(poll.votes)
      if (optionIds.length) votes[studentId] = optionIds
      else delete votes[studentId]
      const storedPoll = { ...poll, votes }
      await tx.connectPost.update({
        where: { id: postId },
        data: { payload: jsonInput({ ...payload, poll: storedPoll }) }
      })
      return { postId, poll: pollForViewer(storedPoll, studentId) }
    })
  }

  async findPost(id: string) {
    const post = await prisma.connectPost.findUnique({ where: { id } })
    return post ? toRecord(post) : null
  }

  async isActiveKnowledgeSpaceMember(spaceId: string, studentId: string) {
    const space = await prisma.knowledgeSpace.findUnique({
      where: { id: spaceId },
      select: { ownerStudentId: true, status: true, memberships: { where: { studentId }, select: { status: true } } }
    })
    return Boolean(space?.status === 'ACTIVE' && (space.ownerStudentId === studentId || space.memberships[0]?.status === 'ACTIVE'))
  }

  async ensurePost(id: string, snapshot: Record<string, any>) {
    const existing = await prisma.connectPost.findUnique({ where: { id } })
    if (existing) return toRecord(existing)
    return toRecord(await prisma.connectPost.create({
      data: {
        id,
        type: snapshot.type ?? 'post',
        body: String(snapshot.body || 'Shared post'),
        visibility: 'campus',
        status: 'published',
        reactions: {},
        saves: 0,
        reposts: Number(snapshot.repostCount || 0),
        payload: jsonInput({
          sourceSnapshot: snapshot,
          mediaUrls: snapshot.mediaUrls ?? [],
          mediaEdits: snapshot.mediaEdits ?? [],
          reshares: {}
        })
      }
    }))
  }

  async togglePostReaction(id: string, studentId: string, reaction: string, snapshot: Record<string, any>) {
    await this.ensurePost(id, snapshot)
    return prisma.$transaction(async (tx) => {
      const post = await tx.connectPost.findUnique({ where: { id } })
      if (!post) return null
      const reactions = payloadObject(post.reactions)
      const viewerReacted = !reactions[studentId]
      if (viewerReacted) reactions[studentId] = reaction
      else delete reactions[studentId]
      await tx.connectPost.update({ where: { id }, data: { reactions: jsonInput(reactions) } })
      const sourceSnapshot = payloadObject(payloadObject(post.payload).sourceSnapshot)
      return {
        postId: id,
        viewerReacted,
        reactionCount: Number(sourceSnapshot.reactionCount || 0) + Object.keys(reactions).length
      }
    })
  }

  async setPostReshare(id: string, studentId: string, snapshot: Record<string, any>, active: boolean, commentary = '') {
    if (active) await this.ensurePost(id, snapshot)
    return prisma.$transaction(async (tx) => {
      const post = await tx.connectPost.findUnique({ where: { id } })
      if (!post) return null
      const payload = payloadObject(post.payload)
      const reshares = payloadObject(payload.reshares)
      const existingReshare = payloadObject(reshares[studentId])
      const wasReshared = Boolean(reshares[studentId])
      let resharePostId = String(existingReshare.resharePostId || '')
      if (active && !wasReshared) {
        const createdAt = new Date().toISOString()
        const resharePost = await tx.connectPost.create({
          data: {
            studentId,
            type: 'reshare',
            body: commentary || 'Reshared post',
            tags: [],
            visibility: post.visibility,
            status: 'published',
            reactions: {},
            saves: 0,
            reposts: 0,
            payload: jsonInput({
              reshareOfPostId: id,
              resharedPost: { id, ...snapshot },
              reshareCommentary: commentary,
              mediaUrls: [],
              mediaEdits: []
            })
          }
        })
        resharePostId = resharePost.id
        reshares[studentId] = { createdAt, resharePostId, commentary }
      } else if (active && wasReshared) {
        if (resharePostId) {
          const existingPost = await tx.connectPost.findFirst({ where: { id: resharePostId, studentId } })
          if (existingPost) {
            const resharePayload = payloadObject(existingPost.payload)
            await tx.connectPost.update({
              where: { id: resharePostId },
              data: {
                body: commentary || 'Reshared post',
                payload: jsonInput({ ...resharePayload, reshareCommentary: commentary })
              }
            })
          }
        }
        reshares[studentId] = { ...existingReshare, commentary }
      } else if (!active && wasReshared) {
        if (resharePostId) {
          await tx.connectPost.deleteMany({ where: { id: resharePostId, studentId } })
        }
        delete reshares[studentId]
      }
      const updated = await tx.connectPost.update({
        where: { id },
        data: {
          reposts: active && !wasReshared
            ? post.reposts + 1
            : !active && wasReshared
              ? Math.max(0, post.reposts - 1)
              : post.reposts,
          payload: jsonInput({ ...payload, reshares })
        }
      })
      return {
        postId: id,
        viewerReshared: active ? true : wasReshared ? false : false,
        viewerReshareCommentary: active ? commentary : '',
        repostCount: Math.max(0, updated.reposts),
        resharePostId: resharePostId || null
      }
    })
  }

  async listAnnouncementTargets(studentId: string) {
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, include: { campus: true } })
    const memberships = await prisma.communityGroupMembership.findMany({ where: { studentId, status: 'active' }, include: { group: true } })
    return {
      campus: student ? { id: student.campusId, name: student.campus.name } : null,
      groups: memberships.map(({ group }) => ({ id: group.id, name: group.name, category: group.category, campus: group.campus }))
    }
  }

  async searchEventOrganizers(query: string, actorStudentId?: string, actorBusinessId?: string) {
    const term = query.trim()
    const students = await prisma.studentProfile.findMany({ where: { user: { isActive: true }, ...(term ? { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }, { user: { username: { contains: term, mode: 'insensitive' } } }] } : actorStudentId ? { id: actorStudentId } : {}) }, include: { user: true }, take: 8 })
    const companies = await prisma.company.findMany({ where: { isActive: true, ...(term ? { name: { contains: term, mode: 'insensitive' } } : actorBusinessId ? { id: actorBusinessId } : {}) }, take: 8 })
    const campuses = term ? await prisma.campus.findMany({ where: { isActive: true, name: { contains: term, mode: 'insensitive' } }, take: 5 }) : []
    return { data: [
      ...students.map((student) => ({ id: student.id, type: 'person', name: [student.firstName, student.lastName].filter(Boolean).join(' '), handle: `@${student.user.username || student.user.email.split('@')[0]}`, avatarUrl: student.avatarUrl, isSelf: student.id === actorStudentId })),
      ...companies.map((company) => ({ id: company.id, type: 'business', name: company.name, handle: company.sector, avatarUrl: company.logoUrl, isSelf: company.id === actorBusinessId })),
      ...campuses.map((campus) => ({ id: campus.id, type: 'campus', name: campus.name, handle: [campus.branch, campus.city].filter(Boolean).join(' · '), avatarUrl: null, isSelf: false }))
    ] }
  }

  async searchPostTagTargets(query: string, actorStudentId?: string) {
    const term = query.trim()
    const actor = actorStudentId ? await prisma.studentProfile.findUnique({ where: { id: actorStudentId }, select: { campusId: true, courseId: true } }) : null
    const [campuses, courses, units] = await Promise.all([
      prisma.campus.findMany({
        where: { isActive: true, ...(term ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { branch: { contains: term, mode: 'insensitive' } }, { city: { contains: term, mode: 'insensitive' } }] } : actor?.campusId ? { id: actor.campusId } : {}) },
        orderBy: { name: 'asc' },
        take: 8
      }),
      prisma.course.findMany({
        where: term ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { category: { contains: term, mode: 'insensitive' } }] } : actor?.courseId ? { id: actor.courseId } : {},
        orderBy: { name: 'asc' },
        take: 8
      }),
      prisma.knowledgeUnit.findMany({
        where: term ? { name: { contains: term, mode: 'insensitive' } } : {},
        orderBy: term ? { name: 'asc' } : { updatedAt: 'desc' },
        take: term ? 10 : 5
      })
    ])
    return { data: [
      ...campuses.map((campus) => ({ type: 'university', id: campus.id, label: campus.name, kind: 'University', detail: [campus.branch, campus.city].filter(Boolean).join(' · ') })),
      ...courses.map((course) => ({ type: 'course', id: course.id, label: course.name, kind: 'Course', detail: course.category })),
      ...units.map((unit) => ({ type: 'unit', id: unit.id, label: unit.name, kind: 'Unit', detail: 'Learning unit' }))
    ] }
  }

  async listAnnouncementRequests() {
    const posts = await prisma.connectPost.findMany({ where: { status: { not: 'removed' } }, orderBy: { updatedAt: 'desc' } })
    return posts.map(toRecord).filter((post) => post.announcementRequest?.status === 'pending')
  }

  async updatePost(id: string, patch: Record<string, any>) {
    const existing = await prisma.connectPost.findUnique({ where: { id } })
    if (!existing) return null
    return toRecord(await prisma.connectPost.update({
      where: { id },
      data: {
        ...(patch.body ? { body: patch.body } : {}),
        ...(patch.type ? { type: patch.type } : {}),
        ...(patch.tags ? { tags: jsonInput(patch.tags) } : {}),
        ...(patch.visibility ? { visibility: patch.visibility } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.reactions ? { reactions: jsonInput(patch.reactions) } : {}),
        ...(patch.saves != null ? { saves: Number(patch.saves) } : {}),
        ...(patch.reposts != null ? { reposts: Number(patch.reposts) } : {}),
        payload: jsonInput({ ...payloadObject(existing.payload), ...patch })
      }
    }))
  }

  async createComment(payload: Record<string, any>) {
    const comment = await prisma.connectComment.create({
      data: {
        postId: payload.postId,
        studentId: payload.studentId ?? null,
        body: payload.body,
        status: payload.status ?? 'published',
        payload: jsonInput(payload)
      }
    })
    const author = comment.studentId ? await prisma.studentProfile.findUnique({ where: { id: comment.studentId }, include: { user: true } }) : null
    return {
      ...toRecord(comment),
      author: author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : 'Zumbarl student',
      handle: author ? `@${author.user?.username || author.user?.email?.split('@')[0] || 'student'}` : '@student',
      avatar: author?.avatarUrl || null
    }
  }

  createModerationCase(payload: Record<string, any>) {
    return moderationCases.create(payload)
  }

  async createGroup(payload: Record<string, any>) {
    return toRecord(await prisma.communityGroup.create({
      data: {
        ownerStudentId: payload.ownerStudentId ?? null,
        name: payload.name,
        category: payload.category,
        purpose: payload.purpose,
        rules: payload.rules ?? [],
        campus: payload.campus ?? null,
        contributionAmount: payload.contributionAmount == null ? null : Number(payload.contributionAmount),
        contributionCadence: payload.contributionCadence ?? null,
        status: payload.status ?? 'active',
        walletBalance: Number(payload.walletBalance ?? 0),
        payload: jsonInput(payload)
      }
    }))
  }

  async listGroups(query: Record<string, unknown>, viewerStudentId?: string) {
    const groups = await prisma.communityGroup.findMany({
      where: { status: { in: ['active', 'pending-review'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { memberships: true } },
        memberships: viewerStudentId
          ? { where: { studentId: viewerStudentId, status: 'active' }, take: 1 }
          : { where: { id: '__none__' }, take: 0 },
      },
    })
    return pageEnvelope(groups.map(({ _count, memberships, ...group }) => ({
      ...toRecord(group),
      memberCount: _count.memberships,
      viewerMembership: memberships[0] ? toRecord(memberships[0]) : null,
    })), query)
  }

  async findGroup(id: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id } })
    return group ? toRecord(group) : null
  }

  async findGroupForViewer(id: string, viewerStudentId: string) {
    const group = await prisma.communityGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { memberships: true, messages: true } },
        memberships: { where: { studentId: viewerStudentId, status: 'active' }, take: 1 },
      },
    })
    if (!group) return null
    const { _count, memberships, ...record } = group
    return {
      ...toRecord(record),
      memberCount: _count.memberships,
      messageCount: _count.messages,
      viewerMembership: memberships[0] ? toRecord(memberships[0]) : null,
    }
  }

  async listGroupMessages(groupId: string, viewerStudentId: string) {
    const messages = await prisma.communityGroupMessage.findMany({
      where: { groupId, status: 'published' },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
    const studentIds = [...new Set(messages.map((message) => message.studentId))]
    const memberships = await prisma.communityGroupMembership.findMany({
      where: { groupId, studentId: { in: studentIds }, status: 'active' },
      select: { studentId: true, payload: true },
    })
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const names = new Map(students.map((student) => [student.id, [student.firstName, student.lastName].filter(Boolean).join(' ')]))
    const labels = new Map(memberships.map((membership) => {
      const membershipPayload = payloadObject(membership.payload)
      return [membership.studentId, membershipPayload.participationMode === 'named'
        ? (names.get(String(membership.studentId)) || 'Circle member')
        : String(membershipPayload.alias || 'Circle member')]
    }))
    return messages.map((message) => {
      const record = toRecord(message)
      delete record.studentId
      return {
        ...record,
        authorAlias: labels.get(message.studentId) || 'Circle member',
        isViewer: message.studentId === viewerStudentId,
      }
    })
  }

  async createGroupMessage(groupId: string, studentId: string, body: string, type = 'message', payload: Record<string, any> = {}) {
    const [message, membership] = await prisma.$transaction([
      prisma.communityGroupMessage.create({ data: { groupId, studentId, body, type, payload: jsonInput(payload) } }),
      prisma.communityGroupMembership.findUnique({ where: { groupId_studentId: { groupId, studentId } } }),
    ])
    const membershipPayload = payloadObject(membership?.payload)
    const student = membershipPayload.participationMode === 'named'
      ? await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { firstName: true, lastName: true } })
      : null
    const record = toRecord(message)
    delete record.studentId
    return {
      ...record,
      authorAlias: membershipPayload.participationMode === 'named'
        ? ([student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'Circle member')
        : String(membershipPayload.alias || 'Circle member'),
      isViewer: true,
    }
  }

  async listGroupRealtimeRecipients(groupId: string) {
    const memberships = await prisma.communityGroupMembership.findMany({
      where: { groupId, status: 'active', studentId: { not: null } },
      select: { studentId: true },
    })
    const studentIds = memberships.map((membership) => String(membership.studentId))
    return prisma.studentProfile.findMany({
      where: { id: { in: studentIds }, user: { isActive: true } },
      select: { id: true, userId: true },
    })
  }

  async listGroupSchedules(groupId: string, viewerStudentId?: string, includeAdmissionRequests = false) {
    const schedules = await prisma.communityGroupSchedule.findMany({
      where: { groupId, status: { in: ['scheduled', 'active', 'completed'] } },
      orderBy: { startsAt: 'asc' },
      take: 100,
    })
    const eventIds = [...new Set(schedules.map((schedule) => String(payloadObject(schedule.payload).eventId || '')).filter(Boolean))]
    const [responseGroups, viewerResponses] = await Promise.all([
      eventIds.length ? prisma.campusEventRsvp.groupBy({
        by: ['eventId', 'status'],
        where: { eventId: { in: eventIds }, status: { in: ['GOING', 'INTERESTED'] } },
        _count: { _all: true },
      }) : [],
      eventIds.length && viewerStudentId ? prisma.campusEventRsvp.findMany({
        where: { eventId: { in: eventIds }, studentId: viewerStudentId, status: { in: ['GOING', 'INTERESTED'] } },
        select: { eventId: true, status: true },
      }) : [],
    ])
    const countsByEvent = new Map<string, { goingCount: number, interestedCount: number }>()
    responseGroups.forEach((response) => {
      const counts = countsByEvent.get(response.eventId) ?? { goingCount: 0, interestedCount: 0 }
      if (response.status === 'GOING') counts.goingCount = response._count._all
      if (response.status === 'INTERESTED') counts.interestedCount = response._count._all
      countsByEvent.set(response.eventId, counts)
    })
    const viewerResponseByEvent = new Map(viewerResponses.map((response) => [response.eventId, response.status]))
    return schedules.map((schedule) => {
      const storedPayload = payloadObject(schedule.payload)
      const admissions = payloadObject(storedPayload.admissions)
      const record = toRecord(schedule)
      delete record.admissions
      delete record.meetingCode
      const eventId = String(record.eventId || '')
      const counts = countsByEvent.get(eventId) ?? { goingCount: 0, interestedCount: 0 }
      const viewerAdmission = viewerStudentId ? payloadObject(admissions[viewerStudentId]) : {}
      const admissionRequests = includeAdmissionRequests ? Object.entries(admissions).flatMap(([studentId, value]) => {
        const admission = payloadObject(value)
        return admission.status === 'pending' ? [{ studentId, displayName: String(admission.displayName || 'Circle guest'), requestedAt: admission.requestedAt || null }] : []
      }) : undefined
      return {
        ...record,
        ...counts,
        responseCount: counts.goingCount + counts.interestedCount,
        viewerResponse: viewerResponseByEvent.get(eventId) ?? null,
        viewerAdmission: String(viewerAdmission.status || '') || null,
        ...(includeAdmissionRequests ? { admissionRequests } : {}),
      }
    })
  }

  async listGroupPosts(groupId: string, groupName: string, viewerStudentId: string, campus?: string | null, avatarUrl?: string | null) {
    const posts = await prisma.connectPost.findMany({
      where: { communityGroupId: groupId, status: 'published' },
      include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const commenterIds = [...new Set(posts.flatMap((post) => post.comments.map((comment) => comment.studentId)).filter(Boolean))] as string[]
    const commenters = commenterIds.length ? await prisma.studentProfile.findMany({
      where: { id: { in: commenterIds } },
      include: { user: true },
    }) : []
    const commenterById = new Map(commenters.map((student) => [student.id, student]))
    return posts.map((post) => {
      const record = toRecord(post)
      delete record.studentId
      delete record.comments
      const reactions = payloadObject(post.reactions)
      const storedPayload = payloadObject(post.payload)
      const reshares = payloadObject(storedPayload.reshares)
      return {
        ...record,
        author: { id: groupId, name: groupName, handle: 'Support circle', profileType: 'support-circle', avatarUrl: avatarUrl || null, campus: campus || null },
        comments: post.comments.map((comment) => {
          const author = comment.studentId ? commenterById.get(comment.studentId) : null
          return {
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            author: {
              name: author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : 'Zumbarl member',
              handle: author ? `@${author.user.username || author.user.email.split('@')[0]}` : '@member',
              avatarUrl: author?.avatarUrl || null,
            },
          }
        }),
        reactionCount: Object.keys(reactions).length,
        viewerReacted: Boolean(reactions[viewerStudentId]),
        commentCount: post.comments.length,
        repostCount: post.reposts,
        viewerReshared: Boolean(reshares[viewerStudentId]),
        viewerReshareCommentary: String(payloadObject(reshares[viewerStudentId]).commentary || ''),
        poll: pollForViewer(storedPayload.poll, viewerStudentId),
      }
    })
  }

  async createGroupPost(groupId: string, studentId: string, groupName: string, payload: Record<string, any>, campus?: string | null, avatarUrl?: string | null) {
    const post = await prisma.$transaction(async (tx) => {
      let storedPayload: Record<string, any> = { ...payload, visibility: 'campus', publishedAs: 'circle' }
      if (payload.type === 'event' && Object.keys(payloadObject(payload.event)).length) {
        const student = await tx.studentProfile.findUnique({ where: { id: studentId }, select: { campusId: true } })
        const event = await tx.campusEvent.create({ data: campusEventData(payload, student?.campusId ?? null) })
        storedPayload = { ...storedPayload, event: { ...payloadObject(payload.event), id: event.id, goingCount: 0, interestedCount: 0, responseCount: 0, viewerResponse: null } }
      }
      return tx.connectPost.create({
        data: {
          studentId,
          communityGroupId: groupId,
          type: payload.type || 'post',
          body: payload.body,
          tags: jsonInput(payload.tags || []),
          visibility: 'campus',
          status: 'published',
          reactions: jsonInput({}),
          saves: 0,
          reposts: 0,
          payload: jsonInput(storedPayload),
        },
      })
    })
    const record = toRecord(post)
    delete record.studentId
    return {
      ...record,
      author: { id: groupId, name: groupName, handle: 'Support circle', profileType: 'support-circle', avatarUrl: avatarUrl || null, campus: campus || null },
      comments: [],
      reactionCount: 0,
      viewerReacted: false,
      commentCount: 0,
      repostCount: 0,
      viewerReshared: false,
      viewerReshareCommentary: '',
      poll: pollForViewer(payload.poll, studentId),
    }
  }

  async removeGroupPost(groupId: string, postId: string) {
    const result = await prisma.connectPost.updateMany({ where: { id: postId, communityGroupId: groupId, status: 'published' }, data: { status: 'removed' } })
    return result.count > 0
  }

  async createGroupSchedule(groupId: string, studentId: string, groupName: string, payload: Record<string, any>, avatarUrl?: string | null) {
    return prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findUnique({ where: { id: studentId }, select: { campusId: true } })
      const membersOnly = payload.membersOnly !== false
      const publishToExplore = payload.publishToExplore === true
      const createZumbarlLink = payload.kind === 'audio_circle' && payload.createZumbarlLink === true
      const joinPolicy = payload.joinPolicy === 'host_approval' ? 'host_approval' : 'open'
      const thumbnailUrl = publishToExplore ? String(payload.thumbnailUrl || avatarUrl || '') || null : null
      const eventPayload = {
        title: payload.title,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        location: payload.location || (payload.kind === 'audio_circle' ? 'Online audio circle' : 'Support circle'),
        category: 'Wellness',
        thumbnailUrl,
        organizer: { name: groupName, type: 'group' },
        membersOnly,
        joinPolicy,
      }
      const event = await tx.campusEvent.create({
        data: {
          ...campusEventData({ ...payload, body: payload.description || payload.title, event: eventPayload }, student?.campusId ?? null),
          status: publishToExplore ? 'PUBLISHED' : 'DRAFT',
        },
      })
      let schedulePayload: Record<string, any> = { membersOnly, publishToExplore, createZumbarlLink, joinPolicy, thumbnailUrl, location: eventPayload.location, eventId: event.id, admissions: {} }
      let schedule = await tx.communityGroupSchedule.create({
        data: {
          groupId,
          createdByStudentId: studentId,
          title: payload.title,
          description: payload.description || null,
          kind: payload.kind || 'audio_circle',
          startsAt: new Date(payload.startsAt),
          endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
          status: 'scheduled',
          payload: jsonInput(schedulePayload),
        },
      })
      if (createZumbarlLink) {
        schedulePayload = {
          ...schedulePayload,
          meetingCode: randomUUID(),
          meetingPath: `/campus/wellbeing/circles/${encodeURIComponent(groupId)}?join=${encodeURIComponent(schedule.id)}`,
        }
        schedule = await tx.communityGroupSchedule.update({ where: { id: schedule.id }, data: { payload: jsonInput(schedulePayload) } })
      }
      if (publishToExplore) {
        const storedPayload = {
          type: 'event',
          body: payload.description || `${payload.title} hosted by ${groupName}.`,
          tags: [],
          mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
          visibility: 'campus',
          publishedAs: 'circle',
          scheduleId: schedule.id,
          membersOnly,
          joinPolicy,
          meetingPath: schedulePayload.meetingPath || null,
          event: { ...eventPayload, meetingPath: schedulePayload.meetingPath || null, id: event.id, goingCount: 0, interestedCount: 0, responseCount: 0, viewerResponse: null },
        }
        const post = await tx.connectPost.create({
          data: {
            studentId,
            communityGroupId: groupId,
            type: 'event',
            body: storedPayload.body,
            tags: jsonInput([]),
            visibility: 'campus',
            status: 'published',
            reactions: jsonInput({}),
            saves: 0,
            reposts: 0,
            payload: jsonInput(storedPayload),
          },
        })
        schedule = await tx.communityGroupSchedule.update({
          where: { id: schedule.id },
          data: { payload: jsonInput({ ...schedulePayload, explorePostId: post.id }) },
        })
      }
      const record = toRecord(schedule)
      delete record.admissions
      delete record.meetingCode
      return { ...record, goingCount: 0, interestedCount: 0, responseCount: 0, viewerResponse: null, viewerAdmission: null, admissionRequests: [] }
    })
  }

  async findGroupSchedule(groupId: string, scheduleId: string) {
    const schedule = await prisma.communityGroupSchedule.findFirst({ where: { id: scheduleId, groupId, status: { not: 'cancelled' } } })
    return schedule ? toRecord(schedule) : null
  }

  async findEventResponse(eventId: string, studentId: string) {
    return prisma.campusEventRsvp.findUnique({ where: { eventId_studentId: { eventId, studentId } }, select: { status: true } })
  }

  async requestScheduleAdmission(groupId: string, scheduleId: string, studentId: string, displayName: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM community_group_schedules WHERE id = ${scheduleId} FOR UPDATE`
      const schedule = await tx.communityGroupSchedule.findFirst({ where: { id: scheduleId, groupId, status: { not: 'cancelled' } } })
      if (!schedule) return null
      const storedPayload = payloadObject(schedule.payload)
      const admissions = payloadObject(storedPayload.admissions)
      const existing = payloadObject(admissions[studentId])
      if (existing.status === 'admitted' || existing.status === 'denied') return existing
      const admission = Object.keys(existing).length ? existing : { status: 'pending', displayName, requestedAt: new Date().toISOString() }
      admissions[studentId] = admission
      await tx.communityGroupSchedule.update({ where: { id: schedule.id }, data: { payload: jsonInput({ ...storedPayload, admissions }) } })
      return admission
    })
  }

  async decideScheduleAdmission(groupId: string, scheduleId: string, studentId: string, status: 'admitted' | 'denied', decidedByStudentId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM community_group_schedules WHERE id = ${scheduleId} FOR UPDATE`
      const schedule = await tx.communityGroupSchedule.findFirst({ where: { id: scheduleId, groupId, status: { not: 'cancelled' } } })
      if (!schedule) return null
      const storedPayload = payloadObject(schedule.payload)
      const admissions = payloadObject(storedPayload.admissions)
      const existing = payloadObject(admissions[studentId])
      if (!Object.keys(existing).length) return { missingRequest: true as const }
      const admission = { ...existing, status, decidedAt: new Date().toISOString(), decidedByStudentId }
      admissions[studentId] = admission
      await tx.communityGroupSchedule.update({ where: { id: schedule.id }, data: { payload: jsonInput({ ...storedPayload, admissions }) } })
      return { studentId, status }
    })
  }

  async setGroupScheduleResponse(groupId: string, scheduleId: string, studentId: string, status: 'GOING' | 'INTERESTED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.communityGroupSchedule.findFirst({ where: { id: scheduleId, groupId, status: { not: 'cancelled' } } })
      if (!schedule) return null
      const schedulePayload = payloadObject(schedule.payload)
      let eventId = String(schedulePayload.eventId || '')
      let event = eventId ? await tx.campusEvent.findUnique({ where: { id: eventId }, select: { id: true } }) : null
      if (!event) {
        const [group, student] = await Promise.all([
          tx.communityGroup.findUnique({ where: { id: groupId }, select: { name: true } }),
          tx.studentProfile.findUnique({ where: { id: studentId }, select: { campusId: true } }),
        ])
        event = await tx.campusEvent.create({
          data: {
            campusId: student?.campusId ?? null,
            title: schedule.title,
            description: schedule.description || schedule.title,
            category: 'Wellness',
            organizerName: group?.name || 'Support circle',
            organizerType: 'CAMPUS',
            locationName: String(schedulePayload.location || (schedule.kind === 'audio_circle' ? 'Online audio circle' : 'Support circle')),
            locationAddress: String(schedulePayload.location || ''),
            startsAt: schedule.startsAt,
            endsAt: schedule.endsAt,
            status: 'DRAFT',
          },
        })
        eventId = event.id
        await tx.communityGroupSchedule.update({
          where: { id: schedule.id },
          data: { payload: jsonInput({ ...schedulePayload, membersOnly: schedulePayload.membersOnly !== false, publishToExplore: false, eventId }) },
        })
      }
      await tx.campusEventRsvp.upsert({
        where: { eventId_studentId: { eventId, studentId } },
        update: { status },
        create: { eventId, studentId, status },
      })
      const [goingCount, interestedCount] = await Promise.all([
        tx.campusEventRsvp.count({ where: { eventId, status: 'GOING' } }),
        tx.campusEventRsvp.count({ where: { eventId, status: 'INTERESTED' } }),
      ])
      return {
        scheduleId,
        eventId,
        viewerResponse: status === 'CANCELLED' ? null : status,
        goingCount,
        interestedCount,
        responseCount: goingCount + interestedCount,
      }
    })
  }

  async findStudentPublicName(studentId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    })
    return student ? [student.firstName, student.lastName].filter(Boolean).join(' ') : null
  }

  async listGroupMembersForManagement(groupId: string, viewerStudentId: string, ownerStudentId?: string | null) {
    const memberships = await prisma.communityGroupMembership.findMany({
      where: { groupId, status: 'active', studentId: { not: null } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    })
    const studentIds = memberships.map((membership) => String(membership.studentId))
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const names = new Map(students.map((student) => [student.id, [student.firstName, student.lastName].filter(Boolean).join(' ')]))
    return memberships.map((membership) => {
      const membershipPayload = payloadObject(membership.payload)
      const participationMode = membershipPayload.participationMode === 'named' ? 'named' : 'alias'
      return {
        id: membership.id,
        role: membership.role,
        participationMode,
        displayName: participationMode === 'named'
          ? (names.get(String(membership.studentId)) || 'Circle member')
          : String(membershipPayload.alias || 'Circle member'),
        joinedAt: membership.createdAt,
        isViewer: membership.studentId === viewerStudentId,
        isOwner: Boolean(ownerStudentId && membership.studentId === ownerStudentId),
      }
    })
  }

  async findGroupMembershipById(groupId: string, membershipId: string) {
    const membership = await prisma.communityGroupMembership.findFirst({ where: { id: membershipId, groupId, status: 'active' } })
    return membership ? toRecord(membership) : null
  }

  async countGroupAdmins(groupId: string) {
    return prisma.communityGroupMembership.count({ where: { groupId, status: 'active', role: 'admin' } })
  }

  async updateGroupMembershipRole(groupId: string, membershipId: string, role: 'member' | 'admin') {
    const result = await prisma.communityGroupMembership.updateMany({ where: { id: membershipId, groupId, status: 'active' }, data: { role } })
    return result.count > 0
  }

  async removeGroupMembership(groupId: string, membershipId: string) {
    const result = await prisma.communityGroupMembership.updateMany({ where: { id: membershipId, groupId, status: 'active' }, data: { status: 'removed' } })
    return result.count > 0
  }

  async removeGroupMessage(groupId: string, messageId: string) {
    const result = await prisma.communityGroupMessage.updateMany({ where: { id: messageId, groupId, status: 'published' }, data: { status: 'removed' } })
    return result.count > 0
  }

  async findGroupMessage(groupId: string, messageId: string) {
    const message = await prisma.communityGroupMessage.findFirst({ where: { id: messageId, groupId, status: 'published' } })
    return message ? toRecord(message) : null
  }

  async updateGroup(id: string, patch: Record<string, any>) {
    const existing = await prisma.communityGroup.findUnique({ where: { id } })
    if (!existing) return null
    const data: Record<string, any> = { payload: jsonInput({ ...payloadObject(existing.payload), ...patch }) }
    for (const field of ['name', 'category', 'purpose', 'campus', 'contributionCadence', 'status']) {
      if (field in patch) data[field] = patch[field]
    }
    if ('rules' in patch) data.rules = patch.rules ?? []
    if ('contributionAmount' in patch) data.contributionAmount = patch.contributionAmount == null ? null : Number(patch.contributionAmount)
    if ('walletBalance' in patch) data.walletBalance = Number(patch.walletBalance)
    return toRecord(await prisma.communityGroup.update({ where: { id }, data }))
  }

  async createMembership(payload: Record<string, any>) {
    const membershipPayload = {
      participationMode: payload.participationMode ?? 'named',
      ...(payload.alias ? { alias: payload.alias } : {}),
    }
    if (!payload.studentId) {
      return toRecord(await prisma.communityGroupMembership.create({
        data: { groupId: payload.groupId, studentId: null, status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(membershipPayload) }
      }))
    }
    return toRecord(await prisma.communityGroupMembership.upsert({
      where: { groupId_studentId: { groupId: payload.groupId, studentId: payload.studentId } },
      update: { status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(membershipPayload) },
      create: { groupId: payload.groupId, studentId: payload.studentId, status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(membershipPayload) }
    }))
  }

  async createContribution(payload: Record<string, any>) {
    return toRecord(await prisma.communityChamaContribution.create({
      data: {
        groupId: payload.groupId,
        studentId: payload.studentId ?? null,
        amount: Number(payload.amount),
        currency: payload.currency ?? 'KES',
        status: payload.status ?? 'recorded',
        payload: jsonInput(payload)
      }
    }))
  }

  async findTagEntity(type: string, id: string) {
    if (type === 'project') return legacyProjects.findById(id)
    if (type === 'product') return prisma.marketplaceListing.findUnique({ where: { id } })
    if (type === 'person') return prisma.studentProfile.findUnique({ where: { id } })
    if (type === 'group' || type === 'club') return prisma.communityGroup.findUnique({ where: { id } })
    if (type === 'opportunity') return prisma.opportunity.findUnique({ where: { id } })
    if (type === 'roadmap') return prisma.careerRoadmap.findUnique({ where: { id } })
    if (type === 'university') return prisma.campus.findUnique({ where: { id } })
    if (type === 'course') return prisma.course.findUnique({ where: { id } })
    if (type === 'unit') return prisma.knowledgeUnit.findUnique({ where: { id } })
    return null
  }

  async upsertProfile(studentId: string | undefined, payload: Record<string, any>) {
    if (!studentId) return this.createProfile({ ...payload, studentId })
    return prisma.$transaction(async (tx) => {
      const existing = await tx.connectProfile.findUnique({ where: { studentId } })
      const connectPayload = { ...payload }
      delete connectPayload.showZumbarlPoints
      const mergedPayload = { ...payloadObject(existing?.payload), ...connectPayload }
      const student = payload.showZumbarlPoints !== undefined
        ? await tx.studentProfile.update({
          where: { id: studentId },
          data: { showZumbarlPoints: payload.showZumbarlPoints },
          select: { showZumbarlPoints: true }
        })
        : await tx.studentProfile.findUnique({
          where: { id: studentId },
          select: { showZumbarlPoints: true }
        })
      const profile = await tx.connectProfile.upsert({
        where: { studentId },
        update: {
          interests: payload.interests ?? [],
          safetyPreferences: jsonInput(payload.safetyPreferences ?? {}),
          visibility: payload.visibility ?? 'campus',
          payload: jsonInput(mergedPayload)
        },
        create: {
          studentId,
          interests: payload.interests ?? [],
          safetyPreferences: jsonInput(payload.safetyPreferences ?? {}),
          visibility: payload.visibility ?? 'campus',
          payload: jsonInput(mergedPayload)
        }
      })
      return {
        ...toRecord(profile),
        showZumbarlPoints: student?.showZumbarlPoints !== false
      }
    })
  }

  async upsertSocialAccount(studentId: string, account: Record<string, any>) {
    const existing = await prisma.connectProfile.findUnique({ where: { studentId } })
    const existingPayload = payloadObject(existing?.payload)
    const socialAccounts = Array.isArray(existingPayload.socialAccounts)
      ? existingPayload.socialAccounts.map((item) => payloadObject(item))
      : []
    const platform = String(account.platform || '').toLowerCase()
    const previousAccount = socialAccounts.find((item) => String(item.platform || '').toLowerCase() === platform)
    const metricHistory = Array.isArray(previousAccount?.metricHistory) ? previousAccount.metricHistory : []
    const accountWithHistory = {
      ...account,
      metricHistory: [
        ...metricHistory,
        {
          followers: account.followers,
          averageLikes: account.averageLikes,
          averageEngagement: account.averageEngagement,
          recordedAt: account.lastUpdatedAt,
          screenshotUploadId: account.screenshotUploadId
        }
      ].slice(-52)
    }
    const nextAccounts = [
      accountWithHistory,
      ...socialAccounts.filter((item) => String(item.platform || '').toLowerCase() !== platform)
    ]
    const payload = { ...existingPayload, socialAccounts: nextAccounts }
    const profile = await prisma.connectProfile.upsert({
      where: { studentId },
      update: { payload: jsonInput(payload) },
      create: {
        studentId,
        interests: [],
        safetyPreferences: jsonInput({}),
        visibility: 'campus',
        payload: jsonInput(payload)
      }
    })
    return toRecord(profile)
  }

  async readProfile(studentId: string | undefined): Promise<Record<string, any> | null> {
    if (!studentId) return null
    const [profile, student] = await Promise.all([
      prisma.connectProfile.findUnique({ where: { studentId } }),
      prisma.studentProfile.findUnique({ where: { id: studentId }, select: { showZumbarlPoints: true } })
    ])
    return profile || student ? {
      ...(profile ? toRecord(profile) : {}),
      showZumbarlPoints: student?.showZumbarlPoints !== false
    } : null
  }

  contributeToChama(id: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.communityGroup.findUnique({ where: { id } })
      if (!group) return null
      const contribution = await tx.communityChamaContribution.create({
        data: {
          groupId: id,
          studentId: studentId ?? null,
          amount: Number(payload.amount),
          currency: payload.currency ?? 'KES',
          status: 'recorded',
          payload: jsonInput(payload)
        }
      })
      await tx.communityGroup.update({ where: { id }, data: { walletBalance: { increment: Number(payload.amount) } } })
      return toRecord(contribution)
    })
  }
}

const connectCommunityRepository = new ConnectCommunityRepository()

export {
  ConnectCommunityRepository,
  connectCommunityRepository
}
