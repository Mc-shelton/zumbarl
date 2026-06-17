import { z } from 'zod'

const submitOpportunityBidSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  intent: z.enum(['earn', 'build-career', 'attachment', 'internship']).default('earn'),
  proposal: z.string().min(10),
  deliveryTime: z.string().optional()
})

const submitProjectDeliverableSchema = z.object({
  title: z.string().min(3),
  notes: z.string().optional(),
  files: z.array(z.object({ fileName: z.string(), url: z.string().url().optional() })).default([])
})

export {
  submitOpportunityBidSchema,
  submitProjectDeliverableSchema
}
