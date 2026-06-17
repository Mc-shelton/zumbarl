import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const campaigns = createPrismaRecordRepository('campaigns')
const campaignInvites = createPrismaRecordRepository('campaignInvites')
const campaignAcceptances = createPrismaRecordRepository('campaignAcceptances')
const campaignProofs = createPrismaRecordRepository('campaignProofs')
const escrows = createPrismaRecordRepository('escrows')
const evidence = createPrismaRecordRepository('evidence')
const students = createPrismaRecordRepository('students')

class MarketingCampaignsRepository {
  listCampaigns(query: Record<string, unknown>) {
    return campaigns.list(query)
  }

  createCampaign(payload: Record<string, any>) {
    return campaigns.create(payload)
  }

  findCampaign(id: string) {
    return campaigns.findById(id)
  }

  updateCampaign(id: string, patch: Record<string, any>) {
    return campaigns.updateById(id, patch)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  createInvite(payload: Record<string, any>) {
    return campaignInvites.create(payload)
  }

  createAcceptance(payload: Record<string, any>) {
    return campaignAcceptances.create(payload)
  }

  createProof(payload: Record<string, any>) {
    return campaignProofs.create(payload)
  }

  listProofs(campaignId: string) {
    return campaignProofs.listAll((proof) => proof.campaignId === campaignId)
  }

  async readCampaignDetail(campaignId: string) {
    return {
      campaign: await campaigns.findById(campaignId),
      invites: await campaignInvites.listAll((item) => item.campaignId === campaignId),
      acceptances: await campaignAcceptances.listAll((item) => item.campaignId === campaignId),
      proofs: await campaignProofs.listAll((item) => item.campaignId === campaignId)
    }
  }

  createEvidence(payload: Record<string, any>) {
    return evidence.create(payload)
  }

  findStudent(id?: string) {
    return id ? students.findById(id) : null
  }

  fundCampaign(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCampaigns = createRepository('campaigns')
      const transactionEscrows = createRepository('escrows')
      const campaign = await transactionCampaigns.findById(id)
      if (!campaign) return null

      const escrow = await transactionEscrows.create({ scope: 'campaign', scopeId: id, amount: campaign.budgetAmount, currency: campaign.currency, status: 'funded' })
      await transactionCampaigns.updateById(id, { status: 'funded' })
      return escrow
    })
  }

  createCampaignInvites(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCampaigns = createRepository('campaigns')
      const transactionInvites = createRepository('campaignInvites')
      const campaign = await transactionCampaigns.findById(id)
      if (!campaign) return null

      const invites = await Promise.all(payload.studentIds.map((studentId: string) => transactionInvites.create({ campaignId: id, studentId, note: payload.note, status: 'sent' })))
      return { invites }
    })
  }

  acceptCampaign(id: string, studentId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCampaigns = createRepository('campaigns')
      const transactionAcceptances = createRepository('campaignAcceptances')
      const transactionStudents = createRepository('students')
      const campaign = await transactionCampaigns.findById(id)
      if (!campaign) return null
      const student = studentId ? await transactionStudents.findById(studentId) : null
      if (!student) return { accepted: false, reason: 'student_profile_not_found', campaign }

      if ((student.followers ?? 1000) < (campaign.minimumFollowers ?? 0)) return { accepted: false, reason: 'eligibility_criteria_not_met', campaign }
      if ((campaign.acceptedBudget ?? 0) + campaign.payoutPerCampaigner > campaign.budgetAmount) return { accepted: false, reason: 'campaign_budget_limit_reached', campaign }
      const acceptance = await transactionAcceptances.create({ campaignId: id, studentId, status: 'accepted', payoutAmount: campaign.payoutPerCampaigner })
      await transactionCampaigns.updateById(id, { acceptedBudget: (campaign.acceptedBudget ?? 0) + campaign.payoutPerCampaigner })
      return acceptance
    })
  }

  submitCampaignProof(id: string, studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCampaigns = createRepository('campaigns')
      const transactionProofs = createRepository('campaignProofs')
      const campaign = await transactionCampaigns.findById(id)
      if (!campaign) return null

      const proof = await transactionProofs.create({ ...payload, campaignId: id, studentId, status: 'submitted' })
      await transactionCampaigns.updateById(id, { workflow: { proofSubmitted: true, statsGenerated: false, endorsed: false } })
      return proof
    })
  }

  endorseCampaigners(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCampaigns = createRepository('campaigns')
      const transactionEvidence = createRepository('evidence')
      const campaign = await transactionCampaigns.findById(id)
      if (!campaign) return null

      const endorsements = await Promise.all(payload.studentIds.map((studentId: string) => transactionEvidence.create({ source: 'marketing-campaign', sourceId: id, studentId, type: 'endorsement', note: payload.note, verified: true })))
      await transactionCampaigns.updateById(id, { workflow: { ...(campaign.workflow ?? {}), endorsed: true } })
      return { endorsements }
    })
  }
}

const marketingCampaignsRepository = new MarketingCampaignsRepository()

export {
  MarketingCampaignsRepository,
  marketingCampaignsRepository
}
