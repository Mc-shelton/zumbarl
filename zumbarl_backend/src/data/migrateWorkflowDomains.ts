import type { Prisma, WorkflowRecord } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

const DOMAIN_COLLECTIONS = [
  'campaigns', 'campaignInvites', 'campaignAcceptances', 'campaignProofs',
  'connectProfiles', 'stories', 'posts', 'comments', 'groups', 'groupMemberships', 'chamaContributions',
  'wellnessReports', 'counselorBookings',
  'shops', 'listings', 'carts', 'orders'
]

type LegacyDomainRecord = Omit<WorkflowRecord, 'data'> & { data: Record<string, any> }

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function dateValue(value: unknown, fallback: Date) {
  if (!value) return fallback
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? fallback : date
}

function optionalDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : []
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'shop'
}

function activeStatus(value: unknown) {
  const status = String(value ?? '').toLowerCase()
  return status === 'open' || status === 'published' || status === 'active' ? 'ACTIVE' : String(value ?? 'ACTIVE').toUpperCase()
}

async function migrateWorkflowDomains() {
  const records = await prisma.workflowRecord.findMany({
    where: { collection: { in: DOMAIN_COLLECTIONS } },
    orderBy: { createdAt: 'asc' }
  }) as LegacyDomainRecord[]
  if (!records.length) return { found: 0, migrated: 0, retained: 0 }

  const migratedIds = new Set<string>()
  const campaignIds = new Map<string, string>()
  const postIds = new Map<string, string>()
  const groupIds = new Map<string, string>()
  const shopIds = new Map<string, string>()

  async function migrate(collection: string, operation: (record: LegacyDomainRecord) => Promise<void>) {
    for (const record of records.filter((item) => item.collection === collection)) {
      try {
        await operation(record)
        migratedIds.add(record.id)
      } catch (error) {
        process.stderr.write(`Workflow domain migration retained ${collection}/${record.id}: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }
  }

  await migrate('campaigns', async (record) => {
    const data = record.data
    const seeded = data.seedKey ? await prisma.marketingCampaign.findUnique({ where: { seedKey: String(data.seedKey) } }) : null
    const id = seeded?.id ?? record.id
    await prisma.marketingCampaign.upsert({
      where: { id },
      update: {
        businessId: data.businessId ?? null,
        title: String(data.title || 'Untitled campaign'),
        description: data.description ?? null,
        type: data.type ?? null,
        budgetAmount: Number(data.budgetAmount ?? 0),
        budget: data.budget ?? null,
        currency: data.currency ?? 'KES',
        platforms: stringList(data.platforms),
        minimumFollowers: Number(data.minimumFollowers ?? 0),
        payoutPerCampaigner: Number(data.payoutPerCampaigner ?? 0),
        proofRequirements: stringList(data.proofRequirements),
        materials: jsonInput(data.materials ?? []),
        thumbnailTitle: data.thumbnailTitle ?? null,
        thumbnailMeta: data.thumbnailMeta ?? null,
        previewImage: data.previewImage ?? null,
        objective: data.objective ?? null,
        hashtags: stringList(data.hashtags),
        targetAudience: data.targetAudience ?? null,
        startsAt: optionalDate(data.startsAt),
        endsAt: optionalDate(data.endsAt),
        timelineLabel: data.timelineLabel ?? null,
        timelineValue: data.timelineValue ?? null,
        creatorsLimit: data.creatorsLimit == null ? null : Number(data.creatorsLimit),
        status: data.status ?? 'draft',
        acceptedBudget: Number(data.acceptedBudget ?? 0),
        inviteOnlyUntil: optionalDate(data.inviteOnlyUntil),
        workflow: jsonInput(data.workflow ?? {}),
        stats: data.stats == null ? undefined : jsonInput(data.stats),
        payload: jsonInput(data),
        updatedAt: record.updatedAt
      },
      create: {
        id,
        seedKey: data.seedKey ?? null,
        businessId: data.businessId ?? null,
        title: String(data.title || 'Untitled campaign'),
        description: data.description ?? null,
        type: data.type ?? null,
        budgetAmount: Number(data.budgetAmount ?? 0),
        budget: data.budget ?? null,
        currency: data.currency ?? 'KES',
        platforms: stringList(data.platforms),
        minimumFollowers: Number(data.minimumFollowers ?? 0),
        payoutPerCampaigner: Number(data.payoutPerCampaigner ?? 0),
        proofRequirements: stringList(data.proofRequirements),
        materials: jsonInput(data.materials ?? []),
        thumbnailTitle: data.thumbnailTitle ?? null,
        thumbnailMeta: data.thumbnailMeta ?? null,
        previewImage: data.previewImage ?? null,
        objective: data.objective ?? null,
        hashtags: stringList(data.hashtags),
        targetAudience: data.targetAudience ?? null,
        startsAt: optionalDate(data.startsAt),
        endsAt: optionalDate(data.endsAt),
        timelineLabel: data.timelineLabel ?? null,
        timelineValue: data.timelineValue ?? null,
        creatorsLimit: data.creatorsLimit == null ? null : Number(data.creatorsLimit),
        status: data.status ?? 'draft',
        acceptedBudget: Number(data.acceptedBudget ?? 0),
        inviteOnlyUntil: optionalDate(data.inviteOnlyUntil),
        workflow: jsonInput(data.workflow ?? {}),
        stats: data.stats == null ? undefined : jsonInput(data.stats),
        payload: jsonInput(data),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    })
    campaignIds.set(record.id, id)
  })

  await migrate('campaignInvites', async (record) => {
    const campaignId = campaignIds.get(record.data.campaignId) ?? record.data.campaignId
    if (!campaignId || !await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })) throw new Error('campaign not found')
    await prisma.marketingCampaignInvite.upsert({
      where: { id: record.id },
      update: { campaignId, studentId: String(record.data.studentId), note: record.data.note ?? null, status: record.data.status ?? 'sent', payload: jsonInput(record.data), updatedAt: record.updatedAt },
      create: { id: record.id, campaignId, studentId: String(record.data.studentId), note: record.data.note ?? null, status: record.data.status ?? 'sent', payload: jsonInput(record.data), createdAt: record.createdAt, updatedAt: record.updatedAt }
    })
  })

  await migrate('campaignAcceptances', async (record) => {
    const campaignId = campaignIds.get(record.data.campaignId) ?? record.data.campaignId
    const studentId = record.data.studentId && String(record.data.studentId)
    if (!campaignId || !studentId || !await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })) throw new Error('campaign or student id not found')
    await prisma.marketingCampaignAcceptance.upsert({
      where: { campaignId_studentId: { campaignId, studentId } },
      update: { status: record.data.status ?? 'accepted', payoutAmount: Number(record.data.payoutAmount ?? 0), payload: jsonInput(record.data), updatedAt: record.updatedAt },
      create: { id: record.id, campaignId, studentId, status: record.data.status ?? 'accepted', payoutAmount: Number(record.data.payoutAmount ?? 0), payload: jsonInput(record.data), createdAt: record.createdAt, updatedAt: record.updatedAt }
    })
  })

  await migrate('campaignProofs', async (record) => {
    const data = record.data
    const campaignId = campaignIds.get(data.campaignId) ?? data.campaignId
    if (!campaignId || !await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })) throw new Error('campaign not found')
    await prisma.marketingCampaignProof.upsert({
      where: { id: record.id },
      update: { campaignId, studentId: data.studentId ?? null, links: stringList(data.links), screenshots: stringList(data.screenshots), videos: stringList(data.videos), platformUploads: jsonInput(data.platformUploads ?? []), reach: data.reach == null ? null : Number(data.reach), engagement: data.engagement == null ? null : Number(data.engagement), notes: data.notes ?? null, status: data.status ?? 'submitted', payload: jsonInput(data), updatedAt: record.updatedAt },
      create: { id: record.id, campaignId, studentId: data.studentId ?? null, links: stringList(data.links), screenshots: stringList(data.screenshots), videos: stringList(data.videos), platformUploads: jsonInput(data.platformUploads ?? []), reach: data.reach == null ? null : Number(data.reach), engagement: data.engagement == null ? null : Number(data.engagement), notes: data.notes ?? null, status: data.status ?? 'submitted', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt }
    })
  })

  await migrate('connectProfiles', async (record) => {
    const data = record.data
    const existing = data.studentId ? await prisma.connectProfile.findUnique({ where: { studentId: String(data.studentId) } }) : null
    const id = existing?.id ?? record.id
    await prisma.connectProfile.upsert({ where: { id }, update: { studentId: data.studentId ?? null, interests: stringList(data.interests), safetyPreferences: jsonInput(data.safetyPreferences ?? {}), visibility: data.visibility ?? 'campus', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id, studentId: data.studentId ?? null, interests: stringList(data.interests), safetyPreferences: jsonInput(data.safetyPreferences ?? {}), visibility: data.visibility ?? 'campus', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('stories', async (record) => {
    const data = record.data
    await prisma.connectStory.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, text: String(data.text ?? data.body ?? ''), mediaUrl: data.mediaUrl ?? null, visibility: data.visibility ?? 'campus', context: data.context ?? null, expiresAt: dateValue(data.expiresAt, new Date(record.createdAt.getTime() + 86_400_000)), status: data.status ?? 'live', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, text: String(data.text ?? data.body ?? ''), mediaUrl: data.mediaUrl ?? null, visibility: data.visibility ?? 'campus', context: data.context ?? null, expiresAt: dateValue(data.expiresAt, new Date(record.createdAt.getTime() + 86_400_000)), status: data.status ?? 'live', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('posts', async (record) => {
    const data = record.data
    await prisma.connectPost.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, type: data.type ?? 'post', body: String(data.body ?? ''), tags: jsonInput(data.tags ?? []), visibility: data.visibility ?? 'campus', status: data.status ?? 'published', reactions: jsonInput(data.reactions ?? {}), saves: Number(data.saves ?? 0), reposts: Number(data.reposts ?? 0), payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, type: data.type ?? 'post', body: String(data.body ?? ''), tags: jsonInput(data.tags ?? []), visibility: data.visibility ?? 'campus', status: data.status ?? 'published', reactions: jsonInput(data.reactions ?? {}), saves: Number(data.saves ?? 0), reposts: Number(data.reposts ?? 0), payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
    postIds.set(record.id, record.id)
  })

  await migrate('comments', async (record) => {
    const data = record.data
    const postId = postIds.get(data.postId) ?? data.postId
    if (!postId || !await prisma.connectPost.findUnique({ where: { id: postId } })) throw new Error('post not found')
    await prisma.connectComment.upsert({ where: { id: record.id }, update: { postId, studentId: data.studentId ?? null, body: String(data.body ?? ''), status: data.status ?? 'published', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, postId, studentId: data.studentId ?? null, body: String(data.body ?? ''), status: data.status ?? 'published', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('groups', async (record) => {
    const data = record.data
    await prisma.communityGroup.upsert({ where: { id: record.id }, update: { ownerStudentId: data.ownerStudentId ?? data.studentId ?? null, name: String(data.name || 'Untitled group'), category: String(data.category || 'General'), purpose: String(data.purpose || data.description || ''), rules: stringList(data.rules), campus: data.campus ?? null, contributionAmount: data.contributionAmount == null ? null : Number(data.contributionAmount), contributionCadence: data.contributionCadence ?? null, status: data.status ?? 'active', walletBalance: Number(data.walletBalance ?? 0), payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, ownerStudentId: data.ownerStudentId ?? data.studentId ?? null, name: String(data.name || 'Untitled group'), category: String(data.category || 'General'), purpose: String(data.purpose || data.description || ''), rules: stringList(data.rules), campus: data.campus ?? null, contributionAmount: data.contributionAmount == null ? null : Number(data.contributionAmount), contributionCadence: data.contributionCadence ?? null, status: data.status ?? 'active', walletBalance: Number(data.walletBalance ?? 0), payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
    groupIds.set(record.id, record.id)
  })

  await migrate('groupMemberships', async (record) => {
    const data = record.data
    const groupId = groupIds.get(data.groupId) ?? data.groupId
    if (!groupId || !await prisma.communityGroup.findUnique({ where: { id: groupId } })) throw new Error('group not found')
    const studentId = data.studentId ? String(data.studentId) : null
    if (studentId) {
      await prisma.communityGroupMembership.upsert({ where: { groupId_studentId: { groupId, studentId } }, update: { status: data.status ?? 'active', role: data.role ?? 'member', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, groupId, studentId, status: data.status ?? 'active', role: data.role ?? 'member', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
    } else {
      await prisma.communityGroupMembership.upsert({ where: { id: record.id }, update: { groupId, status: data.status ?? 'active', role: data.role ?? 'member', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, groupId, studentId: null, status: data.status ?? 'active', role: data.role ?? 'member', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
    }
  })

  await migrate('chamaContributions', async (record) => {
    const data = record.data
    const groupId = groupIds.get(data.groupId) ?? data.groupId
    if (!groupId || !await prisma.communityGroup.findUnique({ where: { id: groupId } })) throw new Error('group not found')
    await prisma.communityChamaContribution.upsert({ where: { id: record.id }, update: { groupId, studentId: data.studentId ?? null, amount: Number(data.amount ?? 0), currency: data.currency ?? 'KES', status: data.status ?? 'recorded', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, groupId, studentId: data.studentId ?? null, amount: Number(data.amount ?? 0), currency: data.currency ?? 'KES', status: data.status ?? 'recorded', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('wellnessReports', async (record) => {
    const data = record.data
    await prisma.wellnessReport.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, category: String(data.category || 'general'), anonymous: Boolean(data.anonymous), message: String(data.message || ''), urgency: data.urgency ?? 'normal', status: data.status ?? 'open', note: data.note ?? null, payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, category: String(data.category || 'general'), anonymous: Boolean(data.anonymous), message: String(data.message || ''), urgency: data.urgency ?? 'normal', status: data.status ?? 'open', note: data.note ?? null, payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('counselorBookings', async (record) => {
    const data = record.data
    await prisma.counselorBooking.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, counselorId: data.counselorId ?? null, scheduledAt: dateValue(data.scheduledAt, record.createdAt), reason: data.reason ?? null, status: data.status ?? 'requested', payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, counselorId: data.counselorId ?? null, scheduledAt: dateValue(data.scheduledAt, record.createdAt), reason: data.reason ?? null, status: data.status ?? 'requested', payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('shops', async (record) => {
    const data = record.data
    const ownerId = String(data.studentId ?? data.ownerId ?? '')
    const owner = ownerId ? await prisma.studentProfile.findUnique({ where: { id: ownerId } }) : null
    if (!owner) throw new Error('shop owner not found')
    const existing = await prisma.marketplaceShop.findFirst({ where: { OR: [{ id: record.id }, { ownerId, name: String(data.name || 'Campus shop') }] } })
    const id = existing?.id ?? record.id
    const baseSlug = slugify(String(data.slug || data.name || record.id))
    const slugOwner = await prisma.marketplaceShop.findUnique({ where: { slug: baseSlug } })
    const slug = slugOwner && slugOwner.id !== id ? `${baseSlug}-${record.id.slice(-6)}` : baseSlug
    await prisma.marketplaceShop.upsert({ where: { id }, update: { ownerId, campusId: owner.campusId, name: String(data.name || 'Campus shop'), slug, tagline: data.tagline ?? null, description: data.description ?? null, category: String(data.category || 'General'), logoUrl: data.logoUrl ?? null, coverImageUrl: data.coverImageUrl ?? null, locationLabel: data.campus ?? data.locationLabel ?? null, deliveryOptions: stringList(data.deliveryOptions), pickupSpots: stringList(data.pickupSpots), contactRules: data.contactRules ?? null, returnRules: data.returnRules ?? null, socialLinks: data.socialLinks == null ? undefined : jsonInput(data.socialLinks), ratingAverage: Number(data.score ?? data.ratingAverage ?? 0), status: activeStatus(data.status), payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id, ownerId, campusId: owner.campusId, name: String(data.name || 'Campus shop'), slug, tagline: data.tagline ?? null, description: data.description ?? null, category: String(data.category || 'General'), logoUrl: data.logoUrl ?? null, coverImageUrl: data.coverImageUrl ?? null, locationLabel: data.campus ?? data.locationLabel ?? null, deliveryOptions: stringList(data.deliveryOptions), pickupSpots: stringList(data.pickupSpots), contactRules: data.contactRules ?? null, returnRules: data.returnRules ?? null, socialLinks: data.socialLinks == null ? undefined : jsonInput(data.socialLinks), ratingAverage: Number(data.score ?? data.ratingAverage ?? 0), status: activeStatus(data.status), payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
    shopIds.set(record.id, id)
  })

  await migrate('listings', async (record) => {
    const data = record.data
    const shopId = data.shopId ? shopIds.get(data.shopId) ?? data.shopId : null
    const shop = shopId ? await prisma.marketplaceShop.findUnique({ where: { id: shopId } }) : null
    const sellerId = String(data.sellerId ?? data.studentId ?? shop?.ownerId ?? '')
    const seller = sellerId ? await prisma.studentProfile.findUnique({ where: { id: sellerId } }) : null
    if (!seller) throw new Error('listing seller not found')
    await prisma.marketplaceListing.upsert({ where: { id: record.id }, update: { shopId: shop?.id ?? null, sellerId, campusId: data.campusId ?? shop?.campusId ?? seller.campusId, title: String(data.title || 'Untitled listing'), description: String(data.description || ''), category: String(data.category || shop?.category || 'General'), listingType: String(data.listingType ?? data.kind ?? 'PRODUCT').toUpperCase(), condition: data.condition ?? null, priceAmount: Number(data.priceAmount ?? data.price ?? 0), currency: data.currency ?? 'KES', images: stringList(data.gallery ?? data.images), locationLabel: data.locationLabel ?? null, deliveryOptions: stringList(data.deliveryOptions), variants: stringList(data.variants), status: activeStatus(data.status), stockCount: Number(data.stock ?? data.stockCount ?? 1), payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, shopId: shop?.id ?? null, sellerId, campusId: data.campusId ?? shop?.campusId ?? seller.campusId, title: String(data.title || 'Untitled listing'), description: String(data.description || ''), category: String(data.category || shop?.category || 'General'), listingType: String(data.listingType ?? data.kind ?? 'PRODUCT').toUpperCase(), condition: data.condition ?? null, priceAmount: Number(data.priceAmount ?? data.price ?? 0), currency: data.currency ?? 'KES', images: stringList(data.gallery ?? data.images), locationLabel: data.locationLabel ?? null, deliveryOptions: stringList(data.deliveryOptions), variants: stringList(data.variants), status: activeStatus(data.status), stockCount: Number(data.stock ?? data.stockCount ?? 1), payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('carts', async (record) => {
    const data = record.data
    await prisma.marketplaceCart.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, status: data.status ?? 'open', items: jsonInput(data.items ?? []), orderId: data.orderId ?? null, updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, status: data.status ?? 'open', items: jsonInput(data.items ?? []), orderId: data.orderId ?? null, createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  await migrate('orders', async (record) => {
    const data = record.data
    await prisma.marketplaceOrder.upsert({ where: { id: record.id }, update: { studentId: data.studentId ?? null, cartId: data.cartId ?? null, items: jsonInput(data.items ?? []), totalAmount: Number(data.totalAmount ?? 0), currency: data.currency ?? 'KES', status: data.status ?? 'paid', fulfillmentStatus: data.fulfillmentStatus ?? 'seller_confirmation', handoffType: data.handoffType ?? 'pickup', handoffSpot: data.handoffSpot ?? 'campus', paymentReference: data.paymentReference ?? null, payload: jsonInput(data), updatedAt: record.updatedAt }, create: { id: record.id, studentId: data.studentId ?? null, cartId: data.cartId ?? null, items: jsonInput(data.items ?? []), totalAmount: Number(data.totalAmount ?? 0), currency: data.currency ?? 'KES', status: data.status ?? 'paid', fulfillmentStatus: data.fulfillmentStatus ?? 'seller_confirmation', handoffType: data.handoffType ?? 'pickup', handoffSpot: data.handoffSpot ?? 'campus', paymentReference: data.paymentReference ?? null, payload: jsonInput(data), createdAt: record.createdAt, updatedAt: record.updatedAt } })
  })

  if (migratedIds.size) {
    await prisma.workflowRecord.deleteMany({ where: { id: { in: [...migratedIds] } } })
  }
  return { found: records.length, migrated: migratedIds.size, retained: records.length - migratedIds.size }
}

export {
  DOMAIN_COLLECTIONS,
  migrateWorkflowDomains
}
