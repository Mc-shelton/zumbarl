import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const businesses = createPrismaRecordRepository('businesses')
const opportunities = createPrismaRecordRepository('opportunities')
const campaigns = createPrismaRecordRepository('campaigns')
const invites = createPrismaRecordRepository('opportunityInvites')
const bids = createPrismaRecordRepository('bids')
const projects = createPrismaRecordRepository('projects')
const escrows = createPrismaRecordRepository('escrows')
const reviewEvents = createPrismaRecordRepository('reviewEvents')

class BusinessWorkflowsRepository {
  listBusinessOpportunities(businessId: string | undefined, query: Record<string, unknown>) {
    return opportunities.list(query, (opportunity) => !businessId || opportunity.businessId === businessId)
  }

  listBusinessProjects(businessId: string | undefined) {
    return projects.listAll((project) => !businessId || project.businessId === businessId)
  }

  listBusinessCampaigns(businessId: string | undefined) {
    return campaigns.listAll((campaign) => !businessId || campaign.businessId === businessId)
  }

  findBusinessProfile(id?: string) {
    return id ? businesses.findById(id) : null
  }

  updateBusinessProfile(id: string, patch: Record<string, any>) {
    return businesses.updateById(id, patch)
  }

  createOpportunity(payload: Record<string, any>) {
    return opportunities.create(payload)
  }

  findOpportunity(id: string) {
    return opportunities.findById(id)
  }

  updateOpportunity(id: string, patch: Record<string, any>) {
    return opportunities.updateById(id, patch)
  }

  createOpportunityInvite(payload: Record<string, any>) {
    return invites.create(payload)
  }

  listOpportunityBids(opportunityId: string) {
    return bids.listAll((bid) => bid.opportunityId === opportunityId)
  }

  findBid(id: string) {
    return bids.findById(id)
  }

  updateBid(id: string, patch: Record<string, any>) {
    return bids.updateById(id, patch)
  }

  createProject(payload: Record<string, any>) {
    return projects.create(payload)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  createReviewEvent(payload: Record<string, any>) {
    return reviewEvents.create(payload)
  }

  createOpportunityWithEvent(payload: Record<string, any>, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionReviewEvents = createRepository('reviewEvents')
      const opportunity = await transactionOpportunities.create(payload)
      await transactionReviewEvents.create({
        scope: 'opportunity',
        action: 'created',
        opportunityId: opportunity.id,
        actorId
      })
      return opportunity
    })
  }

  publishOpportunityWithEvent(id: string, patch: Record<string, any>, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionReviewEvents = createRepository('reviewEvents')
      const opportunity = await transactionOpportunities.updateById(id, patch)
      if (!opportunity) return null

      await transactionReviewEvents.create({
        scope: 'opportunity',
        action: 'published',
        opportunityId: id,
        actorId
      })
      return opportunity
    })
  }

  fundOpportunity(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionEscrows = createRepository('escrows')
      const opportunity = await transactionOpportunities.findById(id)
      if (!opportunity) return null

      const escrow = await transactionEscrows.create({
        scope: 'opportunity',
        scopeId: id,
        businessId: opportunity.businessId,
        status: 'funded',
        ...payload
      })
      const updatedOpportunity = await transactionOpportunities.updateById(id, { escrowStatus: 'funded' })
      return { opportunity: updatedOpportunity ?? opportunity, escrow }
    })
  }

  createOpportunityInvites(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionInvites = createRepository('opportunityInvites')
      const opportunity = await transactionOpportunities.findById(id)
      if (!opportunity) return null

      const invites = await Promise.all(payload.studentIds.map((studentId: string) => transactionInvites.create({
        opportunityId: id,
        studentId,
        note: payload.note,
        status: 'sent'
      })))
      return { opportunity, invites }
    })
  }

  createOpportunityInvitesWithEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionInvites = createRepository('opportunityInvites')
      const transactionReviewEvents = createRepository('reviewEvents')
      const opportunity = await transactionOpportunities.findById(id)
      if (!opportunity) return null

      const invites = await Promise.all(payload.studentIds.map((studentId: string) => transactionInvites.create({
        opportunityId: id,
        studentId,
        note: payload.note,
        status: 'sent'
      })))
      await transactionReviewEvents.create({
        scope: 'opportunity',
        action: 'invites_sent',
        opportunityId: id,
        count: invites.length,
        actorId
      })
      return { opportunity, invites }
    })
  }

  recordApplicantReviewEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionBids = createRepository('bids')
      const transactionReviewEvents = createRepository('reviewEvents')
      const bid = await transactionBids.findById(id)
      if (!bid) return null

      await transactionBids.updateById(id, { status: payload.action })
      return transactionReviewEvents.create({
        scope: 'applicant',
        bidId: id,
        opportunityId: bid.opportunityId,
        studentId: bid.studentId,
        actorId,
        ...payload
      })
    })
  }

  awardApplicantProject(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionBids = createRepository('bids')
      const transactionOpportunities = createRepository('opportunities')
      const transactionProjects = createRepository('projects')
      const bid = await transactionBids.findById(id)
      if (!bid) return null

      const opportunity = await transactionOpportunities.findById(bid.opportunityId)
      if (!opportunity) return null

      const project = await transactionProjects.create({
        opportunityId: opportunity.id,
        businessId: opportunity.businessId,
        studentId: bid.studentId,
        title: opportunity.title,
        status: 'awarded',
        fundingStatus: opportunity.escrowStatus === 'funded' ? 'funded' : 'pending',
        scopeLocked: false
      })
      const updatedBid = await transactionBids.updateById(id, { status: 'awarded', projectId: project.id })
      return { bid: updatedBid, project }
    })
  }

  awardApplicantProjectWithEvent(id: string, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionBids = createRepository('bids')
      const transactionOpportunities = createRepository('opportunities')
      const transactionProjects = createRepository('projects')
      const transactionReviewEvents = createRepository('reviewEvents')
      const bid = await transactionBids.findById(id)
      if (!bid) return null

      const opportunity = await transactionOpportunities.findById(bid.opportunityId)
      if (!opportunity) return null

      const project = await transactionProjects.create({
        opportunityId: opportunity.id,
        businessId: opportunity.businessId,
        studentId: bid.studentId,
        title: opportunity.title,
        status: 'awarded',
        fundingStatus: opportunity.escrowStatus === 'funded' ? 'funded' : 'pending',
        scopeLocked: false
      })
      const updatedBid = await transactionBids.updateById(id, { status: 'awarded', projectId: project.id })
      await transactionReviewEvents.create({
        scope: 'applicant',
        action: 'awarded',
        bidId: id,
        projectId: project.id,
        actorId
      })
      return { bid: updatedBid, project }
    })
  }
}

const businessWorkflowsRepository = new BusinessWorkflowsRepository()

export {
  BusinessWorkflowsRepository,
  businessWorkflowsRepository
}
