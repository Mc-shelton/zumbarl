import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { announcementDecisionSchema, announcementSubmissionSchema, chamaContributionSchema, commentSchema, connectProfileSchema, groupSchema, postSchema, reactionSchema, reportPostSchema, storySchema, updatePostSchema } from '../../../validators/connect/index.js'
import { socialMetricsAccountSchema, socialMetricsExtractionSchema } from '../../../validators/connect/index.js'
import { commentOnPostService, commentOnStoryService, contributeToChamaService, createGroupService, createManagedProfilePostService, createPostService, createStoryService, decideAnnouncementRequestService, joinGroupService, listAnnouncementRequestsService, listConnectFeedService, listGroupsService, listMyManagedProfilesService, listStoriesService, reactToPostService, reactToStoryCommentService, reactToStoryService, readAnnouncementTargetsService, readConnectProfileService, readManagedProfileService, readRelationshipService, readStoryEngagementService, readTagContextService, reportPostService, searchEventOrganizersService, setRelationshipService, submitPostForAnnouncementService, updateManagedProfileService, updateOwnedPostService, upsertConnectProfileService } from '../../../../adapters/services/connect/index.js'
import { extractSocialMetricsService, readSocialMarketingProfileService, saveSocialMetricsService } from '../../../../adapters/services/connect/index.js'
import { addManagedProfileManagerService, createManagedProfileService, removeManagedProfileManagerService } from '../../../../adapters/services/connect/index.js'
import { setManagedProfileFollowService } from '../../../../adapters/services/connect/index.js'
const managedProfilePatchSchema = z.object({ name: z.string().min(2).max(120).optional(), bio: z.string().max(1000).nullable().optional(), avatarUrl: z.string().max(2000).nullable().optional(), coverImageUrl: z.string().max(2000).nullable().optional(), locationLabel: z.string().max(160).nullable().optional(), websiteUrl: z.string().max(2000).nullable().optional(), email: z.string().email().nullable().optional(), phone: z.string().max(40).nullable().optional(), details: z.record(z.any()).optional() })
const managedProfilePostSchema = z.object({ body: z.string().min(1).max(5000), type: z.enum(['post', 'announcement', 'event']).default('post'), visibility: z.enum(['public', 'campus', 'connections']).default('public'), tags: z.array(z.string()).default([]) }).passthrough()
const managedProfileCreateSchema = z.object({ type: z.enum(['campus', 'club', 'association', 'business']), name: z.string().min(2).max(120), slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/), handle: z.string().min(3).max(40).regex(/^@?[a-zA-Z0-9_]+$/), bio: z.string().max(1000).optional(), campusId: z.string().optional(), avatarUrl: z.string().optional(), coverImageUrl: z.string().optional(), locationLabel: z.string().optional(), websiteUrl: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), details: z.record(z.any()).default({}) })
const managedProfileManagerSchema = z.object({ email: z.string().email(), role: z.enum(['admin', 'editor']).default('editor') })
async function listConnectFeedController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listConnectFeedService(request.query as Record<string, unknown>, request.authUser?.studentId)) }
async function listMyManagedProfilesController(request: FastifyRequest, reply: FastifyReply) { return reply.send({ data: await listMyManagedProfilesService(request.authUser?.id) }) }
async function createManagedProfileController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createManagedProfileService(request.authUser?.id, requireBody(managedProfileCreateSchema, request))) }
async function addManagedProfileManagerController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await addManagedProfileManagerService(id, request.authUser?.id, requireBody(managedProfileManagerSchema, request))) }
async function removeManagedProfileManagerController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ id: z.string(), userId: z.string() }).parse(request.params); return reply.send(await removeManagedProfileManagerService(params.id, params.userId, request.authUser?.id)) }
async function readManagedProfileController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readManagedProfileService(id, request.authUser?.id)) }
async function followManagedProfileController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await setManagedProfileFollowService(id, request.authUser?.id, request.method !== 'DELETE')) }
async function updateManagedProfileController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateManagedProfileService(id, request.authUser?.id, requireBody(managedProfilePatchSchema, request))) }
async function createManagedProfilePostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await createManagedProfilePostService(id, request.authUser?.id, requireBody(managedProfilePostSchema, request))) }
async function readConnectProfileController(request: FastifyRequest, reply: FastifyReply) { return reply.send({ profile: await readConnectProfileService(request.authUser?.studentId) }) }
async function upsertConnectProfileController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await upsertConnectProfileService(request.authUser?.studentId, requireBody(connectProfileSchema, request))) }
async function readSocialMarketingProfileController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readSocialMarketingProfileService(request.authUser?.studentId)) }
async function extractSocialMetricsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await extractSocialMetricsService(request.authUser?.id, requireBody(socialMetricsExtractionSchema, request))) }
async function saveSocialMetricsController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await saveSocialMetricsService(request.authUser?.studentId, request.authUser?.id, requireBody(socialMetricsAccountSchema, request))) }
async function createStoryController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createStoryService(request.authUser?.studentId, requireBody(storySchema, request))) }
async function listStoriesController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listStoriesService(request.authUser?.studentId)) }
async function readRelationshipController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readRelationshipService(request.authUser?.studentId, id)) }
async function followProfileController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await setRelationshipService(request.authUser?.studentId, id, 'follow', request.method !== 'DELETE')) }
async function connectProfileController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await setRelationshipService(request.authUser?.studentId, id, 'connect', request.method !== 'DELETE')) }
async function readStoryEngagementController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readStoryEngagementService(id, request.authUser?.studentId)) }
async function reactToStoryController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); const payload = requireBody(reactionSchema, request); return reply.send(await reactToStoryService(id, request.authUser?.studentId, payload.reaction, payload.story ?? {})) }
async function commentOnStoryController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await commentOnStoryService(id, request.authUser?.studentId, requireBody(commentSchema, request))) }
async function reactToStoryCommentController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await reactToStoryCommentService(id, request.authUser?.studentId, requireBody(reactionSchema, request).reaction)) }
async function createPostController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createPostService(request.authUser?.studentId, requireBody(postSchema, request))) }
async function searchEventOrganizersController(request: FastifyRequest, reply: FastifyReply) { const { q } = z.object({ q: z.string().max(100).default('') }).parse(request.query); return reply.send(await searchEventOrganizersService(q, request.authUser?.studentId, request.authUser?.businessId)) }
async function updateOwnedPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateOwnedPostService(id, request.authUser?.studentId, requireBody(updatePostSchema, request))) }
async function reactToPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await reactToPostService(id, request.authUser?.studentId, requireBody(reactionSchema, request).reaction)) }
async function commentOnPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await commentOnPostService(id, request.authUser?.studentId, requireBody(commentSchema, request))) }
async function reportPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await reportPostService(id, request.authUser?.id, requireBody(reportPostSchema, request))) }
async function readAnnouncementTargetsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readAnnouncementTargetsService(request.authUser?.studentId)) }
async function submitPostForAnnouncementController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await submitPostForAnnouncementService(id, request.authUser?.studentId, requireBody(announcementSubmissionSchema, request))) }
async function listAnnouncementRequestsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send({ data: await listAnnouncementRequestsService() }) }
async function decideAnnouncementRequestController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await decideAnnouncementRequestService(id, request.authUser?.id, requireBody(announcementDecisionSchema, request))) }
async function readTagContextController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ type: z.string(), id: z.string() }).parse(request.params); return reply.send(await readTagContextService(params.type, params.id)) }
async function createGroupController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createGroupService(request.authUser?.studentId, requireBody(groupSchema, request))) }
async function listGroupsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listGroupsService(request.query as Record<string, unknown>)) }
async function joinGroupController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await joinGroupService(id, request.authUser?.studentId)) }
async function contributeToChamaController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await contributeToChamaService(id, request.authUser?.studentId, requireBody(chamaContributionSchema, request))) }

export {
  listConnectFeedController,
  listMyManagedProfilesController,
  createManagedProfileController,
  addManagedProfileManagerController,
  removeManagedProfileManagerController,
  readManagedProfileController,
  followManagedProfileController,
  updateManagedProfileController,
  createManagedProfilePostController,
  readConnectProfileController,
  upsertConnectProfileController,
  readSocialMarketingProfileController,
  extractSocialMetricsController,
  saveSocialMetricsController,
  createStoryController,
  listStoriesController,
  readRelationshipController,
  followProfileController,
  connectProfileController,
  readStoryEngagementController,
  reactToStoryController,
  commentOnStoryController,
  reactToStoryCommentController,
  createPostController,
  searchEventOrganizersController,
  updateOwnedPostController,
  reactToPostController,
  commentOnPostController,
  reportPostController,
  readAnnouncementTargetsController,
  submitPostForAnnouncementController,
  listAnnouncementRequestsController,
  decideAnnouncementRequestController,
  readTagContextController,
  createGroupController,
  listGroupsController,
  joinGroupController,
  contributeToChamaController
}
