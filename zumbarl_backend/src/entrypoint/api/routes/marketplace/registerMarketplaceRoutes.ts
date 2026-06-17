import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { addCartItemController, createMarketplaceListingController, createMarketplaceShopController, createOrderController, disputeOrderController, listMarketplaceListingsController, listMarketplaceShopsController, listOrdersController, readCartController, readMarketplaceListingController, reviewOrderController, updateOrderStatusController } from '../../controllers/marketplace/index.js'
async function registerMarketplaceRoutes(app: FastifyInstance) {
  const students = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/shops', { preHandler: students }, listMarketplaceShopsController)
  app.post('/shops', { preHandler: students }, createMarketplaceShopController)
  app.get('/listings', { preHandler: students }, listMarketplaceListingsController)
  app.post('/shops/:id/listings', { preHandler: students }, createMarketplaceListingController)
  app.get('/listings/:id', { preHandler: students }, readMarketplaceListingController)
  app.get('/cart', { preHandler: students }, readCartController)
  app.post('/cart/items', { preHandler: students }, addCartItemController)
  app.post('/orders', { preHandler: students }, createOrderController)
  app.get('/orders', { preHandler: students }, listOrdersController)
  app.post('/orders/:id/status', { preHandler: students }, updateOrderStatusController)
  app.post('/orders/:id/reviews', { preHandler: students }, reviewOrderController)
  app.post('/orders/:id/disputes', { preHandler: students }, disputeOrderController)
}

export {
  registerMarketplaceRoutes
}
