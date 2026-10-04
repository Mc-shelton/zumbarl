import { describe, expect, it } from 'vitest'
import { resolveSocialAccountHandle } from './manageSocialMetricsService.js'

describe('social account identity', () => {
  it('normalizes the handle used for a first connection', () => {
    expect(resolveSocialAccountHandle(undefined, ' Creator.Name ')).toBe('@creator.name')
  })

  it('keeps the connected handle for subsequent metric updates', () => {
    expect(resolveSocialAccountHandle({ platform: 'Instagram', handle: '@creator.name' }, 'creator.name')).toBe('@creator.name')
  })

  it('rejects changing a connected handle without removing the account first', () => {
    expect(() => resolveSocialAccountHandle(
      { platform: 'Instagram', handle: '@creator.name' },
      '@different.creator'
    )).toThrow(/cannot be changed/i)
  })
})
