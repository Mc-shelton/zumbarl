import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { createCounselorBookingController, createWellnessReportController, listSupportCasesController, updateSupportCaseController } from '../../controllers/support/index.js'
async function registerSupportRoutes(app: FastifyInstance) {
  app.post('/wellness-reports', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.admin) }, createWellnessReportController)
  app.post('/counselor-bookings', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.support) }, createCounselorBookingController)
  app.get('/cases', { preHandler: requireRoles(...roleGroups.support, ...roleGroups.moderator) }, listSupportCasesController)
  app.patch('/cases/:id', { preHandler: requireRoles(...roleGroups.support, ...roleGroups.moderator) }, updateSupportCaseController)
}

export {
  registerSupportRoutes
}
