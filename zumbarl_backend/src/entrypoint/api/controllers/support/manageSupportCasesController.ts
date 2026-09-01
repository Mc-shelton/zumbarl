import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { counselorBookingSchema, supportCaseStatusSchema, wellbeingCheckInSchema, wellbeingConversationSchema, wellbeingMessageSchema, wellbeingPreferenceSchema, wellbeingResetSchema, wellnessReportSchema } from '../../../validators/support/index.js'
import { completeWellbeingResetService, createCounselorBookingService, createWellbeingCheckInService, createWellbeingConversationMessageService, createWellbeingConversationService, createWellnessReportService, listSupportCasesService, readWellbeingConversationService, readWellbeingDashboardService, updateSupportCaseService, updateWellbeingPreferenceService } from '../../../../adapters/services/support/index.js'
async function createWellnessReportController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createWellnessReportService(request.authUser?.studentId, requireBody(wellnessReportSchema, request))) }
async function createCounselorBookingController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createCounselorBookingService(request.authUser?.studentId, requireBody(counselorBookingSchema, request))) }
async function listSupportCasesController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listSupportCasesService(request.query as Record<string, unknown>)) }
async function updateSupportCaseController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateSupportCaseService(id, requireBody(supportCaseStatusSchema, request))) }
async function readWellbeingDashboardController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readWellbeingDashboardService(request.authUser?.studentId)) }
async function createWellbeingCheckInController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createWellbeingCheckInService(request.authUser?.studentId, requireBody(wellbeingCheckInSchema, request))) }
async function updateWellbeingPreferenceController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await updateWellbeingPreferenceService(request.authUser?.studentId, requireBody(wellbeingPreferenceSchema, request))) }
async function completeWellbeingResetController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await completeWellbeingResetService(request.authUser?.studentId, requireBody(wellbeingResetSchema, request))) }
async function createWellbeingConversationController(request: FastifyRequest, reply: FastifyReply) { requireBody(wellbeingConversationSchema, request); return reply.code(201).send(await createWellbeingConversationService(request.authUser?.studentId)) }
async function readWellbeingConversationController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readWellbeingConversationService(request.authUser?.studentId, id)) }
async function createWellbeingConversationMessageController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await createWellbeingConversationMessageService(request.authUser?.studentId, id, requireBody(wellbeingMessageSchema, request))) }

export {
  createWellnessReportController,
  createCounselorBookingController,
  completeWellbeingResetController,
  createWellbeingCheckInController,
  createWellbeingConversationController,
  createWellbeingConversationMessageController,
  listSupportCasesController,
  readWellbeingConversationController,
  readWellbeingDashboardController,
  updateWellbeingPreferenceController,
  updateSupportCaseController
}
