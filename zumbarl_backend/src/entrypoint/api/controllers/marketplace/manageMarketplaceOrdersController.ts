import type { FastifyReply, FastifyRequest } from 'fastify'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { cartItemSchema, disputeOrderSchema, listingSchema, marketplaceReviewSchema, orderSchema, orderStatusSchema, shopSchema } from '../../../validators/marketplace/index.js'
import { addCartItemService, createMarketplaceListingService, createMarketplaceShopService, createOrderService, disputeOrderService, listMarketplaceListingsService, listMarketplaceShopsService, listOrdersService, readCartService, readMarketplaceListingService, reviewOrderService, updateOrderStatusService } from '../../../../adapters/services/marketplace/index.js'
async function listMarketplaceShopsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listMarketplaceShopsService(request.query as Record<string, unknown>)) }
async function createMarketplaceShopController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createMarketplaceShopService(request.authUser?.studentId, requireBody(shopSchema, request))) }
async function listMarketplaceListingsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listMarketplaceListingsService(request.query as Record<string, unknown>)) }
async function createMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await createMarketplaceListingService(id, requireBody(listingSchema, request))) }
async function readMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readMarketplaceListingService(id)) }
async function readCartController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readCartService(request.authUser?.studentId)) }
async function addCartItemController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await addCartItemService(request.authUser?.studentId, requireBody(cartItemSchema, request))) }
async function createOrderController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createOrderService(request.authUser?.studentId, requireBody(orderSchema, request))) }
async function listOrdersController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listOrdersService(request.query as Record<string, unknown>)) }
async function updateOrderStatusController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateOrderStatusService(id, requireBody(orderStatusSchema, request))) }
async function reviewOrderController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await reviewOrderService(id, request.authUser?.id, requireBody(marketplaceReviewSchema, request))) }
async function disputeOrderController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await disputeOrderService(id, requireBody(disputeOrderSchema, request))) }

export {
  listMarketplaceShopsController,
  createMarketplaceShopController,
  listMarketplaceListingsController,
  createMarketplaceListingController,
  readMarketplaceListingController,
  readCartController,
  addCartItemController,
  createOrderController,
  listOrdersController,
  updateOrderStatusController,
  reviewOrderController,
  disputeOrderController
}
