export type ScoreTier = 'PROVISIONAL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type ScoreConfidence = 'PROVISIONAL' | 'EMERGING' | 'ESTABLISHED' | 'HIGH'
export type GigCategory =
  | 'SOCIAL_MEDIA'
  | 'DESIGN'
  | 'COPYWRITING'
  | 'CODE'
  | 'DATA_ENTRY'
  | 'SALES_MARKETING'
  | 'ERRAND'
  | 'VIDEO'
  | 'OTHER'

export interface EngagementOutcomeInput {
  studentId: string
  companyId: string
  engagementId: string
  category: GigCategory
  completedAt: Date
  deliveryQualityRating: number
  briefAdherenceRating: number
  firstPassAccepted: boolean
  completedWithinDeadline: boolean
  deadlineMissWasStudentFault: boolean
  submissionWasComplete: boolean
  studentCancelledMidway: boolean
  attributableRevisionCount: number
  contractRevisionAllowance: number
  communicationRating: number
  conductRating: number
  disputeRaised: boolean
  disputeUpheldAgainstStudent: boolean
  wouldHireAgain: boolean
  isRepeatEngagement: boolean
  clientSatisfactionRating: number
  contractValue: number
  categoryMedianValue: number
  isVerified: boolean
  raterIsCredible: boolean
}

export interface WeightedOutcome {
  input: EngagementOutcomeInput
  priorEngagementsWithSameClient: number
  categoryRubricEvidence: Record<string, unknown>
}

export interface CategoryScore {
  category: GigCategory
  score: number
  engagements: number
  confidence: ScoreConfidence
}

export interface ZumbarlScoreResult {
  overallScore: number | null
  tier: ScoreTier
  confidence: ScoreConfidence
  qualityScore: number
  reliabilityScore: number
  professionalismScore: number
  relationshipScore: number
  effectiveEngagements: number
  uniqueClients: number
  totalEngagements: number
  categoryScores: CategoryScore[]
  conservativeLowerBound: number
  isUnderReview: boolean
  isRestricted: boolean
}

export interface LegacyScorePrior {
  effectiveEngagements: number
  uniqueClients: number
  totalEngagements: number
  qualityScore: number
  reliabilityScore: number
  professionalismScore: number
  relationshipScore: number
}

const PRIOR_MEAN = 0.6
const PRIOR_STRENGTH = 5
const SCORE_WEIGHTS = {
  quality: 0.35,
  reliability: 0.30,
  professionalism: 0.20,
  relationship: 0.15
} as const

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function normalizeFivePointRating(value: number) {
  return clamp((value - 1) / 4)
}

function recencyWeight(completedAt: Date, now: Date) {
  const ageMs = Math.max(0, now.getTime() - completedAt.getTime())
  const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30)
  return Math.pow(0.5, ageMonths / 12)
}

function complexityWeight(contractValue: number, categoryMedianValue: number) {
  if (categoryMedianValue <= 0) return 1
  const ratio = Math.max(0, contractValue) / categoryMedianValue
  return clamp(0.75 + (0.5 * Math.log(ratio + 1)) / Math.log(3), 0.75, 1.25)
}

function clientDiversityWeight(priorEngagementsWithSameClient: number) {
  return Math.max(0.6, Math.pow(0.85, Math.max(0, priorEngagementsWithSameClient)))
}

function evidenceWeight(outcome: WeightedOutcome, now: Date) {
  if (!outcome.input.isVerified || !outcome.input.raterIsCredible) return 0
  return recencyWeight(outcome.input.completedAt, now)
    * complexityWeight(outcome.input.contractValue, outcome.input.categoryMedianValue)
    * clientDiversityWeight(outcome.priorEngagementsWithSameClient)
}

function qualitySignal(input: EngagementOutcomeInput, rubricScore: number) {
  return clamp(
    normalizeFivePointRating(input.deliveryQualityRating) * 0.4
      + normalizeFivePointRating(input.briefAdherenceRating) * 0.35
      + clamp(rubricScore) * 0.15
      + (input.firstPassAccepted ? 0.1 : 0)
  )
}

function reliabilitySignal(input: EngagementOutcomeInput) {
  let signal = 1
  if (!input.completedWithinDeadline && input.deadlineMissWasStudentFault) signal -= 0.35
  if (!input.submissionWasComplete) signal -= 0.2
  if (input.studentCancelledMidway) signal -= 0.4
  const excessRevisions = Math.max(0, input.attributableRevisionCount - input.contractRevisionAllowance)
  signal -= Math.min(0.15, excessRevisions * 0.05)
  return clamp(signal)
}

function professionalismSignal(input: EngagementOutcomeInput) {
  // The original draft only allocated 80% here, which capped perfect conduct at
  // 0.8. The two ratings now cover the full positive signal before a proven
  // dispute penalty is applied.
  const base = normalizeFivePointRating(input.communicationRating) * 0.55
    + normalizeFivePointRating(input.conductRating) * 0.45
  const disputePenalty = input.disputeRaised && input.disputeUpheldAgainstStudent ? 0.2 : 0
  return clamp(base - disputePenalty)
}

