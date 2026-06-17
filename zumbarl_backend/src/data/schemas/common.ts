import { z } from 'zod'

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

const moneySchema = z.object({
  amount: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('KES')
})

const fileRefSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.number().int().nonnegative(),
  url: z.string().url().optional()
})

export {
  paginationQuerySchema,
  moneySchema,
  fileRefSchema
}
