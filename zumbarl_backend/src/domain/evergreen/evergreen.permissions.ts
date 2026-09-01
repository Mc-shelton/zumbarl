import type { FastifyReply, FastifyRequest } from 'fastify'
import { forbidden } from '../../lib/http.js'
import { requireAuth, type AuthUser, type Role } from '../../lib/security.js'

const evergreenCapabilities = [
  'EVERGREEN_PROGRAM_READ',
  'EVERGREEN_PROGRAM_MANAGE',
  'EVERGREEN_COHORT_MANAGE',
  'EVERGREEN_POOL_ACCESS',
  'EVERGREEN_CANDIDATE_REVIEW',
  'EVERGREEN_FORMAL_OFFER',
  'EVERGREEN_PLACEMENT_SUPERVISE',
  'EVERGREEN_STUDENT_DISCOVERY',
  'EVERGREEN_OPERATIONS_REVIEW',
  'EVERGREEN_OVERRIDE_MANAGE',
  'EVERGREEN_FINANCE_MANAGE',
  'EVERGREEN_JOB_REPLAY'
] as const

type EvergreenCapability = (typeof evergreenCapabilities)[number]

const roleCapabilities: Partial<Record<Role, readonly EvergreenCapability[]>> = {
  COMPANY_STANDARD: ['EVERGREEN_PROGRAM_READ'],
  COMPANY_PIPELINE_PARTNER: [
    'EVERGREEN_PROGRAM_READ',
    'EVERGREEN_PROGRAM_MANAGE',
    'EVERGREEN_COHORT_MANAGE',
    'EVERGREEN_POOL_ACCESS',
    'EVERGREEN_CANDIDATE_REVIEW',
    'EVERGREEN_FORMAL_OFFER',
    'EVERGREEN_PLACEMENT_SUPERVISE'
  ],
  COMPANY_HR_MANAGER: [
    'EVERGREEN_PROGRAM_READ',
    'EVERGREEN_PROGRAM_MANAGE',
    'EVERGREEN_COHORT_MANAGE',
    'EVERGREEN_POOL_ACCESS',
    'EVERGREEN_CANDIDATE_REVIEW',
    'EVERGREEN_FORMAL_OFFER',
    'EVERGREEN_PLACEMENT_SUPERVISE'
  ],
  COMPANY_HIRING_MANAGER: [
    'EVERGREEN_PROGRAM_READ',
    'EVERGREEN_CANDIDATE_REVIEW',
    'EVERGREEN_PLACEMENT_SUPERVISE'
  ],
  COMPANY_VIEWER: ['EVERGREEN_PROGRAM_READ'],
  STUDENT_TRANSITION: ['EVERGREEN_STUDENT_DISCOVERY'],
  STUDENT_ALUMNI: ['EVERGREEN_STUDENT_DISCOVERY'],
  OPERATIONS_MANAGER: [
    'EVERGREEN_OPERATIONS_REVIEW',
    'EVERGREEN_OVERRIDE_MANAGE',
    'EVERGREEN_JOB_REPLAY'
  ],
  FINANCE_OFFICER: ['EVERGREEN_FINANCE_MANAGE'],
  SUPER_ADMIN: evergreenCapabilities
}

function hasEvergreenCapability(role: Role | undefined, capability: EvergreenCapability) {
  return Boolean(role && roleCapabilities[role]?.includes(capability))
}

function requireEvergreenCapability(capability: EvergreenCapability) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    await requireAuth(request)
    if (!hasEvergreenCapability(request.authUser?.role, capability)) {
      forbidden(`Missing Evergreen capability: ${capability}`)
    }
  }
}

function assertCompanyIdentity(user: AuthUser | undefined): string {
  if (!user?.businessId) forbidden('A verified company membership is required')
  return user.businessId
}

function assertStudentIdentity(user: AuthUser | undefined): string {
  if (!user?.studentId) forbidden('A student profile is required')
  return user.studentId
}

export {
  evergreenCapabilities,
  roleCapabilities,
  hasEvergreenCapability,
  requireEvergreenCapability,
  assertCompanyIdentity,
  assertStudentIdentity,
  type EvergreenCapability
}
