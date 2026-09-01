import { randomUUID } from 'node:crypto'
import { ApiError, notFound } from '../../../lib/http.js'
import { env } from '../../../config/env.js'
import { emitRealtimeEvent } from '../../../lib/realtimeEvents.js'
import { countPresence, readCache, removePresence, touchPresence, writeCache } from '../../cache/redis/redisCache.adapter.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'

const SUPPORT_CIRCLE_AUDIO_ROOM_TTL_SECONDS = 2 * 60 * 60
const SUPPORT_CIRCLE_AUDIO_PRESENCE_TTL_SECONDS = 45

type SupportCircleAudioRoom = {
  roomUrl: string
  createdAt: string
  expiresAt: string
}

function supportCircleAudioRoomCacheKey(groupId: string, scheduleId = '') {
  return scheduleId ? `support-circle:${groupId}:schedule:${scheduleId}:audio-room` : `support-circle:${groupId}:audio-room`
}

function supportCircleAudioPresenceKey(groupId: string, roomUrl: string) {
  return `support-circle:${groupId}:audio-presence:${Buffer.from(roomUrl).toString('base64url')}`
}

async function withAudioParticipantCounts(messages: Array<Record<string, any>>) {
  const now = Date.now()
  return Promise.all(messages.map(async (message) => {
    if (message.type !== 'call_started' || !message.roomUrl || new Date(message.expiresAt || 0).getTime() <= now) return message
    const participantCount = await countPresence(
      supportCircleAudioPresenceKey(String(message.groupId || ''), String(message.roomUrl)),
      now,
      SUPPORT_CIRCLE_AUDIO_PRESENCE_TTL_SECONDS,
    ).catch(() => 0)
    return { ...message, participantCount }
  }))
}

function canManageSupportCircle(group: any, studentId: string) {
  return group.ownerStudentId === studentId || group.viewerMembership?.role === 'admin'
}

function requireCircleAdmin(group: any, studentId: string) {
  if (!canManageSupportCircle(group, studentId)) throw new ApiError(403, 'Only circle admins can do that', 'CIRCLE_ADMIN_REQUIRED')
}

function requireStudentId(studentId?: string) {
  if (!studentId) throw new ApiError(403, 'A student profile is required', 'STUDENT_PROFILE_REQUIRED')
  return studentId
}

async function broadcastCircleMessage(groupId: string, actorStudentId: string, message: Record<string, any>) {
  const recipients = await connectCommunityRepository.listGroupRealtimeRecipients(groupId)
  for (const recipient of recipients) {
    emitRealtimeEvent(recipient.userId, {
      type: 'circle.message.created',
      data: {
        groupId,
        message: { ...message, isViewer: recipient.id === actorStudentId },
      },
    })
  }
}

async function broadcastCircleMessageRemoval(groupId: string, messageId: string) {
  const recipients = await connectCommunityRepository.listGroupRealtimeRecipients(groupId)
  for (const recipient of recipients) {
    emitRealtimeEvent(recipient.userId, {
      type: 'circle.message.removed',
      data: { groupId, messageId },
    })
  }
}

