import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import type { FastifyInstance } from 'fastify'
import { ApiError, forbidden } from '../../../lib/http.js'
import { hashPassword, verifyPassword, type AuthUser } from '../../../lib/security.js'
import { deleteCache, getRedisClient, readCache, writeCache } from '../../cache/redis/index.js'
import { sendTransactionalEmail } from '../../notification/email/email.adapter.js'
import {
  createSessionRecord,
  revokeSessionRecord,
  createUserRecord,
  createUserWithBusinessProfile,
  createUserWithStudentProfile,
  findBusinessProfileById,
  findStudentProfileById,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  listActiveCampuses
  ,listCourses
} from '../../repositories/auth/index.js'
import { env } from '../../../config/env.js'
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../../../shared/legal/policies.js'

const EMAIL_OTP_TTL_SECONDS = 10 * 60
const EMAIL_OTP_COOLDOWN_SECONDS = 60
const EMAIL_OTP_MAX_ATTEMPTS = 5

type EmailOtpPurpose = 'login' | 'register'

type EmailOtpRequestPurpose = 'access' | EmailOtpPurpose

type EmailOtpChallenge = {
  email: string
  purpose: EmailOtpPurpose
  codeHash: string
  attempts: number
  eligible: boolean
}

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

async function issueSessionToken(app: FastifyInstance, user: Record<string, any>) {
  const expiresAt = new Date(Date.now() + env.AUTH_SESSION_TTL_SECONDS * 1000)
  const session = await createSessionRecord({ userId: user.id, expiresAt })
  return app.jwt.sign(
    { ...toTokenPayload(user), sessionId: session.id },
    { expiresIn: env.AUTH_SESSION_TTL_SECONDS }
  )
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

  let emailVerified = false
  if (payload.registrationToken) {
    let tokenPayload: Record<string, any>
    try {
      tokenPayload = app.jwt.verify<Record<string, any>>(payload.registrationToken)
    } catch {
      forbidden('Your verified email session has expired. Request a new code.')
    }
    if (tokenPayload.kind !== 'registration_email_verification' || tokenPayload.email !== payload.email.toLowerCase()) {
      forbidden('Verify this email address before creating your account')
    }
    emailVerified = true
  }

  const userPayload = {
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    firstName,
    lastName,
    username,
    name,
    passwordHash: await hashPassword(payload.password || randomBytes(32).toString('base64url')),
    role: payload.role,
    status: 'active',
    emailVerified,
    termsAcceptedAt: new Date(),
    termsVersion: CURRENT_TERMS_VERSION,
    privacyAcceptedAt: new Date(),
    privacyVersion: CURRENT_PRIVACY_VERSION,
    yearJoined: payload.yearJoined
  }

  if (String(payload.role).startsWith('STUDENT') || payload.role === 'student') {
    if (!payload.campus) forbidden('Select an existing campus or provide the new campus details')
    const { user } = await createUserWithStudentProfile(userPayload, payload.campus, payload.course)
    const token = await issueSessionToken(app, user)
    return { user: removePasswordHash(user), token }
  }

  if (String(payload.role).startsWith('COMPANY') || payload.role === 'business') {
    const { user } = await createUserWithBusinessProfile(userPayload, payload.businessName)
    const token = await issueSessionToken(app, user)
    return { user: removePasswordHash(user), token }
  }

  const user = await createUserRecord(userPayload)

  const token = await issueSessionToken(app, user)
  return { user: removePasswordHash(user), token }
}

function emailOtpKey(challengeId: string) {
  return `auth:email-otp:${challengeId}`
}

function emailOtpCooldownKey(email: string) {
  const emailHash = createHash('sha256').update(email).digest('hex')
  return `auth:email-otp:cooldown:access:${emailHash}`
}

function hashEmailOtp(challengeId: string, code: string) {
  return createHmac('sha256', env.JWT_SECRET).update(`${challengeId}:${code}`).digest('hex')
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')
  const visible = localPart.slice(0, Math.min(2, localPart.length))
  return `${visible}${'*'.repeat(Math.max(2, localPart.length - visible.length))}@${domain}`
}

function canReceiveLoginOtp(user: Record<string, any> | null): user is Record<string, any> {
  return Boolean(user && user.status !== 'inactive')
}

