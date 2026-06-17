import { notFound } from '../../../lib/http.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'
const listConnectFeedService = (query: Record<string, unknown>) => connectCommunityRepository.listFeed(query)
async function upsertConnectProfileService(studentId: string | undefined, payload: Record<string, any>) { return connectCommunityRepository.upsertProfile(studentId, payload) }
const createStoryService = (studentId: string | undefined, payload: Record<string, any>) => connectCommunityRepository.createStory({ ...payload, studentId, expiresAt: new Date(Date.now() + 86400000).toISOString(), status: 'live' })
const listStoriesService = () => connectCommunityRepository.listStories()
const createPostService = (studentId: string | undefined, payload: Record<string, any>) => connectCommunityRepository.createPost({ ...payload, studentId, status: 'published', reactions: {}, saves: 0, reposts: 0 })
async function reactToPostService(id: string, studentId: string | undefined, reaction: string) { const post = await connectCommunityRepository.findPost(id) ?? notFound('Post'); return connectCommunityRepository.updatePost(id, { reactions: { ...(post.reactions ?? {}), [studentId ?? 'anonymous']: reaction } }) }
async function commentOnPostService(id: string, studentId: string | undefined, payload: Record<string, any>) { await connectCommunityRepository.findPost(id) ?? notFound('Post'); return connectCommunityRepository.createComment({ ...payload, postId: id, studentId, status: 'published' }) }
async function reportPostService(id: string, reporterId: string | undefined, payload: Record<string, any>) { await connectCommunityRepository.findPost(id) ?? notFound('Post'); return connectCommunityRepository.createModerationCase({ ...payload, scope: 'post', scopeId: id, reporterId, status: 'open' }) }
const createGroupService = (studentId: string | undefined, payload: Record<string, any>) => connectCommunityRepository.createGroup({ ...payload, ownerStudentId: studentId, status: 'active', walletBalance: 0 })
const listGroupsService = (query: Record<string, unknown>) => connectCommunityRepository.listGroups(query)
async function readTagContextService(type: string, id: string) { return { type, entity: await connectCommunityRepository.findTagEntity(type, id) } }
async function joinGroupService(id: string, studentId: string | undefined) { await connectCommunityRepository.findGroup(id) ?? notFound('Group'); return connectCommunityRepository.createMembership({ groupId: id, studentId, status: 'active', role: 'member' }) }
async function contributeToChamaService(id: string, studentId: string | undefined, payload: Record<string, any>) { return await connectCommunityRepository.contributeToChama(id, studentId, payload) ?? notFound('Group') }

export {
  listConnectFeedService,
  upsertConnectProfileService,
  createStoryService,
  listStoriesService,
  createPostService,
  reactToPostService,
  commentOnPostService,
  reportPostService,
  readTagContextService,
  createGroupService,
  listGroupsService,
  joinGroupService,
  contributeToChamaService
}
