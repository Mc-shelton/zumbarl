import { z } from 'zod'
const connectProfileSchema = z.object({ interests: z.array(z.string()).default([]), safetyPreferences: z.record(z.any()).default({}), visibility: z.enum(['public', 'campus', 'connections', 'private']).default('campus'), storyFeedScope: z.enum(['all', 'campus', 'connections']).default('all'), showZumbarlPoints: z.boolean().optional() })
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
  mediaType: z.enum(['image', 'video', 'text']).optional(),
  poster: z.string().optional(),
  storyKind: z.enum(['personal', 'product', 'text']).optional(),
  product: z.record(z.any()).nullable().optional(),
  creator: z.record(z.any()).optional(),
  visibility: z.enum(['campus', 'group', 'public']).optional()
})
const storySchema = z.object({
  sourceId: z.string().optional(),
  title: z.string().min(1),
  text: z.string().min(1),
  mediaUrl: z.string().min(1).optional(),
  mediaType: z.enum(['image', 'video', 'text']).default('image'),
  poster: z.string().optional(),
  storyKind: z.enum(['personal', 'product', 'text']).default('personal'),
  product: z.record(z.any()).nullable().optional(),
  visibility: z.enum(['campus', 'group', 'public']).default('campus'),
  context: z.string().optional()
  ,knowledgeSpaceId: z.string().min(1).optional()
  ,managedProfileId: z.string().min(1).optional()
  ,vendorSlug: z.string().min(1).optional()
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
  ,knowledgeSpaceId: z.string().min(1).optional()
})
const updatePostSchema = z.object({
  body: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string()).max(8).optional(),
  mediaEdits: z.array(z.object({ type: z.enum(['image', 'video']), zoom: z.number().min(1).max(3).optional(), positionX: z.number().min(0).max(100).optional(), positionY: z.number().min(0).max(100).optional(), trimStart: z.number().min(0).optional(), trimEnd: z.number().positive().optional() })).max(8).optional()
})
const postEngagementSnapshotSchema = z.object({
  body: z.string().min(1),
  type: z.string().optional(),
  mediaUrls: z.array(z.string()).max(8).default([]),
  mediaEdits: z.array(z.record(z.any())).max(8).default([]),
  creator: z.object({ id: z.string().optional(), slug: z.string().optional(), profileType: z.string().optional(), name: z.string(), handle: z.string().optional(), avatarUrl: z.string().nullable().optional(), campus: z.string().nullable().optional(), zumbarlPoints: z.coerce.number().nonnegative().optional(), zumbarlTier: z.string().nullable().optional() }).optional(),
  reactionCount: z.coerce.number().int().nonnegative().default(0),
  commentCount: z.coerce.number().int().nonnegative().default(0),
  repostCount: z.coerce.number().int().nonnegative().default(0)
})
const reactionSchema = z.object({ reaction: z.string().default('like'), story: storySnapshotSchema.optional(), post: postEngagementSnapshotSchema.optional() })
const commentSchema = z.object({ body: z.string().min(1), story: storySnapshotSchema.optional(), post: postEngagementSnapshotSchema.optional() })
const postReshareSchema = z.object({
  post: postEngagementSnapshotSchema.optional(),
  commentary: z.string().trim().max(3000).default('')
})
const eventResponseSchema = z.object({ status: z.enum(['GOING', 'INTERESTED', 'CANCELLED']) })
const pollVoteSchema = z.object({
  optionIds: z.array(z.string().min(1)).max(6).refine((values) => new Set(values).size === values.length, 'Poll choices must be unique')
})
const reportPostSchema = z.object({ reason: z.string().min(3), detail: z.string().optional() })
const announcementSubmissionSchema = z.object({ targetType: z.enum(['campus', 'group']), targetId: z.string().min(1), reason: z.string().min(10).max(500) })
const announcementDecisionSchema = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().max(500).optional() })
const supportCircleVisualSchema = z.enum([
  '/assets/wellbeing/recovery-circle-splash.webp',
  '/assets/wellbeing/first-year-circle-splash.webp',
  '/assets/wellbeing/wellness-shelter-v1.webp',
  '/assets/wellbeing/wellness-connection-v1.webp',
  '/assets/wellbeing/wellness-renewal-v1.webp',
  '/assets/wellbeing/wellness-reflection-v1.webp',
])
const groupSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['group', 'club', 'association', 'event', 'support-circle', 'chama']),
  purpose: z.string().min(12),
  rules: z.array(z.string().min(2)).min(1),
  campus: z.string().optional(),
  contributionAmount: z.coerce.number().positive().optional(),
  contributionCadence: z.string().optional(),
  privacyMode: z.enum(['named', 'alias']).default('named'),
  moderationOwner: z.string().min(2).optional(),
  safetyBoundaries: z.array(z.string().min(2)).default([]),
  splashImageUrl: supportCircleVisualSchema.optional(),
}).refine((value) => value.category !== 'support-circle' || Boolean(value.splashImageUrl), {
  message: 'Choose wellness artwork for this support circle',
  path: ['splashImageUrl'],
})
const groupMembershipSchema = z.object({
  participationMode: z.enum(['named', 'alias']).default('named'),
  alias: z.string().trim().min(2).max(40).optional(),
}).refine((value) => value.participationMode !== 'alias' || Boolean(value.alias), {
  message: 'Choose an alias for alias participation',
  path: ['alias'],
})
const groupMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) })
const supportCircleScheduleSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  kind: z.enum(['audio_circle', 'event']).default('audio_circle'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().trim().max(160).optional(),
  membersOnly: z.boolean().default(true),
  publishToExplore: z.boolean().default(false),
  createZumbarlLink: z.boolean().default(false),
  joinPolicy: z.enum(['open', 'host_approval']).default('open'),
  thumbnailUrl: z.string().trim().max(2000).nullable().optional(),
}).refine((value) => !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), {
  message: 'End time must be after the start time',
  path: ['endsAt'],
}).refine((value) => !value.createZumbarlLink || value.kind === 'audio_circle', {
  message: 'Zumbarl call links are available for audio circles',
  path: ['createZumbarlLink'],
}).refine((value) => !value.thumbnailUrl || value.publishToExplore, {
  message: 'Thumbnails are available for Explore Campus schedules',
  path: ['thumbnailUrl'],
})
const supportCircleScheduleResponseSchema = z.object({ status: z.enum(['GOING', 'INTERESTED', 'CANCELLED']) })
const supportCircleScheduleAdmissionSchema = z.object({ status: z.enum(['admitted', 'denied']) })
const supportCircleAudioRoomSchema = z.object({
  useAlias: z.boolean().default(true),
  voiceShieldEnabled: z.boolean().default(true),
  scheduleId: z.string().optional(),
})
const supportCircleAudioPresenceSchema = z.object({
  roomUrl: z.string().url().max(2000),
  scheduleId: z.string().optional(),
  action: z.enum(['heartbeat', 'leave']).default('heartbeat'),
})
const supportCircleMemberRoleSchema = z.object({ role: z.enum(['member', 'admin']) })
const supportCirclePostSchema = postSchema.omit({ knowledgeSpaceId: true, visibility: true }).extend({
  body: z.string().trim().min(1).max(5000),
})
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
  postReshareSchema,
  eventResponseSchema,
  pollVoteSchema,
  reportPostSchema,
  announcementSubmissionSchema,
  announcementDecisionSchema,
  groupSchema,
  groupMembershipSchema,
  groupMessageSchema,
  supportCircleScheduleSchema,
  supportCircleScheduleResponseSchema,
  supportCircleScheduleAdmissionSchema,
  supportCircleAudioRoomSchema,
  supportCircleAudioPresenceSchema,
  supportCircleMemberRoleSchema,
  supportCirclePostSchema,
  chamaContributionSchema
}
