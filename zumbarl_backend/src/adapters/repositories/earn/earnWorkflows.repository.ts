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
    qualificationQuestions: opportunity.qualificationQuestions ?? [],
    preferredQualifications: opportunity.preferredQualifications,
    portfolioRequired: opportunity.portfolioRequired,
    screeningFocus: opportunity.screeningFocus,
    bidderInstructions: opportunity.bidderInstructions,
    requiredAttachments: (opportunity.requiredAttachments ?? []).map((attachment: Record<string, any>) => ({
      id: attachment.id,
      label: attachment.label,
      fileType: attachment.fileType,
      required: attachment.required,
      sortOrder: attachment.sortOrder
    })),
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
        company: true,
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
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

  async acceptInvite(id: string, studentId?: string) {
    const invite = await prisma.opportunityInvite.findFirst({ where: studentId ? { id, studentId } : { id } })
    if (!invite) return null
    return prisma.opportunityInvite.update({ where: { id }, data: { status: 'accepted', acceptedAt: new Date(), respondedAt: new Date() } })
  }

  async declineInvite(id: string, studentId?: string) {
    const invite = await prisma.opportunityInvite.findFirst({ where: studentId ? { id, studentId } : { id } })
    if (!invite) return null
    return prisma.opportunityInvite.update({ where: { id }, data: { status: 'declined', respondedAt: new Date() } })
  }

  async listStudentInvites(studentId: string | undefined, query: Record<string, unknown>) {
    if (!studentId) return pageEnvelope([], query)
    const items = await prisma.opportunityInvite.findMany({
      where: { studentId },
      include: { opportunity: { include: { company: true } } },
      orderBy: { sentAt: 'desc' }
    })

    return pageEnvelope(items.map((item) => ({
      ...item,
      sentAt: toIso(item.sentAt),
      acceptedAt: toIso(item.acceptedAt),
      respondedAt: toIso(item.respondedAt),
      createdAt: toIso(item.createdAt),
      updatedAt: toIso(item.updatedAt),
      opportunity: toOpportunityCard(item.opportunity)
    })), query)
  }

  async listStudentInterviews(studentId: string | undefined, query: Record<string, unknown>) {
    if (!studentId) return pageEnvelope([], query)
    const items = await prisma.opportunityInterview.findMany({
      where: { studentId },
      include: { bid: { include: { opportunity: { include: { company: true } } } } },
      orderBy: { scheduledAt: 'asc' }
    })

    return pageEnvelope(items.map((interview) => ({
      id: interview.id,
      bidId: interview.bidId,
      opportunityId: interview.opportunityId,
      interviewType: interview.interviewType,
      scheduledAt: toIso(interview.scheduledAt),
      durationMinutes: interview.durationMinutes,
      timezone: interview.timezone,
      meetingOption: interview.meetingOption,
      meetingUrl: interview.meetingUrl,
      note: interview.note,
      status: interview.status,
      proposedAt: toIso(interview.proposedAt),
      respondedAt: toIso(interview.respondedAt),
      opportunity: {
        id: interview.bid.opportunity.id,
        title: interview.bid.opportunity.title,
        company: interview.bid.opportunity.company?.name || interview.bid.opportunity.companyName
      }
    })), query)
  }

  async readStudentInterview(id: string, studentId: string | undefined) {
    if (!studentId) return null
    const interview = await prisma.opportunityInterview.findFirst({
      where: { id, studentId },
      include: {
        bid: {
          include: {
            opportunity: { include: { company: true } },
            student: true
          }
        }
      }
    })
    if (!interview) return null

    return {
      ...interview,
      scheduledAt: toIso(interview.scheduledAt),
      proposedAt: toIso(interview.proposedAt),
      respondedAt: toIso(interview.respondedAt),
      createdAt: toIso(interview.createdAt),
      updatedAt: toIso(interview.updatedAt),
      opportunity: {
        id: interview.bid.opportunity.id,
        title: interview.bid.opportunity.title,
        company: interview.bid.opportunity.company?.name || interview.bid.opportunity.companyName
      }
    }
  }

  respondToStudentInterview(id: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (!studentId) return null
      const interview = await transaction.opportunityInterview.findFirst({
        where: { id, studentId },
        include: {
          bid: {
            include: {
              opportunity: { include: { company: true } },
              student: { include: { user: true } }
            }
          }
        }
      })
      if (!interview) return null

      const status = payload.action === 'rsvp'
        ? 'confirmed'
        : payload.action === 'propose_new_time'
          ? 'proposed_new_time'
          : 'cancelled'
      const updated = await transaction.opportunityInterview.update({
        where: { id: interview.id },
        data: {
          status,
          studentResponseNote: payload.note,
          proposedAt: payload.proposedAt ? new Date(payload.proposedAt) : null,
          respondedAt: new Date()
        }
      })
      const contacts = await transaction.companyContact.findMany({
        where: { companyId: interview.bid.opportunity.companyId },
        include: { user: true }
      })
      const studentName = `${interview.bid.student.firstName} ${interview.bid.student.lastName}`.trim()
      const responseLabel = status === 'confirmed'
        ? 'confirmed the interview'
        : status === 'proposed_new_time'
          ? 'suggested a new interview time'
          : 'cancelled the interview'

      await Promise.all(contacts.map((contact) => transaction.notification.create({
        data: {
          userId: contact.userId,
          type: 'INTERVIEW_RESPONSE',
          title: `Interview response: ${studentName}`,
          body: `${studentName} ${responseLabel} for ${interview.bid.opportunity.title}.`,
          data: {
            opportunityId: interview.bid.opportunityId,
            bidId: interview.bidId,
            interviewId: interview.id,
            response: status,
            deepLink: '/business/opportunities'
          },
          sentVia: ['IN_APP', 'EMAIL']
        }
      })))
      await transaction.opportunityActivityEvent.create({
        data: {
          action: `interview_${status}`,
          opportunityId: interview.opportunityId,
          actorId: interview.bid.student.userId,
          note: payload.note,
          metadata: {
            bidId: interview.bidId,
            interviewId: interview.id,
            proposedAt: payload.proposedAt
          }
        }
      })

      return {
        interview: {
          ...updated,
          scheduledAt: toIso(updated.scheduledAt),
          proposedAt: toIso(updated.proposedAt),
          respondedAt: toIso(updated.respondedAt)
        },
        recipients: contacts.map((contact) => ({
          email: contact.user.email,
          name: contact.user.name || contact.user.email
        })),
        studentName,
        opportunityTitle: interview.bid.opportunity.title,
        responseLabel
      }
    })
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
      const existingBid = await transaction.bid.findUnique({
        where: { opportunityId_studentId: { opportunityId, studentId } }
      })

      const bid = await transaction.bid.upsert({
        where: { opportunityId_studentId: { opportunityId, studentId } },
        update: {
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { pricingType: payload.pricingType },
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
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { pricingType: payload.pricingType },
          status: 'submitted'
        }
      })
      if (!existingBid) {
        await transaction.opportunity.update({ where: { id: opportunityId }, data: { applicants: { increment: 1 } } })
      }
      return { bid, opportunity }
    })
  }

  submitBidWithEvent(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      if (!studentId) return null
      const opportunity = await transaction.opportunity.findUnique({ where: { id: opportunityId } })
      if (!opportunity) return null
      const existingBid = await transaction.bid.findUnique({
        where: { opportunityId_studentId: { opportunityId, studentId } }
      })

      const bid = await transaction.bid.upsert({
        where: { opportunityId_studentId: { opportunityId, studentId } },
        update: {
          proposal: payload.proposal,
          bidAmount: payload.amount,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { pricingType: payload.pricingType },
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
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { pricingType: payload.pricingType },
          status: 'submitted'
        }
      })
      if (!existingBid) {
        await transaction.opportunity.update({ where: { id: opportunityId }, data: { applicants: { increment: 1 } } })
      }
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
