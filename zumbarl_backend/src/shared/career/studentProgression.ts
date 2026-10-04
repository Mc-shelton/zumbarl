export const STUDENT_WORK_MODES = ['EARN', 'BALANCED', 'CAREER'] as const

export type StudentWorkMode = typeof STUDENT_WORK_MODES[number]
export type ProgressionSkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
export type TrustConfidence = 'PROVISIONAL' | 'EMERGING' | 'ESTABLISHED' | 'HIGH'

export interface SkillProgressionEvidence {
  verifiedGigs: number
  uniqueClients: number
  averageQuality: number
  reliabilityRate: number
  confidence: TrustConfidence | string
  endorsements: number
  marketMedianKes?: number | null
}

export interface ProgressionGate {
  key: string
  label: string
  current: number
  target: number
  unit: string
  met: boolean
}

export interface CareerProgressionEvidence {
  hasCareerDirection: boolean
  skillCount: number
  highestSkillLevel: ProgressionSkillLevel
  verifiedGigs: number
  uniqueClients: number
  trustScore: number
  confidence: TrustConfidence | string
  endorsements: number
  roadmapProgress: number
  portfolioItems: number
}

export interface ProgressionOpportunity {
  id: string
  title: string
  category?: string | null
  skills?: string[]
  budgetAmount?: number | null
}

const LEVEL_ORDER: ProgressionSkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

const LEVEL_REQUIREMENTS: Record<Exclude<ProgressionSkillLevel, 'BEGINNER'>, {
  verifiedGigs: number
  uniqueClients: number
  averageQuality: number
  reliabilityRate: number
  minimumConfidence?: TrustConfidence
  endorsements?: number
}> = {
  INTERMEDIATE: { verifiedGigs: 3, uniqueClients: 2, averageQuality: 3.5, reliabilityRate: 70 },
  ADVANCED: { verifiedGigs: 8, uniqueClients: 4, averageQuality: 4, reliabilityRate: 85, minimumConfidence: 'EMERGING' },
  EXPERT: { verifiedGigs: 20, uniqueClients: 8, averageQuality: 4.5, reliabilityRate: 90, minimumConfidence: 'HIGH', endorsements: 3 }
}

const CONFIDENCE_ORDER = ['PROVISIONAL', 'EMERGING', 'ESTABLISHED', 'HIGH']
const LEVEL_MULTIPLIER: Record<ProgressionSkillLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 1.2,
  ADVANCED: 1.5,
  EXPERT: 1.9
}

export const WORK_MODE_DETAILS: Record<StudentWorkMode, { label: string; description: string; matchingFocus: string }> = {
  EARN: {
    label: 'Earn now',
    description: 'Prioritise suitable paid work and near-term earnings.',
    matchingFocus: 'Higher-value work that fits skills already demonstrated'
  },
  BALANCED: {
    label: 'Balanced',
    description: 'Balance income with opportunities that build your target career.',
    matchingFocus: 'A mix of earning potential and career-building evidence'
  },
  CAREER: {
    label: 'Build career',
    description: 'Prioritise verified experience, portfolio proof, and skill growth.',
    matchingFocus: 'Work that advances target skills and career-roadmap milestones'
  }
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum))
}

function roundToNearestFifty(value: number) {
  return Math.max(50, Math.round(value / 50) * 50)
}

function confidenceMeets(actual: string, minimum: TrustConfidence) {
  return CONFIDENCE_ORDER.indexOf(String(actual).toUpperCase()) >= CONFIDENCE_ORDER.indexOf(minimum)
}

export function normalizeStudentWorkMode(value: unknown): StudentWorkMode {
  const normalized = String(value ?? '').trim().toUpperCase()
  return STUDENT_WORK_MODES.includes(normalized as StudentWorkMode)
    ? normalized as StudentWorkMode
    : 'BALANCED'
}

