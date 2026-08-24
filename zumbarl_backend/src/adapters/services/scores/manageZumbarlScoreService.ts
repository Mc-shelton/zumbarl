import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import {
  calculateZumbarlScore,
  type EngagementOutcomeInput,
  type GigCategory,
  type LegacyScorePrior,
  type WeightedOutcome
} from '../../../shared/scores/zumbarlScoreCalculator.js'

const REFRESH_INTERVAL_DAYS = 18

export interface EngagementReviewInput {
  deliveryQualityRating?: number
  briefAdherenceRating?: number
  communicationRating?: number
  conductRating?: number
  clientSatisfactionRating?: number
  wouldHireAgain?: boolean
  publicFeedback?: string
  deadlineOutcome?: 'on_time' | 'student_delay' | 'client_delay'
  submissionCompleteness?: 'complete' | 'partial' | 'missing_major'
}

function jsonObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function clampRating(value: unknown, fallback = 3) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(5, Math.max(1, number)) : fallback
}

function scoreCategory(value: unknown): GigCategory {
  const category = String(value ?? '').toLowerCase()
  if (category.includes('social') || category.includes('content')) return 'SOCIAL_MEDIA'
  if (category.includes('design') || category.includes('graphic')) return 'DESIGN'
  if (category.includes('copy') || category.includes('writing')) return 'COPYWRITING'
  if (category.includes('code') || category.includes('software') || category.includes('developer')) return 'CODE'
  if (category.includes('data')) return 'DATA_ENTRY'
  if (category.includes('sales') || category.includes('marketing')) return 'SALES_MARKETING'
  if (category.includes('errand') || category.includes('delivery')) return 'ERRAND'
  if (category.includes('video')) return 'VIDEO'
  return 'OTHER'
}

function nextRefreshDate(from = new Date()) {
  const date = new Date(from)
  date.setDate(date.getDate() + REFRESH_INTERVAL_DAYS)
  return date
}

function scoreTrend(previousScore: number | null | undefined, currentScore: number) {
  if (previousScore === null || previousScore === undefined) return { velocity: null, direction: null }
  const velocity = Math.round((currentScore - previousScore) * 10) / 10
  return {
    velocity,
    direction: velocity > 0.5 ? 'UP' : velocity < -0.5 ? 'DOWN' : 'FLAT'
  }
}

