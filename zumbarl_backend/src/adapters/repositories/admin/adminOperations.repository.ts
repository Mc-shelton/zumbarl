import { Prisma, UserRole, KycStatus } from '@prisma/client'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const opportunities = createPrismaRecordRepository('opportunities')
const projects = createPrismaRecordRepository('projects')
const campaigns = createPrismaRecordRepository('campaigns')
const orders = createPrismaRecordRepository('orders')
const cases = createPrismaRecordRepository('moderationCases')
const bids = createPrismaRecordRepository('bids')
const escrows = createPrismaRecordRepository('escrows')
const platformConfigurations = createPrismaRecordRepository('platformConfigurations')
const featureFlags = createPrismaRecordRepository('featureFlags')
const notificationTemplates = createPrismaRecordRepository('notificationTemplates')
const integrationHealth = createPrismaRecordRepository('integrationHealth')
const protectiveRules = createPrismaRecordRepository('protectiveRules')
const scoreConfigurations = createPrismaRecordRepository('scoreConfigurations')
const contentQueue = createPrismaRecordRepository('contentModerationQueue')

function normalizeRole(role: string | undefined) {
  if (!role) return undefined
  return UserRole[role as keyof typeof UserRole]
}

function normalizeKycStatus(status: string | undefined) {
  if (!status) return undefined
  const normalized = status.toUpperCase()
  if (normalized === 'IN_REVIEW') return KycStatus.UNDER_REVIEW
  if (normalized === 'VERIFIED') return KycStatus.APPROVED
  return KycStatus[normalized as keyof typeof KycStatus]
}

function sanitizeUser(user: Record<string, any>) {
  const safe = { ...user }
  delete safe.passwordHash
  return safe
}

function getActorId(actorId: string | undefined) {
  return actorId ?? 'system'
}

type AuditContext = {
  actorId?: string
  ipAddress?: string
}

function normalizeAuditContext(context?: string | AuditContext): AuditContext {
  if (!context) return {}
  return typeof context === 'string' ? { actorId: context } : context
}

function toAuditValue(value: unknown) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown> | null
}

function pickChangedFields(before: unknown, after: unknown) {
  const previous = toAuditValue(before)
  const next = toAuditValue(after)

  if (!previous || !next || Array.isArray(previous) || Array.isArray(next)) {
    return { before: previous, after: next }
  }

  const beforeChanges: Record<string, unknown> = {}
  const afterChanges: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

  keys.forEach((key) => {
    const previousValue = previous[key]
    const nextValue = next[key]
    if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      beforeChanges[key] = previousValue
      afterChanges[key] = nextValue
    }
  })

  return { before: beforeChanges, after: afterChanges }
}

function toAuditJson(value: unknown) {
  if (value === undefined) return undefined
  return value as Prisma.InputJsonValue
}

class AdminOperationsRepository {
  private async audit(action: string, entityType: string, entityId: string, context: string | AuditContext | undefined, before: unknown, after: unknown, reason?: string) {
    const auditContext = normalizeAuditContext(context)
    const changes = pickChangedFields(before, after)
    const afterWithReason = reason ? { ...changes.after, reason } : changes.after

    return prisma.auditLog.create({
      data: {
        userId: getActorId(auditContext.actorId),
        action,
        entityType,
        entityId,
        before: toAuditJson(changes.before),
        after: toAuditJson(afterWithReason),
        ipAddress: auditContext.ipAddress
      }
    })
  }

  async readMetrics() {
    const [userCount, studentCount, businessCount, opportunityCount, projectCount, campaignCount, orderCount, openModerationCaseCount] = await Promise.all([
      prisma.user.count(),
      prisma.studentProfile.count(),
      prisma.company.count(),
      opportunities.count(),
      projects.count(),
      campaigns.count(),
      orders.count(),
      cases.count((item) => item.status === 'open')
    ])

    return {
      users: userCount,
      students: studentCount,
      businesses: businessCount,
      opportunities: opportunityCount,
      projects: projectCount,
      campaigns: campaignCount,
      orders: orderCount,
      openModerationCases: openModerationCaseCount
    }
  }

  async readSuperAdminDashboard() {
    const [metrics, finance, gigs, safety, analytics, recentAuditLogs] = await Promise.all([
      this.readMetrics(),
      this.readFinancialOversight({ pageSize: 5 }),
      this.readGigOversight({ pageSize: 5 }),
      this.readSafetyMetrics(),
      this.readAnalyticsReport(),
      this.listAuditLogs({ pageSize: 8 })
    ])

    return {
      metrics,
      finance: finance.summary,
      gigs: gigs.summary,
      safety: safety.summary,
      analytics: analytics.summary,
      recentAuditLogs: recentAuditLogs.data
    }
  }

