import { randomUUID } from 'node:crypto'
import { KycStatus, type Prisma } from '@prisma/client'
import { env } from '../../../config/env.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'
import {
  OPPORTUNITY_IN_PROGRESS_STATUS,
  canAdvanceOpportunityToInProgress
} from '../../../shared/opportunities/opportunityLifecycle.js'
import { resolveBudgetAmount, shareOfAgreedTotal } from '../../../shared/projects/projectPayouts.js'
import { createSkillSlug, normalizeSkillName as normalizeCanonicalSkillName } from '../skills/index.js'

const projects = createPrismaRecordRepository('projects')
const escrows = createPrismaRecordRepository('escrows')
const deliverables = createPrismaRecordRepository('deliverables')
const milestones = createPrismaRecordRepository('milestones')
const payouts = createPrismaRecordRepository('payouts')

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

type AwardBid = Prisma.BidGetPayload<{ include: { opportunity: true } }>

// The "agreed price" is what the deal is actually settled at when a bid is
// awarded: the student's bid amount if they named one, otherwise the business's
// budget. Payout later distributes this exact number across deliverables, so it
// must be covered by escrow before the project starts.
async function resolveAwardTerms(transaction: Prisma.TransactionClient, bid: AwardBid) {
  const bidAmount = toNumber(bid.bidAmount)
  const budgetAmount = toNumber(bid.opportunity.budgetAmount)
  const agreedAmount = bidAmount > 0 ? bidAmount : budgetAmount
  const agreedCurrency = bid.currency ?? bid.opportunity.currency ?? 'KES'
  const fundedHolds = await transaction.opportunityEscrowHold.findMany({
    where: { opportunityId: bid.opportunityId, status: 'FUNDED' }
  })
  const escrowCoverage = fundedHolds.reduce((total, hold) => total + toNumber(hold.amount), 0)
  return {
    agreedAmount,
    agreedCurrency,
    escrowCoverage,
    // Publication already requires funded escrow. If negotiation raises the
    // agreed price above that hold, the business must top up before awarding.
    blocked: agreedAmount > escrowCoverage
  }
}

// Resolves the project an award attaches to. A task hires one student and gets a
// dedicated project; a project is a team effort where every awarded student
// joins ONE shared project (created on the first award). The awarded student is
// always added to that project's team.
async function resolveOrCreateAwardProject(
  transaction: Prisma.TransactionClient,
  bid: AwardBid,
  terms: { agreedAmount: number; agreedCurrency: string },
  isTaskOpportunity: boolean
) {
  let project = isTaskOpportunity
    ? null
    : (await projects.listAll((item) => item.opportunityId === bid.opportunity.id))[0] ?? null

  if (!project) {
    project = await projects.create({
      opportunityId: bid.opportunity.id,
      businessId: bid.opportunity.companyId,
      studentId: bid.studentId,
      title: bid.opportunity.title,
      status: 'awarded',
      fundingStatus: bid.opportunity.escrowStatus === 'funded' ? 'funded' : 'pending',
      // A shared team project pays out of the single opportunity budget; a task
      // pays the agreed (bid) price.
      agreedAmount: isTaskOpportunity ? terms.agreedAmount : (toNumber(bid.opportunity.budgetAmount) || terms.agreedAmount),
      agreedCurrency: terms.agreedCurrency,
      isTeamProject: !isTaskOpportunity,
      scopeLocked: false
    })
  }

  const studentProfile = await transaction.studentProfile.findUnique({ where: { id: bid.studentId }, select: { userId: true } })
  if (studentProfile?.userId) {
    await transaction.projectTeamMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: studentProfile.userId } },
      update: { status: 'active' },
      create: { projectId: project.id, userId: studentProfile.userId, role: 'Awarded', status: 'active' }
    })
  }

  return project
}

