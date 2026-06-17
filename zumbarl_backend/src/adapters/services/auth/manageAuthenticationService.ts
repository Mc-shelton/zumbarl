import type { FastifyInstance } from 'fastify'
import { forbidden } from '../../../lib/http.js'
import { hashPassword, verifyPassword, type AuthUser } from '../../../lib/security.js'
import {
  createSessionRecord,
  createUserRecord,
  createUserWithBusinessProfile,
  createUserWithStudentProfile,
  findBusinessProfileById,
  findStudentProfileById,
  findUserByEmail,
  findUserById
} from '../../repositories/auth/index.js'

function removePasswordHash(user: Record<string, any>) {
  const safeUser = { ...user }
  delete safeUser.passwordHash
  return safeUser
}

function toTokenPayload(user: Record<string, any>): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    studentId: user.studentId
  }
}

async function registerUserService(app: FastifyInstance, payload: Record<string, any>) {
  if (await findUserByEmail(payload.email)) {
    forbidden('Email is already registered')
  }

  const userPayload = {
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    name: payload.name,
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    status: 'active'
  }

  if (String(payload.role).startsWith('STUDENT') || payload.role === 'student') {
    const { user } = await createUserWithStudentProfile(userPayload, payload.campus)
    const token = app.jwt.sign(toTokenPayload(user))
    await createSessionRecord({ userId: user.id })
    return { user: removePasswordHash(user), token }
  }

  if (String(payload.role).startsWith('COMPANY') || payload.role === 'business') {
    const { user } = await createUserWithBusinessProfile(userPayload, payload.businessName ?? payload.name)
    const token = app.jwt.sign(toTokenPayload(user))
    await createSessionRecord({ userId: user.id })
    return { user: removePasswordHash(user), token }
  }

  const user = await createUserRecord(userPayload)

  const token = app.jwt.sign(toTokenPayload(user))
  await createSessionRecord({ userId: user.id })
  return { user: removePasswordHash(user), token }
}

async function loginUserService(app: FastifyInstance, payload: Record<string, any>) {
  const user = await findUserByEmail(payload.email)
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    forbidden('Invalid email or password')
  }

  const token = app.jwt.sign(toTokenPayload(user))
  await createSessionRecord({ userId: user.id })
  return { user: removePasswordHash(user), token }
}

async function readAuthenticatedUserService(userId?: string) {
  const user = userId ? await findUserById(userId) : null
  return {
    user: user ? removePasswordHash(user) : null,
    student: await findStudentProfileById(user?.studentId),
    business: await findBusinessProfileById(user?.businessId)
  }
}

export {
  registerUserService,
  loginUserService,
  readAuthenticatedUserService
}