  async listUsers(query: Record<string, unknown>) {
    const search = String(query.search ?? '').trim()
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { studentProfile: { studentIdNumber: { contains: search, mode: 'insensitive' } } },
            { companyContact: { company: { registrationNumber: { contains: search, mode: 'insensitive' } } } }
          ]
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: { select: { id: true, firstName: true, lastName: true, kycStatus: true, studentIdNumber: true } },
        companyContact: { select: { companyId: true, isOwner: true, company: { select: { name: true, registrationNumber: true, kycStatus: true } } } }
      }
    })
    return pageEnvelope(users.map(sanitizeUser), query)
  }

  async updateUser(id: string, patch: Record<string, any>, context?: AuditContext) {
    const before = await prisma.user.findUnique({ where: { id } })
    if (!before) return null
    const role = normalizeRole(patch.role)
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: patch.name,
        phone: patch.phone,
        role,
        isActive: patch.status ? patch.status === 'active' : patch.isActive,
        isVerified: patch.isVerified
      }
    })
    await this.audit('user_updated', 'user', id, context, sanitizeUser(before), sanitizeUser(updated), patch.reason)
    return updated
  }

  async revokeUserSessions(id: string, context?: AuditContext, reason?: string) {
    const before = await prisma.session.count({ where: { userId: id, revokedAt: null } })
    const result = await prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
    await this.audit('sessions_revoked', 'user', id, context, { activeSessions: before }, { activeSessions: before - result.count, revokedSessions: result.count }, reason)
    return { userId: id, revokedSessions: result.count }
  }

  async reviewUserKyc(id: string, payload: Record<string, any>, context?: AuditContext) {
    const user = await prisma.user.findUnique({ where: { id }, include: { studentProfile: true, companyContact: true } })
    if (!user) return null
    const status = normalizeKycStatus(payload.status)
    if (!status) return null

    if (user.studentProfile) {
      const before = user.studentProfile
      const after = await prisma.studentProfile.update({ where: { id: before.id }, data: { kycStatus: status } })
      await this.audit('student_kyc_reviewed', 'student_profile', before.id, context, before, after, payload.reason)
      return after
    }

    const companyId = user.companyContact?.companyId
    if (!companyId) return null
    const before = await prisma.company.findUnique({ where: { id: companyId } })
    const after = await prisma.company.update({ where: { id: companyId }, data: { kycStatus: status, kycVerifiedAt: status === KycStatus.APPROVED ? new Date() : null } })
    await this.audit('company_kyc_reviewed', 'company', companyId, context, before, after, payload.reason)
    return after
  }

  async mergeDuplicateAccounts(payload: Record<string, any>, context?: AuditContext) {
    const source = await prisma.user.findUnique({ where: { id: payload.sourceUserId }, include: { studentProfile: true } })
    const target = await prisma.user.findUnique({ where: { id: payload.targetUserId }, include: { studentProfile: true } })
    if (!source || !target || !source.studentProfile || !target.studentProfile) return null

    await prisma.$transaction([
      prisma.portfolioItem.updateMany({ where: { studentId: source.studentProfile.id }, data: { studentId: target.studentProfile.id } }),
      prisma.gigApplication.updateMany({ where: { studentId: source.studentProfile.id }, data: { studentId: target.studentProfile.id } }),
      prisma.wallet.updateMany({ where: { studentId: source.studentProfile.id }, data: { studentId: target.studentProfile.id } }),
      prisma.user.update({ where: { id: source.id }, data: { isActive: false } })
    ])
    await this.audit('accounts_merged', 'user', target.id, context, { sourceUserId: source.id }, { sourceUserId: null, targetUserId: target.id }, payload.reason)
    return { sourceUserId: source.id, targetUserId: target.id, status: 'merged' }
  }

  async readFinancialOversight(query: Record<string, unknown>) {
    const [transactions, escrowHolds, companyWallets, studentWallets, chamaWallets, advances, workflowEscrows] = await Promise.all([
      prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }),
      prisma.escrowHold.findMany({ orderBy: { heldAt: 'desc' }, take: 25 }),
      prisma.companyWallet.findMany({ orderBy: { updatedAt: 'desc' }, take: 25, include: { company: { select: { name: true } } } }),
      prisma.wallet.findMany({ orderBy: { updatedAt: 'desc' }, take: 25 }),
      prisma.chamaWallet.findMany({ orderBy: { updatedAt: 'desc' }, take: 25, include: { chama: { select: { name: true } } } }),
      prisma.microAdvance.findMany({ orderBy: { issuedAt: 'desc' }, take: 25 }),
      escrows.listAll()
    ])
    const totalVolume = transactions.reduce((sum, item) => sum + item.amount, 0) + workflowEscrows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
    return {
      summary: {
        transactions: transactions.length,
        escrowHolds: escrowHolds.length + workflowEscrows.length,
        activeAdvances: advances.filter((item) => item.status === 'ACTIVE').length,
        totalVolume,
        companyWalletBalance: companyWallets.reduce((sum, item) => sum + item.balance, 0),
        studentWalletBalance: studentWallets.reduce((sum, item) => sum + item.balance, 0),
        chamaWalletBalance: chamaWallets.reduce((sum, item) => sum + item.balance, 0)
      },
      transactions: pageEnvelope(transactions, query),
      escrowHolds: escrowHolds.slice(0, 10),
      workflowEscrows: workflowEscrows.slice(0, 10),
      advances: advances.slice(0, 10)
    }
  }

  async recordFinancialAction(payload: Record<string, any>, context?: AuditContext) {
    const action = await platformConfigurations.create({
      type: 'financial_action',
      action: payload.action,
      scope: payload.scope,
      scopeId: payload.scopeId,
      amount: payload.amount,
      reference: payload.reference,
      reason: payload.reason,
      requiresTwoFactor: true,
      status: 'recorded'
    })
    await this.audit(`financial_${payload.action}`, payload.scope ?? 'finance', payload.scopeId ?? action.id, context, null, action, payload.reason)
    return action
  }

  async readGigOversight(query: Record<string, unknown>) {
    const [gigs, workflowOpportunities, workflowBids, workflowProjects] = await Promise.all([
      prisma.gig.findMany({ orderBy: { createdAt: 'desc' }, take: 25, include: { company: { select: { name: true } } } }),
      opportunities.listAll(),
      bids.listAll(),
      projects.listAll()
    ])
    const disputedGigs = gigs.filter((gig) => ['DISPUTED', 'REVISION_REQUESTED'].includes(gig.status))
    return {
      summary: {
        structuredGigs: gigs.length,
        workflowOpportunities: workflowOpportunities.length,
        open: gigs.filter((gig) => gig.status === 'OPEN').length + workflowOpportunities.filter((item) => item.status === 'published' || item.status === 'open').length,
        disputed: disputedGigs.length + workflowOpportunities.filter((item) => item.status === 'disputed').length,
        bids: workflowBids.length,
        projects: workflowProjects.length
      },
      gigs: pageEnvelope([...gigs, ...workflowOpportunities], query),
      disputes: [...disputedGigs, ...workflowOpportunities.filter((item) => item.status === 'disputed')]
    }
  }

  async updateGigOversight(payload: Record<string, any>, context?: AuditContext) {
    const action = await platformConfigurations.create({ type: 'gig_oversight_action', ...payload })
    await this.audit(`gig_${payload.action}`, payload.entityType ?? 'gig', payload.entityId ?? action.id, context, null, action, payload.reason)
    return action
  }

  async readScoreControl() {
    const [scores, scoreSnapshots, stages, endorsements, certificates, configs] = await Promise.all([
      prisma.zumbarlScore.findMany({ orderBy: { updatedAt: 'desc' }, take: 25 }),
      prisma.scoreSnapshot.count(),
      prisma.careerStageProgress.findMany({ orderBy: { updatedAt: 'desc' }, take: 25 }),
      prisma.endorsement.findMany({ orderBy: { createdAt: 'desc' }, take: 25, include: { company: { select: { name: true } } } }),
      prisma.certificate.findMany({ orderBy: { issuedAt: 'desc' }, take: 25 }),
      scoreConfigurations.listAll()
    ])
    return {
      summary: {
        scoresTracked: scores.length,
        scoreSnapshots,
        stageRecords: stages.length,
        endorsements: endorsements.length,
        certificates: certificates.length,
        activeConfigurations: configs.length
      },
      scores,
      stages,
      endorsements,
      certificates,
      configurations: configs
    }
  }

  async writeScoreConfiguration(payload: Record<string, any>, context?: AuditContext) {
    const record = await scoreConfigurations.create({ ...payload, effectiveFrom: payload.effectiveFrom ?? new Date().toISOString(), status: 'active' })
    await this.audit('score_configuration_created', 'score_configuration', record.id, context, null, record, payload.reason)
    return record
  }

  async readSafetyMetrics() {
    const [total, open, resolved, byStatus, byType, officers] = await Promise.all([
      prisma.safetyReport.count(),
      prisma.safetyReport.count({ where: { status: { in: ['RECEIVED', 'UNDER_REVIEW', 'ESCALATED'] } } }),
      prisma.safetyReport.count({ where: { status: 'RESOLVED' } }),
      prisma.safetyReport.groupBy({ by: ['status'], _count: true }),
      prisma.safetyReport.groupBy({ by: ['type'], _count: true }),
      prisma.user.findMany({ where: { role: 'SAFETY_OFFICER' }, select: { id: true, name: true, email: true, isActive: true } })
    ])
    return {
      summary: {
        totalReports: total,
        openReports: open,
        resolvedReports: resolved,
        averageResolutionHours: null,
        partnerResponseRate: null,
        safetyOfficerCount: officers.length
      },
      byStatus,
      byType,
      officers
    }
  }

  async readContentModeration(query: Record<string, unknown>) {
    const [moderationCases, queue, portfolioItems, messages] = await Promise.all([
      cases.listAll(),
      contentQueue.listAll(),
      prisma.portfolioItem.findMany({ where: { isPublic: true }, orderBy: { createdAt: 'desc' }, take: 25 }),
      prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 25, select: { id: true, gigId: true, senderId: true, recipientId: true, isRead: true, createdAt: true } })
    ])
    return {
      summary: {
        moderationCases: moderationCases.length,
        openCases: moderationCases.filter((item) => item.status === 'open').length,
        queuedContent: queue.length,
        portfolioItems: portfolioItems.length,
        recentMessages: messages.length
      },
      queue: pageEnvelope([...moderationCases, ...queue], query),
      portfolioItems,
      messages
    }
  }

  async moderateContent(payload: Record<string, any>, context?: AuditContext) {
    const action = await contentQueue.create({ ...payload, status: payload.action, reviewedAt: new Date().toISOString(), reviewedBy: context?.actorId })
    await this.audit(`content_${payload.action}`, payload.contentType ?? 'content', payload.contentId ?? action.id, context, null, action, payload.reason)
    return action
  }

  async readSystemConfiguration() {
    const [campuses, campusManagers, configs, flags, templates, integrations, rules] = await Promise.all([
      prisma.campus.findMany({ orderBy: { name: 'asc' } }),
      prisma.campusManager.findMany({ include: { campus: true } }),
      platformConfigurations.listAll((item) => item.type !== 'financial_action' && item.type !== 'gig_oversight_action'),
      featureFlags.listAll(),
      notificationTemplates.listAll(),
      integrationHealth.listAll(),
      protectiveRules.listAll()
    ])
    return { campuses, campusManagers, configurations: configs, featureFlags: flags, notificationTemplates: templates, integrationHealth: integrations, protectiveRules: rules }
  }

  async writeSystemConfiguration(payload: Record<string, any>, context?: AuditContext) {
    const collection = payload.kind === 'feature_flag' ? featureFlags
      : payload.kind === 'notification_template' ? notificationTemplates
        : payload.kind === 'integration_health' ? integrationHealth
          : payload.kind === 'protective_rule' ? protectiveRules
            : platformConfigurations
    const record = await collection.create({ ...payload, updatedBy: context?.actorId })
    await this.audit('system_configuration_changed', payload.kind ?? 'system_configuration', record.id, context, null, record, payload.reason)
    return record
  }

  async readAnalyticsReport() {
    const [students, companies, gigs, completedGigs, placements, transactions, workflowOpportunities, workflowProjects] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.company.count(),
      prisma.gig.count(),
      prisma.gig.count({ where: { status: 'COMPLETED' } }),
      prisma.placement.count(),
      prisma.transaction.findMany(),
      opportunities.listAll(),
      projects.listAll()
    ])
    const revenue = transactions.reduce((sum, item) => sum + item.platformFee, 0)
    const gmv = transactions.reduce((sum, item) => sum + item.amount, 0)
    return {
      summary: {
        activeStudents: students,
        activeCompanies: companies,
        gigsPosted: gigs + workflowOpportunities.length,
        gigsCompleted: completedGigs + workflowProjects.filter((item) => item.status === 'completed').length,
        grossMerchandiseValue: gmv,
        revenue,
        placements
      },
      campusBreakdown: [],
      pipelineFunnel: {
        gigCompletion: completedGigs,
        pipelineFlags: 0,
        rehearsalSprints: 0,
        placementOffers: placements,
        acceptedPlacements: placements
      }
    }
  }

  async listAuditLogs(query: Record<string, unknown>) {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
    return pageEnvelope(logs, query)
  }

  listModerationCases(query: Record<string, unknown>) {
    return cases.list(query)
  }

  async updateModerationCase(id: string, patch: Record<string, any>, context?: AuditContext) {
    const before = await cases.findById(id)
    const after = await cases.updateById(id, patch)
    if (after) await this.audit('moderation_case_updated', 'moderation_case', id, context, before, after, patch.note)
    return after
  }
}

const adminOperationsRepository = new AdminOperationsRepository()

export {
  AdminOperationsRepository,
  adminOperationsRepository
}
