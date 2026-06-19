import { createHash } from 'node:crypto'
import { KycStatus, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

type LegacyRecord = {
  id: string
  collection: string
  data: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function createUniquePhone(phone: string | undefined, email: string) {
  if (phone && phone !== '+254700000000') return phone
  const hash = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 15)
  const digits = String(BigInt(`0x${hash}`) % 1000000000n).padStart(9, '0')
  return `+254${digits}`
}

function toUserRole(role: string | undefined) {
  const normalizedRole = String(role || '').toUpperCase()
  if (normalizedRole === 'BUSINESS') return UserRole.COMPANY_STANDARD
  if (normalizedRole === 'STUDENT') return UserRole.STUDENT_STANDARD
  if (normalizedRole === 'ADMIN') return UserRole.SUPER_ADMIN
  return UserRole[normalizedRole as keyof typeof UserRole] ?? UserRole.STUDENT_STANDARD
}

function toKycStatus(status: string | undefined) {
  const normalizedStatus = String(status || '').toUpperCase()
  if (normalizedStatus === 'IN_REVIEW') return KycStatus.UNDER_REVIEW
  if (normalizedStatus === 'VERIFIED') return KycStatus.APPROVED
  if (normalizedStatus === 'NEEDS_CHANGES') return KycStatus.REJECTED
  return KycStatus[normalizedStatus as keyof typeof KycStatus] ?? KycStatus.PENDING
}

function splitName(name: string | undefined) {
  const parts = String(name || 'Zumbarl User').trim().split(/\s+/)
  return {
    firstName: parts[0] || 'Zumbarl',
    lastName: parts.slice(1).join(' ') || 'User'
  }
}

async function readLegacyRecords() {
  const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.app_records') IS NOT NULL AS exists
  `
  if (!tableExists[0]?.exists) return []

  return prisma.$queryRaw<LegacyRecord[]>`
    SELECT id, collection, data, "createdAt", "updatedAt"
    FROM app_records
    ORDER BY "createdAt" ASC
  `
}

async function createWorkflowRecordsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS workflow_records (
      id TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      data JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS workflow_records_collection_idx ON workflow_records(collection)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS workflow_records_collection_createdAt_idx ON workflow_records(collection, "createdAt")')
}

async function copyWorkflowRecords() {
  await createWorkflowRecordsTable()
  const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.app_records') IS NOT NULL AS exists
  `
  if (!tableExists[0]?.exists) return 0

  const result = await prisma.$executeRawUnsafe(`
    INSERT INTO workflow_records (id, collection, data, "createdAt", "updatedAt")
    SELECT id, collection, data, "createdAt", "updatedAt"
    FROM app_records
    ON CONFLICT (id) DO UPDATE SET
      collection = EXCLUDED.collection,
      data = EXCLUDED.data,
      "updatedAt" = EXCLUDED."updatedAt"
  `)
  return Number(result)
}

async function ensureDefaultStudentScaffold() {
  const campus = await prisma.campus.upsert({
    where: { id: 'campus-unassigned' },
    update: {},
    create: {
      id: 'campus-unassigned',
      name: 'Unassigned campus',
      city: 'Nairobi'
    }
  })
  const course = await prisma.course.upsert({
    where: { id: 'course-unassigned' },
    update: {},
    create: {
      id: 'course-unassigned',
      name: 'Unassigned course',
      category: 'OTHER',
      duration: 4
    }
  })
  return { campus, course }
}

async function migrateUsers(records: LegacyRecord[]) {
  let migrated = 0
  const legacyUsers = records.filter((record) => record.collection === 'users')
  for (const record of legacyUsers) {
    const email = String(record.data.email || '').toLowerCase()
    const passwordHash = record.data.passwordHash
    if (!email || !passwordHash) continue

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ id: record.id }, { email }] }
    })
    if (existingUser) continue

    await prisma.user.create({
      data: {
        id: record.id,
        name: record.data.name,
        email,
        phone: createUniquePhone(record.data.phone, email),
        passwordHash,
        role: toUserRole(record.data.role),
        isActive: record.data.status !== 'inactive',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })
    migrated += 1
  }
  return migrated
}

