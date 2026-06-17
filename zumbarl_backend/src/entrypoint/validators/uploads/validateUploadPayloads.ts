import { z } from 'zod'
const presignUploadSchema = z.object({ fileName: z.string().min(1), mimeType: z.string().min(1), sizeBytes: z.coerce.number().int().positive(), scope: z.string().min(1) })
const completeUploadSchema = z.object({ url: z.string().url().optional() })

export {
  presignUploadSchema,
  completeUploadSchema
}
