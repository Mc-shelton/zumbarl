import { recommendationsRepository } from '../../repositories/recommendations/index.js'
import type { RecommendationEventInput, RecommendationMetadata, RecommendationSurface } from '../../../domain/recommendations/recommendation.types.js'

type RankedEntity = object
type RankedResult<T> = T & { recommendation: RecommendationMetadata }

function rankedEntityId(item: RankedEntity) {
  return String((item as { id?: unknown }).id ?? '')
}

function fallbackRanking<T extends RankedEntity>(items: T[]): RankedResult<T>[] {
  return items.map((item) => ({
    ...item,
    recommendation: { source: 'fallback' as const }
  }))
}

async function rankWithRecommendations<T extends RankedEntity>(input: {
  studentId?: string
  surface: RecommendationSurface
  entityType: string
  items: T[]
  now?: Date
}): Promise<RankedResult<T>[]> {
  const { studentId, surface, entityType, items } = input
  if (!studentId || items.length === 0) return fallbackRanking(items)

  const now = input.now ?? new Date()
  try {
    const scores = await recommendationsRepository.listScores(studentId, surface, entityType, items.map(rankedEntityId).filter(Boolean), now)
    const usableScores = scores.filter(({ modelArtifact }) => (
      modelArtifact.status === 'ACTIVE'
      && (modelArtifact.expiresAt === null || modelArtifact.expiresAt > now)
    ))
    if (usableScores.length === 0) return fallbackRanking(items)

    const fallbackPosition = new Map(items.map((item, index) => [rankedEntityId(item), index]))
    const scoreByEntity = new Map(usableScores.map((value) => [value.entityId, value]))
    return [...items]
      .sort((left, right) => {
        const leftId = rankedEntityId(left)
        const rightId = rankedEntityId(right)
        const leftScore = scoreByEntity.get(leftId)
        const rightScore = scoreByEntity.get(rightId)
        if (leftScore && rightScore) return rightScore.score - leftScore.score || leftScore.rank - rightScore.rank
        if (leftScore) return -1
        if (rightScore) return 1
        return (fallbackPosition.get(leftId) ?? 0) - (fallbackPosition.get(rightId) ?? 0)
      })
      .map((item) => {
        const learned = scoreByEntity.get(rankedEntityId(item))
        if (!learned) return { ...item, recommendation: { source: 'fallback' as const } }
        return {
          ...item,
          recommendation: {
            source: 'ml' as const,
            score: learned.score,
            modelVersion: learned.modelArtifact.version,
            reason: learned.reason
          }
        }
      })
  } catch {
    // A missing table, stale deployment, or temporary database/model failure must
    // never take down a user-facing listing.
    return fallbackRanking(items)
  }
}

async function recordRecommendationEventsService(studentId: string | undefined, events: RecommendationEventInput[]) {
  if (!studentId || events.length === 0) return { accepted: 0, available: false }
  try {
    const result = await recommendationsRepository.createEvents(studentId, events)
    return { accepted: result.count, available: true }
  } catch {
    // Event collection is deliberately best-effort so core actions and listings
    // continue to work when the recommendation subsystem is unavailable.
    return { accepted: 0, available: false }
  }
}

async function recordRecommendationEventBestEffort(studentId: string | undefined, event: RecommendationEventInput) {
  return recordRecommendationEventsService(studentId, [event])
}

async function readRecommendationStatusService() {
  try {
    const models = await recommendationsRepository.listModelStatus(new Date())
    return { available: models.some((model) => !model.stale), models }
  } catch {
    return { available: false, models: [] }
  }
}

export {
  fallbackRanking,
  rankWithRecommendations,
  readRecommendationStatusService,
  recordRecommendationEventBestEffort,
  recordRecommendationEventsService
}
