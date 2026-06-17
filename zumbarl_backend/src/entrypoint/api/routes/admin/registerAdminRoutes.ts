import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { listModerationCasesController, listUsersController, readAdminMetricsController, updateModerationCaseController, updateUserController } from '../../controllers/admin/index.js'
async function registerAdminRoutes(app: FastifyInstance) {
  const adminOnly = requireRoles(...roleGroups.admin)
  const moderators = requireRoles(...roleGroups.admin, ...roleGroups.moderator)
  app.get('/metrics', { preHandler: adminOnly }, readAdminMetricsController)
  app.get('/users', { preHandler: adminOnly }, listUsersController)
  app.patch('/users/:id', { preHandler: adminOnly }, updateUserController)
  app.get('/moderation-cases', { preHandler: moderators }, listModerationCasesController)
  app.patch('/moderation-cases/:id', { preHandler: moderators }, updateModerationCaseController)
}

export {
  registerAdminRoutes
}
