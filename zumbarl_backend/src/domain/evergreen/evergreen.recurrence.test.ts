import { describe, expect, it } from 'vitest'
import { addLocalPeriod, calculateNextCohortDates } from './evergreen.recurrence.js'

describe('Evergreen recurrence', () => {
  it('preserves local wall-clock time across daylight-saving boundaries', () => {
    const original = new Date('2026-02-28T14:00:00.000Z') // 09:00 New York
    const next = addLocalPeriod(original, 'America/New_York', 'MONTHLY')!
    expect(next.toISOString()).toBe('2026-03-28T13:00:00.000Z') // still 09:00 locally
  })

  it('calculates the complete next cohort without changing duration semantics', () => {
    const next = calculateNextCohortDates({
      recurrenceType: 'MONTHLY',
      timezone: 'Africa/Nairobi',
      applicationOpensAt: new Date('2026-09-01T06:00:00.000Z'),
      applicationClosesAt: new Date('2026-09-15T14:00:00.000Z'),
      placementStartsAt: new Date('2026-10-01T06:00:00.000Z'),
      placementEndsAt: new Date('2026-12-01T14:00:00.000Z')
    })!
    expect(next.applicationOpensAt.toISOString()).toBe('2026-10-01T06:00:00.000Z')
    expect(next.placementStartsAt.toISOString()).toBe('2026-11-01T06:00:00.000Z')
  })
})
