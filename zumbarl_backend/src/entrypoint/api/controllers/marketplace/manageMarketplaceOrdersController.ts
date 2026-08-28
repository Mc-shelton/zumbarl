import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { idParamSchema, requireBody, requireParams } from '../../../../lib/http.js'
import { campusVendorListingSchema, cartItemFulfilmentSchema, cartItemSchema, disputeOrderSchema, listingSchema, managedVendorAvailabilitySchema, managedVendorManagerSchema, managedVendorUpdateSchema, marketplaceContactSchema, marketplaceListingUpdateSchema, marketplaceLocationSearchSchema, marketplaceOfferDecisionSchema, marketplaceOfferSchema, marketplaceProfileViewSchema, marketplaceReviewSchema, marketplaceShopUpdateSchema, orderSchema, orderStatusSchema, shopSchema, vendorPostSchema, vendorPostUpdateSchema, vendorPromotionSchema, zumbarlDeliveryQuoteSchema } from '../../../validators/marketplace/index.js'
import { addCampusVendorManagerForManagerService, addCartItemService, cancelBuyerOrderService, clearCartService, confirmOrderReceivedService, createCampusVendorPostService, createCampusVendorPromotionService, createMarketplaceListingService, createMarketplaceOfferService, createMarketplaceShopService, createOrderService, createOwnedMarketplaceListingService, decideMarketplaceOfferService, disputeOrderService, listMarketplaceListingsService, listMarketplaceShopsService, listMyCampusVendorsService, listOrdersService, quoteZumbarlDeliveryService, readCampusVendorProfileService, readCampusVendorWorkspaceService, readCartService, readMarketplaceListingService, readMarketplaceOfferService, readMarketplaceSellerService, readMyMarketplaceInventoryService, readMyPendingMarketplaceOffersService, readZumbarlDeliveryConfigService, recordMarketplaceSellerViewService, removeCampusVendorManagerForManagerService, removeCartItemService, reviewOrderService, searchCampusVendorManagerCandidatesService, searchMarketplaceLocationsService, setCampusVendorFollowingService, startMarketplaceChatService, updateCampusVendorAvailabilityService, updateCampusVendorForManagerService, updateCampusVendorOrderStatusService, updateCampusVendorPostService, updateCartItemFulfilmentService, updateMyMarketplaceShopService, updateOrderStatusService, updateOwnedMarketplaceListingService } from '../../../../adapters/services/marketplace/index.js'
const usernameParamSchema = z.object({ username: z.string().min(1) })
const vendorSlugParamSchema = z.object({ slug: z.string().min(1) })
const vendorOrderParamsSchema = z.object({ slug: z.string().min(1), id: z.string().min(1) })
async function listMarketplaceShopsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listMarketplaceShopsService(request.query as Record<string, unknown>)) }
async function createMarketplaceShopController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createMarketplaceShopService(request.authUser?.studentId, requireBody(shopSchema, request))) }
async function listMarketplaceListingsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listMarketplaceListingsService(request.query as Record<string, unknown>, request.authUser?.studentId)) }
async function createMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await createMarketplaceListingService(request.authUser?.studentId, request.authUser?.id, id, requireBody(campusVendorListingSchema, request))) }
async function readMyMarketplaceInventoryController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readMyMarketplaceInventoryService(request.authUser?.studentId)) }
async function listMyCampusVendorsController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listMyCampusVendorsService(request.authUser?.id)) }
async function readCampusVendorProfileController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.send(await readCampusVendorProfileService(slug, request.authUser?.studentId, request.authUser?.id)) }
async function setCampusVendorFollowingController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.send(await setCampusVendorFollowingService(request.authUser?.id, slug, request.method === 'POST')) }
async function readCampusVendorWorkspaceController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.send(await readCampusVendorWorkspaceService(request.authUser?.id, slug)) }
async function searchCampusVendorManagerCandidatesController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); const { q } = z.object({ q: z.string().trim().min(2).max(80) }).parse(request.query); return reply.send(await searchCampusVendorManagerCandidatesService(request.authUser?.id, slug, q)) }
async function updateCampusVendorAvailabilityController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); const { acceptingOrders } = requireBody(managedVendorAvailabilitySchema, request); return reply.send(await updateCampusVendorAvailabilityService(request.authUser?.id, slug, acceptingOrders)) }
async function updateCampusVendorOrderStatusController(request: FastifyRequest, reply: FastifyReply) { const { slug, id } = requireParams(vendorOrderParamsSchema, request); return reply.send(await updateCampusVendorOrderStatusService(request.authUser?.id, slug, id, requireBody(orderStatusSchema, request))) }
async function createCampusVendorPostController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.code(201).send(await createCampusVendorPostService(request.authUser?.id, slug, requireBody(vendorPostSchema, request))) }
async function updateCampusVendorPostController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ slug: z.string(), postId: z.string() }).parse(request.params); return reply.send(await updateCampusVendorPostService(request.authUser?.id, params.slug, params.postId, requireBody(vendorPostUpdateSchema, request))) }
async function createCampusVendorPromotionController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.code(201).send(await createCampusVendorPromotionService(request.authUser?.id, slug, requireBody(vendorPromotionSchema, request))) }
async function updateCampusVendorForManagerController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.send(await updateCampusVendorForManagerService(request.authUser?.id, slug, requireBody(managedVendorUpdateSchema, request))) }
async function addCampusVendorManagerForManagerController(request: FastifyRequest, reply: FastifyReply) { const { slug } = requireParams(vendorSlugParamSchema, request); return reply.code(201).send(await addCampusVendorManagerForManagerService(request.authUser?.id, slug, requireBody(managedVendorManagerSchema, request))) }
async function removeCampusVendorManagerForManagerController(request: FastifyRequest, reply: FastifyReply) { const params = z.object({ slug: z.string(), userId: z.string() }).parse(request.params); return reply.send(await removeCampusVendorManagerForManagerService(request.authUser?.id, params.slug, params.userId)) }
async function updateMyMarketplaceShopController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await updateMyMarketplaceShopService(request.authUser?.studentId, requireBody(marketplaceShopUpdateSchema, request))) }
async function searchMarketplaceLocationsController(request: FastifyRequest, reply: FastifyReply) { const { q } = marketplaceLocationSearchSchema.parse(request.query); return reply.send(await searchMarketplaceLocationsService(q)) }
async function readMyPendingMarketplaceOffersController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readMyPendingMarketplaceOffersService(request.authUser?.id)) }
async function decideMarketplaceOfferController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); const { decision } = requireBody(marketplaceOfferDecisionSchema, request); return reply.send(await decideMarketplaceOfferService(request.authUser?.id, id, decision)) }
async function readMarketplaceOfferController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readMarketplaceOfferService(request.authUser?.id, id)) }
async function createOwnedMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createOwnedMarketplaceListingService(request.authUser?.studentId, requireBody(listingSchema, request))) }
async function updateOwnedMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateOwnedMarketplaceListingService(request.authUser?.studentId, request.authUser?.id, id, requireBody(marketplaceListingUpdateSchema, request))) }
async function readMarketplaceListingController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await readMarketplaceListingService(id, request.authUser?.id)) }
async function readCartController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await readCartService(request.authUser?.studentId)) }
async function addCartItemController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await addCartItemService(request.authUser?.studentId, request.authUser?.id, requireBody(cartItemSchema, request))) }
async function removeCartItemController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await removeCartItemService(request.authUser?.studentId, id)) }
async function clearCartController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await clearCartService(request.authUser?.studentId)) }
async function updateCartItemFulfilmentController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateCartItemFulfilmentService(request.authUser?.studentId, id, requireBody(cartItemFulfilmentSchema, request))) }
async function readZumbarlDeliveryConfigController(_request: FastifyRequest, reply: FastifyReply) { return reply.send(await readZumbarlDeliveryConfigService()) }
async function quoteZumbarlDeliveryController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await quoteZumbarlDeliveryService(requireBody(zumbarlDeliveryQuoteSchema, request))) }
async function createOrderController(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await createOrderService(request.authUser?.studentId, requireBody(orderSchema, request))) }
async function listOrdersController(request: FastifyRequest, reply: FastifyReply) { return reply.send(await listOrdersService(request.authUser?.studentId, request.query as Record<string, unknown>)) }
async function updateOrderStatusController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await updateOrderStatusService(id, request.authUser?.studentId, requireBody(orderStatusSchema, request))) }
async function confirmOrderReceivedController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await confirmOrderReceivedService(id, request.authUser?.studentId)) }
async function cancelBuyerOrderController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.send(await cancelBuyerOrderService(id, request.authUser?.studentId)) }
async function reviewOrderController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await reviewOrderService(id, request.authUser?.id, requireBody(marketplaceReviewSchema, request))) }
async function disputeOrderController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await disputeOrderService(id, requireBody(disputeOrderSchema, request))) }
async function readMarketplaceSellerController(request: FastifyRequest, reply: FastifyReply) { const { username } = requireParams(usernameParamSchema, request); return reply.send(await readMarketplaceSellerService(username)) }
async function startMarketplaceChatController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await startMarketplaceChatService(request.authUser?.id, id, requireBody(marketplaceContactSchema, request))) }
async function createMarketplaceOfferController(request: FastifyRequest, reply: FastifyReply) { const { id } = requireParams(idParamSchema, request); return reply.code(201).send(await createMarketplaceOfferService(request.authUser?.id, id, requireBody(marketplaceOfferSchema, request))) }
async function recordMarketplaceSellerViewController(request: FastifyRequest, reply: FastifyReply) { const { username } = requireParams(usernameParamSchema, request); return reply.code(201).send(await recordMarketplaceSellerViewService(request.authUser?.id, username, requireBody(marketplaceProfileViewSchema, request))) }

