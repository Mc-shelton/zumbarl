import { createHash, randomUUID } from 'node:crypto'
import { UserRole } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import type { AnyRecord } from '../../../shared/repositories/index.js'

function toUserRole(role: string) {
  return UserRole[role as keyof typeof UserRole] ?? UserRole.STUDENT_STANDARD
}

function splitName(name: string | undefined) {
  const parts = String(name || 'Zumbarl User').trim().split(/\s+/)
  return {
    firstName: parts[0] || 'Zumbarl',
    lastName: parts.slice(1).join(' ') || 'User'
  }
}

function getUniquePhone(phone: string | undefined, email: string) {
  if (phone && phone !== '+254700000000') return phone
  const hash = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 15)
  const digits = String(BigInt(`0x${hash}`) % 1000000000n).padStart(9, '0')
  return `+254${digits}`
}

function toAuthUser(user: Record<string, any>, profileIds: Record<string, string | undefined> = {}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.isActive === false ? 'inactive' : user.status ?? 'active',
    studentId: profileIds.studentId ?? user.studentProfile?.id ?? user.studentId,
    businessId: profileIds.businessId ?? user.companyContact?.companyId ?? user.businessId,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
  }
}

function toBusinessProfile(company: Record<string, any> | null) {
  if (!company) return null
  return {
    id: company.id,
    name: company.name,
    industry: company.sector,
    sector: company.sector,
    teamSize: company.size,
    size: company.size,
    website: company.website,
    registrationNumber: company.registrationNumber,
    logoUrl: company.logoUrl,
    description: company.description,
    location: company.locationAddress || company.locationCity,
    locationCity: company.locationCity,
    locationAddress: company.locationAddress,
    latitude: company.latitude,
    longitude: company.longitude,
    hiringGoals: company.hiringGoals ?? [],
    onboardingCompleted: company.onboardingCompleted,
    verificationStatus: String(company.kycStatus ?? '').toLowerCase(),
    kycStatus: String(company.kycStatus ?? '').toLowerCase(),
    hiringGuardrailLimit: 3,
    createdAt: company.createdAt instanceof Date ? company.createdAt.toISOString() : company.createdAt,
    updatedAt: company.updatedAt instanceof Date ? company.updatedAt.toISOString() : company.updatedAt
  }
}

function toStudentProfile(student: Record<string, any> | null) {
  if (!student) return null
  return {
    id: student.id,
    userId: student.userId,
    campus: student.campus?.name ?? student.campus ?? 'Unassigned campus',
    headline: student.careerPath ?? student.headline ?? 'New Zumbarl student',
    score: 0,
    skills: [],
    verificationTier: String(student.kycStatus ?? '').toLowerCase(),
    createdAt: student.createdAt instanceof Date ? student.createdAt.toISOString() : student.createdAt,
    updatedAt: student.updatedAt instanceof Date ? student.updatedAt.toISOString() : student.updatedAt
  }
}

class AuthUsersRepository {
  async findUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { companyContact: true, studentProfile: true }
    })
    return user ? toAuthUser(user) : null
  }

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { companyContact: true, studentProfile: true }
    })
    return user ? toAuthUser(user) : null
  }

  async createUserRecord(payload: Record<string, any>) {
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        phone: getUniquePhone(payload.phone, payload.email),
        passwordHash: payload.passwordHash,
        role: toUserRole(payload.role),
        isActive: payload.status !== 'inactive'
      }
    })
    return toAuthUser(user) as AnyRecord
  }

  async createUserWithStudentProfile(payload: Record<string, any>, campus?: string) {
    const { firstName, lastName } = splitName(payload.name)
    const result = await prisma.$transaction(async (transaction) => {
      const campusRecord = await transaction.campus.upsert({
        where: { id: `campus-${String(campus || 'unassigned').toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
        update: {},
        create: {
          id: `campus-${String(campus || 'unassigned').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: campus ?? 'Unassigned campus',
          city: 'Nairobi'
        }
      })
      const course = await transaction.course.upsert({
        where: { id: 'course-unassigned' },
        update: {},
        create: {
          id: 'course-unassigned',
          name: 'Unassigned course',
          category: 'OTHER',
          duration: 4
        }
      })
      const user = await transaction.user.create({
        data: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          phone: getUniquePhone(payload.phone, payload.email),
          passwordHash: payload.passwordHash,
          role: toUserRole(payload.role),
          isActive: payload.status !== 'inactive'
        }
      })
      const student = await transaction.studentProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
          campusId: campusRecord.id,
          courseId: course.id,
          yearJoined: new Date().getFullYear(),
          courseDuration: course.duration,
          expectedGraduation: new Date(`${new Date().getFullYear() + course.duration}-12-31T00:00:00.000Z`)
        }
      })
      return { user, student }
    })
    return { user: toAuthUser(result.user, { studentId: result.student.id }), student: toStudentProfile(result.student) }
  }

  async createUserWithBusinessProfile(payload: Record<string, any>, name?: string) {
    const businessName = name ?? payload.businessName ?? payload.companyName ?? payload.name ?? 'Zumbarl Business'
    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          phone: getUniquePhone(payload.phone, payload.email),
          passwordHash: payload.passwordHash,
          role: toUserRole(payload.role),
          isActive: payload.status !== 'inactive'
        }
      })
      const company = await transaction.company.create({
        data: {
          name: businessName,
          sector: 'Unassigned',
          size: '2-10',
          hiringGoals: []
        }
      })
      await transaction.companyContact.create({
        data: {
          userId: user.id,
          companyId: company.id,
          isOwner: true
        }
      })
      await transaction.companyWallet.create({
        data: {
          companyId: company.id
        }
      })
      return { user, business: company }
    })
    return { user: toAuthUser(result.user, { businessId: result.business.id }), business: toBusinessProfile(result.business) }
  }

  async findStudentProfileById(id?: string) {
    if (!id) return null
    const student = await prisma.studentProfile.findUnique({ where: { id }, include: { campus: true } })
    return student ? toStudentProfile(student) : null
  }

  async findBusinessProfileById(id?: string) {
    if (!id) return null
    const company = await prisma.company.findUnique({ where: { id } })
    return company ? toBusinessProfile(company) : null
  }

  async createSessionRecord(payload: Record<string, any>) {
    return prisma.session.create({
      data: {
        userId: payload.userId,
        refreshToken: payload.refreshToken ?? `session-${randomUUID()}`,
        deviceInfo: payload.deviceInfo,
        ipAddress: payload.ipAddress,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  }
}

const authUsersRepository = new AuthUsersRepository()

const findUserByEmail = authUsersRepository.findUserByEmail.bind(authUsersRepository)
const findUserById = authUsersRepository.findUserById.bind(authUsersRepository)
const createUserRecord = authUsersRepository.createUserRecord.bind(authUsersRepository)
const createUserWithStudentProfile = authUsersRepository.createUserWithStudentProfile.bind(authUsersRepository)
const createUserWithBusinessProfile = authUsersRepository.createUserWithBusinessProfile.bind(authUsersRepository)
const findStudentProfileById = authUsersRepository.findStudentProfileById.bind(authUsersRepository)
const findBusinessProfileById = authUsersRepository.findBusinessProfileById.bind(authUsersRepository)
const createSessionRecord = authUsersRepository.createSessionRecord.bind(authUsersRepository)

export {
  AuthUsersRepository,
  authUsersRepository,
  findUserByEmail,
  findUserById,
  createUserRecord,
  createUserWithStudentProfile,
  createUserWithBusinessProfile,
  findStudentProfileById,
  findBusinessProfileById,
  createSessionRecord
}
