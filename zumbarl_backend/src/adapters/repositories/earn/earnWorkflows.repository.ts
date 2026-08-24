import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { ApiError, pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureProjectDeliverableReference, isSystemGeneratedDeliverable } from '../../../shared/projects/ensureDefaultProjectDeliverable.js'
import { OPPORTUNITY_APPLICABLE_STATUSES } from '../../../shared/opportunities/opportunityLifecycle.js'
import { readMilestoneBudget } from '../../../shared/projects/milestoneBudget.js'
import { deliverableTasksRepository } from '../projects/deliverableTasks.repository.js'

const projects = createPrismaRecordRepository('projects')
const deliverables = createPrismaRecordRepository('deliverables')
const payouts = createPrismaRecordRepository('payouts')
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
    applicationsClosed: Boolean(
      opportunity.metadata && typeof opportunity.metadata === 'object' && !Array.isArray(opportunity.metadata)
        ? opportunity.metadata.applicationsClosed
        : false
    ),
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
        status: { in: OPPORTUNITY_APPLICABLE_STATUSES },
        visibility: 'public',
        publishedAt: { not: null }
      },
      include: {
        company: true,
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return pageEnvelope(items.map(toOpportunityCard), query)
  }

  async readPublishedOpportunity(id: string) {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id,
        status: { in: OPPORTUNITY_APPLICABLE_STATUSES },
        visibility: 'public',
        publishedAt: { not: null }
      },
      include: {
        company: true,
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      }
    })
    return opportunity ? toOpportunityCard(opportunity) : null
  }

  findProjectRecord(id: string) {
    return projects.findById(id)
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

  readStudentBidDraft(opportunityId: string, studentId: string | undefined) {
    if (!studentId) return null
    return prisma.bid.findFirst({
      where: { opportunityId, studentId, status: 'draft' }
    })
  }

  async saveStudentBidDraft(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
    if (!studentId) return null
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } })
    if (!opportunity) return null
    const existingBid = await prisma.bid.findUnique({
      where: { opportunityId_studentId: { opportunityId, studentId } }
    })
    if (existingBid && existingBid.status !== 'draft') {
      return { conflict: true, draft: existingBid }
    }

    const draftData = {
      proposal: payload.proposal || '',
      bidAmount: payload.amount ?? null,
      currency: payload.currency || 'KES',
      deliveryTime: payload.deliveryTime || null,
      intentId: payload.intent,
      intentLabel: payload.intent,
      coverNote: payload.message || null,
      questionAnswers: payload.questionAnswers || [],
      attachments: payload.attachments || [],
      metadata: {
        applicationStepIndex: payload.applicationStepIndex || 0,
        estimatedUnits: payload.estimatedUnits ?? null,
        pricingType: payload.pricingType || 'fixed'
      },
      status: 'draft',
      appliedAt: new Date()
    }
    const draft = await prisma.bid.upsert({
      where: { opportunityId_studentId: { opportunityId, studentId } },
      update: draftData,
      create: {
        ...draftData,
        opportunityId,
        studentId
      }
    })
    return { conflict: false, draft }
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
          currency: payload.currency,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { estimatedUnits: payload.estimatedUnits, pricingType: payload.pricingType },
          status: 'submitted',
          appliedAt: new Date()
        },
        create: {
          opportunityId,
          studentId,
          proposal: payload.proposal,
          bidAmount: payload.amount,
          currency: payload.currency,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { estimatedUnits: payload.estimatedUnits, pricingType: payload.pricingType },
          status: 'submitted'
        }
      })
      if (!existingBid || existingBid.status === 'draft') {
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
          currency: payload.currency,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { estimatedUnits: payload.estimatedUnits ?? null, pricingType: payload.pricingType ?? null },
          status: 'submitted',
          appliedAt: new Date()
        },
        create: {
          opportunityId,
          studentId,
          proposal: payload.proposal,
          bidAmount: payload.amount,
          currency: payload.currency,
          deliveryTime: payload.deliveryTime,
          intentId: payload.intent,
          intentLabel: payload.intent,
          coverNote: payload.message,
          questionAnswers: payload.questionAnswers,
          attachments: payload.attachments,
          metadata: { estimatedUnits: payload.estimatedUnits ?? null, pricingType: payload.pricingType ?? null },
          status: 'submitted'
        }
      })
      if (!existingBid || existingBid.status === 'draft') {
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

  async submitProjectDeliverable(projectId: string, studentId: string | undefined, payload: Record<string, any>) {
    const sourceProject = await projects.findById(projectId)
    if (!sourceProject) return null
    let submissionPayload = { ...payload }
    let scopeReference = null
    let milestoneDeliverable = null
    if (payload.milestoneDeliverableId) {
      milestoneDeliverable = await prisma.milestoneDeliverable.findFirst({
        where: { id: payload.milestoneDeliverableId, projectId }
      })
      if (!milestoneDeliverable || milestoneDeliverable.milestoneId !== payload.milestoneId) {
        throw new ApiError(404, 'Deliverable not found for this milestone', 'MILESTONE_DELIVERABLE_NOT_FOUND')
      }
      submissionPayload = {
        ...submissionPayload,
        milestoneId: milestoneDeliverable.milestoneId,
        milestoneDeliverableId: milestoneDeliverable.id,
        scopeItemLabel: milestoneDeliverable.title
      }
    } else if (!payload.milestoneId) {
      scopeReference = payload.scopeItemId
        ? await prisma.opportunityScopeItem.findFirst({
            where: { id: payload.scopeItemId, opportunityId: sourceProject.opportunityId }
          })
        : await ensureProjectDeliverableReference(sourceProject)
      if (!scopeReference) {
        throw new ApiError(404, 'Deliverable reference not found for this project', 'DELIVERABLE_REFERENCE_NOT_FOUND')
      }
      if (!payload.scopeItemId && !isSystemGeneratedDeliverable(scopeReference)) {
        throw new ApiError(400, 'Choose the deliverable this work belongs to.', 'DELIVERABLE_REFERENCE_REQUIRED')
      }
      submissionPayload = {
        ...submissionPayload,
        scopeItemId: scopeReference.id,
        scopeItemLabel: scopeReference.title
      }
    }

    const result = await runPrismaRecordTransaction(async (createRepository, tx) => {
      const transactionProjects = createRepository('projects')
      const transactionDeliverables = createRepository('deliverables')
      const transactionMilestones = createRepository('milestones')
      const project = await transactionProjects.findById(projectId)
      if (!project) return null

      const milestoneId = submissionPayload.milestoneId ?? null
      const milestoneDeliverableId = submissionPayload.milestoneDeliverableId ?? null
      const scopeItemId = submissionPayload.scopeItemId ?? null
      let milestone = null
      if (milestoneId) {
        milestone = await transactionMilestones.findById(milestoneId)
        if (!milestone || milestone.projectId !== projectId) {
          throw new ApiError(404, 'Milestone not found for this project', 'MILESTONE_NOT_FOUND')
        }
        if (milestone.status !== 'active') {
          throw new ApiError(409, 'This milestone is not open for submission yet', 'MILESTONE_NOT_ACTIVE')
        }
        // Scope added mid-flight can commit more than the milestone holds. Until
        // the business covers it, no further work is accepted against it.
        const milestoneDeliverables = await tx.milestoneDeliverable.findMany({
          where: { projectId, milestoneId }
        })
        if (readMilestoneBudget(milestoneDeliverables, milestone.budgetAmount).isOverCommitted) {
          throw new ApiError(
            409,
            'This milestone has committed more than its budget. The business needs to add funds before more work is submitted.',
            'MILESTONE_OVER_COMMITTED'
          )
        }
      }

      // A deliverable on a team project holds many distinct submissions (tasks):
      // a submission with no revisionOfId is a NEW task; a revision supersedes the
      // specific submission it revises. Whole-project jobs and single-hire tasks
      // keep to one submission chain.
      const scopeDeliverables = await transactionDeliverables.listAll((item) => (
        item.projectId === projectId
        && (item.milestoneId ?? null) === milestoneId
        && (item.milestoneDeliverableId ?? null) === milestoneDeliverableId
        && (item.scopeItemId ?? null) === scopeItemId
      ))
      const isWholeProjectDeliverable = Boolean(scopeReference && isSystemGeneratedDeliverable(scopeReference))
      const taskIds = Array.isArray(payload.taskIds) ? payload.taskIds.map(String) : []
      // Team deliverables may contain several independent task submissions, but
      // a plain second upload with no declared tasks is still a duplicate and
      // must go through the explicit revision chain.
      const allowMultipleTasks = Boolean(sourceProject.isTeamProject)
        && !isWholeProjectDeliverable
        && taskIds.length > 0

      // A completed (paid-out) deliverable/milestone no longer accepts submissions.
      const targetPayouts = await payouts.listAll((item) => (
        item.projectId === projectId
        && (milestoneId ? item.milestoneId === milestoneId : scopeItemId ? item.scopeItemId === scopeItemId : (!item.milestoneId && !item.scopeItemId))
      ))
      if (targetPayouts.length > 0) {
        throw new ApiError(409, 'This deliverable has been completed and can no longer receive submissions.', 'DELIVERABLE_ALREADY_COMPLETED')
      }

      let parentSubmission = null
      if (submissionPayload.revisionOfId) {
        parentSubmission = scopeDeliverables.find((item) => item.id === submissionPayload.revisionOfId) ?? null
        if (!parentSubmission) {
          throw new ApiError(404, 'The submission you are revising was not found', 'DELIVERABLE_REVISION_NOT_FOUND')
        }
        if (parentSubmission.status === 'superseded') {
          throw new ApiError(409, 'Only the latest version of a submission can be revised', 'DELIVERABLE_REVISION_NOT_LATEST')
        }
        if (parentSubmission.status === 'approved') {
          throw new ApiError(409, 'This work has already been approved', 'DELIVERABLE_ALREADY_APPROVED')
        }
        if (!['submitted', 'changes_requested'].includes(String(parentSubmission.status))) {
          throw new ApiError(409, 'This submission cannot be revised in its current state', 'DELIVERABLE_NOT_REVISABLE')
        }
      } else if (!allowMultipleTasks) {
        const latestSubmission = scopeDeliverables[0] ?? null
        if (latestSubmission?.status === 'approved') {
          throw new ApiError(409, 'This work has already been approved', 'DELIVERABLE_ALREADY_APPROVED')
        }
        if (latestSubmission && latestSubmission.status !== 'superseded') {
          if (isWholeProjectDeliverable && latestSubmission.status === 'submitted') {
            throw new ApiError(409, 'This whole-project submission can only be revised after the business requests changes.', 'DELIVERABLE_REVISION_REQUIRES_CHANGES')
          }
          throw new ApiError(409, 'This work has already been submitted. Revise the existing submission instead.', 'DELIVERABLE_REVISION_REQUIRED')
        }
      }

      const isRevision = Boolean(parentSubmission)
      const revisionNumber = parentSubmission ? Number(parentSubmission.revisionNumber ?? 0) + 1 : 0

      const deliverable = await transactionDeliverables.create({
        ...submissionPayload,
        kind: isRevision ? 'revision' : submissionPayload.kind,
        milestoneId,
        milestoneDeliverableId,
        scopeItemId,
        projectId,
        studentId,
        status: 'submitted',
        isRevision,
        revisionOfId: parentSubmission?.id ?? null,
        revisionNumber,
        revisionCount: Number(parentSubmission?.revisionCount ?? 0)
      })

      if (parentSubmission) {
        await transactionDeliverables.updateById(parentSubmission.id, {
          status: 'superseded',
          supersededById: deliverable.id
        })
      }

      if (milestoneDeliverableId) {
        await tx.milestoneDeliverable.update({
          where: { id: milestoneDeliverableId },
          data: { status: 'submitted' }
        })
        await transactionProjects.updateById(projectId, { status: 'execution' })
      } else if (milestoneId) {
        await transactionMilestones.updateById(milestoneId, { submissionStatus: 'submitted' })
      } else if (sourceProject.isTeamProject && scopeItemId) {
        // One member sending their tasks for review does not put the whole
        // deliverable under review for the rest of the team - the others are
        // still working. Their own tasks carry the `submitted` state instead.
        await transactionProjects.updateById(projectId, { status: 'execution' })
      } else {
        await transactionProjects.updateById(projectId, { status: 'submitted' })
      }

      // Carry the student's chosen tasks into the submission: each moves to
      // `submitted` and inherits the submitted files as its evidence.
      if (taskIds.length) {
        await deliverableTasksRepository.attachTasksToSubmission(tx, taskIds, {
          id: deliverable.id,
          projectId,
          scopeItemId: milestoneDeliverableId || scopeItemId,
          files: submissionPayload.files
        })
      }

      // Submitting freezes the workload split for this deliverable so the payout
      // pays what the team agreed while working, not whatever the weights say
      // after the business has already seen the work. No declared tasks means no
      // lock, and the historical equal split still applies.
      if (sourceProject.isTeamProject && (milestoneDeliverableId || scopeItemId)) {
        await deliverableTasksRepository.lockDeliverableSplit(projectId, milestoneDeliverableId || scopeItemId)
      }

      return { deliverable, isRevision, project }
    })

    if (!result) return null
    const businessContact = result.project.businessId
      ? await prisma.companyContact.findFirst({
          where: { companyId: result.project.businessId },
          orderBy: { isOwner: 'desc' },
          select: { userId: true }
        })
      : null
    if (businessContact?.userId) {
      const targetLabel = submissionPayload.scopeItemLabel || (submissionPayload.milestoneId ? 'a milestone' : 'the whole project')
      await prisma.notification.create({
        data: {
          userId: businessContact.userId,
          type: result.isRevision ? 'PROJECT_WORK_REVISED' : 'PROJECT_WORK_SUBMITTED',
          title: result.isRevision ? `Revised work: ${result.project.title}` : `Work submitted: ${result.project.title}`,
          body: result.isRevision
            ? `The student revised ${targetLabel}. The latest version is ready for review.`
            : `The student submitted ${targetLabel} for review.`,
          data: {
            projectId,
            opportunityId: result.project.opportunityId,
            deliverableId: result.deliverable.id,
            isRevision: result.isRevision,
            deepLink: '/business/opportunities'
          },
          sentVia: ['IN_APP']
        }
      })
    }
    return result.deliverable
  }
}

const earnWorkflowsRepository = new EarnWorkflowsRepository()

export {
  EarnWorkflowsRepository,
  earnWorkflowsRepository
}
