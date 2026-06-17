import { createPrismaRecordRepository, runPrismaRecordTransaction, type AnyRecord } from '../../../shared/repositories/index.js'

const users = createPrismaRecordRepository('users')
const students = createPrismaRecordRepository('students')
const businesses = createPrismaRecordRepository('businesses')
const sessions = createPrismaRecordRepository('sessions')

class AuthUsersRepository {
  findUserByEmail(email: string) {
    return users.findByField('email', email.toLowerCase())
  }

  findUserById(id: string) {
    return users.findById(id)
  }

  createUserRecord(payload: Record<string, any>) {
    return users.create(payload) as Promise<AnyRecord>
  }

  createUserWithStudentProfile(payload: Record<string, any>, campus?: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionUsers = createRepository('users')
      const transactionStudents = createRepository('students')
      const user = await transactionUsers.create(payload)
      const student = await transactionStudents.create({
        userId: user.id,
        campus: campus ?? 'Unassigned campus',
        headline: 'New Zumbarl student',
        score: 0,
        skills: [],
        verificationTier: 'starter'
      })
      const updatedUser = await transactionUsers.updateById(user.id, { studentId: student.id })
      return { user: updatedUser ?? { ...user, studentId: student.id }, student }
    })
  }

  createUserWithBusinessProfile(payload: Record<string, any>, name: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionUsers = createRepository('users')
      const transactionBusinesses = createRepository('businesses')
      const user = await transactionUsers.create(payload)
      const business = await transactionBusinesses.create({
        userId: user.id,
        name,
        industry: 'Unassigned',
        verificationStatus: 'pending',
        hiringGuardrailLimit: 3
      })
      const updatedUser = await transactionUsers.updateById(user.id, { businessId: business.id })
      return { user: updatedUser ?? { ...user, businessId: business.id }, business }
    })
  }

  createStudentProfileRecord(userId: string, campus?: string) {
    return students.create({
      userId,
      campus: campus ?? 'Unassigned campus',
      headline: 'New Zumbarl student',
      score: 0,
      skills: [],
      verificationTier: 'starter'
    })
  }

  createBusinessProfileRecord(userId: string, name: string) {
    return businesses.create({
      userId,
      name,
      industry: 'Unassigned',
      verificationStatus: 'pending',
      hiringGuardrailLimit: 3
    })
  }

  findStudentProfileById(id?: string) {
    return id ? students.findById(id) : null
  }

  findBusinessProfileById(id?: string) {
    return id ? businesses.findById(id) : null
  }

  createSessionRecord(payload: Record<string, any>) {
    return sessions.create({ scope: 'auth-session', action: 'created', ...payload })
  }
}

const authUsersRepository = new AuthUsersRepository()

const findUserByEmail = authUsersRepository.findUserByEmail.bind(authUsersRepository)
const findUserById = authUsersRepository.findUserById.bind(authUsersRepository)
const createUserRecord = authUsersRepository.createUserRecord.bind(authUsersRepository)
const createUserWithStudentProfile = authUsersRepository.createUserWithStudentProfile.bind(authUsersRepository)
const createUserWithBusinessProfile = authUsersRepository.createUserWithBusinessProfile.bind(authUsersRepository)
const createStudentProfileRecord = authUsersRepository.createStudentProfileRecord.bind(authUsersRepository)
const createBusinessProfileRecord = authUsersRepository.createBusinessProfileRecord.bind(authUsersRepository)
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
  createStudentProfileRecord,
  createBusinessProfileRecord,
  findStudentProfileById,
  findBusinessProfileById,
  createSessionRecord
}
