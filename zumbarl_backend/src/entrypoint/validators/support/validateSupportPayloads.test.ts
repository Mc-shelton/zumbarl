import { describe, expect, it } from 'vitest'
import { wellbeingCheckInSchema, wellbeingMessageSchema, wellbeingPreferenceSchema, wellbeingResetSchema } from './validateSupportPayloads.js'

describe('wellbeing payload validation', () => {
  it('accepts a minimal daily check-in and applies privacy-safe defaults', () => {
    const result = wellbeingCheckInSchema.safeParse({ mood: 'okay' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stressors).toEqual([])
      expect(result.data.source).toBe('daily')
    }
  })

  it('rejects unsupported moods and excessive stressor selections', () => {
    expect(wellbeingCheckInSchema.safeParse({ mood: 'diagnosed' }).success).toBe(false)
    expect(wellbeingCheckInSchema.safeParse({
      mood: 'low',
      stressors: ['money', 'school', 'relationships', 'family', 'work', 'loneliness', 'anxiety'],
    }).success).toBe(false)
  })

  it('requires an explicit preference change', () => {
    expect(wellbeingPreferenceSchema.safeParse({}).success).toBe(false)
    expect(wellbeingPreferenceSchema.safeParse({ insightsEnabled: false }).success).toBe(true)
  })

  it('bounds reset metrics and conversation length', () => {
    expect(wellbeingResetSchema.safeParse({ breathingSeconds: 30, groundingCount: 5, durationSeconds: 180 }).success).toBe(true)
    expect(wellbeingResetSchema.safeParse({ groundingCount: 6 }).success).toBe(false)
    expect(wellbeingMessageSchema.safeParse({ message: '' }).success).toBe(false)
    expect(wellbeingMessageSchema.safeParse({ message: 'I need to talk.' }).success).toBe(true)
  })
})
