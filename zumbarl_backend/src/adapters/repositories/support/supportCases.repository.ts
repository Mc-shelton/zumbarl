import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const reports = createPrismaRecordRepository('wellnessReports')
const bookings = createPrismaRecordRepository('counselorBookings')
const moderation = createPrismaRecordRepository('moderationCases')

class SupportCasesRepository {
  createWellnessReport(payload: Record<string, any>) {
    return reports.create(payload)
  }

  createCounselorBooking(payload: Record<string, any>) {
    return bookings.create(payload)
  }

  async listCases(query: Record<string, unknown>) {
    return { wellness: await reports.list(query), moderation: await moderation.list(query) }
  }

  async updateCase(id: string, patch: Record<string, any>) {
    return await reports.updateById(id, patch) ?? await moderation.updateById(id, patch)
  }
}

const supportCasesRepository = new SupportCasesRepository()

export {
  SupportCasesRepository,
  supportCasesRepository
}
