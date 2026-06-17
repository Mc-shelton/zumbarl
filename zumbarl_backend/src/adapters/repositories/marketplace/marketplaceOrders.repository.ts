import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const shops = createPrismaRecordRepository('shops')
const listings = createPrismaRecordRepository('listings')
const carts = createPrismaRecordRepository('carts')
const orders = createPrismaRecordRepository('orders')
const reviews = createPrismaRecordRepository('reviews')
const cases = createPrismaRecordRepository('moderationCases')

class MarketplaceOrdersRepository {
  listShops(query: Record<string, unknown>) {
    return shops.list(query)
  }

  createShop(payload: Record<string, any>) {
    return shops.create(payload)
  }

  listListings(query: Record<string, unknown>) {
    return listings.list(query, (listing) => listing.status !== 'removed')
  }

  createListing(payload: Record<string, any>) {
    return listings.create(payload)
  }

  findShop(id: string) {
    return shops.findById(id)
  }

  findListing(id: string) {
    return listings.findById(id)
  }

  async findOpenCart(studentId?: string) {
    const records = await carts.listAll((cart) => cart.studentId === studentId && cart.status === 'open')
    return records[0] ?? null
  }

  createCart(studentId?: string) {
    return carts.create({ studentId, status: 'open', items: [] })
  }

  findCart(id: string) {
    return carts.findById(id)
  }

  updateCart(id: string, patch: Record<string, any>) {
    return carts.updateById(id, patch)
  }

  createOrder(payload: Record<string, any>) {
    return orders.create(payload)
  }

  listOrders(query: Record<string, unknown>) {
    return orders.list(query)
  }

  findOrder(id: string) {
    return orders.findById(id)
  }

  updateOrder(id: string, patch: Record<string, any>) {
    return orders.updateById(id, patch)
  }

  createReview(payload: Record<string, any>) {
    return reviews.create(payload)
  }

  createDispute(payload: Record<string, any>) {
    return cases.create(payload)
  }

  findOrCreateOpenCart(studentId?: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCarts = createRepository('carts')
      const existing = (await transactionCarts.listAll((cart) => cart.studentId === studentId && cart.status === 'open'))[0]
      return existing ?? transactionCarts.create({ studentId, status: 'open', items: [] })
    })
  }

  addCartItem(studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionListings = createRepository('listings')
      const transactionCarts = createRepository('carts')
      const listing = await transactionListings.findById(payload.listingId)
      if (!listing) return null

      const cart = (await transactionCarts.listAll((item) => item.studentId === studentId && item.status === 'open'))[0] ?? await transactionCarts.create({ studentId, status: 'open', items: [] })
      const items = [...(cart.items ?? []).filter((item: Record<string, any>) => item.listingId !== payload.listingId), { ...payload, unitAmount: listing.priceAmount, currency: listing.currency }]
      return transactionCarts.updateById(cart.id, { items })
    })
  }

  createOrderFromCart(studentId: string | undefined, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionCarts = createRepository('carts')
      const transactionOrders = createRepository('orders')
      const cart = await transactionCarts.findById(payload.cartId)
      if (!cart) return null

      const totalAmount = (cart.items ?? []).reduce((sum: number, item: Record<string, any>) => sum + item.unitAmount * item.quantity, 0)
      const order = await transactionOrders.create({ studentId, items: cart.items, totalAmount, currency: cart.items?.[0]?.currency ?? 'KES', status: 'paid', fulfillmentStatus: 'seller_confirmation', ...payload })
      await transactionCarts.updateById(cart.id, { status: 'ordered', orderId: order.id })
      return order
    })
  }
}

const marketplaceOrdersRepository = new MarketplaceOrdersRepository()

export {
  MarketplaceOrdersRepository,
  marketplaceOrdersRepository
}
