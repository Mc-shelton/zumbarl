import type { Prisma } from '@prisma/client'
import { env } from '../../../config/env.js'
import { ApiError, pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { deliveryCode, verifyDeliveryCode } from '../../../shared/marketplace/deliveryCode.js'
import { calculateOrderMoney } from '../../../shared/marketplace/orderMoney.js'
import { createPrismaRecordRepository, createPrismaRecordRepositoryWithClient, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { normalizeMoney, toMinorUnits } from '../../../shared/services/money.js'
import { creditStudentWallet, debitStudentWallet, refundStudentWallet, removeStudentPending, reserveStudentPending } from '../../../shared/services/walletLedger.js'
import { rankWithRecommendations } from '../../services/recommendations/index.js'

const reviews = createPrismaRecordRepository('reviews')
const platformConfigurations = createPrismaRecordRepository('platformConfigurations')
const campusVendorFollowers = createPrismaRecordRepository('campusVendorFollowers')
const vendorWithdrawals = createPrismaRecordRepository('payouts')

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

function uniqueLabels(values: unknown[]) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function studentKitchenPickupSpots(shop: Record<string, any> | null | undefined) {
  const shopPayload = payloadObject(shop?.payload)
  if (shopPayload.entityType !== 'campus_vendor' || shopPayload.vendorType !== 'student_kitchen') return []
  const configured = Array.isArray(shop?.pickupSpots) ? shop.pickupSpots : []
  return uniqueLabels(configured.length ? configured : [shop?.locationLabel])
}

function canonicalDeliveryOptions(listing: Record<string, any>) {
  const options = Array.isArray(listing.deliveryOptions) ? listing.deliveryOptions : []
  const shopPayload = payloadObject(listing.shop?.payload)
  const isCampusEatery = shopPayload.entityType === 'campus_vendor' && ['hotel', 'student_kitchen'].includes(String(shopPayload.vendorType))
  if (!isCampusEatery) return options
  const withoutPickup = options.filter((option: string) => option !== 'Campus pickup')
  return shopPayload.vendorType === 'student_kitchen' && studentKitchenPickupSpots(listing.shop).length
    ? [...withoutPickup, 'Campus pickup']
    : withoutPickup
}

function orderItemQuantities(items: Record<string, any>[]) {
  const quantities = new Map<string, number>()
  for (const item of items) {
    if (!item.listingId) continue
    const quantity = Math.max(1, Math.trunc(Number(item.quantity || 1)))
    quantities.set(item.listingId, (quantities.get(item.listingId) || 0) + quantity)
  }
  return quantities
}

async function restoreOrderInventory(tx: Prisma.TransactionClient, items: Record<string, any>[]) {
  for (const [listingId, quantity] of orderItemQuantities(items)) {
    await tx.marketplaceListing.updateMany({
      where: { id: listingId },
      data: { stockCount: { increment: quantity } }
    })
  }
}

function toShopRecord(shop: Record<string, any>): Record<string, any> {
  const { payload, ownerId, campusId, campus, ...record } = shop
  delete record.managers
  delete record.owner
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
  const deliveryOptions = canonicalDeliveryOptions(listing)
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
    deliveryOptions,
    shop: shop ? {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      tagline: shop.tagline,
      logoUrl: shop.logoUrl,
      coverImageUrl: shop.coverImageUrl,
      locationLabel: shop.locationLabel,
      pickupSpots: shop.pickupSpots || [],
      ratingAverage: shop.ratingAverage,
      ratingCount: shop.ratingCount,
      orderCount: shop.orderCount,
      createdAt: shop.createdAt,
      entityType: shopPayload.entityType || null,
      vendorType: shopPayload.vendorType || null,
      acceptingOrders: shopPayload.acceptingOrders !== false,
      status: String(shop.status).toLowerCase(),
      campusManagedProfileId: shopPayload.campusManagedProfileId || null,
      errandsEnabled: Boolean(shop.errandsEnabled),
      errandFee: Number(shop.errandFee || 0)
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

function toOrderRecord(order: Record<string, any>): Record<string, any> {
  const { payload, ...record } = order
  return { ...payloadObject(payload), ...record, items: Array.isArray(order.items) ? order.items : [] }
}

function toSellerOrderRecord(order: Record<string, any>, visibleItems: Record<string, any>[]): Record<string, any> {
  const sellerOrder = { ...order }
  for (const key of ['settlement', 'deliveryFee', 'deliveryTotal', 'finalTotal', 'platformFee', 'pricing', 'subtotal', 'totals']) delete sellerOrder[key]
  const currency = String(order.currency || visibleItems[0]?.currency || 'KES').toUpperCase()
  let sellerAmount = 0
  try {
    sellerAmount = calculateOrderMoney(visibleItems, currency).sellers.reduce((sum, allocation) => sum + allocation.amount, 0)
  } catch {
    // Legacy orders may not have the newer fulfilment snapshot. Their visible
    // merchandise lines are still the safest seller-facing amount.
    sellerAmount = visibleItems.reduce((sum, item) => sum + Number(item.unitAmount || 0) * Number(item.quantity || 1), 0)
  }
  const items = visibleItems.map((item) => {
    const sellerItem = { ...item }
    delete sellerItem.errandFee
    delete sellerItem.availableErranderCount
    const sellerFulfilment = payloadObject(sellerItem.fulfilment)
    delete sellerFulfilment.fee
    delete sellerItem.fulfilment
    return { ...sellerItem, fulfilment: sellerFulfilment }
  })
  return { ...sellerOrder, items, totalAmount: sellerAmount, sellerAmount }
}

function toErrandRecord(errand: Record<string, any>) {
  const { payload, order, shop, assignedErrander, ...record } = errand
  const orderRecord = order ? toOrderRecord(order) : null
  return {
    ...payloadObject(payload),
    ...record,
    order: orderRecord,
    items: orderRecord?.items || [],
    shop: shop ? toShopRecord(shop) : null,
    assignedErrander: assignedErrander ? {
      id: assignedErrander.id,
      name: `${assignedErrander.firstName || ''} ${assignedErrander.lastName || ''}`.trim() || assignedErrander.user?.name || 'Student errander',
      avatarUrl: assignedErrander.avatarUrl,
      userId: assignedErrander.userId,
    } : null,
  }
}

function toErranderRegistrationRecord(registration: Record<string, any>) {
  const { shop, student, ...record } = registration
  return {
    ...record,
    shop: shop ? toShopRecord(shop) : null,
    student: student ? {
      id: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.user?.name || 'Student errander',
      username: student.user?.username || null,
      avatarUrl: student.avatarUrl,
      campus: student.campus?.name || null,
      isAvailable: Boolean(registration.isAvailable),
      completedCount: Number(student.errandEnrollment?.completedCount || 0),
      userId: student.userId,
    } : null,
  }
}

function toPublicErranderRecord(registration: Record<string, any>) {
  const student = registration.student
  const isOnErrand = Boolean(student?.assignedErrands?.length)
  return {
    id: student?.id,
    name: `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.user?.name || 'Student errander',
    avatarUrl: student?.avatarUrl || null,
    completedCount: Number(student?.errandEnrollment?.completedCount || 0),
    status: isOnErrand ? 'ON_ERRAND' : registration.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'
  }
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

  async listShops(query: Record<string, unknown>, viewerStudentId?: string) {
    const campusOnly = query.campusOnly === true || String(query.campusOnly || '').toLowerCase() === 'true'
    const viewer = campusOnly && viewerStudentId
      ? await prisma.studentProfile.findUnique({ where: { id: viewerStudentId }, select: { campusId: true } })
      : null
    const records = await prisma.marketplaceShop.findMany({
      where: { status: 'ACTIVE', ...(campusOnly ? { campusId: viewer?.campusId || '__no_campus__' } : {}) },
      include: { campus: true },
      orderBy: { createdAt: 'desc' }
    })
    return pageEnvelope(records.map(toShopRecord), query)
  }

  async findOwnedStudentKitchen(studentId: string) {
    const shops = await prisma.marketplaceShop.findMany({
      where: { ownerId: studentId, status: { notIn: ['ARCHIVED', 'REJECTED'] } },
      include: { campus: true },
      orderBy: { createdAt: 'asc' }
    })
    const shop = shops.find((candidate) => {
      const payload = payloadObject(candidate.payload)
      return payload.entityType === 'campus_vendor' && payload.vendorType === 'student_kitchen'
    })
    return shop ? toShopRecord(shop) : null
  }

  async createStudentKitchen(studentId: string, userId: string, payload: Record<string, any>) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentId, userId },
      include: { campus: true }
    })
    if (!student) return null

    const existing = await this.findOwnedStudentKitchen(student.id)
    if (existing) throw new ApiError(409, 'You already have a student kitchen page')

    const campusPage = await prisma.managedProfile.findFirst({
      where: { type: 'campus', campusId: student.campusId, status: 'active' }
    })
    const baseSlug = slugify(payload.name)
    const duplicate = await prisma.marketplaceShop.findUnique({ where: { slug: baseSlug } })
    const slug = duplicate ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug
    const kitchenPayload = {
      entityType: 'campus_vendor',
      vendorType: 'student_kitchen',
      ownershipType: 'student',
      approvalStatus: 'pending',
      submittedAt: new Date().toISOString(),
      campusManagedProfileId: campusPage?.id || null,
      campusName: student.campus.name,
      managerUserId: userId,
      contactEmail: payload.contactEmail || null,
      contactPhone: payload.contactPhone || null,
      acceptingOrders: false,
      capabilities: ['inventory', 'orders', 'posts', 'promotions']
    }
    const shop = await prisma.marketplaceShop.create({
      data: {
        ownerId: student.id,
        campusId: student.campusId,
        name: payload.name,
        slug,
        tagline: `Student kitchen at ${student.campus.name}`,
        description: payload.description || null,
        category: 'Food & hospitality',
        logoUrl: payload.logoUrl || null,
        coverImageUrl: payload.coverImageUrl || null,
        locationLabel: payload.locationLabel,
        pickupSpots: uniqueLabels(payload.pickupSpots?.length ? payload.pickupSpots : [payload.locationLabel]),
        contactRules: 'Keep kitchen and customer communication on Zumbarl.',
        status: 'PENDING',
        payload: jsonInput(kitchenPayload),
        managers: { create: { userId, role: 'owner' } }
      },
      include: { campus: true }
    })
    return {
      ...toShopRecord(shop),
      type: 'student_kitchen',
      campusManagedProfileId: campusPage?.id || null,
      capabilities: kitchenPayload.capabilities,
      role: 'owner',
      inventoryCount: 0
    }
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

  async listListings(query: Record<string, unknown>, viewerStudentId?: string) {
    const campusOnly = query.campusOnly === true || String(query.campusOnly || '').toLowerCase() === 'true'
    const viewer = campusOnly && viewerStudentId
      ? await prisma.studentProfile.findUnique({ where: { id: viewerStudentId }, select: { campusId: true } })
      : null
    const records = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE', shop: { status: 'ACTIVE' }, ...(campusOnly ? { campusId: viewer?.campusId || '__no_campus__' } : {}) },
      include: listingRelations,
      orderBy: { createdAt: 'desc' }
    })
    const ranked = await rankWithRecommendations({
      studentId: viewerStudentId,
      surface: 'marketplace',
      entityType: 'marketplace_listing',
      items: records.map(toListingRecord)
    })
    return pageEnvelope(ranked, query)
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
      where: { ownerId: studentId, status: { notIn: ['ARCHIVED', 'SUSPENDED', 'REJECTED'] } },
      include: { campus: true },
      orderBy: { createdAt: 'asc' }
    })
    return shop ? toShopRecord(shop) : null
  }

  async listOwnedCampusVendors(userId: string) {
    const shops = await prisma.marketplaceShop.findMany({
      where: {
        OR: [{ managers: { some: { userId } } }, { owner: { userId } }],
        status: { notIn: ['ARCHIVED', 'SUSPENDED'] }
      },
      include: { campus: true, managers: { where: { userId }, select: { role: true } }, _count: { select: { listings: true } } },
      orderBy: { createdAt: 'asc' }
    })
    return shops
      .map((shop) => ({
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || 'shop',
        campusManagedProfileId: payloadObject(shop.payload).campusManagedProfileId || null,
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'promotions', 'errands'],
        role: shop.managers[0]?.role || 'owner',
        inventoryCount: shop._count.listings
      }))
  }

  async findOwnedCampusVendor(userId: string, slug: string, assignmentRoles?: string[]) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: {
        slug,
        OR: [
          { managers: { some: { userId, ...(assignmentRoles ? { role: { in: assignmentRoles } } : {}) } } },
          { owner: { userId } },
        ],
        status: { notIn: ['ARCHIVED', 'SUSPENDED'] }
      },
      include: {
        campus: { include: { managedProfile: { select: { slug: true } } } },
        owner: { select: { userId: true } },
        managers: { select: { role: true, user: { select: { id: true, name: true, email: true, username: true } } }, orderBy: { createdAt: 'asc' } }
      }
    })
    return shop
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
    const [listings, posts, sellerOrders, viewerStudent, followerRecords, errands, erranders] = await Promise.all([
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
      this.listSellerOrders(shop.ownerId, shop.id),
      prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } }),
      campusVendorFollowers.listAll((record) => record.shopId === shop.id),
      prisma.marketplaceErrand.findMany({
        where: { shopId: shop.id },
        include: { order: true, shop: { include: { campus: true } }, assignedErrander: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.errandShopRegistration.findMany({
        where: { shopId: shop.id },
        include: {
          shop: { include: { campus: true } },
          student: {
            include: {
              campus: true,
              errandEnrollment: true,
              user: { select: { id: true, name: true, username: true } }
            }
          }
        },
        orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }]
      })
    ])
    return {
      shop: {
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || (payloadObject(shop.payload).entityType === 'campus_vendor' ? 'service' : 'shop'),
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'promotions', 'errands'],
        handlesFinances: (payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'promotions', 'errands']).includes('orders'),
        followerCount: new Set(followerRecords.map((record) => String(record.userId))).size,
        campusProfileSlug: shop.campus?.managedProfile?.slug || null,
        managers: shop.managers,
        viewerRole: shop.managers.find((assignment) => assignment.user.id === userId)?.role || (shop.owner.userId === userId ? 'owner' : 'editor'),
        canManageAssignments: shop.owner.userId === userId || ['owner', 'admin'].includes(shop.managers.find((assignment) => assignment.user.id === userId)?.role || '')
      },
      listings: listings.map(toListingRecord),
      orders: sellerOrders,
      errands: errands.map(toErrandRecord),
      erranders: erranders.map(toErranderRegistrationRecord),
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

  async readCampusVendorFinance(userId: string, slug: string) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const [orders, withdrawals, wallet] = await Promise.all([
      this.listSellerOrders(shop.ownerId, shop.id),
      vendorWithdrawals.listAll((record) => record.type === 'vendor_withdrawal' && record.shopId === shop.id),
      prisma.wallet.findUnique({ where: { studentId_type: { studentId: shop.ownerId, type: 'MAIN' } } })
    ])
    const currency = wallet?.currency || orders[0]?.currency || 'KES'
    const completedOrders = orders.filter((order) => order.escrowReleasedAt || order.status === 'completed')
    const pendingOrders = orders.filter((order) => !order.escrowReleasedAt && !['cancelled', 'cannot_fulfil', 'disputed'].includes(order.fulfillmentStatus))
    const lifetimeIncome = normalizeMoney(completedOrders.filter((order) => order.currency === currency).reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0), currency)
    const pendingBalance = normalizeMoney(pendingOrders.filter((order) => order.currency === currency).reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0), currency)
    const committedWithdrawals = normalizeMoney(withdrawals.filter((withdrawal) => !['failed', 'reversed', 'cancelled'].includes(String(withdrawal.status))).reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0), currency)
    const processingWithdrawals = normalizeMoney(withdrawals.filter((withdrawal) => String(withdrawal.status) === 'processing').reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0), currency)
    const availableBalance = normalizeMoney(Math.max(0, Math.min(lifetimeIncome - committedWithdrawals, Number(wallet?.balance || 0))), currency)
    const orderEntries = orders.map((order) => ({
      id: `order-${order.id}`,
      type: 'sale',
      label: `Order #${order.id.slice(-8).toUpperCase()}`,
      detail: order.items.map((item: Record<string, any>) => item.title).filter(Boolean).join(', ') || 'Marketplace sale',
      amount: Number(order.sellerAmount || 0),
      currency: order.currency,
      status: order.escrowReleasedAt || order.status === 'completed' ? 'released' : ['cancelled', 'cannot_fulfil'].includes(order.fulfillmentStatus) ? 'cancelled' : order.fulfillmentStatus === 'disputed' ? 'disputed' : 'pending',
      createdAt: order.escrowReleasedAt || order.updatedAt || order.createdAt
    }))
    const withdrawalEntries = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      type: 'withdrawal',
      label: 'Withdrawal request',
      detail: `${String(withdrawal.method || 'payout').toUpperCase()} · ${withdrawal.destinationMasked || 'Saved payout destination'}`,
      amount: -Number(withdrawal.amount || 0),
      currency: withdrawal.currency || currency,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt
    }))
    return {
      page: { id: shop.id, name: shop.name, type: payloadObject(shop.payload).vendorType || 'vendor' },
      currency,
      availableBalance,
      pendingBalance,
      lifetimeIncome,
      processingWithdrawals,
      incomeStreams: [
        { id: 'marketplace-sales', label: 'Marketplace sales', amount: lifetimeIncome, status: 'released' },
        { id: 'orders-in-escrow', label: 'Orders in escrow', amount: pendingBalance, status: 'pending' }
      ],
      entries: [...orderEntries, ...withdrawalEntries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    }
  }

  async requestCampusVendorWithdrawal(userId: string, slug: string, payload: Record<string, any>) {
    const ownedShop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!ownedShop) return null
    return runPrismaRecordTransaction(async (createRepository, tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `vendor-withdrawal:${ownedShop.id}`)
      const listings = await tx.marketplaceListing.findMany({ where: { shopId: ownedShop.id }, select: { id: true } })
      const listingIds = new Set(listings.map((listing) => listing.id))
      const orderRecords = await tx.marketplaceOrder.findMany({ orderBy: { createdAt: 'desc' } })
      const orders = orderRecords.map(toOrderRecord).flatMap((order) => {
        const items = order.items.filter((item: Record<string, any>) => listingIds.has(item.listingId))
        return items.length ? [toSellerOrderRecord(order, items)] : []
      })
      const payouts = createRepository('payouts')
      const withdrawals = await payouts.listAll((record) => record.type === 'vendor_withdrawal' && record.shopId === ownedShop.id)
      const wallet = await tx.wallet.findUnique({ where: { studentId_type: { studentId: ownedShop.ownerId, type: 'MAIN' } } })
      const currency = String(payload.currency || wallet?.currency || 'KES').toUpperCase()
      const amount = normalizeMoney(payload.amount, currency)
      const lifetimeIncome = normalizeMoney(orders.filter((order) => (order.escrowReleasedAt || order.status === 'completed') && order.currency === currency).reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0), currency)
      const committed = normalizeMoney(withdrawals.filter((withdrawal) => !['failed', 'reversed', 'cancelled'].includes(String(withdrawal.status))).reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0), currency)
      const available = normalizeMoney(Math.max(0, Math.min(lifetimeIncome - committed, Number(wallet?.balance || 0))), currency)
      if (amount <= 0 || amount > available) {
        throw new ApiError(409, 'Withdrawal exceeds this page’s available earnings', 'VENDOR_WITHDRAWAL_EXCEEDED', { amount, available, currency })
      }
      const destination = String(payload.destination || '').trim()
      const destinationMasked = destination.length > 4 ? `${'*'.repeat(Math.min(6, destination.length - 4))}${destination.slice(-4)}` : destination
      const payout = await payouts.create({
        type: 'vendor_withdrawal',
        shopId: ownedShop.id,
        pageName: ownedShop.name,
        studentId: ownedShop.ownerId,
        requestedByUserId: userId,
        amount,
        currency,
        method: payload.method,
        destination,
        destinationMasked,
        status: 'processing',
        requestedAt: new Date().toISOString()
      })
      await debitStudentWallet(tx, ownedShop.ownerId, amount, {
        type: 'STUDENT_PAYOUT',
        currency,
        reference: `vendor-withdrawal:${payout.id}`,
        description: `Withdrawal requested for ${ownedShop.name}`,
        metadata: { payoutId: payout.id, shopId: ownedShop.id, requestedByUserId: userId, direction: 'withdrawal' }
      })
      return payout
    })
  }

  async readCampusVendorProfile(slug: string, viewerStudentId?: string, viewerUserId?: string) {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: {
        campus: { include: { managedProfile: { select: { slug: true } } } },
        owner: { select: { userId: true } },
        managers: { where: { userId: viewerUserId || '__anonymous__' }, select: { role: true } },
        _count: { select: { listings: true } }
      }
    })
    if (!shop) return null

    const [listings, posts, followerRecords, availableErrandCount, viewerErranderRegistration] = await Promise.all([
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
      campusVendorFollowers.listAll((record) => record.shopId === shop.id),
      prisma.marketplaceErrand.count({ where: { shopId: shop.id, status: 'AVAILABLE' } }),
      viewerStudentId
        ? prisma.errandShopRegistration.findUnique({
          where: { shopId_studentId: { shopId: shop.id, studentId: viewerStudentId } }
        })
        : Promise.resolve(null)
    ])

    const canViewErrandPublishing = viewerErranderRegistration?.status === 'ACTIVE' && Boolean(viewerStudentId)
    const activeErranders = canViewErrandPublishing && viewerStudentId
      ? await prisma.errandShopRegistration.findMany({
        where: {
          shopId: shop.id,
          status: 'ACTIVE',
          studentId: { not: viewerStudentId }
        },
        include: {
          student: {
            include: {
              errandEnrollment: true,
              assignedErrands: {
                where: { shopId: shop.id, status: { in: ['ASSIGNED', 'PICKED_UP'] } },
                select: { id: true },
                take: 1
              },
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      })
      : []

    const followerUserIds = new Set(followerRecords.map((record) => String(record.userId)))

    return {
      shop: {
        ...toShopRecord(shop),
        type: payloadObject(shop.payload).vendorType || (payloadObject(shop.payload).entityType === 'campus_vendor' ? 'service' : 'shop'),
        capabilities: payloadObject(shop.payload).capabilities || ['inventory', 'orders', 'posts', 'errands'],
        inventoryCount: listings.length,
        followerCount: followerUserIds.size,
        campusProfileSlug: shop.campus?.managedProfile?.slug || null,
        isFollowing: Boolean(viewerUserId && followerUserIds.has(viewerUserId)),
        viewerRole: shop.managers[0]?.role || (shop.owner.userId === viewerUserId ? 'owner' : null),
        canOpenWorkspace: Boolean(shop.managers[0]?.role || shop.owner.userId === viewerUserId),
        errandsEnabled: canViewErrandPublishing ? Boolean(shop.errandsEnabled) : undefined,
        availableErrandCount: canViewErrandPublishing ? availableErrandCount : undefined,
        viewerErranderRegistration,
        viewerErranderAvailability: Boolean(viewerErranderRegistration?.isAvailable)
      },
      listings: listings.map(toListingRecord),
      erranders: activeErranders.map(toPublicErranderRecord),
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
      where: { slug, status: 'ACTIVE' }
    })
    if (!shop) return null

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
    const vendorType = currentPayload.vendorType === 'student_kitchen' ? 'student_kitchen' : payload.type || currentPayload.vendorType || 'service'
    return this.readCampusVendorWorkspace(userId, (await prisma.marketplaceShop.update({
      where: { id: shop.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(payload.locationLabel !== undefined ? { locationLabel: payload.locationLabel || null } : {}),
        ...(payload.pickupSpots !== undefined && vendorType === 'student_kitchen' ? { pickupSpots: uniqueLabels(payload.pickupSpots).length ? uniqueLabels(payload.pickupSpots) : uniqueLabels([payload.locationLabel ?? shop.locationLabel]) } : {}),
        ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl || null } : {}),
        ...(payload.coverImageUrl !== undefined ? { coverImageUrl: payload.coverImageUrl || null } : {}),
        category: ['hotel', 'student_kitchen'].includes(vendorType) ? 'Food & hospitality' : vendorType === 'barber_shop' ? 'Beauty & grooming' : 'Campus services',
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
    const [assignment, owned] = await Promise.all([
      prisma.marketplaceShopManager.findUnique({ where: { shopId_userId: { shopId, userId } } }),
      prisma.marketplaceShop.count({ where: { id: shopId, owner: { userId } } })
    ])
    return Boolean(assignment || owned)
  }

  async updateShopErrands(userId: string, slug: string, enabled: boolean, acceptingErranders: boolean, requestedFreeCampusDelivery: boolean, deliveryFee: number) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const freeCampusDelivery = enabled ? false : Boolean(requestedFreeCampusDelivery)
    const errandFee = Math.max(0, Number(deliveryFee || 0))
    if (enabled && errandFee <= 0) throw new ApiError(409, 'Set a delivery price before enabling student erranders', 'ERRAND_FEE_REQUIRED')
    return toShopRecord(await prisma.marketplaceShop.update({
      where: { id: shop.id },
      data: {
        acceptingErranders,
        errandFee,
        errandsEnabled: freeCampusDelivery ? false : enabled,
        payload: jsonInput({ ...payloadObject(shop.payload), freeCampusDelivery })
      },
      include: { campus: true }
    }))
  }

  async registerVendorErrander(studentId: string, slug: string) {
    const [student, shop] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { id: studentId }, include: { campus: true } }),
      prisma.marketplaceShop.findFirst({ where: { slug, status: 'ACTIVE' }, include: { campus: true } })
    ])
    if (!student || !shop) return null
    if (shop.ownerId === studentId) throw new ApiError(409, 'You cannot register as an errander for your own page', 'OWN_VENDOR_ERRANDER')
    if (shop.campusId && shop.campusId !== student.campusId) throw new ApiError(403, 'This page only accepts erranders from its campus', 'ERRANDER_CAMPUS_RESTRICTED')
    const existing = await prisma.errandShopRegistration.findUnique({ where: { shopId_studentId: { shopId: shop.id, studentId } } })
    if (existing?.status === 'ACTIVE') return toErranderRegistrationRecord({ ...existing, shop, student })
    if (existing?.status === 'REMOVED') throw new ApiError(409, 'This business removed your errander registration', 'ERRANDER_REMOVED')
    if (existing?.status === 'FLAGGED') throw new ApiError(409, 'This business flagged your errander registration', 'ERRANDER_FLAGGED')
    if (!shop.acceptingErranders) throw new ApiError(409, 'This business is not accepting erranders right now', 'ERRANDER_REGISTRATION_CLOSED')
    const registration = await prisma.$transaction(async (tx) => {
      await tx.errandEnrollment.upsert({
        where: { studentId },
        update: { campusId: student.campusId },
        create: { studentId, campusId: student.campusId }
      })
      return tx.errandShopRegistration.create({
        data: { shopId: shop.id, studentId },
        include: { shop: { include: { campus: true } }, student: { include: { campus: true, errandEnrollment: true, user: true } } }
      })
    })
    return toErranderRegistrationRecord(registration)
  }

  async manageVendorErrander(userId: string, slug: string, studentId: string, action: 'REMOVE' | 'FLAG' | 'RESTORE', reason?: string) {
    const shop = await this.findOwnedCampusVendor(userId, slug, ['owner', 'admin'])
    if (!shop) return null
    const registration = await prisma.errandShopRegistration.findUnique({
      where: { shopId_studentId: { shopId: shop.id, studentId } },
      include: { student: { select: { userId: true } } }
    })
    if (!registration) return null
    const status = action === 'RESTORE' ? 'ACTIVE' : action === 'FLAG' ? 'FLAGGED' : 'REMOVED'
    const updated = await prisma.errandShopRegistration.update({
      where: { id: registration.id },
      data: {
        status,
        isAvailable: false,
        flagReason: action === 'FLAG' ? reason || 'Flagged by business' : null,
        reviewedAt: new Date(),
        reviewedByUserId: userId
      },
      include: {
        shop: { include: { campus: true } },
        student: { include: { campus: true, errandEnrollment: true, user: { select: { id: true, name: true, username: true } } } }
      }
    })
    await prisma.notification.create({ data: {
      userId: registration.student.userId,
      type: `ERRANDER_${status}`,
      title: action === 'RESTORE' ? `${shop.name} restored your errander access` : `${shop.name} updated your errander access`,
      body: action === 'FLAG' ? (reason || 'Your registration was flagged by the business.') : action === 'REMOVE' ? 'You will no longer receive new errands from this business.' : 'You can receive errands from this business when you are available.',
      data: jsonInput({ shopId: shop.id, slug: shop.slug, status, href: '/campus/profile?tab=errands' }),
      sentVia: ['IN_APP']
    } })
    return { registration: toErranderRegistrationRecord(updated), notificationUserId: registration.student.userId }
  }

  async updateErranderAvailability(studentId: string, registrationId: string, isAvailable: boolean) {
    const registration = await prisma.errandShopRegistration.findFirst({
      where: { id: registrationId, studentId, status: 'ACTIVE' }
    })
    if (!registration) return null
    return toErranderRegistrationRecord(await prisma.errandShopRegistration.update({
      where: { id: registration.id },
      data: { isAvailable },
      include: {
        shop: { include: { campus: true } },
        student: { include: { campus: true, errandEnrollment: true, user: { select: { id: true, name: true, username: true } } } }
      }
    }))
  }

  async readMyErrands(studentId: string) {
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, include: { campus: true } })
    if (!student) return null
    const [enrollment, registrations, available, assigned] = await Promise.all([
      prisma.errandEnrollment.findUnique({ where: { studentId } }),
      prisma.errandShopRegistration.findMany({
        where: { studentId },
        include: { shop: { include: { campus: true } } },
        orderBy: [{ status: 'asc' }, { joinedAt: 'desc' }]
      }),
      prisma.marketplaceErrand.findMany({
        where: {
          campusId: student.campusId,
          status: 'AVAILABLE',
          shop: {
            ownerId: { not: studentId },
            errandsEnabled: true,
            erranderRegistrations: { some: { studentId, status: 'ACTIVE', isAvailable: true } }
          },
          responses: { none: { erranderId: studentId } }
        },
        include: { order: true, shop: { include: { campus: true } }, assignedErrander: { include: { user: true } } },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.marketplaceErrand.findMany({
        where: {
          assignedErranderId: studentId,
          status: { in: ['ASSIGNED', 'PICKED_UP', 'DELIVERED'] },
          order: { fulfillmentStatus: { notIn: ['completed', 'cancelled', 'cannot_fulfil'] } }
        },
        include: { order: true, shop: { include: { campus: true } }, assignedErrander: { include: { user: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    ])
    return {
      enrollment: enrollment ? { ...enrollment, campus: student.campus.name } : null,
      registrations: registrations.map(toErranderRegistrationRecord),
      available: available.map(toErrandRecord),
      assigned: assigned.map(toErrandRecord)
    }
  }

  async respondToErrand(studentId: string, errandId: string, decision: 'ACCEPTED' | 'IGNORED') {
    return prisma.$transaction(async (tx) => {
      const enrollment = await tx.errandEnrollment.findUnique({ where: { studentId } })
      if (!enrollment) throw new ApiError(403, 'Register as an errander first', 'ERRANDER_REGISTRATION_REQUIRED')
      const errand = await tx.marketplaceErrand.findUnique({
        where: { id: errandId },
        include: { order: true, shop: { include: { campus: true, owner: { include: { user: true } } } }, assignedErrander: { include: { user: true } } }
      })
      if (!errand || errand.campusId !== enrollment.campusId || errand.shop.ownerId === studentId) return null
      const registration = await tx.errandShopRegistration.findUnique({ where: { shopId_studentId: { shopId: errand.shopId, studentId } } })
      if (registration?.status !== 'ACTIVE') throw new ApiError(403, 'You are not an active errander for this business', 'ERRANDER_REGISTRATION_REQUIRED')
      if (decision === 'ACCEPTED' && !registration.isAvailable) throw new ApiError(409, `Turn on availability for ${errand.shop.name} before accepting this errand`, 'ERRANDER_UNAVAILABLE')
      if (decision === 'IGNORED') {
        await tx.errandResponse.upsert({
          where: { errandId_erranderId: { errandId, erranderId: studentId } },
          update: { decision },
          create: { errandId, erranderId: studentId, decision }
        })
        return { errand: toErrandRecord(errand), ignored: true, notificationUserIds: [] }
      }
      const claimed = await tx.marketplaceErrand.updateMany({
        where: { id: errandId, status: 'AVAILABLE', assignedErranderId: null, shop: { errandsEnabled: true } },
        data: { status: 'ASSIGNED', assignedErranderId: studentId, acceptedAt: new Date() }
      })
      if (claimed.count !== 1) throw new ApiError(409, 'Another errander accepted this delivery first', 'ERRAND_ALREADY_ASSIGNED')
      await tx.errandResponse.upsert({
        where: { errandId_erranderId: { errandId, erranderId: studentId } },
        update: { decision },
        create: { errandId, erranderId: studentId, decision }
      })
      if (Number(errand.feeAmount || 0) > 0) {
        await reserveStudentPending(tx, studentId, errand.feeAmount, {
          currency: errand.currency,
          description: `Errand payment reserved for order ${errand.orderId}`,
          metadata: { errandId: errand.id, orderId: errand.orderId, shopId: errand.shopId, balanceKind: 'pending' }
        })
      }
      const updated = await tx.marketplaceErrand.findUniqueOrThrow({
        where: { id: errandId },
        include: { order: true, shop: { include: { campus: true } }, assignedErrander: { include: { user: true } } }
      })
      const stakeholderUserIds = [...new Set([errand.shop.owner.userId, payloadObject(errand.order.payload).buyerUserId].filter(Boolean))] as string[]
      await Promise.all(stakeholderUserIds.map((userId) => tx.notification.create({ data: {
        userId,
        type: 'ERRAND_ASSIGNED',
        title: `${updated.assignedErrander?.firstName || 'An errander'} accepted the delivery`,
        body: `${updated.assignedErrander?.firstName || 'Your errander'} is collecting order #${updated.orderId.slice(-8).toUpperCase()}.`,
        data: jsonInput({ errandId: updated.id, orderId: updated.orderId, shopId: updated.shopId, href: '/campus/profile?tab=errands' }),
        sentVia: ['IN_APP']
      } })))
      const availablePeers = await tx.errandShopRegistration.findMany({
        where: { shopId: errand.shopId, status: 'ACTIVE', isAvailable: true, studentId: { not: studentId } },
        select: { student: { select: { userId: true } } }
      })
      const notificationUserIds = [...new Set([...stakeholderUserIds, ...availablePeers.map((peer) => peer.student.userId)])]
      return { errand: toErrandRecord(updated), ignored: false, notificationUserIds }
    })
  }

  async progressErrand(studentId: string, errandId: string, nextStatus: 'PICKED_UP' | 'DELIVERED', confirmationCode?: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.marketplaceErrand.findFirst({
        where: { id: errandId, assignedErranderId: studentId },
        include: {
          order: true,
          shop: { include: { campus: true, owner: { include: { user: true } } } },
          assignedErrander: { include: { user: true } }
        }
      })
      if (!current) return null
      const expected = current.status === 'ASSIGNED' ? 'PICKED_UP' : current.status === 'PICKED_UP' ? 'DELIVERED' : null
      const isPickupMessageRetry = current.status === 'PICKED_UP' && nextStatus === 'PICKED_UP'
      const isDeliverySettlementRetry = current.status === 'DELIVERED' && nextStatus === 'DELIVERED' && !current.order.escrowReleasedAt
      if (expected !== nextStatus && !isPickupMessageRetry && !isDeliverySettlementRetry) throw new ApiError(409, 'Errand checkpoints must be completed in order', 'INVALID_ERRAND_STATUS')
      if (nextStatus === 'PICKED_UP' && !['ready', 'in_transit'].includes(current.order.fulfillmentStatus)) {
        throw new ApiError(409, 'The vendor must mark this order ready before it can be collected', 'ORDER_NOT_READY_FOR_COLLECTION')
      }
      if (nextStatus === 'DELIVERED') {
        if (!current.order.studentId || !verifyDeliveryCode(confirmationCode || '', current.orderId, current.order.studentId, env.JWT_SECRET)) {
          throw new ApiError(409, 'The delivery code is incorrect. Ask the buyer to check the code shown on their order.', 'INVALID_DELIVERY_CODE')
        }
      }
      const stakeholderUserIds = [...new Set([current.shop.owner.userId, payloadObject(current.order.payload).buyerUserId].filter(Boolean))] as string[]
      if (isPickupMessageRetry) {
        return {
          errand: toErrandRecord(current),
          notificationUserIds: [],
          orderReadyToComplete: false,
          buyerStudentId: current.order.studentId,
          orderId: current.orderId
        }
      }
      if (isDeliverySettlementRetry) {
        const unfinishedErrands = await tx.marketplaceErrand.count({
          where: { orderId: current.orderId, status: { notIn: ['DELIVERED', 'CANCELLED'] } }
        })
        return {
          errand: toErrandRecord(current),
          notificationUserIds: stakeholderUserIds,
          orderReadyToComplete: unfinishedErrands === 0,
          buyerStudentId: current.order.studentId,
          orderId: current.orderId
        }
      }
      const now = new Date()
      const updated = await tx.marketplaceErrand.update({
        where: { id: current.id },
        data: nextStatus === 'PICKED_UP' ? { status: nextStatus, pickedUpAt: now } : { status: nextStatus, deliveredAt: now }
      })
      if (nextStatus === 'PICKED_UP') {
        await tx.marketplaceOrder.update({
          where: { id: current.orderId },
          data: {
            fulfillmentStatus: 'in_transit',
            payload: jsonInput({ ...payloadObject(current.order.payload), fulfillmentStatus: 'in_transit' })
          }
        })
      }
      let orderReadyToComplete = false
      if (nextStatus === 'DELIVERED') {
        await tx.errandEnrollment.update({ where: { studentId }, data: { completedCount: { increment: 1 } } })
        const unfinishedErrands = await tx.marketplaceErrand.count({
          where: { orderId: current.orderId, id: { not: current.id }, status: { notIn: ['DELIVERED', 'CANCELLED'] } }
        })
        if (unfinishedErrands === 0) {
          orderReadyToComplete = true
          const autoReleaseAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          await tx.marketplaceOrder.update({
            where: { id: current.orderId },
            data: {
              fulfillmentStatus: 'delivered',
              deliveredAt: now,
              autoReleaseAt,
              payload: jsonInput({ ...payloadObject(current.order.payload), fulfillmentStatus: 'delivered' })
            }
          })
        }
      }
      await Promise.all(stakeholderUserIds.map((userId) => tx.notification.create({ data: {
        userId,
        type: `ERRAND_${nextStatus}`,
        title: nextStatus === 'PICKED_UP' ? 'Your order has been collected' : 'Delivery confirmed',
        body: nextStatus === 'PICKED_UP' ? `${current.shop.name}'s order is on the way.` : `Order #${current.orderId.slice(-8).toUpperCase()} was confirmed with the buyer's delivery code.`,
        data: jsonInput({ errandId: current.id, orderId: current.orderId, href: '/campus/profile?tab=errands' }),
        sentVia: ['IN_APP']
      } })))
      return {
        errand: toErrandRecord({ ...current, ...updated }),
        notificationUserIds: stakeholderUserIds,
        orderReadyToComplete,
        buyerStudentId: current.order.studentId,
        orderId: current.orderId
      }
    })
  }

  async readBuyerDeliveryCode(orderId: string, studentId: string) {
    const order = await prisma.marketplaceOrder.findFirst({
      where: { id: orderId, studentId },
      include: { errands: { select: { id: true, status: true } } }
    })
    if (!order || !order.errands.length) return null
    if (order.fulfillmentStatus !== 'in_transit' || !order.errands.some((errand) => errand.status === 'PICKED_UP')) {
      throw new ApiError(409, 'Your delivery code becomes available after the errander collects the order', 'DELIVERY_CODE_NOT_READY')
    }
    return {
      orderId: order.id,
      code: deliveryCode(order.id, studentId, env.JWT_SECRET),
      expiresWhen: 'delivery_confirmed'
    }
  }

  async markOrderReadyForCollection(orderId: string, shopId?: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.marketplaceOrder.findUnique({ where: { id: orderId } })
      if (!current) return null
      const claimed = await tx.marketplaceOrder.updateMany({
        where: { id: orderId, fulfillmentStatus: 'packaging' },
        data: {
          fulfillmentStatus: 'ready',
          payload: jsonInput({ ...payloadObject(current.payload), fulfillmentStatus: 'ready' })
        }
      })
      if (claimed.count !== 1) return null

      const errands = await tx.marketplaceErrand.findMany({
        where: {
          orderId,
          status: 'ASSIGNED',
          assignedErranderId: { not: null },
          ...(shopId ? { shopId } : {})
        },
        include: {
          shop: { select: { name: true } },
          assignedErrander: { select: { userId: true } }
        }
      })
      const notifications = await Promise.all(errands.map((errand) => tx.notification.create({
        data: {
          userId: errand.assignedErrander!.userId,
          type: 'ERRAND_READY_FOR_COLLECTION',
          title: 'Order ready for collection',
          body: `${errand.shop.name} has marked order #${orderId.slice(-8).toUpperCase()} ready. You can collect it now.`,
          data: jsonInput({
            kind: 'ERRAND_READY_FOR_COLLECTION',
            errandId: errand.id,
            orderId,
            shopId: errand.shopId,
            href: '/campus/profile?tab=errands',
            deepLink: '/campus/profile?tab=errands'
          }),
          sentVia: ['IN_APP']
        }
      })))
      const order = await tx.marketplaceOrder.findUniqueOrThrow({ where: { id: orderId } })
      return {
        order: toOrderRecord(order),
        notifications,
        notificationUserIds: [...new Set(notifications.map((notification) => notification.userId))]
      }
    })
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
    const orders = records.map(toOrderRecord)
    const sellerIds = [...new Set(orders.flatMap((order) => order.items.map((item: Record<string, any>) => item.sellerId).filter(Boolean)))] as string[]
    const shopIds = [...new Set(orders.flatMap((order) => order.items.map((item: Record<string, any>) => item.shopId).filter(Boolean)))] as string[]
    const orderIds = orders.map((order) => order.id)
    const [sellers, shops, errands] = await Promise.all([
      sellerIds.length ? prisma.studentProfile.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, userId: true, firstName: true, lastName: true, avatarUrl: true, user: { select: { name: true } } }
      }) : [],
      shopIds.length ? prisma.marketplaceShop.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true, slug: true } }) : [],
      orderIds.length ? prisma.marketplaceErrand.findMany({
        where: { orderId: { in: orderIds }, assignedErranderId: { not: null }, status: { not: 'CANCELLED' } },
        include: { assignedErrander: { include: { user: true } } },
        orderBy: { updatedAt: 'desc' }
      }) : []
    ])
    const sellerById = new Map(sellers.map((seller) => [seller.id, seller]))
    const shopById = new Map(shops.map((shop) => [shop.id, shop]))
    const errandByOrderId = new Map(errands.map((errand) => [errand.orderId, errand]))
    const enriched = orders.map((order) => {
      const firstItem = order.items[0] || {}
      const seller = sellerById.get(firstItem.sellerId)
      const shop = shopById.get(firstItem.shopId)
      const errand = errandByOrderId.get(order.id)
      return {
        ...order,
        sellerContact: seller ? {
          studentId: seller.id,
          userId: seller.userId,
          name: `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.user?.name || shop?.name || 'Seller',
          avatarUrl: seller.avatarUrl,
          shopSlug: shop?.slug || null,
          shopName: shop?.name || null,
          shopId: shop?.id || null,
        } : null,
        assignedErrander: errand?.assignedErrander ? {
          studentId: errand.assignedErrander.id,
          userId: errand.assignedErrander.userId,
          name: `${errand.assignedErrander.firstName || ''} ${errand.assignedErrander.lastName || ''}`.trim() || errand.assignedErrander.user?.name || 'Assigned errander',
          avatarUrl: errand.assignedErrander.avatarUrl,
        } : null,
      }
    })
    return pageEnvelope(enriched, query)
  }

  async listSellerOrders(studentId: string, shopId?: string) {
    const listings = await prisma.marketplaceListing.findMany({
      where: { sellerId: studentId, ...(shopId ? { shopId } : {}) },
      select: { id: true }
    })
    const owned = new Set(listings.map((listing) => listing.id))
    const records = await prisma.marketplaceOrder.findMany({ orderBy: { createdAt: 'desc' } })
    return records.map(toOrderRecord).flatMap((order) => {
      const visibleItems = order.items.filter((item: Record<string, any>) => (
        owned.has(item.listingId) || (!shopId && item.sellerId === studentId)
      ))
      return visibleItems.length ? [toSellerOrderRecord(order, visibleItems)] : []
    })
  }

  async findSellerOrder(id: string, studentId: string): Promise<Record<string, any> | null> {
    const order = await this.findOrder(id)
    if (!order) return null
    const listingIds = order.items.map((item: Record<string, any>) => item.listingId).filter(Boolean)
    const ownedListings = await prisma.marketplaceListing.findMany({
      where: { id: { in: listingIds }, sellerId: studentId },
      select: { id: true }
    })
    const owned = new Set(ownedListings.map((listing) => listing.id))
    const visibleItems = order.items.filter((item: Record<string, any>) => item.sellerId === studentId || owned.has(item.listingId))
    return visibleItems.length ? toSellerOrderRecord(order, visibleItems) : null
  }

  async findShopSellerOrder(id: string, shopId: string): Promise<Record<string, any> | null> {
    const order = await this.findOrder(id)
    if (!order) return null
    const listingIds = order.items.map((item: Record<string, any>) => item.listingId).filter(Boolean)
    const shopListings = await prisma.marketplaceListing.findMany({
      where: { id: { in: listingIds }, shopId },
      select: { id: true }
    })
    const owned = new Set(shopListings.map((listing) => listing.id))
    const visibleItems = order.items.filter((item: Record<string, any>) => owned.has(item.listingId))
    return visibleItems.length ? toSellerOrderRecord(order, visibleItems) : null
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
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const financialVersion = Number(payloadObject(order.payload).financialVersion || 1)
      let allocation
      try {
        allocation = calculateOrderMoney(items, order.currency)
      } catch (error) {
        throw new ApiError(409, error instanceof Error ? error.message : 'Order settlement is invalid', 'ORDER_SETTLEMENT_INVALID')
      }
      if (financialVersion >= 2 && toMinorUnits(allocation.totalAmount, order.currency) !== toMinorUnits(order.totalAmount, order.currency)) {
        throw new ApiError(409, 'Order total does not match its settlement allocation', 'ORDER_SETTLEMENT_MISMATCH', {
          orderId: order.id,
          orderTotal: order.totalAmount,
          allocatedTotal: allocation.totalAmount
        })
      }
      const errands = allocation.errands.length
        ? await tx.marketplaceErrand.findMany({ where: { orderId: order.id } })
        : []
      for (const expected of allocation.errands) {
        const errand = errands.find((candidate) => candidate.shopId === expected.id)
        if (!errand || errand.status !== 'DELIVERED' || !errand.assignedErranderId || toMinorUnits(errand.feeAmount, order.currency) !== toMinorUnits(expected.amount, order.currency)) {
          throw new ApiError(409, 'Every paid errand must be delivered before order settlement', 'ERRAND_NOT_READY_FOR_SETTLEMENT', { orderId: order.id, shopId: expected.id })
        }
      }
      const now = new Date()
      const claimed = await tx.marketplaceOrder.updateMany({
        where: { id, studentId, fulfillmentStatus: 'delivered', escrowReleasedAt: null },
        data: { escrowReleasedAt: now, buyerConfirmedAt: automatic ? null : now }
      })
      if (claimed.count !== 1) return null
      const merchandiseBySeller = new Map<string, number>()
      for (const item of items) merchandiseBySeller.set(item.sellerId, (merchandiseBySeller.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const seller of allocation.sellers) {
        if (!seller.id || seller.amount <= 0) continue
        const pendingAmount = financialVersion >= 2 ? seller.amount : Number(merchandiseBySeller.get(seller.id) || 0)
        await creditStudentWallet(tx, seller.id, seller.amount, {
          type: 'ESCROW_RELEASE',
          currency: order.currency,
          releasePendingAmount: pendingAmount,
          description: `Marketplace escrow release for order ${order.id}`,
          metadata: { orderId: order.id, automatic, role: 'seller', balanceKind: 'available' }
        })
      }
      for (const expected of allocation.errands) {
        const errand = errands.find((candidate) => candidate.shopId === expected.id)!
        let releasePendingAmount = expected.amount
        if (financialVersion < 2) {
          const wallet = await tx.wallet.findUnique({ where: { studentId_type: { studentId: errand.assignedErranderId!, type: 'MAIN' } } })
          const legacyReservation = wallet ? await tx.transaction.findFirst({
            where: {
              walletId: wallet.id,
              type: 'ESCROW_HOLD',
              metadata: { path: ['errandId'], equals: errand.id }
            }
          }) : null
          releasePendingAmount = legacyReservation ? expected.amount : 0
        }
        await creditStudentWallet(tx, errand.assignedErranderId!, expected.amount, {
          type: 'ESCROW_RELEASE',
          currency: order.currency,
          releasePendingAmount,
          description: `Errand payment for order ${order.id}`,
          metadata: { orderId: order.id, errandId: errand.id, shopId: errand.shopId, automatic, role: 'errander', balanceKind: 'available' }
        })
      }
      if (allocation.platformDeliveryAmount > 0) {
        await tx.transaction.create({ data: {
          type: 'PLATFORM_FEE',
          status: 'COMPLETED',
          amount: allocation.platformDeliveryAmount,
          netAmount: allocation.platformDeliveryAmount,
          currency: order.currency,
          description: `Zumbarl delivery fee for order ${order.id}`,
          processedAt: now,
          metadata: jsonInput({ orderId: order.id, role: 'platform_delivery' })
        } })
      }
      const updated = await tx.marketplaceOrder.update({
        where: { id: order.id },
        data: {
          status: 'completed',
          fulfillmentStatus: 'completed',
          payload: jsonInput({ ...payloadObject(order.payload), fulfillmentStatus: 'completed' })
        }
      })
      return toOrderRecord(updated)
    })
  }

  async cancelBuyerOrder(id: string, studentId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findFirst({ where: { id, studentId } })
      if (!order || !['seller_confirmation', 'confirmed'].includes(order.fulfillmentStatus)) return null
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const financialVersion = Number(payloadObject(order.payload).financialVersion || 1)
      const allocation = calculateOrderMoney(items, order.currency)
      const merchandiseBySeller = new Map<string, number>()
      for (const item of items) merchandiseBySeller.set(item.sellerId, (merchandiseBySeller.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const seller of allocation.sellers) {
        const pendingAmount = financialVersion >= 2 ? seller.amount : Number(merchandiseBySeller.get(seller.id) || 0)
        if (seller.id && pendingAmount > 0) await removeStudentPending(tx, seller.id, pendingAmount, {
          currency: order.currency,
          description: `Marketplace escrow cancelled for order ${order.id}`,
          metadata: { orderId: order.id, cancelledBy: 'buyer', role: 'seller', balanceKind: 'pending' }
        })
      }
      if (financialVersion >= 2) {
        const assignedErrands = await tx.marketplaceErrand.findMany({ where: { orderId: order.id, assignedErranderId: { not: null }, status: { in: ['ASSIGNED', 'PICKED_UP'] } } })
        for (const errand of assignedErrands) if (Number(errand.feeAmount) > 0) await removeStudentPending(tx, errand.assignedErranderId!, errand.feeAmount, {
          currency: order.currency,
          description: `Errand escrow cancelled for order ${order.id}`,
          metadata: { orderId: order.id, errandId: errand.id, cancelledBy: 'buyer', role: 'errander', balanceKind: 'pending' }
        })
      }
      await refundStudentWallet(tx, studentId, order.totalAmount, {
        currency: order.currency,
        description: `Marketplace refund for order ${order.id}`,
        metadata: { orderId: order.id, cancelledBy: 'buyer', balanceKind: 'available' }
      })
      if (payloadObject(order.payload).inventoryReserved === true) await restoreOrderInventory(tx, items)
      await tx.marketplaceErrand.updateMany({ where: { orderId: order.id, status: { in: ['AVAILABLE', 'ASSIGNED'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } })
      const updated = await tx.marketplaceOrder.update({ where: { id: order.id }, data: { status: 'refunded', fulfillmentStatus: 'cancelled', cancelledAt: new Date() } })
      return toOrderRecord(updated)
    })
  }

  async cancelSellerOrder(id: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findUnique({ where: { id } })
      if (!order || !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) return null
      const items = Array.isArray(order.items) ? order.items as Record<string, any>[] : []
      const financialVersion = Number(payloadObject(order.payload).financialVersion || 1)
      const allocation = calculateOrderMoney(items, order.currency)
      const merchandiseBySeller = new Map<string, number>()
      for (const item of items) merchandiseBySeller.set(item.sellerId, (merchandiseBySeller.get(item.sellerId) || 0) + Number(item.unitAmount || 0) * Number(item.quantity || 0))
      for (const seller of allocation.sellers) {
        const pendingAmount = financialVersion >= 2 ? seller.amount : Number(merchandiseBySeller.get(seller.id) || 0)
        if (seller.id && pendingAmount > 0) await removeStudentPending(tx, seller.id, pendingAmount, {
          currency: order.currency,
          description: `Marketplace escrow cancelled for order ${order.id}`,
          metadata: { orderId: order.id, cancelledBy: 'seller', role: 'seller', balanceKind: 'pending' }
        })
      }
      if (financialVersion >= 2) {
        const assignedErrands = await tx.marketplaceErrand.findMany({ where: { orderId: order.id, assignedErranderId: { not: null }, status: { in: ['ASSIGNED', 'PICKED_UP'] } } })
        for (const errand of assignedErrands) if (Number(errand.feeAmount) > 0) await removeStudentPending(tx, errand.assignedErranderId!, errand.feeAmount, {
          currency: order.currency,
          description: `Errand escrow cancelled for order ${order.id}`,
          metadata: { orderId: order.id, errandId: errand.id, cancelledBy: 'seller', role: 'errander', balanceKind: 'pending' }
        })
      }
      if (order.studentId) await refundStudentWallet(tx, order.studentId, order.totalAmount, {
        currency: order.currency,
        description: `Marketplace refund for order ${order.id}`,
        metadata: { orderId: order.id, cancelledBy: 'seller', balanceKind: 'available' }
      })
      if (payloadObject(order.payload).inventoryReserved === true) await restoreOrderInventory(tx, items)
      await tx.marketplaceErrand.updateMany({ where: { orderId: order.id, status: { in: ['AVAILABLE', 'ASSIGNED'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } })
      const updated = await tx.marketplaceOrder.update({ where: { id }, data: { status: 'refunded', fulfillmentStatus: 'cancelled', cancelledAt: new Date() } })
      if (order.studentId) {
        const buyer = await tx.studentProfile.findUnique({ where: { id: order.studentId }, select: { userId: true } })
        if (buyer) await tx.notification.create({ data: { userId: buyer.userId, type: 'marketplace_order_cancelled', title: 'Order cancelled by seller', body: 'The seller could not fulfil your order. Your full payment has been returned to your wallet.', data: jsonInput({ orderId: order.id }), sentVia: ['IN_APP'] } })
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

  createOrderDispute(orderId: string, studentId: string, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.marketplaceOrder.findFirst({ where: { id: orderId, studentId, fulfillmentStatus: 'delivered', escrowReleasedAt: null } })
      if (!order) return null
      const claimed = await tx.marketplaceOrder.updateMany({
        where: { id: orderId, studentId, fulfillmentStatus: 'delivered', escrowReleasedAt: null },
        data: { status: 'disputed', fulfillmentStatus: 'disputed', autoReleaseAt: null }
      })
      if (claimed.count !== 1) return null
      return createPrismaRecordRepositoryWithClient(tx, 'moderationCases').create({
        ...payload,
        scope: 'marketplace-order',
        scopeId: orderId,
        buyerStudentId: studentId,
        previousFulfillmentStatus: order.fulfillmentStatus,
        amount: Number(order.totalAmount),
        currency: order.currency,
        status: 'open'
      })
    })
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
        const listings = await tx.marketplaceListing.findMany({ where: { id: { in: listingIds } }, include: { shop: true } })
        const listingMap = new Map(listings.map((listing) => [listing.id, listing]))
        const errandShopIds = [...new Set(listings.filter((listing) => listing.shop?.errandsEnabled).map((listing) => listing.shopId).filter(Boolean))] as string[]
        const registrations = errandShopIds.length ? await tx.errandShopRegistration.findMany({
          where: {
            shopId: { in: errandShopIds },
            status: 'ACTIVE',
            isAvailable: true,
            ...(studentId ? { studentId: { not: studentId } } : {}),
          },
          select: { shopId: true, studentId: true }
        }) : []
        const shopOwners = new Map(listings.map((listing) => [listing.shopId, listing.shop?.ownerId]))
        const availableCountByShop = new Map<string, number>()
        registrations
          .filter((registration) => registration.studentId !== shopOwners.get(registration.shopId))
          .forEach((registration) => availableCountByShop.set(registration.shopId, (availableCountByShop.get(registration.shopId) || 0) + 1))
        const hydratedItems = currentItems.map((item) => {
          const listing = listingMap.get(item.listingId)
          const shopPayload = payloadObject(listing?.shop?.payload)
          const vendorType = String(shopPayload.vendorType || '')
          const pickupSpots = studentKitchenPickupSpots(listing?.shop)
          const deliveryOptions = listing ? canonicalDeliveryOptions(listing) : item.deliveryOptions || []
          const quantity = Math.max(1, Math.trunc(Number(item.quantity || 1)))
          const isUnavailable = Boolean(listing && (
            listing.status !== 'ACTIVE'
            || listing.stockCount < quantity
            || payloadObject(listing.payload).availableToday === false
          ))
          const availableErranderCount = listing?.shopId ? availableCountByShop.get(listing.shopId) || 0 : 0
          const errandFee = Number(listing?.shop?.errandFee || 0)
          let fulfilment = item.fulfilment
          if (item.fulfilment?.method === 'free_campus_delivery' && shopPayload.freeCampusDelivery !== true) {
            fulfilment = { method: 'unquoted', location: 'Choose a delivery method', fee: 0, quoted: false, selectionExpired: true }
          } else if (item.fulfilment?.method === 'pickup' && (
            !deliveryOptions.includes('Campus pickup')
            || (vendorType === 'student_kitchen' && !pickupSpots.includes(String(item.fulfilment.location || '').trim()))
          )) {
            fulfilment = { method: 'unquoted', location: vendorType === 'student_kitchen' ? 'Choose a pickup location' : 'Choose a delivery method', fee: 0, quoted: false, selectionExpired: true }
          } else if (item.fulfilment?.method === 'errand_delivery') {
            fulfilment = listing?.shop?.errandsEnabled && availableErranderCount > 0 && errandFee > 0
              ? { method: 'errand_delivery', location: item.fulfilment.location, fee: errandFee, quoted: true }
              : { method: 'unquoted', location: 'Campus errand delivery is unavailable', fee: 0, quoted: false, selectionExpired: true }
          }
          return listing ? {
            ...item,
            title: item.title || listing.title,
            description: item.description || listing.description,
            image: item.image || listing.images[0] || null,
            shopId: listing.shopId,
            shopName: listing.shop?.name || item.shopName,
            vendorType,
            errandsEnabled: Boolean(listing.shop?.errandsEnabled),
            errandFee,
            freeCampusDelivery: shopPayload.freeCampusDelivery === true,
            pickupSpots,
            availableErranderCount,
            deliveryOptions,
            deliveryZones: item.deliveryZones || payloadObject(listing.payload).deliveryZones || [],
            kind: item.kind || (String(listing.listingType).toLowerCase() === 'service' ? 'service' : 'product'),
            serviceMode: item.serviceMode || payloadObject(listing.payload).serviceMode,
            stock: listing.stockCount,
            fulfilment,
            unavailable: isUnavailable,
            availabilityMessage: listing.stockCount < 1 ? 'Out of stock' : listing.stockCount < quantity ? `Only ${listing.stockCount} left` : isUnavailable ? 'Currently unavailable' : null,
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
      const requestedQuantity = Math.max(1, Math.trunc(Number(payload.quantity || 1)))
      if (listing.status !== 'ACTIVE' || payloadObject(listing.payload).availableToday === false) {
        throw new ApiError(409, `${listing.title} is currently unavailable`, 'LISTING_UNAVAILABLE')
      }
      if (listing.stockCount < requestedQuantity) {
        const message = listing.stockCount < 1 ? `${listing.title} is out of stock` : `Only ${listing.stockCount} of ${listing.title} ${listing.stockCount === 1 ? 'is' : 'are'} left`
        throw new ApiError(409, message, 'INSUFFICIENT_STOCK', { available: listing.stockCount, requested: requestedQuantity })
      }
      const shopPayload = payloadObject(listing.shop?.payload)
      if (shopPayload.entityType === 'campus_vendor' && ['hotel', 'student_kitchen'].includes(String(shopPayload.vendorType))) {
        const buyer = studentId
          ? await tx.studentProfile.findUnique({ where: { id: studentId }, select: { campusId: true } })
          : null
        if (!buyer || !listing.campusId || buyer.campusId !== listing.campusId) {
          throw new ApiError(403, `${listing.shop?.name || 'This food vendor'} only accepts orders from students on its campus`, 'CAMPUS_ORDER_RESTRICTED')
        }
      }
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
      const currentItem = currentItems.find((item) => item.listingId === payload.listingId)
      const deliveryZones = Array.isArray(payloadObject(listing.payload).deliveryZones) ? payloadObject(listing.payload).deliveryZones : []
      const deliveryOptions = canonicalDeliveryOptions(listing)
      const vendorType = String(shopPayload.vendorType || '')
      const pickupSpots = studentKitchenPickupSpots(listing.shop)
      const fulfilment = deliveryOptions.includes('Campus pickup') && vendorType !== 'student_kitchen'
        ? { method: 'pickup', location: listing.locationLabel || 'Campus pickup', fee: 0, quoted: true }
        : deliveryOptions.includes('Digital delivery')
          ? { method: 'digital', location: 'Digital delivery', fee: 0, quoted: true }
          : { method: 'unquoted', location: vendorType === 'student_kitchen' ? 'Choose a pickup location' : 'Choose a delivery method', fee: 0, quoted: false }
      const existingPickupIsValid = currentItem?.fulfilment?.method !== 'pickup' || (
        deliveryOptions.includes('Campus pickup')
        && (vendorType !== 'student_kitchen' || pickupSpots.includes(String(currentItem.fulfilment.location || '').trim()))
      )
      const items = [
        ...currentItems.filter((item) => item.listingId !== payload.listingId),
        {
          ...currentItem,
          ...payload,
          shopId: listing.shopId,
          shopName: listing.shop?.name || 'Campus shop',
          vendorType,
          errandsEnabled: Boolean(listing.shop?.errandsEnabled),
          freeCampusDelivery: shopPayload.freeCampusDelivery === true,
          pickupSpots,
          quantity: requestedQuantity,
          title: listing.title,
          sellerId: listing.sellerId,
          description: listing.description,
          image: listing.images[0] || null,
          deliveryOptions,
          deliveryZones,
          kind: String(listing.listingType).toLowerCase() === 'service' ? 'service' : 'product',
          serviceMode: payloadObject(listing.payload).serviceMode,
          latitude: payloadObject(listing.payload).latitude,
          longitude: payloadObject(listing.payload).longitude,
          locationLabel: listing.locationLabel,
          fulfilment: existingPickupIsValid ? currentItem?.fulfilment || fulfilment : fulfilment,
          stock: listing.stockCount,
          unavailable: false,
          availabilityMessage: null,
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
    let normalizedFulfilment = fulfilment
    if (fulfilment.method === 'pickup') {
      const location = String(fulfilment.location || '').trim()
      if (target.vendorType === 'student_kitchen' && !(target.pickupSpots || []).includes(location)) {
        throw new ApiError(409, 'Choose one of this student kitchen\'s listed pickup locations', 'PICKUP_LOCATION_UNAVAILABLE')
      }
      normalizedFulfilment = { method: 'pickup', location, fee: 0, quoted: true }
    }
    if (fulfilment.method === 'free_campus_delivery') {
      if (!target.freeCampusDelivery) {
        throw new ApiError(409, 'This business is not offering free in-campus delivery', 'FREE_DELIVERY_UNAVAILABLE')
      }
      normalizedFulfilment = {
        method: 'free_campus_delivery',
        location: String(fulfilment.location).trim(),
        fee: 0,
        quoted: true,
      }
    }
    if (fulfilment.method === 'errand_delivery') {
      if (!target.shopId) {
        throw new ApiError(409, 'Campus errand delivery is unavailable for this item', 'ERRANDS_UNAVAILABLE')
      }
      const shop = await prisma.marketplaceShop.findUnique({
        where: { id: target.shopId },
        select: {
          errandFee: true,
          errandsEnabled: true,
          ownerId: true,
          erranderRegistrations: {
            where: { status: 'ACTIVE', isAvailable: true, ...(studentId ? { studentId: { not: studentId } } : {}) },
            select: { studentId: true }
          }
        }
      })
      const availableErranderCount = shop?.erranderRegistrations.filter((registration) => registration.studentId !== shop.ownerId).length || 0
      if (!shop?.errandsEnabled || Number(shop.errandFee || 0) <= 0) throw new ApiError(409, 'This business is not offering campus errand delivery', 'ERRANDS_UNAVAILABLE')
      if (!availableErranderCount) throw new ApiError(409, 'No erranders for this business are available right now', 'ERRANDER_UNAVAILABLE')
      normalizedFulfilment = {
        method: 'errand_delivery',
        location: String(fulfilment.location).trim(),
        fee: Number(shop.errandFee),
        quoted: true,
      }
    }
    const valid = fulfilment.method === 'unquoted'
      || (fulfilment.method === 'zumbarl_delivery' && fulfilment.quoted === true && Number(fulfilment.fee) >= 0)
      || fulfilment.method === 'errand_delivery'
      || fulfilment.method === 'free_campus_delivery'
      || (fulfilment.method === 'pickup' && (target.deliveryOptions || []).includes('Campus pickup') && Number(normalizedFulfilment.fee) === 0)
      || (fulfilment.method === 'digital' && (target.deliveryOptions || []).includes('Digital delivery') && Number(fulfilment.fee) === 0)
      || (fulfilment.method === 'seller_delivery' && (target.deliveryZones || []).some((zone: Record<string, any>) => zone.location === fulfilment.location && Number(zone.fee) === Number(fulfilment.fee)))
    if (!valid) return null
    const items = currentItems.map((item) => item.listingId === listingId ? { ...item, fulfilment: normalizedFulfilment } : item)
    return toCartRecord(await prisma.marketplaceCart.update({ where: { id: cart.id }, data: { items: jsonInput(items) } }))
  }

  createOrderFromCart(studentId: string | undefined, payload: Record<string, any>) {
    return prisma.$transaction(async (tx) => {
      const errandNotificationUserIds = new Set<string>()
      const cart = await tx.marketplaceCart.findUnique({ where: { id: payload.cartId } })
      if (!cart || cart.status !== 'open' || cart.studentId !== (studentId ?? null)) return null
      const items = Array.isArray(cart.items) ? cart.items as Record<string, any>[] : []
      if (!items.length || items.some((item) => !item.fulfilment?.quoted)) return null
      const listingIds = items.map((item) => item.listingId).filter(Boolean)
      const orderListings = await tx.marketplaceListing.findMany({ where: { id: { in: listingIds } }, include: { shop: true } })
      const listingMap = new Map(orderListings.map((listing) => [listing.id, listing]))
      const requestedQuantities = orderItemQuantities(items)
      for (const [listingId, quantity] of requestedQuantities) {
        const listing = listingMap.get(listingId)
        if (!listing || listing.status !== 'ACTIVE' || payloadObject(listing.payload).availableToday === false) {
          throw new ApiError(409, `${listing?.title || 'An item in your cart'} is currently unavailable`, 'LISTING_UNAVAILABLE')
        }
        if (listing.stockCount < quantity) {
          const message = listing.stockCount < 1 ? `${listing.title} is out of stock` : `Only ${listing.stockCount} of ${listing.title} ${listing.stockCount === 1 ? 'is' : 'are'} left`
          throw new ApiError(409, message, 'INSUFFICIENT_STOCK', { listingId, available: listing.stockCount, requested: quantity })
        }
      }
      const closedVendor = orderListings.find((listing) => {
        const shopPayload = payloadObject(listing.shop?.payload)
        return shopPayload.entityType === 'campus_vendor' && shopPayload.acceptingOrders === false
      })
      if (closedVendor) throw new ApiError(409, `${closedVendor.shop?.name || 'This campus vendor'} is currently closed and is not accepting new orders`, 'VENDOR_NOT_ACCEPTING_ORDERS')
      const buyer = studentId
        ? await tx.studentProfile.findUnique({ where: { id: studentId }, select: { userId: true, firstName: true, lastName: true, campusId: true } })
        : null
      const crossCampusFoodVendor = orderListings.find((listing) => {
        const shopPayload = payloadObject(listing.shop?.payload)
        return shopPayload.entityType === 'campus_vendor'
          && ['hotel', 'student_kitchen'].includes(String(shopPayload.vendorType))
          && (!buyer || !listing.campusId || buyer.campusId !== listing.campusId)
      })
      if (crossCampusFoodVendor) {
        throw new ApiError(403, `${crossCampusFoodVendor.shop?.name || 'This food vendor'} only accepts orders from students on its campus`, 'CAMPUS_ORDER_RESTRICTED')
      }
      const unavailablePickup = items.find((item) => {
        if (item.fulfilment?.method !== 'pickup') return false
        const listing = listingMap.get(item.listingId)
        if (!listing) return true
        const options = canonicalDeliveryOptions(listing)
        if (!options.includes('Campus pickup')) return true
        const shopPayload = payloadObject(listing.shop?.payload)
        return shopPayload.vendorType === 'student_kitchen'
          && !studentKitchenPickupSpots(listing.shop).includes(String(item.fulfilment.location || '').trim())
      })
      if (unavailablePickup) {
        throw new ApiError(409, 'That pickup location is no longer available. Return to your cart and choose another option.', 'PICKUP_LOCATION_UNAVAILABLE')
      }
      const kitchenPickupLocations = new Map<string, Set<string>>()
      for (const item of items.filter((candidate) => candidate.fulfilment?.method === 'pickup')) {
        const listing = listingMap.get(item.listingId)
        if (payloadObject(listing?.shop?.payload).vendorType !== 'student_kitchen' || !listing?.shopId) continue
        const locations = kitchenPickupLocations.get(listing.shopId) || new Set<string>()
        locations.add(String(item.fulfilment.location || '').trim())
        kitchenPickupLocations.set(listing.shopId, locations)
      }
      if ([...kitchenPickupLocations.values()].some((locations) => locations.size !== 1)) {
        throw new ApiError(409, 'Choose one pickup location for all items from the same student kitchen', 'PICKUP_LOCATION_MISMATCH')
      }
      const freeDeliveryListingIds = new Set(items.filter((item) => item.fulfilment?.method === 'free_campus_delivery').map((item) => item.listingId))
      const unavailableFreeDelivery = orderListings.find((listing) => freeDeliveryListingIds.has(listing.id) && payloadObject(listing.shop?.payload).freeCampusDelivery !== true)
      if (unavailableFreeDelivery) {
        throw new ApiError(409, `${unavailableFreeDelivery.shop?.name || 'This business'} is no longer offering free in-campus delivery`, 'FREE_DELIVERY_UNAVAILABLE')
      }
      const errandListingIds = new Set(items.filter((item) => item.fulfilment?.method === 'errand_delivery').map((item) => item.listingId))
      const unavailableErrandShop = orderListings.find((listing) => errandListingIds.has(listing.id) && (!listing.shop?.errandsEnabled || !listing.shop.campusId))
      if (unavailableErrandShop) {
        throw new ApiError(409, `${unavailableErrandShop.shop?.name || 'This business'} is not offering errands right now`, 'ERRANDS_UNAVAILABLE')
      }
      const errandShops = new Map(orderListings
        .filter((listing) => errandListingIds.has(listing.id) && listing.shop?.errandsEnabled && listing.shop.campusId)
        .map((listing) => [listing.shop!.id, listing.shop!]))
      const eligibleErrandersByShop = new Map<string, Record<string, any>[]>()
      for (const shop of errandShops.values()) {
        const shopItems = items.filter((item) => listingMap.get(item.listingId)?.shopId === shop.id && item.fulfilment?.method === 'errand_delivery')
        if (Number(shop.errandFee || 0) <= 0 || shopItems.some((item) => Number(item.fulfilment?.fee || 0) !== Number(shop.errandFee || 0))) {
          throw new ApiError(409, `${shop.name} updated its delivery price. Return to your cart to review it.`, 'ERRAND_FEE_CHANGED')
        }
        const registrations = await tx.errandShopRegistration.findMany({
          where: {
            shopId: shop.id,
            status: 'ACTIVE',
            isAvailable: true,
            studentId: { notIn: [studentId, shop.ownerId].filter(Boolean) as string[] },
          },
          include: { student: { select: { userId: true, firstName: true, lastName: true } } }
        })
        if (!registrations.length) throw new ApiError(409, `No erranders for ${shop.name} are available right now`, 'ERRANDER_UNAVAILABLE')
        eligibleErrandersByShop.set(shop.id, registrations)
      }
      if (!studentId) throw new ApiError(403, 'A buyer wallet is required', 'BUYER_WALLET_REQUIRED')
      const offerIds = items.map((item) => item.offerId).filter(Boolean) as string[]
      const acceptedOffers = offerIds.length && buyer?.userId
        ? await tx.marketplaceOffer.findMany({ where: { id: { in: offerIds }, buyerId: buyer.userId, status: 'accepted' } })
        : []
      const offerMap = new Map(acceptedOffers.map((offer) => [offer.id, offer]))
      const pricedItems: Record<string, any>[] = items.map((item): Record<string, any> => {
        const listing = listingMap.get(item.listingId)!
        const offer = item.offerId ? offerMap.get(item.offerId) : null
        if (item.offerId && (!offer || offer.listingReference !== listing.id)) {
          throw new ApiError(409, `The accepted offer for ${listing.title} is no longer available`, 'MARKETPLACE_OFFER_UNAVAILABLE')
        }
        if (listing.sellerId === studentId) throw new ApiError(409, 'You cannot buy your own marketplace listing', 'SELF_PURCHASE_NOT_ALLOWED')
        return {
          ...item,
          shopId: listing.shopId,
          sellerId: listing.sellerId,
          unitAmount: Number(offer?.amount ?? listing.priceAmount),
          currency: offer?.currency ?? listing.currency
        }
      })
      const currencies = [...new Set(pricedItems.map((item) => String(item.currency || 'KES').toUpperCase()))]
      if (currencies.length !== 1) throw new ApiError(409, 'All items in one order must use the same currency', 'MIXED_ORDER_CURRENCIES')
      const currency = currencies[0]
      let allocation
      try {
        allocation = calculateOrderMoney(pricedItems, currency)
      } catch (error) {
        throw new ApiError(409, error instanceof Error ? error.message : 'Order pricing is invalid', 'ORDER_PRICING_INVALID')
      }
      const totalAmount = allocation.totalAmount
      for (const [listingId, quantity] of requestedQuantities) {
        const reserved = await tx.marketplaceListing.updateMany({
          where: { id: listingId, status: 'ACTIVE', stockCount: { gte: quantity } },
          data: { stockCount: { decrement: quantity } }
        })
        if (reserved.count !== 1) {
          throw new ApiError(409, `${listingMap.get(listingId)?.title || 'An item in your cart'} just sold out`, 'INSUFFICIENT_STOCK')
        }
      }
      const order = await tx.marketplaceOrder.create({
        data: {
          studentId: studentId ?? null,
          cartId: cart.id,
          items: jsonInput(pricedItems),
          totalAmount,
          currency,
          status: 'paid',
          fulfillmentStatus: 'seller_confirmation',
          handoffType: payload.handoffType,
          handoffSpot: payload.handoffSpot,
          paymentReference: payload.paymentReference ?? null,
          payload: jsonInput({
            ...payload,
            financialVersion: 2,
            settlement: allocation,
            inventoryReserved: true,
            buyerUserId: buyer?.userId,
            buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : undefined
          })
        }
      })
      await debitStudentWallet(tx, studentId, totalAmount, {
        type: 'ESCROW_HOLD',
        currency,
        description: `Marketplace payment held in escrow for order ${order.id}`,
        metadata: { orderId: order.id, cartId: cart.id, direction: 'buyer_debit', balanceKind: 'available' }
      })
      for (const shop of errandShops.values()) {
        const shopItems = pricedItems.filter((item) => listingMap.get(item.listingId)?.shopId === shop.id && item.fulfilment?.method === 'errand_delivery')
        const dropoffLabel = shopItems[0]?.fulfilment?.location || payload.handoffSpot
        const errand = await tx.marketplaceErrand.create({
          data: {
            orderId: order.id,
            shopId: shop.id,
            campusId: shop.campusId!,
            status: 'AVAILABLE',
            pickupLabel: shop.locationLabel || 'Campus shop',
            dropoffLabel,
            feeAmount: Number(shop.errandFee || 0),
            currency: order.currency,
            payload: jsonInput({ itemCount: shopItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0), itemTitles: shopItems.map((item) => item.title), buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : undefined })
          }
        })
        const registrations = eligibleErrandersByShop.get(shop.id) || []
        await Promise.all(registrations.map((registration) => {
          errandNotificationUserIds.add(registration.student.userId)
          return tx.notification.create({ data: {
            userId: registration.student.userId,
            type: 'ERRAND_AVAILABLE',
            title: `New errand available from ${shop.name}`,
            body: `Earn ${order.currency} ${Number(shop.errandFee || 0).toLocaleString()} delivering from ${shop.locationLabel || 'the shop'} to ${dropoffLabel}. First to accept gets it.`,
            data: jsonInput({ errandId: errand.id, orderId: order.id, shopId: shop.id, href: '/campus/profile?tab=errands' }),
            sentVia: ['IN_APP']
          } })
        }))
      }
      for (const seller of allocation.sellers) {
        if (!seller.id || seller.amount <= 0) continue
        await reserveStudentPending(tx, seller.id, seller.amount, {
          currency: order.currency,
          description: `Marketplace escrow hold for order ${order.id}`,
          metadata: { orderId: order.id, role: 'seller', balanceKind: 'pending' }
        })
      }
      const acceptedOfferIds = pricedItems.map((item) => item.offerId).filter(Boolean)
      if (acceptedOfferIds.length) {
        await tx.marketplaceOffer.updateMany({
          where: { id: { in: acceptedOfferIds }, status: 'accepted' },
          data: { status: 'converted' }
        })
      }
      await tx.marketplaceCart.update({ where: { id: cart.id }, data: { status: 'ordered', orderId: order.id } })
      return { order: toOrderRecord(order), errandNotificationUserIds: [...errandNotificationUserIds] }
    })
  }
}

const marketplaceOrdersRepository = new MarketplaceOrdersRepository()

export {
  MarketplaceOrdersRepository,
  marketplaceOrdersRepository
}
