import type { Prisma } from '@prisma/client'
import { ApiError, pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'
import { creditStudentWallet, getOrCreateStudentWallet } from '../../../shared/services/walletLedger.js'

const reviews = createPrismaRecordRepository('reviews')
const moderationCases = createPrismaRecordRepository('moderationCases')
const platformConfigurations = createPrismaRecordRepository('platformConfigurations')
const campusVendorFollowers = createPrismaRecordRepository('campusVendorFollowers')

const DEFAULT_ZUMBARL_DELIVERY_CONFIG = {
  active: true,
  baseFee: 80,
  perKmFee: 25,
  freeRadiusKm: 0,
  minimumFee: 100,
  maximumFee: 1500,
  maximumDistanceKm: 50
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function payloadObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function toPayloadRecord(record: Record<string, any>) {
  const { payload, ...rest } = record
  return { ...payloadObject(payload), ...rest }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'shop'
}

function toShopRecord(shop: Record<string, any>): Record<string, any> {
  const { payload, ownerId, campusId, campus, ...record } = shop
  delete record.managers
  const shopPayload = payloadObject(payload)
  const acceptingOrders = shopPayload.acceptingOrders !== false
  return {
    ...shopPayload,
    ...record,
    ownerId,
    studentId: ownerId,
    campusId,
    campus: campus?.name ?? record.locationLabel ?? payloadObject(payload).campus,
    score: record.ratingAverage,
    acceptingOrders,
    status: String(record.status).toLowerCase() === 'active' ? (acceptingOrders ? 'open' : 'closed') : String(record.status).toLowerCase()
  }
}

function toListingRecord(listing: Record<string, any>): Record<string, any> {
  const { payload, listingType, stockCount, images, seller, shop, ...record } = listing
  const shopPayload = payloadObject(shop?.payload)
  return {
    ...payloadObject(payload),
    ...record,
    listingType,
    kind: String(listingType).toLowerCase() === 'service' ? 'service' : 'product',
    stock: stockCount,
    stockCount,
    gallery: images,
    images,
    shop: shop ? {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      tagline: shop.tagline,
      ratingAverage: shop.ratingAverage,
      ratingCount: shop.ratingCount,
      orderCount: shop.orderCount,
      entityType: shopPayload.entityType || null,
      vendorType: shopPayload.vendorType || null,
      acceptingOrders: shopPayload.acceptingOrders !== false,
      campusManagedProfileId: shopPayload.campusManagedProfileId || null
    } : null,
    seller: seller ? {
      studentId: seller.id,
      userId: seller.userId,
      username: seller.user?.username,
      name: seller.user?.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim(),
      avatarUrl: seller.avatarUrl,
      campus: seller.campus?.name
    } : null,
    status: String(record.status).toLowerCase() === 'active' ? 'published' : String(record.status).toLowerCase()
  }
}

const listingRelations = {
  shop: true,
  seller: {
    include: {
      campus: true,
      user: { select: { id: true, name: true, username: true } }
    }
  }
} satisfies Prisma.MarketplaceListingInclude

function toCartRecord(cart: Record<string, any>) {
  return { ...cart, items: Array.isArray(cart.items) ? cart.items : [] }
}

function toOrderRecord(order: Record<string, any>) {
  const { payload, ...record } = order
  return { ...payloadObject(payload), ...record, items: Array.isArray(order.items) ? order.items : [] }
}

class MarketplaceOrdersRepository {
  async readZumbarlDeliveryConfig() {
    const records = await platformConfigurations.listAll((item) => item.key === 'zumbarl_delivery')
    const latest = records.at(-1)
    if (!latest?.value) return DEFAULT_ZUMBARL_DELIVERY_CONFIG
    try {
      const value = typeof latest.value === 'string' ? JSON.parse(latest.value) : latest.value
      return { ...DEFAULT_ZUMBARL_DELIVERY_CONFIG, ...value }
    } catch {
      return DEFAULT_ZUMBARL_DELIVERY_CONFIG
    }
  }
  async findMarketplaceActor(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, firstName: true, lastName: true, studentProfile: { select: { id: true } } }
    })
    if (!user) return null
    return {
      id: user.id,
      studentId: user.studentProfile?.id || null,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A Zumbarl student'
    }
  }

  async findSellerByUsername(username: string) {
    const normalizedUsername = username.trim().replace(/^@/, '').toLowerCase()
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            avatarUrl: true,
            campus: { select: { name: true } },
            _count: { select: { marketplaceListings: true } }
          }
        }
      }
    })
    if (!user?.studentProfile) return null
    return {
      userId: user.id,
      studentId: user.studentProfile.id,
      username: user.username,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student seller',
      role: user.role,
      avatarUrl: user.studentProfile.avatarUrl,
      campus: user.studentProfile.campus.name,
      joinedAt: user.createdAt,
      itemsListed: user.studentProfile._count.marketplaceListings
    }
  }

  async createOffer(payload: Record<string, any>) {
    return prisma.marketplaceOffer.create({
      data: {
        listingReference: payload.listingReference,
        buyerId: payload.buyerId,
        sellerId: payload.sellerId,
        amount: Number(payload.amount),
        currency: payload.currency || 'KES',
        status: 'pending',
        product: jsonInput(payload.product)
      }
    })
  }

  async findPendingOffer(listingReference: string, buyerId: string) {
    return prisma.marketplaceOffer.findFirst({
      where: { listingReference, buyerId, status: 'pending' },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findCurrentBuyerOffer(listingReference: string, buyerId: string) {
    return prisma.marketplaceOffer.findFirst({
      where: { listingReference, buyerId, status: { in: ['pending', 'accepted', 'declined'] } },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async reviseDeclinedOffer(id: string, buyerId: string, payload: Record<string, any>) {
    const offer = await prisma.marketplaceOffer.findFirst({ where: { id, buyerId, status: { in: ['pending', 'declined'] } } })
    if (!offer) return null
    return prisma.marketplaceOffer.update({
      where: { id: offer.id },
      data: { amount: Number(payload.amount), currency: payload.currency || offer.currency, product: jsonInput(payload.product), status: 'pending' }
    })
  }

  async findOffer(id: string) {
    return prisma.marketplaceOffer.findUnique({ where: { id } })
  }

  async listPendingOffersForSeller(sellerId: string) {
    return prisma.marketplaceOffer.findMany({
      where: { sellerId, status: 'pending' },
      include: { buyer: { select: { id: true, name: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async decidePendingOffer(offerId: string, sellerId: string, decision: 'accepted' | 'declined') {
    return prisma.$transaction(async (tx) => {
      const offer = await tx.marketplaceOffer.findFirst({ where: { id: offerId, sellerId, status: 'pending' } })
      if (!offer) return null
      const updated = await tx.marketplaceOffer.update({ where: { id: offer.id }, data: { status: decision } })
      if (decision === 'accepted') {
        await tx.marketplaceOffer.updateMany({
          where: { listingReference: offer.listingReference, id: { not: offer.id }, status: 'pending' },
          data: { status: 'declined' }
        })
        await tx.marketplaceListing.updateMany({
          where: { id: offer.listingReference, sellerId },
          data: { status: 'RESERVED' }
        })
      }
      return updated
    })
  }

  createSellerNotification(payload: Record<string, any>) {
    return prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: jsonInput(payload.data),
        sentVia: ['IN_APP']
      }
    })
  }

  async listShops(query: Record<string, unknown>) {
    const records = await prisma.marketplaceShop.findMany({ include: { campus: true }, orderBy: { createdAt: 'desc' } })
    return pageEnvelope(records.map(toShopRecord), query)
  }

  async createShop(payload: Record<string, any>) {
    const student = payload.studentId ? await prisma.studentProfile.findUnique({ where: { id: payload.studentId }, include: { campus: true } }) : null
    if (!student) return null
    const baseSlug = slugify(payload.name)
    const duplicate = await prisma.marketplaceShop.findUnique({ where: { slug: baseSlug } })
    const slug = duplicate ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug
    const shop = await prisma.marketplaceShop.create({
      data: {
        ownerId: student.id,
        campusId: student.campusId,
        name: payload.name,
        slug,
        category: payload.category,
        locationLabel: payload.campus ?? student.campus.name,
        pickupSpots: payload.pickupSpots ?? [],
        contactRules: payload.contactRules ?? null,
        returnRules: payload.returnRules ?? null,
        status: 'ACTIVE',
        payload: jsonInput(payload)
      },
      include: { campus: true }
    })
    return toShopRecord(shop)
  }

  async updateOwnedShop(studentId: string, payload: Record<string, any>) {
    const existing = await prisma.marketplaceShop.findFirst({ where: { ownerId: studentId, status: { notIn: ['ARCHIVED', 'SUSPENDED'] } } })
    if (!existing) return null
    const currentPayload = payloadObject(existing.payload)
    const shop = await prisma.marketplaceShop.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        category: payload.category,
        tagline: payload.tagline || null,
        description: payload.description || null,
        logoUrl: payload.logoUrl || null,
        coverImageUrl: payload.coverImageUrl || null,
        locationLabel: payload.locationLabel,
        payload: jsonInput({ ...currentPayload, ...payload })
      },
      include: { campus: true }
    })
    return toShopRecord(shop)
  }

  async listListings(query: Record<string, unknown>) {
    const records = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: listingRelations,
      orderBy: { createdAt: 'desc' }
    })
    return pageEnvelope(records.map(toListingRecord), query)
  }

  async createListing(payload: Record<string, any>) {
    const shop = await prisma.marketplaceShop.findUnique({ where: { id: payload.shopId } })
    if (!shop) return null
    const listing = await prisma.marketplaceListing.create({
      data: {
        ...(payload.id ? { id: payload.id } : {}),
        shopId: shop.id,
        sellerId: shop.ownerId,
        campusId: shop.campusId,
        title: payload.title,
        description: payload.description ?? '',
        category: payload.category ?? shop.category,
        listingType: String(payload.kind ?? 'product').toUpperCase(),
        condition: payload.condition ?? null,
        priceAmount: Number(payload.priceAmount ?? 0),
        currency: payload.currency ?? 'KES',
        images: payload.gallery ?? payload.images ?? [],
        locationLabel: payload.locationLabel ?? shop.locationLabel ?? null,
        deliveryOptions: payload.deliveryOptions ?? [],
        variants: payload.variants ?? [],
        status: String(payload.status ?? 'ACTIVE').toUpperCase(),
        stockCount: Number(payload.stock ?? payload.stockCount ?? 1),
        payload: jsonInput(payload)
      },
      include: listingRelations
    })
    return toListingRecord(listing)
  }

  async findOwnedShop(studentId: string) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { ownerId: studentId, status: { notIn: ['ARCHIVED', 'SUSPENDED'] } },
      include: { campus: true },
      orderBy: { createdAt: 'asc' }
    })
    return shop ? toShopRecord(shop) : null
  }

  async listOwnedCampusVendors(userId: string) {
    const shops = await prisma.marketplaceShop.findMany({
      where: { managers: { some: { userId } }, status: { notIn: ['ARCHIVED', 'SUSPENDED'] } },
      include: { campus: true, managers: { where: { userId }, select: { role: true } }, _count: { select: { listings: true } } },
      orderBy: { createdAt: 'asc' }
    })
    return shops
      .filter((shop) => payloadObject(shop.payload).entityType === 'campus_vendor')
      .map((shop) => ({
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || 'service',
        campusManagedProfileId: payloadObject(shop.payload).campusManagedProfileId || null,
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'promotions'],
        role: shop.managers[0]?.role || 'editor',
        inventoryCount: shop._count.listings
      }))
  }

  async findOwnedCampusVendor(userId: string, slug: string, assignmentRoles?: string[]) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: {
        slug,
        managers: { some: { userId, ...(assignmentRoles ? { role: { in: assignmentRoles } } : {}) } },
        status: { notIn: ['ARCHIVED', 'SUSPENDED'] }
      },
      include: {
        campus: true,
        managers: { select: { role: true, user: { select: { id: true, name: true, email: true, username: true } } }, orderBy: { createdAt: 'asc' } }
      }
    })
    return shop && payloadObject(shop.payload).entityType === 'campus_vendor' ? shop : null
  }

  async searchCampusVendorManagerCandidates(userId: string, slug: string, query: string) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const term = query.trim()
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { username: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } }
        ]
      },
      include: { studentProfile: { include: { campus: true } } },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      take: 8
    })
    const roles = new Map(shop.managers.map((manager) => [manager.user.id, manager.role]))
    return users
      .filter((user) => Boolean(user.studentProfile))
      .map((user) => ({
        id: user.id,
        studentId: user.studentProfile?.id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Zumbarl member',
        username: user.username,
        email: user.email,
        avatarUrl: user.studentProfile?.avatarUrl,
        campus: user.studentProfile?.campus?.name,
        currentRole: roles.get(user.id) || null
      }))
  }

  async readCampusVendorWorkspace(userId: string, slug: string) {
    const shop = await this.findOwnedCampusVendor(userId, slug)
    if (!shop) return null
    const [listings, posts, sellerOrders, viewerStudent, followerRecords] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { shopId: shop.id, status: { not: 'REMOVED' } },
        include: listingRelations,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.connectPost.findMany({
        where: { payload: { path: ['vendorShopId'], equals: shop.id }, status: { not: 'removed' } },
        include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' }
      }),
      this.listSellerOrders(shop.ownerId),
      prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } }),
      campusVendorFollowers.listAll((record) => record.shopId === shop.id)
    ])
    const listingIds = new Set(listings.map((listing) => listing.id))
    const orders = sellerOrders.filter((order) => order.items.some((item: Record<string, any>) => listingIds.has(item.listingId)))
    return {
      shop: {
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || 'service',
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'promotions'],
        followerCount: new Set(followerRecords.map((record) => String(record.userId))).size,
        managers: shop.managers,
        viewerRole: shop.managers.find((assignment) => assignment.user.id === userId)?.role || 'editor',
        canManageAssignments: ['owner', 'admin'].includes(shop.managers.find((assignment) => assignment.user.id === userId)?.role || '')
      },
      listings: listings.map(toListingRecord),
      orders,
      posts: posts.map((post) => {
        const reactions = payloadObject(post.reactions)
        return {
          ...toPayloadRecord(post),
          reactionCount: Object.keys(reactions).length,
          viewerReacted: Boolean(viewerStudent?.id && reactions[viewerStudent.id]),
          commentCount: post.comments.length,
          comments: post.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            author: {
              name: 'Zumbarl member',
              handle: '@member',
              avatarUrl: null
            }
          }))
        }
      })
    }
  }

  async readCampusVendorProfile(slug: string, viewerStudentId?: string, viewerUserId?: string) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { slug, status: { notIn: ['ARCHIVED', 'SUSPENDED'] } },
      include: {
        campus: true,
        managers: { where: { userId: viewerUserId || '__anonymous__' }, select: { role: true } },
        _count: { select: { listings: true } }
      }
    })
    if (!shop || payloadObject(shop.payload).entityType !== 'campus_vendor') return null

    const [listings, posts, followerRecords] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { shopId: shop.id, status: 'ACTIVE' },
        include: listingRelations,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.connectPost.findMany({
        where: { payload: { path: ['vendorShopId'], equals: shop.id }, status: 'published' },
        include: { comments: { where: { status: 'published' }, orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' }
      }),
      campusVendorFollowers.listAll((record) => record.shopId === shop.id)
    ])

    const followerUserIds = new Set(followerRecords.map((record) => String(record.userId)))

    return {
      shop: {
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || 'service',
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts'],
        inventoryCount: listings.length,
        followerCount: followerUserIds.size,
        isFollowing: Boolean(viewerUserId && followerUserIds.has(viewerUserId)),
        viewerRole: shop.managers[0]?.role || null,
        canOpenWorkspace: Boolean(shop.managers[0]?.role)
      },
      listings: listings.map(toListingRecord),
      posts: posts
        .filter((post) => !payloadObject(post.payload).isPromoted)
        .map((post) => {
          const reactions = payloadObject(post.reactions)
          return {
            ...toPayloadRecord(post),
            reactionCount: Object.keys(reactions).length,
            viewerReacted: Boolean(viewerStudentId && reactions[viewerStudentId]),
            commentCount: post.comments.length,
            comments: post.comments.map((comment) => ({
              id: comment.id,
              body: comment.body,
              createdAt: comment.createdAt,
              author: { name: 'Zumbarl member', handle: '@member', avatarUrl: null }
            }))
          }
        })
    }
  }

  async setCampusVendorFollowing(userId: string, slug: string, active: boolean) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { slug, status: { notIn: ['ARCHIVED', 'SUSPENDED'] } }
    })
    if (!shop || payloadObject(shop.payload).entityType !== 'campus_vendor') return null

    const existing = await campusVendorFollowers.listAll((record) => record.shopId === shop.id && record.userId === userId)
    if (active && !existing.length) await campusVendorFollowers.create({ shopId: shop.id, userId })
    if (!active && existing.length) await Promise.all(existing.map((record) => campusVendorFollowers.deleteById(record.id)))

    const followers = await campusVendorFollowers.listAll((record) => record.shopId === shop.id)
    return {
      followerCount: new Set(followers.map((record) => String(record.userId))).size,
      isFollowing: active
    }
  }

  async updateCampusVendorAvailability(userId: string, slug: string, acceptingOrders: boolean) {
    const shop = await this.findOwnedCampusVendor(userId, slug)
    if (!shop) return null
    const currentPayload = payloadObject(shop.payload)
    await prisma.marketplaceShop.update({
      where: { id: shop.id },
      data: { payload: jsonInput({ ...currentPayload, acceptingOrders }) }
    })
    return this.readCampusVendorWorkspace(userId, slug)
  }

  async createCampusVendorPost(userId: string, slug: string, payload: Record<string, any>, promotion = false) {
    const shop = await this.findOwnedCampusVendor(userId, slug)
    if (!shop) return null
    const promotionPayload = promotion ? { ...payload, status: 'active' } : null
    const postPayload = {
      ...payload,
      vendorShopId: shop.id,
      vendorSnapshot: {
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        avatarUrl: shop.logoUrl,
        campus: shop.campus?.name || shop.locationLabel,
        isVerified: true
      },
      ...(promotion ? { isPromoted: true, promotion: promotionPayload } : {})
    }
    return toPayloadRecord(await prisma.connectPost.create({
      data: {
        studentId: shop.ownerId,
        type: promotion ? 'post' : payload.type || 'post',
        body: promotion ? `${payload.headline}\n\n${payload.description}` : payload.body,
        tags: jsonInput(payload.tags ?? (promotion ? [{ type: 'promotion', id: shop.id, label: 'Promotion' }] : [])),
        visibility: payload.visibility || 'campus',
        status: 'published',
        reactions: {},
        payload: jsonInput(postPayload)
      }
    }))
  }

  async updateCampusVendorPost(userId: string, slug: string, postId: string, payload: Record<string, any>) {
    const shop = await this.findOwnedCampusVendor(userId, slug)
    if (!shop) return null
    const post = await prisma.connectPost.findFirst({
      where: { id: postId, status: 'published', payload: { path: ['vendorShopId'], equals: shop.id } }
    })
    if (!post) return null
    return toPayloadRecord(await prisma.connectPost.update({
      where: { id: post.id },
      data: {
        body: payload.body,
        payload: jsonInput({ ...payloadObject(post.payload), ...payload })
      }
    }))
  }

  async updateCampusVendorForManager(userId: string, slug: string, payload: Record<string, any>) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const currentPayload = payloadObject(shop.payload)
    const vendorType = payload.type || currentPayload.vendorType || 'service'
    return this.readCampusVendorWorkspace(userId, (await prisma.marketplaceShop.update({
      where: { id: shop.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(payload.locationLabel !== undefined ? { locationLabel: payload.locationLabel || null } : {}),
        ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl || null } : {}),
        ...(payload.coverImageUrl !== undefined ? { coverImageUrl: payload.coverImageUrl || null } : {}),
        category: vendorType === 'hotel' ? 'Food & hospitality' : vendorType === 'barber_shop' ? 'Beauty & grooming' : 'Campus services',
        payload: jsonInput({ ...currentPayload, vendorType })
      }
    })).slug)
  }

  async addCampusVendorManagerForManager(userId: string, slug: string, email: string, role: string) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { studentProfile: true } })
    if (!user?.studentProfile) return null
    const existing = await prisma.marketplaceShopManager.findUnique({
      where: { shopId_userId: { shopId: shop.id, userId: user.id } },
      include: { user: { select: { id: true, name: true, email: true, username: true } } }
    })
    if (existing?.role === 'owner') return existing
    return prisma.marketplaceShopManager.upsert({
      where: { shopId_userId: { shopId: shop.id, userId: user.id } },
      update: { role },
      create: { shopId: shop.id, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true, username: true } } }
    })
  }

  async removeCampusVendorManagerForManager(actorUserId: string, slug: string, managerUserId: string) {
    const shop = await this.findOwnedCampusVendor(actorUserId, slug, ['owner', 'admin'])
    if (!shop || actorUserId === managerUserId) return null
    const assignment = await prisma.marketplaceShopManager.findUnique({ where: { shopId_userId: { shopId: shop.id, userId: managerUserId } } })
    if (!assignment || assignment.role === 'owner') return null
    await prisma.marketplaceShopManager.delete({ where: { id: assignment.id } })
    return { shopId: shop.id, userId: managerUserId, removed: true }
  }

  async createDefaultShop(studentId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { campus: true, user: { select: { name: true, firstName: true } } }
    })
    if (!student) return null
    const ownerName = student.user.name || student.user.firstName || student.firstName || 'Student'
    return this.createShop({
      studentId,
      name: `${ownerName}'s Shop`,
      category: 'General',
      campus: student.campus.name,
      pickupSpots: [],
      contactRules: 'Keep marketplace communication on Zumbarl.',
      returnRules: null
    })
  }

  async listOwnedListings(studentId: string) {
    const records = await prisma.marketplaceListing.findMany({
      where: { sellerId: studentId, status: { not: 'REMOVED' } },
      include: listingRelations,
      orderBy: { updatedAt: 'desc' }
    })
    return records.map(toListingRecord)
  }

  async updateOwnedListing(id: string, studentId: string, payload: Record<string, any>) {
    const existing = await prisma.marketplaceListing.findFirst({ where: { id, sellerId: studentId } })
    if (!existing) return null
    const currentPayload = payloadObject(existing.payload)
    const listing = await prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.kind !== undefined ? { listingType: String(payload.kind).toUpperCase() } : {}),
        ...(payload.condition !== undefined ? { condition: payload.condition || null } : {}),
        ...(payload.priceAmount !== undefined ? { priceAmount: Number(payload.priceAmount) } : {}),
        ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
        ...(payload.gallery !== undefined ? { images: payload.gallery } : {}),
        ...(payload.locationLabel !== undefined ? { locationLabel: payload.locationLabel || null } : {}),
        ...(payload.deliveryOptions !== undefined ? { deliveryOptions: payload.deliveryOptions } : {}),
        ...(payload.variants !== undefined ? { variants: payload.variants } : {}),
        ...(payload.stock !== undefined ? { stockCount: Number(payload.stock) } : {}),
        ...(payload.status !== undefined ? { status: String(payload.status).toUpperCase() } : {}),
        payload: jsonInput({ ...currentPayload, ...payload })
      },
      include: listingRelations
    })
    return toListingRecord(listing)
  }

  async findShop(id: string) {
    const shop = await prisma.marketplaceShop.findUnique({ where: { id }, include: { campus: true } })
    return shop ? toShopRecord(shop) : null
  }

  async userManagesShop(userId: string, shopId: string) {
    return Boolean(await prisma.marketplaceShopManager.findUnique({ where: { shopId_userId: { shopId, userId } } }))
  }

  async findListing(id: string) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id }, include: listingRelations })
    return listing ? toListingRecord(listing) : null
  }

  async findListingDeliveryOrigin(id: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      select: { payload: true, locationLabel: true, shop: { select: { payload: true, locationLabel: true } } }
    })
    if (!listing) return null
    const listingPayload = payloadObject(listing.payload)
    const shopPayload = payloadObject(listing.shop?.payload)
    const listingLatitude = Number(listingPayload.latitude)
    const listingLongitude = Number(listingPayload.longitude)
    const hasListingCoordinates = Number.isFinite(listingLatitude) && Number.isFinite(listingLongitude)
    return {
      latitude: hasListingCoordinates ? listingLatitude : Number(shopPayload.latitude),
      longitude: hasListingCoordinates ? listingLongitude : Number(shopPayload.longitude),
      locationLabel: hasListingCoordinates ? listing.locationLabel : listing.shop?.locationLabel,
      source: hasListingCoordinates ? 'listing' : 'shop'
    }
  }

  async findOpenCart(studentId?: string) {
    const cart = await prisma.marketplaceCart.findFirst({
      where: { studentId: studentId ?? null, status: 'open' },
      orderBy: { createdAt: 'desc' }
    })
    return cart ? toCartRecord(cart) : null
  }

  async createCart(studentId?: string) {
    return toCartRecord(await prisma.marketplaceCart.create({
      data: { studentId: studentId ?? null, status: 'open', items: jsonInput([]) }
    }))
  }

  async findCart(id: string) {
    const cart = await prisma.marketplaceCart.findUnique({ where: { id } })
    return cart ? toCartRecord(cart) : null
  }

  async updateCart(id: string, patch: Record<string, any>) {
    const existing = await prisma.marketplaceCart.findUnique({ where: { id } })
    if (!existing) return null
    const cart = await prisma.marketplaceCart.update({
      where: { id },
      data: {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.items ? { items: jsonInput(patch.items) } : {}),
        ...(patch.orderId !== undefined ? { orderId: patch.orderId } : {})
      }
    })
    return toCartRecord(cart)
  }

  async createOrder(payload: Record<string, any>) {
    return toOrderRecord(await prisma.marketplaceOrder.create({
      data: {
        studentId: payload.studentId ?? null,
        cartId: payload.cartId ?? null,
        items: jsonInput(payload.items ?? []),
        totalAmount: Number(payload.totalAmount ?? 0),
        currency: payload.currency ?? 'KES',
        status: payload.status ?? 'paid',
        fulfillmentStatus: payload.fulfillmentStatus ?? 'seller_confirmation',
        handoffType: payload.handoffType,
        handoffSpot: payload.handoffSpot,
        paymentReference: payload.paymentReference ?? null,
        payload: jsonInput(payload)
      }
    }))
  }

  async listOrders(query: Record<string, unknown>) {
    const records = await prisma.marketplaceOrder.findMany({ orderBy: { createdAt: 'desc' } })
    return pageEnvelope(records.map(toOrderRecord), query)
  }

  async listBuyerOrders(studentId: string, query: Record<string, unknown>) {
    const records = await prisma.marketplaceOrder.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } })
    return pageEnvelope(records.map(toOrderRecord), query)
  }

  async listSellerOrders(studentId: string) {
    const listings = await prisma.marketplaceListing.findMany({ where: { sellerId: studentId }, select: { id: true } })
    const owned = new Set(listings.map((listing) => listing.id))
    const records = await prisma.marketplaceOrder.findMany({ orderBy: { createdAt: 'desc' } })
    return records.map(toOrderRecord).filter((order) => order.items.some((item: Record<string, any>) => item.sellerId === studentId || owned.has(item.listingId)))
  }

  async findSellerOrder(id: string, studentId: string): Promise<Record<string, any> | null> {
    const order = await this.findOrder(id)
    if (!order) return null
    const listingIds = order.items.map((item: Record<string, any>) => item.listingId).filter(Boolean)
    const ownedCount = await prisma.marketplaceListing.count({ where: { id: { in: listingIds }, sellerId: studentId } })
    return order.items.some((item: Record<string, any>) => item.sellerId === studentId) || ownedCount > 0 ? order : null
  }

  async findShopSellerOrder(id: string, shopId: string): Promise<Record<string, any> | null> {
    const order = await this.findOrder(id)
    if (!order) return null
    const listingIds = order.items.map((item: Record<string, any>) => item.listingId).filter(Boolean)
    const shopListingCount = await prisma.marketplaceListing.count({ where: { id: { in: listingIds }, shopId } })
    return shopListingCount > 0 ? order : null
  }

  async findOrder(id: string) {
    const order = await prisma.marketplaceOrder.findUnique({ where: { id } })
    return order ? toOrderRecord(order) : null
  }

  async updateOrder(id: string, patch: Record<string, any>) {
    const existing = await prisma.marketplaceOrder.findUnique({ where: { id } })
    if (!existing) return null
    return toOrderRecord(await prisma.marketplaceOrder.update({
      where: { id },
      data: {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.fulfillmentStatus ? { fulfillmentStatus: patch.fulfillmentStatus } : {}),
        ...(patch.deliveredAt !== undefined ? { deliveredAt: patch.deliveredAt } : {}),
        ...(patch.autoReleaseAt !== undefined ? { autoReleaseAt: patch.autoReleaseAt } : {}),
        payload: jsonInput({ ...payloadObject(existing.payload), ...patch })
      }
    }))
  }

  async markDelivered(id: string) {
    const deliveredAt = new Date()
    const autoReleaseAt = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.update({
        where: { id },
        data: { fulfillmentStatus: 'delivered', deliveredAt, autoReleaseAt }
      })
      const buyer = order.studentId ? await tx.studentProfile.findUnique({
        where: { id: order.studentId },
        include: { user: { select: { id: true, email: true, name: true } } }
      }) : null
      if (buyer) await tx.notification.create({
        data: {
          userId: buyer.user.id,
          type: 'marketplace_order_delivered',
          title: 'Has your order arrived?',
          body: 'Your seller marked the order as delivered. Confirm receipt to release payment.',
          data: jsonInput({ orderId: order.id, autoReleaseAt: autoReleaseAt.toISOString() }),
          sentVia: ['IN_APP', 'EMAIL']
        }
      })
      return { order: toOrderRecord(order), recipient: buyer ? { email: buyer.user.email, name: buyer.user.name || buyer.firstName } : null }
    })
  }

  async completeBuyerOrder(id: string, studentId: string, automatic = false) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findFirst({ where: { id, studentId } })
      if (!order || order.fulfillmentStatus !== 'delivered' || order.escrowReleasedAt) return null
      const now = new Date()
      const claimed = await tx.marketplaceOrder.updateMany({
        where: { id, studentId, fulfillmentStatus: 'delivered', escrowReleasedAt: null },
        data: { escrowReleasedAt: now, buyerConfirmedAt: automatic ? null : now }
      })
      if (claimed.count !== 1) return null
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const amounts = new Map<string, number>()
      for (const item of items) amounts.set(item.sellerId, (amounts.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const [sellerId, amount] of amounts) {
        if (!sellerId || amount <= 0) continue
        await creditStudentWallet(tx, sellerId, amount, {
          description: `Marketplace escrow release for order ${order.id}`,
          metadata: { orderId: order.id, automatic }
        })
      }
      const updated = await tx.marketplaceOrder.update({
        where: { id: order.id },
        data: { status: 'completed', fulfillmentStatus: 'completed' }
      })
      return toOrderRecord(updated)
    })
  }

  async cancelBuyerOrder(id: string, studentId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findFirst({ where: { id, studentId } })
      if (!order || !['seller_confirmation', 'confirmed'].includes(order.fulfillmentStatus)) return null
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const amounts = new Map<string, number>()
      for (const item of items) amounts.set(item.sellerId, (amounts.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const [sellerId, amount] of amounts) {
        if (!sellerId || amount <= 0) continue
        const wallet = await getOrCreateStudentWallet(tx, sellerId)
        await tx.wallet.update({ where: { id: wallet.id }, data: { pendingBalance: Math.max(0, wallet.pendingBalance - amount) } })
      }
      const buyerWallet = await getOrCreateStudentWallet(tx, studentId)
      await tx.transaction.create({ data: { walletId: buyerWallet.id, type: 'ESCROW_REFUND', status: 'PENDING', amount: order.totalAmount, netAmount: order.totalAmount, currency: order.currency, description: `Marketplace refund review for order ${order.id}`, metadata: jsonInput({ orderId: order.id, reviewRequired: true, cancelledBy: 'buyer' }) } })
      const admins = await tx.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'FINANCE_OFFICER', 'OPERATIONS_MANAGER'] }, isActive: true }, select: { id: true } })
      await Promise.all(admins.map((admin) => tx.notification.create({ data: { userId: admin.id, type: 'marketplace_refund_review', title: 'Marketplace refund review required', body: `Order ${order.id} was cancelled by the buyer. Review the held funds under company refund policy.`, data: jsonInput({ orderId: order.id, buyerId: studentId, amount: order.totalAmount, currency: order.currency }), sentVia: ['IN_APP'] } })))
      const updated = await tx.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'refund_review', fulfillmentStatus: 'cancelled', cancelledAt: new Date() } })
      return toOrderRecord(updated)
    })
  }

  async cancelSellerOrder(id: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findUnique({ where: { id } })
      if (!order || !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) return null
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const amounts = new Map<string, number>()
      for (const item of items) amounts.set(item.sellerId, (amounts.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const [sellerId, amount] of amounts) {
        if (!sellerId || amount <= 0) continue
        const wallet = await getOrCreateStudentWallet(tx, sellerId)
        await tx.wallet.update({ where: { id: wallet.id }, data: { pendingBalance: Math.max(0, wallet.pendingBalance - amount) } })
      }
      const buyerWallet = order.studentId ? await getOrCreateStudentWallet(tx, order.studentId) : null
      if (buyerWallet) await tx.transaction.create({ data: { walletId: buyerWallet.id, type: 'ESCROW_REFUND', status: 'PENDING', amount: order.totalAmount, netAmount: order.totalAmount, currency: order.currency, description: `Marketplace refund review for order ${order.id}`, metadata: jsonInput({ orderId: order.id, reviewRequired: true, cancelledBy: 'seller' }) } })
      const admins = await tx.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'FINANCE_OFFICER', 'OPERATIONS_MANAGER'] }, isActive: true }, select: { id: true } })
      await Promise.all(admins.map((admin) => tx.notification.create({ data: { userId: admin.id, type: 'marketplace_refund_review', title: 'Marketplace refund review required', body: `Order ${order.id} was cancelled by the seller. Review the held funds under company refund policy.`, data: jsonInput({ orderId: order.id, buyerId: order.studentId, amount: order.totalAmount, currency: order.currency }), sentVia: ['IN_APP'] } })))
      const updated = await tx.marketplaceOrder.update({ where: { id }, data: { status: 'refund_review', fulfillmentStatus: 'cancelled', cancelledAt: new Date() } })
      if (order.studentId) {
        const buyer = await tx.studentProfile.findUnique({ where: { id: order.studentId }, select: { userId: true } })
        if (buyer) await tx.notification.create({ data: { userId: buyer.userId, type: 'marketplace_order_cancelled', title: 'Order cancelled by seller', body: 'The seller could not fulfil your order. Your held payment has been sent to Zumbarl for refund review.', data: jsonInput({ orderId: order.id }), sentVia: ['IN_APP'] } })
      }
      return toOrderRecord(updated)
    })
  }

  async processDeliveryDeadlines(now = new Date()) {
    const due = await prisma.marketplaceOrder.findMany({ where: { fulfillmentStatus: 'delivered', escrowReleasedAt: null, autoReleaseAt: { lte: now } } })
    const released = []
    for (const order of due) {
      if (order.studentId) {
        const result = await this.completeBuyerOrder(order.id, order.studentId, true)
        if (result) released.push(result)
      }
    }
    const reminderCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const reminders = await prisma.marketplaceOrder.findMany({ where: { fulfillmentStatus: 'delivered', escrowReleasedAt: null, reminderCount: { lt: 4 }, deliveredAt: { gt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), lte: reminderCutoff }, OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: reminderCutoff } }] } })
    const recipients = []
    for (const order of reminders) {
      if (!order.studentId) continue
      const buyer = await prisma.studentProfile.findUnique({ where: { id: order.studentId }, include: { user: { select: { id: true, email: true, name: true } } } })
      if (!buyer) continue
      const count = order.reminderCount + 1
      await prisma.$transaction([
        prisma.marketplaceOrder.update({ where: { id: order.id }, data: { reminderCount: count, lastReminderAt: now } }),
        prisma.notification.create({ data: { userId: buyer.user.id, type: 'marketplace_receipt_reminder', title: 'Please confirm your order', body: `Reminder ${count} of 4: confirm receipt or report a problem. Payment releases automatically after 7 days.`, data: jsonInput({ orderId: order.id, reminder: count }), sentVia: ['IN_APP', 'EMAIL'] } })
      ])
      recipients.push({ orderId: order.id, email: buyer.user.email, name: buyer.user.name || buyer.firstName, reminder: count })
    }
    return { released, recipients }
  }

  createReview(payload: Record<string, any>) {
    return reviews.create(payload)
  }

  createDispute(payload: Record<string, any>) {
    return moderationCases.create(payload)
  }

  findOrCreateOpenCart(studentId?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.marketplaceCart.findFirst({
        where: { studentId: studentId ?? null, status: 'open' },
        orderBy: { createdAt: 'desc' }
      })
      let cart = existing ?? await tx.marketplaceCart.create({
        data: { studentId: studentId ?? null, status: 'open', items: jsonInput([]) }
      })
      const currentItems = Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []
      const listingIds = currentItems.map((item) => item.listingId).filter(Boolean)
      if (listingIds.length) {
        const listings = await tx.marketplaceListing.findMany({ where: { id: { in: listingIds } } })
        const listingMap = new Map(listings.map((listing) => [listing.id, listing]))
        const hydratedItems = currentItems.map((item) => {
          const listing = listingMap.get(item.listingId)
          return listing ? {
            ...item,
            title: item.title || listing.title,
            description: item.description || listing.description,
            image: item.image || listing.images[0] || null,
            deliveryOptions: item.deliveryOptions || listing.deliveryOptions,
            deliveryZones: item.deliveryZones || payloadObject(listing.payload).deliveryZones || [],
            kind: item.kind || (String(listing.listingType).toLowerCase() === 'service' ? 'service' : 'product'),
            serviceMode: item.serviceMode || payloadObject(listing.payload).serviceMode,
            lockedQuantity: item.lockedQuantity ?? Boolean(item.offerId)
          } : item
        })
        cart = await tx.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput(hydratedItems) } })
      }
      return toCartRecord(cart)
    })
  }

  addCartItem(studentId: string | undefined, buyerUserId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.findUnique({ where: { id: payload.listingId }, include: { shop: true } })
      if (!listing) return null
      const shopPayload = payloadObject(listing.shop?.payload)
      if (shopPayload.entityType === 'campus_vendor' && shopPayload.acceptingOrders === false) return null
      const acceptedOffer = payload.offerId && buyerUserId
        ? await tx.marketplaceOffer.findFirst({
            where: { id: payload.offerId, listingReference: listing.id, buyerId: buyerUserId, status: 'accepted' }
          })
        : null
      if (payload.offerId && !acceptedOffer) return null
      const cart = await tx.marketplaceCart.findFirst({
        where: { studentId: studentId ?? null, status: 'open' },
        orderBy: { createdAt: 'desc' }
      }) ?? await tx.marketplaceCart.create({
        data: { studentId: studentId ?? null, status: 'open', items: jsonInput([]) }
      })
      const currentItems = Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []
      const deliveryZones = Array.isArray(payloadObject(listing.payload).deliveryZones) ? payloadObject(listing.payload).deliveryZones : []
      const fulfilment = listing.deliveryOptions.includes('Campus pickup')
        ? { method: 'pickup', location: listing.locationLabel || 'Campus pickup', fee: 0, quoted: true }
        : listing.deliveryOptions.includes('Digital delivery')
          ? { method: 'digital', location: 'Digital delivery', fee: 0, quoted: true }
          : { method: 'unquoted', location: 'Arrange with seller', fee: 0, quoted: false }
      const items = [
        ...currentItems.filter((item) => item.listingId !== payload.listingId),
        {
          ...payload,
          title: listing.title,
          sellerId: listing.sellerId,
          description: listing.description,
          image: listing.images[0] || null,
          deliveryOptions: listing.deliveryOptions,
          deliveryZones,
          kind: String(listing.listingType).toLowerCase() === 'service' ? 'service' : 'product',
          serviceMode: payloadObject(listing.payload).serviceMode,
          latitude: payloadObject(listing.payload).latitude,
          longitude: payloadObject(listing.payload).longitude,
          locationLabel: listing.locationLabel,
          fulfilment,
          lockedQuantity: Boolean(acceptedOffer),
          unitAmount: acceptedOffer?.amount ?? listing.priceAmount,
          currency: acceptedOffer?.currency ?? listing.currency
        }
      ]
      return toCartRecord(await tx.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput(items) } }))
    })
  }

  async removeCartItem(studentId: string | undefined, listingId: string) {
    const cart = await prisma.marketplaceCart.findFirst({ where: { studentId: studentId ?? null, status: 'open' }, orderBy: { createdAt: 'desc' } })
    if (!cart) return null
    const items = (Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []).filter((item) => item.listingId !== listingId)
    return toCartRecord(await prisma.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput(items) } }))
  }

  async clearCart(studentId: string | undefined) {
    const cart = await prisma.marketplaceCart.findFirst({ where: { studentId: studentId ?? null, status: 'open' }, orderBy: { createdAt: 'desc' } })
    if (!cart) return null
    return toCartRecord(await prisma.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput([]) } }))
  }

  async updateCartItemFulfilment(studentId: string | undefined, listingId: string, fulfilment: Record<string, any>) {
    const cart = await prisma.marketplaceCart.findFirst({ where: { studentId: studentId ?? null, status: 'open' }, orderBy: { createdAt: 'desc' } })
    if (!cart) return null
    const currentItems = Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []
    const target = currentItems.find((item) => item.listingId === listingId)
    if (!target) return null
    const valid = fulfilment.method === 'unquoted'
      || (fulfilment.method === 'zumbarl_delivery' && fulfilment.quoted === true && Number(fulfilment.fee) >= 0)
      || (fulfilment.method === 'pickup' && (target.deliveryOptions || []).includes('Campus pickup') && Number(fulfilment.fee) === 0)
      || (fulfilment.method === 'digital' && (target.deliveryOptions || []).includes('Digital delivery') && Number(fulfilment.fee) === 0)
      || (fulfilment.method === 'seller_delivery' && (target.deliveryZones || []).some((zone: Record<string, any>) => zone.location === fulfilment.location && Number(zone.fee) === Number(fulfilment.fee)))
    if (!valid) return null
    const items = currentItems.map((item) => item.listingId === listingId ? { ...item, fulfilment } : item)
    return toCartRecord(await prisma.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput(items) } }))
  }

  createOrderFromCart(studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.marketplaceCart.findUnique({ where: { id: payload.cartId } })
      if (!cart || cart.status !== 'open' || cart.studentId !== (studentId ?? null)) return null
      const items = Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []
      if (!items.length || items.some((item) => !item.fulfilment?.quoted)) return null
      const listingIds = items.map((item) => item.listingId).filter(Boolean)
      const orderListings = await tx.marketplaceListing.findMany({ where: { id: { in: listingIds } }, include: { shop: true } })
      const closedVendor = orderListings.find((listing) => {
        const shopPayload = payloadObject(listing.shop?.payload)
        return shopPayload.entityType === 'campus_vendor' && shopPayload.acceptingOrders === false
      })
      if (closedVendor) throw new ApiError(409, `${closedVendor.shop?.name || 'This campus vendor'} is currently closed and is not accepting new orders`, 'VENDOR_NOT_ACCEPTING_ORDERS')
      const buyer = studentId
        ? await tx.studentProfile.findUnique({ where: { id: studentId }, select: { userId: true, firstName: true, lastName: true } })
        : null
      const totalAmount = items.reduce((sum, item) => sum + Number(item.unitAmount ?? 0) * Number(item.quantity ?? 0), 0)
      if (!studentId) throw new ApiError(403, 'A buyer wallet is required', 'BUYER_WALLET_REQUIRED')
      const buyerWallet = await getOrCreateStudentWallet(tx, studentId)
      const debited = await tx.wallet.updateMany({ where: { id: buyerWallet.id, balance: { gte: totalAmount } }, data: { balance: { decrement: totalAmount } } })
      if (debited.count !== 1) throw new ApiError(409, 'Your wallet balance is not enough to place this order', 'INSUFFICIENT_WALLET_BALANCE', { required: totalAmount, available: buyerWallet.balance, currency: buyerWallet.currency })
      const order = await tx.marketplaceOrder.create({
        data: {
          studentId: studentId ?? null,
          cartId: cart.id,
          items: jsonInput(items),
          totalAmount,
          currency: items[0]?.currency ?? 'KES',
          status: 'paid',
          fulfillmentStatus: 'seller_confirmation',
          handoffType: payload.handoffType,
          handoffSpot: payload.handoffSpot,
          paymentReference: payload.paymentReference ?? null,
          payload: jsonInput({
            ...payload,
            buyerUserId: buyer?.userId,
            buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : undefined
          })
        }
      })
      await tx.transaction.create({ data: { walletId: buyerWallet.id, type: 'ESCROW_HOLD', status: 'COMPLETED', amount: totalAmount, netAmount: totalAmount, currency: order.currency, description: `Marketplace payment held in escrow for order ${order.id}`, processedAt: new Date(), metadata: jsonInput({ orderId: order.id, direction: 'buyer_debit' }) } })
      const escrowBySeller = new Map<string, number>()
      for (const item of items) escrowBySeller.set(item.sellerId, (escrowBySeller.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const [sellerId, amount] of escrowBySeller) {
        if (!sellerId || amount <= 0) continue
        const wallet = await getOrCreateStudentWallet(tx, sellerId)
        await tx.wallet.update({ where: { id: wallet.id }, data: { pendingBalance: { increment: amount } } })
        await tx.transaction.create({ data: { walletId: wallet.id, type: 'ESCROW_HOLD', status: 'COMPLETED', amount, netAmount: amount, currency: order.currency, description: `Marketplace escrow hold for order ${order.id}`, processedAt: new Date(), metadata: jsonInput({ orderId: order.id }) } })
      }
      const acceptedOfferIds = items.map((item) => item.offerId).filter(Boolean)
      if (acceptedOfferIds.length) {
        await tx.marketplaceOffer.updateMany({
          where: { id: { in: acceptedOfferIds }, status: 'accepted' },
          data: { status: 'converted' }
        })
      }
      await tx.marketplaceCart.update({ where: { id: cart.id }, data: { status: 'ordered', orderId: order.id } })
      return toOrderRecord(order)
    })
  }
}

const marketplaceOrdersRepository = new MarketplaceOrdersRepository()

export {
  MarketplaceOrdersRepository,
  marketplaceOrdersRepository
}
