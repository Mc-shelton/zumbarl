import { z } from 'zod'

const createRoadmapSchema = z.object({
  ladderId: z.string(),
  intent: z.enum(['explore', 'earn-while-learning', 'attachment-readiness', 'internship-readiness', 'job-readiness'])
})

const addRoadmapEvidenceSchema = z.object({
  checkpointId: z.string(),
  competencyId: z.string().optional(),
  source: z.enum(['PROJECT', 'CAMPAIGN', 'POST', 'PORTFOLIO', 'BUSINESS_REVIEW', 'CERTIFICATE', 'OTHER']),
  sourceId: z.string().optional(),
  note: z.string().trim().min(3).max(1000).optional()
})

const completeCheckpointTestSchema = z.object({
  checkpointId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string() })).min(1)
})

const verifyRoadmapEvidenceSchema = z.object({ score: z.coerce.number().int().min(0).max(80) })

const submitLearningPracticeSchema = z.object({
  checkpointId: z.string().min(1),
  resourceId: z.string().min(1),
  competencyId: z.string().optional(),
  responses: z.record(z.string().trim().min(2).max(2000)),
  reflection: z.string().trim().min(3).max(1000)
})

const resourceLocationSchema = z.string().trim().refine(
  (value) => value.startsWith('/files/') || /^https?:\/\//i.test(value),
  'Enter a valid web link or uploaded file location'
)

const createKnowledgeSpaceSchema = z.object({
  type: z.enum(['LIBRARY', 'GROUP']),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(600).optional(),
  visibility: z.enum(['PUBLIC', 'CAMPUS', 'PRIVATE']).default('CAMPUS'),
  membershipMode: z.enum(['REQUEST', 'INVITE']).default('REQUEST'),
  avatarUrl: resourceLocationSchema.optional(),
  coverImageUrl: resourceLocationSchema.optional()
})

const createKnowledgeResourceSchema = z.object({
  spaceId: z.string().optional(),
  sourceMessageId: z.string().optional(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1200).optional(),
  resourceType: z.enum(['PAST_PAPER', 'BOOK', 'NOTES', 'STUDY_GUIDE', 'ARTICLE']),
  accessMode: z.enum(['FREE_READ', 'BORROW', 'BUY', 'MEMBERS_ONLY']),
  courseCode: z.string().trim().max(40).optional(),
  unitId: z.string().min(1).optional(),
  unitName: z.string().trim().min(2).max(120).optional(),
  createUnit: z.boolean().default(false),
  academicYear: z.coerce.number().int().min(1950).max(2200).optional(),
  institution: z.string().trim().max(120).optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).default('KES'),
  sourceMode: z.enum(['LINK', 'FILES']),
  fileUrl: resourceLocationSchema.optional(),
  fileUrls: z.array(resourceLocationSchema).max(12).default([]),
  coverImageUrl: resourceLocationSchema.optional(),
  previewText: z.string().trim().max(5000).optional(),
  availableCopies: z.coerce.number().int().min(0).max(10000).optional()
}).superRefine((value, context) => {
  if (value.accessMode === 'BUY' && !value.price) context.addIssue({ code: 'custom', path: ['price'], message: 'A selling price is required' })
  if (value.accessMode === 'BORROW' && value.availableCopies === undefined) context.addIssue({ code: 'custom', path: ['availableCopies'], message: 'Available copies are required for borrowing' })
  if (value.accessMode === 'MEMBERS_ONLY' && !value.spaceId) context.addIssue({ code: 'custom', path: ['spaceId'], message: 'Member-only resources must belong to a library or study group' })
  if (value.sourceMode === 'LINK' && !value.fileUrl) context.addIssue({ code: 'custom', path: ['fileUrl'], message: 'Add the resource link' })
  if (value.sourceMode === 'FILES' && !value.fileUrls.length) context.addIssue({ code: 'custom', path: ['fileUrls'], message: 'Upload at least one resource file' })
  if (value.sourceMode === 'LINK' && value.fileUrls.length) context.addIssue({ code: 'custom', path: ['fileUrls'], message: 'Choose either a link or uploaded files' })
  if (value.sourceMode === 'FILES' && value.fileUrl) context.addIssue({ code: 'custom', path: ['fileUrl'], message: 'Choose either uploaded files or a link' })
  if (!value.unitId && !value.unitName) context.addIssue({ code: 'custom', path: ['unitId'], message: 'Choose an existing unit or create a new one' })
  if (value.unitId && value.unitName) context.addIssue({ code: 'custom', path: ['unitName'], message: 'Choose an existing unit or create a new one' })
  if (value.createUnit && !value.unitName) context.addIssue({ code: 'custom', path: ['unitName'], message: 'Enter the new unit name' })
})

