import { forbidden, notFound } from '../../../lib/http.js'
import { marketplaceOrdersRepository } from '../../repositories/marketplace/index.js'
import { sendTransactionalEmail } from '../../notification/index.js'
import { createMessageService } from '../connect/index.js'
import { env } from '../../../config/env.js'

async function roadDistanceKm(sellerLatitude: number, sellerLongitude: number, buyerLatitude: number, buyerLongitude: number) {
  const coordinates = `${sellerLongitude},${sellerLatitude};${buyerLongitude},${buyerLatitude}`
  const url = `${env.OSRM_BASE_URL.replace(/\/$/, '')}/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`
  const response = await fetch(url, { signal: AbortSignal.timeout(env.OSRM_TIMEOUT_MS) })
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

const readMarketplaceSellerService = async (username: string) => (
  await marketplaceOrdersRepository.findSellerByUsername(username) ?? notFound('Seller')
)

async function startMarketplaceChatService(actorUserId: string | undefined, listingReference: string, payload: Record<string, any>) {
  await assertListingCanReceiveBuyerActions(listingReference, payload.sellerUsername)
  const { actor, seller } = await readMarketplaceParticipants(actorUserId, payload.sellerUsername)
  const body = `Hi, I'm ${actor.name}. I'm interested in ${payload.product.title}. Is it still available?`
  const message = await createMessageService(actor.id, {
    recipientId: seller.userId,
    body,
    fileUrls: [],
    context: { type: 'marketplace_product', product: payload.product }
  })
  await marketplaceOrdersRepository.createSellerNotification({
    userId: seller.userId,
    type: 'MARKETPLACE_MESSAGE',
    title: `New message about ${payload.product.title}`,
    body: `${actor.name} asked whether your listing is available.`,
    data: {
      listingReference,
      product: payload.product,
      buyerUserId: actor.id,
      deepLink: `/messages?participantId=${actor.id}`,
      href: `/messages?participantId=${actor.id}`
    }
  })
  return { message, seller }
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
  const message = await createMessageService(actor.id, {
    recipientId: seller.userId,
    body: `I'd like to offer ${amount} for ${payload.product.title}.`,
    fileUrls: [],
    context: {
      type: 'marketplace_offer',
      product: payload.product,
      offer: { id: offer.id, amount: offer.amount, currency: offer.currency }
    }
  })
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
      deepLink: `/messages?participantId=${actor.id}`,
      href: `/messages?participantId=${actor.id}`
    }
  })
  return { offer, message, seller, revised: Boolean(revisedOffer) }
}
async function readMarketplaceOfferService(userId: string | undefined, offerId: string) {
  if (!userId) forbidden('Authentication is required')
  const offer = await marketplaceOrdersRepository.findOffer(offerId) ?? notFound('Offer')
  if (offer.buyerId !== userId && offer.sellerId !== userId) forbidden('You are not part of this offer')
  return { offer }
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
const listMarketplaceShopsService = (query: Record<string, unknown>) => marketplaceOrdersRepository.listShops(query)
const createMarketplaceShopService = (studentId: string | undefined, payload: Record<string, any>) => marketplaceOrdersRepository.createShop({ ...payload, studentId, status: 'open', score: 0 })
const listMarketplaceListingsService = (query: Record<string, unknown>) => marketplaceOrdersRepository.listListings(query)
async function createMarketplaceListingService(studentId: string | undefined, userId: string | undefined, shopId: string, payload: Record<string, any>) {
  if (!studentId || !userId) forbidden('A student vendor operator profile is required')
  const shop = await marketplaceOrdersRepository.findShop(shopId) ?? notFound('Shop')
  if (shop.ownerId !== studentId && !(await marketplaceOrdersRepository.userManagesShop(userId, shopId))) forbidden('You can only add inventory to a shop you manage')
  const isCampusHotel = shop.entityType === 'campus_vendor' && shop.vendorType === 'hotel'
  const foodCategories = new Set(['Meals', 'Snacks', 'Drinks', 'Baked goods', 'Fresh food', 'Other food'])
  const normalizedPayload = isCampusHotel ? {
    ...payload,
    kind: 'service',
    serviceMode: 'order_ahead',
    inventoryType: 'food',
    campusOnly: true,
    category: foodCategories.has(payload.category) ? payload.category : 'Meals',
    condition: undefined,
    negotiable: false,
    deliveryOptions: ['Campus pickup'],
    locationLabel: payload.locationLabel || shop.locationLabel || shop.campus || 'Campus pickup',
    latitude: payload.latitude ?? shop.latitude ?? undefined,
    longitude: payload.longitude ?? shop.longitude ?? undefined,
    pickupInstructions: payload.pickupInstructions || `Collect from ${shop.name} on campus.`,
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
async function readCampusVendorProfileService(slug: string, viewerStudentId?: string, viewerUserId?: string) {
  return await marketplaceOrdersRepository.readCampusVendorProfile(slug, viewerStudentId, viewerUserId) ?? notFound('Campus vendor')
}
async function setCampusVendorFollowingService(userId: string | undefined, slug: string, active: boolean) {
  if (!userId) forbidden('Authentication is required')
  return await marketplaceOrdersRepository.setCampusVendorFollowing(userId, slug, active) ?? notFound('Campus vendor')
}
async function updateCampusVendorAvailabilityService(userId: string | undefined, slug: string, acceptingOrders: boolean) {
  if (!userId) forbidden('A vendor manager account is required')
  return await marketplaceOrdersRepository.updateCampusVendorAvailability(userId, slug, acceptingOrders) ?? notFound('Managed campus vendor')
}
async function searchCampusVendorManagerCandidatesService(userId: string | undefined, slug: string, query: string) {
  if (!userId) forbidden('A vendor manager account is required')
  const candidates = await marketplaceOrdersRepository.searchCampusVendorManagerCandidates(userId, slug, query)
  if (!candidates) forbidden('Only vendor owners and admins can search for teammates')
  return { candidates }
}
async function createCampusVendorPostService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  return await marketplaceOrdersRepository.createCampusVendorPost(userId, slug, payload) ?? notFound('Managed campus vendor')
}
async function updateCampusVendorPostService(userId: string | undefined, slug: string, postId: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  return await marketplaceOrdersRepository.updateCampusVendorPost(userId, slug, postId, payload) ?? notFound('Vendor post')
}
async function createCampusVendorPromotionService(userId: string | undefined, slug: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
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
  const response = await fetch(url, { headers: { 'User-Agent': 'Zumbarl/1.0 location-search' }, signal: AbortSignal.timeout(5000) })
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
  if (decision === 'accepted') {
    const listing = await marketplaceOrdersRepository.findListing(pending.listingReference) ?? notFound('Listing')
    const minimumOffer = Number(listing.minimumOffer)
    if (Number.isFinite(minimumOffer) && minimumOffer > 0 && Number(pending.amount) < minimumOffer) {
      forbidden('This offer is below the listing minimum and cannot be accepted')
    }
  }
  const offer = await marketplaceOrdersRepository.decidePendingOffer(offerId, userId, decision) ?? notFound('Pending offer')
  const product = offer.product as Record<string, any>
  const amount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: offer.currency, maximumFractionDigits: 0 }).format(offer.amount)
  await createMessageService(userId, {
    recipientId: offer.buyerId,
    body: decision === 'accepted'
      ? `Your ${amount} offer for ${product.title || 'this item'} was accepted. Let’s arrange the handoff.`
      : `Your ${amount} offer for ${product.title || 'this item'} was declined.`,
    fileUrls: [],
    context: { type: 'marketplace_offer', product, offer: { id: offer.id, amount: offer.amount, currency: offer.currency, status: decision } }
  })
  await marketplaceOrdersRepository.createSellerNotification({
    userId: offer.buyerId,
    type: decision === 'accepted' ? 'MARKETPLACE_OFFER_ACCEPTED' : 'MARKETPLACE_OFFER_DECLINED',
    title: decision === 'accepted' ? 'Your offer was accepted' : 'Offer update',
    body: decision === 'accepted'
      ? `The seller accepted your ${amount} offer for ${product.title || 'a marketplace item'}.`
      : `The seller declined your ${amount} offer for ${product.title || 'a marketplace item'}.`,
    data: { offerId: offer.id, product, decision, deepLink: `/messages?participantId=${userId}`, href: `/messages?participantId=${userId}` }
  })
  return { offer }
}
async function createOwnedMarketplaceListingService(studentId: string | undefined, payload: Record<string, any>) {
  if (!studentId) forbidden('A student seller profile is required')
  const shop = await marketplaceOrdersRepository.findOwnedShop(studentId)
    ?? await marketplaceOrdersRepository.createDefaultShop(studentId)
    ?? notFound('Student shop')
  return marketplaceOrdersRepository.createListing({ ...payload, shopId: shop.id, status: payload.status || 'ACTIVE' })
}
async function updateOwnedMarketplaceListingService(studentId: string | undefined, userId: string | undefined, listingId: string, payload: Record<string, any>) {
  if (!studentId || !userId) forbidden('A student vendor operator profile is required')
  const listing = await marketplaceOrdersRepository.findListing(listingId) ?? notFound('Listing')
  const canManage = listing.seller?.studentId === studentId || (listing.shopId && await marketplaceOrdersRepository.userManagesShop(userId, listing.shopId))
  if (!canManage) forbidden('You can only edit inventory for a shop you manage')
  return await marketplaceOrdersRepository.updateOwnedListing(listingId, listing.seller?.studentId || studentId, payload)
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
async function createOrderService(studentId: string | undefined, payload: Record<string, any>) { return await marketplaceOrdersRepository.createOrderFromCart(studentId, payload) ?? notFound('Cart') }
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
  if (next !== 'cannot_fulfil' && nextByStatus[order.fulfillmentStatus] !== next) forbidden('Order statuses must follow the fulfilment sequence')
  if (next === 'cannot_fulfil' && !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) forbidden('This order can no longer be cancelled after it is marked ready')
  if (next === 'cannot_fulfil') return await marketplaceOrdersRepository.cancelSellerOrder(id) ?? forbidden('This order can no longer be cancelled')
  const patch: Record<string, any> = { fulfillmentStatus: next }
  if (next === 'delivered') {
    const result = await marketplaceOrdersRepository.markDelivered(id)
    const email = result.recipient ? await sendTransactionalEmail(result.recipient.email, 'Confirm receipt of your Zumbarl order', `<p>Hi ${result.recipient.name || 'there'},</p><p>Your seller marked order ${id} as delivered.</p><p>Please confirm receipt in Zumbarl. If you do not respond, payment will be released automatically after 7 days.</p>`) : null
    return { ...result.order, notificationEmail: email?.status ?? 'unavailable' }
  }
  return marketplaceOrdersRepository.updateOrder(id, patch)
}
async function updateCampusVendorOrderStatusService(userId: string | undefined, slug: string, id: string, payload: Record<string, any>) {
  if (!userId) forbidden('A vendor manager account is required')
  const vendor = await marketplaceOrdersRepository.findOwnedCampusVendor(userId, slug) ?? notFound('Managed campus vendor')
  const order = await marketplaceOrdersRepository.findShopSellerOrder(id, vendor.id) ?? notFound('Vendor order')
  const nextByStatus: Record<string, string> = { seller_confirmation: 'confirmed', confirmed: 'packaging', packaging: 'ready', ready: 'in_transit', in_transit: 'delivered' }
  const next = payload.fulfillmentStatus
  if (next !== 'cannot_fulfil' && nextByStatus[order.fulfillmentStatus] !== next) forbidden('Order statuses must follow the fulfilment sequence')
  if (next === 'cannot_fulfil' && !['seller_confirmation', 'confirmed', 'packaging'].includes(order.fulfillmentStatus)) forbidden('This order can no longer be cancelled after it is marked ready')
  if (next === 'cannot_fulfil') return await marketplaceOrdersRepository.cancelSellerOrder(id) ?? forbidden('This order can no longer be cancelled')
  const patch: Record<string, any> = { fulfillmentStatus: next }
  if (next === 'delivered') {
    const result = await marketplaceOrdersRepository.markDelivered(id)
    const email = result.recipient ? await sendTransactionalEmail(result.recipient.email, 'Confirm receipt of your Zumbarl order', `<p>Hi ${result.recipient.name || 'there'},</p><p>${vendor.name} marked order ${id} as delivered.</p><p>Please confirm receipt in Zumbarl. If you do not respond, payment will be released automatically after 7 days.</p>`) : null
    return { ...result.order, notificationEmail: email?.status ?? 'unavailable' }
  }
  return marketplaceOrdersRepository.updateOrder(id, patch)
}
async function confirmOrderReceivedService(id: string, studentId: string | undefined) {
  if (!studentId) forbidden('A buyer profile is required')
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
async function disputeOrderService(id: string, payload: Record<string, any>) { await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order'); return marketplaceOrdersRepository.createDispute({ ...payload, scope: 'marketplace-order', scopeId: id, status: 'open' }) }

export {
  listMarketplaceShopsService,
  createMarketplaceShopService,
  listMarketplaceListingsService,
  createMarketplaceListingService,
  readMyMarketplaceInventoryService,
  listMyCampusVendorsService,
  readCampusVendorProfileService,
  setCampusVendorFollowingService,
  readCampusVendorWorkspaceService,
  searchCampusVendorManagerCandidatesService,
  updateCampusVendorAvailabilityService,
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
