type QualificationInput = {
  kycApproved: boolean
  verifiedCompletedGigs: number
  pipelineOptIn: boolean
  pipelinePartner: boolean
  activeOverride: boolean
  threshold?: number
}

function evaluateCompanyQualification(input: QualificationInput) {
  const threshold = Math.max(1, input.threshold ?? 3)
  const standardQualified = input.kycApproved && input.pipelineOptIn && input.pipelinePartner && input.verifiedCompletedGigs >= threshold
  const qualified = input.kycApproved && (standardQualified || input.activeOverride)
  return {
    qualified,
    standardQualified,
    threshold,
    verifiedCompletedGigs: input.verifiedCompletedGigs,
    reasons: [
      input.kycApproved ? 'Company identity is approved' : 'Company identity approval is required',
      input.pipelineOptIn ? 'Pipeline terms accepted' : 'Pipeline opt-in is required',
      input.verifiedCompletedGigs >= threshold
        ? `${input.verifiedCompletedGigs} verified gigs meet the ${threshold}-gig threshold`
        : `${threshold - input.verifiedCompletedGigs} more verified gigs required`,
      input.activeOverride ? 'Operations override is active' : null
    ].filter(Boolean)
  }
}

type StudentEligibilityInput = {
  identityApproved: boolean
  transitionAccess: boolean
  activeOverride: boolean
  readinessVerified: boolean
  seeking: boolean
  availabilityUnexpired: boolean
  consented: boolean
  placementTypeMatch: boolean
  dateMatch: boolean
  workModeMatch: boolean
  locationMatch: boolean
  mandatoryCompetenciesMet: boolean
  activePlacementLock: boolean
  legallyBlockingConflict: boolean
  cohortOpen: boolean
}

function evaluateStudentEligibility(input: StudentEligibilityInput) {
  const checks = {
    identityApproved: input.identityApproved,
    transitionAccess: input.transitionAccess || input.activeOverride,
    readinessVerified: input.readinessVerified,
    seeking: input.seeking,
    availabilityUnexpired: input.availabilityUnexpired,
    consented: input.consented,
    placementTypeMatch: input.placementTypeMatch,
    dateMatch: input.dateMatch,
    workModeMatch: input.workModeMatch,
    locationMatch: input.locationMatch,
    mandatoryCompetenciesMet: input.mandatoryCompetenciesMet,
    noActivePlacementLock: !input.activePlacementLock,
    noLegallyBlockingConflict: !input.legallyBlockingConflict,
    cohortOpen: input.cohortOpen
  }
  return {
    eligible: Object.values(checks).every(Boolean),
    checks,
    failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key)
  }
}

type RankingInput = {
  requiredCompetencies: number
  verifiedCompetencies: number
  requiredSkills: number
  verifiedSkills: number
  relevantEvidenceCount: number
  roadmapVerified: boolean
  evidenceFresh: boolean
  roleInterestMatch: boolean
  scheduleFit: boolean
  positiveRelationship: boolean
  verifiedEndorsements: number
}

function rankEligibleStudent(input: RankingInput) {
  const competencyCoverage = input.requiredCompetencies === 0 ? 1 : Math.min(1, input.verifiedCompetencies / input.requiredCompetencies)
  const skillCoverage = input.requiredSkills === 0 ? 1 : Math.min(1, input.verifiedSkills / input.requiredSkills)
  const score = Math.round((
    competencyCoverage * 35 +
    skillCoverage * 20 +
    Math.min(input.relevantEvidenceCount, 5) * 4 +
    (input.roadmapVerified ? 8 : 0) +
    (input.evidenceFresh ? 4 : 0) +
    (input.roleInterestMatch ? 5 : 0) +
    (input.scheduleFit ? 4 : 0) +
    (input.positiveRelationship ? 2 : 0) +
    Math.min(input.verifiedEndorsements, 2)
  ) * 100) / 100

  return {
    score: Math.min(100, score),
    reasons: [
      `${input.verifiedCompetencies} of ${input.requiredCompetencies} required competencies verified`,
      `${input.verifiedSkills} of ${input.requiredSkills} required skills verified`,
      input.scheduleFit ? 'Dates and schedule align' : null,
      input.roleInterestMatch ? 'Role interests align' : null,
      input.relevantEvidenceCount > 0 ? `${input.relevantEvidenceCount} relevant verified evidence item${input.relevantEvidenceCount === 1 ? '' : 's'}` : null,
      input.positiveRelationship ? 'Positive prior company relationship' : null
    ].filter(Boolean)
  }
}

function evaluateRepeatHirePolicy(completedPlacements: number, mentorshipAlternatives: number, limit = 3) {
  const allowedPlacements = Math.max(1, limit) + Math.max(0, mentorshipAlternatives)
  return {
    allowed: completedPlacements < allowedPlacements,
    completedPlacements,
    allowedPlacements,
    requiresMentorshipAlternative: completedPlacements >= allowedPlacements
  }
}

export {
  evaluateCompanyQualification,
  evaluateStudentEligibility,
  rankEligibleStudent,
  evaluateRepeatHirePolicy,
  type QualificationInput,
  type StudentEligibilityInput,
  type RankingInput
}