async function migrateBusinesses(records: LegacyRecord[]) {
  let migrated = 0
  const legacyBusinesses = records.filter((record) => record.collection === 'businesses')
  for (const record of legacyBusinesses) {
    if (await prisma.company.findUnique({ where: { id: record.id } })) continue

    await prisma.company.create({
      data: {
        id: record.id,
        name: String(record.data.name || 'Zumbarl Business'),
        registrationNumber: record.data.registrationNumber,
        sector: String(record.data.industry || record.data.sector || 'Unassigned'),
        size: String(record.data.teamSize || record.data.size || '2-10'),
        website: record.data.website,
        logoUrl: record.data.logoUrl,
        description: record.data.description,
        hiringGoals: Array.isArray(record.data.hiringGoals) ? record.data.hiringGoals : [],
        onboardingCompleted: Boolean(record.data.onboardingCompleted),
        locationCity: String(record.data.locationCity || record.data.location || 'Nairobi'),
        locationAddress: record.data.locationAddress,
        latitude: record.data.latitude === undefined ? undefined : Number(record.data.latitude),
        longitude: record.data.longitude === undefined ? undefined : Number(record.data.longitude),
        kycStatus: toKycStatus(record.data.kycStatus || record.data.verificationStatus),
        kycVerifiedAt: record.data.kycVerifiedAt ? new Date(record.data.kycVerifiedAt) : undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })

    const userId = record.data.userId
    if (userId && await prisma.user.findUnique({ where: { id: userId } })) {
      await prisma.companyContact.upsert({
        where: { userId },
        update: { companyId: record.id, isOwner: true },
        create: { userId, companyId: record.id, isOwner: true }
      })
    }

    await prisma.companyWallet.upsert({
      where: { companyId: record.id },
      update: {},
      create: { companyId: record.id }
    })
    migrated += 1
  }
  return migrated
}

async function migrateStudents(records: LegacyRecord[]) {
  let migrated = 0
  const { campus, course } = await ensureDefaultStudentScaffold()
  const legacyStudents = records.filter((record) => record.collection === 'students')
  for (const record of legacyStudents) {
    const userId = record.data.userId
    if (!userId) continue
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || await prisma.studentProfile.findUnique({ where: { id: record.id } })) continue

    const { firstName, lastName } = splitName(user.name ?? record.data.name)
    await prisma.studentProfile.create({
      data: {
        id: record.id,
        userId,
        firstName,
        lastName,
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
        campusId: campus.id,
        courseId: course.id,
        yearJoined: new Date().getFullYear(),
        courseDuration: course.duration,
        expectedGraduation: new Date(`${new Date().getFullYear() + course.duration}-12-31T00:00:00.000Z`),
        bio: record.data.headline,
        careerPath: record.data.careerPath,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })
    migrated += 1
  }
  return migrated
}

async function migrateIndustries(records: LegacyRecord[]) {
  let migrated = 0
  const legacyIndustries = records.filter((record) => record.collection === 'industries')
  for (const record of legacyIndustries) {
    const name = String(record.data.name || '').trim()
    if (!name) continue
    await prisma.industry.upsert({
      where: { slug: createSlug(name) },
      update: { name },
      create: {
        name,
        slug: createSlug(name),
        status: record.data.status ?? 'active',
        source: record.data.source ?? 'legacy_app_records',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })
    migrated += 1
  }
  return migrated
}

async function migrateBusinessKyc(records: LegacyRecord[]) {
  let migrated = 0
  const legacyBusinessKyc = records.filter((record) => record.collection === 'businessKyc')
  for (const record of legacyBusinessKyc) {
    const businessId = record.data.businessId || record.data.companyId
    if (!businessId || !await prisma.company.findUnique({ where: { id: businessId } })) continue

    await prisma.businessKyc.upsert({
      where: { companyId: businessId },
      update: {
        status: toKycStatus(record.data.status),
        registeredBusinessName: record.data.registeredBusinessName ?? 'Registered business',
        businessRegistrationNumber: record.data.businessRegistrationNumber ?? `LEGACY-${businessId}`,
        representativeFullName: record.data.representativeFullName ?? 'Authorised representative',
        representativePhone: record.data.representativePhone ?? '+254700000000',
        representativeEmail: record.data.representativeEmail ?? 'legacy-business@zumbarl.local',
        representativeRole: record.data.representativeRole ?? 'Owner',
        industry: record.data.industry ?? 'Unassigned',
        companySize: record.data.companySize ?? '2-10',
        physicalAddress: record.data.physicalAddress ?? 'Nairobi',
        yearEstablished: Number(record.data.yearEstablished ?? new Date().getFullYear())
      },
      create: {
        companyId: businessId,
        status: toKycStatus(record.data.status),
        registeredBusinessName: record.data.registeredBusinessName ?? 'Registered business',
        incorporationCertificate: record.data.incorporationCertificate,
        kraPinCertificate: record.data.kraPinCertificate,
        businessRegistrationNumber: record.data.businessRegistrationNumber ?? `LEGACY-${businessId}`,
        representativeFullName: record.data.representativeFullName ?? 'Authorised representative',
        representativeIdDocument: record.data.representativeIdDocument,
        representativePhone: record.data.representativePhone ?? '+254700000000',
        representativeEmail: record.data.representativeEmail ?? 'legacy-business@zumbarl.local',
        representativeRole: record.data.representativeRole ?? 'Owner',
        industry: record.data.industry ?? 'Unassigned',
        companySize: record.data.companySize ?? '2-10',
        physicalAddress: record.data.physicalAddress ?? 'Nairobi',
        geoCoordinates: record.data.geoCoordinates,
        website: record.data.website,
        yearEstablished: Number(record.data.yearEstablished ?? new Date().getFullYear()),
        mpesaTillOrPaybill: record.data.mpesaTillOrPaybill,
        bankAccountDetails: record.data.bankAccountDetails,
        taxComplianceCertificate: record.data.taxComplianceCertificate,
        linkedInCompanyPage: record.data.linkedInCompanyPage,
        socialMediaPresence: record.data.socialMediaPresence,
        verifiedCompanyReferral: record.data.verifiedCompanyReferral,
        submittedAt: record.data.submittedAt ? new Date(record.data.submittedAt) : record.createdAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })
    migrated += 1
  }
  return migrated
}

async function migrateLegacyAppRecords() {
  const records = await readLegacyRecords()
  if (!records.length) return {
    workflowRecords: 0,
    users: 0,
    businesses: 0,
    students: 0,
    industries: 0,
    businessKyc: 0
  }

  const workflowRecords = await copyWorkflowRecords()
  const users = await migrateUsers(records)
  const businesses = await migrateBusinesses(records)
  const students = await migrateStudents(records)
  const industries = await migrateIndustries(records)
  const businessKyc = await migrateBusinessKyc(records)

  return { workflowRecords, users, businesses, students, industries, businessKyc }
}

export {
  migrateLegacyAppRecords
}
