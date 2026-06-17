import { notFound } from '../../../lib/http.js'
import { marketplaceOrdersRepository } from '../../repositories/marketplace/index.js'
const listMarketplaceShopsService = (query: Record<string, unknown>) => marketplaceOrdersRepository.listShops(query)
const createMarketplaceShopService = (studentId: string | undefined, payload: Record<string, any>) => marketplaceOrdersRepository.createShop({ ...payload, studentId, status: 'open', score: 0 })
const listMarketplaceListingsService = (query: Record<string, unknown>) => marketplaceOrdersRepository.listListings(query)
async function createMarketplaceListingService(shopId: string, payload: Record<string, any>) { await marketplaceOrdersRepository.findShop(shopId) ?? notFound('Shop'); return marketplaceOrdersRepository.createListing({ ...payload, shopId, status: 'published' }) }
async function readMarketplaceListingService(id: string) { const listing = await marketplaceOrdersRepository.findListing(id) ?? notFound('Listing'); return { listing, shop: await marketplaceOrdersRepository.findShop(listing.shopId) } }
async function readCartService(studentId: string | undefined) { return marketplaceOrdersRepository.findOrCreateOpenCart(studentId) }
async function addCartItemService(studentId: string | undefined, payload: Record<string, any>) { return await marketplaceOrdersRepository.addCartItem(studentId, payload) ?? notFound('Listing') }
async function createOrderService(studentId: string | undefined, payload: Record<string, any>) { return await marketplaceOrdersRepository.createOrderFromCart(studentId, payload) ?? notFound('Cart') }
const listOrdersService = (query: Record<string, unknown>) => marketplaceOrdersRepository.listOrders(query)
async function updateOrderStatusService(id: string, payload: Record<string, any>) { await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order'); const patch: Record<string, any> = { fulfillmentStatus: payload.fulfillmentStatus }; if (payload.fulfillmentStatus === 'cannot_fulfil') patch.status = 'refund_required'; if (payload.fulfillmentStatus === 'completed') patch.status = 'completed'; return marketplaceOrdersRepository.updateOrder(id, patch) }
async function reviewOrderService(id: string, reviewerId: string | undefined, payload: Record<string, any>) { await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order'); return marketplaceOrdersRepository.createReview({ ...payload, source: 'marketplace-order', sourceId: id, reviewerId }) }
async function disputeOrderService(id: string, payload: Record<string, any>) { await marketplaceOrdersRepository.findOrder(id) ?? notFound('Order'); return marketplaceOrdersRepository.createDispute({ ...payload, scope: 'marketplace-order', scopeId: id, status: 'open' }) }

export {
  listMarketplaceShopsService,
  createMarketplaceShopService,
  listMarketplaceListingsService,
  createMarketplaceListingService,
  readMarketplaceListingService,
  readCartService,
  addCartItemService,
  createOrderService,
  listOrdersService,
  updateOrderStatusService,
  reviewOrderService,
  disputeOrderService
}
