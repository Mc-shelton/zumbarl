import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function payloadObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function acceptanceRecord(acceptance: Record<string, any>): Record<string, any> {
  return {
    ...acceptance,
    trackingUrl: acceptance.trackingToken && acceptance.trackingDestinationUrl
      ? `/api/v1/marketing/track/${acceptance.trackingToken}`
      : null
  }
}

function createPromoCode(title: string) {
  const prefix = title.split(/\s+/).map((part) => part[0]).join('').replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'ZMB'
  const suffix = nanoid(5).replace(/[^a-z0-9]/gi, 'X').toUpperCase()
  return `${prefix}-${suffix}`
}

type CreatorMetric = 'followers' | 'likes' | 'engagement'

function nonnegativeNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function campaignRequirements(campaign: Record<string, any>) {
  const record = { ...payloadObject(campaign.payload), ...campaign }
  return {
    followers: nonnegativeNumber(record.minimumFollowers),
    likes: nonnegativeNumber(record.minimumLikes),
    engagement: nonnegativeNumber(record.minimumEngagement)
  }
}

function socialAccountsFromProfile(profile: Record<string, any> | null) {
  const payload = payloadObject(profile?.payload)
  const creatorMetrics = payloadObject(payload.creatorMetrics)
  const accounts = Array.isArray(payload.socialAccounts)
    ? payload.socialAccounts
    : Array.isArray(creatorMetrics.accounts)
      ? creatorMetrics.accounts
      : []

  return accounts
    .map((account) => payloadObject(account))
    .filter((account) => {
      if (account.verified !== true) return false
      if (!account.verificationExpiresAt) return true
      const expiresAt = new Date(String(account.verificationExpiresAt)).getTime()
      return Number.isFinite(expiresAt) && expiresAt >= Date.now()
    })
    .map((account) => ({
      platform: String(account.platform || ''),
      followers: nonnegativeNumber(account.followers),
      likes: nonnegativeNumber(account.averageLikes ?? account.likes),
      engagement: nonnegativeNumber(account.averageEngagement ?? account.engagement)
    }))
}

function evaluateEligibility(campaign: Record<string, any>, accounts: ReturnType<typeof socialAccountsFromProfile>) {
  const requirements = campaignRequirements(campaign)
  const requiredMetrics = (Object.keys(requirements) as CreatorMetric[])
    .filter((metric) => requirements[metric] > 0)
  const allowedPlatforms = new Set(
    (campaign.platforms || []).map((platform: unknown) => String(platform).toLowerCase())
  )
  const matchingAccounts = accounts.filter((account) => (
    !allowedPlatforms.size || allowedPlatforms.has(account.platform.toLowerCase())
  ))
  const qualifyingAccount = matchingAccounts.find((account) => (
    requiredMetrics.every((metric) => account[metric] >= requirements[metric])
  ))

  return {
    eligible: requiredMetrics.length === 0 || Boolean(qualifyingAccount),
    requirements,
    metrics: qualifyingAccount || matchingAccounts[0] || null,
    hasVerifiedAccount: matchingAccounts.length > 0
  }
}

function toCampaignRecord(campaign: Record<string, any>) {
  const { payload, ...record } = campaign
  return { ...payloadObject(payload), ...record }
}

function campaignData(payload: Record<string, any>) {
  return {
    seedKey: payload.seedKey ?? null,
    businessId: payload.businessId ?? null,
    title: payload.title,
    description: payload.description ?? null,
    type: payload.type ?? null,
    budgetAmount: Number(payload.budgetAmount ?? 0),
    budget: payload.budget ?? null,
    currency: payload.currency ?? 'KES',
    platforms: payload.platforms ?? [],
    minimumFollowers: Number(payload.minimumFollowers ?? 0),
    payoutPerCampaigner: Number(payload.payoutPerCampaigner ?? 0),
    proofRequirements: payload.proofRequirements ?? [],
    materials: jsonInput(payload.materials ?? []),
    thumbnailTitle: payload.thumbnailTitle ?? null,
    thumbnailMeta: payload.thumbnailMeta ?? null,
    previewImage: payload.previewImage ?? null,
    objective: payload.objective ?? null,
    hashtags: payload.hashtags ?? [],
    targetAudience: payload.targetAudience ?? null,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
    endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
    timelineLabel: payload.timelineLabel ?? null,
    timelineValue: payload.timelineValue ?? null,
    creatorsLimit: payload.creatorsLimit == null ? null : Number(payload.creatorsLimit),
    status: payload.status ?? 'draft',
    acceptedBudget: Number(payload.acceptedBudget ?? 0),
    inviteOnlyUntil: payload.inviteOnlyUntil ? new Date(payload.inviteOnlyUntil) : null,
    workflow: jsonInput(payload.workflow ?? {}),
    stats: payload.stats == null ? undefined : jsonInput(payload.stats),
    payload: jsonInput(payload)
  }
}