const listConnectFeedService = (query: Record<string, unknown>, studentId?: string) => connectCommunityRepository.listFeed(query, studentId)
const listMyManagedProfilesService = (userId: string | undefined) => connectCommunityRepository.listManagedProfiles(userId ?? '')
async function createManagedProfileService(userId: string | undefined, payload: Record<string, any>, actorRole?: string) {
  if (!userId) throw new ApiError(401, 'Sign in to create a page', 'UNAUTHENTICATED')
  if (['hotel', 'barber_shop', 'service'].includes(payload.type) && !['ADMIN', 'SUPER_ADMIN'].includes(String(actorRole || '').toUpperCase())) {
    throw new ApiError(403, 'Only campus administrators can create service pages', 'ADMIN_REQUIRED')
  }
  return connectCommunityRepository.createManagedProfile(userId, payload)
}
async function addManagedProfileManagerService(id: string, ownerUserId: string | undefined, payload: Record<string, any>) {
  const manager = ownerUserId ? await connectCommunityRepository.readManagedProfileManager(ownerUserId, id) : null
  if (!manager || !['owner', 'admin'].includes(manager.role)) throw new ApiError(403, 'Only page owners and admins can share management', 'FORBIDDEN')
  return await connectCommunityRepository.addManagedProfileManager(id, payload.email, payload.role) ?? notFound('Registered user')
}
async function removeManagedProfileManagerService(id: string, managerUserId: string, ownerUserId: string | undefined) {
  const manager = ownerUserId ? await connectCommunityRepository.readManagedProfileManager(ownerUserId, id) : null
  if (!manager || !['owner', 'admin'].includes(manager.role)) throw new ApiError(403, 'Only page owners and admins can remove managers', 'FORBIDDEN')
  return connectCommunityRepository.removeManagedProfileManager(id, managerUserId)
}
async function readManagedProfileService(reference: string, userId?: string) { return await connectCommunityRepository.findManagedProfile(reference, userId) ?? notFound('Managed profile') }
async function setManagedProfileFollowService(id: string, userId: string | undefined, active: boolean) {
  if (!userId) throw new ApiError(401, 'Sign in to follow this page', 'UNAUTHENTICATED')
  await connectCommunityRepository.findManagedProfile(id) ?? notFound('Managed profile')
  return connectCommunityRepository.setManagedProfileFollow(id, userId, active)
}
async function updateManagedProfileService(id: string, userId: string | undefined, payload: Record<string, any>) {
  if (!userId || !await connectCommunityRepository.userManagesProfile(userId, id)) throw new ApiError(403, 'You do not manage this profile', 'FORBIDDEN')
  return connectCommunityRepository.updateManagedProfile(id, payload)
}
async function createManagedProfilePostService(id: string, userId: string | undefined, payload: Record<string, any>) {
  if (!userId || !await connectCommunityRepository.userManagesProfile(userId, id)) throw new ApiError(403, 'You cannot publish as this profile', 'FORBIDDEN')
  return connectCommunityRepository.createManagedProfilePost(id, payload)
}
async function updateManagedProfilePostService(id: string, postId: string, userId: string | undefined, payload: Record<string, any>) {
  if (!userId || !await connectCommunityRepository.userManagesProfile(userId, id)) throw new ApiError(403, 'You cannot edit posts for this profile', 'FORBIDDEN')
  return await connectCommunityRepository.updateManagedProfilePost(id, postId, payload) ?? notFound('Page post')
}
const readConnectProfileService = (studentId: string | undefined) => connectCommunityRepository.readProfile(requireStudentId(studentId))
async function upsertConnectProfileService(studentId: string | undefined, payload: Record<string, any>) { return connectCommunityRepository.upsertProfile(studentId, payload) }
async function createStoryService(studentId: string | undefined, payload: Record<string, any>, userId?: string) {
  const resolvedStudentId = requireStudentId(studentId)
  if ([payload.knowledgeSpaceId, payload.managedProfileId, payload.vendorSlug].filter(Boolean).length > 1) {
    throw new ApiError(400, 'Choose one page identity for this story', 'INVALID_STORY_IDENTITY')
  }
  if (payload.knowledgeSpaceId && !await connectCommunityRepository.isActiveKnowledgeSpaceMember(payload.knowledgeSpaceId, resolvedStudentId)) {
    throw new ApiError(403, 'Only active members can add a story for this library or group', 'FORBIDDEN')
  }
  if (payload.managedProfileId) {
    if (!userId || !await connectCommunityRepository.userManagesProfile(userId, payload.managedProfileId)) {
      throw new ApiError(403, 'You cannot publish a story as this page', 'FORBIDDEN')
    }
    const managedProfile = await connectCommunityRepository.findManagedProfile(payload.managedProfileId)
    if (!managedProfile) notFound('Managed profile')
    payload = { ...payload, managedProfileId: managedProfile.id }
  }
  if (payload.vendorSlug) {
    const vendor = userId ? await connectCommunityRepository.findManagedVendorStoryTarget(userId, payload.vendorSlug) : null
    if (!vendor) throw new ApiError(403, 'You cannot publish a story as this vendor', 'FORBIDDEN')
    payload = {
      ...payload,
      vendorShopId: vendor.id,
      vendorSnapshot: {
        id: vendor.id,
        slug: vendor.slug,
        name: vendor.name,
        avatarUrl: vendor.logoUrl,
        campus: vendor.campus?.name || vendor.locationLabel,
        isVerified: true
      }
    }
  }
  return connectCommunityRepository.createStory({ ...payload, studentId: resolvedStudentId, expiresAt: new Date(Date.now() + 86400000).toISOString(), status: 'live' })
}
const listStoriesService = (studentId?: string) => connectCommunityRepository.listStories(studentId)
const listSuggestedProfilesService = (studentId?: string, limit = 12) => connectCommunityRepository.listSuggestedProfiles(requireStudentId(studentId), limit)
async function readRelationshipService(studentId: string | undefined, targetStudentId: string) {
  const actorStudentId = requireStudentId(studentId)
  if (actorStudentId === targetStudentId) throw new ApiError(400, 'You cannot connect with yourself', 'SELF_RELATIONSHIP')
  return connectCommunityRepository.readRelationship(actorStudentId, targetStudentId)
}
async function setRelationshipService(studentId: string | undefined, targetStudentId: string, type: 'follow' | 'connect', active: boolean) {
  const actorStudentId = requireStudentId(studentId)
  if (actorStudentId === targetStudentId) throw new ApiError(400, 'You cannot connect with yourself', 'SELF_RELATIONSHIP')
  return connectCommunityRepository.setRelationship(actorStudentId, targetStudentId, type, active)
}
const searchEventOrganizersService = (query: string, studentId?: string, businessId?: string) => connectCommunityRepository.searchEventOrganizers(query, studentId, businessId)
const searchPostTagTargetsService = (query: string, studentId?: string) => connectCommunityRepository.searchPostTagTargets(query, studentId)
async function readStoryEngagementService(reference: string, studentId: string | undefined) {
  return await connectCommunityRepository.readStoryEngagement(reference, studentId) ?? {
    storyId: null,
    sourceId: reference,
    reactionCount: 0,
    viewerReacted: false,
    comments: []
  }
}
async function reactToStoryService(reference: string, studentId: string | undefined, reaction: string, snapshot: Record<string, any>) {
  const actorStudentId = requireStudentId(studentId)
  const story = await connectCommunityRepository.findStory(reference)
    ?? await connectCommunityRepository.ensureStory(reference, snapshot)
  return connectCommunityRepository.toggleStoryReaction(story.id, actorStudentId, reaction)
}
async function commentOnStoryService(reference: string, studentId: string | undefined, payload: Record<string, any>) {
  const actorStudentId = requireStudentId(studentId)
  const story = await connectCommunityRepository.findStory(reference)
    ?? await connectCommunityRepository.ensureStory(reference, payload.story ?? {})
  return connectCommunityRepository.createStoryComment(story.id, actorStudentId, payload.body)
}
async function reactToStoryCommentService(id: string, studentId: string | undefined, reaction: string) {
  return await connectCommunityRepository.toggleStoryCommentReaction(id, requireStudentId(studentId), reaction)
    ?? notFound('Story comment')
}
async function createPostService(studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  if (payload.knowledgeSpaceId && !await connectCommunityRepository.isActiveKnowledgeSpaceMember(payload.knowledgeSpaceId, resolvedStudentId)) {
    throw new ApiError(403, 'Only active members can post inside this library or group', 'FORBIDDEN')
  }
  return connectCommunityRepository.createPost({ ...payload, studentId: resolvedStudentId, status: 'published', reactions: {}, saves: 0, reposts: 0 })
}
async function requirePostAudienceAccess(post: Record<string, any>, studentId: string) {
  if (!post.communityGroupId) return
  const group: any = await connectCommunityRepository.findGroupForViewer(post.communityGroupId, studentId)
  if (!group?.viewerMembership) throw new ApiError(403, 'This post belongs to a private circle', 'CIRCLE_MEMBERSHIP_REQUIRED')
  if (group.category === 'support-circle') throw new ApiError(403, 'Support-circle posts stay inside the circle', 'CIRCLE_POST_PRIVATE')
}
async function updateOwnedPostService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const post = await connectCommunityRepository.findPost(id) ?? notFound('Post')
  if (post.communityGroupId) throw new ApiError(403, 'Circle posts are managed inside the circle', 'CIRCLE_POST_MANAGED')
  if (!studentId || post.studentId !== studentId) throw new ApiError(403, 'You can only edit your own posts', 'FORBIDDEN')
  return connectCommunityRepository.updatePost(id, payload)
}
async function reactToPostService(id: string, studentId: string | undefined, reaction: string, snapshot: Record<string, any>) {
  const actorStudentId = requireStudentId(studentId)
  const post = await connectCommunityRepository.findPost(id)
  if (post) await requirePostAudienceAccess(post, actorStudentId)
  return await connectCommunityRepository.togglePostReaction(id, actorStudentId, reaction, snapshot)
    ?? notFound('Post')
}
async function commentOnPostService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actorStudentId = requireStudentId(studentId)
  const existingPost = await connectCommunityRepository.findPost(id)
  if (existingPost) await requirePostAudienceAccess(existingPost, actorStudentId)
  else await connectCommunityRepository.ensurePost(id, payload.post ?? {})
  return connectCommunityRepository.createComment({ ...payload, postId: id, studentId: actorStudentId, status: 'published' })
}
async function resharePostService(id: string, studentId: string | undefined, snapshot: Record<string, any>, active: boolean, commentary = '') {
  const actorStudentId = requireStudentId(studentId)
  const existingPost = await connectCommunityRepository.findPost(id)
  if (existingPost?.communityGroupId) throw new ApiError(403, 'Private circle posts cannot be reshared', 'CIRCLE_POST_PRIVATE')
  if (active && existingPost?.studentId === actorStudentId) {
    throw new ApiError(400, 'You cannot reshare your own post', 'SELF_RESHARE')
  }
  return await connectCommunityRepository.setPostReshare(id, actorStudentId, snapshot, active, commentary)
    ?? notFound('Post')
}
async function respondToEventService(id: string, studentId: string | undefined, status: 'GOING' | 'INTERESTED' | 'CANCELLED') {
  const actor = requireStudentId(studentId)
  const post = await connectCommunityRepository.findPost(id) ?? notFound('Event post')
  if (post.communityGroupId && post.membersOnly) {
    const group: any = await connectCommunityRepository.findGroupForViewer(post.communityGroupId, actor)
    if (!group?.viewerMembership) throw new ApiError(403, 'Join this circle before responding to this event', 'MEMBERSHIP_REQUIRED')
  }
  const result = await connectCommunityRepository.setEventResponse(id, actor, status)
  if (!result) return notFound('Event post')
  if ('invalidEvent' in result) throw new ApiError(400, 'This post is not a campus event', 'NOT_AN_EVENT')
  if ('capacityReached' in result) throw new ApiError(409, `This event has reached its capacity of ${result.capacity}`, 'EVENT_AT_CAPACITY')
  return result
}
async function voteOnPollService(id: string, studentId: string | undefined, optionIds: string[]) {
  const result = await connectCommunityRepository.setPollVote(id, requireStudentId(studentId), optionIds)
  if (!result) return notFound('Poll post')
  if ('invalidPoll' in result) throw new ApiError(400, 'This post is not a poll', 'NOT_A_POLL')
  if ('pollClosed' in result) throw new ApiError(409, 'This poll has closed', 'POLL_CLOSED')
  if ('invalidOptions' in result) throw new ApiError(400, 'Choose valid poll options', 'INVALID_POLL_OPTIONS')
  if ('tooManyOptions' in result) throw new ApiError(400, 'This poll allows one choice', 'POLL_SINGLE_CHOICE')
  return result
}
async function reportPostService(id: string, reporterId: string | undefined, payload: Record<string, any>) { await connectCommunityRepository.findPost(id) ?? notFound('Post'); return connectCommunityRepository.createModerationCase({ ...payload, scope: 'post', scopeId: id, reporterId, status: 'open' }) }
async function readAnnouncementTargetsService(studentId?: string) { return connectCommunityRepository.listAnnouncementTargets(requireStudentId(studentId)) }
async function submitPostForAnnouncementService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actor = requireStudentId(studentId); const post = await connectCommunityRepository.findPost(id) ?? notFound('Post')
  if (post.studentId !== actor) throw new ApiError(403, 'You can only submit your own post', 'FORBIDDEN')
  const targets = await connectCommunityRepository.listAnnouncementTargets(actor)
  const allowed = payload.targetType === 'campus' ? targets.campus?.id === payload.targetId : targets.groups.some((group) => group.id === payload.targetId)
  if (!allowed) throw new ApiError(403, 'You cannot target that audience', 'INVALID_ANNOUNCEMENT_TARGET')
  return connectCommunityRepository.updatePost(id, { announcementRequest: { ...payload, status: 'pending', submittedAt: new Date().toISOString(), submittedByStudentId: actor } })
}
const listAnnouncementRequestsService = () => connectCommunityRepository.listAnnouncementRequests()
async function decideAnnouncementRequestService(id: string, adminUserId: string | undefined, payload: Record<string, any>) { const post = await connectCommunityRepository.findPost(id) ?? notFound('Post'); if (post.announcementRequest?.status !== 'pending') throw new ApiError(409, 'This request is no longer pending', 'ANNOUNCEMENT_NOT_PENDING'); return connectCommunityRepository.updatePost(id, { announcementRequest: { ...post.announcementRequest, status: payload.decision, reviewNote: payload.note, reviewedAt: new Date().toISOString(), reviewedByUserId: adminUserId } }) }
const createGroupService = (studentId: string | undefined, payload: Record<string, any>) => connectCommunityRepository.createGroup({ ...payload, ownerStudentId: studentId, status: 'active', walletBalance: 0 })
const listGroupsService = (query: Record<string, unknown>, studentId?: string) => connectCommunityRepository.listGroups(query, studentId)
async function readSupportCircleService(id: string, studentId?: string) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  const viewerCanManage = canManageSupportCircle(group, actor)
  const storedMessages = group.viewerMembership ? await connectCommunityRepository.listGroupMessages(id, actor) : []
  const messages = await withAudioParticipantCounts(storedMessages)
  const schedules = group.viewerMembership ? await connectCommunityRepository.listGroupSchedules(id, actor, viewerCanManage) : []
  const posts = group.viewerMembership ? await connectCommunityRepository.listGroupPosts(id, group.name, actor, group.campus, group.splashImageUrl) : []
  const members = viewerCanManage ? await connectCommunityRepository.listGroupMembersForManagement(id, actor, group.ownerStudentId) : []
  return { group: { ...group, viewerCanManage }, messages, schedules, posts, members }
}
async function createSupportCircleMessageService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  if (!group.viewerMembership) throw new ApiError(403, 'Join this circle before taking part', 'MEMBERSHIP_REQUIRED')
  const message = await connectCommunityRepository.createGroupMessage(id, actor, payload.body)
  await broadcastCircleMessage(id, actor, message)
  return message
}
async function createSupportCircleScheduleService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  if (!group.viewerMembership) throw new ApiError(403, 'Join this circle before scheduling a session', 'MEMBERSHIP_REQUIRED')
  requireCircleAdmin(group, actor)
  const schedule: any = await connectCommunityRepository.createGroupSchedule(id, actor, group.name, payload, group.splashImageUrl)
  const message = await connectCommunityRepository.createGroupMessage(id, actor, `${payload.kind === 'audio_circle' ? 'Audio circle' : 'Circle event'} scheduled`, 'schedule_created', {
    scheduleId: schedule.id,
    title: schedule.title,
    kind: schedule.kind,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    membersOnly: schedule.membersOnly,
    publishToExplore: schedule.publishToExplore,
  })
  await broadcastCircleMessage(id, actor, message)
  return schedule
}
async function respondToSupportCircleScheduleService(id: string, scheduleId: string, studentId: string | undefined, status: 'GOING' | 'INTERESTED' | 'CANCELLED') {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  const schedule: any = await connectCommunityRepository.findGroupSchedule(id, scheduleId) ?? notFound('Circle schedule')
  if (schedule.membersOnly !== false && !group.viewerMembership) throw new ApiError(403, 'Join this circle before responding', 'MEMBERSHIP_REQUIRED')
  const result = await connectCommunityRepository.setGroupScheduleResponse(id, scheduleId, actor, status)
  if (!result) return notFound('Circle schedule')
  if ('invalidEvent' in result) throw new ApiError(409, 'This schedule is not accepting RSVPs', 'SCHEDULE_RSVP_UNAVAILABLE')
  return result
}
async function decideSupportCircleScheduleAdmissionService(id: string, scheduleId: string, targetStudentId: string, studentId: string | undefined, status: 'admitted' | 'denied') {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  const schedule: any = await connectCommunityRepository.findGroupSchedule(id, scheduleId) ?? notFound('Circle schedule')
  if (schedule.joinPolicy !== 'host_approval') throw new ApiError(409, 'This call does not use host approval', 'SCHEDULE_ADMISSION_NOT_REQUIRED')
  const result = await connectCommunityRepository.decideScheduleAdmission(id, scheduleId, targetStudentId, status, actor)
  if (!result) return notFound('Circle schedule')
  if ('missingRequest' in result) return notFound('Admission request')
  return result
}
async function updateSupportCircleMemberRoleService(id: string, membershipId: string, studentId: string | undefined, role: 'member' | 'admin') {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  const target: any = await connectCommunityRepository.findGroupMembershipById(id, membershipId) ?? notFound('Circle member')
  if (target.studentId === group.ownerStudentId) throw new ApiError(409, 'The circle owner must remain an admin', 'OWNER_ROLE_LOCKED')
  if (target.studentId === actor && role !== 'admin') throw new ApiError(409, 'Ask another admin to change your role', 'SELF_ROLE_CHANGE')
  if (target.role === 'admin' && role === 'member' && await connectCommunityRepository.countGroupAdmins(id) <= 1) throw new ApiError(409, 'This circle must keep at least one admin', 'LAST_ADMIN')
  await connectCommunityRepository.updateGroupMembershipRole(id, membershipId, role)
  return { id: membershipId, role }
}
async function removeSupportCircleMemberService(id: string, membershipId: string, studentId: string | undefined) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  const target: any = await connectCommunityRepository.findGroupMembershipById(id, membershipId) ?? notFound('Circle member')
  if (target.studentId === group.ownerStudentId) throw new ApiError(409, 'The circle owner cannot be removed', 'OWNER_MEMBERSHIP_LOCKED')
  if (target.studentId === actor) throw new ApiError(409, 'You cannot remove yourself from management', 'SELF_REMOVAL')
  if (target.role === 'admin' && await connectCommunityRepository.countGroupAdmins(id) <= 1) throw new ApiError(409, 'This circle must keep at least one admin', 'LAST_ADMIN')
  await connectCommunityRepository.removeGroupMembership(id, membershipId)
  return { id: membershipId, removed: true }
}
async function removeSupportCircleMessageService(id: string, messageId: string, studentId: string | undefined) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  const message: any = await connectCommunityRepository.findGroupMessage(id, messageId) ?? notFound('Circle message')
  if (message.type !== 'message') throw new ApiError(409, 'Circle activity records cannot be removed here', 'SYSTEM_MESSAGE_LOCKED')
  await connectCommunityRepository.removeGroupMessage(id, messageId)
  await broadcastCircleMessageRemoval(id, messageId)
  return { id: messageId, removed: true }
}
async function createSupportCirclePostService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  const circlePayload = payload.type === 'event' && payload.event ? {
    ...payload,
    event: {
      ...payload.event,
      organizer: { id, type: 'campus', name: group.name, handle: 'Support circle', avatarUrl: null },
    },
  } : payload
  return connectCommunityRepository.createGroupPost(id, actor, group.name, circlePayload, group.campus, group.splashImageUrl)
}
async function removeSupportCirclePostService(id: string, postId: string, studentId: string | undefined) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  requireCircleAdmin(group, actor)
  if (!await connectCommunityRepository.removeGroupPost(id, postId)) notFound('Circle post')
  return { id: postId, removed: true }
}
async function joinSupportCircleAudioRoomService(id: string, studentId?: string, options: Record<string, any> = {}) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  const scheduleId = String(options.scheduleId || '')
  const schedule: any = scheduleId ? await connectCommunityRepository.findGroupSchedule(id, scheduleId) ?? notFound('Circle schedule') : null
  const isHost = canManageSupportCircle(group, actor)
  if (schedule && (schedule.kind !== 'audio_circle' || !schedule.createZumbarlLink || !schedule.meetingCode)) {
    throw new ApiError(409, 'This schedule does not have a Zumbarl call link', 'SCHEDULE_CALL_LINK_UNAVAILABLE')
  }
  if (!isHost && !group.viewerMembership && (!schedule || schedule.membersOnly !== false)) {
    throw new ApiError(403, 'Join this circle before entering its audio room', 'MEMBERSHIP_REQUIRED')
  }
  if (schedule) {
    const startsAt = new Date(schedule.startsAt).getTime()
    const endsAt = schedule.endsAt ? new Date(schedule.endsAt).getTime() : startsAt + SUPPORT_CIRCLE_AUDIO_ROOM_TTL_SECONDS * 1000
    const now = Date.now()
    if (now < startsAt) throw new ApiError(409, 'This call will open when the scheduled meeting starts', 'SCHEDULE_CALL_NOT_STARTED')
    if (now > endsAt) throw new ApiError(409, 'This scheduled call has ended', 'SCHEDULE_CALL_ENDED')
    if (schedule.joinPolicy === 'host_approval' && !isHost) {
      const storedMembership = group.viewerMembership || {}
      const useAlias = options.useAlias !== false
      const profileName = await connectCommunityRepository.findStudentPublicName(actor) || 'Circle guest'
      const displayName = useAlias ? String(storedMembership.alias || 'Circle guest') : profileName
      const admission: any = await connectCommunityRepository.requestScheduleAdmission(id, schedule.id, actor, displayName) ?? notFound('Circle schedule')
      if (admission.status === 'denied') throw new ApiError(403, 'A host did not admit you to this call', 'SCHEDULE_ADMISSION_DENIED')
      if (admission.status !== 'admitted') return {
        waitingForAdmission: true,
        admissionStatus: 'pending',
        groupId: id,
        groupName: group.name,
        scheduleId: schedule.id,
        meetingPath: schedule.meetingPath,
        joinPolicy: schedule.joinPolicy,
      }
    }
  }

  const cacheKey = supportCircleAudioRoomCacheKey(id, schedule?.id)
  const now = Date.now()
  let room = await readCache<SupportCircleAudioRoom>(cacheKey)
  let createdNewRoom = false
  if (!room || new Date(room.expiresAt).getTime() <= now) {
    createdNewRoom = true
    room = {
      roomUrl: `${env.JITSI_PUBLIC_URL.replace(/\/$/, '')}/zumbarl-circle-${schedule?.meetingCode || randomUUID()}`,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SUPPORT_CIRCLE_AUDIO_ROOM_TTL_SECONDS * 1000).toISOString(),
    }
  }
  await writeCache(cacheKey, room, SUPPORT_CIRCLE_AUDIO_ROOM_TTL_SECONDS)

  const membershipPayload = group.viewerMembership || {}
  const alias = String(membershipPayload.alias || (schedule ? 'Circle guest' : 'Circle member'))
  const profileName = await connectCommunityRepository.findStudentPublicName(actor) || 'Circle member'
  const useAlias = options.useAlias !== false
  if (createdNewRoom) {
    const message = await connectCommunityRepository.createGroupMessage(id, actor, schedule ? `Opened ${schedule.title}` : 'Started an audio circle', 'call_started', {
      roomUrl: room.roomUrl,
      expiresAt: room.expiresAt,
      media: 'audio-only',
      scheduleId: schedule?.id || null,
      title: schedule?.title || null,
    })
    await broadcastCircleMessage(id, actor, message)
  }
  return {
    ...room,
    groupId: id,
    groupName: group.name,
    scheduleId: schedule?.id || null,
    meetingPath: schedule?.meetingPath || null,
    alias: useAlias ? alias : profileName,
    identityMode: useAlias ? 'alias' : 'profile',
    media: 'audio-only',
    voiceProtection: options.voiceShieldEnabled === false ? 'natural-voice' : 'client-processed',
  }
}
async function updateSupportCircleAudioPresenceService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actor = requireStudentId(studentId)
  const group: any = await connectCommunityRepository.findGroupForViewer(id, actor) ?? notFound('Support circle')
  if (group.category !== 'support-circle') throw new ApiError(404, 'Support circle not found', 'NOT_FOUND')
  if (!group.viewerMembership && !canManageSupportCircle(group, actor)) {
    throw new ApiError(403, 'Join this circle before entering its audio room', 'MEMBERSHIP_REQUIRED')
  }
  const room = await readCache<SupportCircleAudioRoom>(supportCircleAudioRoomCacheKey(id, String(payload.scheduleId || '')))
  if (!room || room.roomUrl !== payload.roomUrl) {
    throw new ApiError(409, 'This audio circle is no longer active', 'AUDIO_ROOM_ENDED')
  }
  const presenceKey = supportCircleAudioPresenceKey(id, room.roomUrl)
  if (payload.action === 'leave') {
    await removePresence(presenceKey, actor)
    return { participantCount: await countPresence(presenceKey, Date.now(), SUPPORT_CIRCLE_AUDIO_PRESENCE_TTL_SECONDS) }
  }
  return {
    participantCount: await touchPresence(presenceKey, actor, Date.now(), SUPPORT_CIRCLE_AUDIO_PRESENCE_TTL_SECONDS),
  }
}
async function readTagContextService(type: string, id: string) { return { type, entity: await connectCommunityRepository.findTagEntity(type, id) } }
async function joinGroupService(id: string, studentId: string | undefined, payload: Record<string, any> = {}) { await connectCommunityRepository.findGroup(id) ?? notFound('Group'); return connectCommunityRepository.createMembership({ groupId: id, studentId, status: 'active', role: 'member', ...payload }) }
async function contributeToChamaService(id: string, studentId: string | undefined, payload: Record<string, any>) { return await connectCommunityRepository.contributeToChama(id, studentId, payload) ?? notFound('Group') }

