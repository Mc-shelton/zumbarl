import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const opportunities = createPrismaRecordRepository('opportunities')
const bids = createPrismaRecordRepository('bids')
const invites = createPrismaRecordRepository('opportunityInvites')
const projects = createPrismaRecordRepository('projects')
const deliverables = createPrismaRecordRepository('deliverables')
const reviews = createPrismaRecordRepository('reviews')
const reviewEvents = createPrismaRecordRepository('reviewEvents')

class EarnWorkflowsRepository {
  listPublishedOpportunities(query: Record<string, unknown>) {
    return opportunities.list(query, (opportunity) => opportunity.status === 'published' || opportunity.visibility === 'public')
  }

  findOpportunity(id: string) {
    return opportunities.findById(id)
  }

  updateOpportunity(id: string, patch: Record<string, any>) {
    return opportunities.updateById(id, patch)
  }

  listStudentBids(studentId: string | undefined, query: Record<string, unknown>) {
    return bids.list(query, (bid) => !studentId || bid.studentId === studentId)
  }

  createBid(payload: Record<string, any>) {
    return bids.create(payload)
  }

  acceptInvite(id: string) {
    return invites.updateById(id, { status: 'accepted', acceptedAt: new Date().toISOString() })
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
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionBids = createRepository('bids')
      const opportunity = await transactionOpportunities.findById(opportunityId)
      if (!opportunity) return null

      const bid = await transactionBids.create({ ...payload, opportunityId, studentId, status: 'submitted' })
      await transactionOpportunities.updateById(opportunityId, { applicants: (opportunity.applicants ?? 0) + 1 })
      return { bid, opportunity }
    })
  }

  submitBidWithEvent(opportunityId: string, studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionBids = createRepository('bids')
      const transactionReviewEvents = createRepository('reviewEvents')
      const opportunity = await transactionOpportunities.findById(opportunityId)
      if (!opportunity) return null

      const bid = await transactionBids.create({ ...payload, opportunityId, studentId, status: 'submitted' })
      await transactionOpportunities.updateById(opportunityId, { applicants: (opportunity.applicants ?? 0) + 1 })
      await transactionReviewEvents.create({
        scope: 'bid',
        action: 'submitted',
        bidId: bid.id,
        opportunityId,
        studentId
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
