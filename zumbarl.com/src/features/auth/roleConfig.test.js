import { describe, expect, it } from 'vitest'
import {
  ACCESS_KEYS,
  AUTH_ROLES,
  filterByAccess,
  getAuthRoleIdFromBackendRole,
  hasAccess,
  hasAllAccess,
  hasAnyAccess,
} from './roleConfig'

describe('frontend role access', () => {
  it('maps backend roles to the expected frontend role', () => {
    expect(getAuthRoleIdFromBackendRole('FINANCE_OFFICER')).toBe(AUTH_ROLES.financeOfficer.id)
    expect(getAuthRoleIdFromBackendRole('UNKNOWN_ROLE')).toBe('unauthenticated')
  })

  it('honours any/all requirements without broadening access', () => {
    const role = { access: [ACCESS_KEYS.profile.viewOwn, ACCESS_KEYS.campus.learn] }
    expect(hasAccess(ACCESS_KEYS.profile.viewOwn, role)).toBe(true)
    expect(hasAccess(ACCESS_KEYS.business.dashboard, role)).toBe(false)
    expect(hasAnyAccess([ACCESS_KEYS.business.dashboard, ACCESS_KEYS.campus.learn], role)).toBe(true)
    expect(hasAllAccess([ACCESS_KEYS.profile.viewOwn, ACCESS_KEYS.campus.learn], role)).toBe(true)
    expect(hasAllAccess([ACCESS_KEYS.profile.viewOwn, ACCESS_KEYS.business.dashboard], role)).toBe(false)
  })

  it('filters navigation entries using the same access rules', () => {
    const role = { access: [ACCESS_KEYS.campus.learn] }
    const items = [
      { id: 'learn', requiredAccess: ACCESS_KEYS.campus.learn },
      { id: 'business', requiredAccess: ACCESS_KEYS.business.dashboard },
    ]
    expect(filterByAccess(items, role).map((item) => item.id)).toEqual(['learn'])
  })
})
