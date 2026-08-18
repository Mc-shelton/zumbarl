import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

const FALLBACK_PRODUCT_IMAGE = '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp'

function mapMarketplaceApiListing(listing) {
  if (!listing) return null
  const images = (listing.images || listing.gallery || []).map((image) => normalizeZumbarlFileUrl(image)).filter(Boolean)
  const priceAmount = Number(listing.priceAmount || 0)
  return {
    ...listing,
    id: listing.id,
    title: listing.title,
    subtitle: listing.subtitle || `${listing.condition || 'Available'} from ${listing.seller?.name || 'a verified campus seller'}.`,
    category: listing.category || 'Other',
    categoryPath: listing.categoryPath || listing.category || 'Other',
    priceAmount,
    price: new Intl.NumberFormat('en-KE', { style: 'currency', currency: listing.currency || 'KES', maximumFractionDigits: 0 }).format(priceAmount),
    location: listing.locationLabel || listing.seller?.campus || 'Campus pickup',
    image: images[0] || FALLBACK_PRODUCT_IMAGE,
    galleryImages: images.length ? images : [FALLBACK_PRODUCT_IMAGE],
    posted: listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : 'Recently',
    postedOn: listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
    badge: listing.status === 'published' ? 'Available' : String(listing.status || 'Available').replace(/^./, (letter) => letter.toUpperCase()),
    stock: listing.stock ?? listing.stockCount ?? 1,
    seller: listing.seller,
  }
}

function listMarketplaceListings() {
  return sendZumbarlApiRequest('/marketplace/listings')
}

function readMarketplaceListing(id) {
  return sendZumbarlApiRequest(`/marketplace/listings/${encodeURIComponent(id)}`)
}

function readMyMarketplaceInventory() {
  return sendZumbarlApiRequest('/marketplace/my/listings')
}

function updateMyMarketplaceShop(payload) {
  return sendZumbarlApiRequest('/marketplace/my/shop', { method: 'PATCH', body: JSON.stringify(payload) })
}

function searchMarketplaceLocations(query) {
  return sendZumbarlApiRequest(`/marketplace/locations/search?q=${encodeURIComponent(query)}`)
}

function readMyPendingMarketplaceOffers() {
  return sendZumbarlApiRequest('/marketplace/my/offers')
}

function readMyMarketplaceSales() {
  return sendZumbarlApiRequest('/marketplace/orders?scope=selling&limit=100')
}

function readMyMarketplaceOrders() {
  return sendZumbarlApiRequest('/marketplace/orders?pageSize=100')
}

function updateMarketplaceSaleStatus(id, fulfillmentStatus) {
  return sendZumbarlApiRequest(`/marketplace/orders/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ fulfillmentStatus }),
  })
}

function confirmMarketplaceOrderReceived(id) {
  return sendZumbarlApiRequest(`/marketplace/orders/${encodeURIComponent(id)}/received`, { method: 'POST' })
}

function cancelMarketplaceOrder(id) {
  return sendZumbarlApiRequest(`/marketplace/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
}

function decideMarketplaceOffer(id, decision) {
  return sendZumbarlApiRequest(`/marketplace/my/offers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  })
}

function addAcceptedOfferToCart(listingId, offerId) {
  return sendZumbarlApiRequest('/marketplace/cart/items', {
    method: 'POST',
    body: JSON.stringify({ listingId, offerId, quantity: 1 }),
  })
}

function addMarketplaceListingToCart(listingId, quantity = 1) {
  return sendZumbarlApiRequest('/marketplace/cart/items', {
    method: 'POST',
    body: JSON.stringify({ listingId, quantity }),
  })
}

function readMarketplaceCart() {
  return sendZumbarlApiRequest('/marketplace/cart')
}

function createMarketplaceOrder(payload) {
  return sendZumbarlApiRequest('/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function removeMarketplaceCartItem(listingId) {
  return sendZumbarlApiRequest(`/marketplace/cart/items/${encodeURIComponent(listingId)}`, { method: 'DELETE' })
}

function clearMarketplaceCart() {
  return sendZumbarlApiRequest('/marketplace/cart', { method: 'DELETE' })
}

function updateMarketplaceCartItemFulfilment(listingId, fulfilment) {
  return sendZumbarlApiRequest(`/marketplace/cart/items/${encodeURIComponent(listingId)}/fulfilment`, {
    method: 'PATCH',
    body: JSON.stringify(fulfilment),
  })
}

function readZumbarlDeliveryConfig() {
  return sendZumbarlApiRequest('/marketplace/delivery/config')
}

function quoteZumbarlDelivery(listingId, destination, buyerLatitude, buyerLongitude) {
  return sendZumbarlApiRequest('/marketplace/delivery/quote', {
    method: 'POST',
    body: JSON.stringify({ listingId, destination, buyerLatitude, buyerLongitude }),
  })
}

function readMarketplaceOffer(id) {
  return sendZumbarlApiRequest(`/marketplace/offers/${encodeURIComponent(id)}`)
}

function createMarketplaceListing(payload) {
  return sendZumbarlApiRequest('/marketplace/my/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateMarketplaceListing(id, payload) {
  return sendZumbarlApiRequest(`/marketplace/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function readMarketplaceSeller(username) {
  return sendZumbarlApiRequest(`/marketplace/sellers/${encodeURIComponent(username)}`)
}

function startMarketplaceChat(listingReference, payload) {
  return sendZumbarlApiRequest(`/marketplace/listings/${encodeURIComponent(listingReference)}/contact`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function sendMarketplaceOffer(listingReference, payload) {
  return sendZumbarlApiRequest(`/marketplace/listings/${encodeURIComponent(listingReference)}/offers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function recordMarketplaceSellerView(username, product) {
  return sendZumbarlApiRequest(`/marketplace/sellers/${encodeURIComponent(username)}/views`, {
    method: 'POST',
    body: JSON.stringify({ product }),
  })
}

export {
  createMarketplaceListing,
  createMarketplaceOrder,
  addAcceptedOfferToCart,
  addMarketplaceListingToCart,
  clearMarketplaceCart,
  confirmMarketplaceOrderReceived,
  cancelMarketplaceOrder,
  decideMarketplaceOffer,
  listMarketplaceListings,
  mapMarketplaceApiListing,
  readMarketplaceListing,
  readMarketplaceOffer,
  readMarketplaceCart,
  readZumbarlDeliveryConfig,
  removeMarketplaceCartItem,
  readMarketplaceSeller,
  readMyMarketplaceInventory,
  updateMyMarketplaceShop,
  searchMarketplaceLocations,
  readMyPendingMarketplaceOffers,
  readMyMarketplaceSales,
  readMyMarketplaceOrders,
  recordMarketplaceSellerView,
  sendMarketplaceOffer,
  startMarketplaceChat,
  updateMarketplaceListing,
  updateMarketplaceSaleStatus,
  updateMarketplaceCartItemFulfilment,
  quoteZumbarlDelivery,
}