function matchingTerms(values: Array<unknown>) {
  return new Set(values
    .flatMap((value) => String(value ?? '').toLowerCase().split(/[^a-z0-9+#.]+/))
    .filter((term) => term.length > 1))
}

export function rankOpportunitiesForStudentMode<T extends ProgressionOpportunity>(
  opportunities: T[],
  input: { mode: StudentWorkMode | string; skills?: string[]; careerPath?: string | null }
) {
  const mode = normalizeStudentWorkMode(input.mode)
  const studentSkills = matchingTerms(input.skills || [])
  const careerTerms = matchingTerms([input.careerPath])
  const maximumBudget = Math.max(1, ...opportunities.map((opportunity) => Number(opportunity.budgetAmount || 0)))
  const weights = mode === 'EARN'
    ? { skill: 0.25, career: 0.1, earnings: 0.65 }
    : mode === 'CAREER'
      ? { skill: 0.55, career: 0.3, earnings: 0.15 }
      : { skill: 0.4, career: 0.2, earnings: 0.4 }

  return opportunities.map((opportunity, originalIndex) => {
    const opportunityTerms = matchingTerms([opportunity.title, opportunity.category, ...(opportunity.skills || [])])
    const skillMatches = [...studentSkills].filter((term) => opportunityTerms.has(term)).length
    const careerMatches = [...careerTerms].filter((term) => opportunityTerms.has(term)).length
    const matchedSkills = (input.skills || []).filter((skill) => (
      [...matchingTerms([skill])].some((term) => opportunityTerms.has(term))
    ))
    const skillFit = studentSkills.size ? Math.min(1, skillMatches / Math.max(1, Math.min(3, studentSkills.size))) : 0
    const careerFit = careerTerms.size ? Math.min(1, careerMatches / Math.max(1, Math.min(3, careerTerms.size))) : 0
    const earningFit = clamp(Number(opportunity.budgetAmount || 0) / maximumBudget, 0, 1)
    const score = skillFit * weights.skill + careerFit * weights.career + earningFit * weights.earnings
    const skillSummary = matchedSkills.slice(0, 2).join(' and ')
    const reason = mode === 'EARN'
      ? earningFit >= skillFit
        ? 'Higher-value opportunity for your Earn now focus'
        : `Paid work matching ${skillSummary || 'your demonstrated skills'}`
      : mode === 'CAREER'
        ? skillFit + careerFit > 0
          ? `Builds ${skillSummary || 'skills aligned to your career direction'}`
          : 'Adds new career evidence outside your existing skills'
        : skillFit + careerFit >= earningFit
          ? `Balances earnings with ${skillSummary || 'relevant career experience'}`
          : 'Balances stronger earning potential with career progression'
    return {
      opportunity,
      originalIndex,
      progressionMatch: {
        mode,
        score: Math.round(score * 100),
        reason,
        matchedSkills,
        signals: {
          skill: Math.round(skillFit * 100),
          career: Math.round(careerFit * 100),
          earnings: Math.round(earningFit * 100)
        }
      }
    }
  }).sort((left, right) => right.progressionMatch.score - left.progressionMatch.score || left.originalIndex - right.originalIndex)
    .map(({ opportunity, progressionMatch }) => ({ ...opportunity, progressionMatch }))
}

export function skillLevelRank(level: ProgressionSkillLevel | string) {
  return Math.max(0, LEVEL_ORDER.indexOf(String(level).toUpperCase() as ProgressionSkillLevel))
}

function gatesForLevel(level: Exclude<ProgressionSkillLevel, 'BEGINNER'>, evidence: SkillProgressionEvidence): ProgressionGate[] {
  const requirements = LEVEL_REQUIREMENTS[level]
  const gates: ProgressionGate[] = [
    { key: 'verifiedGigs', label: 'Verified gigs', current: evidence.verifiedGigs, target: requirements.verifiedGigs, unit: 'gigs', met: evidence.verifiedGigs >= requirements.verifiedGigs },
    { key: 'uniqueClients', label: 'Distinct clients', current: evidence.uniqueClients, target: requirements.uniqueClients, unit: 'clients', met: evidence.uniqueClients >= requirements.uniqueClients },
    { key: 'averageQuality', label: 'Average quality', current: evidence.averageQuality, target: requirements.averageQuality, unit: '/5', met: evidence.averageQuality >= requirements.averageQuality },
    { key: 'reliabilityRate', label: 'Reliable delivery', current: evidence.reliabilityRate, target: requirements.reliabilityRate, unit: '%', met: evidence.reliabilityRate >= requirements.reliabilityRate }
  ]
  if (requirements.minimumConfidence) {
    gates.push({
      key: 'confidence',
      label: `${requirements.minimumConfidence.toLowerCase()} confidence`,
      current: confidenceMeets(evidence.confidence, requirements.minimumConfidence) ? 1 : 0,
      target: 1,
      unit: '',
      met: confidenceMeets(evidence.confidence, requirements.minimumConfidence)
    })
  }
  if (requirements.endorsements) {
    gates.push({ key: 'endorsements', label: 'Client endorsements', current: evidence.endorsements, target: requirements.endorsements, unit: 'endorsements', met: evidence.endorsements >= requirements.endorsements })
  }
  return gates
}

export function resolveEarnedSkillLevel(evidence: SkillProgressionEvidence): ProgressionSkillLevel {
  if (gatesForLevel('ADVANCED', evidence).every((gate) => gate.met)) return 'ADVANCED'
  if (gatesForLevel('INTERMEDIATE', evidence).every((gate) => gate.met)) return 'INTERMEDIATE'
  return 'BEGINNER'
}

export function buildSkillProgress(level: ProgressionSkillLevel | string, evidence: SkillProgressionEvidence) {
  const normalizedLevel = LEVEL_ORDER.includes(String(level).toUpperCase() as ProgressionSkillLevel)
    ? String(level).toUpperCase() as ProgressionSkillLevel
    : 'BEGINNER'
  const currentIndex = skillLevelRank(normalizedLevel)
  const nextLevel = LEVEL_ORDER[currentIndex + 1] ?? null
  const gates = nextLevel ? gatesForLevel(nextLevel as Exclude<ProgressionSkillLevel, 'BEGINNER'>, evidence) : []
  const rawProgress = gates.length
    ? gates.reduce((sum, gate) => sum + Math.min(1, gate.target ? gate.current / gate.target : 1), 0) / gates.length * 100
    : 100
  const allMet = gates.every((gate) => gate.met)
  const requiresReview = nextLevel === 'EXPERT'
  const progressPercent = nextLevel ? Math.round(allMet ? 100 : Math.min(99, rawProgress)) : 100
  const marketBase = Math.max(100, Number(evidence.marketMedianKes || 1000))
  const trustPremium = 1 + clamp((evidence.reliabilityRate - 70) / 30, 0, 1) * 0.15
  const suggestedMidpoint = marketBase * LEVEL_MULTIPLIER[normalizedLevel] * trustPremium

  return {
    level: normalizedLevel,
    levelNumber: currentIndex + 1,
    nextLevel,
    progressPercent,
    readyToAdvance: Boolean(nextLevel && allMet && !requiresReview),
    eligibleForReview: Boolean(nextLevel && allMet && requiresReview),
    requiresReview,
    gates,
    missingRequirements: gates.filter((gate) => !gate.met).map((gate) => gate.label),
    recommendedRate: {
      currency: 'KES',
      minimum: roundToNearestFifty(suggestedMidpoint * 0.85),
      maximum: roundToNearestFifty(suggestedMidpoint * 1.15),
      basis: evidence.marketMedianKes ? 'Verified category market median, skill level, and reliability' : 'Starter market guide, skill level, and reliability',
      advisory: true
    }
  }
}

const CAREER_STAGES = [
  { key: 'EXPLORE_FOUNDATION', label: 'Explore & Foundation', shortLabel: 'Explore', requirements: (e: CareerProgressionEvidence) => [e.hasCareerDirection ? 1 : 0, Math.min(1, e.skillCount / 1), Math.min(1, Math.max(e.roadmapProgress, e.portfolioItems ? 25 : 0) / 25)] },
  { key: 'BUILD_APPLY', label: 'Build & Apply', shortLabel: 'Build', requirements: (e: CareerProgressionEvidence) => [Math.min(1, e.verifiedGigs / 3), Math.min(1, e.uniqueClients / 2), Math.min(1, e.portfolioItems / 1), Math.min(1, skillLevelRank(e.highestSkillLevel) / 1)] },
  { key: 'GROW_SPECIALIZE', label: 'Grow & Specialise', shortLabel: 'Grow', requirements: (e: CareerProgressionEvidence) => [Math.min(1, e.verifiedGigs / 8), Math.min(1, e.uniqueClients / 4), Math.min(1, skillLevelRank(e.highestSkillLevel) / 2), confidenceMeets(e.confidence, 'EMERGING') ? 1 : 0] },
  { key: 'LEAD_IMPACT', label: 'Lead & Create Impact', shortLabel: 'Lead', requirements: (e: CareerProgressionEvidence) => [Math.min(1, e.verifiedGigs / 20), Math.min(1, e.uniqueClients / 8), Math.min(1, e.trustScore / 75), confidenceMeets(e.confidence, 'ESTABLISHED') ? 1 : 0] },
  { key: 'ADVANCE_MENTOR', label: 'Advance & Mentor', shortLabel: 'Mentor', requirements: (e: CareerProgressionEvidence) => [Math.min(1, e.verifiedGigs / 35), Math.min(1, e.uniqueClients / 12), Math.min(1, e.endorsements / 5), Math.min(1, skillLevelRank(e.highestSkillLevel) / 3), Math.min(1, e.trustScore / 85), confidenceMeets(e.confidence, 'HIGH') ? 1 : 0] }
] as const

export function buildCareerStageProgress(evidence: CareerProgressionEvidence) {
  const stageProgress = CAREER_STAGES.map((stage) => {
    const ratios = stage.requirements(evidence)
    const complete = ratios.every((ratio) => ratio >= 1)
    return { ...stage, progressPercent: Math.round(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length * 100), complete }
  })
  const currentIndex = Math.min(
    stageProgress.findIndex((stage) => !stage.complete) === -1 ? stageProgress.length - 1 : stageProgress.findIndex((stage) => !stage.complete),
    stageProgress.length - 1
  )
  return stageProgress.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    shortLabel: stage.shortLabel,
    number: index + 1,
    progressPercent: stage.progressPercent,
    status: index < currentIndex || (index === currentIndex && stage.complete) ? 'COMPLETED' : index === currentIndex ? 'IN_PROGRESS' : 'LOCKED',
    isCurrent: index === currentIndex
  }))
}
