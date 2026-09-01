import { describe, expect, it } from 'vitest'
import { evaluateCompanyQualification, evaluateRepeatHirePolicy, evaluateStudentEligibility, rankEligibleStudent } from './evergreen.policies.js'

describe('Evergreen policies', () => {
  it('requires approved KYC even when an operations override exists', () => {
    expect(evaluateCompanyQualification({ kycApproved: false, verifiedCompletedGigs: 3, pipelineOptIn: true, pipelinePartner: true, activeOverride: true }).qualified).toBe(false)
  })

  it('uses a configurable qualification threshold', () => {
    expect(evaluateCompanyQualification({ kycApproved: true, verifiedCompletedGigs: 2, pipelineOptIn: true, pipelinePartner: true, activeOverride: false, threshold: 2 }).qualified).toBe(true)
  })

  it('separates hard eligibility from ranking', () => {
    const result = evaluateStudentEligibility({
      identityApproved: true,
      transitionAccess: true,
      activeOverride: false,
      readinessVerified: true,
      seeking: true,
      availabilityUnexpired: true,
      consented: true,
      placementTypeMatch: true,
      dateMatch: true,
      workModeMatch: true,
      locationMatch: true,
      mandatoryCompetenciesMet: false,
      activePlacementLock: false,
      legallyBlockingConflict: false,
      cohortOpen: true
    })
    expect(result.eligible).toBe(false)
    expect(result.failedChecks).toEqual(['mandatoryCompetenciesMet'])
  })

  it('produces concise evidence-based ranking reasons', () => {
    const result = rankEligibleStudent({ requiredCompetencies: 4, verifiedCompetencies: 3, requiredSkills: 2, verifiedSkills: 2, relevantEvidenceCount: 2, roadmapVerified: true, evidenceFresh: true, roleInterestMatch: true, scheduleFit: true, positiveRelationship: false, verifiedEndorsements: 1 })
    expect(result.score).toBeGreaterThan(0)
    expect(result.reasons).toContain('3 of 4 required competencies verified')
    expect(result.reasons).toContain('Dates and schedule align')
  })

  it('requires an approved mentorship alternative after the repeat-hire limit', () => {
    expect(evaluateRepeatHirePolicy(3, 0, 3).allowed).toBe(false)
    expect(evaluateRepeatHirePolicy(3, 1, 3).allowed).toBe(true)
  })
})