function migratedPrior(snapshot: {
  createdAt: Date
  effectiveEngagements: number
  uniqueClients: number
  totalEngagements: number
  qualityScore: number
  reliabilityScore: number
  professionalismScore: number
  relationshipScore: number
} | null): LegacyScorePrior | undefined {
  if (!snapshot) return undefined
  const ageMonths = Math.max(0, Date.now() - snapshot.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  return {
    effectiveEngagements: snapshot.effectiveEngagements * Math.pow(0.5, ageMonths / 12),
    uniqueClients: snapshot.uniqueClients,
    totalEngagements: snapshot.totalEngagements,
    qualityScore: snapshot.qualityScore,
    reliabilityScore: snapshot.reliabilityScore,
    professionalismScore: snapshot.professionalismScore,
    relationshipScore: snapshot.relationshipScore
  }
}

export async function refreshStudentScore(studentId: string, reason = 'REFRESH') {
  const [records, current, endorsementCount, baselineSnapshot] = await Promise.all([
    prisma.engagementOutcome.findMany({
      where: { studentId, isVerified: true, isQuarantined: false },
      orderBy: { completedAt: 'asc' }
    }),
    prisma.zumbarlScore.findUnique({ where: { studentId } }),
    prisma.endorsement.count({ where: { studentId } }),
    prisma.scoreSnapshot.findFirst({
      where: { studentId, snapshotReason: 'MIGRATION_BASELINE' },
      orderBy: { createdAt: 'asc' }
    })
  ])

  const priorByClient = new Map<string, number>()
  const outcomes: WeightedOutcome[] = records.map((record) => {
    const priorEngagementsWithSameClient = priorByClient.get(record.companyId) ?? 0
    priorByClient.set(record.companyId, priorEngagementsWithSameClient + 1)
    return {
      input: {
        studentId: record.studentId,
        companyId: record.companyId,
        engagementId: record.opportunityId,
        category: scoreCategory(record.category),
        completedAt: record.completedAt,
        deliveryQualityRating: record.deliveryQualityRating,
        briefAdherenceRating: record.briefAdherenceRating,
        firstPassAccepted: record.firstPassAccepted,
        completedWithinDeadline: record.completedWithinDeadline,
        deadlineMissWasStudentFault: record.deadlineMissWasStudentFault,
        submissionWasComplete: record.submissionWasComplete,
        studentCancelledMidway: record.studentCancelledMidway,
        attributableRevisionCount: record.attributableRevisionCount,
        contractRevisionAllowance: record.contractRevisionAllowance,
        communicationRating: record.communicationRating,
        conductRating: record.conductRating,
        disputeRaised: record.disputeRaised,
        disputeUpheldAgainstStudent: record.disputeUpheldAgainstStudent,
        wouldHireAgain: record.wouldHireAgain,
        isRepeatEngagement: record.isRepeatEngagement,
        clientSatisfactionRating: record.clientSatisfactionRating,
        contractValue: record.contractValueKes,
        categoryMedianValue: record.categoryMedianValueKes,
        isVerified: record.isVerified,
        raterIsCredible: record.raterIsCredible
      } satisfies EngagementOutcomeInput,
      priorEngagementsWithSameClient,
      categoryRubricEvidence: jsonObject(record.categoryRubricEvidence)
    }
  })

  const result = calculateZumbarlScore(outcomes, {
    hasIntegrityFlag: records.some((record) => record.disputeUpheldAgainstStudent),
    isRestricted: current?.isRestricted ?? false,
    isUnderReview: current?.isUnderReview ?? false,
    legacyPrior: migratedPrior(baselineSnapshot)
  })
  const scored = records.length
  // Provisional scores are hidden publicly, but retaining the posterior estimate
  // lets the student see progress and gives matching a useful conservative bound.
  const currentScore = result.overallScore ?? Math.round(
    result.qualityScore * 0.35
      + result.reliabilityScore * 0.30
      + result.professionalismScore * 0.20
      + result.relationshipScore * 0.15
  )
  const avgRating = scored
    ? records.reduce((sum, record) => sum + record.clientSatisfactionRating, 0) / scored
    : 0
  const deliveryRate = scored
    ? records.filter((record) => record.completedWithinDeadline || !record.deadlineMissWasStudentFault).length / scored * 100
    : 0
  const repeatClientRate = scored ? records.filter((record) => record.isRepeatEngagement).length / scored * 100 : 0
  const volumeScore = Math.min(100, result.effectiveEngagements / 20 * 100)
  const trend = scoreTrend(current?.currentScore, currentScore)

  return prisma.$transaction(async (transaction) => {
    const score = await transaction.zumbarlScore.upsert({
      where: { studentId },
      create: {
        studentId,
        currentScore,
        tier: result.tier,
        confidence: result.confidence,
        qualityScore: result.qualityScore,
        volumeScore,
        loyaltyScore: result.relationshipScore,
        trustScore: result.professionalismScore,
        deliveryScore: result.reliabilityScore,
        reliabilityScore: result.reliabilityScore,
        professionalismScore: result.professionalismScore,
        relationshipScore: result.relationshipScore,
        avgRating,
        deliveryRate,
        totalGigsCompleted: result.totalEngagements,
        repeatClientRate,
        endorsementCount,
        effectiveEngagements: result.effectiveEngagements,
        uniqueClients: result.uniqueClients,
        conservativeLowerBound: result.conservativeLowerBound,
        deliveryPenaltyActive: deliveryRate < 70 && scored >= 3,
        qualityGateActive: result.confidence === 'PROVISIONAL',
        isUnderReview: result.isUnderReview,
        isRestricted: result.isRestricted,
        lastRefreshedAt: new Date(),
        nextRefreshAt: nextRefreshDate(),
        refreshCycleDays: REFRESH_INTERVAL_DAYS,
        previousScore: current?.currentScore ?? null,
        scoreVelocity: trend.velocity,
        trendDirection: trend.direction
      },
      update: {
        currentScore,
        tier: result.tier,
        confidence: result.confidence,
        qualityScore: result.qualityScore,
        volumeScore,
        loyaltyScore: result.relationshipScore,
        trustScore: result.professionalismScore,
        deliveryScore: result.reliabilityScore,
        reliabilityScore: result.reliabilityScore,
        professionalismScore: result.professionalismScore,
        relationshipScore: result.relationshipScore,
        avgRating,
        deliveryRate,
        totalGigsCompleted: result.totalEngagements,
        repeatClientRate,
        endorsementCount,
        effectiveEngagements: result.effectiveEngagements,
        uniqueClients: result.uniqueClients,
        conservativeLowerBound: result.conservativeLowerBound,
        deliveryPenaltyActive: deliveryRate < 70 && scored >= 3,
        qualityGateActive: result.confidence === 'PROVISIONAL',
        isUnderReview: result.isUnderReview,
        isRestricted: result.isRestricted,
        lastRefreshedAt: new Date(),
        nextRefreshAt: nextRefreshDate(),
        previousScore: current?.currentScore ?? null,
        scoreVelocity: trend.velocity,
        trendDirection: trend.direction
      }
    })

    await transaction.scoreSnapshot.create({
      data: {
        scoreId: score.id,
        studentId,
        score: currentScore,
        tier: result.tier,
        qualityScore: result.qualityScore,
        volumeScore,
        loyaltyScore: result.relationshipScore,
        trustScore: result.professionalismScore,
        deliveryScore: result.reliabilityScore,
        confidence: result.confidence,
        reliabilityScore: result.reliabilityScore,
        professionalismScore: result.professionalismScore,
        relationshipScore: result.relationshipScore,
        effectiveEngagements: result.effectiveEngagements,
        uniqueClients: result.uniqueClients,
        totalEngagements: result.totalEngagements,
        conservativeLowerBound: result.conservativeLowerBound,
        categoryScores: result.categoryScores as unknown as Prisma.InputJsonValue,
        isUnderReview: result.isUnderReview,
        isRestricted: result.isRestricted,
        snapshotReason: reason
      }
    })

    const categories = result.categoryScores.map((category) => category.category)
    await transaction.studentCategoryScore.deleteMany({
      where: { studentId, ...(categories.length ? { category: { notIn: categories } } : {}) }
    })
    await Promise.all(result.categoryScores.map((category) => transaction.studentCategoryScore.upsert({
      where: { studentId_category: { studentId, category: category.category } },
      create: { studentId, ...category },
      update: { score: category.score, engagements: category.engagements, confidence: category.confidence }
    })))

    return { ...score, categoryScores: result.categoryScores }
  })
}

function buildRubricEvidence(category: GigCategory, hasEvidence: boolean, onTime: boolean) {
  if (category === 'SOCIAL_MEDIA') return { postVerified: hasEvidence, postedOnTime: onTime, metricAchieved: false }
  if (category === 'DESIGN') return { sourceFilesProvided: hasEvidence, sourceFilesRequired: true, formatCorrect: hasEvidence, originalityPassed: false }
  if (category === 'CODE') return { hasCommitHistory: hasEvidence, liveUrlWorks: false, briefChecklistScore: hasEvidence ? 0.5 : 0 }
  if (category === 'COPYWRITING') return { plagiarismScore: 1, wordCountInRange: hasEvidence, aiPolicyRespected: true }
  if (category === 'VIDEO') return { fileDelivered: hasEvidence, formatCorrect: hasEvidence, durationInSpec: false }
  return {}
}

export async function recordCompletedProjectOutcomes(projectId: string, review: EngagementReviewInput = {}) {
  const projectRecord = await prisma.workflowRecord.findUnique({ where: { id: projectId } })
  if (!projectRecord || projectRecord.collection !== 'projects') return []
  const project = jsonObject(projectRecord.data)
  if (String(project.status).toLowerCase() !== 'completed' || !project.opportunityId || !project.businessId) return []

  const [opportunity, payoutRecords, deliverableRecords, tasks] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: String(project.opportunityId) } }),
    prisma.workflowRecord.findMany({ where: { collection: 'payouts' } }),
    prisma.workflowRecord.findMany({ where: { collection: 'deliverables' } }),
    prisma.deliverableTask.findMany({ where: { projectId } })
  ])
  if (!opportunity) return []

  const payouts = payoutRecords.map<Record<string, any>>((record) => ({ id: record.id, ...jsonObject(record.data) }))
    .filter((item) => item.projectId === projectId && item.status === 'paid' && item.studentId)
  const deliverables = deliverableRecords.map<Record<string, any>>((record) => ({ id: record.id, ...jsonObject(record.data) }))
    .filter((item) => item.projectId === projectId && item.status !== 'superseded')
  const contributorIds = [...new Set([
    ...payouts.map((payout) => String(payout.studentId)),
    ...tasks.filter((task) => task.status === 'done' && task.ownerId).map((task) => String(task.ownerId)),
    ...(project.studentId ? [String(project.studentId)] : [])
  ])]
  if (!contributorIds.length) return []

  const category = scoreCategory(opportunity.category ?? opportunity.skills.join(' '))
  const categoryValues = await prisma.engagementOutcome.findMany({
    where: { category, isVerified: true },
    select: { contractValueKes: true }
  })
  const fallbackContract = Number(project.agreedAmount || opportunity.budgetAmount || 0)
  const categoryMedianValue = categoryValues.length
    ? categoryValues.map((item) => item.contractValueKes).sort((a, b) => a - b)[Math.floor(categoryValues.length / 2)]
    : fallbackContract || 1
  const completedAt = project.completedAt ? new Date(project.completedAt) : new Date()
  const deadline = project.deadline ? new Date(project.deadline) : null
  const onTime = !deadline || Number.isNaN(deadline.getTime()) || completedAt <= deadline
  const completedWithinDeadline = review.deadlineOutcome
    ? review.deadlineOutcome === 'on_time'
    : onTime
  const deadlineMissWasStudentFault = review.deadlineOutcome
    ? review.deadlineOutcome === 'student_delay'
    : !onTime

  const recorded = []
  for (const studentId of contributorIds) {
    const studentDeliverables = deliverables.filter((deliverable) => deliverable.studentId === studentId)
    const studentTasks = tasks.filter((task) => task.ownerId === studentId)
    const hasEvidence = studentDeliverables.some((deliverable) => Array.isArray(deliverable.files) && deliverable.files.length > 0)
      || studentTasks.some((task) => Array.isArray(task.evidence) && task.evidence.length > 0)
    const submissionWasComplete = review.submissionCompleteness
      ? review.submissionCompleteness === 'complete'
      : hasEvidence
    const revisionCount = studentDeliverables.reduce((sum, deliverable) => sum + Number(deliverable.revisionCount ?? 0), 0)
    const payoutAmount = payouts.filter((payout) => payout.studentId === studentId)
      .reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0)
    const priorEngagements = await prisma.engagementOutcome.count({
      where: { studentId, companyId: String(project.businessId), opportunityId: { not: opportunity.id } }
    })
    const deliveryQualityRating = clampRating(review.deliveryQualityRating)
    const briefAdherenceRating = clampRating(review.briefAdherenceRating)
    const communicationRating = clampRating(review.communicationRating)
    const conductRating = clampRating(review.conductRating)
    const clientSatisfactionRating = clampRating(review.clientSatisfactionRating)
    const categoryRubricEvidence = buildRubricEvidence(category, hasEvidence, onTime)

    const outcome = await prisma.engagementOutcome.upsert({
      where: { studentId_opportunityId: { studentId, opportunityId: opportunity.id } },
      create: {
        opportunityId: opportunity.id,
        studentId,
        companyId: String(project.businessId),
        projectId,
        category,
        completedAt,
        contractValueKes: payoutAmount || fallbackContract,
        categoryMedianValueKes: categoryMedianValue,
        isVerified: true,
        raterIsCredible: true,
        deliveryQualityRating,
        briefAdherenceRating,
        categoryRubricScore: 0.5,
        firstPassAccepted: revisionCount === 0,
        completedWithinDeadline,
        deadlineMissWasStudentFault,
        submissionWasComplete,
        studentCancelledMidway: false,
        attributableRevisionCount: revisionCount,
        contractRevisionAllowance: opportunity.revisionLimit,
        communicationRating,
        conductRating,
        disputeRaised: false,
        disputeUpheldAgainstStudent: false,
        wouldHireAgain: review.wouldHireAgain ?? true,
        isRepeatEngagement: priorEngagements > 0,
        clientSatisfactionRating,
        publicFeedback: review.publicFeedback,
        categoryRubricEvidence: categoryRubricEvidence as Prisma.InputJsonValue
      },
      update: {
        projectId,
        completedAt,
        contractValueKes: payoutAmount || fallbackContract,
        categoryMedianValueKes: categoryMedianValue,
        isVerified: true,
        deliveryQualityRating,
        briefAdherenceRating,
        firstPassAccepted: revisionCount === 0,
        completedWithinDeadline,
        deadlineMissWasStudentFault,
        submissionWasComplete,
        attributableRevisionCount: revisionCount,
        contractRevisionAllowance: opportunity.revisionLimit,
        communicationRating,
        conductRating,
        wouldHireAgain: review.wouldHireAgain ?? true,
        isRepeatEngagement: priorEngagements > 0,
        clientSatisfactionRating,
        publicFeedback: review.publicFeedback,
        categoryRubricEvidence: categoryRubricEvidence as Prisma.InputJsonValue
      }
    })

    const overallRating = (deliveryQualityRating + briefAdherenceRating + communicationRating + conductRating + clientSatisfactionRating) / 5
    const existingRating = await prisma.opportunityRating.findFirst({ where: { opportunityId: opportunity.id, studentId } })
    const ratingData = {
      communicationScore: communicationRating,
      timeManagementScore: completedWithinDeadline || !deadlineMissWasStudentFault ? 5 : 2,
      skillsScore: (deliveryQualityRating + briefAdherenceRating) / 2,
      deliveryQualityScore: deliveryQualityRating,
      creativityScore: deliveryQualityRating,
      professionalismScore: conductRating,
      overallScore: overallRating,
      briefAdherence: briefAdherenceRating,
      revisionCycles: revisionCount,
      wouldHireAgain: review.wouldHireAgain ?? true,
      publicFeedback: review.publicFeedback
    }
    if (existingRating) {
      await prisma.opportunityRating.update({ where: { id: existingRating.id }, data: ratingData })
    } else {
      await prisma.opportunityRating.create({
        data: { opportunityId: opportunity.id, studentId, companyId: String(project.businessId), ...ratingData }
      })
    }

    await refreshStudentScore(studentId, 'GIG_COMPLETED')
    recorded.push(outcome)
  }
  return recorded
}

