import type { FastifyInstance } from 'fastify'
import { forbidden } from '../../../lib/http.js'
import { hashPassword, verifyPassword, type AuthUser } from '../../../lib/security.js'
import {
  createSessionRecord,
  createUserRecord,
  createUserWithStudentProfile,
  findBusinessProfileById,
  findStudentProfileById,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  listActiveCampuses
} from '../../repositories/auth/index.js'
import { env } from '../../../config/env.js'

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
  if (await findUserByUsername(payload.username)) {
    forbidden('Username is already taken')
  }

  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const name = String(payload.name || `${firstName} ${lastName}`).trim()
  const username = String(payload.username || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()

  const userPayload = {
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    firstName,
    lastName,
    username,
    name,
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    status: 'active'
  }

  if (String(payload.role).startsWith('STUDENT') || payload.role === 'student') {
    if (!payload.campus) forbidden('Select an existing campus or provide the new campus details')
    const { user } = await createUserWithStudentProfile(userPayload, payload.campus)
    const token = app.jwt.sign(toTokenPayload(user))
    await createSessionRecord({ userId: user.id })
    return { user: removePasswordHash(user), token }
  }

  if (String(payload.role).startsWith('COMPANY') || payload.role === 'business') {
    const user = await createUserRecord(userPayload)
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

async function listRegistrationCampusesService(query: string) {
  return { campuses: await listActiveCampuses(query) }
}

async function searchRegistrationLocationsService(query: string) {
  const url = new URL('/api/', env.GEOCODING_BASE_URL)
  url.searchParams.set('q', `${query}, Kenya`)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')
  const response = await fetch(url, { headers: { 'User-Agent': 'Zumbarl/1.0 registration-location-search' }, signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`Location search returned ${response.status}`)
  const data = await response.json() as { features?: Array<Record<string, any>> }
  return { results: (data.features || []).filter((feature) => feature.properties?.countrycode === 'KE').map((feature) => {
    const properties = feature.properties || {}
    const parts = [properties.name, properties.street, properties.locality, properties.city, properties.county, properties.state, properties.country].filter(Boolean)
    return { id: `${properties.osm_type || 'place'}-${properties.osm_id || feature.geometry?.coordinates?.join('-')}`, label: [...new Set(parts)].join(', '), city: properties.city || properties.locality || properties.county || '', latitude: Number(feature.geometry?.coordinates?.[1]), longitude: Number(feature.geometry?.coordinates?.[0]) }
  }).filter((result) => result.label && Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) }
}

export {
  registerUserService,
  loginUserService,
  readAuthenticatedUserService,
  listRegistrationCampusesService,
  searchRegistrationLocationsService
}
