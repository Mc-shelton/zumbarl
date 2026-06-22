import { KycStatus, type Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const campaigns = createPrismaRecordRepository('campaigns')
const projects = createPrismaRecordRepository('projects')
const escrows = createPrismaRecordRepository('escrows')

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

function toIso(value: Date | string | null | undefined) {
  if (!value) return value
  return value instanceof Date ? value.toISOString() : value
}

function toDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function getScopeItemBudget(item: Record<string, any>) {
  return toNumber(item.budgetAmount ?? item.budget)
}

function toOpportunityScopeItem(scopeItem: Record<string, any>) {
  const sampleWork = Array.isArray(scopeItem.sampleWork) ? scopeItem.sampleWork : []
  return {
    id: scopeItem.id,
    opportunityId: scopeItem.opportunityId,
    title: scopeItem.title,
    workflow: scopeItem.workflow,
    type: scopeItem.itemType ?? scopeItem.type,
    description: scopeItem.description,
    requirement: scopeItem.requirement,
    submissionMethod: scopeItem.submissionMethod,
    verificationMethod: scopeItem.verificationMethod,
    evidenceRequired: scopeItem.evidenceRequired,
    acceptanceCriteria: scopeItem.acceptanceCriteria,
    paymentRelease: scopeItem.paymentRelease,
    budget: scopeItem.budgetLabel ?? (scopeItem.budgetAmount ? String(scopeItem.budgetAmount) : undefined),
    budgetAmount: scopeItem.budgetAmount,
    paymentPercent: scopeItem.paymentPercent,
    maxSubmissions: scopeItem.maxSubmissions,
    lockedUntilApproved: scopeItem.lockedUntilApproved,
    isSequential: scopeItem.isSequential,
    status: scopeItem.status,
    referenceFiles: scopeItem.referenceFiles ?? [],
    sampleWork: sampleWork.map((sample: Record<string, any>) => ({
      id: sample.id,
      label: sample.label,
      fileType: sample.fileType,
      files: sample.files ?? [],
      sortOrder: sample.sortOrder
    })),
    createdAt: toIso(scopeItem.createdAt),
    updatedAt: toIso(scopeItem.updatedAt)
  }
}

function toOpportunity(opportunity: Record<string, any> | null) {
  if (!opportunity) return null
  const scopeItems = Array.isArray(opportunity.scopeItems) ? opportunity.scopeItems.map(toOpportunityScopeItem) : []
  const deliverableMilestones = scopeItems.filter((item: Record<string, any>) => {
    const source = (opportunity.scopeItems || []).find((scopeItem: Record<string, any>) => scopeItem.id === item.id)
    return source?.scopeType !== 'milestone'
  })
  const milestoneScopes = scopeItems.filter((item: Record<string, any>) => {
    const source = (opportunity.scopeItems || []).find((scopeItem: Record<string, any>) => scopeItem.id === item.id)
    return source?.scopeType === 'milestone'
  })

  return {
    id: opportunity.id,
    businessId: opportunity.companyId,
    companyId: opportunity.companyId,
    postedByContactId: opportunity.postedByContactId,
    title: opportunity.title,
    summary: opportunity.summary,
    description: opportunity.description ?? opportunity.summary,
    type: 'project',
    opportunityType: opportunity.opportunityType,
    category: opportunity.category,
    status: opportunity.status,
    visibility: opportunity.visibility,
    scopeMode: opportunity.scopeMode,
    opportunitySplash: opportunity.opportunitySplash,
    budgetAmount: opportunity.budgetAmount,
    budget: opportunity.budgetLabel ?? (opportunity.budgetAmount ? `KES ${opportunity.budgetAmount.toLocaleString()}` : ''),
    currency: opportunity.currency,
    paymentTerms: opportunity.paymentTerms,
    applicants: opportunity.applicants,
    invitedCount: opportunity.invitedCount,
    escrowStatus: opportunity.escrowStatus,
    deliverablesStatus: opportunity.deliverablesStatus,
    deliverableCount: opportunity.deliverableCount,
    skills: opportunity.skills?.join?.(', ') ?? '',
    mustHave: opportunity.mustHave ?? [],
    requirements: opportunity.requirements ?? [],
    qualificationQuestions: opportunity.qualificationQuestions ?? [],
    preferredQualifications: opportunity.preferredQualifications,
    portfolioRequired: opportunity.portfolioRequired,
    requiredExperience: opportunity.requiredExperience,
    engagementMode: opportunity.engagementMode,
    availability: opportunity.availability,
    duration: opportunity.duration,
    mode: opportunity.mode,
    applicationDeadline: toIso(opportunity.applicationDeadline),
    deadline: opportunity.deadlineLabel ?? toIso(opportunity.applicationDeadline),
    company: opportunity.companyName ?? opportunity.company?.name,
    companyDescription: opportunity.companyDescription,
    acceptanceCriteria: opportunity.acceptanceCriteria,
    deliverables: opportunity.deliverablesSummary,
    deliverableMilestones,
    milestoneScopes,
    requiredAttachments: (opportunity.requiredAttachments ?? []).map((attachment: Record<string, any>) => ({
      id: attachment.id,
      label: attachment.label,
      fileType: attachment.fileType,
      required: attachment.required,
      sortOrder: attachment.sortOrder
    })),
    screeningFocus: opportunity.screeningFocus,
    bidderInstructions: opportunity.bidderInstructions,
    clarityScore: opportunity.clarityScore,
    revisionLimit: opportunity.revisionLimit,
    publishedAt: toIso(opportunity.publishedAt),
    completedAt: toIso(opportunity.completedAt),
    archivedAt: toIso(opportunity.archivedAt),
    isSeed: opportunity.isSeed,
    metadata: opportunity.metadata,
    createdAt: toIso(opportunity.createdAt),
    updatedAt: toIso(opportunity.updatedAt)
  }
}

function toOpportunityCreateData(payload: Record<string, any>, businessId?: string) {
  return {
    companyId: String(payload.businessId ?? businessId),
    title: String(payload.title ?? ''),
    summary: String(payload.summary ?? payload.description ?? ''),
    description: payload.description ?? payload.summary,
    opportunityType: payload.opportunityType ?? payload.type ?? 'Project',
    category: payload.category,
    status: payload.status ?? 'draft',
    visibility: payload.visibility ?? 'draft',
    scopeMode: payload.scopeMode ?? 'deliverable',
    opportunitySplash: toJson(payload.opportunitySplash),
    budgetAmount: toNumber(payload.budgetAmount ?? payload.budget),
    budgetLabel: payload.budget,
    currency: payload.currency ?? 'KES',
    paymentTerms: payload.paymentTerms,
    applicants: Number(payload.applicants ?? 0),
    invitedCount: Number(payload.invitedCount ?? 0),
    escrowStatus: payload.escrowStatus ?? 'unfunded',
    skills: toStringList(payload.skills),
    mustHave: toStringList(payload.mustHave),
    requirements: toStringList(payload.requirements),
    qualificationQuestions: toStringList(payload.qualificationQuestions),
    preferredQualifications: toJson(payload.preferredQualifications),
    portfolioRequired: payload.portfolioRequired,
    requiredExperience: payload.experienceLevel ?? payload.requiredExperience,
    engagementMode: payload.engagementMode,
    availability: payload.availability,
    duration: payload.duration,
    mode: payload.mode,
    applicationDeadline: toDate(payload.applicationDeadline ?? payload.deadline),
    deadlineLabel: payload.deadline,
    companyName: payload.company,
    companyDescription: payload.companyDescription,
    acceptanceCriteria: payload.acceptanceCriteria,
    deliverablesSummary: typeof payload.deliverables === 'string' ? payload.deliverables : undefined,
    screeningFocus: payload.screeningFocus,
    bidderInstructions: payload.bidderInstructions,
    clarityScore: Number(payload.clarityScore ?? 0),
    revisionLimit: Number(payload.revisionLimit ?? 3),
    isSeed: Boolean(payload.isSeed),
    metadata: toJson(payload.metadata)
  }
}

function compactData<T extends Record<string, any>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>
}

