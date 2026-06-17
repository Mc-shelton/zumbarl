import { z } from 'zod'

const createMarketingCampaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  budgetAmount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES'),
  platforms: z.array(z.string()).min(1),
  minimumFollowers: z.coerce.number().int().nonnegative().default(0),
  payoutPerCampaigner: z.coerce.number().nonnegative(),
  proofRequirements: z.array(z.string()).default([]),
  status: z.enum(['draft', 'funding', 'published']).default('draft')
})

const inviteCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })
const submitCampaignProofSchema = z.object({ links: z.array(z.string().url()).default([]), screenshots: z.array(z.string()).default([]), notes: z.string().optional() })
const endorseCampaignersSchema = z.object({ studentIds: z.array(z.string()).min(1), note: z.string().optional() })

export {
  createMarketingCampaignSchema,
  inviteCampaignersSchema,
  submitCampaignProofSchema,
  endorseCampaignersSchema
}
