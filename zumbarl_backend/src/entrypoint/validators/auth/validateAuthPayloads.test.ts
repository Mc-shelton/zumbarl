import { describe, expect, it } from 'vitest'
import { registerUserSchema } from './validateAuthPayloads.js'

const baseRegistration = {
  email: 'person@example.com',
  phone: '+254700123456',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Person',
  username: 'test_person'
}

describe('public registration roles', () => {
  it.each(['STUDENT_STANDARD', 'student'] as const)('allows the public student role %s', (role) => {
    expect(registerUserSchema.safeParse({ ...baseRegistration, role }).success).toBe(true)
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
})
