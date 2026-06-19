import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  listAuditLogsController,
  listModerationCasesController,
  listUsersController,
  mergeDuplicateAccountsController,
  moderateContentController,
  readAdminMetricsController,
  readAnalyticsReportController,
  readContentModerationController,
  readFinancialOversightController,
  readGigOversightController,
  readSafetyMetricsController,
  readScoreControlController,
  readSuperAdminDashboardController,
  readSystemConfigurationController,
  recordFinancialActionController,
  reviewUserKycController,
  revokeUserSessionsController,
  updateGigOversightController,
  updateModerationCaseController,
  updateUserController,
  writeScoreConfigurationController,
  writeSystemConfigurationController
} from '../../controllers/admin/index.js'

async function registerAdminRoutes(app: FastifyInstance) {
  const adminOnly = requireRoles(...roleGroups.admin)
  const superAdminOnly = requireRoles('SUPER_ADMIN')
  const moderators = requireRoles(...roleGroups.admin, ...roleGroups.moderator)

  app.get('/metrics', { preHandler: adminOnly }, readAdminMetricsController)
  app.get('/users', { preHandler: adminOnly }, listUsersController)
  app.patch('/users/:id', { preHandler: adminOnly }, updateUserController)
  app.get('/moderation-cases', { preHandler: moderators }, listModerationCasesController)
  app.patch('/moderation-cases/:id', { preHandler: moderators }, updateModerationCaseController)

  app.get('/super-admin/dashboard', { preHandler: superAdminOnly }, readSuperAdminDashboardController)
  app.get('/super-admin/accounts', { preHandler: superAdminOnly }, listUsersController)
  app.patch('/super-admin/accounts/:id', { preHandler: superAdminOnly }, updateUserController)
  app.post('/super-admin/accounts/:id/revoke-sessions', { preHandler: superAdminOnly }, revokeUserSessionsController)
  app.post('/super-admin/accounts/:id/review-kyc', { preHandler: superAdminOnly }, reviewUserKycController)
  app.post('/super-admin/accounts/merge', { preHandler: superAdminOnly }, mergeDuplicateAccountsController)
  app.get('/super-admin/finance', { preHandler: superAdminOnly }, readFinancialOversightController)
  app.post('/super-admin/finance/actions', { preHandler: superAdminOnly }, recordFinancialActionController)
  app.get('/super-admin/gigs', { preHandler: superAdminOnly }, readGigOversightController)
  app.post('/super-admin/gigs/actions', { preHandler: superAdminOnly }, updateGigOversightController)
  app.get('/super-admin/score', { preHandler: superAdminOnly }, readScoreControlController)
  app.post('/super-admin/score/configurations', { preHandler: superAdminOnly }, writeScoreConfigurationController)
  app.get('/super-admin/safety-metrics', { preHandler: superAdminOnly }, readSafetyMetricsController)
  app.get('/super-admin/content', { preHandler: superAdminOnly }, readContentModerationController)
  app.post('/super-admin/content/actions', { preHandler: superAdminOnly }, moderateContentController)
  app.get('/super-admin/configuration', { preHandler: superAdminOnly }, readSystemConfigurationController)
  app.post('/super-admin/configuration', { preHandler: superAdminOnly }, writeSystemConfigurationController)
  app.get('/super-admin/analytics', { preHandler: superAdminOnly }, readAnalyticsReportController)
  app.get('/super-admin/audit-logs', { preHandler: superAdminOnly }, listAuditLogsController)
}

export {
  registerAdminRoutes
}