function campaignPatch(patch: Record<string, any>): Prisma.MarketingCampaignUpdateInput {
  const data: Record<string, any> = { payload: jsonInput(patch) }
  const scalarFields = [
    'seedKey', 'businessId', 'title', 'description', 'type', 'budget', 'currency', 'thumbnailTitle',
    'thumbnailMeta', 'previewImage', 'objective', 'targetAudience', 'timelineLabel',
    'timelineValue', 'status'
  ]
  scalarFields.forEach((field) => {
    if (field in patch) data[field] = patch[field]
  })
  const numberFields = ['budgetAmount', 'minimumFollowers', 'payoutPerCampaigner', 'creatorsLimit', 'acceptedBudget']
  numberFields.forEach((field) => {
    if (field in patch) data[field] = patch[field] == null ? null : Number(patch[field])
  })
  const arrayFields = ['platforms', 'proofRequirements', 'hashtags']
  arrayFields.forEach((field) => {
    if (field in patch) data[field] = patch[field] ?? []
  })
  const jsonFields = ['materials', 'workflow', 'stats']
  jsonFields.forEach((field) => {
    if (field in patch) data[field] = jsonInput(patch[field])
  })
  for (const field of ['startsAt', 'endsAt', 'inviteOnlyUntil']) {
    if (field in patch) data[field] = patch[field] ? new Date(patch[field]) : null
  }
  return data as Prisma.MarketingCampaignUpdateInput
}

