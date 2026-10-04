import { z } from 'zod'

const createEscrowSchema = z.object({
  scope: z.enum(['opportunity', 'project', 'milestone', 'campaign', 'order']),
  scopeId: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES'),
  reference: z.string().optional()
})

const releaseEscrowSchema = z.object({
  studentId: z.string(),
  amount: z.coerce.number().positive(),
  reference: z.string().min(1).optional()
})

const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().optional(),
      CheckoutRequestID: z.string().optional(),
      ResultCode: z.coerce.number().int(),
      ResultDesc: z.string().default(''),
      CallbackMetadata: z.object({
        Item: z.array(z.object({
          Name: z.string(),
          Value: z.union([z.string(), z.number()]).optional()
        }).passthrough()).default([])
      }).optional()
    }).passthrough()
  })
}).passthrough()

const createMpesaPayoutSchema = z.object({
  amount: z.coerce.number().int().positive(),
  currency: z.string().length(3).default('KES'),
  phoneNumber: z.string().min(9),
  reference: z.string().min(1).optional()
})

const mpesaB2cResultSchema = z.object({
  Result: z.object({
    ResultCode: z.coerce.number().int(),
    ResultDesc: z.string().default(''),
    ConversationID: z.string().optional(),
    OriginatorConversationID: z.string().optional(),
    ResultParameters: z.object({
      ResultParameter: z.array(z.object({
        Key: z.string(),
        Value: z.union([z.string(), z.number()]).optional()
      }).passthrough()).default([])
    }).optional()
  }).passthrough()
}).passthrough()

export {
  createEscrowSchema,
  createMpesaPayoutSchema,
  mpesaB2cResultSchema,
  mpesaCallbackSchema,
  releaseEscrowSchema
}
