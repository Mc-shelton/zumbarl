import { forbidden, notFound } from '../../../lib/http.js'
import { marketplaceOrdersRepository } from '../../repositories/marketplace/index.js'
import { sendTransactionalEmail } from '../../notification/index.js'
import { createMessageService, createPageConversationService, createPageMessageService } from '../connect/index.js'
import { env } from '../../../config/env.js'
import { readStudentKycEligibility, type StudentKycPurpose } from '../../../shared/services/studentKyc.js'
import { emitRealtimeEvent } from '../../../lib/realtimeEvents.js'

async function roadDistanceKm(sellerLatitude: number, sellerLongitude: number, buyerLatitude: number, buyerLongitude: number) {
  const coordinates = `${sellerLongitude},${sellerLatitude};${buyerLongitude},${buyerLatitude}`
  const url = `${env.OSRM_BASE_URL.replace(/\/$/, '')}/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`
  const response = await globalThis.fetch(url, { signal: AbortSignal.timeout(env.OSRM_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`OSRM returned ${response.status}`)
  const result = await response.json() as { code?: string, routes?: Array<{ distance?: number, duration?: number }> }
  const route = result.routes?.[0]
  if (result.code !== 'Ok' || !route || !Number.isFinite(route.distance)) throw new Error('OSRM could not find a road route')
  return { distanceKm: Math.round((Number(route.distance) / 1000) * 10) / 10, durationMinutes: Math.max(1, Math.round(Number(route.duration || 0) / 60)) }
}

async function readMarketplaceParticipants(actorUserId: string | undefined, sellerUsername: string) {
  if (!actorUserId) forbidden('Authentication is required')
  const [actor, seller] = await Promise.all([
    marketplaceOrdersRepository.findMarketplaceActor(actorUserId),
    marketplaceOrdersRepository.findSellerByUsername(sellerUsername)
  ])
  if (!actor) notFound('Buyer')
  if (!seller) notFound('Seller')
  if (actor.id === seller.userId) forbidden('You cannot contact yourself about your own listing')
  return { actor, seller }
}

async function assertListingCanReceiveBuyerActions(listingReference: string, sellerUsername: string) {
  const listing = await marketplaceOrdersRepository.findListing(listingReference)
  if (!listing) notFound('Listing')
  if (!['published', 'active'].includes(String(listing.status).toLowerCase())) {
    forbidden('This listing is not currently accepting buyer enquiries')
  }
  if (listing.seller?.username && listing.seller.username !== sellerUsername.replace(/^@/, '').toLowerCase()) {
    forbidden('The selected seller does not own this listing')
  }
  return listing
}

async function createMarketplaceConversationMessage(
  listing: Record<string, any>,
  actorUserId: string,
  customerUserId: string,
  input: { body: string; context: Record<string, any> },
  sendAsPage = false
) {
  if (listing.shop?.id) {
    const pageConversation = await createPageConversationService(actorUserId, {
      pageType: 'marketplace_shop',
      pageId: listing.shop.id,
      ...(sendAsPage ? { customerUserId } : {})
    })
    const message = await createPageMessageService(actorUserId, pageConversation.id, {
      ...input,
      fileUrls: [],
      sendAsPage
    })
    return { message, pageConversation }
  }

  const message = await createMessageService(actorUserId, {
    recipientId: sendAsPage ? customerUserId : listing.seller.userId,
    body: input.body,
    fileUrls: [],
    context: input.context
  })
  return { message, pageConversation: null }
}

function pageConversationHref(pageId: string, customerUserId?: string) {
  const params = new URLSearchParams({ pageType: 'marketplace_shop', pageId })
  if (customerUserId) params.set('customerUserId', customerUserId)
  return `/messages?${params.toString()}`
}

const readMarketplaceSellerService = async (username: string) => (
  await marketplaceOrdersRepository.findSellerByUsername(username) ?? notFound('Seller')
)

async function startMarketplaceChatService(actorUserId: string | undefined, listingReference: string, payload: Record<string, any>) {
  const listing = await assertListingCanReceiveBuyerActions(listingReference, payload.sellerUsername)
  const { actor, seller } = await readMarketplaceParticipants(actorUserId, payload.sellerUsername)
  const body = `Hi, I'm ${actor.name}. I'm interested in ${payload.product.title}. Is it still available?`
  const { message, pageConversation } = await createMarketplaceConversationMessage(listing, actor.id, actor.id, {
    body,
    context: { type: 'marketplace_product', product: payload.product }
  })
  const conversationHref = listing.shop?.id
    ? pageConversationHref(listing.shop.id, actor.id)
    : `/messages?participantId=${actor.id}`
  await marketplaceOrdersRepository.createSellerNotification({
    userId: seller.userId,
    type: 'MARKETPLACE_MESSAGE',
    title: `New message about ${payload.product.title}`,
    body: `${actor.name} asked whether your listing is available.`,
    data: {
      listingReference,
      product: payload.product,
      buyerUserId: actor.id,
      deepLink: conversationHref,
      href: conversationHref
    }
  })
  return { message, seller, pageConversation }
}

async function createMarketplaceOfferService(actorUserId: string | undefined, listingReference: string, payload: Record<string, any>) {
  if (!actorUserId) forbidden('Authentication is required')
  const listing = await assertListingCanReceiveBuyerActions(listingReference, payload.sellerUsername)
  if (!listing.negotiable) forbidden('This listing is not accepting offers')
  const minimumOffer = Number(listing.minimumOffer)
  if (Number.isFinite(minimumOffer) && minimumOffer > 0 && Number(payload.amount) < minimumOffer) {
    forbidden('That amount is below the minimum offer the seller will consider')
  }
  const pendingOffer = await marketplaceOrdersRepository.findPendingOffer(listingReference, actorUserId)
  if (pendingOffer && Number(pendingOffer.amount) === Number(payload.amount)) return { offer: pendingOffer, alreadyPending: true }
  const { actor, seller } = await readMarketplaceParticipants(actorUserId, payload.sellerUsername)
  const previousOffer = await marketplaceOrdersRepository.findCurrentBuyerOffer(listingReference, actorUserId)
  const revisedOffer = previousOffer && ['pending', 'declined'].includes(String(previousOffer.status))
    ? await marketplaceOrdersRepository.reviseDeclinedOffer(previousOffer.id, actorUserId, payload)
    : null
  const offer = revisedOffer ?? await marketplaceOrdersRepository.createOffer({
    listingReference,
    buyerId: actor.id,
    sellerId: seller.userId,
    amount: payload.amount,
    currency: payload.currency,
    product: payload.product
  })
  const amount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: payload.currency, maximumFractionDigits: 0 }).format(payload.amount)
  const { message, pageConversation } = await createMarketplaceConversationMessage(listing, actor.id, actor.id, {
    body: `I'd like to offer ${amount} for ${payload.product.title}.`,
    context: {
      type: 'marketplace_offer',
      product: payload.product,
      offer: { id: offer.id, amount: offer.amount, currency: offer.currency }
    }
  })
  const conversationHref = listing.shop?.id
    ? pageConversationHref(listing.shop.id, actor.id)
    : `/messages?participantId=${actor.id}`
  await marketplaceOrdersRepository.createSellerNotification({
    userId: seller.userId,
    type: 'MARKETPLACE_OFFER',
    title: `New ${amount} offer`,
    body: `${actor.name} made an offer on ${payload.product.title}.`,
    data: {
      offerId: offer.id,
      listingReference,
      product: payload.product,
      buyerUserId: actor.id,
      deepLink: conversationHref,
      href: conversationHref
    }
  })
  return { offer, message, seller, pageConversation, revised: Boolean(revisedOffer) }
}
async function readMarketplaceOfferService(userId: string | undefined, offerId: string) {
  if (!userId) forbidden('Authentication is required')
  const offer = await marketplaceOrdersRepository.findOffer(offerId) ?? notFound('Offer')
  const listing = await marketplaceOrdersRepository.findListing(offer.listingReference) ?? notFound('Listing')
  const managesPage = Boolean(listing.shopId && await marketplaceOrdersRepository.userManagesShop(userId, listing.shopId))
  if (offer.buyerId !== userId && offer.sellerId !== userId && !managesPage) forbidden('You are not part of this offer')
  return { offer: { ...offer, canManage: offer.sellerId === userId || managesPage } }
}

