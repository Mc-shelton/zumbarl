import { notFound } from '../../../lib/http.js'
import { supportCasesRepository } from '../../repositories/support/index.js'
async function createWellnessReportService(studentId: string | undefined, payload: Record<string, any>) {
  // A high-urgency report is prioritised in the support queue, but must never
  // pretend that an external person or emergency service has been contacted.
  return supportCasesRepository.createWellnessReport({
    ...payload,
    studentId: payload.anonymous ? null : studentId,
    status: 'open'
  })
}
const createCounselorBookingService = (studentId: string | undefined, payload: Record<string, any>) => supportCasesRepository.createCounselorBooking({ ...payload, studentId, status: 'requested' })
const listSupportCasesService = (query: Record<string, unknown>) => supportCasesRepository.listCases(query)
async function updateSupportCaseService(id: string, payload: Record<string, any>) { return await supportCasesRepository.updateCase(id, payload) ?? notFound('Support case') }

export {
  createWellnessReportService,
  createCounselorBookingService,
  listSupportCasesService,
  updateSupportCaseService
}
