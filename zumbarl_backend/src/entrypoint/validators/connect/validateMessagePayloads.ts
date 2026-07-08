import { z } from 'zod'

const messageQuerySchema = z.object({
  participantId: z.string().min(1),
  opportunityId: z.string().min(1).optional()
})

const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  opportunityId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(5000),
  fileUrls: z.array(z.string().url()).max(10).default([])
})

export {
  messageQuerySchema,
  createMessageSchema
}
