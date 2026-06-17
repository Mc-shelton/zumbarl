import { z } from 'zod'
const shopSchema = z.object({ name: z.string().min(2), category: z.string(), campus: z.string(), pickupSpots: z.array(z.string()).default([]), contactRules: z.string().optional(), returnRules: z.string().optional() })
const listingSchema = z.object({ title: z.string().min(2), kind: z.enum(['product', 'service']).default('product'), description: z.string().optional(), priceAmount: z.coerce.number().nonnegative(), currency: z.string().length(3).default('KES'), stock: z.coerce.number().int().nonnegative().default(1), condition: z.string().optional(), variants: z.array(z.string()).default([]), deliveryOptions: z.array(z.string()).default([]), gallery: z.array(z.string()).default([]) })
const cartItemSchema = z.object({ listingId: z.string(), quantity: z.coerce.number().int().positive().default(1) })
const orderSchema = z.object({ cartId: z.string(), handoffType: z.enum(['pickup', 'drop-off']), handoffSpot: z.string(), paymentReference: z.string().optional() })
const orderStatusSchema = z.object({ fulfillmentStatus: z.enum(['confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'completed', 'cannot_fulfil']) })
const marketplaceReviewSchema = z.object({ subjectType: z.enum(['shop', 'buyer', 'seller', 'listing']), subjectId: z.string(), rating: z.coerce.number().min(1).max(5), note: z.string().optional() })
const disputeOrderSchema = z.object({ reason: z.string().min(3), detail: z.string().optional() })

export {
  shopSchema,
  listingSchema,
  cartItemSchema,
  orderSchema,
  orderStatusSchema,
  marketplaceReviewSchema,
  disputeOrderSchema
}
