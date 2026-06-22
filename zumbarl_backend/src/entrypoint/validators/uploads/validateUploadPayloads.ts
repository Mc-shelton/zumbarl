import { z } from 'zod'
const presignUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.number().int().positive(),
  scope: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
})
const completeUploadSchema = z.object({ url: z.string().url().optional() })

export {
  presignUploadSchema,
  completeUploadSchema
}