export async function readStudentScore(studentId: string) {
  const score = await prisma.zumbarlScore.findUnique({
    where: { studentId },
    include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 12 } }
  })
  const categories = await prisma.studentCategoryScore.findMany({ where: { studentId }, orderBy: { score: 'desc' } })
  return score ? { ...score, categoryScores: categories } : null
}

export async function readStudentScoreSnapshot(studentId: string) {
  const score = await readStudentScore(studentId) ?? await refreshStudentScore(studentId, 'INITIAL_SCORE')
  return {
    studentId,
    score: score.currentScore,
    overallScore: score.confidence === 'PROVISIONAL' ? null : score.currentScore,
    tier: score.tier,
    confidence: score.confidence,
    conservativeLowerBound: score.conservativeLowerBound,
    effectiveEngagements: score.effectiveEngagements,
    uniqueClients: score.uniqueClients,
    totalEngagements: score.totalGigsCompleted,
    subscores: {
      quality: score.qualityScore,
      reliability: score.reliabilityScore,
      professionalism: score.professionalismScore,
      relationship: score.relationshipScore
    },
    categoryScores: score.categoryScores,
    lastRefreshedAt: score.lastRefreshedAt,
    nextRefreshAt: score.nextRefreshAt
  }
}

export async function scheduleDueScoreRefreshes() {
  const due = await prisma.zumbarlScore.findMany({
    where: { nextRefreshAt: { lte: new Date() } },
    select: { studentId: true }
  })
  await Promise.all(due.map(({ studentId }) => refreshStudentScore(studentId, 'SCHEDULED_REFRESH')))
  return due.length
}
