import { z } from 'zod'
const connectProfileSchema = z.object({ interests: z.array(z.string()).default([]), safetyPreferences: z.record(z.any()).default({}), visibility: z.string().default('campus') })
const storySchema = z.object({ text: z.string().min(1), mediaUrl: z.string().url().optional(), visibility: z.enum(['campus', 'group', 'public']).default('campus'), context: z.string().optional() })
const postSchema = z.object({ type: z.enum(['post', 'blog', 'image', 'video', 'poll', 'project-update', 'marketplace-promo']).default('post'), body: z.string().min(1), tags: z.array(z.object({ type: z.string(), id: z.string(), label: z.string() })).default([]), visibility: z.enum(['campus', 'group', 'public']).default('campus') })
const reactionSchema = z.object({ reaction: z.string().default('like') })
const commentSchema = z.object({ body: z.string().min(1) })
const reportPostSchema = z.object({ reason: z.string().min(3), detail: z.string().optional() })
const groupSchema = z.object({ name: z.string().min(2), category: z.enum(['group', 'club', 'event', 'support-circle', 'chama']), purpose: z.string(), rules: z.array(z.string()).default([]), campus: z.string().optional(), contributionAmount: z.coerce.number().optional(), contributionCadence: z.string().optional() })
const chamaContributionSchema = z.object({ amount: z.coerce.number().positive(), currency: z.string().length(3).default('KES') })

export {
  connectProfileSchema,
  storySchema,
  postSchema,
  reactionSchema,
  commentSchema,
  reportPostSchema,
  groupSchema,
  chamaContributionSchema
}
