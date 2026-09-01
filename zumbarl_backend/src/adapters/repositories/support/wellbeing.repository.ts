import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

class WellbeingRepository {
  findStudent(studentId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        campusId: true,
        campus: { select: { id: true, name: true } }
      }
    })
  }

  findPreference(studentId: string) {
    return prisma.wellbeingPreference.findUnique({ where: { studentId } })
  }

  upsertPreference(studentId: string, payload: Record<string, any>) {
    return prisma.wellbeingPreference.upsert({
      where: { studentId },
      update: {
        ...(payload.insightsEnabled !== undefined ? { insightsEnabled: Boolean(payload.insightsEnabled) } : {}),
        ...(payload.reminderEnabled !== undefined ? { reminderEnabled: Boolean(payload.reminderEnabled) } : {}),
        ...(payload.reminderTime !== undefined ? { reminderTime: payload.reminderTime || null } : {})
      },
      create: {
        studentId,
        insightsEnabled: payload.insightsEnabled ?? true,
        reminderEnabled: payload.reminderEnabled ?? false,
        reminderTime: payload.reminderTime || null
      }
    })
  }

  createCheckIn(studentId: string, payload: Record<string, any>) {
    return prisma.wellbeingCheckIn.create({
      data: {
        studentId,
        mood: payload.mood,
        stressors: payload.stressors || [],
        sleep: payload.sleep || null,
        note: payload.note || null,
        source: payload.source || 'daily'
      }
    })
  }

  listCheckIns(studentId: string, since: Date) {
    return prisma.wellbeingCheckIn.findMany({
      where: { studentId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 60
    })
  }

  createResetSession(studentId: string, payload: Record<string, any>) {
    return prisma.wellbeingResetSession.create({
      data: {
        studentId,
        breathingSeconds: payload.breathingSeconds || 0,
        groundingCount: payload.groundingCount || 0,
        focus: payload.focus || null,
        durationSeconds: payload.durationSeconds || 0,
        status: 'completed',
        completedAt: new Date()
      }
    })
  }

  listResetSessions(studentId: string, since: Date) {
    return prisma.wellbeingResetSession.findMany({
      where: { studentId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  }

  createConversation(studentId: string, payload: Record<string, any>) {
    return prisma.wellbeingConversation.create({
      data: { studentId, title: payload.title || null },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    })
  }

  listConversations(studentId: string) {
    return prisma.wellbeingConversation.findMany({
      where: { studentId, status: { not: 'deleted' } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })
  }

  findConversation(conversationId: string, studentId: string) {
    return prisma.wellbeingConversation.findFirst({
      where: { id: conversationId, studentId, status: { not: 'deleted' } },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 80 } }
    })
  }

  async addConversationTurn(conversationId: string, payload: {
    userBody: string
    assistantBody: string
    riskLevel: string
    actions: unknown
    title?: string | null
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.wellbeingMessage.create({
        data: { conversationId, role: 'user', body: payload.userBody, riskLevel: payload.riskLevel }
      })
      const assistant = await tx.wellbeingMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          body: payload.assistantBody,
          riskLevel: payload.riskLevel,
          actions: jsonInput(payload.actions)
        }
      })
      await tx.wellbeingConversation.update({
        where: { id: conversationId },
        data: {
          riskLevel: payload.riskLevel,
          ...(payload.title ? { title: payload.title } : {}),
          updatedAt: new Date()
        }
      })
      return assistant
    })
  }

  listSupportResources(campusId: string) {
    return prisma.campusWellbeingResource.findMany({
      where: { status: 'active', OR: [{ campusId }, { campusId: null }] },
      orderBy: [{ isEmergency: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })
  }

  async listOwnSupportActivity(studentId: string) {
    const [reports, bookings] = await Promise.all([
      prisma.wellnessReport.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, category: true, urgency: true, status: true, createdAt: true, updatedAt: true }
      }),
      prisma.counselorBooking.findMany({
        where: { studentId },
        orderBy: { scheduledAt: 'desc' },
        take: 8,
        select: { id: true, scheduledAt: true, status: true, createdAt: true, updatedAt: true }
      })
    ])
    return { reports, bookings }
  }
}

const wellbeingRepository = new WellbeingRepository()

export {
  WellbeingRepository,
  wellbeingRepository,
}
