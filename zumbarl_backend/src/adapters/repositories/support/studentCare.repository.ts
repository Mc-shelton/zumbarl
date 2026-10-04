import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

class StudentCareRepository {
  listPrograms(studentId: string, campusId: string) {
    return prisma.studentCareProgram.findMany({
      where: { status: 'active', OR: [{ campusId }, { campusId: null }] },
      orderBy: [{ startsAt: 'asc' }, { name: 'asc' }],
      include: {
        enrollments: {
          where: { studentId },
          take: 1,
          include: { progress: { where: { studentVisible: true }, orderBy: { occurredAt: 'desc' }, take: 8 } }
        }
      }
    })
  }

  findProgram(id: string, campusId?: string) {
    return prisma.studentCareProgram.findFirst({
      where: { id, status: 'active', ...(campusId ? { OR: [{ campusId }, { campusId: null }] } : {}) }
    })
  }

  findEnrollmentForStudent(id: string, studentId: string) {
    return prisma.studentCareProgramEnrollment.findFirst({
      where: { id, studentId },
      include: { program: true, progress: { where: { studentVisible: true }, orderBy: { occurredAt: 'desc' }, take: 20 } }
    })
  }

  async createEnrollment(program: { id: string, name: string, category: string }, studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const supportCase = await tx.wellnessReport.create({
        data: {
          studentId,
          category: 'program-request',
          anonymous: false,
          message: `Care program request: ${program.name}. Student goal: ${payload.goal}`,
          urgency: payload.urgency || 'normal',
          status: 'open',
          payload: jsonInput({ source: 'care_program_enrollment', programId: program.id, programCategory: program.category })
        }
      })
      return tx.studentCareProgramEnrollment.create({
        data: {
          programId: program.id,
          studentId,
          supportCaseId: supportCase.id,
          goal: payload.goal,
          privacyMode: payload.privacyMode || 'private',
          consentedAt: new Date(),
          nextCheckInAt: payload.nextCheckInAt ? new Date(payload.nextCheckInAt) : null,
          payload: jsonInput({ consentVersion: 'student-care-v1', consentText: payload.consentText })
        },
        include: { program: true, progress: true }
      })
    })
  }

  async addStudentProgress(enrollment: { id: string, currentStep: number, supportCaseId: string | null, program: { steps: string[] } }, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const progress = await tx.studentCareProgress.create({
        data: {
          enrollmentId: enrollment.id,
          kind: 'student_check_in',
          status: payload.status,
          note: payload.note || null,
          studentVisible: true,
          payload: jsonInput({ requestFollowUp: Boolean(payload.requestFollowUp) })
        }
      })
      const updated = await tx.studentCareProgramEnrollment.update({
        where: { id: enrollment.id },
        data: {
          lastCheckInAt: new Date(),
          currentStep: payload.status === 'completed_step' ? Math.min(enrollment.currentStep + 1, enrollment.program.steps.length) : enrollment.currentStep,
          ...(payload.requestFollowUp ? { status: 'active' } : {})
        },
        include: { program: true, progress: { where: { studentVisible: true }, orderBy: { occurredAt: 'desc' }, take: 20 } }
      })
      if (payload.requestFollowUp) {
        if (enrollment.supportCaseId) {
          await tx.wellnessReport.update({
            where: { id: enrollment.supportCaseId },
            data: { status: 'open', urgency: payload.status === 'setback' ? 'high' : 'normal', updatedAt: new Date() }
          })
        } else {
          await tx.wellnessReport.create({
            data: {
              studentId: updated.studentId,
              category: 'program-request',
              anonymous: false,
              message: `Student requested a follow-up from ${updated.program.name}.`,
              urgency: payload.status === 'setback' ? 'high' : 'normal',
              status: 'open',
              payload: jsonInput({ source: 'care_program_check_in', enrollmentId: enrollment.id })
            }
          })
        }
      }
      return { progress, enrollment: updated }
    })
  }

  async updateEnrollmentForStudent(id: string, studentId: string, status: 'active' | 'paused' | 'withdrawn') {
    return prisma.$transaction(async (tx) => {
      const current = await tx.studentCareProgramEnrollment.findFirst({ where: { id, studentId } })
      if (!current) return null
      await tx.studentCareProgress.create({
        data: {
          enrollmentId: id,
          kind: 'student_plan_update',
          status,
          note: status === 'paused' ? 'Plan paused by student.' : status === 'active' ? 'Plan resumed by student.' : 'Student withdrew from this plan.',
          studentVisible: true,
          payload: jsonInput({ previousStatus: current.status })
        }
      })
      const updated = await tx.studentCareProgramEnrollment.update({
        where: { id },
        data: {
          status,
          ...(status === 'active' && !current.startedAt ? { startedAt: new Date() } : {}),
          ...(status === 'withdrawn' ? { completedAt: new Date() } : {})
        },
        include: { program: true, progress: { where: { studentVisible: true }, orderBy: { occurredAt: 'desc' }, take: 20 } }
      })
      if (current.supportCaseId && status === 'withdrawn') {
        await tx.wellnessReport.updateMany({ where: { id: current.supportCaseId }, data: { status: 'resolved', updatedAt: new Date() } })
      }
      return updated
    })
  }

  async readOperations() {
    const [reports, bookings, enrollments, programs, pendingCircles] = await Promise.all([
      prisma.wellnessReport.findMany({ orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }], take: 100 }),
      prisma.counselorBooking.findMany({ orderBy: { scheduledAt: 'asc' }, take: 100 }),
      prisma.studentCareProgramEnrollment.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          program: true,
          student: { select: { id: true, firstName: true, lastName: true, campus: { select: { name: true } } } },
          progress: { orderBy: { occurredAt: 'desc' }, take: 5 }
        }
      }),
      prisma.studentCareProgram.findMany({ orderBy: { name: 'asc' } }),
      prisma.communityGroup.findMany({ where: { category: 'support-circle', status: 'pending-review' }, orderBy: { createdAt: 'asc' }, take: 100 })
    ])
    return {
      summary: {
        openReports: reports.filter((item) => ['open', 'in_review'].includes(item.status)).length,
        requestedBookings: bookings.filter((item) => item.status === 'requested').length,
        activeEnrollments: enrollments.filter((item) => ['requested', 'active', 'paused'].includes(item.status)).length,
        followUpsNeeded: enrollments.filter((item) => item.progress[0]?.payload && typeof item.progress[0].payload === 'object' && !Array.isArray(item.progress[0].payload) && (item.progress[0].payload as Record<string, unknown>).requestFollowUp === true).length,
        pendingCircles: pendingCircles.length
      },
      reports,
      bookings,
      enrollments,
      programs,
      pendingCircles
    }
  }

  async reviewSupportCircle(id: string, actorUserId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const circle = await tx.communityGroup.findFirst({ where: { id, category: 'support-circle', status: 'pending-review' } })
      if (!circle) return null
      const existingPayload = circle.payload && typeof circle.payload === 'object' && !Array.isArray(circle.payload) ? circle.payload as Record<string, unknown> : {}
      const updated = await tx.communityGroup.update({
        where: { id },
        data: { status: payload.status, payload: jsonInput({ ...existingPayload, moderationOwner: payload.moderationOwner, reviewNote: payload.note, reviewedByUserId: actorUserId, reviewedAt: new Date().toISOString() }) }
      })
      if (circle.ownerStudentId) {
        const owner = await tx.studentProfile.findUnique({ where: { id: circle.ownerStudentId }, select: { userId: true } })
        if (owner) await tx.notification.create({ data: { userId: owner.userId, type: 'SUPPORT_CIRCLE_REVIEW', title: payload.status === 'active' ? 'Your support circle was approved' : 'Your support circle needs a different next step', body: payload.note, data: jsonInput({ href: payload.status === 'active' ? `/campus/wellbeing/circles/${id}` : '/campus/wellbeing', circleId: id }), sentVia: ['IN_APP'] } })
      }
      return updated
    })
  }

  async updateEnrollment(id: string, actorUserId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.studentCareProgramEnrollment.findUnique({ where: { id }, include: { student: { select: { userId: true } } } })
      if (!current) return null
      const updated = await tx.studentCareProgramEnrollment.update({
        where: { id },
        data: {
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.currentStep !== undefined ? { currentStep: payload.currentStep } : {}),
          ...(payload.assignedToUserId !== undefined ? { assignedToUserId: payload.assignedToUserId || null } : {}),
          ...(payload.nextCheckInAt !== undefined ? { nextCheckInAt: payload.nextCheckInAt ? new Date(payload.nextCheckInAt) : null } : {}),
          ...(payload.studentVisibleNote !== undefined ? { studentVisibleNote: payload.studentVisibleNote || null } : {}),
          ...(payload.status === 'active' && !current.startedAt ? { startedAt: new Date() } : {}),
          ...(payload.status === 'completed' ? { completedAt: new Date() } : {})
        },
        include: { program: true, student: { select: { id: true, firstName: true, lastName: true } } }
      })
      await tx.studentCareProgress.create({
        data: {
          enrollmentId: id,
          recordedByUserId: actorUserId,
          kind: 'support_update',
          status: payload.status || current.status,
          note: payload.studentVisibleNote || null,
          studentVisible: payload.studentVisible !== false,
          payload: jsonInput({ previousStatus: current.status, currentStep: updated.currentStep })
        }
      })
      if (payload.studentVisible !== false) {
        await tx.notification.create({ data: { userId: current.student.userId, type: 'STUDENT_CARE_UPDATE', title: 'Your care pathway was updated', body: `Your care pathway is now ${String(updated.status).replaceAll('_', ' ')}. Open Wellbeing to see the private update.`, data: jsonInput({ href: '/campus/wellbeing#care-pathways', enrollmentId: id }), sentVia: ['IN_APP'] } })
      }
      if (current.supportCaseId && payload.status === 'active') {
        await tx.wellnessReport.updateMany({ where: { id: current.supportCaseId }, data: { status: 'in_review' } })
      }
      if (current.supportCaseId && payload.status === 'completed') {
        await tx.wellnessReport.updateMany({ where: { id: current.supportCaseId }, data: { status: 'resolved' } })
      }
      return updated
    })
  }
}

const studentCareRepository = new StudentCareRepository()

export { StudentCareRepository, studentCareRepository }
