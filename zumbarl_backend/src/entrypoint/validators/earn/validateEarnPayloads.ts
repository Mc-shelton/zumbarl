import { z } from 'zod'

const uploadedFileUrlSchema = z.string().max(4000).refine((value) => {
  if (value.startsWith('/files/') && !value.includes('..')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}, 'Use a valid file URL or Zumbarl file path')

const submitOpportunityBidSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('KES'),
  intent: z.enum(['earn', 'build-career', 'attachment', 'internship']).default('earn'),
  proposal: z.string().min(10),
  deliveryTime: z.string().optional(),
  message: z.string().max(500).optional(),
  pricingType: z.string().max(50).optional(),
  estimatedUnits: z.coerce.number().positive().optional(),
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
    // The upload is identified by uploadId; url may be relative or absent
    // depending on storage config, so it is not required to be a strict URL.
    url: z.string().max(4000).default('')
  })).default([])
})

const saveOpportunityBidDraftSchema = z.object({
  amount: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).default('KES'),
  intent: z.enum(['earn', 'build-career', 'attachment', 'internship']).default('earn'),
  proposal: z.string().max(1500).optional().default(''),
  deliveryTime: z.string().max(100).optional().default(''),
  message: z.string().max(500).optional().default(''),
  pricingType: z.string().max(50).optional().default('fixed'),
  estimatedUnits: z.number().positive().nullable().optional(),
  applicationStepIndex: z.number().int().min(0).max(3).default(0),
  questionAnswers: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().max(1000)
  })).default([]),
  attachments: z.array(z.object({
    requirementId: z.string().min(1),
    label: z.string().min(1),
    fileType: z.string().min(1),
    uploadId: z.string().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
    url: z.string().max(4000).default('')
  })).default([])
})

const submitProjectDeliverableSchema = z.object({
  title: z.string().min(3),
  kind: z.enum(['final', 'progress', 'revision']).default('final'),
  milestoneId: z.string().min(1).optional(),
  milestoneDeliverableId: z.string().min(1).optional(),
  scopeItemId: z.string().min(1).optional(),
  scopeItemLabel: z.string().optional(),
  revisionOfId: z.string().min(1).optional(),
  // Declared tasks this submission covers; they move to `submitted` and are
  // marked done only when the business approves.
  taskIds: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
  feedbackRequest: z.string().max(1000).optional(),
  files: z.array(z.object({
    fileName: z.string(),
    // Local uploads are normalized to /files/... by the frontend so saved
    // submissions remain valid if the API host changes.
    url: uploadedFileUrlSchema.optional(),
    mimeType: z.string().optional(),
    sizeBytes: z.coerce.number().int().nonnegative().optional()
  })).default([])
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

const respondToBidCounterOfferSchema = z.object({
  decision: z.enum(['accepted', 'rejected'])
})

export {
  respondToBidCounterOfferSchema,
  submitOpportunityBidSchema,
  saveOpportunityBidDraftSchema,
  submitProjectDeliverableSchema,
  respondToInterviewSchema
}