function relationshipSignal(input: EngagementOutcomeInput) {
  return clamp(
    normalizeFivePointRating(input.clientSatisfactionRating) * 0.5
      + (input.wouldHireAgain ? 0.35 : 0)
      + (input.isRepeatEngagement ? 0.15 : 0)
  )
}

function bayesianMean(
  signals: Array<{ value: number; weight: number }>,
  prior?: { mean: number; strength: number }
) {
  const migratedStrength = Math.max(0, prior?.strength ?? 0)
  const migratedMean = clamp(prior?.mean ?? PRIOR_MEAN)
  const positive = PRIOR_STRENGTH * PRIOR_MEAN + migratedStrength * migratedMean
    + signals.reduce((sum, signal) => sum + signal.weight * clamp(signal.value), 0)
  const negative = PRIOR_STRENGTH * (1 - PRIOR_MEAN) + migratedStrength * (1 - migratedMean)
    + signals.reduce((sum, signal) => sum + signal.weight * (1 - clamp(signal.value)), 0)
  return positive / (positive + negative)
}

function effectiveEngagementCount(weights: number[]) {
  if (!weights.length) return 0
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const squaredWeight = weights.reduce((sum, weight) => sum + weight * weight, 0)
  const kishCount = squaredWeight > 0 ? (totalWeight * totalWeight) / squaredWeight : 0
  // Kish's count measures concentration but ignores absolute decay: ten equally
  // old outcomes otherwise count as ten. Bound it by the total surviving weight.
  // Equal-weight evidence can land infinitesimally below an integer because of
  // floating-point division (for example 2.9999999999999996). Round at the
  // reporting precision before applying confidence thresholds.
  return Math.round(Math.min(totalWeight, kishCount) * 1_000) / 1_000
}

function confidenceFor(effectiveEngagements: number, uniqueClients: number): ScoreConfidence {
  if (effectiveEngagements < 3 || uniqueClients < 2) return 'PROVISIONAL'
  if (effectiveEngagements < 8) return 'EMERGING'
  if (effectiveEngagements < 20) return 'ESTABLISHED'
  return 'HIGH'
}

function tierFor(
  score: number,
  effectiveEngagements: number,
  uniqueClients: number,
  reliabilityScore: number,
  confidence: ScoreConfidence,
  hasIntegrityFlag: boolean
): ScoreTier {
  if (confidence === 'PROVISIONAL') return 'PROVISIONAL'
  if (hasIntegrityFlag) return 'BRONZE'
  if (score >= 90 && effectiveEngagements >= 20 && uniqueClients >= 8 && reliabilityScore >= 95) return 'PLATINUM'
  if (score >= 75 && effectiveEngagements >= 8 && uniqueClients >= 4) return 'GOLD'
  if (score >= 60) return 'SILVER'
  return 'BRONZE'
}

function conservativeLowerBound(score: number, effectiveEngagements: number) {
  const credibility = effectiveEngagements / (effectiveEngagements + PRIOR_STRENGTH)
  return score * credibility + PRIOR_MEAN * 100 * (1 - credibility)
}

export const CATEGORY_RUBRICS: Record<GigCategory, (evidence: Record<string, unknown>) => number> = {
  SOCIAL_MEDIA: (evidence) => (evidence.postVerified ? 0.4 : 0)
    + (evidence.postedOnTime ? 0.3 : 0)
    + (evidence.metricAchieved ? 0.3 : 0),
  DESIGN: (evidence) => ((evidence.sourceFilesProvided || !evidence.sourceFilesRequired) ? 0.35 : 0)
    + (evidence.formatCorrect ? 0.35 : 0)
    + (evidence.originalityPassed ? 0.3 : 0),
  CODE: (evidence) => (evidence.hasCommitHistory ? 0.3 : 0)
    + (evidence.liveUrlWorks ? 0.4 : 0)
    + clamp(Number(evidence.briefChecklistScore ?? 0)) * 0.3,
  COPYWRITING: (evidence) => (Number(evidence.plagiarismScore ?? 1) < 0.2 ? 0.4 : 0)
    + (evidence.wordCountInRange ? 0.3 : 0)
    + (evidence.aiPolicyRespected ? 0.3 : 0),
  VIDEO: (evidence) => (evidence.fileDelivered ? 0.5 : 0)
    + (evidence.formatCorrect ? 0.3 : 0)
    + (evidence.durationInSpec ? 0.2 : 0),
  DATA_ENTRY: (evidence) => clamp(Number(evidence.rowCompletionRate ?? 0)) * 0.6
    + clamp(Number(evidence.accuracyRate ?? 0)) * 0.4,
  SALES_MARKETING: (evidence) => clamp(Number(evidence.checkInRate ?? 0)) * 0.4
    + clamp(Number(evidence.crmEntryRate ?? 0)) * 0.3
    + clamp(Number(evidence.confirmationRate ?? 0)) * 0.3,
  ERRAND: (evidence) => (evidence.gpsVerified ? 0.4 : 0)
    + (evidence.photoVerified ? 0.3 : 0)
    + (evidence.recipientConfirmed ? 0.3 : 0),
  OTHER: () => 0.5
}

