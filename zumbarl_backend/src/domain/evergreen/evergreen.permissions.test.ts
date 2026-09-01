import { describe, expect, it } from 'vitest'
import { evergreenCapabilities, hasEvergreenCapability } from './evergreen.permissions.js'
import type { Role } from '../../lib/security.js'

describe('Evergreen capability policy', () => {
  it.each([
    ['COMPANY_PIPELINE_PARTNER', true],
    ['COMPANY_HR_MANAGER', true],
    ['COMPANY_HIRING_MANAGER', false],
    ['COMPANY_STANDARD', false],
    ['COMPANY_VIEWER', false],
    ['OPERATIONS_MANAGER', false]
  ] as const)('formal-offer capability for %s is %s', (role, expected) => {
    expect(hasEvergreenCapability(role, 'EVERGREEN_FORMAL_OFFER')).toBe(expected)
  })

  it.each([
    ['COMPANY_PIPELINE_PARTNER', true],
    ['COMPANY_HR_MANAGER', true],
    ['COMPANY_HIRING_MANAGER', false],
    ['COMPANY_STANDARD', false],
    ['COMPANY_VIEWER', false]
  ] as const)('pool-access capability for %s is %s', (role, expected) => {
    expect(hasEvergreenCapability(role, 'EVERGREEN_POOL_ACCESS')).toBe(expected)
  })

  it('keeps finance and operations permissions siloed', () => {
    expect(hasEvergreenCapability('FINANCE_OFFICER', 'EVERGREEN_FINANCE_MANAGE')).toBe(true)
    expect(hasEvergreenCapability('FINANCE_OFFICER', 'EVERGREEN_OPERATIONS_REVIEW')).toBe(false)
    expect(hasEvergreenCapability('OPERATIONS_MANAGER', 'EVERGREEN_OPERATIONS_REVIEW')).toBe(true)
    expect(hasEvergreenCapability('OPERATIONS_MANAGER', 'EVERGREEN_FINANCE_MANAGE')).toBe(false)
  })

  it('grants the super admin each explicit capability', () => {
    expect(evergreenCapabilities.every((capability) => hasEvergreenCapability('SUPER_ADMIN', capability))).toBe(true)
  })

  it.each(['student', 'business', 'admin', 'moderator', 'support'] as Role[])('does not grant Evergreen capabilities to legacy broad role %s', (role) => {
    expect(evergreenCapabilities.some((capability) => hasEvergreenCapability(role, capability))).toBe(false)
  })
})
