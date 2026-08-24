import type { Prisma } from '@prisma/client'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const moderationCases = createPrismaRecordRepository('moderationCases')
const legacyProjects = createPrismaRecordRepository('projects')

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function payloadObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
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
      include: { campus: true, communityGroup: true, managers: { where: { userId }, select: { role: true } } },
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
        posts: { where: { status: 'published' }, orderBy: { createdAt: 'desc' }, take: 30 },
        managers: { select: { role: true, user: { select: { id: true, name: true, username: true } } } },
        _count: { select: { followers: true, posts: true, managers: true } }
      }
    })
    if (!profile) return null
    const isFollowing = Boolean(viewerUserId && await prisma.managedProfileFollower.findUnique({ where: { managedProfileId_userId: { managedProfileId: profile.id, userId: viewerUserId } } }))
    return { ...profile, isFollowing }
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

  async listFeed(query: Record<string, unknown>, viewerStudentId?: string) {
    const records = await prisma.connectPost.findMany({
      where: { status: { not: 'removed' } },
      include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    })
    const studentIds = [...new Set(records.flatMap((record) => [record.studentId, ...record.comments.map((comment) => comment.studentId)]).filter(Boolean))] as string[]
    const students = await prisma.studentProfile.findMany({ where: { id: { in: studentIds } }, include: { user: true, campus: true } })
    const managedProfileIds = [...new Set(records.map((record) => record.managedProfileId).filter(Boolean))] as string[]
    const managedProfiles = await prisma.managedProfile.findMany({ where: { id: { in: managedProfileIds } }, include: { campus: true, communityGroup: true } })
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
    const knowledgeSpaceById = new Map(knowledgeSpaces.map((space) => [space.id, space]))
    const recordById = new Map(records.map((record) => [record.id, record]))
    const creatorFor = (candidate: typeof records[number]) => {
      const candidateKnowledgeSpace = candidate.knowledgeSpaceId ? knowledgeSpaceById.get(candidate.knowledgeSpaceId) : null
      const candidateStudent = candidate.studentId ? studentById.get(candidate.studentId) : null
      const candidateManagedProfile = candidate.managedProfileId ? managedProfileById.get(candidate.managedProfileId) : null
      const candidateSnapshot = payloadObject(payloadObject(candidate.payload).sourceSnapshot)
      return candidateKnowledgeSpace ? {
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
        campus: candidateStudent.campus?.name || null
      } : candidateSnapshot.creator ? payloadObject(candidateSnapshot.creator) : null
    }
    const mappedRecords = records.map((record) => {
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
        ...toRecord(record),
        comments,
        reactionCount: baseReactionCount + Object.keys(reactions).length,
        viewerReacted: Boolean(viewerStudentId && reactions[viewerStudentId]),
        commentCount: baseCommentCount + comments.length,
        repostCount: record.reposts,
        viewerReshared: Boolean(viewerStudentId && reshares[viewerStudentId]),
        viewerReshareCommentary: viewerStudentId ? String(payloadObject(reshares[viewerStudentId]).commentary || '') : '',
        creator: creatorFor(record),
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
        isMine: Boolean(viewerStudentId && record.studentId === viewerStudentId),
        isFollowing: Boolean(record.studentId && followedIds.has(record.studentId))
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
    const priorityFocusedIndex = focusedPostId
      ? priorityRecords.findIndex((record) => String((record as Record<string, any>).id || '') === focusedPostId)
      : -1
    const orderedRecords = priorityFocusedIndex > 0
      ? [priorityRecords[priorityFocusedIndex], ...priorityRecords.filter((_, index) => index !== priorityFocusedIndex)]
      : priorityRecords
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
    const storySpaces = storySpaceIds.length ? await prisma.knowledgeSpace.findMany({
      where: { id: { in: storySpaceIds }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, type: true, avatarUrl: true }
    }) : []
    const storySpaceById = new Map(storySpaces.map((space) => [space.id, space]))
    return {
      data: records.map((record) => {
        const { _count, student, ...story } = record
        return {
          ...toRecord(story),
          isMine: Boolean(viewerStudentId && record.studentId === viewerStudentId),
          creator: student ? { id: student.id, name: [student.firstName, student.lastName].filter(Boolean).join(' '), handle: `@${student.user.username || student.user.email.split('@')[0]}`, avatarUrl: student.avatarUrl, campus: student.campus.name, isSameCampus: student.campusId === viewer?.campusId } : null,
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
      where: { id: { not: viewerStudentId }, user: { isActive: true } },
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
    return candidates
      .sort((left, right) => {
        const campusDifference = Number(right.campusId === viewer.campusId) - Number(left.campusId === viewer.campusId)
        if (campusDifference) return campusDifference
        return right.updatedAt.getTime() - left.updatedAt.getTime()
      })
      .slice(0, Math.max(1, Math.min(limit, 30)))
      .map((candidate) => ({
        id: candidate.id,
        name: [candidate.firstName, candidate.lastName].filter(Boolean).join(' '),
        handle: `@${candidate.user.username || candidate.user.email.split('@')[0]}`,
        avatarUrl: candidate.avatarUrl,
        campus: candidate.campus.name,
        careerPath: candidate.careerPath,
        isFollowing: followedIds.has(candidate.id),
        isConnected: connectedIds.has(candidate.id),
        isOnline: Boolean(candidate.user.lastLoginAt && Date.now() - candidate.user.lastLoginAt.getTime() < 15 * 60 * 1000)
      }))
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

  async listGroups(query: Record<string, unknown>) {
    const groups = await prisma.communityGroup.findMany({ orderBy: { createdAt: 'desc' } })
    return pageEnvelope(groups.map(toRecord), query)
  }

  async findGroup(id: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id } })
    return group ? toRecord(group) : null
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
    if (!payload.studentId) {
      return toRecord(await prisma.communityGroupMembership.create({
        data: { groupId: payload.groupId, studentId: null, status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(payload) }
      }))
    }
    return toRecord(await prisma.communityGroupMembership.upsert({
      where: { groupId_studentId: { groupId: payload.groupId, studentId: payload.studentId } },
      update: { status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(payload) },
      create: { groupId: payload.groupId, studentId: payload.studentId, status: payload.status ?? 'active', role: payload.role ?? 'member', payload: jsonInput(payload) }
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
    const existing = await prisma.connectProfile.findUnique({ where: { studentId } })
    const mergedPayload = { ...payloadObject(existing?.payload), ...payload }
    const profile = await prisma.connectProfile.upsert({
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
    return toRecord(profile)
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

  async readProfile(studentId: string | undefined) {
    if (!studentId) return null
    const profile = await prisma.connectProfile.findUnique({ where: { studentId } })
    return profile ? toRecord(profile) : null
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
