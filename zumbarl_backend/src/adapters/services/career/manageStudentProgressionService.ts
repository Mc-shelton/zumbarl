import type { PipelineStage, SkillLevel } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import {
  buildCareerStageProgress,
  buildSkillProgress,
  normalizeStudentWorkMode,
  resolveEarnedSkillLevel,
  skillLevelRank,
  WORK_MODE_DETAILS,
  type ProgressionSkillLevel,
  type SkillProgressionEvidence,
  type StudentWorkMode
} from '../../../shared/career/studentProgression.js'

function skillKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9+#.]+/g, '')
}

function categorySkillName(value: unknown) {
  const normalized = String(value ?? '').trim().toUpperCase()
  const labels: Record<string, string> = {
    SOCIAL_MEDIA: 'Social Media',
    DESIGN: 'Graphic Design',
    COPYWRITING: 'Copywriting',
    CODE: 'Software Development',
    DATA_ENTRY: 'Data Entry',
    SALES_MARKETING: 'Sales & Marketing',
    ERRAND: 'Delivery & Errands',
    VIDEO: 'Video Production'
  }
  return labels[normalized] || (normalized === 'OTHER' ? '' : normalized.toLowerCase().replace(/(^|_)([a-z])/g, (_match, spacer, letter) => `${spacer ? ' ' : ''}${letter.toUpperCase()}`))
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  const midpoint = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2
}

function highestLevel(levels: Array<string | null | undefined>): ProgressionSkillLevel {
  return levels.reduce<ProgressionSkillLevel>((highest, level) => (
    skillLevelRank(level || 'BEGINNER') > skillLevelRank(highest)
      ? String(level).toUpperCase() as ProgressionSkillLevel
      : highest
  ), 'BEGINNER')
}

async function loadProgressionEvidence(studentId: string) {
  return prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      zumbarl: true,
      skillLevels: true,
      studentSkills: { include: { skill: { include: { category: true } } } },
      engagementOutcomes: {
        where: { isVerified: true, isQuarantined: false },
        include: {
          opportunity: {
            select: {
              category: true,
              skills: true,
              opportunitySkills: { include: { skill: true } }
            }
          }
        },
        orderBy: { completedAt: 'desc' }
      },
      roadmapEnrollments: { orderBy: { updatedAt: 'desc' } },
      portfolioItems: { select: { id: true } },
      endorsementsReceived: { select: { id: true } }
    }
  })
}

