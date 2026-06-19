import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'

const opportunities = createPrismaRecordRepository('opportunities')
const bids = createPrismaRecordRepository('bids')
const invites = createPrismaRecordRepository('opportunityInvites')
const projects = createPrismaRecordRepository('projects')
const deliverables = createPrismaRecordRepository('deliverables')
const reviews = createPrismaRecordRepository('reviews')
const reviewEvents = createPrismaRecordRepository('reviewEvents')

class EarnWorkflowsRepository {
  async listPublishedOpportunities(query: Record<string, unknown>) {
    const gigs = await prisma.gig.findMany({
      where: { status: 'OPEN' },
      include: {
        company: true,
        applications: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return pageEnvelope(gigs.map((gig) => ({
      id: gig.id,
      title: gig.title,
      company: gig.company.name,
      companyDescription: gig.company.description,
      opportunityType: gig.gigType.replaceAll('_', ' ').toLowerCase(),
      engagementMode: gig.gigMode.toLowerCase(),
      category: gig.gigType.replaceAll('_', ' ').toLowerCase(),
      status: 'published',
      budget: `KES ${Math.round(gig.budgetMax).toLocaleString('en-KE')}`,
      budgetAmount: gig.budgetMax,
      budgetMin: gig.budgetMin,
      budgetMax: gig.budgetMax,
      currency: gig.currency,
      paymentTerms: 'project',
      summary: gig.description,
      skills: gig.requiredSkills.join(', '),
      requiredSkills: gig.requiredSkills,
      applicants: gig.applications.length,
      duration: gig.estimatedHours ? `${gig.estimatedHours} hours estimated` : 'Timeline to agree',
      deadline: gig.deadline.toISOString(),
      publishedAt: gig.createdAt.toISOString().slice(0, 10),
      locationCity: gig.locationCity,
      isPhysical: gig.isPhysical,
      maxApplicants: gig.maxApplicants,
      requiredTierMin: gig.requiredTierMin,
      overview: gig.description,
      responsibilities: [
        'Review the business brief and submit a clear proposal.',
        'Agree scope, deliverables, and timing with the business before work starts.',
        'Submit work through Zumbarl for review and payment release.'
      ],
      requirements: [
        `${gig.requiredTierMin.toLowerCase()} tier or higher`,
        ...gig.requiredSkills
      ],
      source: 'database-gig'
    })), query)
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
