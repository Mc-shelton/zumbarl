import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendationsRepository } from '../../repositories/recommendations/index.js'
import { rankWithRecommendations } from './manageRecommendationsService.js'

const items = [{ id: 'recent' }, { id: 'best' }, { id: 'unscored' }]

describe('rankWithRecommendations', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses learned scores while preserving fallback order for unscored items', async () => {
    vi.spyOn(recommendationsRepository, 'listScores').mockResolvedValue([
      {
        entityId: 'best', score: 0.91, rank: 1, reason: { retriever: 'lightfm-warp' },
        modelArtifact: { version: 'v1', algorithm: 'lightfm-warp', status: 'ACTIVE', expiresAt: null }
      }
    ] as never)

    const result = await rankWithRecommendations({
      studentId: 'brian', surface: 'connect_feed', entityType: 'connect_post', items
    })

    expect(result.map(({ id }) => id)).toEqual(['best', 'recent', 'unscored'])
    expect(result[0].recommendation).toMatchObject({ source: 'ml', modelVersion: 'v1', score: 0.91 })
    expect(result[1].recommendation).toEqual({ source: 'fallback' })
  })

  it('keeps the original order when the model store is unavailable', async () => {
    vi.spyOn(recommendationsRepository, 'listScores').mockRejectedValue(new Error('model table unavailable'))

    const result = await rankWithRecommendations({
      studentId: 'brian', surface: 'marketplace', entityType: 'marketplace_listing', items
    })

    expect(result.map(({ id }) => id)).toEqual(['recent', 'best', 'unscored'])
    expect(result.every(({ recommendation }) => recommendation.source === 'fallback')).toBe(true)
  })

  it('does not serve expired model artifacts', async () => {
    vi.spyOn(recommendationsRepository, 'listScores').mockResolvedValue([
      {
        entityId: 'best', score: 1, rank: 1, reason: null,
        modelArtifact: { version: 'old', algorithm: 'lightfm-warp', status: 'ACTIVE', expiresAt: new Date('2026-01-01') }
      }
    ] as never)

    const result = await rankWithRecommendations({
      studentId: 'brian', surface: 'connect_feed', entityType: 'connect_post', items,
      now: new Date('2026-08-27')
    })

    expect(result.map(({ id }) => id)).toEqual(['recent', 'best', 'unscored'])
  })
})