function toBudgetLabel(budget: unknown, currency: unknown) {
  if (budget === undefined || budget === null || budget === '') return undefined
  const amount = toNumber(budget)
  if (!amount) return String(budget)
  return `${String(currency || 'KES')} ${Math.round(amount).toLocaleString('en-KE')}`
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

async function syncOpportunitySkills(transaction: Prisma.TransactionClient, opportunityId: string, skillNames: string[], actorId: string | undefined) {
  const uniqueSkillNames = Array.from(new Map(skillNames
    .map((skillName) => normalizeCanonicalSkillName(String(skillName ?? '')))
    .filter(Boolean)
    .map((skillName) => [createSkillSlug(skillName), skillName])).values())

  if (!uniqueSkillNames.length) {
    await transaction.opportunitySkill.deleteMany({ where: { opportunityId } })
    return []
  }

  const skills = []
  for (const skillName of uniqueSkillNames) {
    const slug = createSkillSlug(skillName)
    const skill = await transaction.skill.upsert({
      where: { slug },
      update: { status: 'active' },
      create: {
        name: skillName,
        slug,
        status: 'active',
        source: 'opportunity',
        createdByUserId: actorId,
        usageCount: 1
      }
    })
    skills.push(skill)
  }

  const skillIds = skills.map((skill) => skill.id)
  await transaction.opportunitySkill.deleteMany({
    where: {
      opportunityId,
      skillId: { notIn: skillIds }
    }
  })

  const existingLinks = await transaction.opportunitySkill.findMany({
    where: {
      opportunityId,
      skillId: { in: skillIds }
    },
    select: { skillId: true }
  })
  const existingSkillIds = new Set(existingLinks.map((link) => link.skillId))
  const missingSkillIds = skillIds.filter((skillId) => !existingSkillIds.has(skillId))
  if (missingSkillIds.length) {
    await transaction.opportunitySkill.createMany({
      data: missingSkillIds.map((skillId) => ({
        opportunityId,
        skillId,
        required: true,
        source: 'opportunity'
      })),
      skipDuplicates: true
    })
  }

  return skills
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
    metadata: scopeItem.metadata ?? {},
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
    applicationsClosed: Boolean(
      opportunity.metadata && typeof opportunity.metadata === 'object' && !Array.isArray(opportunity.metadata)
        ? (opportunity.metadata as Record<string, any>).applicationsClosed
        : false
    ),
    projectEnded: Boolean(
      opportunity.metadata && typeof opportunity.metadata === 'object' && !Array.isArray(opportunity.metadata)
        ? (opportunity.metadata as Record<string, any>).projectEnded
        : false
    ),
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
    budgetLabel: toBudgetLabel(payload.budget ?? payload.budgetAmount, payload.currency),
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
    budgetLabel: payload.budgetAmount === undefined && payload.budget === undefined ? undefined : toBudgetLabel(payload.budget ?? payload.budgetAmount, payload.currency),
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

async function syncOpportunityRequiredAttachments(transaction: any, opportunityId: string, requiredAttachments: Record<string, any>[]) {
  await transaction.opportunityRequiredAttachment.deleteMany({
    where: { opportunityId }
  })

  if (!requiredAttachments.length) return

  await transaction.opportunityRequiredAttachment.createMany({
    data: requiredAttachments.map((attachment: Record<string, any>, index: number) => ({
      opportunityId,
      label: attachment.label ?? '',
      fileType: attachment.fileType ?? '',
      required: attachment.required !== false,
      sortOrder: index + 1
    }))
  })
}

async function syncOpportunityScopeItems(transaction: any, opportunityId: string, payload: Record<string, any>) {
  const hasDeliverables = payload.deliverableMilestones !== undefined
  const hasMilestones = payload.milestoneScopes !== undefined
  if (!hasDeliverables && !hasMilestones) return

  await transaction.opportunityScopeItem.deleteMany({
    where: { opportunityId }
  })

  const scopeItems = [
    ...(Array.isArray(payload.deliverableMilestones) ? payload.deliverableMilestones.map((item: Record<string, any>) => ({ item, scopeType: 'deliverable' })) : []),
    ...(Array.isArray(payload.milestoneScopes) ? payload.milestoneScopes.map((item: Record<string, any>) => ({ item, scopeType: 'milestone' })) : [])
  ]

  await Promise.all(scopeItems.map(async ({ item, scopeType }, index) => {
    const scopeItem = await transaction.opportunityScopeItem.create({
      data: toScopeItemCreateData(opportunityId, item, scopeType, index + 1)
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

  async listBusinessOpportunities(businessId: string | undefined, query: Record<string, unknown>) {
    const page = Number(query.page ?? 1)
    const items = await prisma.opportunity.findMany({
      where: businessId ? { companyId: businessId } : undefined,
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Derive "ended" from the actual project records so a board card reflects an
    // ended project even if the opportunity flag was never written.
    const opportunityIds = new Set(items.map((item) => item.id))
    const relatedProjects = await projects.listAll((project) => opportunityIds.has(project.opportunityId))
    const endedOpportunityIds = new Set(
      relatedProjects.filter((project) => project.endedAt).map((project) => project.opportunityId)
    )
    return {
      data: items.map((item) => {
        const opportunity = toOpportunity(item)
        if (!opportunity) return opportunity
        return { ...opportunity, projectEnded: opportunity.projectEnded || endedOpportunityIds.has(item.id) }
      }),
      meta: {
        page,
        pageSize: items.length,
        total: items.length
      }
    }
  }

  listBusinessProjects(businessId: string | undefined) {
    return projects.listAll((project) => !businessId || project.businessId === businessId)
  }

  async listBusinessCampaigns(businessId: string | undefined) {
    const items = await prisma.marketingCampaign.findMany({
      where: businessId ? { businessId } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    return items.map((campaign) => ({
      ...(campaign.payload && typeof campaign.payload === 'object' && !Array.isArray(campaign.payload) ? campaign.payload : {}),
      ...campaign,
      createdAt: toIso(campaign.createdAt),
      updatedAt: toIso(campaign.updatedAt)
    }))
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

  async listBusinessActivity(businessId: string | undefined, limit = 8) {
    const events = await prisma.opportunityActivityEvent.findMany({
      where: businessId ? { opportunity: { companyId: businessId } } : undefined,
      include: { opportunity: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    const actorIds = Array.from(new Set(events.map((event) => event.actorId).filter(Boolean))) as string[]
    const [users, students] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: actorIds } } }),
      prisma.studentProfile.findMany({ where: { id: { in: actorIds } }, include: { user: true } })
    ])
    const nameByActorId = new Map<string, string>()
    users.forEach((user) => nameByActorId.set(user.id, user.name || user.email))
    students.forEach((student) => nameByActorId.set(student.id, `${student.firstName} ${student.lastName}`.trim() || student.user?.name || 'Student'))

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      note: event.note,
      actorName: (event.actorId && nameByActorId.get(event.actorId)) || 'Zumbarl user',
      opportunityId: event.opportunityId,
      opportunityTitle: event.opportunity?.title,
      createdAt: toIso(event.createdAt)
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

  async deleteOpportunity(id: string) {
    const result = await prisma.opportunity.deleteMany({ where: { id } })
    return result.count > 0
  }

  async updateOpportunity(id: string, patch: Record<string, any>) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.opportunity.findUnique({ where: { id } })
      if (!existing) return null

      await transaction.opportunity.update({
        where: { id },
        data: toOpportunityPatchData({ ...patch, businessId: existing.companyId }, existing.companyId)
      })

      if (patch.requiredAttachments !== undefined) {
        await syncOpportunityRequiredAttachments(
          transaction,
          id,
          Array.isArray(patch.requiredAttachments) ? patch.requiredAttachments : []
        )
      }
      await syncOpportunityScopeItems(transaction, id, patch)

      const opportunity = await transaction.opportunity.findUnique({
        where: { id },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
        }
      })
      return toOpportunity(opportunity)
    })
  }

  updateOpportunityWithEvent(id: string, patch: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.opportunity.findUnique({ where: { id } })
      if (!existing) return null

      await transaction.opportunity.update({
        where: { id },
        data: toOpportunityPatchData({ ...patch, businessId: existing.companyId }, existing.companyId)
      })
      if (patch.skills !== undefined) {
        await syncOpportunitySkills(transaction, id, toStringList(patch.skills), actorId)
      }
      if (patch.requiredAttachments !== undefined) {
        await syncOpportunityRequiredAttachments(
          transaction,
          id,
          Array.isArray(patch.requiredAttachments) ? patch.requiredAttachments : []
        )
      }
      await syncOpportunityScopeItems(transaction, id, patch)
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'updated',
          opportunityId: id,
          actorId,
          metadata: toJson({ changedFields: Object.keys(patch) })
        }
      })
      const opportunity = await transaction.opportunity.findUnique({
        where: { id },
        include: {
          company: true,
          scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
          requiredAttachments: { orderBy: { sortOrder: 'asc' } }
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

  async listOpportunityInviteCandidates(id: string, query: Record<string, unknown>) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        opportunitySkills: { include: { skill: true } },
        invites: true
      }
    })
    if (!opportunity) return null

    const search = String(query.search || query.q || '').trim()
    const opportunitySkills = opportunity.opportunitySkills.map((item) => item.skill.name)
    const opportunitySkillSet = new Set(opportunitySkills.map((skill) => skill.toLowerCase()))
    const invitedStudentIds = new Set(opportunity.invites.map((invite) => invite.studentId))
    const students = await prisma.studentProfile.findMany({
      where: {
        user: {
          isActive: true,
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { studentEmail: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
        }
      },
      include: {
        campus: true,
        course: true,
        studentSkills: { include: { skill: true } },
        user: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 30
    })

    return {
      opportunity: toOpportunity(opportunity),
      candidates: students.map((student) => {
        const skills = student.studentSkills.map((item) => item.skill.name)
        const skillMatches = skills.filter((skill) => opportunitySkillSet.has(skill.toLowerCase())).length
        const match = opportunitySkills.length
          ? Math.min(98, Math.max(45, Math.round((skillMatches / opportunitySkills.length) * 100)))
          : 70

        return {
          id: student.id,
          userId: student.userId,
          name: `${student.firstName} ${student.lastName}`.trim() || student.user.name || student.user.email,
          email: student.user.studentEmail || student.user.email,
          school: [student.campus?.name, student.course?.name].filter(Boolean).join(' · ') || student.locationCity,
          skills,
          skillMatches,
          match,
          status: student.isOpenToHire ? 'Open to work' : student.currentMode,
          alreadyInvited: invitedStudentIds.has(student.id)
        }
      })
    }
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
      where: { opportunityId, status: { not: 'draft' } },
      include: {
        interview: true,
        student: {
          include: {
            campus: true,
            course: true,
            studentSkills: { include: { skill: true } },
            user: {
              select: {
                createdAt: true,
                email: true,
                name: true,
                studentEmail: true,
                username: true
              }
            },
            zumbarl: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })
    const escrowCoverage = await this.getOpportunityEscrowCoverage(opportunityId)
    return Promise.all(items.map(async (item) => {
      const project = item.projectId ? await projects.findById(item.projectId) : null
      return {
      id: item.id,
      opportunityId: item.opportunityId,
      projectId: item.projectId,
      project: project ? {
        id: project.id,
        status: project.status,
        agreedAmount: Number(project.agreedAmount) || Number(item.bidAmount) || 0,
        agreedCurrency: project.agreedCurrency ?? item.currency ?? 'KES',
        escrowCoverage,
        startedAt: project.startedAt ?? null,
        endedAt: project.endedAt ?? null
      } : null,
      status: item.status,
      coverNote: item.coverNote,
      proposal: item.proposal,
      bidAmount: item.bidAmount,
      currency: item.currency,
      counterOffer: (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata))
        ? ((item.metadata as Record<string, any>).counterOffer ?? null)
        : null,
      deliveryTime: item.deliveryTime,
      intentId: item.intentId,
      intentLabel: item.intentLabel,
      questionAnswers: item.questionAnswers,
      attachments: item.attachments,
      interview: item.interview ? {
        ...item.interview,
        scheduledAt: toIso(item.interview.scheduledAt),
        proposedAt: toIso(item.interview.proposedAt),
        respondedAt: toIso(item.interview.respondedAt),
        createdAt: toIso(item.interview.createdAt),
        updatedAt: toIso(item.interview.updatedAt)
      } : null,
      appliedAt: toIso(item.appliedAt),
      respondedAt: toIso(item.respondedAt),
      student: {
        id: item.student.id,
        userId: item.student.userId,
        name: `${item.student.firstName} ${item.student.lastName}`.trim()
          || item.student.user.name
          || item.student.user.email,
        username: item.student.user.username,
        email: item.student.user.studentEmail || item.student.user.email,
        avatarUrl: item.student.avatarUrl,
        bio: item.student.bio,
        locationCity: item.student.locationCity,
        careerPath: item.student.careerPath,
        currentMode: item.student.currentMode,
        isOpenToHire: item.student.isOpenToHire,
        joinedAt: toIso(item.student.user.createdAt),
        campus: item.student.campus?.name,
        course: item.student.course?.name,
        skills: item.student.studentSkills.map((studentSkill) => studentSkill.skill.name),
        score: item.student.zumbarl?.currentScore ?? 0,
        scoreTier: item.student.zumbarl?.tier ?? 'BRONZE',
        completedGigs: item.student.zumbarl?.totalGigsCompleted ?? 0
      }
    }}))
  }

  async listOpportunitySubmissions(opportunityId: string) {
    const opportunityProjects = await projects.listAll((project) => project.opportunityId === opportunityId)
    if (!opportunityProjects.length) return []

    const projectIds = new Set(opportunityProjects.map((project) => project.id))
    const [projectDeliverables, projectMilestones, opportunity, projectPayouts] = await Promise.all([
      deliverables.listAll((item) => projectIds.has(item.projectId)),
      milestones.listAll((item) => projectIds.has(item.projectId)),
      prisma.opportunity.findUnique({
        where: { id: opportunityId },
        select: {
          budgetAmount: true,
          budgetLabel: true,
          currency: true,
          scopeItems: {
            select: { id: true, budgetAmount: true, budgetLabel: true, paymentPercent: true }
          }
        }
      }),
      payouts.listAll((item) => projectIds.has(item.projectId))
    ])
    if (!projectDeliverables.length) return []

    const studentIds = [...new Set(opportunityProjects.map((project) => project.studentId).filter(Boolean))]
    const students = studentIds.length
      ? await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        include: {
          campus: true,
          course: true,
          zumbarl: true,
          user: { select: { name: true, email: true, studentEmail: true, username: true } }
        }
      })
      : []
    const studentById = new Map(students.map((student) => [student.id, student]))
    const milestoneById = new Map(projectMilestones.map((milestone) => [milestone.id, milestone]))
    const projectById = new Map(opportunityProjects.map((project) => [project.id, project]))
    const payoutByDeliverableId = new Map(projectPayouts.map((payout) => [payout.deliverableId, payout]))
    // A deliverable is settled when its budget has actually been released, not
    // when its submissions happen to all be approved: the business can approve
    // the last task and the team can still add more work afterwards.
    const paidScopeItemIds = new Set(projectPayouts.map((payout) => payout.scopeItemId).filter(Boolean))
    const paidMilestoneIds = new Set(projectPayouts.map((payout) => payout.milestoneId).filter(Boolean))
    const scopeItems = (opportunity?.scopeItems ?? []).map((item) => ({
      id: item.id,
      budgetAmount: resolveBudgetAmount(item.budgetAmount, item.budgetLabel),
      paymentPercent: Number(item.paymentPercent ?? 0)
    }))
    const scopeItemById = new Map(scopeItems.map((item) => [item.id, item]))

    return projectDeliverables
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((deliverable) => {
        const project = projectById.get(deliverable.projectId)
        const student = project?.studentId ? studentById.get(project.studentId) : null
        const milestone = deliverable.milestoneId ? milestoneById.get(deliverable.milestoneId) : null
        const projectAgreedAmount = Number(project?.agreedAmount) > 0
          ? Number(project?.agreedAmount)
          : resolveBudgetAmount(opportunity?.budgetAmount, opportunity?.budgetLabel)
        const projectAgreedCurrency = project?.agreedCurrency ?? opportunity?.currency ?? 'KES'
        const existingPayout = payoutByDeliverableId.get(deliverable.id)
        let payoutAmount = projectAgreedAmount

        if (deliverable.milestoneId) {
          const matchingMilestones = projectMilestones.filter((item) => item.projectId === deliverable.projectId)
          const isFinalMilestone = matchingMilestones.every((item) => (
            item.id === deliverable.milestoneId || item.status === 'approved'
          ))
          payoutAmount = projectAgreedAmount > 0
            ? shareOfAgreedTotal(projectAgreedAmount, matchingMilestones, deliverable.milestoneId, isFinalMilestone, (item) => Number(item.budgetAmount ?? 0))
            : Number(milestone?.budgetAmount ?? 0)
        } else if (deliverable.scopeItemId) {
          const approvedScopeIds = new Set(projectDeliverables
            .filter((item) => item.projectId === deliverable.projectId && item.status === 'approved')
            .map((item) => item.scopeItemId)
            .filter(Boolean))
          approvedScopeIds.add(deliverable.scopeItemId)
          const isFinalScopeItem = scopeItems.length > 0 && scopeItems.every((item) => approvedScopeIds.has(item.id))
          const scopeItem = scopeItemById.get(deliverable.scopeItemId)
          payoutAmount = projectAgreedAmount > 0 && scopeItems.length > 0
            ? shareOfAgreedTotal(projectAgreedAmount, scopeItems, deliverable.scopeItemId, isFinalScopeItem, (item) => (item.paymentPercent > 0 ? item.paymentPercent : item.budgetAmount))
            : Number(scopeItem?.budgetAmount ?? 0)
        }

        if (existingPayout) payoutAmount = Number(existingPayout.amount ?? payoutAmount)
        return {
          id: deliverable.id,
          projectId: deliverable.projectId,
          projectTitle: project?.title ?? null,
          projectAgreedAmount,
          projectAgreedCurrency,
          payoutAmount,
          payoutCurrency: existingPayout?.currency ?? projectAgreedCurrency,
          milestoneId: deliverable.milestoneId ?? null,
          milestoneTitle: milestone?.title ?? null,
          milestoneBudget: milestone?.budgetAmount ?? null,
          scopeItemId: deliverable.scopeItemId ?? null,
          scopeItemLabel: deliverable.scopeItemLabel ?? null,
          scopeItemPaid: deliverable.scopeItemId
            ? paidScopeItemIds.has(deliverable.scopeItemId)
            : deliverable.milestoneId
              ? paidMilestoneIds.has(deliverable.milestoneId)
              : false,
          title: deliverable.title,
          kind: deliverable.kind ?? 'final',
          notes: deliverable.notes ?? '',
          feedbackRequest: deliverable.feedbackRequest ?? '',
          files: Array.isArray(deliverable.files) ? deliverable.files : [],
          status: deliverable.status,
          feedback: deliverable.feedback ?? '',
          revisionCount: deliverable.revisionCount ?? 0,
          isRevision: Boolean(deliverable.isRevision),
          revisionNumber: Number(deliverable.revisionNumber ?? 0),
          revisionOfId: deliverable.revisionOfId ?? null,
          supersededById: deliverable.supersededById ?? null,
          submittedAt: deliverable.createdAt,
          updatedAt: deliverable.updatedAt,
          student: student ? {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`.trim() || student.user.name || student.user.email,
            username: student.user.username,
            avatarUrl: student.avatarUrl,
            campus: student.campus?.name,
            course: student.course?.name,
            locationCity: student.locationCity,
            score: student.zumbarl?.currentScore ?? 0
          } : null
        }
      })
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

  async findScopeLockedOpportunityProject(opportunityId: string) {
    const lockedStatuses = new Set(['active', 'in_progress', 'in progress', 'ended', 'completed', 'closed'])
    const opportunityProjects = await projects.listAll((project) => project.opportunityId === opportunityId)
    return opportunityProjects.find((project) => (
      project.scopeLocked === true
      || Boolean(project.startedAt)
      || Boolean(project.endedAt)
      || lockedStatuses.has(String(project.status || '').toLowerCase())
    )) ?? null
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
      await syncOpportunitySkills(transaction, opportunity.id, toStringList(payload.skills), actorId)
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

  fundOpportunity(id: string, payload: Record<string, any>, actorId?: string) {
    return prisma.$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.findUnique({ where: { id } })
      if (!opportunity) return null

      const existingEscrow = payload.reference
        ? await transaction.opportunityEscrowHold.findFirst({
            where: { opportunityId: id, transactionRef: payload.reference }
          })
        : null

      if (existingEscrow) {
        const currentOpportunity = await transaction.opportunity.findUnique({
          where: { id },
          include: {
            company: true,
            scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
            requiredAttachments: { orderBy: { sortOrder: 'asc' } }
          }
        })
        return { opportunity: toOpportunity(currentOpportunity), escrow: existingEscrow }
      }

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
      const fundedHolds = await transaction.opportunityEscrowHold.findMany({
        where: { opportunityId: id, status: 'FUNDED' },
        select: { amount: true }
      })
      const escrowCoverage = fundedHolds.reduce((total, hold) => total + toNumber(hold.amount), 0)
      const updatedOpportunity = await transaction.opportunity.update({
        where: { id },
        data: {
          escrowStatus: escrowCoverage >= opportunity.budgetAmount ? 'funded' : 'partially_funded'
        },
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
          actorId,
          metadata: toJson({ escrowId: escrow.id, amount: escrow.amount, currency: escrow.currency })
        }
      })
      return { opportunity: toOpportunity(updatedOpportunity), escrow }
    })
  }

  async getOpportunityEscrowCoverage(id: string) {
    const holds = await prisma.opportunityEscrowHold.findMany({
      where: { opportunityId: id, status: 'FUNDED' },
      select: { amount: true }
    })
    return holds.reduce((total, hold) => total + toNumber(hold.amount), 0)
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
      const opportunity = await transaction.opportunity.findUnique({ where: { id }, include: { company: true } })
      if (!opportunity) return null

      const students = await transaction.studentProfile.findMany({
        where: { id: { in: payload.studentIds } },
        include: { user: true }
      })
      const existingInvites = await transaction.opportunityInvite.findMany({
        where: { opportunityId: id, studentId: { in: students.map((student) => student.id) } },
        select: { studentId: true }
      })
      const existingStudentIds = new Set(existingInvites.map((invite) => invite.studentId))
      const studentsToInvite = students.filter((student) => !existingStudentIds.has(student.id))

      const invites = await Promise.all(studentsToInvite.map((student) => transaction.opportunityInvite.create({
        data: {
          opportunityId: id,
          studentId: student.id,
          note: payload.note,
          status: 'sent',
          metadata: toJson({
            email: student.user.studentEmail || student.user.email,
            notification: 'queued'
          })
        }
      })))
      await Promise.all(studentsToInvite.map((student) => transaction.notification.create({
        data: {
          userId: student.userId,
          type: 'OPPORTUNITY_INVITE',
          title: `New opportunity invite: ${opportunity.title}`,
          body: payload.note || `${opportunity.company?.name || 'A business'} invited you to apply for ${opportunity.title}.`,
          data: toJson({
            opportunityId: id,
            inviteId: invites.find((invite) => invite.studentId === student.id)?.id,
            deepLink: `/campus/opportunities?opportunity=${encodeURIComponent(id)}`
          }),
          sentVia: ['IN_APP', 'PUSH', 'EMAIL']
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
      return {
        opportunity,
        invites,
        recipients: studentsToInvite.map((student) => ({
          email: student.user.studentEmail || student.user.email,
          name: `${student.firstName} ${student.lastName}`.trim() || student.user.name || student.user.email,
          userId: student.userId
        }))
      }
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

  scheduleApplicantInterview(id: string, payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({
        where: { id },
        include: {
          opportunity: { include: { company: true } },
          student: { include: { user: true } }
        }
      })
      if (!bid) return null

      const meetingUrl = payload.meetingOption === 'generated'
        ? `${env.JITSI_PUBLIC_URL.replace(/\/+$/, '')}/zumbarl-${randomUUID().replaceAll('-', '')}`
        : payload.meetingUrl
      const interview = await transaction.opportunityInterview.upsert({
        where: { bidId: bid.id },
        update: {
          scheduledById: actorId,
          interviewType: payload.interviewType,
          scheduledAt: new Date(payload.interviewAt),
          durationMinutes: payload.durationMinutes,
          timezone: payload.timezone,
          meetingOption: payload.meetingOption,
          meetingUrl,
          note: payload.note,
          status: 'pending',
          studentResponseNote: null,
          proposedAt: null,
          respondedAt: null
        },
        create: {
          bidId: bid.id,
          opportunityId: bid.opportunityId,
          studentId: bid.studentId,
          scheduledById: actorId,
          interviewType: payload.interviewType,
          scheduledAt: new Date(payload.interviewAt),
          durationMinutes: payload.durationMinutes,
          timezone: payload.timezone,
          meetingOption: payload.meetingOption,
          meetingUrl,
          note: payload.note,
          status: 'pending'
        }
      })

      await transaction.bid.update({
        where: { id: bid.id },
        data: { status: 'shortlisted', respondedAt: new Date() }
      })
      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'interview_scheduled',
          opportunityId: bid.opportunityId,
          actorId,
          note: payload.note,
          metadata: toJson({
            scope: 'applicant',
            bidId: bid.id,
            studentId: bid.studentId,
            interviewId: interview.id,
            interviewAt: payload.interviewAt,
            durationMinutes: payload.durationMinutes,
            meetingOption: payload.meetingOption
          })
        }
      })
      await transaction.notification.create({
        data: {
          userId: bid.student.userId,
          type: 'INTERVIEW_SCHEDULED',
          title: `You're shortlisted: ${bid.opportunity.title}`,
          body: `${bid.opportunity.company?.name || 'A business'} scheduled an interview with you.`,
          data: toJson({
            opportunityId: bid.opportunityId,
            bidId: bid.id,
            interviewId: interview.id,
            deepLink: `/campus/interviews/${interview.id}`
          }),
          sentVia: ['IN_APP', 'PUSH', 'EMAIL']
        }
      })

      return {
        interview: {
          ...interview,
          scheduledAt: toIso(interview.scheduledAt),
          proposedAt: toIso(interview.proposedAt),
          respondedAt: toIso(interview.respondedAt)
        },
        recipient: {
          email: bid.student.user.studentEmail || bid.student.user.email,
          name: `${bid.student.firstName} ${bid.student.lastName}`.trim(),
          opportunityTitle: bid.opportunity.title,
          companyName: bid.opportunity.company?.name || 'Zumbarl business'
        }
      }
    })
  }

  startApplicantInterview(id: string, actorId: string) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({
        where: { id },
        include: {
          interview: true,
          opportunity: { include: { company: true } },
          student: { include: { user: true } }
        }
      })
      if (!bid?.interview) return null
      if (bid.interview.status !== 'confirmed') {
        return { blockedReason: 'The student has not confirmed this interview.' }
      }
      if (!bid.interview.meetingUrl) {
        return { blockedReason: 'This interview does not have a meeting link.' }
      }

      const existingMessage = await transaction.message.findFirst({
        where: {
          opportunityId: bid.opportunityId,
          senderId: actorId,
          recipientId: bid.student.userId,
          body: 'Interview started'
        },
        orderBy: { createdAt: 'desc' }
      })
      const message = existingMessage ?? await transaction.message.create({
        data: {
          opportunityId: bid.opportunityId,
          senderId: actorId,
          recipientId: bid.student.userId,
          body: 'Interview started',
          fileUrls: []
        }
      })

      const existingNotification = await transaction.notification.findFirst({
        where: {
          userId: bid.student.userId,
          type: 'INTERVIEW_STARTED',
          data: { path: ['interviewId'], equals: bid.interview.id }
        }
      })
      if (!existingNotification) {
        await transaction.notification.create({
          data: {
            userId: bid.student.userId,
            type: 'INTERVIEW_STARTED',
            title: `Interview started: ${bid.opportunity.title}`,
            body: `${bid.opportunity.company?.name || 'The business'} has started your interview.`,
            data: toJson({
              opportunityId: bid.opportunityId,
              bidId: bid.id,
              interviewId: bid.interview.id,
              senderId: actorId,
              deepLink: `/campus/interviews/${bid.interview.id}`
            }),
            sentVia: ['IN_APP', 'PUSH']
          }
        })
      }

      const existingActivity = await transaction.opportunityActivityEvent.findFirst({
        where: {
          action: 'interview_started',
          opportunityId: bid.opportunityId,
          metadata: { path: ['interviewId'], equals: bid.interview.id }
        }
      })
      if (!existingActivity) {
        await transaction.opportunityActivityEvent.create({
          data: {
            action: 'interview_started',
            opportunityId: bid.opportunityId,
            actorId,
            metadata: toJson({
              scope: 'applicant',
              bidId: bid.id,
              studentId: bid.studentId,
              interviewId: bid.interview.id,
              messageId: message.id
            })
          }
        })
      }

      const messages = await transaction.message.findMany({
        where: {
          opportunityId: bid.opportunityId,
          OR: [
            { senderId: actorId, recipientId: bid.student.userId },
            { senderId: bid.student.userId, recipientId: actorId }
          ]
        },
        include: {
          sender: { select: { id: true, name: true } },
          recipient: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
      })

      return {
        interview: {
          id: bid.interview.id,
          meetingUrl: bid.interview.meetingUrl,
          status: bid.interview.status
        },
        conversation: {
          opportunityId: bid.opportunityId,
          opportunityTitle: bid.opportunity.title,
          participant: {
            id: bid.student.userId,
            name: `${bid.student.firstName} ${bid.student.lastName}`.trim()
              || bid.student.user.name
              || bid.student.user.email,
            avatarUrl: bid.student.avatarUrl
          },
          messages: messages.map((item) => ({
            id: item.id,
            body: item.body,
            senderId: item.senderId,
            recipientId: item.recipientId,
            senderName: item.sender.name,
            createdAt: toIso(item.createdAt),
            isMine: item.senderId === actorId
          }))
        },
        notificationCreated: !existingNotification,
        messageCreated: !existingMessage
      }
    })
  }

  // Business toggles whether a project opportunity keeps taking applications.
  // Used to mark a team project "at capacity" (or reopen it).
  async setOpportunityApplicationsClosed(id: string, closed: boolean) {
    const opportunity = await prisma.opportunity.findUnique({ where: { id } })
    if (!opportunity) return null
    const metadata = (opportunity.metadata && typeof opportunity.metadata === 'object' && !Array.isArray(opportunity.metadata))
      ? { ...(opportunity.metadata as Record<string, any>) }
      : {}
    metadata.applicationsClosed = closed
    metadata.applicationsClosedReason = closed ? 'at_capacity' : null
    const updated = await prisma.opportunity.update({
      where: { id },
      data: { metadata: toJson(metadata) },
      include: {
        company: true,
        scopeItems: { include: { sampleWork: true }, orderBy: { sequence: 'asc' } },
        requiredAttachments: { orderBy: { sortOrder: 'asc' } }
      }
    })
    return toOpportunity(updated)
  }

  // Business counter-offers a lower price on a bid before shortlisting/awarding.
  // Stored on the bid's metadata (no schema change); the student accepts or
  // rejects, and an accepted offer overwrites the bid amount. A replacement
  // offer is allowed only after a non-auto-reject offer was declined.
  async counterOfferApplicantBid(
    bidId: string,
    amount: number,
    currency?: string,
    autoRejectOnDecline = false
  ) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { student: true, opportunity: { include: { company: true } } }
    })
    if (!bid) return null

    const metadata = (bid.metadata && typeof bid.metadata === 'object' && !Array.isArray(bid.metadata))
      ? { ...(bid.metadata as Record<string, any>) }
      : {}
    const counterOffer = {
      amount,
      autoRejectOnDecline,
      currency: currency ?? bid.currency ?? 'KES',
      previousAmount: bid.bidAmount ?? null,
      status: 'pending',
      proposedAt: new Date().toISOString()
    }
    metadata.counterOffer = counterOffer
    await prisma.bid.update({ where: { id: bidId }, data: { metadata: toJson(metadata) } })

    await prisma.notification.create({
      data: {
        userId: bid.student.userId,
        type: 'BID_COUNTER_OFFER',
        title: `New price offer: ${bid.opportunity.title}`,
        body: `${bid.opportunity.company?.name || 'A business'} offered ${counterOffer.currency} ${amount.toLocaleString()} for your bid. Review and respond.`,
        data: toJson({ opportunityId: bid.opportunityId, bidId: bid.id, deepLink: `/campus/opportunities?tab=bids&bid=${bid.id}` })
      }
    })

    return { bidId, counterOffer }
  }

  async respondToBidCounterOffer(bidId: string, decision: 'accepted' | 'rejected', studentId?: string) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { opportunity: { include: { company: true } } }
    })
    if (!bid) return null
    if (studentId && bid.studentId !== studentId) return { ok: false as const, reason: 'forbidden' as const }

    const metadata = (bid.metadata && typeof bid.metadata === 'object' && !Array.isArray(bid.metadata))
      ? { ...(bid.metadata as Record<string, any>) }
      : {}
    const counterOffer = metadata.counterOffer as Record<string, any> | undefined
    if (!counterOffer || counterOffer.status !== 'pending') return { ok: false as const, reason: 'not_pending' as const }

    counterOffer.status = decision
    counterOffer.respondedAt = new Date().toISOString()
    metadata.counterOffer = counterOffer

    const shouldAutoRejectApplication = decision === 'rejected'
      && counterOffer.autoRejectOnDecline === true
      && !['accepted', 'awarded'].includes(String(bid.status || '').toLowerCase())
    const data: Record<string, any> = { metadata: toJson(metadata) }
    if (decision === 'accepted') {
      data.bidAmount = counterOffer.amount
      data.currency = counterOffer.currency ?? bid.currency
    } else if (shouldAutoRejectApplication) {
      data.status = 'rejected'
      data.respondedAt = new Date()
    }
    await prisma.bid.update({ where: { id: bidId }, data })

    const contact = await prisma.companyContact.findFirst({
      where: { companyId: bid.opportunity.companyId },
      orderBy: { isOwner: 'desc' },
      select: { userId: true }
    })
    if (contact?.userId) {
      await prisma.notification.create({
        data: {
          userId: contact.userId,
          type: 'BID_COUNTER_OFFER_RESPONSE',
          title: decision === 'accepted'
            ? 'Price offer accepted'
            : shouldAutoRejectApplication ? 'Offer declined — application rejected' : 'Price offer declined',
          body: decision === 'accepted'
            ? `A student accepted your ${counterOffer.currency} ${Number(counterOffer.amount).toLocaleString()} offer for "${bid.opportunity.title}".`
            : shouldAutoRejectApplication
              ? `A student declined your ${counterOffer.currency} ${Number(counterOffer.amount).toLocaleString()} offer for "${bid.opportunity.title}". Their application was automatically moved to Rejected.`
              : `A student declined your ${counterOffer.currency} ${Number(counterOffer.amount).toLocaleString()} offer for "${bid.opportunity.title}".`,
          data: toJson({
            opportunityId: bid.opportunityId,
            bidId: bid.id,
            decision,
            applicationAutoRejected: shouldAutoRejectApplication,
            deepLink: '/business/opportunities'
          })
        }
      })
    }

    return {
      ok: true as const,
      decision,
      bidId,
      counterOffer,
      applicationAutoRejected: shouldAutoRejectApplication
    }
  }

  awardApplicantProject(id: string) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({ where: { id }, include: { opportunity: true } })
      if (!bid) return null

      const terms = await resolveAwardTerms(transaction, bid)
      if (terms.blocked) {
        return { awarded: false, reason: 'escrow_below_agreed_amount', agreedAmount: terms.agreedAmount, escrowCoverage: terms.escrowCoverage, currency: terms.agreedCurrency }
      }

      const isTaskOpportunity = String(bid.opportunity.opportunityType || '').toLowerCase() === 'task'
      const project = await resolveOrCreateAwardProject(transaction, bid, terms, isTaskOpportunity)
      const updatedBid = await transaction.bid.update({ where: { id }, data: { status: 'awarded', projectId: project.id } })
      return { awarded: true, bid: updatedBid, project }
    })
  }

  awardApplicantProjectWithEvent(id: string, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const bid = await transaction.bid.findUnique({ where: { id }, include: { opportunity: true } })
      if (!bid) return null

      const terms = await resolveAwardTerms(transaction, bid)
      if (terms.blocked) {
        return { awarded: false, reason: 'escrow_below_agreed_amount', agreedAmount: terms.agreedAmount, escrowCoverage: terms.escrowCoverage, currency: terms.agreedCurrency }
      }

      // A task hires one student, so awarding closes it to further applications.
      // A project is a team effort: awards share one project and it stays open
      // until the business marks it at capacity.
      const isTaskOpportunity = String(bid.opportunity.opportunityType || '').toLowerCase() === 'task'
      const project = await resolveOrCreateAwardProject(transaction, bid, terms, isTaskOpportunity)
      const updatedBid = await transaction.bid.update({ where: { id }, data: { status: 'awarded', projectId: project.id } })

      // Talent is selected, so the brief is no longer merely open. The status is
      // reporting only: a project opportunity keeps accepting applications
      // because that gate lives in metadata.applicationsClosed.
      const opportunityPatch: Record<string, any> = {}
      if (canAdvanceOpportunityToInProgress(bid.opportunity.status)) {
        opportunityPatch.status = OPPORTUNITY_IN_PROGRESS_STATUS
      }
      if (isTaskOpportunity) {
        const existingMetadata = (bid.opportunity.metadata && typeof bid.opportunity.metadata === 'object' && !Array.isArray(bid.opportunity.metadata))
          ? { ...(bid.opportunity.metadata as Record<string, any>) }
          : {}
        existingMetadata.applicationsClosed = true
        existingMetadata.applicationsClosedReason = 'awarded'
        opportunityPatch.metadata = toJson(existingMetadata)
      }
      if (Object.keys(opportunityPatch).length) {
        await transaction.opportunity.update({ where: { id: bid.opportunityId }, data: opportunityPatch })
      }

      await transaction.opportunityActivityEvent.create({
        data: {
          action: 'awarded',
          opportunityId: bid.opportunityId,
          actorId,
          metadata: toJson({
            scope: 'applicant',
            bidId: id,
            projectId: project.id,
            agreedAmount: terms.agreedAmount,
            agreedCurrency: terms.agreedCurrency
          })
        }
      })
      return { awarded: true, bid: updatedBid, project }
    })
  }
}

const businessWorkflowsRepository = new BusinessWorkflowsRepository()

export {
  BusinessWorkflowsRepository,
  businessWorkflowsRepository
}
