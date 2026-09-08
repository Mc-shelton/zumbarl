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
    const [reports, bookings] = await Promise.all([
      prisma.wellnessReport.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.counselorBooking.findMany({ orderBy: { scheduledAt: 'asc' } })
    ])
    const urgencyOrder: Record<string, number> = { high: 0, normal: 1, low: 2 }
    reports.sort((left, right) => (urgencyOrder[left.urgency] ?? 1) - (urgencyOrder[right.urgency] ?? 1))
    return { wellness: pageEnvelope(reports, query), bookings: pageEnvelope(bookings, query), moderation: await moderation.list(query) }
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

  async updateTypedCase(type: string, id: string, patch: Record<string, any>) {
    if (type === 'wellness') {
      return prisma.$transaction(async (tx) => {
        const report = await tx.wellnessReport.findUnique({ where: { id } })
        if (!report) return null
        const updated = await tx.wellnessReport.update({
          where: { id },
          data: {
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.note !== undefined ? { note: patch.note } : {}),
            payload: jsonInput({ ...(report.payload && typeof report.payload === 'object' ? report.payload : {}), supportNote: patch.note })
          }
        })
        if (report.studentId) {
          const student = await tx.studentProfile.findUnique({ where: { id: report.studentId }, select: { userId: true } })
          if (student) await tx.notification.create({ data: { userId: student.userId, type: 'STUDENT_CARE_UPDATE', title: 'Your support request was updated', body: `Your request is now ${String(updated.status).replaceAll('_', ' ')}.`, data: jsonInput({ href: '/campus/wellbeing#human-help', supportCaseId: id }), sentVia: ['IN_APP'] } })
        }
        return updated
      })
    }
    if (type === 'booking') {
      return prisma.$transaction(async (tx) => {
        const booking = await tx.counselorBooking.findUnique({ where: { id } })
        if (!booking) return null
        const updated = await tx.counselorBooking.update({
          where: { id },
          data: {
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.counselorId !== undefined ? { counselorId: patch.counselorId || null } : {}),
            ...(patch.scheduledAt ? { scheduledAt: new Date(patch.scheduledAt) } : {}),
            payload: jsonInput({ ...(booking.payload && typeof booking.payload === 'object' ? booking.payload : {}), supportNote: patch.note })
          }
        })
        if (booking.studentId) {
          const student = await tx.studentProfile.findUnique({ where: { id: booking.studentId }, select: { userId: true } })
          if (student) await tx.notification.create({ data: { userId: student.userId, type: 'STUDENT_CARE_APPOINTMENT', title: 'Your counselor request was updated', body: `Your appointment is now ${String(updated.status).replaceAll('_', ' ')}.`, data: jsonInput({ href: '/campus/wellbeing#human-help', bookingId: id }), sentVia: ['IN_APP'] } })
        }
        return updated
      })
    }
    return moderation.updateById(id, patch)
  }
}

const supportCasesRepository = new SupportCasesRepository()

export {
  SupportCasesRepository,
  supportCasesRepository
}
