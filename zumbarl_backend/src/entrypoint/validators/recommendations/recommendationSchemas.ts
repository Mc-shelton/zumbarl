import { z } from 'zod'
import { recommendationEventTypes, recommendationSurfaces } from '../../../domain/recommendations/recommendation.types.js'

const recommendationEventSchema = z.object({
  surface: z.enum(recommendationSurfaces),
  entityType: z.string().trim().min(1).max(80),
  entityId: z.string().trim().min(1).max(160),
  eventType: z.enum(recommendationEventTypes),
  position: z.number().int().min(0).max(500).optional(),
  sessionId: z.string().trim().min(1).max(120).optional(),
  features: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.coerce.date().max(new Date(Date.now() + 5 * 60 * 1000)).optional()
})

const recommendationEventBatchSchema = z.object({
  events: z.array(recommendationEventSchema).min(1).max(100)
})

export {
  recommendationEventBatchSchema,
  recommendationEventSchema
}