function buildProgression(student: NonNullable<Awaited<ReturnType<typeof loadProgressionEvidence>>>) {
  const score = student.zumbarl
  const nameByKey = new Map<string, string>()
  const storedLevelByKey = new Map<string, ProgressionSkillLevel>()

  for (const stored of student.skillLevels) {
    const key = skillKey(stored.skillName)
    if (!key) continue
    nameByKey.set(key, stored.skillName)
    storedLevelByKey.set(key, highestLevel([storedLevelByKey.get(key), stored.level]))
  }
  for (const stored of student.studentSkills) {
    const key = skillKey(stored.skill.name)
    if (!key) continue
    nameByKey.set(key, stored.skill.name)
    storedLevelByKey.set(key, highestLevel([storedLevelByKey.get(key), stored.level]))
  }

  const outcomesBySkill = new Map<string, typeof student.engagementOutcomes>()
  for (const outcome of student.engagementOutcomes) {
    const opportunityNames = [
      ...outcome.opportunity.opportunitySkills.map((item) => item.skill.name),
      ...outcome.opportunity.skills,
      categorySkillName(outcome.category || outcome.opportunity.category)
    ].filter(Boolean)
    const uniqueKeys = [...new Set(opportunityNames.map(skillKey).filter(Boolean))]
    for (const key of uniqueKeys) {
      if (!nameByKey.has(key)) nameByKey.set(key, opportunityNames.find((name) => skillKey(name) === key) || key)
      outcomesBySkill.set(key, [...(outcomesBySkill.get(key) || []), outcome])
    }
  }

  const skills = [...nameByKey.entries()].map(([key, name]) => {
    const outcomes = outcomesBySkill.get(key) || []
    const clients = new Set(outcomes.map((outcome) => outcome.companyId))
    const averageQuality = outcomes.length
      ? outcomes.reduce((sum, outcome) => sum + (Number(outcome.deliveryQualityRating) + Number(outcome.briefAdherenceRating)) / 2, 0) / outcomes.length
      : 0
    const reliableOutcomes = outcomes.filter((outcome) => outcome.completedWithinDeadline || !outcome.deadlineMissWasStudentFault)
    const evidence: SkillProgressionEvidence = {
      verifiedGigs: outcomes.length,
      uniqueClients: clients.size,
      averageQuality: Math.round(averageQuality * 10) / 10,
      reliabilityRate: outcomes.length ? Math.round(reliableOutcomes.length / outcomes.length * 100) : 0,
      confidence: score?.confidence || 'PROVISIONAL',
      endorsements: student.endorsementsReceived.length,
      marketMedianKes: median(outcomes.map((outcome) => Number(outcome.categoryMedianValueKes)).filter((value) => value > 0))
    }
    const storedLevel = storedLevelByKey.get(key) || 'BEGINNER'
    const earnedLevel = resolveEarnedSkillLevel(evidence)
    const level = highestLevel([storedLevel, earnedLevel])
    return {
      key,
      name,
      category: student.studentSkills.find((item) => skillKey(item.skill.name) === key)?.skill.category?.name || 'General',
      evidence,
      earnedLevel,
      ...buildSkillProgress(level, evidence)
    }
  }).sort((left, right) => (
    skillLevelRank(right.level) - skillLevelRank(left.level)
    || right.evidence.verifiedGigs - left.evidence.verifiedGigs
    || left.name.localeCompare(right.name)
  ))

  const uniqueClients = new Set(student.engagementOutcomes.map((outcome) => outcome.companyId)).size
  const roadmapProgress = student.roadmapEnrollments.length
    ? Math.max(...student.roadmapEnrollments.map((enrollment) => Number(enrollment.progressPercent || 0)))
    : 0
  const stages = buildCareerStageProgress({
    hasCareerDirection: Boolean(student.careerPath?.trim()),
    skillCount: skills.length,
    highestSkillLevel: highestLevel(skills.map((skill) => skill.level)),
    verifiedGigs: student.engagementOutcomes.length,
    uniqueClients,
    trustScore: Number(score?.currentScore || 0),
    confidence: score?.confidence || 'PROVISIONAL',
    endorsements: student.endorsementsReceived.length,
    roadmapProgress,
    portfolioItems: student.portfolioItems.length
  })
  const currentStage = stages.find((stage) => stage.isCurrent) || stages[0]
  const mode = normalizeStudentWorkMode(student.currentMode)
  const leadingSkill = skills[0]
  const recommendations = [
    !student.careerPath?.trim() ? 'Choose a career direction so matching can prioritise relevant work.' : null,
    !skills.length ? 'Add your first target skill to start a measurable progression path.' : null,
    leadingSkill?.missingRequirements[0] ? `${leadingSkill.name}: strengthen ${leadingSkill.missingRequirements[0].toLowerCase()} to move toward ${String(leadingSkill.nextLevel).toLowerCase()}.` : null,
    score?.confidence === 'PROVISIONAL' ? `Complete verified work with ${Math.max(0, 2 - uniqueClients)} more distinct client${Math.max(0, 2 - uniqueClients) === 1 ? '' : 's'} to establish public trust.` : null,
    roadmapProgress < 25 ? 'Start a career roadmap or add portfolio proof to complete the foundation stage.' : null
  ].filter(Boolean).slice(0, 3)

  return {
    mode,
    modeDetails: WORK_MODE_DETAILS[mode],
    availableModes: Object.entries(WORK_MODE_DETAILS).map(([key, details]) => ({ key, ...details })),
    careerStage: currentStage,
    stages,
    skills,
    trust: {
      score: Number(score?.currentScore || 0),
      publicScore: score?.confidence === 'PROVISIONAL' ? null : Number(score?.currentScore || 0),
      tier: score?.tier || 'PROVISIONAL',
      confidence: score?.confidence || 'PROVISIONAL',
      verifiedGigs: student.engagementOutcomes.length,
      uniqueClients,
      endorsements: student.endorsementsReceived.length,
      quality: Math.round(Number(score?.qualityScore || 0)),
      reliability: Math.round(Number(score?.reliabilityScore || 0)),
      professionalism: Math.round(Number(score?.professionalismScore || 0)),
      relationship: Math.round(Number(score?.relationshipScore || 0)),
      explanation: 'Trust is based on verified outcomes, distinct clients, delivery, professionalism, and repeat relationships. Unverified or quarantined evidence is excluded.'
    },
    recommendations
  }
}