export {
  listConnectFeedService,
  listMyManagedProfilesService,
  createManagedProfileService,
  addManagedProfileManagerService,
  removeManagedProfileManagerService,
  readManagedProfileService,
  setManagedProfileFollowService,
  updateManagedProfileService,
  createManagedProfilePostService,
  updateManagedProfilePostService,
  readConnectProfileService,
  upsertConnectProfileService,
  createStoryService,
  listStoriesService,
  listSuggestedProfilesService,
  readRelationshipService,
  setRelationshipService,
  searchEventOrganizersService,
  searchPostTagTargetsService,
  readStoryEngagementService,
  reactToStoryService,
  commentOnStoryService,
  reactToStoryCommentService,
  createPostService,
  updateOwnedPostService,
  reactToPostService,
  commentOnPostService,
  resharePostService,
  respondToEventService,
  voteOnPollService,
  reportPostService,
  readAnnouncementTargetsService,
  submitPostForAnnouncementService,
  listAnnouncementRequestsService,
  decideAnnouncementRequestService,
  readTagContextService,
  createGroupService,
  listGroupsService,
  readSupportCircleService,
  createSupportCircleMessageService,
  createSupportCircleScheduleService,
  respondToSupportCircleScheduleService,
  decideSupportCircleScheduleAdmissionService,
  updateSupportCircleMemberRoleService,
  removeSupportCircleMemberService,
  removeSupportCircleMessageService,
  createSupportCirclePostService,
  removeSupportCirclePostService,
  joinSupportCircleAudioRoomService,
  updateSupportCircleAudioPresenceService,
  joinGroupService,
  contributeToChamaService
}
