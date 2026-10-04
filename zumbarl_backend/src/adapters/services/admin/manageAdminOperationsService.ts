import { notFound } from '../../../lib/http.js'
import { env } from '../../../config/env.js'
import { createSignedDownloadUrl, objectStorageKey, resolveLocalStoragePath } from '../../storage/index.js'
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
const readCampusVendorManagementService = () => adminOperationsRepository.readCampusVendorManagement()
async function createCampusVendorService(payload: Record<string, any>, context?: AuditContext) {
  return await adminOperationsRepository.createCampusVendor(payload, context) ?? notFound('Campus page or student vendor manager')
}
async function updateCampusVendorService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateCampusVendor(id, payload, context) ?? notFound('Campus vendor') }
async function reviewStudentKitchenService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.reviewStudentKitchen(id, payload, context) ?? notFound('Student kitchen') }
async function addCampusVendorManagerService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.addCampusVendorManager(id, payload.email, payload.role, context) ?? notFound('Campus vendor or eligible operator') }
async function removeCampusVendorManagerService(id: string, userId: string, context?: AuditContext) { return await adminOperationsRepository.removeCampusVendorManager(id, userId, context) ?? notFound('Removable campus vendor assignment') }
async function listUsersService(query: Record<string, unknown>) { const users = await adminOperationsRepository.listUsers(query); return { ...users, data: users.data.map(removePasswordHash) } }
async function updateUserService(id: string, payload: Record<string, any>, context?: AuditContext) { const user = await adminOperationsRepository.updateUser(id, payload, context) ?? notFound('User'); return removePasswordHash(user) }
async function revokeUserSessionsService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.revokeUserSessions(id, context, payload.reason) }
async function reviewUserKycService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.reviewUserKyc(id, payload, context) ?? notFound('User KYC profile') }
async function readStudentKycDocumentService(userId: string, documentId: string) {
  const document = await adminOperationsRepository.readStudentKycDocument(userId, documentId) ?? notFound('Student KYC document')
  if (document.provider === 's3') {
    return {
      ...document,
      downloadUrl: await createSignedDownloadUrl(env.OBJECT_STORAGE_BUCKET, objectStorageKey(document.bucket, document.storageKey))
    }
  }
  return { ...document, diskPath: resolveLocalStoragePath(document.bucket, document.storageKey) }
}
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
const readAcademicCatalogService = () => adminOperationsRepository.readAcademicCatalog()
async function updateAcademicCampusService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateAcademicCampus(id, payload, context) ?? notFound('Campus') }
async function updateAcademicCourseService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateAcademicCourse(id, payload, context) ?? notFound('Course') }
async function updateAcademicUnitService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateAcademicUnit(id, payload, context) ?? notFound('Unit') }
const readNavigationFeatureTagsService = () => adminOperationsRepository.readNavigationFeatureTags()
const writeSystemConfigurationService = (payload: Record<string, any>, context?: AuditContext) => adminOperationsRepository.writeSystemConfiguration(payload, context)
const readAnalyticsReportService = () => adminOperationsRepository.readAnalyticsReport()
const listAuditLogsService = (query: Record<string, unknown>) => adminOperationsRepository.listAuditLogs(query)
const listModerationCasesService = (query: Record<string, unknown>) => adminOperationsRepository.listModerationCases(query)
async function updateModerationCaseService(id: string, payload: Record<string, any>, context?: AuditContext) { return await adminOperationsRepository.updateModerationCase(id, payload, context) ?? notFound('Moderation case') }

export {
  readAdminMetricsService,
  readSuperAdminDashboardService,
  readCampusVendorManagementService,
  createCampusVendorService,
  updateCampusVendorService,
  reviewStudentKitchenService,
  addCampusVendorManagerService,
  removeCampusVendorManagerService,
  listUsersService,
  updateUserService,
  revokeUserSessionsService,
  reviewUserKycService,
  readStudentKycDocumentService,
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
  readAcademicCatalogService,
  updateAcademicCampusService,
  updateAcademicCourseService,
  updateAcademicUnitService,
  readNavigationFeatureTagsService,
  writeSystemConfigurationService,
  readAnalyticsReportService,
  listAuditLogsService,
  listModerationCasesService,
  updateModerationCaseService
}
