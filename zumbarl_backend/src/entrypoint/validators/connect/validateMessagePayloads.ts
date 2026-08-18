import { z } from 'zod'

const messageQuerySchema = z.object({
  participantId: z.string().min(1),
  opportunityId: z.string().min(1).optional()
})

const messageContextSchema = z.object({
  type: z.enum(['marketplace_product', 'marketplace_offer']),
  product: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    price: z.string().min(1),
    image: z.string().min(1),
    href: z.string().min(1)
  }),
  offer: z.object({
    id: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3)
  }).optional()
})

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

export {
  messageQuerySchema,
  createMessageSchema,
  messageContextSchema,
  createProjectGroupMessageSchema
}
