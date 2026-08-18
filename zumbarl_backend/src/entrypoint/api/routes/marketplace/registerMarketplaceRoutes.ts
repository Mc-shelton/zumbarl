import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { addCartItemController, cancelBuyerOrderController, clearCartController, confirmOrderReceivedController, createMarketplaceListingController, createMarketplaceOfferController, createMarketplaceShopController, createOrderController, createOwnedMarketplaceListingController, decideMarketplaceOfferController, disputeOrderController, listMarketplaceListingsController, listMarketplaceShopsController, listOrdersController, quoteZumbarlDeliveryController, readCartController, readMarketplaceListingController, readMarketplaceOfferController, readMarketplaceSellerController, readMyMarketplaceInventoryController, readMyPendingMarketplaceOffersController, readZumbarlDeliveryConfigController, recordMarketplaceSellerViewController, removeCartItemController, reviewOrderController, searchMarketplaceLocationsController, startMarketplaceChatController, updateCartItemFulfilmentController, updateMyMarketplaceShopController, updateOrderStatusController, updateOwnedMarketplaceListingController } from '../../controllers/marketplace/index.js'
async function registerMarketplaceRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/shops', { preHandler: students }, listMarketplaceShopsController)
  app.post('/shops', { preHandler: students }, createMarketplaceShopController)
  app.get('/listings', { preHandler: students }, listMarketplaceListingsController)
  app.get('/my/listings', { preHandler: students }, readMyMarketplaceInventoryController)
  app.patch('/my/shop', { preHandler: students }, updateMyMarketplaceShopController)
  app.get('/locations/search', { preHandler: students }, searchMarketplaceLocationsController)
  app.get('/my/offers', { preHandler: students }, readMyPendingMarketplaceOffersController)
  app.patch('/my/offers/:id', { preHandler: students }, decideMarketplaceOfferController)
  app.get('/offers/:id', { preHandler: students }, readMarketplaceOfferController)
  app.post('/my/listings', { preHandler: students }, createOwnedMarketplaceListingController)
  app.post('/shops/:id/listings', { preHandler: students }, createMarketplaceListingController)
  app.get('/listings/:id', { preHandler: students }, readMarketplaceListingController)
  app.patch('/listings/:id', { preHandler: students }, updateOwnedMarketplaceListingController)
  app.post('/listings/:id/contact', { preHandler: students }, startMarketplaceChatController)
  app.post('/listings/:id/offers', { preHandler: students }, createMarketplaceOfferController)
  app.get('/sellers/:username', { preHandler: students }, readMarketplaceSellerController)
  app.post('/sellers/:username/views', { preHandler: students }, recordMarketplaceSellerViewController)
  app.get('/cart', { preHandler: students }, readCartController)
  app.post('/cart/items', { preHandler: students }, addCartItemController)
  app.delete('/cart/items/:id', { preHandler: students }, removeCartItemController)
  app.delete('/cart', { preHandler: students }, clearCartController)
  app.patch('/cart/items/:id/fulfilment', { preHandler: students }, updateCartItemFulfilmentController)
  app.get('/delivery/config', { preHandler: students }, readZumbarlDeliveryConfigController)
  app.post('/delivery/quote', { preHandler: students }, quoteZumbarlDeliveryController)
  app.post('/orders', { preHandler: students }, createOrderController)
  app.get('/orders', { preHandler: students }, listOrdersController)
  app.post('/orders/:id/status', { preHandler: students }, updateOrderStatusController)
  app.post('/orders/:id/received', { preHandler: students }, confirmOrderReceivedController)
  app.post('/orders/:id/cancel', { preHandler: students }, cancelBuyerOrderController)
  app.post('/orders/:id/reviews', { preHandler: students }, reviewOrderController)
  app.post('/orders/:id/disputes', { preHandler: students }, disputeOrderController)
}

export {
  registerMarketplaceRoutes
}