export {
  listMarketplaceShopsController,
  createMarketplaceShopController,
  listMarketplaceListingsController,
  createMarketplaceListingController,
  readMyMarketplaceInventoryController,
  listMyCampusVendorsController,
  readCampusVendorProfileController,
  setCampusVendorFollowingController,
  readCampusVendorWorkspaceController,
  searchCampusVendorManagerCandidatesController,
  updateCampusVendorAvailabilityController,
  updateCampusVendorOrderStatusController,
  createCampusVendorPostController,
  updateCampusVendorPostController,
  createCampusVendorPromotionController,
  updateCampusVendorForManagerController,
  addCampusVendorManagerForManagerController,
  removeCampusVendorManagerForManagerController,
  updateMyMarketplaceShopController,
  searchMarketplaceLocationsController,
  readMyPendingMarketplaceOffersController,
  decideMarketplaceOfferController,
  readMarketplaceOfferController,
  createOwnedMarketplaceListingController,
  updateOwnedMarketplaceListingController,
  readMarketplaceListingController,
  readCartController,
  addCartItemController,
  removeCartItemController,
  clearCartController,
  updateCartItemFulfilmentController,
  readZumbarlDeliveryConfigController,
  quoteZumbarlDeliveryController,
  createOrderController,
  listOrdersController,
  updateOrderStatusController,
  confirmOrderReceivedController,
  cancelBuyerOrderController,
  reviewOrderController,
  disputeOrderController,
  readMarketplaceSellerController,
  startMarketplaceChatController,
  createMarketplaceOfferController,
  recordMarketplaceSellerViewController
}
