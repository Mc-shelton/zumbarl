import { z } from 'zod'

const campaignMaterialSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  type: z.enum(['image', 'video', 'pdf', 'zip', 'link', 'copy']).default('image'),
  url: z.string().optional(),
  previewUrl: z.string().optional(),
  platform: z.string().optional(),
  fileName: z.string().optional(),
  instructions: z.string().optional()
}).passthrough()

const createMarketingCampaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.string().optional(),
  budgetAmount: z.coerce.number().positive(),
  budget: z.string().optional(),
  currency: z.string().length(3).default('KES'),
  platforms: z.array(z.string()).min(1),
  minimumFollowers: z.coerce.number().int().nonnegative().default(0),
  payoutPerCampaigner: z.coerce.number().nonnegative(),
  proofRequirements: z.array(z.string()).default([]),
  materials: z.array(campaignMaterialSchema).default([]),
  thumbnailTitle: z.string().optional(),
  thumbnailMeta: z.string().optional(),
  previewImage: z.string().optional(),
  objective: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  targetAudience: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  timelineLabel: z.string().optional(),
  timelineValue: z.string().optional(),
  creatorsLimit: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'funding', 'published']).default('draft')
}).passthrough()

const inviteCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })
const submitCampaignProofSchema = z.object({
  links: z.array(z.string().url()).default([]),
  screenshots: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  platformUploads: z.array(z.object({
    platform: z.string().min(2),
    url: z.string().url().optional(),
    status: z.string().optional()
  }).passthrough()).default([]),
  reach: z.coerce.number().int().nonnegative().optional(),
  engagement: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional()
})
const endorseCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })

export {
  createMarketingCampaignSchema,
  inviteCampaignersSchema,
  submitCampaignProofSchema,
  endorseCampaignersSchema
}