function toOpportunityPatchData(payload: Record<string, any>, businessId?: string) {
  return compactData({
    companyId: payload.businessId ?? businessId,
    title: payload.title,
    summary: payload.summary ?? payload.description,
    description: payload.description ?? payload.summary,
    opportunityType: payload.opportunityType ?? payload.type,
    category: payload.category,
    status: payload.status,
    visibility: payload.visibility,
    scopeMode: payload.scopeMode,
    opportunitySplash: payload.opportunitySplash === undefined ? undefined : toJson(payload.opportunitySplash),
    budgetAmount: payload.budgetAmount === undefined && payload.budget === undefined ? undefined : toNumber(payload.budgetAmount ?? payload.budget),
    budgetLabel: payload.budget,
    currency: payload.currency,
    paymentTerms: payload.paymentTerms,
    applicants: payload.applicants === undefined ? undefined : Number(payload.applicants),
    invitedCount: payload.invitedCount === undefined ? undefined : Number(payload.invitedCount),
    escrowStatus: payload.escrowStatus,
    deliverablesStatus: payload.deliverablesStatus,
    deliverableCount: payload.deliverableCount === undefined ? undefined : Number(payload.deliverableCount),
    skills: payload.skills === undefined ? undefined : toStringList(payload.skills),
    mustHave: payload.mustHave === undefined ? undefined : toStringList(payload.mustHave),
    requirements: payload.requirements === undefined ? undefined : toStringList(payload.requirements),
    qualificationQuestions: payload.qualificationQuestions === undefined ? undefined : toStringList(payload.qualificationQuestions),
    preferredQualifications: payload.preferredQualifications === undefined ? undefined : toJson(payload.preferredQualifications),
    portfolioRequired: payload.portfolioRequired,
    requiredExperience: payload.experienceLevel ?? payload.requiredExperience,
    engagementMode: payload.engagementMode,
    availability: payload.availability,
    duration: payload.duration,
    mode: payload.mode,
    applicationDeadline: payload.applicationDeadline === undefined && payload.deadline === undefined ? undefined : toDate(payload.applicationDeadline ?? payload.deadline),
    deadlineLabel: payload.deadline,
    companyName: payload.company,
    companyDescription: payload.companyDescription,
    acceptanceCriteria: payload.acceptanceCriteria,
    deliverablesSummary: payload.deliverables === undefined ? undefined : typeof payload.deliverables === 'string' ? payload.deliverables : undefined,
    screeningFocus: payload.screeningFocus,
    bidderInstructions: payload.bidderInstructions,
    clarityScore: payload.clarityScore === undefined ? undefined : Number(payload.clarityScore),
    revisionLimit: payload.revisionLimit === undefined ? undefined : Number(payload.revisionLimit),
    publishedAt: payload.publishedAt === undefined ? undefined : toDate(payload.publishedAt),
    completedAt: payload.completedAt === undefined ? undefined : toDate(payload.completedAt),
    archivedAt: payload.archivedAt === undefined ? undefined : toDate(payload.archivedAt),
    isSeed: payload.isSeed === undefined ? undefined : Boolean(payload.isSeed),
    metadata: payload.metadata === undefined ? undefined : toJson(payload.metadata)
  })
}

