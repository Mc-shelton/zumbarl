import { notFound } from '../../../lib/http.js'
import { earnWorkflowsRepository } from '../../repositories/earn/index.js'

function listEarnOpportunitiesService(query: Record<string, unknown>) {
  return earnWorkflowsRepository.listPublishedOpportunities(query)
}

function listStudentBidsService(studentId: string | undefined, query: Record<string, unknown>) {
  return earnWorkflowsRepository.listStudentBids(studentId, query)
}

async function submitOpportunityBidService(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
  const result = await earnWorkflowsRepository.submitBidWithEvent(opportunityId, studentId, payload) ?? notFound('Opportunity')
  const { bid } = result
  return bid
}

async function acceptOpportunityInviteService(inviteId: string) {
  return await earnWorkflowsRepository.acceptInvite(inviteId) ?? notFound('Opportunity invite')
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
  listStudentProjectsService,
  submitProjectDeliverableService,
  readStudentTrustSnapshotService
}
