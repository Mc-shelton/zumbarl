import { KycStatus } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const opportunities = createPrismaRecordRepository('opportunities')
const campaigns = createPrismaRecordRepository('campaigns')
const invites = createPrismaRecordRepository('opportunityInvites')
const bids = createPrismaRecordRepository('bids')
const projects = createPrismaRecordRepository('projects')
const escrows = createPrismaRecordRepository('escrows')
const reviewEvents = createPrismaRecordRepository('reviewEvents')
const opportunityDeliverables = createPrismaRecordRepository('opportunityDeliverables')

function normalizeIndustryName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function createIndustrySlug(name: string) {
  return normalizeIndustryName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toKycStatus(status: string | undefined) {
  const normalizedStatus = String(status || '').toUpperCase()
  if (normalizedStatus === 'IN_REVIEW') return KycStatus.UNDER_REVIEW
  if (normalizedStatus === 'VERIFIED') return KycStatus.APPROVED
  return KycStatus[normalizedStatus as keyof typeof KycStatus] ?? KycStatus.UNDER_REVIEW
}

function fromKycStatus(status: KycStatus | string | undefined) {
  const normalizedStatus = String(status || KycStatus.PENDING)
  if (normalizedStatus === KycStatus.UNDER_REVIEW) return 'in_review'
  if (normalizedStatus === KycStatus.APPROVED) return 'verified'
  return normalizedStatus.toLowerCase()
}

function toBusinessProfile(company: Record<string, any> | null) {
  if (!company) return null
  return {
    id: company.id,
    name: company.name,
    industry: company.sector,
    sector: company.sector,
    teamSize: company.size,
    size: company.size,
    website: company.website,
    registrationNumber: company.registrationNumber,
    logoUrl: company.logoUrl,
    description: company.description,
    location: company.locationAddress || company.locationCity,
    locationCity: company.locationCity,
    locationAddress: company.locationAddress,
    latitude: company.latitude,
    longitude: company.longitude,
    hiringGoals: company.hiringGoals ?? [],
    onboardingCompleted: company.onboardingCompleted,
    verificationStatus: fromKycStatus(company.kycStatus),
    kycStatus: fromKycStatus(company.kycStatus),
    hiringGuardrailLimit: 3,
    createdAt: company.createdAt instanceof Date ? company.createdAt.toISOString() : company.createdAt,
    updatedAt: company.updatedAt instanceof Date ? company.updatedAt.toISOString() : company.updatedAt
  }
}

function toBusinessKyc(kyc: Record<string, any> | null) {
  if (!kyc) return null
  return {
    ...kyc,
    companyId: kyc.companyId,
    status: fromKycStatus(kyc.status),
    submittedAt: kyc.submittedAt instanceof Date ? kyc.submittedAt.toISOString() : kyc.submittedAt,
    createdAt: kyc.createdAt instanceof Date ? kyc.createdAt.toISOString() : kyc.createdAt,
    updatedAt: kyc.updatedAt instanceof Date ? kyc.updatedAt.toISOString() : kyc.updatedAt
  }
}

class BusinessWorkflowsRepository {
  async listIndustries(query: Record<string, unknown>) {
    const industries = await prisma.industry.findMany({
      where: { NOT: { status: 'archived' } },
      orderBy: { name: 'asc' }
    })
    return {
      data: industries,
      meta: {
        page: Number(query.page ?? 1),
        pageSize: industries.length,
        total: industries.length
      }
    }
  }

  async ensureIndustries(names: string[]) {
    return prisma.$transaction(async (transaction) => {
      const existingIndustries = await transaction.industry.findMany()
      const existingNames = new Set(existingIndustries.map((industry) => normalizeIndustryName(String(industry.name ?? '')).toLowerCase()))
      const missingNames = Array.from(new Map(names
        .map(normalizeIndustryName)
        .filter((name) => name && !existingNames.has(name.toLowerCase()))
        .map((name) => [name.toLowerCase(), name])).values())

      if (!missingNames.length) return existingIndustries

      const createdIndustries = await Promise.all(missingNames.map((name) => transaction.industry.create({
        data: {
          name,
          slug: createIndustrySlug(name),
          status: 'active',
          source: 'system'
        }
      })))
      return [...createdIndustries, ...existingIndustries]
    })
  }

  createIndustryWithEvent(payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const name = normalizeIndustryName(String(payload.name ?? ''))
      const existingIndustry = await transaction.industry.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      })
      if (existingIndustry) return existingIndustry

      const industry = await transaction.industry.create({
        data: {
          name,
          slug: createIndustrySlug(name),
          status: 'active',
          source: payload.source ?? 'business_onboarding',
          createdBy: actorId
        }
      })
      return industry
    })
  }

  listBusinessOpportunities(businessId: string | undefined, query: Record<string, unknown>) {
    return opportunities.list(query, (opportunity) => !businessId || opportunity.businessId === businessId)
  }

  listBusinessProjects(businessId: string | undefined) {
    return projects.listAll((project) => !businessId || project.businessId === businessId)
  }

  listBusinessCampaigns(businessId: string | undefined) {
    return campaigns.listAll((campaign) => !businessId || campaign.businessId === businessId)
  }

  async listBusinessBids(businessId: string | undefined) {
    const businessOpportunities = await opportunities.listAll((opportunity) => !businessId || opportunity.businessId === businessId)
    const opportunityIds = new Set(businessOpportunities.map((opportunity) => opportunity.id))
    return bids.listAll((bid) => opportunityIds.has(bid.opportunityId))
  }

  async listBusinessReviewEvents(businessId: string | undefined) {
    const businessOpportunities = await opportunities.listAll((opportunity) => !businessId || opportunity.businessId === businessId)
    const opportunityIds = new Set(businessOpportunities.map((opportunity) => opportunity.id))
    return reviewEvents.listAll((event) => !event.opportunityId || opportunityIds.has(event.opportunityId))
  }

  async findBusinessProfile(id?: string) {
    if (!id) return null
    const company = await prisma.company.findUnique({ where: { id } })
    return toBusinessProfile(company)
  }

  async updateBusinessProfile(id: string, patch: Record<string, any>) {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return null

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: patch.name,
        sector: patch.industry ?? patch.sector,
        size: patch.teamSize ?? patch.size,
        website: patch.website,
        description: patch.description,
        locationCity: patch.locationCity ?? patch.location,
        locationAddress: patch.locationAddress ?? patch.physicalAddress,
        latitude: patch.latitude === undefined || patch.latitude === '' ? undefined : Number(patch.latitude),
        longitude: patch.longitude === undefined || patch.longitude === '' ? undefined : Number(patch.longitude),
        hiringGoals: patch.hiringGoals,
        onboardingCompleted: patch.onboardingCompleted,
        registrationNumber: patch.registrationNumber,
        logoUrl: patch.logoUrl
      }
    })
    return toBusinessProfile(updatedCompany)
  }

  async findBusinessKyc(businessId: string | undefined) {
    if (!businessId) return null
    const kyc = await prisma.businessKyc.findUnique({ where: { companyId: businessId } })
    return toBusinessKyc(kyc)
  }

  upsertBusinessKycWithEvent(businessId: string, payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const business = await transaction.company.findUnique({ where: { id: businessId } })
      if (!business) return null

      const status = payload.status ?? 'in_review'
      const kyc = await transaction.businessKyc.upsert({
        where: { companyId: businessId },
        update: {
          status: toKycStatus(status),
          registeredBusinessName: payload.registeredBusinessName,
          incorporationCertificate: payload.incorporationCertificate,
          kraPinCertificate: payload.kraPinCertificate,
          businessRegistrationNumber: payload.businessRegistrationNumber,
          representativeFullName: payload.representativeFullName,
          representativeIdDocument: payload.representativeIdDocument,
          representativePhone: payload.representativePhone,
          representativeEmail: payload.representativeEmail,
          representativeRole: payload.representativeRole,
          industry: payload.industry,
          companySize: payload.companySize,
          physicalAddress: payload.physicalAddress,
          geoCoordinates: payload.geoCoordinates,
          website: payload.website,
          yearEstablished: Number(payload.yearEstablished),
          mpesaTillOrPaybill: payload.mpesaTillOrPaybill,
          bankAccountDetails: payload.bankAccountDetails,
          taxComplianceCertificate: payload.taxComplianceCertificate,
          linkedInCompanyPage: payload.linkedInCompanyPage,
          socialMediaPresence: payload.socialMediaPresence,
          verifiedCompanyReferral: payload.verifiedCompanyReferral,
          submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date()
        },
        create: {
          companyId: businessId,
          status: toKycStatus(status),
          registeredBusinessName: payload.registeredBusinessName,
          incorporationCertificate: payload.incorporationCertificate,
          kraPinCertificate: payload.kraPinCertificate,
          businessRegistrationNumber: payload.businessRegistrationNumber,
          representativeFullName: payload.representativeFullName,
          representativeIdDocument: payload.representativeIdDocument,
          representativePhone: payload.representativePhone,
          representativeEmail: payload.representativeEmail,
          representativeRole: payload.representativeRole,
          industry: payload.industry,
          companySize: payload.companySize,
          physicalAddress: payload.physicalAddress,
          geoCoordinates: payload.geoCoordinates,
          website: payload.website,
          yearEstablished: Number(payload.yearEstablished),
          mpesaTillOrPaybill: payload.mpesaTillOrPaybill,
          bankAccountDetails: payload.bankAccountDetails,
          taxComplianceCertificate: payload.taxComplianceCertificate,
          linkedInCompanyPage: payload.linkedInCompanyPage,
          socialMediaPresence: payload.socialMediaPresence,
          verifiedCompanyReferral: payload.verifiedCompanyReferral,
          submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date()
        }
      })

      await transaction.company.update({
        where: { id: businessId },
        data: {
          kycStatus: toKycStatus(status),
          kycVerifiedAt: toKycStatus(status) === KycStatus.APPROVED ? new Date() : null,
          registrationNumber: payload.businessRegistrationNumber,
          sector: payload.industry,
          size: payload.companySize,
          website: payload.website,
          locationAddress: payload.physicalAddress
        }
      })

      await reviewEvents.create({
        scope: 'business_kyc',
        action: kyc.createdAt.getTime() === kyc.updatedAt.getTime() ? 'submitted' : 'updated',
        businessId,
        kycId: kyc.id,
        actorId
      })
      return toBusinessKyc(kyc)
    })
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

  listOpportunityDeliverables(opportunityId: string) {
    return opportunityDeliverables.listAll((deliverable) => deliverable.opportunityId === opportunityId)
  }

  findOpportunityDeliverable(id: string) {
    return opportunityDeliverables.findById(id)
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

  createOpportunityDeliverablesWithEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionOpportunities = createRepository('opportunities')
      const transactionDeliverables = createRepository('opportunityDeliverables')
      const transactionEscrows = createRepository('escrows')
      const transactionReviewEvents = createRepository('reviewEvents')
      const opportunity = await transactionOpportunities.findById(id)
      if (!opportunity) return null

      const deliverables = await Promise.all(payload.deliverables.map((deliverable: Record<string, any>, index: number) => transactionDeliverables.create({
        ...deliverable,
        opportunityId: id,
        businessId: opportunity.businessId,
        sequence: index + 1,
        status: deliverable.status ?? 'pending_payment'
      })))

      const escrow = payload.payment
        ? await transactionEscrows.create({
            scope: 'opportunity_deliverables',
            scopeId: id,
            businessId: opportunity.businessId,
            deliverableIds: deliverables.map((deliverable) => deliverable.id),
            status: 'pending',
            ...payload.payment
          })
        : null

      await transactionOpportunities.updateById(id, {
        deliverableCount: deliverables.length,
        deliverablesStatus: escrow ? 'pending_payment' : 'created'
      })
      await transactionReviewEvents.create({
        scope: 'opportunity',
        action: 'deliverables_created',
        opportunityId: id,
        count: deliverables.length,
        escrowId: escrow?.id,
        actorId,
        note: payload.note
      })
      return { opportunity, deliverables, escrow }
    })
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
