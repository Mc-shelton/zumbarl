import { describe, expect, it } from 'vitest'
import { registerUserSchema, requestEmailOtpSchema, verifyEmailOtpSchema } from './validateAuthPayloads.js'

const baseRegistration = {
  email: 'person@example.com',
  phone: '+254700123456',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Person',
  username: 'test_person',
  acceptedTerms: true,
  acceptedPrivacy: true
}

describe('public registration roles', () => {
  it.each(['STUDENT_STANDARD', 'student'] as const)('allows the public student role %s', (role) => {
    expect(registerUserSchema.safeParse({
      ...baseRegistration,
      role,
      yearJoined: new Date().getFullYear(),
      course: { id: 'test-course' }
    }).success).toBe(true)
  })

  it.each(['COMPANY_STANDARD', 'business'] as const)('allows the public company role %s with a business name', (role) => {
    expect(registerUserSchema.safeParse({ ...baseRegistration, role, businessName: 'Example SME' }).success).toBe(true)
  })

  it.each([
    'SUPER_ADMIN',
    'OPERATIONS_MANAGER',
    'FINANCE_OFFICER',
    'SAFETY_OFFICER',
    'CONTENT_MODERATOR',
    'COMPANY_PIPELINE_PARTNER',
    'COMPANY_HR_MANAGER',
    'COMPANY_HIRING_MANAGER',
    'COMPANY_VIEWER',
    'STUDENT_TRANSITION',
    'STUDENT_ALUMNI'
  ])('rejects privileged or non-self-service role %s', (role) => {
    expect(registerUserSchema.safeParse({ ...baseRegistration, role, businessName: 'Example SME' }).success).toBe(false)
  })

  it('requires a business name for company registration', () => {
    const result = registerUserSchema.safeParse({ ...baseRegistration, role: 'COMPANY_STANDARD' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.flatten().fieldErrors.businessName).toBeDefined()
  })

  it('requires explicit acceptance of both current policies', () => {
    expect(registerUserSchema.safeParse({ ...baseRegistration, acceptedTerms: false }).success).toBe(false)
    expect(registerUserSchema.safeParse({ ...baseRegistration, acceptedPrivacy: false }).success).toBe(false)
    expect(registerUserSchema.safeParse({ ...baseRegistration, acceptedTerms: undefined }).success).toBe(false)
  })

  it('accepts a verified-email registration token instead of a password', () => {
    expect(registerUserSchema.safeParse({
      ...baseRegistration,
      password: undefined,
      registrationToken: 'signed-registration-token',
      role: 'COMPANY_STANDARD',
      businessName: 'Example SME'
    }).success).toBe(true)
  })

  it('rejects registration without a password or verified-email token', () => {
    const result = registerUserSchema.safeParse({
      ...baseRegistration,
      password: undefined,
      role: 'COMPANY_STANDARD',
      businessName: 'Example SME'
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.flatten().fieldErrors.registrationToken).toBeDefined()
  })
})

describe('email OTP validation', () => {
  it('accepts login and registration code requests', () => {
    expect(requestEmailOtpSchema.safeParse({ email: 'person@example.com', purpose: 'login' }).success).toBe(true)
    expect(requestEmailOtpSchema.safeParse({ email: 'person@example.com', purpose: 'register' }).success).toBe(true)
  })

  it('requires an exact six-digit verification code', () => {
    const challengeId = 'fd1af8ec-7f54-4a04-8d23-ff43300bf24b'
    expect(verifyEmailOtpSchema.safeParse({ challengeId, code: '123456' }).success).toBe(true)
    expect(verifyEmailOtpSchema.safeParse({ challengeId, code: '12345' }).success).toBe(false)
    expect(verifyEmailOtpSchema.safeParse({ challengeId, code: '12345a' }).success).toBe(false)
  })
})