async function recordMarketplaceSellerViewService(actorUserId: string | undefined, sellerUsername: string, payload: Record<string, any>) {
  const { actor, seller } = await readMarketplaceParticipants(actorUserId, sellerUsername)
  await marketplaceOrdersRepository.createSellerNotification({
    userId: seller.userId,
    type: 'MARKETPLACE_PROFILE_VIEW',
    title: 'Someone viewed your seller profile',
    body: `${actor.name} viewed your profile${payload.product?.title ? ` from ${payload.product.title}` : ''}.`,
    data: {
      viewerUserId: actor.id,
      viewerStudentId: actor.studentId,
      product: payload.product || null,
      deepLink: actor.studentId ? `/campus/profiles/${actor.studentId}` : null,
      href: actor.studentId ? `/campus/profiles/${actor.studentId}` : null
    }
  })
  return seller
}
const listMarketplaceShopsService = (query: Record<string, unknown>, studentId?: string) => marketplaceOrdersRepository.listShops(query, studentId)
async function assertStudentKycForCommerce(studentId: string | undefined, purpose: StudentKycPurpose) {
  if (!studentId) forbidden('A student profile is required')
  const eligibility = await readStudentKycEligibility(studentId, purpose)
  if (!eligibility?.approved) {
    const missing = eligibility?.missing.map((requirement) => requirement.label).join(', ')
    forbidden(`Approved KYC is required before you can create this page${missing ? `. Missing: ${missing}` : ''}`)
  }
}
async function createMarketplaceShopService(studentId: string | undefined, payload: Record<string, any>) {
  await assertStudentKycForCommerce(studentId, 'business')
  return marketplaceOrdersRepository.createShop({ ...payload, studentId, status: 'open', score: 0 })
}
async function createStudentKitchenService(studentId: string | undefined, userId: string | undefined, payload: Record<string, any>) {
  if (!studentId || !userId) forbidden('A student profile is required to create a kitchen')
  await assertStudentKycForCommerce(studentId, 'student_kitchen')
  return await marketplaceOrdersRepository.createStudentKitchen(studentId, userId, payload) ?? notFound('Student profile')
}
const listMarketplaceListingsService = (query: Record<string, unknown>, studentId?: string) => marketplaceOrdersRepository.listListings(query, studentId)
async function createMarketplaceListingService(studentId: string | undefined, userId: string | undefined, shopId: string, payload: Record<string, any>) {
  if (!studentId || !userId) forbidden('A student vendor operator profile is required')
  const shop = await marketplaceOrdersRepository.findShop(shopId) ?? notFound('Shop')
  if (shop.ownerId !== studentId && !(await marketplaceOrdersRepository.userManagesShop(userId, shopId))) forbidden('You can only add inventory to a shop you manage')
  const isCampusFoodVendor = shop.entityType === 'campus_vendor' && ['hotel', 'student_kitchen'].includes(shop.vendorType)
  if (shop.entityType === 'campus_vendor' && !['open', 'closed'].includes(shop.status)) {
    forbidden('This page must be approved before inventory can be published')
  }
  const foodCategories = new Set(['Meals', 'Snacks', 'Drinks', 'Baked goods', 'Fresh food', 'Other food'])
  const normalizedPayload = isCampusFoodVendor ? {
    ...payload,
    kind: 'service',
    serviceMode: 'order_ahead',
    inventoryType: 'food',
    campusOnly: true,
    category: foodCategories.has(payload.category) ? payload.category : 'Meals',
    condition: undefined,
    negotiable: false,
    deliveryOptions: shop.vendorType === 'student_kitchen' ? ['Campus pickup'] : [],
    locationLabel: payload.locationLabel || shop.locationLabel || shop.campus || 'Campus pickup',
    latitude: payload.latitude ?? shop.latitude ?? undefined,
    longitude: payload.longitude ?? shop.longitude ?? undefined,
    pickupInstructions: shop.vendorType === 'student_kitchen'
      ? payload.pickupInstructions || `Choose one of ${shop.name}'s listed campus pickup locations at checkout.`
      : 'This campus eatery does not offer customer pickup. Choose an available delivery option at checkout.',
  } : payload
  return marketplaceOrdersRepository.createListing({ ...normalizedPayload, shopId, status: payload.status || 'ACTIVE' })
}
async function readMyMarketplaceInventoryService(studentId: string | undefined) {
  if (!studentId) forbidden('A student seller profile is required')
  const [shop, listings] = await Promise.all([
    marketplaceOrdersRepository.findOwnedShop(studentId),
    marketplaceOrdersRepository.listOwnedListings(studentId)
  ])
  return { shop, listings }
}
async function listMyCampusVendorsService(userId: string | undefined) {
  if (!userId) forbidden('A vendor manager account is required')
  return { vendors: await marketplaceOrdersRepository.listOwnedCampusVendors(userId) }
}
async function readCampusVendorWorkspaceService(userId: string | undefined, slug: string) {
  if (!userId) forbidden('A vendor manager account is required')
  return await marketplaceOrdersRepository.readCampusVendorWorkspace(userId, slug) ?? notFound('Managed campus vendor')
}
async function readCampusVendorFinanceService(userId: string | undefined, slug: string) {
  if (!userId) forbidden('A page administrator account is required')
  return await marketplaceOrdersRepository.readCampusVendorFinance(userId, slug) ?? forbidden('Only page owners and administrators can view page finances')
}
async function requestCampusVendorWithdrawalService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A page administrator account is required')
  return await marketplaceOrdersRepository.requestCampusVendorWithdrawal(userId, slug, payload) ?? forbidden('Only page owners and administrators can withdraw page earnings')
}
async function requireApprovedCampusVendor(userId: string, slug: string) {
  const vendor = await marketplaceOrdersRepository.findOwnedCampusVendor(userId, slug) ?? notFound('Managed campus vendor')
  if (vendor.status !== 'ACTIVE') forbidden('This page must be approved before it can publish or accept orders')
  return vendor
}
async function readCampusVendorProfileService(slug: string, viewerStudentId?: string, viewerUserId?: string) {
  return await marketplaceOrdersRepository.readCampusVendorProfile(slug, viewerStudentId, viewerUserId) ?? notFound('Campus vendor')
}
async function setCampusVendorFollowingService(userId: string | undefined, slug: string, active: boolean) {
  if (!userId) forbidden('Authentication is required')
  return await marketplaceOrdersRepository.setCampusVendorFollowing(userId, slug, active) ?? notFound('Campus vendor')
}
async function updateCampusVendorAvailabilityService(userId: string | undefined, slug: string, acceptingOrders: boolean) {
  if (!userId) forbidden('A vendor manager account is required')
  await requireApprovedCampusVendor(userId, slug)
  return await marketplaceOrdersRepository.updateCampusVendorAvailability(userId, slug, acceptingOrders) ?? notFound('Managed campus vendor')
}
async function updateShopErrandsService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A page owner or admin account is required')
  return await marketplaceOrdersRepository.updateShopErrands(userId, slug, payload.enabled, payload.acceptingErranders, payload.freeCampusDelivery, payload.deliveryFee) ?? forbidden('Only this page owner or an admin can change errand settings')
}
async function registerVendorErranderService(studentId: string | undefined, slug: string) {
  if (!studentId) forbidden('A student profile is required')
  return await marketplaceOrdersRepository.registerVendorErrander(studentId, slug) ?? notFound('Campus vendor')
}
async function manageVendorErranderService(userId: string | undefined, slug: string, studentId: string, payload: Record<string, any>) {
  if (!userId) forbidden('A page owner or admin account is required')
  const response = await marketplaceOrdersRepository.manageVendorErrander(userId, slug, studentId, payload.action, payload.reason) ?? notFound('Errander registration')
  emitRealtimeEvent(response.notificationUserId, { type: 'notification.created', data: response.registration })
  return response.registration
}
async function updateErranderAvailabilityService(studentId: string | undefined, registrationId: string, isAvailable: boolean) {
  if (!studentId) forbidden('A student profile is required')
  return await marketplaceOrdersRepository.updateErranderAvailability(studentId, registrationId, isAvailable) ?? notFound('Active errander registration')
}
async function readMyErrandsService(studentId: string | undefined) {
  if (!studentId) forbidden('A student profile is required')
  return await marketplaceOrdersRepository.readMyErrands(studentId) ?? notFound('Student profile')
}
async function respondToErrandService(studentId: string | undefined, errandId: string, decision: 'ACCEPTED' | 'IGNORED') {
  if (!studentId) forbidden('A student profile is required')
  const response = await marketplaceOrdersRepository.respondToErrand(studentId, errandId, decision) ?? notFound('Available errand')
  response.notificationUserIds.forEach((userId: string) => emitRealtimeEvent(userId, { type: 'notification.created', data: response.errand }))
  return response
}
async function progressErrandService(studentId: string | undefined, errandId: string, status: 'PICKED_UP' | 'DELIVERED', confirmationCode?: string) {
  if (!studentId) forbidden('A student profile is required')
  const response = await marketplaceOrdersRepository.progressErrand(studentId, errandId, status, confirmationCode) ?? notFound('Assigned errand')
  if (status === 'PICKED_UP') {
    const errand = response.errand as Record<string, any>
    const order = errand?.order as Record<string, any> || {}
    const buyerUserId = order.buyerUserId
    const erranderUserId = errand?.assignedErrander?.userId
    const firstItem = order.items?.[0] || {}
    if (buyerUserId && erranderUserId && buyerUserId !== erranderUserId) {
      const identifier = `#${String(response.orderId || errand.orderId).slice(-8).toUpperCase()}`
      const title = `${firstItem.title || 'Marketplace order'}${order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}`
      await createMessageService(erranderUserId, {
        recipientId: buyerUserId,
        body: `I've picked up your ${title} order (${identifier}) and I'm on my way.`,
        fileUrls: [],
        context: {
          type: 'marketplace_order',
          automatedEventId: `errand-picked-up:${errand.id}`,
          order: {
            id: response.orderId || errand.orderId,
            identifier,
            title,
            status: 'in_transit',
            image: firstItem.image || firstItem.images?.[0] || undefined,
            total: Number(order.totalAmount || 0),
            currency: order.currency || 'KES',
            messageIntent: 'errander_to_buyer',
            senderHref: `/campus/profile?tab=errands&orderId=${encodeURIComponent(response.orderId || errand.orderId)}`,
            recipientHref: `/campus/opportunities/buy-sell?view=orders&orderId=${encodeURIComponent(response.orderId || errand.orderId)}`
          }
        }
      })
    }
  }
  if (status === 'DELIVERED' && response.orderReadyToComplete && response.buyerStudentId) {
    const completed = await marketplaceOrdersRepository.completeBuyerOrder(response.orderId, response.buyerStudentId)
    if (!completed) forbidden('Delivery was recorded, but settlement could not be completed. Submit the delivery code again to retry.')
  }
  response.notificationUserIds.forEach((userId: string) => emitRealtimeEvent(userId, { type: 'notification.created', data: response.errand }))
  return response
}
async function readBuyerDeliveryCodeService(orderId: string, studentId: string | undefined) {
  if (!studentId) forbidden('A buyer profile is required')
  return await marketplaceOrdersRepository.readBuyerDeliveryCode(orderId, studentId) ?? notFound('Delivery order')
}
async function searchCampusVendorManagerCandidatesService(userId: string | undefined, slug: string, query: string) {
  if (!userId) forbidden('A vendor manager account is required')
  const candidates = await marketplaceOrdersRepository.searchCampusVendorManagerCandidates(userId, slug, query)
  if (!candidates) forbidden('Only vendor owners and admins can search for teammates')
  return { candidates }
}
async function createCampusVendorPostService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  await requireApprovedCampusVendor(userId, slug)
  return await marketplaceOrdersRepository.createCampusVendorPost(userId, slug, payload) ?? notFound('Managed campus vendor')
}
async function updateCampusVendorPostService(userId: string | undefined, slug: string, postId: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  await requireApprovedCampusVendor(userId, slug)
  return await marketplaceOrdersRepository.updateCampusVendorPost(userId, slug, postId, payload) ?? notFound('Vendor post')
}
async function createCampusVendorPromotionService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  await requireApprovedCampusVendor(userId, slug)
  return await marketplaceOrdersRepository.createCampusVendorPost(userId, slug, payload, true) ?? notFound('Managed campus vendor')
}
async function updateCampusVendorForManagerService(userId: string | undefined, slug: string, payload: Record<string, any>) { if (!userId) forbidden('A vendor manager account is required'); return await marketplaceOrdersRepository.updateCampusVendorForManager(userId, slug, payload) ?? forbidden('Only vendor owners and admins can edit this vendor') }
async function addCampusVendorManagerForManagerService(userId: string | undefined, slug: string, payload: Record<string, any>) { if (!userId) forbidden('A vendor manager account is required'); return await marketplaceOrdersRepository.addCampusVendorManagerForManager(userId, slug, payload.email, payload.role) ?? notFound('Vendor or eligible operator') }
async function removeCampusVendorManagerForManagerService(userId: string | undefined, slug: string, managerUserId: string) { if (!userId) forbidden('A vendor manager account is required'); return await marketplaceOrdersRepository.removeCampusVendorManagerForManager(userId, slug, managerUserId) ?? forbidden('This vendor assignment cannot be removed') }
async function updateMyMarketplaceShopService(studentId: string | undefined, payload: Record<string, any>) {
  if (!studentId) forbidden('A student seller profile is required')
  return await marketplaceOrdersRepository.updateOwnedShop(studentId, payload) ?? notFound('Shop')
}
async function searchMarketplaceLocationsService(query: string) {
  const url = new URL('/api/', env.GEOCODING_BASE_URL)
  url.searchParams.set('q', `${query}, Kenya`)
  url.searchParams.set('limit', '6')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('lat', '-1.2864')
  url.searchParams.set('lon', '36.8172')
  const response = await globalThis.fetch(url, { headers: { 'User-Agent': 'Zumbarl/1.0 location-search' }, signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`Location search returned ${response.status}`)
  const data = await response.json() as { features?: Array<Record<string, any>> }
  return {
    results: (data.features || []).filter((feature) => feature.properties?.countrycode === 'KE').map((feature) => {
      const properties = feature.properties || {}
      const parts = [properties.name, properties.street, properties.locality, properties.city, properties.county, properties.state, properties.country].filter(Boolean)
      return { id: `${properties.osm_type || 'place'}-${properties.osm_id || feature.geometry?.coordinates?.join('-')}`, label: [...new Set(parts)].join(', '), latitude: Number(feature.geometry?.coordinates?.[1]), longitude: Number(feature.geometry?.coordinates?.[0]), type: properties.osm_value || properties.type || 'place' }
    }).filter((result) => result.label && Number.isFinite(result.latitude) && Number.isFinite(result.longitude))
  }
}
async function readMyPendingMarketplaceOffersService(userId: string | undefined) {
  if (!userId) forbidden('Authentication is required')
  const offers = await marketplaceOrdersRepository.listPendingOffersForSeller(userId)
  return {
    offers: offers.map((offer) => ({
      ...offer,
      buyer: {
        id: offer.buyer.id,
        name: offer.buyer.name || `${offer.buyer.firstName || ''} ${offer.buyer.lastName || ''}`.trim() || 'Marketplace buyer'
      }
    }))
  }
}
async function decideMarketplaceOfferService(userId: string | undefined, offerId: string, decision: 'accepted' | 'declined') {
  if (!userId) forbidden('Authentication is required')
  const pending = await marketplaceOrdersRepository.findOffer(offerId) ?? notFound('Offer')
  const listing = await marketplaceOrdersRepository.findListing(pending.listingReference) ?? notFound('Listing')
  const managesPage = Boolean(listing.shopId && await marketplaceOrdersRepository.userManagesShop(userId, listing.shopId))
  if (pending.sellerId !== userId && !managesPage) forbidden('Only the seller page team can decide this offer')
  if (decision === 'accepted') {
    const minimumOffer = Number(listing.minimumOffer)
    if (Number.isFinite(minimumOffer) && minimumOffer > 0 && Number(pending.amount) < minimumOffer) {
      forbidden('This offer is below the listing minimum and cannot be accepted')
    }
  }
  const offer = await marketplaceOrdersRepository.decidePendingOffer(offerId, pending.sellerId, decision) ?? notFound('Pending offer')
  const product = offer.product as Record<string, any>
  const amount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: offer.currency, maximumFractionDigits: 0 }).format(offer.amount)
  await createMarketplaceConversationMessage(listing, userId, offer.buyerId, {
    body: decision === 'accepted'
      ? `Your ${amount} offer for ${product.title || 'this item'} was accepted. Let’s arrange the handoff.`
      : `Your ${amount} offer for ${product.title || 'this item'} was declined.`,
    context: { type: 'marketplace_offer', product, offer: { id: offer.id, amount: offer.amount, currency: offer.currency, status: decision } }
  }, Boolean(listing.shop?.id))
  const conversationHref = listing.shop?.id
    ? pageConversationHref(listing.shop.id)
    : `/messages?participantId=${userId}`
  await marketplaceOrdersRepository.createSellerNotification({
    userId: offer.buyerId,
    type: decision === 'accepted' ? 'MARKETPLACE_OFFER_ACCEPTED' : 'MARKETPLACE_OFFER_DECLINED',
    title: decision === 'accepted' ? 'Your offer was accepted' : 'Offer update',
    body: decision === 'accepted'
      ? `The seller accepted your ${amount} offer for ${product.title || 'a marketplace item'}.`
      : `The seller declined your ${amount} offer for ${product.title || 'a marketplace item'}.`,
    data: { offerId: offer.id, product, decision, deepLink: conversationHref, href: conversationHref }
  })
  return { offer }
}
async function createOwnedMarketplaceListingService(studentId: string | undefined, payload: Record<string, any>) {
  if (!studentId) forbidden('A student seller profile is required')
  const shop = await marketplaceOrdersRepository.findOwnedShop(studentId)
    ?? await marketplaceOrdersRepository.createDefaultShop(studentId)
    ?? notFound('Student shop')
  if (shop.entityType === 'campus_vendor' && !['open', 'closed'].includes(shop.status)) {
    forbidden('This page must be approved before inventory can be published')
  }
  return marketplaceOrdersRepository.createListing({ ...payload, shopId: shop.id, status: payload.status || 'ACTIVE' })
}
async function updateOwnedMarketplaceListingService(studentId: string | undefined, userId: string | undefined, listingId: string, payload: Record<string, any>) {
  if (!studentId || !userId) forbidden('A student vendor operator profile is required')
  const listing = await marketplaceOrdersRepository.findListing(listingId) ?? notFound('Listing')
  const canManage = listing.seller?.studentId === studentId || (listing.shopId && await marketplaceOrdersRepository.userManagesShop(userId, listing.shopId))
  if (!canManage) forbidden('You can only edit inventory for a shop you manage')
  const shop = listing.shopId ? await marketplaceOrdersRepository.findShop(listing.shopId) : null
  const isCampusFoodVendor = shop?.entityType === 'campus_vendor' && ['hotel', 'student_kitchen'].includes(shop.vendorType)
  const normalizedPayload = isCampusFoodVendor ? {
    ...payload,
    deliveryOptions: shop.vendorType === 'student_kitchen' ? ['Campus pickup'] : [],
    pickupInstructions: shop.vendorType === 'student_kitchen'
      ? payload.pickupInstructions || `Choose one of ${shop.name}'s listed campus pickup locations at checkout.`
      : 'This campus eatery does not offer customer pickup. Choose an available delivery option at checkout.',
  } : payload
  return await marketplaceOrdersRepository.updateOwnedListing(listingId, listing.seller?.studentId || studentId, normalizedPayload)
    ?? notFound('Listing')
}
async function readMarketplaceListingService(id: string, actorUserId?: string) {
  const listing = await marketplaceOrdersRepository.findListing(id) ?? notFound('Listing')
  let activeOffer = actorUserId
    ? await marketplaceOrdersRepository.findCurrentBuyerOffer(id, actorUserId)
    : null
  if (activeOffer?.status === 'declined' && !['active', 'published'].includes(String(listing.status).toLowerCase())) activeOffer = null
  return { listing, shop: await marketplaceOrdersRepository.findShop(listing.shopId), activeOffer }
}
async function readCartService(studentId: string | undefined) { return marketplaceOrdersRepository.findOrCreateOpenCart(studentId) }
async function addCartItemService(studentId: string | undefined, userId: string | undefined, payload: Record<string, any>) {
  const listing = await marketplaceOrdersRepository.findListing(payload.listingId) ?? notFound('Listing')
  if (listing.shop?.status && listing.shop.status !== 'active') forbidden('This vendor page is not currently approved for orders')
  if (listing.shop?.entityType === 'campus_vendor' && listing.shop?.acceptingOrders === false) forbidden(`${listing.shop.name} is currently closed and is not accepting new orders`)
  return await marketplaceOrdersRepository.addCartItem(studentId, userId, payload) ?? notFound('Eligible listing or accepted offer')
}
async function removeCartItemService(studentId: string | undefined, listingId: string) { return await marketplaceOrdersRepository.removeCartItem(studentId, listingId) ?? notFound('Cart') }
async function clearCartService(studentId: string | undefined) { return await marketplaceOrdersRepository.clearCart(studentId) ?? notFound('Cart') }
async function updateCartItemFulfilmentService(studentId: string | undefined, listingId: string, payload: Record<string, any>) {
  const verifiedPayload = payload.method === 'zumbarl_delivery'
    ? { ...payload, ...(await quoteZumbarlDeliveryService({ listingId, buyerLatitude: payload.buyerLatitude, buyerLongitude: payload.buyerLongitude, destination: payload.location })), method: 'zumbarl_delivery', location: payload.location }
    : payload
  return await marketplaceOrdersRepository.updateCartItemFulfilment(studentId, listingId, verifiedPayload) ?? notFound('Cart item or fulfilment option')
}
async function readZumbarlDeliveryConfigService() { return marketplaceOrdersRepository.readZumbarlDeliveryConfig() }
async function quoteZumbarlDeliveryService(payload: Record<string, any>) {
  const config = await marketplaceOrdersRepository.readZumbarlDeliveryConfig()
  if (!config.active) forbidden('Zumbarl Delivery is currently unavailable')
  const origin = await marketplaceOrdersRepository.findListingDeliveryOrigin(payload.listingId) ?? notFound('Listing')
  const sellerLatitude = Number(origin.latitude)
  const sellerLongitude = Number(origin.longitude)
  if (!Number.isFinite(sellerLatitude) || !Number.isFinite(sellerLongitude)) forbidden('The seller must add a location before Zumbarl Delivery can be quoted')
  const buyerLatitude = Number(payload.buyerLatitude)
  const buyerLongitude = Number(payload.buyerLongitude)
  if (!Number.isFinite(buyerLatitude) || !Number.isFinite(buyerLongitude)) forbidden('Allow location access to calculate delivery distance')
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(buyerLatitude - sellerLatitude)
  const longitudeDelta = toRadians(buyerLongitude - sellerLongitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(sellerLatitude)) * Math.cos(toRadians(buyerLatitude)) * Math.sin(longitudeDelta / 2) ** 2
  const haversineDistanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  let distanceKm: number
  let durationMinutes: number | null = null
  let distanceSource = 'road_route'
  try {
    const roadRoute = await roadDistanceKm(sellerLatitude, sellerLongitude, buyerLatitude, buyerLongitude)
    distanceKm = roadRoute.distanceKm
    durationMinutes = roadRoute.durationMinutes
  } catch {
    distanceKm = Math.round((haversineDistanceKm * env.DELIVERY_HAVERSINE_FALLBACK_FACTOR) * 10) / 10
    distanceSource = 'haversine_fallback'
  }
  if (distanceKm > Number(config.maximumDistanceKm)) forbidden(`Zumbarl Delivery is limited to ${config.maximumDistanceKm} km`)
  const billableDistance = Math.max(0, distanceKm - Number(config.freeRadiusKm))
  const calculated = Number(config.baseFee) + billableDistance * Number(config.perKmFee)
  const fee = Math.round(Math.min(Number(config.maximumFee), Math.max(Number(config.minimumFee), calculated)))
  return { provider: 'zumbarl_delivery', destination: payload.destination, distanceKm, durationMinutes, distanceSource, fee, currency: 'KES', quoted: true }
}
async function createOrderService(studentId: string | undefined, payload: Record<string, any>) {
  const result = await marketplaceOrdersRepository.createOrderFromCart(studentId, payload) ?? notFound('Cart')
  result.errandNotificationUserIds.forEach((userId: string) => emitRealtimeEvent(userId, { type: 'notification.created', data: { kind: 'ERRAND_AVAILABLE' } }))
  return result.order
}
async function listOrdersService(studentId: string | undefined, query: Record<string, unknown>) {
  if (!studentId) forbidden('A student profile is required')
  if (query.scope === 'selling') {
    const items = await marketplaceOrdersRepository.listSellerOrders(studentId)
    return { items, total: items.length, page: 1, limit: items.length || 1, pages: 1 }
  }
  return marketplaceOrdersRepository.listBuyerOrders(studentId, query)
}
async function updateOrderStatusService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  if (!studentId) forbidden('A student seller profile is required')
  const order = await marketplaceOrdersRepository.findSellerOrder(id, studentId) ?? notFound('Seller order')
  const nextByStatus: Record<string, string> = { seller_confirmation: 'confirmed', confirmed: 'packaging', packaging: 'ready', ready: 'in_transit', in_transit: 'delivered' }
  const next = payload.fulfillmentStatus
  const hasErrandDelivery = order.items.some((item: Record<string, any>) => item.fulfilment?.method === 'errand_delivery')
  if (hasErrandDelivery && ['in_transit', 'delivered'].includes(next)) forbidden('The assigned errander controls collection and delivery after you mark the order ready')
  if (next !== 'cannot_fulfil' && nextByStatus[order.fulfillmentStatus] !== next) forbidden('Order statuses must follow the fulfilment sequence')
  if (next === 'cannot_fulfil' && !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) forbidden('This order can no longer be cancelled after it is marked ready')
  if (next === 'cannot_fulfil') {
    await marketplaceOrdersRepository.cancelSellerOrder(id) ?? forbidden('This order can no longer be cancelled')
    return await marketplaceOrdersRepository.findSellerOrder(id, studentId) ?? notFound('Seller order')
  }
  const patch: Record<string, any> = { fulfillmentStatus: next }
  if (next === 'delivered') {
    const result = await marketplaceOrdersRepository.markDelivered(id)
    const email = result.recipient ? await sendTransactionalEmail(result.recipient.email, 'Confirm receipt of your Zumbarl order', `<p>Hi ${result.recipient.name || 'there'},</p><p>Your seller marked order ${id} as delivered.</p><p>Please confirm receipt in Zumbarl. If you do not respond, payment will be released automatically after 7 days.</p>`) : null
    const sellerOrder = await marketplaceOrdersRepository.findSellerOrder(id, studentId) ?? notFound('Seller order')
    return { ...sellerOrder, notificationEmail: email?.status ?? 'unavailable' }
  }
  if (next === 'ready') {
    const result = await marketplaceOrdersRepository.markOrderReadyForCollection(id)
      ?? forbidden('This order is no longer waiting to be marked ready')
    result.notificationUserIds.forEach((userId: string) => emitRealtimeEvent(userId, {
      type: 'notification.created',
      data: { kind: 'ERRAND_READY_FOR_COLLECTION', orderId: id }
    }))
    return await marketplaceOrdersRepository.findSellerOrder(id, studentId) ?? notFound('Seller order')
  }
  await marketplaceOrdersRepository.updateOrder(id, patch)
  return await marketplaceOrdersRepository.findSellerOrder(id, studentId) ?? notFound('Seller order')
}
async function updateCampusVendorOrderStatusService(userId: string | undefined, slug: string, id: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  const vendor = await marketplaceOrdersRepository.findOwnedCampusVendor(userId, slug) ?? notFound('Managed campus vendor')
  const order = await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
  const nextByStatus: Record<string, string> = { seller_confirmation: 'confirmed', confirmed: 'packaging', packaging: 'ready', ready: 'in_transit', in_transit: 'delivered' }
  const next = payload.fulfillmentStatus
  const hasErrandDelivery = order.items.some((item: Record<string, any>) => item.fulfilment?.method === 'errand_delivery')
  if (hasErrandDelivery && ['in_transit', 'delivered'].includes(next)) forbidden('The assigned errander controls collection and delivery after you mark the order ready')
  if (next !== 'cannot_fulfil' && nextByStatus[order.fulfillmentStatus] !== next) forbidden('Order statuses must follow the fulfilment sequence')
  if (next === 'cannot_fulfil' && !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) forbidden('This order can no longer be cancelled after it is marked ready')
  if (next === 'cannot_fulfil') {
    await marketplaceOrdersRepository.cancelSellerOrder(id) ?? forbidden('This order can no longer be cancelled')
    return await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
  }
  const patch: Record<string, any> = { fulfillmentStatus: next }
  if (next === 'delivered') {
    const result = await marketplaceOrdersRepository.markDelivered(id)
    const email = result.recipient ? await sendTransactionalEmail(result.recipient.email, 'Confirm receipt of your Zumbarl order', `<p>Hi ${result.recipient.name || 'there'},</p><p>${vendor.name} marked order ${id} as delivered.</p><p>Please confirm receipt in Zumbarl. If you do not respond, payment will be released automatically after 7 days.</p>`) : null
    const sellerOrder = await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
    return { ...sellerOrder, notificationEmail: email?.status ?? 'unavailable' }
  }
  if (next === 'ready') {
    const result = await marketplaceOrdersRepository.markOrderReadyForCollection(id, vendor.id)
      ?? forbidden('This order is no longer waiting to be marked ready')
    result.notificationUserIds.forEach((userId: string) => emitRealtimeEvent(userId, {
      type: 'notification.created',
      data: { kind: 'ERRAND_READY_FOR_COLLECTION', orderId: id, shopId: vendor.id }
    }))
    return await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
  }
  await marketplaceOrdersRepository.updateOrder(id, patch)
  return await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
}
async function confirmOrderReceivedService(id: string, studentId: string | undefined) {
  if (!studentId) forbidden('A buyer profile is required')
  const order = await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order')
  if (order.items.some((item: Record<string, any>) => item.fulfilment?.method === 'errand_delivery')) {
    forbidden('The errander completes this delivery using the code shown to the buyer')
  }
  return await marketplaceOrdersRepository.completeBuyerOrder(id, studentId) ?? forbidden('Only the buyer can confirm an order after the seller marks it delivered')
}
async function cancelBuyerOrderService(id: string, studentId: string | undefined) {
  if (!studentId) forbidden('A buyer profile is required')
  return await marketplaceOrdersRepository.cancelBuyerOrder(id, studentId) ?? forbidden('This order cannot be cancelled after packaging has started')
}
async function processMarketplaceDeliveryDeadlinesService(now = new Date()) {
  const result = await marketplaceOrdersRepository.processDeliveryDeadlines(now)
  await Promise.all(result.recipients.map((recipient: Record<string, any>) => sendTransactionalEmail(
    recipient.email,
    `Reminder ${recipient.reminder}: confirm receipt of your Zumbarl order`,
    `<p>Hi ${recipient.name || 'there'},</p><p>Please confirm receipt of order ${recipient.orderId}, or report a problem in Zumbarl.</p><p>Escrow is released automatically 7 days after delivery.</p>`
  )))
  return result
}
async function reviewOrderService(id: string, reviewerId: string | undefined, payload: Record<string, any>) { await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order'); return marketplaceOrdersRepository.createReview({ ...payload, source: 'marketplace-order', sourceId: id, reviewerId }) }
async function disputeOrderService(id: string, studentId: string | undefined, payload: Record<string, any>) {
  if (!studentId) forbidden('A buyer profile is required')
  return await marketplaceOrdersRepository.createOrderDispute(id, studentId, payload)
    ?? forbidden('Only the buyer can dispute a delivered order before its payment is released')
}

export {
  listMarketplaceShopsService,
  createMarketplaceShopService,
  createStudentKitchenService,
  listMarketplaceListingsService,
  createMarketplaceListingService,
  readMyMarketplaceInventoryService,
  listMyCampusVendorsService,
  readCampusVendorProfileService,
  setCampusVendorFollowingService,
  readCampusVendorWorkspaceService,
  readCampusVendorFinanceService,
  requestCampusVendorWithdrawalService,
  searchCampusVendorManagerCandidatesService,
  updateCampusVendorAvailabilityService,
  updateShopErrandsService,
  registerVendorErranderService,
  manageVendorErranderService,
  updateErranderAvailabilityService,
  readMyErrandsService,
  respondToErrandService,
  progressErrandService,
  readBuyerDeliveryCodeService,
  createCampusVendorPostService,
  updateCampusVendorPostService,
  createCampusVendorPromotionService,
  updateCampusVendorForManagerService,
  addCampusVendorManagerForManagerService,
  removeCampusVendorManagerForManagerService,
  updateMyMarketplaceShopService,
  searchMarketplaceLocationsService,
  readMyPendingMarketplaceOffersService,
  decideMarketplaceOfferService,
  readMarketplaceOfferService,
  createOwnedMarketplaceListingService,
  updateOwnedMarketplaceListingService,
  readMarketplaceListingService,
  readCartService,
  addCartItemService,
  removeCartItemService,
  clearCartService,
  updateCartItemFulfilmentService,
  readZumbarlDeliveryConfigService,
  quoteZumbarlDeliveryService,
  createOrderService,
  listOrdersService,
  updateOrderStatusService,
  updateCampusVendorOrderStatusService,
  confirmOrderReceivedService,
  cancelBuyerOrderService,
  processMarketplaceDeliveryDeadlinesService,
  reviewOrderService,
  disputeOrderService,
  readMarketplaceSellerService,
  startMarketplaceChatService,
  createMarketplaceOfferService,
  recordMarketplaceSellerViewService
}
