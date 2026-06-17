import { notFound } from '../../../lib/http.js'
import { sendSmsMessage } from '../../index.js'
import { supportCasesRepository } from '../../repositories/support/index.js'
async function createWellnessReportService(studentId: string | undefined, payload: Record<string, any>) { const report = await supportCasesRepository.createWellnessReport({ ...payload, studentId: payload.anonymous ? null : studentId, status: 'open' }); if (payload.urgency === 'high') await sendSmsMessage('+254700000000', 'High urgency Zumbarl support case opened'); return report }
const createCounselorBookingService = (studentId: string | undefined, payload: Record<string, any>) => supportCasesRepository.createCounselorBooking({ ...payload, studentId, status: 'requested' })
const listSupportCasesService = (query: Record<string, unknown>) => supportCasesRepository.listCases(query)
async function updateSupportCaseService(id: string, payload: Record<string, any>) { return await supportCasesRepository.updateCase(id, payload) ?? notFound('Support case') }

export {
  createWellnessReportService,
  createCounselorBookingService,
  listSupportCasesService,
  updateSupportCaseService
}
