import { z } from 'zod'

const listSkillsSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
}).passthrough()

const createSkillSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  source: z.string().optional(),
  aliases: z.array(z.string()).default([])
}).passthrough()

export {
  createSkillSchema,
  listSkillsSchema
}
