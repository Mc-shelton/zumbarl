import { z } from 'zod'
const shopSchema = z.object({ name: z.string().min(2), category: z.string(), campus: z.string(), tagline: z.string().optional(), description: z.string().optional(), logoUrl: z.string().optional(), coverImageUrl: z.string().optional(), locationLabel: z.string().optional(), latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional(), pickupSpots: z.array(z.string()).default([]), contactRules: z.string().optional(), returnRules: z.string().optional() })
const marketplaceShopUpdateSchema = shopSchema.partial().extend({ name: z.string().trim().min(2), category: z.string().trim().min(1), locationLabel: z.string().trim().min(2), latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180) })
const marketplaceLocationSearchSchema = z.object({ q: z.string().trim().min(3).max(120) })
const listingSchema = z.object({
  title: z.string().min(2),
  kind: z.enum(['product', 'service']).default('product'),
  serviceMode: z.enum(['appointment', 'order_ahead', 'request_quote']).optional(),
  duration: z.string().trim().max(80).optional(),
  availabilityText: z.string().trim().max(180).optional(),
  description: z.string().optional(),
  subtitle: z.string().optional(),
  category: z.string().min(1),
  priceAmount: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('KES'),
  stock: z.coerce.number().int().nonnegative().default(1),
  condition: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  included: z.string().optional(),
  locationLabel: z.string().trim().min(2),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  negotiable: z.boolean().default(true),
  minimumOffer: z.coerce.number().nonnegative().optional(),
  pickupInstructions: z.string().optional(),
  returnPolicy: z.string().optional(),
  variants: z.array(z.string()).default([]),
  deliveryOptions: z.array(z.string()).default([]),
  deliveryZones: z.array(z.object({ location: z.string().min(1), fee: z.coerce.number().nonnegative() })).default([]),
  gallery: z.array(z.string()).max(8).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'RESERVED', 'SOLD', 'ARCHIVED']).default('ACTIVE')
})
const cartItemSchema = z.object({
  listingId: z.string(),
  offerId: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  serviceRequest: z.object({
    mode: z.enum(['appointment', 'order_ahead']),
    date: z.string().trim().optional(),
    time: z.string().trim().min(1),
    notes: z.string().trim().max(500).optional(),
  }).optional(),
})
const cartItemFulfilmentSchema = z.object({ method: z.enum(['pickup', 'seller_delivery', 'zumbarl_delivery', 'digital', 'unquoted']), location: z.string().min(1), fee: z.coerce.number().nonnegative(), quoted: z.boolean(), distanceKm: z.coerce.number().positive().optional(), buyerLatitude: z.coerce.number().min(-90).max(90).optional(), buyerLongitude: z.coerce.number().min(-180).max(180).optional() })
const zumbarlDeliveryQuoteSchema = z.object({ listingId: z.string().min(1), buyerLatitude: z.coerce.number().min(-90).max(90), buyerLongitude: z.coerce.number().min(-180).max(180), destination: z.string().trim().min(2).default('Buyer current location') })
const orderSchema = z.object({ cartId: z.string(), handoffType: z.enum(['pickup', 'drop-off']), handoffSpot: z.string(), paymentReference: z.string().optional() })
const orderStatusSchema = z.object({ fulfillmentStatus: z.enum(['confirmed', 'packaging', 'ready', 'in_transit', 'delivered', 'cannot_fulfil']) })
const marketplaceReviewSchema = z.object({ subjectType: z.enum(['shop', 'buyer', 'seller', 'listing']), subjectId: z.string(), rating: z.coerce.number().min(1).max(5), note: z.string().optional() })
const disputeOrderSchema = z.object({ reason: z.string().min(3), detail: z.string().optional() })
const marketplaceProductContextSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  price: z.string().min(1),
  image: z.string().min(1),
  href: z.string().min(1)
})
const marketplaceContactSchema = z.object({
  sellerUsername: z.string().min(1),
  product: marketplaceProductContextSchema
})
const marketplaceOfferSchema = marketplaceContactSchema.extend({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES')
})
const marketplaceProfileViewSchema = z.object({
  product: marketplaceProductContextSchema.optional()
})
const marketplaceListingUpdateSchema = listingSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'RESERVED', 'SOLD', 'ARCHIVED']).optional()
})
const marketplaceOfferDecisionSchema = z.object({ decision: z.enum(['accepted', 'declined']) })

export {
  shopSchema,
  marketplaceShopUpdateSchema,
  marketplaceLocationSearchSchema,
  listingSchema,
  cartItemSchema,
  cartItemFulfilmentSchema,
  zumbarlDeliveryQuoteSchema,
  orderSchema,
  orderStatusSchema,
  marketplaceReviewSchema,
  disputeOrderSchema,
  marketplaceContactSchema,
  marketplaceOfferSchema,
  marketplaceProfileViewSchema,
  marketplaceListingUpdateSchema,
  marketplaceOfferDecisionSchema
}
