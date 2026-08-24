import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import type { AuthUser } from '../../../lib/security.js'
import { learnRoadmapsRepository } from '../../repositories/learn/index.js'

function requireStudentId(studentId?: string) {
  if (!studentId) forbidden('A student profile is required')
  return studentId
}

function publicAssessment(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((question: Record<string, any>) => ({
    id: question.id,
    prompt: question.prompt,
    options: Array.isArray(question.options) ? question.options : []
  }))
}

function mapLadder(roadmap: Record<string, any>) {
  return {
    id: roadmap.id,
    slug: roadmap.slug,
    title: roadmap.title,
    summary: roadmap.description,
    careerFamily: roadmap.careerFamily,
    tier: roadmap.level,
    estimatedWeeks: roadmap.estimatedWeeks,
    skills: roadmap.steps.flatMap((step: Record<string, any>) => step.competencies.map((link: Record<string, any>) => link.competency.name)).filter((name: string, index: number, values: string[]) => values.indexOf(name) === index),
    outcomes: roadmap.outcomes,
    intents: roadmap.intents,
    weights: { evidence: roadmap.evidenceWeight, test: roadmap.testWeight },
    verificationThreshold: roadmap.verificationThreshold,
    checkpoints: roadmap.steps.map((step: Record<string, any>, index: number) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      level: `Level ${index + 1}`,
      stepType: step.stepType,
      required: step.required,
      sortOrder: step.sortOrder,
      evidenceType: step.evidenceType,
      estimatedHours: step.estimatedHours,
      competencies: step.competencies.map((link: Record<string, any>) => ({
        id: link.competency.id,
        name: link.competency.name,
        slug: link.competency.slug,
        level: link.competency.level,
        requiredScore: link.requiredScore,
        skill: link.competency.skill ? { id: link.competency.skill.id, name: link.competency.skill.name, slug: link.competency.skill.slug } : null
      })),
      resources: step.resources.map((link: Record<string, any>) => ({
        id: link.resource.id,
        title: link.resource.title,
        description: link.resource.description,
        type: link.resource.resourceType,
        url: link.resource.url,
        provider: link.resource.provider,
        content: link.resource.content,
        practice: link.resource.practice
      })),
      prerequisiteStepIds: step.prerequisites.map((link: Record<string, any>) => link.prerequisiteStepId),
      assessment: publicAssessment(step.assessment)
    }))
  }
}

function mapEnrollment(enrollment: Record<string, any>) {
  const ladder = mapLadder(enrollment.roadmap)
  const progressByStep = new Map(enrollment.stepProgress.map((progress: Record<string, any>) => [progress.stepId, progress]))
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    roadmapId: enrollment.roadmapId,
    ladderId: enrollment.roadmap.slug,
    intent: enrollment.intent,
    status: enrollment.status,
    locked: Boolean(enrollment.lockedAt),
    lockedAt: enrollment.lockedAt,
    verified: Boolean(enrollment.verifiedAt),
    verifiedAt: enrollment.verifiedAt,
    progressPercent: enrollment.progressPercent,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    evidence: enrollment.evidence.map((item: Record<string, any>) => ({
      id: item.id,
      checkpointId: item.stepId,
      competencyId: item.competencyId,
      source: item.sourceType,
      sourceId: item.sourceId,
      note: item.note,
      status: item.verificationStatus,
      scoreAwarded: item.scoreAwarded,
      createdAt: item.createdAt
    })),
    assessmentAttempts: enrollment.assessmentAttempts.map((attempt: Record<string, any>) => ({
      id: attempt.id,
      checkpointId: attempt.stepId,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt
    })),
    practiceSubmissions: enrollment.practiceSubmissions.map((submission: Record<string, any>) => ({
      id: submission.id,
      checkpointId: submission.stepId,
      resourceId: submission.resourceId,
      status: submission.status,
      submittedAt: submission.submittedAt
    })),
    ladder,
    checkpoints: ladder.checkpoints.map((checkpoint: Record<string, any>) => {
      const progress = progressByStep.get(checkpoint.id) as Record<string, any> | undefined
      const evidenceScore = progress?.evidenceScore ?? 0
      const testScore = progress?.testScore ?? 0
      return {
        ...checkpoint,
        status: (progress?.status ?? 'LOCKED').toLowerCase(),
        evidenceScore,
        testScore,
        score: evidenceScore + testScore,
        completedAt: progress?.completedAt ?? null
      }
    })
  }
}

async function listCareerLaddersService() {
  return { data: (await learnRoadmapsRepository.listLadders()).map(mapLadder) }
}

async function readLearnBaselineService(studentId?: string) {
  return await learnRoadmapsRepository.readBaseline(requireStudentId(studentId)) ?? notFound('Student profile')
}

async function listRoadmapsService(studentId: string | undefined, query: Record<string, unknown>) {
  const resolvedStudentId = requireStudentId(studentId)
  const result = await learnRoadmapsRepository.listRoadmaps(resolvedStudentId, query)
  const synchronized = await Promise.all(result.data.map((enrollment) => (
    learnRoadmapsRepository.syncVerifiedActivityEvidence(enrollment.id, resolvedStudentId)
  )))
  return { ...result, data: synchronized.flatMap((enrollment) => enrollment ? [mapEnrollment(enrollment)] : []) }
}

