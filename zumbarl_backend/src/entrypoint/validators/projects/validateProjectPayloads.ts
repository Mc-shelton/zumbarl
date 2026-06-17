import { z } from 'zod'

const createProjectSchema = z.object({
  title: z.string().min(3),
  objectives: z.array(z.string()).default([]),
  terms: z.array(z.enum(['stipend-role', 'attachment', 'internship', 'per-deliverable'])).default(['stipend-role']),
  milestones: z.array(z.object({ title: z.string(), budgetAmount: z.coerce.number().nonnegative(), acceptanceCriteria: z.string().optional() })).default([])
})

const applyToProjectSchema = z.object({
  term: z.enum(['stipend-role', 'attachment', 'internship', 'per-deliverable']),
  role: z.string().min(2),
  note: z.string().optional()
})

const createMilestoneSchema = z.object({
  title: z.string(),
  budgetAmount: z.coerce.number().nonnegative(),
  acceptanceCriteria: z.string().optional()
})

const createProjectTaskSchema = z.object({
  title: z.string(),
  ownerId: z.string().optional(),
  status: z.string().default('todo'),
  dueAt: z.string().optional()
})

const reviewDeliverableSchema = z.object({
  decision: z.enum(['approved', 'changes_requested']),
  feedback: z.string().optional()
})

export {
  createProjectSchema,
  applyToProjectSchema,
  createMilestoneSchema,
  createProjectTaskSchema,
  reviewDeliverableSchema
}
