export const recommendationSurfaces = [
  'connect_feed',
  'stories',
  'marketplace',
  'opportunities',
  'people',
  'learning',
  'campus_home'
] as const

export const recommendationEventTypes = [
  'impression',
  'open',
  'start',
  'dwell',
  'progress',
  'complete',
  'download',
  'borrow',
  'profile_click',
  'media_click',
  'media_expand',
  'video_play',
  'like',
  'comment',
  'share',
  'save',
  'follow',
  'hide',
  'report',
  'offer',
  'add_to_cart',
  'purchase',
  'apply',
  'rsvp'
] as const

export type RecommendationSurface = typeof recommendationSurfaces[number]
export type RecommendationEventType = typeof recommendationEventTypes[number]

export type RecommendationEventInput = {
  surface: RecommendationSurface
  entityType: string
  entityId: string
  eventType: RecommendationEventType
  position?: number
  sessionId?: string
  features?: Record<string, unknown>
  metadata?: Record<string, unknown>
  occurredAt?: Date
}

export type RecommendationMetadata = {
  source: 'ml' | 'fallback'
  score?: number
  modelVersion?: string
  reason?: unknown
}

export const recommendationRewards: Record<RecommendationEventType, number> = {
  impression: 0,
  open: 0.35,
  start: 0.7,
  dwell: 0.5,
  progress: 1.5,
  complete: 4,
  download: 1.5,
  borrow: 2.5,
  profile_click: 0.6,
  media_click: 0.4,
  media_expand: 0.65,
  video_play: 0.9,
  like: 1,
  comment: 2,
  share: 2.5,
  save: 2,
  follow: 2.5,
  hide: -2,
  report: -4,
  offer: 3,
  add_to_cart: 3,
  purchase: 5,
  apply: 5,
  rsvp: 3
}
