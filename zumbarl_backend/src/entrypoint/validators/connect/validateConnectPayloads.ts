import { z } from 'zod'
const connectProfileSchema = z.object({ interests: z.array(z.string()).default([]), safetyPreferences: z.record(z.any()).default({}), visibility: z.enum(['public', 'campus', 'connections', 'private']).default('campus'), storyFeedScope: z.enum(['all', 'campus', 'connections']).default('all') })
const socialPlatformSchema = z.enum(['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X'])
const socialMetricsExtractionSchema = z.object({
  platform: socialPlatformSchema,
  uploadId: z.string().min(1),
  expectedHandle: z.string().trim().min(2).max(120).optional()
})
const socialMetricsAccountSchema = z.object({
  platform: socialPlatformSchema,
  handle: z.string().trim().min(2).max(120),
  followers: z.coerce.number().int().min(0).max(2_000_000_000),
  averageLikes: z.coerce.number().int().min(0).max(2_000_000_000),
  averageEngagement: z.coerce.number().int().min(0).max(2_000_000_000),
  screenshotUploadId: z.string().min(1),
  extractionConfidence: z.coerce.number().min(0).max(100).optional()
})
const storySnapshotSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  caption: z.string().optional(),
  mediaUrl: z.string().optional(),
  media: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  poster: z.string().optional(),
  storyKind: z.enum(['personal', 'product']).optional(),
  product: z.record(z.any()).nullable().optional(),
  creator: z.record(z.any()).optional(),
  visibility: z.enum(['campus', 'group', 'public']).optional()
})
const storySchema = z.object({
  sourceId: z.string().optional(),
  title: z.string().min(1),
  text: z.string().min(1),
  mediaUrl: z.string().min(1).optional(),
  mediaType: z.enum(['image', 'video']).default('image'),
  poster: z.string().optional(),
  storyKind: z.enum(['personal', 'product']).default('personal'),
  product: z.record(z.any()).nullable().optional(),
  visibility: z.enum(['campus', 'group', 'public']).default('campus'),
  context: z.string().optional()
  ,trimStart: z.number().min(0).optional()
  ,trimEnd: z.number().positive().optional()
})
const postSchema = z.object({
  type: z.enum(['post', 'blog', 'image', 'video', 'poll', 'event', 'feeling', 'project-update', 'marketplace-promo']).default('post'),
  body: z.string().min(1),
  tags: z.array(z.object({ type: z.string(), id: z.string(), label: z.string() })).default([]),
  visibility: z.enum(['campus', 'group', 'public']).default('campus'),
  mediaUrls: z.array(z.string()).max(8).default([]),
  mediaEdits: z.array(z.object({ type: z.enum(['image', 'video']), zoom: z.number().min(1).max(3).optional(), positionX: z.number().min(0).max(100).optional(), positionY: z.number().min(0).max(100).optional(), trimStart: z.number().min(0).optional(), trimEnd: z.number().positive().optional() })).max(8).default([]),
  event: z.object({ title: z.string().min(1), startsAt: z.string(), endsAt: z.string().optional(), location: z.string().min(1), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), thumbnailUrl: z.string().nullable().optional(), organizer: z.object({ id: z.string().min(1), type: z.enum(['person', 'business', 'campus']), name: z.string().min(1), handle: z.string().optional(), avatarUrl: z.string().nullable().optional() }).optional() }).optional(),
  poll: z.object({ question: z.string().min(1), optionType: z.enum(['text', 'number', 'date', 'time']).default('text'), selectionMode: z.enum(['single', 'multiple']).default('single'), options: z.array(z.object({ id: z.string(), label: z.string().min(1), value: z.string().min(1) })).min(2).max(6), expiresAt: z.string().optional() }).optional(),
  feeling: z.object({ emoji: z.string().min(1), label: z.string().min(1) }).optional()
})
const updatePostSchema = z.object({
  body: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string()).max(8).optional(),
  mediaEdits: z.array(z.object({ type: z.enum(['image', 'video']), zoom: z.number().min(1).max(3).optional(), positionX: z.number().min(0).max(100).optional(), positionY: z.number().min(0).max(100).optional(), trimStart: z.number().min(0).optional(), trimEnd: z.number().positive().optional() })).max(8).optional()
})
const reactionSchema = z.object({ reaction: z.string().default('like'), story: storySnapshotSchema.optional() })
const commentSchema = z.object({ body: z.string().min(1), story: storySnapshotSchema.optional() })
const reportPostSchema = z.object({ reason: z.string().min(3), detail: z.string().optional() })
const announcementSubmissionSchema = z.object({ targetType: z.enum(['campus', 'group']), targetId: z.string().min(1), reason: z.string().min(10).max(500) })
const announcementDecisionSchema = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().max(500).optional() })
const groupSchema = z.object({ name: z.string().min(2), category: z.enum(['group', 'club', 'event', 'support-circle', 'chama']), purpose: z.string(), rules: z.array(z.string()).default([]), campus: z.string().optional(), contributionAmount: z.coerce.number().optional(), contributionCadence: z.string().optional() })
const chamaContributionSchema = z.object({ amount: z.coerce.number().positive(), currency: z.string().length(3).default('KES') })

export {
  connectProfileSchema,
  socialMetricsExtractionSchema,
  socialMetricsAccountSchema,
  storySnapshotSchema,
  storySchema,
  postSchema,
  updatePostSchema,
  reactionSchema,
  commentSchema,
  reportPostSchema,
  announcementSubmissionSchema,
  announcementDecisionSchema,
  groupSchema,
  chamaContributionSchema
}
