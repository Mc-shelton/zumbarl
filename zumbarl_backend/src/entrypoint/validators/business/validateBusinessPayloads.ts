import { z } from 'zod'

const createOpportunitySchema = z.object({
  title: z.string().min(3),
  type: z.enum(['gig', 'job', 'project', 'attachment', 'internship']).default('gig'),
  summary: z.string().min(10),
  budgetAmount: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('KES'),
  requirements: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  acceptanceCriteria: z.string().optional(),
  revisionLimit: z.coerce.number().int().min(0).max(5).default(3),
  visibility: z.enum(['draft', 'public', 'invite-only']).default('draft')
})

const inviteOpportunityBiddersSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  note: z.string().optional()
})

const fundOpportunitySchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES'),
  reference: z.string().optional()
})

const reviewApplicantSchema = z.object({
  action: z.enum(['shortlisted', 'interview_scheduled', 'awarded', 'removed', 'guardrail_unlocked']),
  detail: z.string().optional(),
  interviewAt: z.string().datetime().optional()
})

export {
  createOpportunitySchema,
  inviteOpportunityBiddersSchema,
  fundOpportunitySchema,
  reviewApplicantSchema
}