async function readRoadmapService(id: string, studentId?: string) {
  const enrollment = await learnRoadmapsRepository.syncVerifiedActivityEvidence(id, requireStudentId(studentId)) ?? notFound('Roadmap enrollment')
  return mapEnrollment(enrollment)
}

async function createRoadmapService(studentId: string | undefined, payload: Record<string, any>) {
  const ladder = await learnRoadmapsRepository.findLadder(payload.ladderId) ?? notFound('Career ladder')
  const resolvedStudentId = requireStudentId(studentId)
  const enrollment = await learnRoadmapsRepository.createEnrollment(resolvedStudentId, ladder.id, payload.intent)
  const synchronized = await learnRoadmapsRepository.syncVerifiedActivityEvidence(enrollment.id, resolvedStudentId)
  return mapEnrollment(synchronized || enrollment)
}

async function lockRoadmapService(id: string, studentId?: string) {
  const enrollment = await learnRoadmapsRepository.lockEnrollment(id, requireStudentId(studentId)) ?? notFound('Roadmap enrollment')
  return mapEnrollment(enrollment)
}

async function addRoadmapEvidenceService(id: string, actor: AuthUser | undefined, payload: Record<string, any>) {
  const studentId = requireStudentId(actor?.studentId)
  const evidence = await learnRoadmapsRepository.createEvidence(id, studentId, payload, actor?.id) ?? notFound('Roadmap enrollment or checkpoint')
  return {
    id: evidence.id,
    checkpointId: evidence.stepId,
    status: evidence.verificationStatus,
    scoreAwarded: evidence.scoreAwarded,
    message: 'Evidence submitted for verification. It will not affect readiness until it is approved.'
  }
}

async function submitLearningPracticeService(id: string, actor: AuthUser | undefined, payload: Record<string, any>) {
  const studentId = requireStudentId(actor?.studentId)
  const result = await learnRoadmapsRepository.createPracticeSubmission(id, studentId, payload, actor?.id) ?? notFound('Roadmap checkpoint resource')
  return {
    id: result.submission.id,
    checkpointId: result.submission.stepId,
    resourceId: result.submission.resourceId,
    status: result.submission.status,
    evidence: {
      id: result.evidence.id,
      status: result.evidence.verificationStatus,
      scoreAwarded: result.evidence.scoreAwarded
    },
    message: 'Practice submitted as evidence for review.'
  }
}

async function verifyRoadmapEvidenceService(evidenceId: string, actor: AuthUser | undefined, payload: Record<string, any>) {
  if (!actor?.id) forbidden('A reviewer account is required')
  const evidence = await learnRoadmapsRepository.verifyEvidence(evidenceId, actor.id, payload.score) ?? notFound('Roadmap evidence')
  return evidence
}

async function completeCheckpointTestService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const resolvedStudentId = requireStudentId(studentId)
  const enrollment = await learnRoadmapsRepository.findStudentEnrollment(id, resolvedStudentId) ?? notFound('Roadmap enrollment')
  const step = enrollment.roadmap.steps.find((item) => item.id === payload.checkpointId) ?? notFound('Roadmap checkpoint')
  const questions = Array.isArray(step.assessment) ? step.assessment as Array<Record<string, any>> : []
  if (!questions.length) throw new ApiError(409, 'This checkpoint does not have an assessment yet', 'ASSESSMENT_NOT_AVAILABLE')
  const answers = new Map((payload.answers as Array<Record<string, string>>).map((answer) => [answer.questionId, answer.answer]))
  const correct = questions.filter((question) => answers.get(question.id) === question.correctAnswer).length
  const score = Math.round((correct / questions.length) * enrollment.roadmap.testWeight)
  const recorded = await learnRoadmapsRepository.recordAssessmentAttempt(
    id,
    resolvedStudentId,
    step.id,
    score,
    correct,
    questions.length,
    payload.answers
  ) ?? notFound('Roadmap enrollment')
  const updatedEnrollment = recorded.enrollment ?? notFound('Roadmap enrollment')
  return {
    attemptId: recorded.attempt.id,
    score,
    total: enrollment.roadmap.testWeight,
    correct,
    questions: questions.length,
    roadmap: mapEnrollment(updatedEnrollment)
  }
}

async function verifyRoadmapService(id: string, studentId?: string) {
  const result = await learnRoadmapsRepository.verifyEnrollment(id, requireStudentId(studentId)) ?? notFound('Roadmap enrollment')
  return { ...result, roadmap: mapEnrollment(result.roadmap) }
}

async function listRoadmapRecommendationsService(id: string, studentId?: string) {
  const recommendations = await learnRoadmapsRepository.listRecommendedOpportunities(id, requireStudentId(studentId)) ?? notFound('Roadmap enrollment')
  return { data: recommendations }
}

async function listTransitionPoolsService() {
  return { data: await learnRoadmapsRepository.listVerifiedRoadmaps() }
}

export {
  addRoadmapEvidenceService,
  completeCheckpointTestService,
  createRoadmapService,
  listCareerLaddersService,
  listRoadmapRecommendationsService,
  listRoadmapsService,
  listTransitionPoolsService,
  lockRoadmapService,
  readRoadmapService,
  readLearnBaselineService,
  submitLearningPracticeService,
  verifyRoadmapEvidenceService,
  verifyRoadmapService
}
