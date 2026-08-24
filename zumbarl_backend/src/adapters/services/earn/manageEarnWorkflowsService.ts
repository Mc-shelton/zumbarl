import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { sendTransactionalEmail } from '../../notification/index.js'
import { earnWorkflowsRepository } from '../../repositories/earn/index.js'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'
import { OPPORTUNITY_APPLICABLE_STATUSES, normalizeOpportunityStatus } from '../../../shared/opportunities/opportunityLifecycle.js'
import { readStudentScoreSnapshot } from '../scores/index.js'

function listEarnOpportunitiesService(query: Record<string, unknown>) {
  return earnWorkflowsRepository.listPublishedOpportunities(query)
}

async function readEarnOpportunityService(id: string) {
  return await earnWorkflowsRepository.readPublishedOpportunity(id) ?? notFound('Opportunity')
}

function isOpportunityClosedToApplications(opportunity: Record<string, any>) {
  const metadata = opportunity.metadata
  return Boolean(metadata && typeof metadata === 'object' && !Array.isArray(metadata) && (metadata as Record<string, any>).applicationsClosed)
}

// Work cannot be delivered against a project that has not begun: escrow is
// verified and scope is locked at start, so submissions before it bypass both.
function assertProjectStarted(project: Record<string, any>) {
  if (project.endedAt) {
    throw new ApiError(409, 'This project has ended and can no longer receive submissions.', 'PROJECT_ENDED')
  }
  if (!project.startedAt) {
    throw new ApiError(
      409,
      'The business has not started this project yet, so work cannot be submitted.',
      'PROJECT_NOT_STARTED'
    )
  }
}

function assertOpportunityAcceptsApplications(opportunity: Record<string, any>) {
  const status = normalizeOpportunityStatus(opportunity.status)
  const isPublished = Boolean(opportunity.publishedAt)
    && opportunity.visibility === 'public'
    && OPPORTUNITY_APPLICABLE_STATUSES.includes(status)
  if (!isPublished) {
    throw new ApiError(
      409,
      'This opportunity has not been funded and published yet, so it cannot accept applications.',
      'OPPORTUNITY_NOT_ACCEPTING_APPLICATIONS'
    )
  }
  if (isOpportunityClosedToApplications(opportunity)) {
    throw new ApiError(
      409,
      'This opportunity has already selected its talent and is no longer accepting applications.',
      'OPPORTUNITY_APPLICATIONS_CLOSED'
    )
  }
}

function listStudentBidsService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentBids(studentId, query)
}

async function readOpportunityBidDraftService(opportunityId: string, studentId: string | undefined) {
  const opportunity = await earnWorkflowsRepository.findOpportunity(opportunityId) ?? notFound('Opportunity')
  assertOpportunityAcceptsApplications(opportunity)
  return { draft: await earnWorkflowsRepository.readStudentBidDraft(opportunityId, studentId) }
}

async function saveOpportunityBidDraftService(
  opportunityId: string,
  studentId: string | undefined,
  payload: Record<string, any>
) {
  const opportunity = await earnWorkflowsRepository.findOpportunity(opportunityId) ?? notFound('Opportunity')
  assertOpportunityAcceptsApplications(opportunity)
  const result = await earnWorkflowsRepository.saveStudentBidDraft(opportunityId, studentId, payload)
    ?? notFound('Opportunity')
  if (result.conflict) {
    throw new ApiError(409, 'This application has already been submitted and can no longer be saved as a draft.', 'APPLICATION_ALREADY_SUBMITTED')
  }
  return result.draft
}

