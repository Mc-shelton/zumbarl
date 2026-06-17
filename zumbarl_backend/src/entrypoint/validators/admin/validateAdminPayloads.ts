import { z } from 'zod'
const updateUserSchema = z.object({ status: z.enum(['active', 'suspended']).optional(), role: z.string().optional() })
const updateModerationCaseSchema = z.object({ status: z.enum(['open', 'in_review', 'resolved', 'dismissed']), action: z.enum(['none', 'remove_content', 'suspend_user', 'restrict_marketplace']).default('none'), note: z.string().optional() })

export {
  updateUserSchema,
  updateModerationCaseSchema
}