const knowledgeToggleSchema = z.object({ active: z.boolean() })
const knowledgeAccessSchema = z.object({ action: z.enum(['READ', 'BORROW', 'PURCHASE', 'SAVE']) })
const knowledgePurchaseSchema = z.object({ paymentMethod: z.literal('WALLET') })
const knowledgeManagerSchema = z.object({ studentId: z.string().min(1) })
const knowledgeMemberParamsSchema = z.object({ id: z.string().min(1), studentId: z.string().min(1) })
const knowledgeResourceParamsSchema = z.object({ id: z.string().min(1), resourceId: z.string().min(1) })
const knowledgePostParamsSchema = z.object({ id: z.string().min(1), postId: z.string().min(1) })
const knowledgeAccessRequestParamsSchema = z.object({ id: z.string().min(1), accessId: z.string().min(1) })
const knowledgeMembershipDecisionSchema = z.object({ action: z.enum(['APPROVE', 'REJECT']) })
const updateKnowledgeSpaceSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(600).nullable().optional(),
  visibility: z.enum(['PUBLIC', 'CAMPUS', 'PRIVATE']).optional(),
  membershipMode: z.enum(['REQUEST', 'INVITE']).optional(),
  avatarUrl: resourceLocationSchema.nullable().optional(),
  coverImageUrl: resourceLocationSchema.nullable().optional()
}).refine((value) => Object.keys(value).length > 0, 'Add at least one page change')

const createKnowledgeRoomSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  resourceId: z.string().min(1).optional()
})

const updateKnowledgeRoomSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, 'Add at least one room change')

const knowledgeMessageAttachmentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  url: resourceLocationSchema,
  mimeType: z.string().trim().max(120).optional(),
  size: z.coerce.number().int().min(0).max(100 * 1024 * 1024).optional()
})

const createKnowledgeRoomMessageSchema = z.object({
  body: z.string().trim().max(2000).default(''),
  attachments: z.array(knowledgeMessageAttachmentSchema).max(8).default([])
}).refine((value) => Boolean(value.body || value.attachments.length), 'Add a message or attachment')

const knowledgePostSchema = z.object({
  type: z.enum(['post', 'blog', 'image', 'video', 'poll', 'event', 'feeling', 'project-update', 'marketplace-promo']).default('post'),
  body: z.string().trim().min(1).max(5000),
  tags: z.array(z.object({ type: z.string(), id: z.string(), label: z.string() })).default([]),
  visibility: z.enum(['campus', 'group', 'public']).default('campus'),
  mediaUrls: z.array(z.string()).max(8).default([]),
  mediaEdits: z.array(z.record(z.any())).max(8).default([]),
  event: z.record(z.any()).optional(),
  poll: z.record(z.any()).optional(),
  feeling: z.record(z.any()).optional()
})

const updateKnowledgePostSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  mediaUrls: z.array(z.string()).max(8).optional(),
  mediaEdits: z.array(z.record(z.any())).max(8).optional()
})

export {
  createRoadmapSchema,
  addRoadmapEvidenceSchema,
  completeCheckpointTestSchema,
  createKnowledgeRoomMessageSchema,
  createKnowledgeRoomSchema,
  createKnowledgeResourceSchema,
  createKnowledgeSpaceSchema,
  knowledgeAccessSchema,
  knowledgeAccessRequestParamsSchema,
  knowledgeManagerSchema,
  knowledgeMemberParamsSchema,
  knowledgeResourceParamsSchema,
  knowledgeMembershipDecisionSchema,
  knowledgePostSchema,
  knowledgePostParamsSchema,
  knowledgePurchaseSchema,
  knowledgeToggleSchema,
  submitLearningPracticeSchema,
  updateKnowledgeSpaceSchema,
  updateKnowledgePostSchema,
  updateKnowledgeRoomSchema,
  verifyRoadmapEvidenceSchema
}
