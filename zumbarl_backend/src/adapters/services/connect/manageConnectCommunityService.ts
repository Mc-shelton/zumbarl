import { ApiError, notFound } from '../../../lib/http.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'

function requireStudentId(studentId?: string) {
  if (!studentId) throw new ApiError(403, 'A student profile is required', 'STUDENT_PROFILE_REQUIRED')
  return studentId
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
const readConnectProfileService = (studentId: string | undefined) => connectCommunityRepository.readProfile(requireStudentId(studentId))
async function upsertConnectProfileService(studentId: string | undefined, payload: Record<string, any>) { return connectCommunityRepository.upsertProfile(studentId, payload) }
async function createStoryService(studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  if (payload.knowledgeSpaceId && !await connectCommunityRepository.isActiveKnowledgeSpaceMember(payload.knowledgeSpaceId, resolvedStudentId)) {
    throw new ApiError(403, 'Only active members can add a story for this library or group', 'FORBIDDEN')
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
async function updateOwnedPostService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const post = await connectCommunityRepository.findPost(id) ?? notFound('Post')
  if (!studentId || post.studentId !== studentId) throw new ApiError(403, 'You can only edit your own posts', 'FORBIDDEN')
  return connectCommunityRepository.updatePost(id, payload)
}
async function reactToPostService(id: string, studentId: string | undefined, reaction: string, snapshot: Record<string, any>) {
  return await connectCommunityRepository.togglePostReaction(id, requireStudentId(studentId), reaction, snapshot)
    ?? notFound('Post')
}
async function commentOnPostService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const actorStudentId = requireStudentId(studentId)
  await connectCommunityRepository.ensurePost(id, payload.post ?? {})
  return connectCommunityRepository.createComment({ ...payload, postId: id, studentId: actorStudentId, status: 'published' })
}
async function resharePostService(id: string, studentId: string | undefined, snapshot: Record<string, any>, active: boolean, commentary = '') {
  const actorStudentId = requireStudentId(studentId)
  const existingPost = await connectCommunityRepository.findPost(id)
  if (active && existingPost?.studentId === actorStudentId) {
    throw new ApiError(400, 'You cannot reshare your own post', 'SELF_RESHARE')
  }
  return await connectCommunityRepository.setPostReshare(id, actorStudentId, snapshot, active, commentary)
    ?? notFound('Post')
}
async function respondToEventService(id: string, studentId: string | undefined, status: 'GOING' | 'INTERESTED' | 'CANCELLED') {
  const result = await connectCommunityRepository.setEventResponse(id, requireStudentId(studentId), status)
  if (!result) return notFound('Event post')
  if ('invalidEvent' in result) throw new ApiError(400, 'This post is not a campus event', 'NOT_AN_EVENT')
  if ('capacityReached' in result) throw new ApiError(409, `This event has reached its capacity of ${result.capacity}`, 'EVENT_AT_CAPACITY')
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
const listGroupsService = (query: Record<string, unknown>) => connectCommunityRepository.listGroups(query)
async function readTagContextService(type: string, id: string) { return { type, entity: await connectCommunityRepository.findTagEntity(type, id) } }
async function joinGroupService(id: string, studentId: string | undefined) { await connectCommunityRepository.findGroup(id) ?? notFound('Group'); return connectCommunityRepository.createMembership({ groupId: id, studentId, status: 'active', role: 'member' }) }
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
  reportPostService,
  readAnnouncementTargetsService,
  submitPostForAnnouncementService,
  listAnnouncementRequestsService,
  decideAnnouncementRequestService,
  readTagContextService,
  createGroupService,
  listGroupsService,
  joinGroupService,
  contributeToChamaService
}
