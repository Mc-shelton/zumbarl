import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { chamaContributionSchema, commentSchema, connectProfileSchema, groupSchema, postSchema, reactionSchema, reportPostSchema, storySchema } from '../../../validators/connect/index.js'
import { commentOnPostService, contributeToChamaService, createGroupService, createPostService, createStoryService, joinGroupService, listConnectFeedService, listGroupsService, listStoriesService, reactToPostService, readTagContextService, reportPostService, upsertConnectProfileService } from '../../../../adapters/services/connect/index.js'
async function listConnectFeedController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listConnectFeedService(request.query as Record<string, unknown>)) }
async function upsertConnectProfileController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await upsertConnectProfileService(request.authUser?.studentId, requireBody(connectProfileSchema, request))) }
async function createStoryController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createStoryService(request.authUser?.studentId, requireBody(storySchema, request))) }
async function listStoriesController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await listStoriesService()) }
async function createPostController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createPostService(request.authUser?.studentId, requireBody(postSchema, request))) }
async function reactToPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await reactToPostService(id, request.authUser?.studentId, requireBody(reactionSchema, request).reaction)) }
async function commentOnPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await commentOnPostService(id, request.authUser?.studentId, requireBody(commentSchema, request))) }
async function reportPostController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await reportPostService(id, request.authUser?.id, requireBody(reportPostSchema, request))) }
async function readTagContextController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ type: z.string(), id: z.string() }).parse(request.params); return reply.send(await readTagContextService(params.type, params.id)) }
async function createGroupController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createGroupService(request.authUser?.studentId, requireBody(groupSchema, request))) }
async function listGroupsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listGroupsService(request.query as Record<string, unknown>)) }
async function joinGroupController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await joinGroupService(id, request.authUser?.studentId)) }
async function contributeToChamaController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await contributeToChamaService(id, request.authUser?.studentId, requireBody(chamaContributionSchema, request))) }

export {
  listConnectFeedController,
  upsertConnectProfileController,
  createStoryController,
  listStoriesController,
  createPostController,
  reactToPostController,
  commentOnPostController,
  reportPostController,
  readTagContextController,
  createGroupController,
  listGroupsController,
  joinGroupController,
  contributeToChamaController
}
