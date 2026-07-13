import { ApiError, notFound } from '../../../lib/http.js'
import { sendTransactionalEmail } from '../../notification/index.js'
import { earnWorkflowsRepository } from '../../repositories/earn/index.js'

function listEarnOpportunitiesService(query: Record<string, unknown>) {
  return earnWorkflowsRepository.listPublishedOpportunities(query)
}

function listStudentBidsService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentBids(studentId, query)
}

async function submitOpportunityBidService(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
  const opportunity = await earnWorkflowsRepository.findOpportunity(opportunityId) ?? notFound('Opportunity')
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
  return await earnWorkflowsRepository.submitProjectDeliverable(projectId, studentId, payload) ?? notFound('Project')
}

async function readStudentTrustSnapshotService(studentId: string | undefined) {
  const [approvedDeliverables, reviews] = await Promise.all([
    earnWorkflowsRepository.listApprovedDeliverables(studentId),
    earnWorkflowsRepository.listStudentReviews(studentId)
  ])
  const approved = approvedDeliverables.length
  return {
    studentId,
    score: Math.min(100, 60 + approved * 8 + reviews.length * 4),
    approvedProjects: approved,
    reviews
  }
}

export {
  listEarnOpportunitiesService,
  listStudentBidsService,
  submitOpportunityBidService,
  acceptOpportunityInviteService,
  declineOpportunityInviteService,
  listStudentInvitesService,
  listStudentInterviewsService,
  readStudentInterviewService,
  respondToStudentInterviewService,
  listStudentProjectsService,
  submitProjectDeliverableService,
  readStudentTrustSnapshotService
}
