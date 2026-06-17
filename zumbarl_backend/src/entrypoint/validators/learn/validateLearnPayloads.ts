import { z } from 'zod'

const createRoadmapSchema = z.object({
  ladderId: z.string(),
  intent: z.enum(['explore', 'earn-while-learning', 'attachment-readiness', 'internship-readiness', 'job-readiness'])
})

const addRoadmapEvidenceSchema = z.object({
  checkpointId: z.string(),
  source: z.string(),
  sourceId: z.string().optional(),
  note: z.string().optional(),
  score: z.coerce.number().min(0).max(80).default(20)
})

const completeCheckpointTestSchema = z.object({ checkpointId: z.string(), score: z.coerce.number().min(0).max(20) })

export {
  createRoadmapSchema,
  addRoadmapEvidenceSchema,
  completeCheckpointTestSchema
}
