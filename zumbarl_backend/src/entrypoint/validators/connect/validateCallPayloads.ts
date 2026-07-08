import { z } from 'zod'

const createCallSchema = z.object({
  recipientId: z.string().min(1),
  opportunityId: z.string().min(1).optional(),
  callType: z.enum(['audio', 'video'])
})

const respondToCallSchema = z.object({
  response: z.enum(['accept', 'decline'])
})

export {
  createCallSchema,
  respondToCallSchema
}
