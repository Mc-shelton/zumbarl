import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { completeWellbeingResetController, createCounselorBookingController, createWellbeingCheckInController, createWellbeingConversationController, createWellbeingConversationMessageController, createWellnessReportController, listSupportCasesController, readWellbeingConversationController, readWellbeingDashboardController, updateSupportCaseController, updateWellbeingPreferenceController } from '../../controllers/support/index.js'
async function registerSupportRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student)
  app.get('/wellbeing', { preHandler: students }, readWellbeingDashboardController)
  app.post('/wellbeing/check-ins', { preHandler: students }, createWellbeingCheckInController)
  app.patch('/wellbeing/preferences', { preHandler: students }, updateWellbeingPreferenceController)
  app.post('/wellbeing/resets', { preHandler: students }, completeWellbeingResetController)
  app.post('/wellbeing/conversations', { preHandler: students }, createWellbeingConversationController)
  app.get('/wellbeing/conversations/:id', { preHandler: students }, readWellbeingConversationController)
  app.post('/wellbeing/conversations/:id/messages', { preHandler: students }, createWellbeingConversationMessageController)
  app.post('/wellness-reports', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.admin) }, createWellnessReportController)
  app.post('/counselor-bookings', { preHandler: requireRoles(...roleGroups.student, ...roleGroups.support) }, createCounselorBookingController)
  app.get('/cases', { preHandler: requireRoles(...roleGroups.support, ...roleGroups.moderator) }, listSupportCasesController)
  app.patch('/cases/:id', { preHandler: requireRoles(...roleGroups.support, ...roleGroups.moderator) }, updateSupportCaseController)
}

export {
  registerSupportRoutes
}
