import type { FastifyReply, FastifyRequest } from 'fastify'
import { createReadStream } from 'node:fs'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import {
  contentModerationActionSchema,
  financialActionSchema,
  gigOversightActionSchema,
  mergeDuplicateAccountsSchema,
  reviewKycSchema,
  revokeSessionsSchema,
  scoreConfigurationSchema,
  systemConfigurationSchema,
  updateModerationCaseSchema,
  updateUserSchema,
  campusVendorSchema,
  campusVendorUpdateSchema,
  campusVendorManagerSchema,
  campusVendorReviewSchema,
  academicCampusUpdateSchema,
  academicCourseUpdateSchema,
  academicUnitUpdateSchema
} from '../../../validators/admin/index.js'
import {
  listAuditLogsService,
  listModerationCasesService,
  listUsersService,
  mergeDuplicateAccountsService,
  moderateContentService,
  readAdminMetricsService,
  readAnalyticsReportService,
  readContentModerationService,
  readFinancialOversightService,
  readGigOversightService,
  readSafetyMetricsService,
  readScoreControlService,
  readSuperAdminDashboardService,
  readSystemConfigurationService,
  readNavigationFeatureTagsService,
  recordFinancialActionService,
  reviewUserKycService,
  readStudentKycDocumentService,
  revokeUserSessionsService,
  updateGigOversightService,
  updateModerationCaseService,
  updateUserService,
  writeScoreConfigurationService,
  writeSystemConfigurationService,
  readAcademicCatalogService,
  updateAcademicCampusService,
  updateAcademicCourseService,
  updateAcademicUnitService,
  readCampusVendorManagementService,
  createCampusVendorService,
  updateCampusVendorService,
  reviewStudentKitchenService,
  addCampusVendorManagerService,
  removeCampusVendorManagerService
} from '../../../../adapters/services/admin/index.js'

function firstHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function getRequestIpAddress(request: FastifyRequest) {
  const forwardedFor = firstHeaderValue(request.headers['x-forwarded-for'])
  const realIp = firstHeaderValue(request.headers['x-real-ip'])
  const cloudflareIp = firstHeaderValue(request.headers['cf-connecting-ip'])
  return cloudflareIp || realIp || forwardedFor?.split(',')[0]?.trim() || request.ip
}

function getAuditContext(request: FastifyRequest) {
  return {
    actorId: request.authUser?.id,
    ipAddress: getRequestIpAddress(request)
  }
}

async function readAdminMetricsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readAdminMetricsService()) }
async function readSuperAdminDashboardController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readSuperAdminDashboardService()) }
async function readCampusVendorManagementController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readCampusVendorManagementService()) }
async function createCampusVendorController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createCampusVendorService(requireBody(campusVendorSchema, request), getAuditContext(request))) }
async function updateCampusVendorController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateCampusVendorService(id, requireBody(campusVendorUpdateSchema, request), getAuditContext(request))) }
async function reviewStudentKitchenController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await reviewStudentKitchenService(id, requireBody(campusVendorReviewSchema, request), getAuditContext(request))) }
async function addCampusVendorManagerController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await addCampusVendorManagerService(id, requireBody(campusVendorManagerSchema, request), getAuditContext(request))) }
async function removeCampusVendorManagerController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ id: z.string(), userId: z.string() }).parse(request.params); return reply.send(await removeCampusVendorManagerService(params.id, params.userId, getAuditContext(request))) }
async function listUsersController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listUsersService(request.query as Record<string, unknown>)) }
async function updateUserController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateUserService(id, requireBody(updateUserSchema, request), getAuditContext(request))) }
async function revokeUserSessionsController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await revokeUserSessionsService(id, requireBody(revokeSessionsSchema, request), getAuditContext(request))) }
async function reviewUserKycController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await reviewUserKycService(id, requireBody(reviewKycSchema, request), getAuditContext(request))) }
async function readStudentKycDocumentController(request: FastifyRequest, reply: FastifyReply) {
  const { id, documentId } = z.object({ id: z.string().min(1), documentId: z.string().min(1) }).parse(request.params)
  const document = await readStudentKycDocumentService(id, documentId)
  const safeFileName = document.fileName.replace(/["\\\r\n]/g, '_')
  return reply.type(document.mimeType).header('Content-Disposition', `inline; filename="${safeFileName}"`).send(createReadStream(document.diskPath))
}
async function mergeDuplicateAccountsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await mergeDuplicateAccountsService(requireBody(mergeDuplicateAccountsSchema, request), getAuditContext(request))) }
async function readFinancialOversightController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readFinancialOversightService(request.query as Record<string, unknown>)) }
async function recordFinancialActionController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await recordFinancialActionService(requireBody(financialActionSchema, request), getAuditContext(request))) }
async function readGigOversightController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readGigOversightService(request.query as Record<string, unknown>)) }
async function updateGigOversightController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await updateGigOversightService(requireBody(gigOversightActionSchema, request), getAuditContext(request))) }
async function readScoreControlController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readScoreControlService()) }
async function writeScoreConfigurationController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await writeScoreConfigurationService(requireBody(scoreConfigurationSchema, request), getAuditContext(request))) }
async function readSafetyMetricsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readSafetyMetricsService()) }
async function readContentModerationController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readContentModerationService(request.query as Record<string, unknown>)) }
async function moderateContentController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await moderateContentService(requireBody(contentModerationActionSchema, request), getAuditContext(request))) }
async function readSystemConfigurationController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readSystemConfigurationService()) }
async function readNavigationFeatureTagsController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readNavigationFeatureTagsService()) }
async function writeSystemConfigurationController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await writeSystemConfigurationService(requireBody(systemConfigurationSchema, request), getAuditContext(request))) }
async function readAcademicCatalogController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readAcademicCatalogService()) }
async function updateAcademicCampusController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateAcademicCampusService(id, requireBody(academicCampusUpdateSchema, request), getAuditContext(request))) }
async function updateAcademicCourseController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateAcademicCourseService(id, requireBody(academicCourseUpdateSchema, request), getAuditContext(request))) }
async function updateAcademicUnitController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateAcademicUnitService(id, requireBody(academicUnitUpdateSchema, request), getAuditContext(request))) }
async function readAnalyticsReportController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readAnalyticsReportService()) }
async function listAuditLogsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listAuditLogsService(request.query as Record<string, unknown>)) }
async function listModerationCasesController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listModerationCasesService(request.query as Record<string, unknown>)) }
async function updateModerationCaseController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateModerationCaseService(id, requireBody(updateModerationCaseSchema, request), getAuditContext(request))) }

export {
  readAdminMetricsController,
  readSuperAdminDashboardController,
  readCampusVendorManagementController,
  createCampusVendorController,
  updateCampusVendorController,
  reviewStudentKitchenController,
  addCampusVendorManagerController,
  removeCampusVendorManagerController,
  listUsersController,
  updateUserController,
  revokeUserSessionsController,
  reviewUserKycController,
  readStudentKycDocumentController,
  mergeDuplicateAccountsController,
  readFinancialOversightController,
  recordFinancialActionController,
  readGigOversightController,
  updateGigOversightController,
  readScoreControlController,
  writeScoreConfigurationController,
  readSafetyMetricsController,
  readContentModerationController,
  moderateContentController,
  readSystemConfigurationController,
  readNavigationFeatureTagsController,
  writeSystemConfigurationController,
  readAcademicCatalogController,
  updateAcademicCampusController,
  updateAcademicCourseController,
  updateAcademicUnitController,
  readAnalyticsReportController,
  listAuditLogsController,
  listModerationCasesController,
  updateModerationCaseController
}