export async function readStudentProgressionService(studentId: string) {
  const student = await loadProgressionEvidence(studentId)
  return student ? buildProgression(student) : null
}

export async function refreshStudentProgressionService(studentId: string) {
  const student = await loadProgressionEvidence(studentId)
  if (!student) return null
  const progression = buildProgression(student)
  const storedStages = await prisma.careerStageProgress.findMany({ where: { studentId } })
  const storedStageByKey = new Map(storedStages.map((stage) => [stage.stage, stage]))
  const refreshedAt = new Date()

  await prisma.$transaction(async (tx) => {
    for (const skill of progression.skills) {
      const existing = student.skillLevels.find((item) => skillKey(item.skillName) === skill.key)
      const level = highestLevel([existing?.level, skill.earnedLevel])
      if (existing) {
        await tx.skillLevel_.update({
          where: { id: existing.id },
          data: {
            verifiedByGigs: skill.evidence.verifiedGigs,
            level: level as SkillLevel,
            ...(skillLevelRank(level) > skillLevelRank(existing.level) ? { lastAdvancedAt: new Date() } : {})
          }
        })
      } else {
        await tx.skillLevel_.create({
          data: { studentId, skillName: skill.name, verifiedByGigs: skill.evidence.verifiedGigs, level: level as SkillLevel, lastAdvancedAt: skill.evidence.verifiedGigs ? new Date() : null }
        })
      }
    }
    for (const stage of progression.stages) {
      const storedStage = storedStageByKey.get(stage.key as PipelineStage)
      await tx.careerStageProgress.upsert({
        where: { studentId_stage: { studentId, stage: stage.key as PipelineStage } },
        create: {
          studentId,
          stage: stage.key as PipelineStage,
          status: stage.status,
          progressPercent: stage.progressPercent,
          projectsCompleted: progression.trust.verifiedGigs,
          companiesWorkedWith: progression.trust.uniqueClients,
          startedAt: stage.status === 'LOCKED' ? null : refreshedAt,
          completedAt: stage.status === 'COMPLETED' ? refreshedAt : null
        },
        update: {
          status: stage.status,
          progressPercent: stage.progressPercent,
          projectsCompleted: progression.trust.verifiedGigs,
          companiesWorkedWith: progression.trust.uniqueClients,
          ...(!storedStage?.startedAt && stage.status !== 'LOCKED' ? { startedAt: refreshedAt } : {}),
          ...(!storedStage?.completedAt && stage.status === 'COMPLETED' ? { completedAt: refreshedAt } : {})
        }
      })
    }
  })
  return readStudentProgressionService(studentId)
}

export async function updateStudentProgressionModeService(studentId: string, mode: StudentWorkMode) {
  await prisma.studentProfile.update({ where: { id: studentId }, data: { currentMode: normalizeStudentWorkMode(mode) } })
  return readStudentProgressionService(studentId)
}