function toScopeItemCreateData(opportunityId: string, item: Record<string, any>, scopeType: string, sequence: number) {
  return {
    opportunityId,
    scopeType,
    sequence,
    title: String(item.title ?? `Scope item ${sequence}`),
    workflow: item.workflow,
    itemType: item.type ?? item.itemType,
    description: item.description,
    requirement: item.requirement,
    submissionMethod: item.submissionMethod,
    verificationMethod: item.verificationMethod,
    evidenceRequired: item.evidenceRequired,
    acceptanceCriteria: item.acceptanceCriteria,
    paymentRelease: item.paymentRelease,
    budgetAmount: getScopeItemBudget(item),
    budgetLabel: item.budget,
    paymentPercent: toNumber(item.paymentPercent),
    maxSubmissions: item.maxSubmissions ? Number(item.maxSubmissions) : undefined,
    lockedUntilApproved: Boolean(item.lockedUntilApproved),
    isSequential: item.isSequential !== false,
    status: item.status ?? 'draft',
    referenceFiles: toJson(item.referenceFiles ?? []),
    metadata: toJson(item.metadata)
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
    const page = Number(query.page ?? 1)
    return prisma.opportunity.findMany({
      where: businessId ? { companyId: businessId } : undefined,
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    }).then((items) => ({
      data: items.map((item) => toOpportunity(item)),
      meta: {
        page,
        pageSize: items.length,
        total: items.length
      }
    }))
  }

  listBusinessProjects(businessId: string | undefined) {
    return projects.listAll((project) => !businessId || project.businessId === businessId)
  }

  listBusinessCampaigns(businessId: string | undefined) {
    return campaigns.listAll((campaign) => !businessId || campaign.businessId === businessId)
  }

  async listBusinessBids(businessId: string | undefined) {
    const items = await prisma.bid.findMany({
      where: businessId ? { opportunity: { companyId: businessId } } : undefined,
      orderBy: { appliedAt: 'desc' }
    })
    return items.map((item) => ({
      ...item,
      appliedAt: toIso(item.appliedAt),
      respondedAt: toIso(item.respondedAt)
    }))
  }

  async listBusinessReviewEvents(businessId: string | undefined) {
    const items = await prisma.opportunityActivityEvent.findMany({
      where: businessId ? { opportunity: { companyId: businessId } } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    return items.map((item) => ({
      ...item,
      businessId,
      createdAt: toIso(item.createdAt)
    }))
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

      if (actorId) {
        await transaction.auditLog.create({
          data: {
            userId: actorId,
            action: kyc.createdAt.getTime() === kyc.updatedAt.getTime() ? 'business_kyc_submitted' : 'business_kyc_updated',
            entityType: 'business_kyc',
            entityId: kyc.id,
            after: toJson({ businessId, status: fromKycStatus(kyc.status) }) as Prisma.InputJsonObject
          }
        })
      }
      return toBusinessKyc(kyc)
    })
  }

  async createOpportunity(payload: Record<string, any>) {
    const opportunity = await prisma.opportunity.create({
      data: toOpportunityCreateData(payload, payload.businessId),
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      }
    })
    return toOpportunity(opportunity)
  }

  async findOpportunity(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      }
    })
    return toOpportunity(opportunity)
  }

  async updateOpportunity(id: string, patch: Record<string, any>) {
    const existing = await prisma.opportunity.findUnique({ where: { id } })
    if (!existing) return null

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: toOpportunityPatchData({ ...patch, businessId: existing.companyId }, existing.companyId),
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      }
    })
    return toOpportunity(opportunity)
  }

  updateOpportunityWithEvent(id: string, patch: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.opportunity.findUnique({ where: { id } })
      if (!existing) return null

      const opportunity = await transaction.opportunity.update({
        where: { id },
        data: toOpportunityPatchData({ ...patch, businessId: existing.companyId }, existing.companyId),
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'updated',
          opportunityId: id,
          actorId,
          metadata: toJson({ changedFields: Object.keys(patch) })
        }
      })
      return toOpportunity(opportunity)
    })
  }

  async listOpportunityDeliverables(opportunityId: string) {
    const items = await prisma.opportunityScopeItem.findMany({
      where: { opportunityId },
      include: { sampleWork: true },
      orderBy: { sequence: 'asc' }
    })
    return items.map((item) => toOpportunityScopeItem(item))
  }

  async findOpportunityDeliverable(id: string) {
    const item = await prisma.opportunityScopeItem.findUnique({
      where: { id },
      include: { sampleWork: true }
    })
    return item ? toOpportunityScopeItem(item) : null
  }

  createOpportunityInvite(payload: Record<string, any>) {
    return prisma.opportunityInvite.create({
      data: {
        opportunityId: payload.opportunityId,
        studentId: payload.studentId,
        note: payload.note,
        status: payload.status ?? 'sent',
        metadata: toJson(payload.metadata)
      }
    })
  }

  async listOpportunityBids(opportunityId: string) {
    const items = await prisma.bid.findMany({
      where: { opportunityId },
      orderBy: { appliedAt: 'desc' }
    })
    return items.map((item) => ({
      ...item,
      appliedAt: toIso(item.appliedAt),
      respondedAt: toIso(item.respondedAt)
    }))
  }

  findBid(id: string) {
    return prisma.bid.findUnique({ where: { id } })
  }

  updateBid(id: string, patch: Record<string, any>) {
    return prisma.bid.update({ where: { id }, data: patch })
  }

  createProject(payload: Record<string, any>) {
    return projects.create(payload)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  createReviewEvent(payload: Record<string, any>) {
    return prisma.opportunityActivityEvent.create({
      data: {
        opportunityId: payload.opportunityId,
        actorId: payload.actorId,
        action: payload.action,
        note: payload.note ?? payload.detail,
        metadata: toJson(payload)
      }
    })
  }

  createOpportunityDeliverablesWithEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.findUnique({ where: { id } })
      if (!opportunity) return null

      const deliverables = await Promise.all(payload.deliverables.map(async (deliverable: Record<string, any>, index: number) => {
        const scopeItem = await transaction.opportunityScopeItem.create({
          data: toScopeItemCreateData(id, { ...deliverable, status: deliverable.status ?? 'pending_payment' }, 'deliverable', index + 1)
        })
        const sampleWork = Array.isArray(deliverable.sampleWork) ? deliverable.sampleWork : []
        if (sampleWork.length) {
          await transaction.opportunitySampleWork.createMany({
            data: sampleWork.map((sample: Record<string, any>, sampleIndex: number) => ({
              scopeItemId: scopeItem.id,
              label: sample.label ?? `Sample ${sampleIndex + 1}`,
              fileType: sample.fileType ?? 'any',
              files: toJson(sample.files ?? []),
              sortOrder: sampleIndex + 1
            }))
          })
        }
        return transaction.opportunityScopeItem.findUnique({
          where: { id: scopeItem.id },
          include: { sampleWork: true }
        })
      }))

      const escrow = payload.payment
        ? await transaction.opportunityEscrowHold.create({
            data: {
              opportunityId: id,
              companyId: opportunity.companyId,
              amount: toNumber(payload.payment.amount),
              currency: payload.payment.currency ?? 'KES',
              status: 'PENDING',
              transactionRef: payload.payment.reference
            }
          })
        : null

      const updatedOpportunity = await transaction.opportunity.update({
        where: { id },
        data: {
          deliverableCount: deliverables.length,
          deliverablesStatus: escrow ? 'pending_payment' : 'created'
        },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'deliverables_created',
          opportunityId: id,
          actorId,
          note: payload.note,
          metadata: toJson({
            deliverableIds: deliverables.map((deliverable) => deliverable.id),
            escrowId: escrow?.id,
            count: deliverables.length
          })
        }
      })
      return { opportunity: toOpportunity(updatedOpportunity), deliverables: deliverables.map((deliverable) => toOpportunityScopeItem(deliverable)), escrow }
    })
  }

  createOpportunityWithEvent(payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const contact = actorId ? await transaction.companyContact.findUnique({ where: { userId: actorId } }) : null
      const opportunity = await transaction.opportunity.create({
        data: {
          ...toOpportunityCreateData(payload, payload.businessId),
          postedByContactId: contact?.id
        },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      const scopeItems = [
        ...(Array.isArray(payload.deliverableMilestones) ? payload.deliverableMilestones.map((item: Record<string, any>) => ({ item, scopeType: 'deliverable' })) : []),
        ...(Array.isArray(payload.milestoneScopes) ? payload.milestoneScopes.map((item: Record<string, any>) => ({ item, scopeType: 'milestone' })) : [])
      ]
      await Promise.all(scopeItems.map(async ({ item, scopeType }, index) => {
        const scopeItem = await transaction.opportunityScopeItem.create({
          data: toScopeItemCreateData(opportunity.id, item, scopeType, index + 1)
        })
        const sampleWork = Array.isArray(item.sampleWork) ? item.sampleWork : []
        if (sampleWork.length) {
          await transaction.opportunitySampleWork.createMany({
            data: sampleWork.map((sample: Record<string, any>, sampleIndex: number) => ({
              scopeItemId: scopeItem.id,
              label: sample.label ?? `Sample ${sampleIndex + 1}`,
              fileType: sample.fileType ?? 'any',
              files: toJson(sample.files ?? []),
              sortOrder: sampleIndex + 1
            }))
          })
        }
      }))
      const attachments = Array.isArray(payload.requiredAttachments) ? payload.requiredAttachments : []
      if (attachments.length) {
        await transaction.opportunityRequiredAttachment.createMany({
          data: attachments.map((attachment: Record<string, any>, index: number) => ({
            opportunityId: opportunity.id,
            label: attachment.label,
            fileType: attachment.fileType,
            required: attachment.required !== false,
            sortOrder: index + 1
          }))
        })
      }
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'created',
          opportunityId: opportunity.id,
          actorId
        }
      })
      const createdOpportunity = await transaction.opportunity.findUnique({
        where: { id: opportunity.id },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      return toOpportunity(createdOpportunity)
    })
  }

  publishOpportunityWithEvent(id: string, patch: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.opportunity.findUnique({ where: { id } })
      if (!existing) return null
      const opportunity = await transaction.opportunity.update({
        where: { id },
        data: toOpportunityPatchData(patch),
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'published',
          opportunityId: id,
          actorId
        }
      })
      return toOpportunity(opportunity)
    })
  }

  fundOpportunity(id: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.findUnique({ where: { id } })
      if (!opportunity) return null

      const escrow = await transaction.opportunityEscrowHold.create({
        data: {
          opportunityId: id,
          companyId: opportunity.companyId,
          amount: toNumber(payload.amount),
          currency: payload.currency ?? 'KES',
          status: 'FUNDED',
          transactionRef: payload.reference
        }
      })
      const updatedOpportunity = await transaction.opportunity.update({
        where: { id },
        data: { escrowStatus: 'funded' },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'funded',
          opportunityId: id,
          metadata: toJson({ escrowId: escrow.id, amount: escrow.amount, currency: escrow.currency })
        }
      })
      return { opportunity: toOpportunity(updatedOpportunity), escrow }
    })
  }

  createOpportunityInvites(id: string, payload: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.findUnique({ where: { id } })
      if (!opportunity) return null

      const invites = await Promise.all(payload.studentIds.map((studentId: string) => transaction.opportunityInvite.create({
        data: {
          opportunityId: id,
          studentId,
          note: payload.note,
          status: 'sent'
        }
      })))
      return { opportunity, invites }
    })
  }

  createOpportunityInvitesWithEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.findUnique({ where: { id } })
      if (!opportunity) return null

      const invites = await Promise.all(payload.studentIds.map((studentId: string) => transaction.opportunityInvite.create({
        data: {
          opportunityId: id,
          studentId,
          note: payload.note,
          status: 'sent'
        }
      })))
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'invites_sent',
          opportunityId: id,
          actorId,
          metadata: toJson({ count: invites.length })
        }
      })
      return { opportunity, invites }
    })
  }

  recordApplicantReviewEvent(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({ where: { id } })
      if (!bid) return null

      await transaction.bid.update({ where: { id }, data: { status: payload.action } })
      return transaction.opportunityActivityEvent.create({
        data: {
          action: payload.action,
          opportunityId: bid.opportunityId,
          actorId,
          note: payload.detail,
          metadata: toJson({
            scope: 'applicant',
            bidId: id,
            studentId: bid.studentId,
            ...payload
          })
        }
      })
    })
  }

  awardApplicantProject(id: string) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({ where: { id }, include: { opportunity: true } })
      if (!bid) return null

      const project = await projects.create({
        opportunityId: bid.opportunity.id,
        businessId: bid.opportunity.companyId,
        studentId: bid.studentId,
        title: bid.opportunity.title,
        status: 'awarded',
        fundingStatus: bid.opportunity.escrowStatus === 'funded' ? 'funded' : 'pending',
        scopeLocked: false
      })
      const updatedBid = await transaction.bid.update({ where: { id }, data: { status: 'awarded', projectId: project.id } })
      return { bid: updatedBid, project }
    })
  }

  awardApplicantProjectWithEvent(id: string, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({ where: { id }, include: { opportunity: true } })
      if (!bid) return null

      const project = await projects.create({
        opportunityId: bid.opportunity.id,
        businessId: bid.opportunity.companyId,
        studentId: bid.studentId,
        title: bid.opportunity.title,
        status: 'awarded',
        fundingStatus: bid.opportunity.escrowStatus === 'funded' ? 'funded' : 'pending',
        scopeLocked: false
      })
      const updatedBid = await transaction.bid.update({ where: { id }, data: { status: 'awarded', projectId: project.id } })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'awarded',
          opportunityId: bid.opportunityId,
          actorId,
          metadata: toJson({
            scope: 'applicant',
            bidId: id,
            projectId: project.id
          })
        }
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
