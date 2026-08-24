import { prisma } from '../../../lib/prisma.js'
import { pageEnvelope } from '../../../lib/http.js'

const roadmapGraphInclude = {
  steps: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      competencies: { include: { competency: { include: { skill: true } } } },
      resources: { orderBy: { sortOrder: 'asc' as const }, include: { resource: true } },
      prerequisites: { include: { prerequisiteStep: true } }
    }
  }
}

const enrollmentGraphInclude = {
  roadmap: { include: roadmapGraphInclude },
  stepProgress: true,
  evidence: { orderBy: { createdAt: 'desc' as const } },
  assessmentAttempts: { orderBy: { completedAt: 'desc' as const } },
  practiceSubmissions: { orderBy: { submittedAt: 'desc' as const } }
}

class LearnRoadmapsRepository {
  listLadders() {
    return prisma.careerRoadmap.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      include: roadmapGraphInclude
    })
  }

  findLadder(ladderId: string) {
    return prisma.careerRoadmap.findFirst({
      where: { OR: [{ id: ladderId }, { slug: ladderId }], status: 'PUBLISHED' },
      include: roadmapGraphInclude
    })
  }

  async readBaseline(studentId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        studentSkills: { include: { skill: true } },
        _count: { select: { portfolioItems: true, endorsementsReceived: true, posts: true, bids: true } }
      }
    })
    if (!student) return null
    return {
      studentId,
      skills: student.studentSkills.map((item) => ({
        id: item.skill.id,
        name: item.skill.name,
        slug: item.skill.slug,
        level: item.level,
        verifiedByGigs: item.verifiedByGigs
      })),
      evidenceSummary: {
        portfolioItems: student._count.portfolioItems,
        endorsements: student._count.endorsementsReceived,
        posts: student._count.posts,
        bids: student._count.bids
      },
      generatedAt: new Date().toISOString()
    }
  }

  async listRoadmaps(studentId: string, query: Record<string, unknown>) {
    const enrollments = await prisma.studentRoadmapEnrollment.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: enrollmentGraphInclude
    })
    return pageEnvelope(enrollments, query)
  }

  findEnrollment(id: string) {
    return prisma.studentRoadmapEnrollment.findUnique({ where: { id }, include: enrollmentGraphInclude })
  }

  findStudentEnrollment(id: string, studentId: string) {
    return prisma.studentRoadmapEnrollment.findFirst({ where: { id, studentId }, include: enrollmentGraphInclude })
  }

  async createEnrollment(studentId: string, roadmapId: string, intent: string) {
    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentRoadmapEnrollment.upsert({
        where: { studentId_roadmapId: { studentId, roadmapId } },
        update: { intent, status: 'IN_PROGRESS' },
        create: { studentId, roadmapId, intent, status: 'IN_PROGRESS' }
      })
      const steps = await tx.careerRoadmapStep.findMany({ where: { roadmapId }, orderBy: { sortOrder: 'asc' } })
      for (const [index, step] of steps.entries()) {
        await tx.studentRoadmapStepProgress.upsert({
          where: { enrollmentId_stepId: { enrollmentId: enrollment.id, stepId: step.id } },
          update: {},
          create: { enrollmentId: enrollment.id, stepId: step.id, status: index === 0 ? 'ACTIVE' : 'LOCKED' }
        })
      }
      return tx.studentRoadmapEnrollment.findUniqueOrThrow({ where: { id: enrollment.id }, include: enrollmentGraphInclude })
    })
  }

  async lockEnrollment(id: string, studentId: string) {
    const existing = await prisma.studentRoadmapEnrollment.findFirst({ where: { id, studentId } })
    if (!existing) return null
    return prisma.studentRoadmapEnrollment.update({
      where: { id },
      data: { lockedAt: new Date() },
      include: enrollmentGraphInclude
    })
  }

  async createEvidence(id: string, studentId: string, payload: Record<string, any>, submittedByUserId?: string) {
    const enrollment = await prisma.studentRoadmapEnrollment.findFirst({
      where: { id, studentId },
      include: { roadmap: { include: { steps: true } } }
    })
    if (!enrollment || !enrollment.roadmap.steps.some((step) => step.id === payload.checkpointId)) return null
    return prisma.roadmapEvidence.create({
      data: {
        enrollmentId: id,
        stepId: payload.checkpointId,
        studentId,
        competencyId: payload.competencyId,
        sourceType: payload.source,
        sourceId: payload.sourceId,
        note: payload.note,
        verificationStatus: 'PENDING',
        scoreAwarded: 0,
        submittedByUserId
      }
    })
  }

  async createPracticeSubmission(id: string, studentId: string, payload: Record<string, any>, submittedByUserId?: string) {
    const enrollment = await prisma.studentRoadmapEnrollment.findFirst({ where: { id, studentId } })
    if (!enrollment) return null
    const stepResource = await prisma.careerRoadmapStepResource.findFirst({
      where: { stepId: payload.checkpointId, resourceId: payload.resourceId, step: { roadmapId: enrollment.roadmapId } }
    })
    if (!stepResource) return null
    return prisma.$transaction(async (tx) => {
      const submission = await tx.learningPracticeSubmission.create({
        data: {
          enrollmentId: id,
          stepId: payload.checkpointId,
          resourceId: payload.resourceId,
          studentId,
          responses: JSON.parse(JSON.stringify(payload.responses))
        }
      })
      const evidence = await tx.roadmapEvidence.create({
        data: {
          enrollmentId: id,
          stepId: payload.checkpointId,
          studentId,
          competencyId: payload.competencyId,
          sourceType: 'LEARNING_PRACTICE',
          sourceId: submission.id,
          note: payload.reflection,
          verificationStatus: 'PENDING',
          scoreAwarded: 0,
          submittedByUserId
        }
      })
      return { submission, evidence }
    })
  }

  async syncVerifiedActivityEvidence(id: string, studentId: string) {
    const enrollment = await this.findStudentEnrollment(id, studentId)
    if (!enrollment) return null
    const [submissions, campaignProofs, portfolioItems, endorsements] = await Promise.all([
      prisma.opportunitySubmission.findMany({
        where: { studentId, status: { in: ['approved', 'accepted', 'completed'] } },
        include: { opportunity: { include: { opportunitySkills: { include: { skill: true } } } } }
      }),
      prisma.marketingCampaignProof.findMany({
        where: { studentId, status: { in: ['verified_screenshot', 'approved', 'accepted', 'verified'] } },
        include: { campaign: true }
      }),
      prisma.portfolioItem.findMany({
        where: { studentId, OR: [{ metricsVerified: true }, { clientFeedback: { not: null } }, { opportunityId: { not: null } }] }
      }),
      prisma.endorsement.findMany({ where: { studentId } })
    ])
    const endorsedOpportunityIds = endorsements.flatMap((item) => item.opportunityId ? [item.opportunityId] : [])
    const endorsedOpportunities = endorsedOpportunityIds.length
      ? await prisma.opportunity.findMany({
          where: { id: { in: endorsedOpportunityIds } },
          include: { opportunitySkills: { include: { skill: true } } }
        })
      : []
    const endorsedOpportunityById = new Map(endorsedOpportunities.map((item) => [item.id, item]))
    const candidates = [
      ...submissions.map((item) => ({
        sourceType: 'OPPORTUNITY_SUBMISSION',
        sourceId: item.id,
        score: 30,
        note: `Approved work: ${item.title || item.opportunity.title}`,
        terms: [item.title, item.description, item.opportunity.title, item.opportunity.category, ...item.opportunity.opportunitySkills.map((link) => link.skill.name)]
      })),
      ...campaignProofs.map((item) => ({
        sourceType: 'CAMPAIGN_PROOF',
        sourceId: item.id,
        score: 24,
        note: `Verified campaign proof: ${item.campaign.title}`,
        terms: [item.campaign.title, item.campaign.type, item.campaign.description, item.reach || item.engagement ? 'analytics metrics reporting' : '', item.screenshots.length ? 'campaign assets design' : '']
      })),
      ...portfolioItems.map((item) => ({
        sourceType: 'PORTFOLIO',
        sourceId: item.id,
        score: item.metricsVerified ? 24 : 18,
        note: `Verified portfolio work: ${item.title}`,
        terms: [item.title, item.description, item.category, item.clientFeedback]
      })),
      ...endorsements.map((item) => {
        const opportunity = item.opportunityId ? endorsedOpportunityById.get(item.opportunityId) : null
        return {
          sourceType: 'ENDORSEMENT',
          sourceId: item.id,
          score: 20,
          note: `Business endorsement from ${item.endorsedByName}`,
          terms: [item.note, opportunity?.title, opportunity?.category, ...(opportunity?.opportunitySkills.map((link) => link.skill.name) || [])]
        }
      })
    ]
    const aliases: Record<string, string[]> = {
      'content-strategy': ['content', 'campaign', 'social media', 'brand voice', 'audience'],
      canva: ['canva', 'design', 'asset', 'creative', 'graphic'],
      analytics: ['analytics', 'metric', 'report', 'reach', 'engagement', 'performance']
    }
    const matchesCompetency = (candidate: typeof candidates[number], competencyLink: Record<string, any>) => {
      const haystack = candidate.terms.filter(Boolean).join(' ').toLowerCase()
      const skillSlug = competencyLink.competency.skill?.slug || ''
      const needles = [competencyLink.competency.name, competencyLink.competency.skill?.name, ...(aliases[skillSlug] || [])]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
      return needles.some((needle) => haystack.includes(needle))
    }
    await prisma.$transaction(async (tx) => {
      for (const step of enrollment.roadmap.steps) {
        for (const candidate of candidates) {
          const competencyLink = step.competencies.find((link) => matchesCompetency(candidate, link))
          if (!competencyLink) continue
          await tx.roadmapEvidence.upsert({
            where: {
              enrollmentId_stepId_sourceType_sourceId: {
                enrollmentId: id,
                stepId: step.id,
                sourceType: candidate.sourceType,
                sourceId: candidate.sourceId
              }
            },
            update: {
              competencyId: competencyLink.competency.id,
              note: candidate.note,
              verificationStatus: 'VERIFIED',
              scoreAwarded: candidate.score
            },
            create: {
              enrollmentId: id,
              stepId: step.id,
              studentId,
              competencyId: competencyLink.competency.id,
              sourceType: candidate.sourceType,
              sourceId: candidate.sourceId,
              note: candidate.note,
              verificationStatus: 'VERIFIED',
              scoreAwarded: candidate.score,
              verifiedAt: new Date()
            }
          })
        }
        const aggregate = await tx.roadmapEvidence.aggregate({
          where: { enrollmentId: id, stepId: step.id, verificationStatus: 'VERIFIED' },
          _sum: { scoreAwarded: true }
        })
        await tx.studentRoadmapStepProgress.update({
          where: { enrollmentId_stepId: { enrollmentId: id, stepId: step.id } },
          data: { evidenceScore: Math.min(enrollment.roadmap.evidenceWeight, aggregate._sum.scoreAwarded ?? 0) }
        })
        for (const link of step.competencies) {
          const competencyAggregate = await tx.roadmapEvidence.aggregate({
            where: { studentId, competencyId: link.competency.id, verificationStatus: 'VERIFIED' },
            _sum: { scoreAwarded: true }
          })
          const evidenceScore = Math.min(enrollment.roadmap.evidenceWeight, competencyAggregate._sum.scoreAwarded ?? 0)
          await tx.studentCompetencyState.upsert({
            where: { studentId_competencyId: { studentId, competencyId: link.competency.id } },
            update: { evidenceScore, status: evidenceScore > 0 ? 'EVIDENCE_VERIFIED' : 'NOT_STARTED', lastCalculatedAt: new Date() },
            create: { studentId, competencyId: link.competency.id, evidenceScore, status: evidenceScore > 0 ? 'EVIDENCE_VERIFIED' : 'NOT_STARTED' }
          })
        }
      }
    })
    return this.recalculateEnrollment(id, studentId)
  }

  async verifyEvidence(evidenceId: string, reviewerUserId: string, score: number) {
    const verified = await prisma.$transaction(async (tx) => {
      const evidence = await tx.roadmapEvidence.findUnique({
        where: { id: evidenceId },
        include: { enrollment: { include: { roadmap: true } } }
      })
      if (!evidence) return null
      await tx.roadmapEvidence.update({
        where: { id: evidenceId },
        data: {
          verificationStatus: 'VERIFIED',
          scoreAwarded: Math.min(evidence.enrollment.roadmap.evidenceWeight, Math.max(0, score)),
          verifiedByUserId: reviewerUserId,
          verifiedAt: new Date()
        }
      })
      const aggregate = await tx.roadmapEvidence.aggregate({
        where: { enrollmentId: evidence.enrollmentId, stepId: evidence.stepId, verificationStatus: 'VERIFIED' },
        _sum: { scoreAwarded: true }
      })
      await tx.studentRoadmapStepProgress.update({
        where: { enrollmentId_stepId: { enrollmentId: evidence.enrollmentId, stepId: evidence.stepId } },
        data: { evidenceScore: Math.min(evidence.enrollment.roadmap.evidenceWeight, aggregate._sum.scoreAwarded ?? 0) }
      })
      if (evidence.competencyId) {
        const competencyAggregate = await tx.roadmapEvidence.aggregate({
          where: { studentId: evidence.studentId, competencyId: evidence.competencyId, verificationStatus: 'VERIFIED' },
          _sum: { scoreAwarded: true }
        })
        const evidenceScore = Math.min(evidence.enrollment.roadmap.evidenceWeight, competencyAggregate._sum.scoreAwarded ?? 0)
        await tx.studentCompetencyState.upsert({
          where: { studentId_competencyId: { studentId: evidence.studentId, competencyId: evidence.competencyId } },
          update: { evidenceScore, status: evidenceScore > 0 ? 'EVIDENCE_VERIFIED' : 'NOT_STARTED', lastCalculatedAt: new Date() },
          create: { studentId: evidence.studentId, competencyId: evidence.competencyId, evidenceScore, status: 'EVIDENCE_VERIFIED' }
        })
      }
      return tx.roadmapEvidence.findUnique({ where: { id: evidenceId } })
    })
    if (verified) await this.recalculateEnrollment(verified.enrollmentId, verified.studentId)
    return verified
  }

  async recordAssessmentAttempt(
    id: string,
    studentId: string,
    stepId: string,
    score: number,
    correctAnswers: number,
    totalQuestions: number,
    answers: Array<Record<string, string>>
  ) {
    const enrollment = await prisma.studentRoadmapEnrollment.findFirst({ where: { id, studentId }, include: { roadmap: true } })
    if (!enrollment) return null
    const assessmentScore = Math.min(enrollment.roadmap.testWeight, Math.max(0, score))
    const attempt = await prisma.$transaction(async (tx) => {
      const progress = await tx.studentRoadmapStepProgress.findUniqueOrThrow({
        where: { enrollmentId_stepId: { enrollmentId: id, stepId } }
      })
      const bestScore = Math.max(progress.testScore, assessmentScore)
      const createdAttempt = await tx.roadmapAssessmentAttempt.create({
        data: {
          enrollmentId: id,
          stepId,
          studentId,
          answers,
          score: assessmentScore,
          correctAnswers,
          totalQuestions,
          assessmentVersion: enrollment.roadmap.version
        }
      })
      await tx.studentRoadmapStepProgress.update({
        where: { enrollmentId_stepId: { enrollmentId: id, stepId } },
        data: { testScore: bestScore }
      })
      const links = await tx.careerRoadmapStepCompetency.findMany({ where: { stepId } })
      for (const link of links) {
        await tx.studentCompetencyState.upsert({
          where: { studentId_competencyId: { studentId, competencyId: link.competencyId } },
          update: { assessmentScore: bestScore, lastCalculatedAt: new Date() },
          create: { studentId, competencyId: link.competencyId, assessmentScore: bestScore, status: bestScore > 0 ? 'ASSESSMENT_STARTED' : 'NOT_STARTED' }
        })
      }
      return createdAttempt
    })
    return { attempt, enrollment: await this.recalculateEnrollment(id, studentId) }
  }

  async recalculateEnrollment(id: string, studentId: string) {
    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentRoadmapEnrollment.findFirst({ where: { id, studentId }, include: enrollmentGraphInclude })
      if (!enrollment) return null
      const requiredSteps = enrollment.roadmap.steps.filter((step) => step.required)
      const progressByStep = new Map(enrollment.stepProgress.map((item) => [item.stepId, item]))
      let unlocked = true
      let completedCount = 0
      for (const step of enrollment.roadmap.steps) {
        const progress = progressByStep.get(step.id)
        if (!progress) continue
        const total = progress.evidenceScore + progress.testScore
        const complete = total >= enrollment.roadmap.verificationThreshold
        const status = complete ? 'COMPLETED' : unlocked ? 'ACTIVE' : 'LOCKED'
        if (complete && step.required) completedCount += 1
        if (progress.status !== status && (status === 'ACTIVE' || status === 'COMPLETED')) {
          await tx.roadmapStageTransition.create({
            data: {
              enrollmentId: id,
              fromStepId: progress.status === 'ACTIVE' ? step.id : null,
              toStepId: status === 'ACTIVE' ? step.id : null,
              reason: status === 'COMPLETED' ? 'CHECKPOINT_SCORE_REACHED' : 'PREREQUISITES_COMPLETED',
              score: total
            }
          })
        }
        await tx.studentRoadmapStepProgress.update({
          where: { id: progress.id },
          data: { status, completedAt: complete ? progress.completedAt ?? new Date() : null }
        })
        unlocked = unlocked && complete
      }
      const progressPercent = requiredSteps.length ? Math.round((completedCount / requiredSteps.length) * 100) : 0
      const nextActiveStep = enrollment.roadmap.steps.find((step) => {
        const progress = progressByStep.get(step.id)
        return progress && progress.evidenceScore + progress.testScore < enrollment.roadmap.verificationThreshold
      })
      await tx.studentRoadmapEnrollment.update({
        where: { id },
        data: {
          progressPercent,
          currentStepOrder: nextActiveStep?.sortOrder ?? enrollment.roadmap.steps.length,
          completedStepIds: enrollment.stepProgress.filter((item) => item.evidenceScore + item.testScore >= enrollment.roadmap.verificationThreshold).map((item) => item.stepId)
        }
      })
      return tx.studentRoadmapEnrollment.findUniqueOrThrow({ where: { id }, include: enrollmentGraphInclude })
    })
  }

  async verifyEnrollment(id: string, studentId: string) {
    const enrollment = await this.recalculateEnrollment(id, studentId)
    if (!enrollment) return null
    const requiredStepIds = new Set(enrollment.roadmap.steps.filter((step) => step.required).map((step) => step.id))
    const complete = enrollment.stepProgress
      .filter((progress) => requiredStepIds.has(progress.stepId))
      .every((progress) => progress.evidenceScore + progress.testScore >= enrollment.roadmap.verificationThreshold)
    if (!complete) return { verified: false as const, reason: 'checkpoint_scores_incomplete', roadmap: enrollment }
    const updated = await prisma.studentRoadmapEnrollment.update({
      where: { id },
      data: { status: 'COMPLETED', verifiedAt: new Date(), completedAt: new Date(), progressPercent: 100 },
      include: enrollmentGraphInclude
    })
    return { verified: true as const, roadmap: updated }
  }

  async listRecommendedOpportunities(enrollmentId: string, studentId: string) {
    const enrollment = await this.findStudentEnrollment(enrollmentId, studentId)
    if (!enrollment) return null
    const activeStepIds = enrollment.stepProgress.filter((item) => item.status === 'ACTIVE').map((item) => item.stepId)
    const activeSteps = enrollment.roadmap.steps.filter((step) => activeStepIds.includes(step.id))
    const competencies = activeSteps.flatMap((step) => step.competencies.map((link) => link.competency))
    const competencyIds = competencies.map((item) => item.id)
    const skillIds = competencies.flatMap((item) => item.skillId ? [item.skillId] : [])
    const opportunities = await prisma.opportunity.findMany({
      where: {
        AND: [
          {
            OR: [
              { opportunityCompetencies: { some: { competencyId: { in: competencyIds } } } },
              { opportunitySkills: { some: { skillId: { in: skillIds } } } }
            ]
          },
          {
            OR: [
              { status: 'published', visibility: 'public' },
              { bids: { some: { studentId, projectId: { not: null } } } }
            ]
          }
        ]
      },
      include: {
        company: { select: { name: true } },
        opportunityCompetencies: { include: { competency: true } },
        opportunitySkills: { include: { skill: true } },
        bids: {
          where: { studentId },
          orderBy: { appliedAt: 'desc' },
          select: { id: true, status: true, projectId: true }
        }
      },
      take: 12
    })
    const wanted = new Set([...competencyIds, ...skillIds])
    const ranked = opportunities.map((opportunity) => {
      const matchedCompetencies = opportunity.opportunityCompetencies.filter((link) => wanted.has(link.competencyId)).map((link) => link.competency.name)
      const matchedSkills = opportunity.opportunitySkills.filter((link) => wanted.has(link.skillId)).map((link) => link.skill.name)
      const reasons = [...new Set([...matchedCompetencies, ...matchedSkills])]
      const bid = opportunity.bids[0] ?? null
      const engagementState = bid?.projectId
        ? 'active_project'
        : bid ? 'applied' : 'available'
      return {
        id: opportunity.id,
        title: opportunity.title,
        companyName: opportunity.companyName || opportunity.company.name,
        opportunityType: opportunity.opportunityType,
        budgetAmount: opportunity.budgetAmount,
        currency: opportunity.currency,
        matchScore: Math.min(100, 55 + reasons.length * 15),
        reasons,
        engagementState,
        bidId: bid?.id ?? null,
        projectId: bid?.projectId ?? null
      }
    })
    const engagementPriority: Record<string, number> = { active_project: 2, applied: 1, available: 0 }
    const deduplicated = new Map<string, (typeof ranked)[number]>()
    for (const item of ranked) {
      const key = `${item.title.toLowerCase()}::${item.companyName.toLowerCase()}`
      const current = deduplicated.get(key)
      if (!current
        || engagementPriority[item.engagementState] > engagementPriority[current.engagementState]
        || (engagementPriority[item.engagementState] === engagementPriority[current.engagementState] && item.matchScore > current.matchScore)) {
        deduplicated.set(key, item)
      }
    }
    return [...deduplicated.values()].sort((left, right) => right.matchScore - left.matchScore)
  }

  listVerifiedRoadmaps() {
    return prisma.studentRoadmapEnrollment.findMany({
      where: { status: 'COMPLETED', verifiedAt: { not: null } },
      include: {
        student: { include: { user: { select: { name: true, username: true } } } },
        roadmap: true,
        stepProgress: true
      },
      orderBy: { verifiedAt: 'desc' }
    })
  }
}

const learnRoadmapsRepository = new LearnRoadmapsRepository()

export { LearnRoadmapsRepository, learnRoadmapsRepository }
