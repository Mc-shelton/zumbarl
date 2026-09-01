import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const SESSION_KEY = 'zumbarl.recommendations.session.v1'
const recordedImpressions = new Set()
const recordedInteractions = new Set()

function recommendationSessionId() {
  if (typeof window === 'undefined') return undefined
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const created = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    return undefined
  }
}

function recordRecommendationEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return Promise.resolve({ accepted: 0 })
  const sessionId = recommendationSessionId()
  return sendZumbarlApiRequest('/recommendations/events', {
    method: 'POST',
    body: JSON.stringify({
      events: events.map((event) => ({ ...event, ...(sessionId ? { sessionId } : {}) })),
    }),
  })
}

function recordRecommendationEventsBestEffort(events) {
  void recordRecommendationEvents(events).catch(() => {})
}

function recordRecommendationInteraction(event, { dedupeKey = '' } = {}) {
  if (!event?.surface || !event?.entityType || !event?.entityId || !event?.eventType) return
  const metadataKey = dedupeKey || [event.metadata?.mediaIndex, event.metadata?.channel].filter((value) => value !== undefined).join(':')
  const key = `${event.surface}:${event.entityType}:${event.entityId}:${event.eventType}:${metadataKey}`
  if (recordedInteractions.has(key)) return
  recordedInteractions.add(key)
  recordRecommendationEventsBestEffort([event])
}

function recordRecommendationImpressions(surface, entityType, items, limit = 25) {
  const events = (Array.isArray(items) ? items : []).slice(0, limit).flatMap((item, position) => {
    if (!item?.id) return []
    const key = `${surface}:${entityType}:${item.id}`
    if (recordedImpressions.has(key)) return []
    recordedImpressions.add(key)
    return [{ surface, entityType, entityId: String(item.id), eventType: 'impression', position }]
  })
  recordRecommendationEventsBestEffort(events)
}

function withRecommendationEvent(request, event) {
  return Promise.resolve(request).then((result) => {
    recordRecommendationEventsBestEffort([event])
    return result
  })
}

export {
  recordRecommendationEvents,
  recordRecommendationEventsBestEffort,
  recordRecommendationInteraction,
  recordRecommendationImpressions,
  withRecommendationEvent,
}
