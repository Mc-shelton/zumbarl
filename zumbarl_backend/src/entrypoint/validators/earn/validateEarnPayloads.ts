import { z } from 'zod'

const submitOpportunityBidSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  intent: z.enum(['earn', 'build-career', 'attachment', 'internship']).default('earn'),
  proposal: z.string().min(10),
  deliveryTime: z.string().optional(),
  message: z.string().max(500).optional(),
  pricingType: z.string().max(50).optional(),
  questionAnswers: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1)
  })).default([]),
  attachments: z.array(z.object({
    requirementId: z.string().min(1),
    label: z.string().min(1),
    fileType: z.string().min(1),
    uploadId: z.string().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    sizeBytes: z.coerce.number().int().nonnegative().optional(),
    url: z.string().url()
  })).default([])
})

const submitProjectDeliverableSchema = z.object({
  title: z.string().min(3),
  notes: z.string().optional(),
  files: z.array(z.object({ fileName: z.string(), url: z.string().url().optional() })).default([])
})

const respondToInterviewSchema = z.object({
  action: z.enum(['rsvp', 'propose_new_time', 'cancel']),
  note: z.string().max(1000).optional(),
  proposedAt: z.string().datetime().optional()
}).superRefine((value, context) => {
  if (value.action !== 'rsvp' && !value.note?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['note'],
      message: 'A note is required when proposing a new time or cancelling'
    })
  }
  if (value.action === 'propose_new_time' && !value.proposedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['proposedAt'],
      message: 'A proposed interview time is required'
    })
  }
})

export {
  submitOpportunityBidSchema,
  submitProjectDeliverableSchema,
  respondToInterviewSchema
}
