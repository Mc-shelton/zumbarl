import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { cancelCallController, commentOnPostController, contributeToChamaController, createCallController, createGroupController, createMessageController, createPostController, createStoryController, endCallController, heartbeatController, joinGroupController, listConnectFeedController, listConversationsController, listGroupsController, listIncomingCallsController, listMessagesController, listStoriesController, reactToPostController, readCallController, readTagContextController, realtimeEventsController, reportPostController, respondToCallController, upsertConnectProfileController } from '../../controllers/connect/index.js'
async function registerConnectRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin, ...roleGroups.moderator)
  const authenticatedUsers = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin, ...roleGroups.moderator)
  app.post('/presence/heartbeat', { preHandler: authenticatedUsers }, heartbeatController)
  app.post('/calls', { preHandler: authenticatedUsers }, createCallController)
  app.get('/calls/incoming', { preHandler: authenticatedUsers }, listIncomingCallsController)
  app.get('/calls/:id', { preHandler: authenticatedUsers }, readCallController)
  app.patch('/calls/:id/respond', { preHandler: authenticatedUsers }, respondToCallController)
  app.patch('/calls/:id/cancel', { preHandler: authenticatedUsers }, cancelCallController)
  app.patch('/calls/:id/end', { preHandler: authenticatedUsers }, endCallController)
  app.get('/events', { preHandler: authenticatedUsers }, realtimeEventsController)
  app.get('/messages/conversations', { preHandler: authenticatedUsers }, listConversationsController)
  app.get('/messages', { preHandler: authenticatedUsers }, listMessagesController)
  app.post('/messages', { preHandler: authenticatedUsers }, createMessageController)
  app.get('/feed', { preHandler: students }, listConnectFeedController)
  app.post('/profile', { preHandler: students }, upsertConnectProfileController)
  app.post('/stories', { preHandler: students }, createStoryController)
  app.get('/stories', { preHandler: students }, listStoriesController)
  app.post('/posts', { preHandler: students }, createPostController)
  app.post('/posts/:id/reactions', { preHandler: students }, reactToPostController)
  app.post('/posts/:id/comments', { preHandler: students }, commentOnPostController)
  app.post('/posts/:id/report', { preHandler: students }, reportPostController)
  app.get('/tags/:type/:id/context', { preHandler: students }, readTagContextController)
  app.post('/groups', { preHandler: students }, createGroupController)
  app.get('/groups', { preHandler: students }, listGroupsController)
  app.post('/groups/:id/join', { preHandler: students }, joinGroupController)
  app.post('/groups/:id/chama-contributions', { preHandler: students }, contributeToChamaController)
}

export {
  registerConnectRoutes
}
