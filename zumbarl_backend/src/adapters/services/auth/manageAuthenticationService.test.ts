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

describe('unified email OTP access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.redisSet.mockResolvedValue('OK')
    mocks.writeCache.mockResolvedValue(undefined)
    mocks.sendTransactionalEmail.mockResolvedValue({ status: 'sent' })
  })

  it('sends a registration OTP when the email has no database user', async () => {
    mocks.findUserByEmail.mockResolvedValue(null)

    await requestEmailOtpService({ email: 'missing@example.test', purpose: 'access' })

    expect(mocks.sendTransactionalEmail).toHaveBeenCalledOnce()
    expect(mocks.sendTransactionalEmail).toHaveBeenCalledWith(
      'missing@example.test',
      expect.stringContaining('Zumbarl code'),
      expect.stringContaining('finish joining Zumbarl')
    )
    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:email-otp:/),
      expect.objectContaining({ email: 'missing@example.test', purpose: 'register', eligible: true }),
      600
    )
  })

  it('does not send an OTP for an inactive database user', async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: 'user-disabled', status: 'inactive' })

    await requestEmailOtpService({ email: 'disabled@example.test', purpose: 'access' })

    expect(mocks.sendTransactionalEmail).not.toHaveBeenCalled()
    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ purpose: 'login', eligible: false }),
      600
    )
  })

  it('sends a login OTP for an active database user', async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: 'user-active', status: 'active' })

    await requestEmailOtpService({ email: 'member@example.test', purpose: 'access' })

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

  it('ignores a legacy client purpose and resolves the flow from the account', async () => {
    mocks.findUserByEmail.mockResolvedValue(null)

    await requestEmailOtpService({ email: 'new@example.test', purpose: 'login' })

    expect(mocks.writeCache).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ purpose: 'register', eligible: true }),
      600
    )
  })
})
