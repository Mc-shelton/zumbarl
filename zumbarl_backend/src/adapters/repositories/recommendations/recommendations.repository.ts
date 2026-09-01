import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { recommendationRewards } from '../../../domain/recommendations/recommendation.types.js'
import type { RecommendationEventInput, RecommendationSurface } from '../../../domain/recommendations/recommendation.types.js'

class RecommendationsRepository {
  async createEvents(studentId: string, events: RecommendationEventInput[]) {
    return prisma.recommendationEvent.createMany({
      data: events.map((event) => ({
        studentId,
        surface: event.surface,
        entityType: event.entityType,
        entityId: event.entityId,
        eventType: event.eventType,
        reward: recommendationRewards[event.eventType],
        position: event.position,
        sessionId: event.sessionId,
        features: event.features as Prisma.InputJsonValue | undefined,
        metadata: event.metadata as Prisma.InputJsonValue | undefined,
        occurredAt: event.occurredAt
      }))
    })
  }

  async listScores(studentId: string, surface: RecommendationSurface, entityType: string, entityIds: string[], now: Date) {
    return prisma.recommendationScore.findMany({
      where: {
        studentId,
        surface,
        entityType,
        entityId: { in: entityIds },
        expiresAt: { gt: now }
      },
      include: {
        modelArtifact: {
          select: {
            version: true,
            algorithm: true,
            status: true,
            trainedAt: true,
            expiresAt: true
          }
        }
      }
    })
  }

  async listModelStatus(now: Date) {
    return prisma.recommendationModelArtifact.findMany({
      where: { status: 'ACTIVE' },
      select: {
        surface: true,
        version: true,
        algorithm: true,
        metrics: true,
        trainedAt: true,
        activatedAt: true,
        expiresAt: true,
        _count: { select: { scores: true } }
      },
      orderBy: { activatedAt: 'desc' },
      distinct: ['surface']
    }).then((artifacts) => artifacts.map((artifact) => ({
      ...artifact,
      stale: artifact.expiresAt !== null && artifact.expiresAt <= now
    })))
  }
}

export const recommendationsRepository = new RecommendationsRepository()
