import { z } from 'zod'

const campaignMaterialSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  type: z.enum(['image', 'video', 'pdf', 'zip', 'link', 'copy']).default('image'),
  url: z.string().optional(),
  previewUrl: z.string().optional(),
  platform: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
  instructions: z.string().optional()
}).passthrough()

const campaignMaterialsSchema = z.array(campaignMaterialSchema)
  .min(1, 'Upload the image or video creators will use')
  .refine(
    (materials) => materials.some((material) => (
      ['image', 'video'].includes(material.type) && Boolean(material.url || material.previewUrl)
    )),
    'A campaign image or video is required'
  )

const createMarketingCampaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.string().optional(),
  budgetAmount: z.coerce.number().positive(),
  budget: z.string().optional(),
  currency: z.string().length(3).default('KES'),
  platforms: z.array(z.string()).min(1),
  minimumFollowers: z.coerce.number().int().nonnegative().default(0),
  minimumLikes: z.coerce.number().int().nonnegative().default(0),
  minimumEngagement: z.coerce.number().int().nonnegative().default(0),
  payoutPerCampaigner: z.coerce.number().nonnegative(),
  proofRequirements: z.array(z.string()).default([]),
  materials: campaignMaterialsSchema,
  thumbnailTitle: z.string().optional(),
  thumbnailMeta: z.string().optional(),
  previewImage: z.string().nullable().optional(),
  objective: z.string().optional(),
  destinationUrl: z.string().url().optional(),
  hashtags: z.array(z.string()).default([]),
  targetAudience: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  timelineLabel: z.string().optional(),
  timelineValue: z.string().optional(),
  creatorsLimit: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'funding', 'published']).default('draft')
}).passthrough()

const updateMarketingCampaignSchema = createMarketingCampaignSchema.partial()

const inviteCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })
const campaignProofPostSchema = z.object({
  postUrl: z.string().url(),
  platform: z.string().min(2)
})
const submitCampaignProofSchema = z.object({
  posts: z.array(campaignProofPostSchema).min(1).optional(),
  postUrl: z.string().url().optional(),
  platform: z.string().min(2).optional(),
  analyticsScreenshots: z.array(z.object({
    uploadId: z.string().min(1),
    platform: z.string().min(2),
  })).min(1, 'Upload at least one analytics screenshot'),
  notes: z.string().optional()
}).superRefine((payload, context) => {
  const posts = payload.posts || (payload.postUrl && payload.platform
    ? [{ postUrl: payload.postUrl, platform: payload.platform }]
    : [])
  if (!posts.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['posts'], message: 'Add at least one published platform post' })
  }
  const platforms = posts.map((post) => post.platform.toLowerCase())
  if (new Set(platforms).size !== platforms.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['posts'], message: 'Submit only one post per platform' })
  }
})
const endorseCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })

export {
  createMarketingCampaignSchema,
  updateMarketingCampaignSchema,
  inviteCampaignersSchema,
  submitCampaignProofSchema,
  endorseCampaignersSchema
}
