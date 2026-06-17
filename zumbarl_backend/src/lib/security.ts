import bcrypt from 'bcryptjs'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { forbidden } from './http.js'

const roles = [
  'student',
  'business',
  'admin',
  'moderator',
  'support',
  'STUDENT_STANDARD',
  'STUDENT_TRANSITION',
  'STUDENT_ALUMNI',
  'CAMPUS_AMBASSADOR',
  'COMPANY_STANDARD',
  'COMPANY_PIPELINE_PARTNER',
  'COMPANY_HR_MANAGER',
  'COMPANY_HIRING_MANAGER',
  'COMPANY_VIEWER',
  'SAFETY_OFFICER',
  'OPERATIONS_MANAGER',
  'CAMPUS_MANAGER',
  'FINANCE_OFFICER',
  'CONTENT_MODERATOR',
  'SUPER_ADMIN'
] as const
type Role = (typeof roles)[number]

type AuthUser = {
  id: string
  email: string
  role: Role
  businessId?: string
  studentId?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

function hasAnyRole(user: AuthUser | undefined, allowed: Role[]) {
  return Boolean(user && allowed.includes(user.role))
}

async function requireAuth(request: FastifyRequest) {
  try {
    const decoded = await request.jwtVerify<AuthUser>()
    request.authUser = decoded
  } catch {
    forbidden('Authentication is required')
  }
}

function requireRoles(...allowed: Role[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    await requireAuth(request)
    if (!hasAnyRole(request.authUser, allowed)) {
      forbidden(`Requires one of: ${allowed.join(', ')}`)
    }
  }
}

const roleGroups = {
  admin: ['admin', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'] as Role[],
  business: ['business', 'COMPANY_STANDARD', 'COMPANY_PIPELINE_PARTNER', 'COMPANY_HR_MANAGER', 'COMPANY_HIRING_MANAGER'] as Role[],
  finance: ['admin', 'SUPER_ADMIN', 'FINANCE_OFFICER'] as Role[],
  moderator: ['admin', 'moderator', 'SUPER_ADMIN', 'CONTENT_MODERATOR'] as Role[],
  student: ['student', 'STUDENT_STANDARD', 'STUDENT_TRANSITION', 'STUDENT_ALUMNI', 'CAMPUS_AMBASSADOR'] as Role[],
  support: ['support', 'admin', 'SAFETY_OFFICER', 'SUPER_ADMIN'] as Role[]
}

export {
  roles,
  hashPassword,
  verifyPassword,
  hasAnyRole,
  requireAuth,
  requireRoles,
  roleGroups,
  type Role,
  type AuthUser
}
