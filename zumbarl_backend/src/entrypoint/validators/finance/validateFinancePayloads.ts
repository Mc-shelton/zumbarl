import { z } from 'zod'

const createEscrowSchema = z.object({
  scope: z.enum(['opportunity', 'project', 'milestone', 'campaign', 'order']),
  scopeId: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('KES'),
  reference: z.string().optional()
})

const releaseEscrowSchema = z.object({ studentId: z.string(), amount: z.coerce.number().positive() })

export {
  createEscrowSchema,
  releaseEscrowSchema
}
