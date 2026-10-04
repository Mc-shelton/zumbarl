import { ApiError, notFound } from '../../../lib/http.js'
import { studentCareRepository, wellbeingRepository } from '../../repositories/support/index.js'

function requireStudentId(studentId?: string) {
  if (!studentId) throw new ApiError(403, 'A student profile is required for Student Care', 'STUDENT_PROFILE_REQUIRED')
  return studentId
}

async function listStudentCareProgramsService(studentId?: string) {
  const id = requireStudentId(studentId)
  const student = await wellbeingRepository.findStudent(id)
  if (!student) notFound('Student profile')
  return { data: await studentCareRepository.listPrograms(id, student.campusId) }
}

async function enrollInStudentCareProgramService(studentId: string | undefined, programId: string, payload: Record<string, any>) {
  const id = requireStudentId(studentId)
  const student = await wellbeingRepository.findStudent(id)
  if (!student) notFound('Student profile')
  const program = await studentCareRepository.findProgram(programId, student.campusId)
  if (!program) notFound('Student care program')
  const existing = (await studentCareRepository.listPrograms(id, student.campusId))
    .flatMap((item) => item.enrollments)
    .find((item) => item.programId === programId)
  if (existing && !['withdrawn', 'completed'].includes(existing.status)) {
    throw new ApiError(409, 'You already have an active request for this program', 'CARE_PROGRAM_ALREADY_JOINED')
  }
  if (existing) throw new ApiError(409, 'Contact Student Affairs to restart this completed or withdrawn program', 'CARE_PROGRAM_RESTART_REQUIRES_SUPPORT')
  return studentCareRepository.createEnrollment(program, id, payload)
}

async function recordStudentCareCheckInService(studentId: string | undefined, enrollmentId: string, payload: Record<string, any>) {
  const enrollment = await studentCareRepository.findEnrollmentForStudent(enrollmentId, requireStudentId(studentId))
  if (!enrollment) notFound('Care program enrollment')
  if (!['requested', 'active', 'paused'].includes(enrollment.status)) {
    throw new ApiError(409, 'This care pathway is no longer accepting check-ins', 'CARE_PROGRAM_NOT_ACTIVE')
  }
  return studentCareRepository.addStudentProgress(enrollment, payload)
}

async function updateOwnStudentCareEnrollmentService(studentId: string | undefined, enrollmentId: string, payload: { status: 'active' | 'paused' | 'withdrawn' }) {
  const id = requireStudentId(studentId)
  const enrollment = await studentCareRepository.findEnrollmentForStudent(enrollmentId, id)
  if (!enrollment) notFound('Care program enrollment')
  const allowedTransitions: Record<string, string[]> = {
    requested: ['withdrawn'],
    active: ['paused', 'withdrawn'],
    paused: ['active', 'withdrawn']
  }
  if (!allowedTransitions[enrollment.status]?.includes(payload.status)) {
    throw new ApiError(409, 'That change is not available for this care pathway', 'CARE_PROGRAM_STATUS_CHANGE_NOT_ALLOWED')
  }
  return await studentCareRepository.updateEnrollmentForStudent(enrollmentId, id, payload.status) ?? notFound('Care program enrollment')
}

const readStudentCareOperationsService = () => studentCareRepository.readOperations()

async function updateStudentCareEnrollmentService(id: string, actorUserId: string | undefined, payload: Record<string, any>) {
  if (!actorUserId) throw new ApiError(403, 'A support staff identity is required', 'SUPPORT_IDENTITY_REQUIRED')
  return await studentCareRepository.updateEnrollment(id, actorUserId, payload) ?? notFound('Care program enrollment')
}

async function reviewStudentCareCircleService(id: string, actorUserId: string | undefined, payload: Record<string, any>) {
  if (!actorUserId) throw new ApiError(403, 'A support staff identity is required', 'SUPPORT_IDENTITY_REQUIRED')
  return await studentCareRepository.reviewSupportCircle(id, actorUserId, payload) ?? notFound('Pending support circle')
}

export {
  enrollInStudentCareProgramService,
  listStudentCareProgramsService,
  readStudentCareOperationsService,
  recordStudentCareCheckInService,
  updateOwnStudentCareEnrollmentService,
  reviewStudentCareCircleService,
  updateStudentCareEnrollmentService
}