class MarketingCampaignsRepository {
  async listCampaigns(query: Record<string, unknown>, scope: { businessId?: string; studentId?: string; audience?: 'business' | 'student' | 'admin' } = {}) {
    const where = scope.audience === 'business'
      ? { businessId: scope.businessId || '__missing_business__' }
      : scope.audience === 'student'
        ? { status: { in: ['published', 'funded', 'active', 'completed'] } }
        : undefined
    const campaigns = await prisma.marketingCampaign.findMany({
      where,
      include: { acceptances: { where: { status: 'accepted' }, select: { id: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const records: Record<string, any>[] = campaigns.map(({ acceptances, ...campaign }) => ({
      ...toCampaignRecord(campaign),
      acceptedCreatorsCount: acceptances.length
    }))
    if (scope.audience !== 'student') return pageEnvelope(records, query)

    const profile = scope.studentId
      ? await prisma.connectProfile.findUnique({ where: { studentId: scope.studentId } })
      : null
    const accounts = socialAccountsFromProfile(profile)
    return pageEnvelope(
      records
        .map((campaign): Record<string, any> => ({
          ...campaign,
          eligibility: evaluateEligibility(campaign, accounts)
        }))
        .filter((campaign) => {
          const hasEnded = campaign.endsAt && new Date(campaign.endsAt).getTime() < Date.now()
          const hasCreatorSlot = campaign.creatorsLimit == null || campaign.acceptedCreatorsCount < campaign.creatorsLimit
          const hasBudget = Number(campaign.acceptedBudget || 0) + Number(campaign.payoutPerCampaigner || 0) <= Number(campaign.budgetAmount || 0)
          // Eligibility controls pickup, not discovery. Students should still be able
          // to inspect an open campaign and see which requirements they need to meet.
          return !hasEnded && hasCreatorSlot && hasBudget
        }),
      query
    )
  }

  async createCampaign(payload: Record<string, any>) {
    return toCampaignRecord(await prisma.marketingCampaign.create({ data: campaignData(payload) }))
  }

  async findCampaign(id: string) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id } })
    return campaign ? toCampaignRecord(campaign) : null
  }

  async updateCampaign(id: string, patch: Record<string, any>) {
    const existing = await prisma.marketingCampaign.findUnique({ where: { id } })
    if (!existing) return null
    const currentPayload = payloadObject(existing.payload)
    const campaign = await prisma.marketingCampaign.update({
      where: { id },
      data: { ...campaignPatch(patch), payload: jsonInput({ ...currentPayload, ...patch }) }
    })
    return toCampaignRecord(campaign)
  }

  async createInvite(payload: Record<string, any>) {
    return prisma.marketingCampaignInvite.create({
      data: {
        campaignId: payload.campaignId,
        studentId: payload.studentId,
        note: payload.note ?? null,
        status: payload.status ?? 'sent',
        payload: jsonInput(payload)
      }
    })
  }

  async createAcceptance(payload: Record<string, any>) {
    return prisma.marketingCampaignAcceptance.create({
      data: {
        campaignId: payload.campaignId,
        studentId: payload.studentId,
        status: payload.status ?? 'accepted',
        payoutAmount: Number(payload.payoutAmount ?? 0),
        payload: jsonInput(payload)
      }
    })
  }

  async createProof(payload: Record<string, any>) {
    return prisma.marketingCampaignProof.create({
      data: {
        campaignId: payload.campaignId,
        studentId: payload.studentId ?? null,
        links: payload.links ?? [],
        screenshots: payload.screenshots ?? [],
        videos: payload.videos ?? [],
        platformUploads: jsonInput(payload.platformUploads ?? []),
        reach: payload.reach == null ? null : Number(payload.reach),
        engagement: payload.engagement == null ? null : Number(payload.engagement),
        notes: payload.notes ?? null,
        status: payload.status ?? 'submitted',
        payload: jsonInput(payload)
      }
    })
  }

  listProofs(campaignId: string) {
    return prisma.marketingCampaignProof.findMany({ where: { campaignId }, orderBy: { createdAt: 'desc' } })
  }

  async readCampaignDetail(campaignId: string, studentId?: string) {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        zumbarlAd: true,
        invites: { orderBy: { createdAt: 'desc' } },
        acceptances: { orderBy: { createdAt: 'desc' } },
        proofs: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!campaign) return { campaign: null, invites: [], acceptances: [], proofs: [] }
    const { zumbarlAd, invites, acceptances, proofs, ...campaignRecord } = campaign
    const studentIds = [...new Set(acceptances.map((item) => item.studentId))]
    const [students, creatorProfiles] = studentIds.length
      ? await Promise.all([
          prisma.studentProfile.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          }),
          prisma.connectProfile.findMany({ where: { studentId: { in: studentIds } } })
        ])
      : [[], []]
    const studentsById = new Map(students.map((item) => [item.id, item]))
    const profilesByStudentId = new Map(creatorProfiles.map((item) => [item.studentId, item]))
    const acceptanceRecords: Record<string, any>[] = acceptances.map((item) => ({
      ...acceptanceRecord(item),
      student: studentsById.get(item.studentId) || null,
      verifiedSocialAccounts: socialAccountsFromProfile(profilesByStudentId.get(item.studentId) || null)
    }))
    const acceptedCreatorsCount = acceptances.filter((item) => item.status === 'accepted').length
    const record: Record<string, any> = {
      ...toCampaignRecord(campaignRecord),
      acceptedCreatorsCount,
      zumbarlAd
    }
    const profile = studentId
      ? await prisma.connectProfile.findUnique({ where: { studentId } })
      : null
    return {
      campaign: studentId
        ? { ...record, eligibility: evaluateEligibility(record, socialAccountsFromProfile(profile)) }
        : record,
      invites,
      acceptances: acceptanceRecords,
      proofs
    }
  }

  async syncZumbarlAd(campaignId: string) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return null
    const campaignPayload = payloadObject(campaign.payload)
    const request = payloadObject(campaignPayload.zumbarlAds)
    const existing = await prisma.zumbarlAd.findUnique({ where: { campaignId } })

    if (request.requested !== true) {
      if (!existing) return null
      return prisma.zumbarlAd.update({
        where: { campaignId },
        data: { status: 'withdrawn', payload: jsonInput(request) }
      })
    }

    const nextStatus = campaign.status === 'draft' ? 'draft' : 'pending_review'
    const data = {
      businessId: campaign.businessId,
      headline: String(request.headline || campaign.title),
      description: String(request.description || campaign.description || campaign.title),
      callToAction: request.callToAction ? String(request.callToAction) : null,
      destinationUrl: request.destinationUrl ? String(request.destinationUrl) : null,
      status: nextStatus,
      reviewedBy: null,
      reviewedAt: null,
      publishedAt: null,
      payload: jsonInput(request)
    }
    return prisma.zumbarlAd.upsert({
      where: { campaignId },
      create: { campaignId, ...data },
      update: data
    })
  }

  async publishCampaign(id: string) {
    const campaign = await this.updateCampaign(id, { status: 'published', inviteOnlyUntil: null })
    if (!campaign) return null
    await this.syncZumbarlAd(id)
    return campaign
  }

  async listZumbarlAds(query: Record<string, unknown>) {
    const ads = await prisma.zumbarlAd.findMany({
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            previewImage: true,
            materials: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return pageEnvelope(ads, query)
  }

  async publishZumbarlAd(id: string, reviewedBy?: string) {
    const ad = await prisma.zumbarlAd.findUnique({ where: { id } })
    if (!ad || ad.status !== 'pending_review') return null
    const now = new Date()
    return prisma.zumbarlAd.update({
      where: { id },
      data: {
        status: 'published',
        reviewedBy: reviewedBy ?? null,
        reviewedAt: now,
        publishedAt: ad.publishedAt ?? now
      },
      include: { campaign: { select: { id: true, title: true, previewImage: true, materials: true } } }
    })
  }

  fundCampaign(id: string) {
    return runPrismaRecordTransaction(async (createRepository, tx) => {
      const campaign = await tx.marketingCampaign.findUnique({ where: { id } })
      if (!campaign) return null
      const escrow = await createRepository('escrows').create({
        scope: 'campaign',
        scopeId: id,
        amount: campaign.budgetAmount,
        currency: campaign.currency,
        status: 'funded'
      })
      await tx.marketingCampaign.update({ where: { id }, data: { status: 'funded' } })
      return escrow
    })
  }

  createCampaignInvites(id: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.findUnique({ where: { id } })
      if (!campaign) return null
      const invites = await Promise.all(payload.studentIds.map((studentId: string) => tx.marketingCampaignInvite.create({
        data: { campaignId: id, studentId, note: payload.note ?? null, status: 'sent', payload: jsonInput(payload) }
      })))
      return { invites }
    })
  }

  async acceptCampaign(id: string, studentId: string | undefined) {
    const student = studentId ? await prisma.studentProfile.findUnique({ where: { id: studentId } }) : null
    if (!studentId || !student) return { accepted: false, reason: 'student_profile_not_found' }
    const acceptedStudentId = studentId

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const campaign = await tx.marketingCampaign.findUnique({ where: { id } })
          if (!campaign) return null
          if (!['published', 'funded', 'active'].includes(campaign.status)) return { accepted: false, reason: 'campaign_not_open', campaign: toCampaignRecord(campaign) }
          if (campaign.endsAt && campaign.endsAt.getTime() < Date.now()) return { accepted: false, reason: 'campaign_closed', campaign: toCampaignRecord(campaign) }
          const existing = await tx.marketingCampaignAcceptance.findUnique({ where: { campaignId_studentId: { campaignId: id, studentId: acceptedStudentId } } })
          const campaignPayload = payloadObject(campaign.payload)
          const destinationUrl = typeof campaignPayload.destinationUrl === 'string' ? campaignPayload.destinationUrl : null
          if (existing?.status === 'accepted') {
            if (existing.trackingToken) return acceptanceRecord(existing)
            return acceptanceRecord(await tx.marketingCampaignAcceptance.update({
              where: { id: existing.id },
              data: {
                trackingToken: nanoid(24),
                trackingDestinationUrl: destinationUrl,
                promoCode: createPromoCode(campaign.title)
              }
            }))
          }

          const profile = await tx.connectProfile.findUnique({ where: { studentId: acceptedStudentId } })
          const eligibility = evaluateEligibility(toCampaignRecord(campaign), socialAccountsFromProfile(profile))
          if (!eligibility.eligible) return { accepted: false, reason: 'creator_metrics_below_threshold', campaign: toCampaignRecord(campaign), eligibility }

          const acceptedCount = await tx.marketingCampaignAcceptance.count({
            where: { campaignId: id, status: 'accepted' }
          })
          if (campaign.creatorsLimit != null && acceptedCount >= campaign.creatorsLimit) {
            return { accepted: false, reason: 'campaign_creator_limit_reached', campaign: toCampaignRecord(campaign) }
          }
          if (campaign.acceptedBudget + campaign.payoutPerCampaigner > campaign.budgetAmount) return { accepted: false, reason: 'campaign_budget_limit_reached', campaign: toCampaignRecord(campaign) }
          const acceptance = await tx.marketingCampaignAcceptance.upsert({
            where: { campaignId_studentId: { campaignId: id, studentId: acceptedStudentId } },
            update: {
              status: 'accepted',
              payoutAmount: campaign.payoutPerCampaigner,
              trackingToken: nanoid(24),
              trackingDestinationUrl: destinationUrl,
              promoCode: createPromoCode(campaign.title)
            },
            create: {
              campaignId: id,
              studentId: acceptedStudentId,
              status: 'accepted',
              payoutAmount: campaign.payoutPerCampaigner,
              trackingToken: nanoid(24),
              trackingDestinationUrl: destinationUrl,
              promoCode: createPromoCode(campaign.title)
            }
          })
          await tx.marketingCampaign.update({
            where: { id },
            data: { acceptedBudget: { increment: campaign.payoutPerCampaigner } }
          })
          return acceptanceRecord(acceptance)
        }, { isolationLevel: 'Serializable' })
      } catch (error) {
        const isWriteConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
        if (!isWriteConflict || attempt === 2) throw error
      }
    }
    throw new Error('Campaign pickup could not be completed')
  }

  submitCampaignProof(id: string, studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.marketingCampaign.findUnique({ where: { id } })
      if (!campaign) return null
      const acceptance = studentId
        ? await tx.marketingCampaignAcceptance.findUnique({ where: { campaignId_studentId: { campaignId: id, studentId } } })
        : null
      if (!acceptance || acceptance.status !== 'accepted') {
        return { submitted: false, reason: 'campaign_not_claimed' }
      }
      const proof = await tx.marketingCampaignProof.create({
        data: {
          campaignId: id,
          studentId: studentId ?? null,
          links: payload.links ?? [],
          screenshots: payload.screenshots ?? [],
          videos: payload.videos ?? [],
          platformUploads: jsonInput(payload.platformUploads ?? []),
          reach: payload.reach == null ? null : Number(payload.reach),
          engagement: payload.engagement == null ? null : Number(payload.engagement),
          notes: payload.notes ?? null,
          status: payload.status ?? 'needs_review',
          payload: jsonInput(payload)
        }
      })
      await tx.marketingCampaign.update({
        where: { id },
        data: { workflow: jsonInput({ proofSubmitted: true, statsGenerated: false, endorsed: false }) }
      })
      return proof
    })
  }

  async trackCampaignClick(token: string, visitorHash: string) {
    return prisma.$transaction(async (tx) => {
      const acceptance = await tx.marketingCampaignAcceptance.findUnique({ where: { trackingToken: token } })
      if (!acceptance?.trackingDestinationUrl) return null
      const clickEvent = await tx.marketingCampaignClick.upsert({
        where: { acceptanceId_visitorHash: { acceptanceId: acceptance.id, visitorHash } },
        create: { acceptanceId: acceptance.id, visitorHash },
        update: { visits: { increment: 1 } }
      })
      const isUniqueVisitor = clickEvent.visits === 1
      const totals = await tx.marketingCampaignAcceptance.update({
        where: { id: acceptance.id },
        data: {
          trackingVisits: { increment: 1 },
          ...(isUniqueVisitor ? { trackingClicks: { increment: 1 } } : {})
        },
        select: { trackingClicks: true, trackingVisits: true }
      })
      return {
        destinationUrl: acceptance.trackingDestinationUrl,
        uniqueVisitor: isUniqueVisitor,
        uniqueClicks: totals.trackingClicks,
        totalVisits: totals.trackingVisits
      }
    })
  }

  async readCampaignTrackingPage(token: string) {
    const acceptance = await prisma.marketingCampaignAcceptance.findUnique({
      where: { trackingToken: token },
      include: { campaign: true }
    })
    if (!acceptance?.trackingDestinationUrl) return null
    const { campaign, ...tracking } = acceptance
    return { ...tracking, campaign: toCampaignRecord(campaign) }
  }

  endorseCampaigners(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository, tx) => {
      const campaign = await tx.marketingCampaign.findUnique({ where: { id } })
      if (!campaign) return null
      const evidence = createRepository('evidence')
      const endorsements = await Promise.all(payload.studentIds.map((studentId: string) => evidence.create({
        source: 'marketing-campaign', sourceId: id, studentId, type: 'endorsement', note: payload.note, verified: true
      })))
      await tx.marketingCampaign.update({
        where: { id },
        data: { workflow: jsonInput({ ...payloadObject(campaign.workflow), endorsed: true }) }
      })
      return { endorsements }
    })
  }
}

const marketingCampaignsRepository = new MarketingCampaignsRepository()

export {
  MarketingCampaignsRepository,
  marketingCampaignsRepository
}
