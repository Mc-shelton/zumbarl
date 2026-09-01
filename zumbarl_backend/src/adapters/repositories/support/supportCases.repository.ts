import type { Prisma } from '@prisma/client'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const moderation = createPrismaRecordRepository('moderationCases')

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

class SupportCasesRepository {
  createWellnessReport(payload: Record<string, any>) {
    return prisma.wellnessReport.create({
      data: {
        studentId: payload.studentId ?? null,
        category: payload.category,
        anonymous: Boolean(payload.anonymous),
        message: payload.message,
        urgency: payload.urgency ?? 'normal',
        status: payload.status ?? 'open',
        note: payload.note ?? null,
        payload: jsonInput(payload)
      }
    })
  }

  createCounselorBooking(payload: Record<string, any>) {
    return prisma.counselorBooking.create({
      data: {
        studentId: payload.studentId ?? null,
        counselorId: payload.counselorId ?? null,
        scheduledAt: new Date(payload.scheduledAt),
        reason: payload.reason ?? null,
        status: payload.status ?? 'requested',
        payload: jsonInput(payload)
      }
    })
  }

  async listCases(query: Record<string, unknown>) {
    const reports = await prisma.wellnessReport.findMany({ orderBy: { createdAt: 'desc' } })
    const urgencyOrder: Record<string, number> = { high: 0, normal: 1, low: 2 }
    reports.sort((left, right) => (urgencyOrder[left.urgency] ?? 1) - (urgencyOrder[right.urgency] ?? 1))
    return { wellness: pageEnvelope(reports, query), moderation: await moderation.list(query) }
  }

  async updateCase(id: string, patch: Record<string, any>) {
    const report = await prisma.wellnessReport.findUnique({ where: { id } })
    if (!report) return moderation.updateById(id, patch)
    return prisma.wellnessReport.update({
      where: { id },
      data: {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.note !== undefined ? { note: patch.note } : {}),
        payload: jsonInput({ ...(report.payload && typeof report.payload === 'object' ? report.payload : {}), ...patch })
      }
    })
  }
}

const supportCasesRepository = new SupportCasesRepository()

export {
  SupportCasesRepository,
  supportCasesRepository
}
