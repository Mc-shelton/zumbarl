import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { commentOnPostController, contributeToChamaController, createGroupController, createPostController, createStoryController, joinGroupController, listConnectFeedController, listGroupsController, listStoriesController, reactToPostController, readTagContextController, reportPostController, upsertConnectProfileController } from '../../controllers/connect/index.js'
async function registerConnectRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin, ...roleGroups.moderator)
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
