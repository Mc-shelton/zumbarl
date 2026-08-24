import { describe, expect, it } from 'vitest'
import { calculateZumbarlScore, type EngagementOutcomeInput, type WeightedOutcome } from './zumbarlScoreCalculator.js'

function outcome(overrides: Partial<EngagementOutcomeInput> = {}): WeightedOutcome {
  return {
    input: {
      studentId: 'student-1',
      companyId: 'company-1',
      engagementId: 'engagement-1',
      category: 'SOCIAL_MEDIA',
      completedAt: new Date('2026-08-20T00:00:00.000Z'),
      deliveryQualityRating: 5,
      briefAdherenceRating: 5,
      firstPassAccepted: true,
      completedWithinDeadline: true,
      deadlineMissWasStudentFault: false,
      submissionWasComplete: true,
      studentCancelledMidway: false,
      attributableRevisionCount: 0,
      contractRevisionAllowance: 2,
      communicationRating: 5,
      conductRating: 5,
      disputeRaised: false,
      disputeUpheldAgainstStudent: false,
      wouldHireAgain: true,
      isRepeatEngagement: false,
      clientSatisfactionRating: 5,
      contractValue: 10_000,
      categoryMedianValue: 10_000,
      isVerified: true,
      raterIsCredible: true,
      ...overrides
    },
    priorEngagementsWithSameClient: 0,
    categoryRubricEvidence: { postVerified: true, postedOnTime: true, metricAchieved: true }
  }
}

describe('calculateZumbarlScore', () => {
  const now = new Date('2026-08-20T00:00:00.000Z')

  it('keeps students provisional until enough verified and diverse evidence exists', () => {
    const result = calculateZumbarlScore([outcome()], { now })
    expect(result.overallScore).toBeNull()
    expect(result.tier).toBe('PROVISIONAL')
    expect(result.confidence).toBe('PROVISIONAL')
  })

  it('ignores unverified or quarantined rating evidence', () => {
    const result = calculateZumbarlScore([
      outcome({ isVerified: false }),
      outcome({ engagementId: 'engagement-2', raterIsCredible: false })
    ], { now })
    expect(result.totalEngagements).toBe(0)
    expect(result.overallScore).toBeNull()
  })

  it('publishes an emerging score after three effective outcomes from two clients', () => {
    const result = calculateZumbarlScore([
      outcome(),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2' }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3' })
    ], { now })
    expect(result.confidence).toBe('EMERGING')
    expect(result.overallScore).not.toBeNull()
    expect(result.tier).toBe('SILVER')
    expect(result.categoryScores[0].confidence).toBe('EMERGING')
  })

  it('allows perfect professionalism evidence to use the full signal range', () => {
    const result = calculateZumbarlScore([
      outcome(),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2' }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3' })
    ], { now })
    expect(result.professionalismScore).toBeGreaterThanOrEqual(75)
  })

  it('does not penalize a deadline missed because of the client', () => {
    const clientDelay = calculateZumbarlScore([
      outcome({ completedWithinDeadline: false, deadlineMissWasStudentFault: false }),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2' }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3' })
    ], { now })
    const studentDelay = calculateZumbarlScore([
      outcome({ completedWithinDeadline: false, deadlineMissWasStudentFault: true }),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2' }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3' })
    ], { now })

    expect(clientDelay.reliabilityScore).toBeGreaterThan(studentDelay.reliabilityScore)
  })

  it('reduces effective evidence as outcomes age', () => {
    const recent = calculateZumbarlScore([
      outcome(),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2' }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3' })
    ], { now })
    const old = calculateZumbarlScore([
      outcome({ completedAt: new Date('2024-08-20T00:00:00.000Z') }),
      outcome({ engagementId: 'engagement-2', companyId: 'company-2', completedAt: new Date('2024-08-20T00:00:00.000Z') }),
      outcome({ engagementId: 'engagement-3', companyId: 'company-3', completedAt: new Date('2024-08-20T00:00:00.000Z') })
    ], { now })
    expect(old.effectiveEngagements).toBeLessThan(recent.effectiveEngagements)
    expect(old.confidence).toBe('PROVISIONAL')
  })

  it('adjusts a migrated score instead of resetting an established student', () => {
    const result = calculateZumbarlScore([
      outcome({ companyId: 'new-client', engagementId: 'new-work' })
    ], {
      now,
      legacyPrior: {
        effectiveEngagements: 12,
        uniqueClients: 7,
        totalEngagements: 23,
        qualityScore: 76,
        reliabilityScore: 94,
        professionalismScore: 82,
        relationshipScore: 68
      }
    })

    expect(result.confidence).toBe('ESTABLISHED')
    expect(result.totalEngagements).toBe(24)
    expect(result.effectiveEngagements).toBeGreaterThan(12)
    expect(result.overallScore).not.toBeNull()
  })
})
