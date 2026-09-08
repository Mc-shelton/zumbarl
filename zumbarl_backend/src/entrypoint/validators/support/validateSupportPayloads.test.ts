import { describe, expect, it } from 'vitest'
import { careEnrollmentUpdateSchema, careProgramEnrollmentSchema, careProgressCheckInSchema, supportCaseStatusSchema, wellbeingCheckInSchema, wellbeingHandoffSchema } from './validateSupportPayloads.js'

describe('student care payload validation', () => {
  it('accepts peer-pressure and substance-use context in a private check-in', () => {
    const parsed = wellbeingCheckInSchema.parse({ mood: 'low', stressors: ['peer_pressure', 'substance_use'], source: 'daily' })
    expect(parsed.stressors).toEqual(['peer_pressure', 'substance_use'])
  })

  it('requires explicit consent before creating a named care-program request', () => {
    const request = { goal: 'Build a safer recovery support plan', consentText: 'I agree to private care coordination.' }
    expect(careProgramEnrollmentSchema.safeParse({ ...request, consent: false }).success).toBe(false)
    expect(careProgramEnrollmentSchema.safeParse({ ...request, consent: true }).success).toBe(true)
  })

  it('keeps a setback valid and lets the student request follow-up', () => {
    expect(careProgressCheckInSchema.parse({ status: 'setback', requestFollowUp: true })).toMatchObject({ status: 'setback', requestFollowUp: true })
  })

  it('requires separate consent for a Talk It Out human handoff', () => {
    expect(wellbeingHandoffSchema.safeParse({ consent: false, shareLatestMessage: true }).success).toBe(false)
    expect(wellbeingHandoffSchema.safeParse({ consent: true, shareLatestMessage: false }).success).toBe(true)
  })

  it('supports operational states for reports, appointments and care plans', () => {
    expect(supportCaseStatusSchema.safeParse({ status: 'confirmed' }).success).toBe(true)
    expect(careEnrollmentUpdateSchema.safeParse({ status: 'active', studentVisibleNote: 'Your plan is active.' }).success).toBe(true)
  })
})