async function requestEmailOtpService(payload: { email: string, purpose?: EmailOtpRequestPurpose }) {
  const email = payload.email.toLowerCase()
  const cooldownKey = emailOtpCooldownKey(email)
  const acquired = await getRedisClient().set(cooldownKey, '1', 'EX', EMAIL_OTP_COOLDOWN_SECONDS, 'NX')
  if (!acquired) {
    throw new ApiError(429, 'Please wait a moment before requesting another code', 'OTP_RATE_LIMITED')
  }

  const user = await findUserByEmail(email)
  // The server owns the login-versus-registration decision. The optional
  // request purpose is accepted only so cached clients can migrate safely.
  const purpose: EmailOtpPurpose = user ? 'login' : 'register'
  // Keep the response shape identical for new, active, and inactive addresses
  // so this public endpoint cannot be used to enumerate registered accounts.
  const eligible = purpose === 'register' || canReceiveLoginOtp(user)
  const challengeId = randomUUID()
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const challenge: EmailOtpChallenge = {
    email,
    purpose,
    codeHash: hashEmailOtp(challengeId, code),
    attempts: 0,
    eligible
  }
  await writeCache(emailOtpKey(challengeId), challenge, EMAIL_OTP_TTL_SECONDS)

  if (eligible) {
    const action = purpose === 'login' ? 'sign in to' : 'finish joining'
    const delivery = await sendTransactionalEmail(
      email,
      `${code} is your Zumbarl code`,
      `<div style="font-family:Arial,sans-serif;color:#252333;line-height:1.6"><h2 style="margin:0 0 12px">Your Zumbarl code</h2><p>Use this code to ${action} Zumbarl:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`
    )
    if (delivery.status === 'failed') {
      await Promise.all([deleteCache(emailOtpKey(challengeId)), deleteCache(cooldownKey)])
      throw new ApiError(503, 'We could not send your code. Please try again.', 'EMAIL_DELIVERY_FAILED')
    }
  }

  return {
    challengeId,
    deliveryHint: maskEmail(email),
    expiresInSeconds: EMAIL_OTP_TTL_SECONDS,
    retryAfterSeconds: EMAIL_OTP_COOLDOWN_SECONDS,
    ...(eligible && env.NODE_ENV !== 'production' ? { developmentCode: code } : {})
  }
}

async function verifyEmailOtpService(app: FastifyInstance, payload: { challengeId: string, code: string }) {
  const key = emailOtpKey(payload.challengeId)
  const challenge = await readCache<EmailOtpChallenge>(key)
  if (!challenge || challenge.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
    throw new ApiError(400, 'That code is invalid or has expired', 'INVALID_OTP')
  }

  const expected = Buffer.from(challenge.codeHash, 'hex')
  const received = Buffer.from(hashEmailOtp(payload.challengeId, payload.code), 'hex')
  const valid = challenge.eligible && expected.length === received.length && timingSafeEqual(expected, received)
  if (!valid) {
    const attempts = challenge.attempts + 1
    if (attempts >= EMAIL_OTP_MAX_ATTEMPTS) await deleteCache(key)
    else await writeCache(key, { ...challenge, attempts }, EMAIL_OTP_TTL_SECONDS)
    throw new ApiError(400, 'That code is invalid or has expired', 'INVALID_OTP')
  }

  await deleteCache(key)
  if (challenge.purpose === 'register') {
    return {
      purpose: 'register' as const,
      email: challenge.email,
      registrationToken: app.jwt.sign(
        { kind: 'registration_email_verification', email: challenge.email },
        { expiresIn: '15m' }
      )
    }
  }

  const user = await findUserByEmail(challenge.email)
  if (!canReceiveLoginOtp(user)) throw new ApiError(400, 'That code is invalid or has expired', 'INVALID_OTP')
  const token = await issueSessionToken(app, user)
  return { purpose: 'login' as const, user: removePasswordHash(user), token }
}

async function loginUserService(app: FastifyInstance, payload: Record<string, any>) {
  const user = await findUserByEmail(payload.email)
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    forbidden('Invalid email or password')
  }

  const token = await issueSessionToken(app, user)
  return { user: removePasswordHash(user), token }
}

async function logoutUserService(sessionId?: string) {
  if (sessionId) await revokeSessionRecord(sessionId)
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

async function listRegistrationCoursesService(query: string) {
  return { courses: await listCourses(query) }
}

async function searchRegistrationLocationsService(query: string) {
  const url = new URL('/api/', env.GEOCODING_BASE_URL)
  url.searchParams.set('q', `${query}, Kenya`)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')
  const response = await globalThis.fetch(url, { headers: { 'User-Agent': 'Zumbarl/1.0 registration-location-search' }, signal: AbortSignal.timeout(5000) })
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
  logoutUserService,
  requestEmailOtpService,
  verifyEmailOtpService,
  readAuthenticatedUserService,
  listRegistrationCampusesService,
  listRegistrationCoursesService,
  searchRegistrationLocationsService
}
