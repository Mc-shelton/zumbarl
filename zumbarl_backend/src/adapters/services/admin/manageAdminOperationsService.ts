import { notFound } from '../../../lib/http.js'
import { adminOperationsRepository } from '../../repositories/admin/index.js'

function removePasswordHash(record: Record<string, any>) {
  const safe = { ...record }
  delete safe.passwordHash
  return safe
}

type AuditContext = {
  actorId?: string
  ipAddress?: string
}

const readAdminMetricsService = () => adminOperationsRepository.readMetrics()
const readSuperAdminDashboardService = () => adminOperationsRepository.readSuperAdminDashboard()
async function listUsersService(query: Record<string, unknown>) { const users = await adminOperationsRepository.listUsers(query); return { ...users, data: users.data.map(removePasswordHash) } }
async function updateUserService(id: string, payload: Record<string, any>, context?: AuditContext) { const user = await adminOperationsRepository.updateUser(id, payload, context) ?? notFound('User'); return removePasswordHash(user) }
async function revokeUserSessionsService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.revokeUserSessions(id, context, payload.reason) }
async function reviewUserKycService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.reviewUserKyc(id, payload, context) ?? notFound('User KYC profile') }
async function mergeDuplicateAccountsService(payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.mergeDuplicateAccounts(payload, context) ?? notFound('Duplicate account pair') }
const readFinancialOversightService = (query: Record<string, unknown>) => adminOperationsRepository.readFinancialOversight(query)
const recordFinancialActionService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.recordFinancialAction(payload, context)
const readGigOversightService = (query: Record<string, unknown>) => adminOperationsRepository.readGigOversight(query)
const updateGigOversightService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.updateGigOversight(payload, context)
const readScoreControlService = () => adminOperationsRepository.readScoreControl()
const writeScoreConfigurationService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.writeScoreConfiguration(payload, context)
const readSafetyMetricsService = () => adminOperationsRepository.readSafetyMetrics()
const readContentModerationService = (query: Record<string, unknown>) => adminOperationsRepository.readContentModeration(query)
const moderateContentService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.moderateContent(payload, context)
const readSystemConfigurationService = () => adminOperationsRepository.readSystemConfiguration()
const readNavigationFeatureTagsService = () => adminOperationsRepository.readNavigationFeatureTags()
const writeSystemConfigurationService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.writeSystemConfiguration(payload, context)
const readAnalyticsReportService = () => adminOperationsRepository.readAnalyticsReport()
const listAuditLogsService = (query: Record<string, unknown>) => adminOperationsRepository.listAuditLogs(query)
const listModerationCasesService = (query: Record<string, unknown>) => adminOperationsRepository.listModerationCases(query)
async function updateModerationCaseService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateModerationCase(id, payload, context) ?? notFound('Moderation case') }

export {
  readAdminMetricsService,
  readSuperAdminDashboardService,
  listUsersService,
  updateUserService,
  revokeUserSessionsService,
  reviewUserKycService,
  mergeDuplicateAccountsService,
  readFinancialOversightService,
  recordFinancialActionService,
  readGigOversightService,
  updateGigOversightService,
  readScoreControlService,
  writeScoreConfigurationService,
  readSafetyMetricsService,
  readContentModerationService,
  moderateContentService,
  readSystemConfigurationService,
  readNavigationFeatureTagsService,
  writeSystemConfigurationService,
  readAnalyticsReportService,
  listAuditLogsService,
  listModerationCasesService,
  updateModerationCaseService
}
