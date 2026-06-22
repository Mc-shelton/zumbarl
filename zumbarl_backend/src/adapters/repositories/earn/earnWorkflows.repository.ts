import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'

const projects = createPrismaRecordRepository('projects')
const deliverables = createPrismaRecordRepository('deliverables')
const reviews = createPrismaRecordRepository('reviews')
const reviewEvents = createPrismaRecordRepository('reviewEvents')

function toIso(value: Date | string | null | undefined) {
  if (!value) return value
  return value instanceof Date ? value.toISOString() : value
}

function toOpportunityCard(opportunity: Record<string, any>) {
  return {
    id: opportunity.id,
    title: opportunity.title,
    company: opportunity.companyName ?? opportunity.company?.name,
    companyDescription: opportunity.companyDescription ?? opportunity.company?.description,
    image: opportunity.opportunitySplash?.url ?? opportunity.opportunitySplash?.previewUrl,
    previewImage: opportunity.opportunitySplash?.url ?? opportunity.opportunitySplash?.previewUrl,
    opportunityType: opportunity.opportunityType,
    engagementMode: opportunity.engagementMode ?? opportunity.mode,
    category: opportunity.category,
    status: opportunity.status,
    budget: opportunity.budgetLabel ?? `KES ${Math.round(opportunity.budgetAmount ?? 0).toLocaleString('en-KE')}`,
    budgetAmount: opportunity.budgetAmount,
    currency: opportunity.currency,
    paymentTerms: opportunity.paymentTerms,
    summary: opportunity.summary,
    description: opportunity.description,
    skills: Array.isArray(opportunity.skills) ? opportunity.skills.join(', ') : opportunity.skills,
    requiredSkills: opportunity.skills ?? [],
    applicants: opportunity.applicants,
    duration: opportunity.duration,
    deadline: toIso(opportunity.applicationDeadline) ?? opportunity.deadlineLabel,
    publishedAt: toIso(opportunity.publishedAt) ?? toIso(opportunity.createdAt),
    overview: opportunity.description ?? opportunity.summary,
    responsibilities: opportunity.requirements ?? [],
    requirements: opportunity.mustHave ?? [],
    source: 'database-opportunity'
  }
}

class EarnWorkflowsRepository {
  async listPublishedOpportunities(query: Record<string, unknown>) {
    const items = await prisma.opportunity.findMany({
      where: {
        OR: [
          { status: { in: ['published', 'open', 'ready'] } },
          { visibility: 'public' }
        ]
      },
      include: {
        company: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return pageEnvelope(items.map(toOpportunityCard), query)
  }

  findOpportunity(id: string) {
    return prisma.opportunity.findUnique({ where: { id }, include: { company: true, scopeItems: true, requiredAttachments: true } })
  }

  updateOpportunity(id: string, patch: Record<string, any>) {
    return prisma.opportunity.update({ where: { id }, data: patch })
  }

  listStudentBids(studentId: string | undefined, query: Record<string, unknown>) {
    return prisma.bid.findMany({
      where: studentId ? { studentId } : undefined,
      include: { opportunity: { include: { company: true } } },
      orderBy: { appliedAt: 'desc' }
    }).then((items) => pageEnvelope(items.map((item) => ({
      ...item,
      appliedAt: toIso(item.appliedAt),
      respondedAt: toIso(item.respondedAt),
      opportunity: toOpportunityCard(item.opportunity)
    })), query))
  }

  createBid(payload: Record<string, any>) {
    return prisma.bid.create({ data: payload as any })
  }

  acceptInvite(id: string) {
    return prisma.opportunityInvite.update({ where: { id }, data: { status: 'accepted', acceptedAt: new Date(), respondedAt: new Date() } })
  }

  listStudentProjects(studentId: string | undefined, query: Record<string, unknown>) {
    return projects.list(query, (project) => !studentId || project.studentId === studentId)
  }

  findProject(id: string) {
    return projects.findById(id)
  }

  updateProject(id: string, patch: Record<string, any>) {
    return projects.updateById(id, patch)
  }

  createDeliverable(payload: Record<string, any>) {
    return deliverables.create(payload)
  }

  listApprovedDeliverables(studentId: string | undefined) {
    return deliverables.listAll((deliverable) => deliverable.studentId === studentId && deliverable.status === 'approved')
  }

  listStudentReviews(studentId: string | undefined) {
    return reviews.listAll((review) => review.subjectType === 'student' && review.subjectId === studentId)
  }

  createReview(payload: Record<string, any>) {
    return reviews.create(payload)
  }

  createReviewEvent(payload: Record<string, any>) {
    return reviewEvents.create(payload)
  }

  submitBid(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (!studentId) return null
      const opportunity = await transaction.opportunity.findUnique({ where: { id: opportunityId } })
      if (!opportunity) return null

      const bid = await transaction.bid.upsert({
        where: { opportunityId_studentId: { opportunityId, studentId } },
        update: {
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          status: 'submitted',
          appliedAt: new Date()
        },
        create: {
          opportunityId,
          studentId,
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          status: 'submitted'
        }
      })
      await transaction.opportunity.update({ where: { id: opportunityId }, data: { applicants: { increment: 1 } } })
      return { bid, opportunity }
    })
  }

  submitBidWithEvent(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (!studentId) return null
      const opportunity = await transaction.opportunity.findUnique({ where: { id: opportunityId } })
      if (!opportunity) return null

      const bid = await transaction.bid.upsert({
        where: { opportunityId_studentId: { opportunityId, studentId } },
        update: {
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          status: 'submitted',
          appliedAt: new Date()
        },
        create: {
          opportunityId,
          studentId,
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          status: 'submitted'
        }
      })
      await transaction.opportunity.update({ where: { id: opportunityId }, data: { applicants: { increment: 1 } } })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'bid_submitted',
          opportunityId,
          actorId: studentId,
          metadata: {
            scope: 'bid',
            bidId: bid.id,
            studentId
          }
        }
      })
      return { bid, opportunity }
    })
  }

  submitProjectDeliverable(projectId: string, studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionDeliverables = createRepository('deliverables')
      const project = await transactionProjects.findById(projectId)
      if (!project) return null

      const deliverable = await transactionDeliverables.create({ ...payload, projectId, studentId, status: 'submitted', revisionCount: 0 })
      await transactionProjects.updateById(projectId, { status: 'submitted' })
      return deliverable
    })
  }
}

const earnWorkflowsRepository = new EarnWorkflowsRepository()

export {
  EarnWorkflowsRepository,
  earnWorkflowsRepository
}
