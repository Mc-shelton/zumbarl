import { z } from 'zod'

const messageQuerySchema = z.object({
  participantId: z.string().min(1),
  opportunityId: z.string().min(1).optional()
})

const marketplaceProductSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    price: z.string().min(1),
    image: z.string().min(1),
    href: z.string().min(1)
})

const messageContextSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('marketplace_product'), product: marketplaceProductSchema }),
  z.object({
    type: z.literal('marketplace_offer'),
    product: marketplaceProductSchema,
  offer: z.object({
    id: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3)
    }).optional()
  }),
  z.object({
    type: z.literal('marketplace_order'),
    order: z.object({
      id: z.string().min(1),
      identifier: z.string().min(1),
      title: z.string().min(1),
      status: z.string().min(1),
      image: z.string().min(1).optional(),
      total: z.number().nonnegative().optional(),
      currency: z.string().length(3).optional(),
      senderUserId: z.string().min(1).optional(),
      recipientUserId: z.string().min(1).optional(),
      senderHref: z.string().min(1),
      recipientHref: z.string().min(1),
      customerHref: z.string().min(1).optional(),
      pageHref: z.string().min(1).optional(),
    })
  })
])

const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  opportunityId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(5000),
  fileUrls: z.array(z.string().url()).max(10).default([]),
  context: messageContextSchema.optional()
})

const createProjectGroupMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  fileUrls: z.array(z.string().url()).max(10).default([])
})

const pageConversationTypeSchema = z.enum(['marketplace_shop', 'managed_profile'])

const pageConversationQuerySchema = z.object({
  pageType: pageConversationTypeSchema.optional(),
  pageId: z.string().min(1).optional()
})

const createPageConversationSchema = z.object({
  pageType: pageConversationTypeSchema,
  pageId: z.string().min(1),
  customerUserId: z.string().min(1).optional()
})

const createPageMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  fileUrls: z.array(z.string().url()).max(10).default([]),
  context: messageContextSchema.optional(),
  sendAsPage: z.boolean().default(false)
})

export {
  messageQuerySchema,
  createMessageSchema,
  messageContextSchema,
  createProjectGroupMessageSchema,
  pageConversationQuerySchema,
  createPageConversationSchema,
  createPageMessageSchema
}
