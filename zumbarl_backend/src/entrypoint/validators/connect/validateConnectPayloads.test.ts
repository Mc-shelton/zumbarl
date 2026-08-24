import { describe, expect, it } from 'vitest'
import { eventResponseSchema } from './validateConnectPayloads.js'

describe('event response validation', () => {
  it.each(['GOING', 'INTERESTED', 'CANCELLED'])('accepts %s', (status) => {
    expect(eventResponseSchema.safeParse({ status }).success).toBe(true)
  })

  it('rejects an unsupported response', () => {
    expect(eventResponseSchema.safeParse({ status: 'MAYBE' }).success).toBe(false)
  })
})
