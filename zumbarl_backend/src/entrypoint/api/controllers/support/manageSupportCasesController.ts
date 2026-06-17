import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { counselorBookingSchema, supportCaseStatusSchema, wellnessReportSchema } from '../../../validators/support/index.js'
import { createCounselorBookingService, createWellnessReportService, listSupportCasesService, updateSupportCaseService } from '../../../../adapters/services/support/index.js'
async function createWellnessReportController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createWellnessReportService(request.authUser?.studentId, requireBody(wellnessReportSchema, request))) }
async function createCounselorBookingController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createCounselorBookingService(request.authUser?.studentId, requireBody(counselorBookingSchema, request))) }
async function listSupportCasesController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listSupportCasesService(request.query as Record<string, unknown>)) }
async function updateSupportCaseController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateSupportCaseService(id, requireBody(supportCaseStatusSchema, request))) }

export {
  createWellnessReportController,
  createCounselorBookingController,
  listSupportCasesController,
  updateSupportCaseController
}