async function submitOpportunityBidService(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
  const opportunity = await earnWorkflowsRepository.findOpportunity(opportunityId) ?? notFound('Opportunity')
  assertOpportunityAcceptsApplications(opportunity)
  const answers = Array.isArray(payload.questionAnswers) ? payload.questionAnswers : []
  const missingQuestions = opportunity.qualificationQuestions.filter((question) => (
    !answers.some((item: Record<string, unknown>) => item.question === question && String(item.answer ?? '').trim())
  ))
  if (missingQuestions.length) {
    throw new ApiError(400, `Answer all application questions: ${missingQuestions.join(', ')}`, 'APPLICATION_ANSWERS_REQUIRED')
  }

  const attachments = Array.isArray(payload.attachments) ? payload.attachments : []
  const missingAttachments = opportunity.requiredAttachments
    .filter((requirement) => requirement.required)
    .filter((requirement) => !attachments.some((item: Record<string, unknown>) => (
      item.requirementId === requirement.id && String(item.url ?? '').trim()
    )))
  if (missingAttachments.length) {
    throw new ApiError(
      400,
      `Add all required attachments: ${missingAttachments.map((item) => item.label).join(', ')}`,
      'APPLICATION_ATTACHMENTS_REQUIRED'
    )
  }

  const result = await earnWorkflowsRepository.submitBidWithEvent(opportunityId, studentId, payload) ?? notFound('Opportunity')
  const { bid } = result
  return bid
}

async function acceptOpportunityInviteService(inviteId: string, studentId?: string) {
  return await earnWorkflowsRepository.acceptInvite(inviteId, studentId) ?? notFound('Opportunity invite')
}

async function declineOpportunityInviteService(inviteId: string, studentId?: string) {
  return await earnWorkflowsRepository.declineInvite(inviteId, studentId) ?? notFound('Opportunity invite')
}

function listStudentInvitesService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentInvites(studentId, query)
}

function listStudentInterviewsService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentInterviews(studentId, query)
}

async function readStudentInterviewService(id: string, studentId: string | undefined) {
  return await earnWorkflowsRepository.readStudentInterview(id, studentId) ?? notFound('Interview')
}

async function respondToStudentInterviewService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  const result = await earnWorkflowsRepository.respondToStudentInterview(id, studentId, payload) ?? notFound('Interview')
  const emails = await Promise.all(result.recipients.map((recipient: Record<string, string>) => (
    sendTransactionalEmail(
      recipient.email,
      `Interview response from ${result.studentName}`,
      `<p>Hi ${recipient.name},</p><p>${result.studentName} ${result.responseLabel} for ${result.opportunityTitle}.</p>${payload.note ? `<p>Note: ${payload.note}</p>` : ''}`
    )
  )))
  return { interview: result.interview, emails }
}

function listStudentProjectsService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentProjects(studentId, query)
}

async function submitProjectDeliverableService(projectId: string, studentId: string | undefined, payload: Record<string, any>) {
  const project = await earnWorkflowsRepository.findProjectRecord(projectId) ?? notFound('Project')
  assertProjectStarted(project)
  return await earnWorkflowsRepository.submitProjectDeliverable(projectId, studentId, payload) ?? notFound('Project')
}

async function respondToBidCounterOfferService(bidId: string, studentId: string | undefined, payload: Record<string, any>) {
  const result = await businessWorkflowsRepository.respondToBidCounterOffer(bidId, payload.decision, studentId) ?? notFound('Bid')
  if (result.ok === false) {
    if (result.reason === 'forbidden') forbidden('This offer is not addressed to you')
    throw new ApiError(409, 'This price offer has already been responded to.', 'COUNTER_OFFER_NOT_PENDING')
  }
  return result
}

async function readStudentTrustSnapshotService(studentId: string | undefined) {
  if (!studentId) forbidden('A student profile is required to read this score')
  return readStudentScoreSnapshot(studentId)
}

export {
  listEarnOpportunitiesService,
  readEarnOpportunityService,
  listStudentBidsService,
  readOpportunityBidDraftService,
  saveOpportunityBidDraftService,
  submitOpportunityBidService,
  acceptOpportunityInviteService,
  declineOpportunityInviteService,
  listStudentInvitesService,
  listStudentInterviewsService,
  readStudentInterviewService,
  respondToStudentInterviewService,
  listStudentProjectsService,
  submitProjectDeliverableService,
  respondToBidCounterOfferService,
  readStudentTrustSnapshotService
}
