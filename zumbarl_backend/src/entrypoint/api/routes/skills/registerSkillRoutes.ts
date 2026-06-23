import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { createSkillController, listSkillsController } from '../../controllers/skills/index.js'

async function registerSkillRoutes(app: FastifyInstance) {
  const authenticatedUser = requireRoles(...roleGroups.business, ...roleGroups.student, ...roleGroups.admin)

  app.get('/', { preHandler: authenticatedUser }, listSkillsController)
  app.post('/', { preHandler: authenticatedUser }, createSkillController)
}

export {
  registerSkillRoutes
}