export function calculateZumbarlScore(
  outcomes: WeightedOutcome[],
  options: {
    hasIntegrityFlag?: boolean
    isRestricted?: boolean
    isUnderReview?: boolean
    now?: Date
    legacyPrior?: LegacyScorePrior
  } = {}
): ZumbarlScoreResult {
  const now = options.now ?? new Date()
  const verified = outcomes.map((outcome) => {
    const weight = evidenceWeight(outcome, now)
    const rubric = (CATEGORY_RUBRICS[outcome.input.category] ?? CATEGORY_RUBRICS.OTHER)(outcome.categoryRubricEvidence)
    return { outcome, weight, rubric }
  }).filter((item) => item.weight > 0)

  if (!verified.length && !options.legacyPrior) {
    return {
      overallScore: null,
      tier: 'PROVISIONAL',
      confidence: 'PROVISIONAL',
      qualityScore: 0,
      reliabilityScore: 0,
      professionalismScore: 0,
      relationshipScore: 0,
      effectiveEngagements: 0,
      uniqueClients: 0,
      totalEngagements: 0,
      categoryScores: [],
      conservativeLowerBound: 0,
      isUnderReview: options.isUnderReview ?? false,
      isRestricted: options.isRestricted ?? false
    }
  }

  const signals = verified.map(({ outcome, weight, rubric }) => ({
    companyId: outcome.input.companyId,
    category: outcome.input.category,
    quality: qualitySignal(outcome.input, rubric),
    reliability: reliabilitySignal(outcome.input),
    professionalism: professionalismSignal(outcome.input),
    relationship: relationshipSignal(outcome.input),
    weight
  }))
  const toWeighted = (key: 'quality' | 'reliability' | 'professionalism' | 'relationship') => (
    signals.map((signal) => ({ value: signal[key], weight: signal.weight }))
  )
  const legacyStrength = Math.max(0, options.legacyPrior?.effectiveEngagements ?? 0)
  const quality = bayesianMean(toWeighted('quality'), options.legacyPrior
    ? { mean: options.legacyPrior.qualityScore / 100, strength: legacyStrength }
    : undefined)
  const reliability = bayesianMean(toWeighted('reliability'), options.legacyPrior
    ? { mean: options.legacyPrior.reliabilityScore / 100, strength: legacyStrength }
    : undefined)
  const professionalism = bayesianMean(toWeighted('professionalism'), options.legacyPrior
    ? { mean: options.legacyPrior.professionalismScore / 100, strength: legacyStrength }
    : undefined)
  const relationship = bayesianMean(toWeighted('relationship'), options.legacyPrior
    ? { mean: options.legacyPrior.relationshipScore / 100, strength: legacyStrength }
    : undefined)
  const rawScore = quality * SCORE_WEIGHTS.quality
    + reliability * SCORE_WEIGHTS.reliability
    + professionalism * SCORE_WEIGHTS.professionalism
    + relationship * SCORE_WEIGHTS.relationship
  const score = Math.round(rawScore * 100)
  const effectiveEngagements = effectiveEngagementCount(signals.map((signal) => signal.weight)) + legacyStrength
  // Historical imports do not retain client identities. Max avoids claiming a
  // newly seen client is necessarily different from every imported client.
  const uniqueClients = Math.max(
    new Set(signals.map((signal) => signal.companyId)).size,
    options.legacyPrior?.uniqueClients ?? 0
  )
  const confidence = confidenceFor(effectiveEngagements, uniqueClients)
  const reliabilityScore = Math.round(reliability * 100)

  const categoryScores = [...new Set(signals.map((signal) => signal.category))].map((category) => {
    const categorySignals = signals.filter((signal) => signal.category === category)
    const categoryClients = new Set(categorySignals.map((signal) => signal.companyId)).size
    const categoryEffective = effectiveEngagementCount(categorySignals.map((signal) => signal.weight))
    return {
      category,
      score: Math.round(bayesianMean(categorySignals.map((signal) => ({ value: signal.quality, weight: signal.weight }))) * 100),
      engagements: categorySignals.length,
      confidence: confidenceFor(categoryEffective, categoryClients)
    }
  })

  return {
    overallScore: confidence === 'PROVISIONAL' ? null : score,
    tier: tierFor(score, effectiveEngagements, uniqueClients, reliabilityScore, confidence, options.hasIntegrityFlag ?? false),
    confidence,
    qualityScore: Math.round(quality * 100),
    reliabilityScore,
    professionalismScore: Math.round(professionalism * 100),
    relationshipScore: Math.round(relationship * 100),
    effectiveEngagements: Math.round(effectiveEngagements * 10) / 10,
    uniqueClients,
    totalEngagements: signals.length + (options.legacyPrior?.totalEngagements ?? 0),
    categoryScores,
    conservativeLowerBound: Math.round(conservativeLowerBound(score, effectiveEngagements)),
    isUnderReview: options.isUnderReview ?? false,
    isRestricted: options.isRestricted ?? false
  }
}
