import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { completeUploadController, presignUploadController } from '../../controllers/uploads/index.js'
async function registerUploadRoutes(app: FastifyInstance) { const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin); app.post('/presign', { preHandler: anyActor }, presignUploadController); app.post('/:id/complete', { preHandler: anyActor }, completeUploadController) }

export {
  registerUploadRoutes
}
