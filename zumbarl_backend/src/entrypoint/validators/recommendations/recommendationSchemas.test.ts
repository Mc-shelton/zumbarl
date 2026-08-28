import { describe, expect, it } from 'vitest'
import { recommendationEventBatchSchema } from './recommendationSchemas.js'

describe('recommendationEventBatchSchema', () => {
  it('accepts behavioral events but strips client-supplied reward values', () => {
    const parsed = recommendationEventBatchSchema.parse({
      events: [{
        surface: 'connect_feed', entityType: 'connect_post', entityId: 'post-1',
        eventType: 'like', reward: 999
      }]
    })

    expect(parsed.events[0]).not.toHaveProperty('reward')
  })

  it('caps batches and rejects unknown event types', () => {
    expect(() => recommendationEventBatchSchema.parse({ events: Array.from({ length: 101 }, (_, index) => ({
      surface: 'connect_feed', entityType: 'connect_post', entityId: `post-${index}`, eventType: 'impression'
    })) })).toThrow()
    expect(() => recommendationEventBatchSchema.parse({ events: [{
      surface: 'connect_feed', entityType: 'connect_post', entityId: 'post-1', eventType: 'manipulate_score'
    }] })).toThrow()
  })

  it.each(['media_click', 'media_expand', 'video_play', 'share', 'start', 'progress', 'complete', 'download', 'borrow', 'profile_click'])('accepts the %s engagement signal', (eventType) => {
    const parsed = recommendationEventBatchSchema.parse({ events: [{
      surface: 'connect_feed', entityType: 'connect_post', entityId: 'post-media', eventType,
      metadata: { mediaIndex: 0, mediaType: 'video' }
    }] })

    expect(parsed.events[0].eventType).toBe(eventType)
  })
})
