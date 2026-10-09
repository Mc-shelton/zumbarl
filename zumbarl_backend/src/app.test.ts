import { describe, expect, it } from 'vitest'
import { rateLimitIdentity } from './app.js'

describe('rate limit identity', () => {
  it('isolates authenticated sessions that share one network address', () => {
    const first = rateLimitIdentity({ headers: { authorization: 'Bearer first-session-token' }, ip: '10.0.0.1' })
    const second = rateLimitIdentity({ headers: { authorization: 'Bearer second-session-token' }, ip: '10.0.0.1' })

    expect(first).toMatch(/^session:[a-f0-9]{64}$/)
    expect(second).toMatch(/^session:[a-f0-9]{64}$/)
    expect(first).not.toBe(second)
    expect(first).not.toContain('first-session-token')
  })

  it('uses the client address for anonymous requests', () => {
    expect(rateLimitIdentity({ headers: {}, ip: '203.0.113.5' })).toBe('ip:203.0.113.5')
  })
})
