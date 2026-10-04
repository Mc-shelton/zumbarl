import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteCache: vi.fn(),
  findUserByEmail: vi.fn(),
  redisSet: vi.fn(),
  sendTransactionalEmail: vi.fn(),
  writeCache: vi.fn()
}))

vi.mock('../../cache/redis/index.js', () => ({
  deleteCache: mocks.deleteCache,
  getRedisClient: () => ({ set: mocks.redisSet }),
  readCache: vi.fn(),
  writeCache: mocks.writeCache
}))

vi.mock('../../notification/email/email.adapter.js', () => ({
  sendTransactionalEmail: mocks.sendTransactionalEmail
}))

vi.mock('../../repositories/auth/index.js', () => ({
  createSessionRecord: vi.fn(),
  createUserRecord: vi.fn(),
  createUserWithBusinessProfile: vi.fn(),
  createUserWithStudentProfile: vi.fn(),
  findBusinessProfileById: vi.fn(),
  findStudentProfileById: vi.fn(),
  findUserByEmail: mocks.findUserByEmail,
  findUserById: vi.fn(),
  findUserByUsername: vi.fn(),
  listActiveCampuses: vi.fn(),
  listCourses: vi.fn(),
  revokeSessionRecord: vi.fn()
}))

import { requestEmailOtpService } from './manageAuthenticationService.js'

describe('login email OTP eligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.redisSet.mockResolvedValue('OK')
    mocks.writeCache.mockResolvedValue(undefined)
    mocks.sendTransactionalEmail.mockResolvedValue({ status: 'sent' })
  })

  it('does not send a login OTP when the email has no database user', async () => {
    mocks.findUserByEmail.mockResolvedValue(null)

    const result = await requestEmailOtpService({ email: 'missing@example.test', purpose: 'login' })

    expect(result).not.toHaveProperty('developmentCode')
    expect(mocks.sendTransactionalEmail).not.toHaveBeenCalled()
    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:email-otp:/),
      expect.objectContaining({ email: 'missing@example.test', purpose: 'login', eligible: false }),
      600
    )
  })

  it('does not send a login OTP for an inactive database user', async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: 'user-disabled', status: 'inactive' })

    await requestEmailOtpService({ email: 'disabled@example.test', purpose: 'login' })

    expect(mocks.sendTransactionalEmail).not.toHaveBeenCalled()
    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ eligible: false }),
      600
    )
  })

  it('sends a login OTP only for an active database user', async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: 'user-active', status: 'active' })

    await requestEmailOtpService({ email: 'member@example.test', purpose: 'login' })

    expect(mocks.sendTransactionalEmail).toHaveBeenCalledOnce()
    expect(mocks.sendTransactionalEmail).toHaveBeenCalledWith(
      'member@example.test',
      expect.stringContaining('Zumbarl code'),
      expect.stringContaining('sign in to Zumbarl')
    )
    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ eligible: true }),
      600
    )
  })
})
