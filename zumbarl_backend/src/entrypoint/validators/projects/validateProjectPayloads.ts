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
  acceptanceCriteria: z.string().optional(),
  objective: z.string().optional(),
  startsAt: z.string().optional(),
  dueAt: z.string().optional()
})

const createProjectTaskSchema = z.object({
  title: z.string(),
  ownerId: z.string().optional(),
  status: z.string().default('todo'),
  dueAt: z.string().optional()
})

// `done` is deliberately absent: it is granted by the business approving the
// submission that covers the task, never set directly.
const DELIVERABLE_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'dropped'] as const

const declareDeliverableTaskSchema = z.object({
  scopeItemId: z.string().min(1).optional(),
  milestoneId: z.string().min(1).optional(),
  milestoneDeliverableId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.string().min(1).nullable().optional(),
  weight: z.number().int().min(1).max(5).default(1)
})

const updateDeliverableTaskSchema = z.object({
  title: z.string().min(1).optional(),
  sprintId: z.string().min(1).nullable().optional(),
  description: z.string().optional(),
  ownerId: z.string().min(1).nullable().optional(),
  weight: z.number().int().min(1).max(5).optional(),
  status: z.enum(DELIVERABLE_TASK_STATUSES).optional(),
  droppedReason: z.string().optional(),
  blockedByIds: z.array(z.string().min(1)).optional(),
  blockedByDependencyIds: z.array(z.string().min(1)).optional(),
  evidence: z.array(z.record(z.string(), z.any())).optional(),
  acknowledgedBy: z.string().min(1).optional()
})

const createDeliverableDependencySchema = z.object({
  scopeItemId: z.string().min(1).optional(),
  label: z.string().min(1),
  note: z.string().optional(),
  party: z.enum(['business', 'client', 'external', 'other']).default('business')
})

const resolveDeliverableDependencySchema = z.object({
  resolved: z.boolean().default(true)
})

const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  objective: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  budgetAmount: z.number().min(0).optional(),
  startsAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional()
})

const createMilestoneDeliverableSchema = z.object({
  milestoneId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  workflow: z.string().optional(),
  requirement: z.string().optional(),
  submissionMethod: z.string().optional(),
  evidenceRequired: z.string().optional(),
  acceptanceCriteria: z.string().optional(),

  sequence: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  dueAt: z.string().optional()
})

const updateMilestoneDeliverableSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  workflow: z.string().optional(),
  requirement: z.string().optional(),
  submissionMethod: z.string().optional(),
  evidenceRequired: z.string().optional(),
  acceptanceCriteria: z.string().optional(),

  sequence: z.number().int().min(1).optional(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'approved']).optional(),
  startsAt: z.string().optional(),
  dueAt: z.string().optional()
})

const createProjectSprintSchema = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  sequence: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
})

const updateProjectSprintSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed']).optional(),
  sequence: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
})

const assignSprintTasksSchema = z.object({
  sprintId: z.string().min(1).nullable(),
  taskIds: z.array(z.string().min(1)).min(1)
})

const updateProjectSettingsSchema = z.object({
  allowInterns: z.boolean().optional(),
  allowAttachees: z.boolean().optional(),
  // Percent of their own earned share each non-earning role keeps.
  roleEarningFactors: z.record(z.string(), z.number().min(0).max(100)).optional(),
  sprintCadence: z.string().optional(),
  catchupCadence: z.string().optional()
})

const createDeliverableNoteSchema = z.object({
  scopeItemId: z.string().min(1).optional(),
  body: z.string().min(1),
  files: z.array(z.record(z.string(), z.any())).optional()
})

const reviewDeliverableSchema = z.object({
  decision: z.enum(['approved', 'changes_requested']),
  feedback: z.string().optional()
})

const inviteProjectTeamMembersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(20),
  role: z.string().trim().min(2).max(100),
  note: z.string().trim().max(1000).optional().default('')
})

const respondToProjectTeamInviteSchema = z.object({
  action: z.enum(['accept', 'decline'])
})

const completeScopeTargetSchema = z.object({
  scopeItemId: z.string().min(1).optional(),
  milestoneId: z.string().min(1).optional()
}).refine((value) => Boolean(value.scopeItemId) || Boolean(value.milestoneId), {
  message: 'Provide a deliverable (scopeItemId) or milestone to complete.'
})

const proposeProjectPriceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(1).max(8).optional()
})

const respondToPriceProposalSchema = z.object({
  decision: z.enum(['accepted', 'rejected'])
})

export {
  createProjectSchema,
  applyToProjectSchema,
  createMilestoneSchema,
  createProjectTaskSchema,
  createDeliverableDependencySchema,
  createDeliverableNoteSchema,
  updateProjectSettingsSchema,
  createMilestoneDeliverableSchema,
  updateMilestoneSchema,
  updateMilestoneDeliverableSchema,
  createProjectSprintSchema,
  updateProjectSprintSchema,
  assignSprintTasksSchema,
  resolveDeliverableDependencySchema,
  declareDeliverableTaskSchema,
  updateDeliverableTaskSchema,
  reviewDeliverableSchema,
  inviteProjectTeamMembersSchema,
  respondToProjectTeamInviteSchema,
  proposeProjectPriceSchema,
  respondToPriceProposalSchema,
  completeScopeTargetSchema
}
