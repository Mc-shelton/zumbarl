import { EventEmitter } from 'node:events'

type RealtimeEvent = {
  type: 'message.created' | 'message.delivered' | 'message.read' | 'notification.created' | 'call.created' | 'circle.message.created' | 'circle.message.removed'
  data: unknown
}

const realtimeEvents = new EventEmitter()
realtimeEvents.setMaxListeners(500)

function emitRealtimeEvent(userId: string, event: RealtimeEvent) {
  const delivered = realtimeEvents.listenerCount(userId) > 0
  realtimeEvents.emit(userId, event)
  return delivered
}

function hasRealtimeSubscribers(userId: string) {
  return realtimeEvents.listenerCount(userId) > 0
}

function subscribeToRealtimeEvents(userId: string, listener: (event: RealtimeEvent) => void) {
  realtimeEvents.on(userId, listener)
  return () => realtimeEvents.off(userId, listener)
}

export {
  emitRealtimeEvent,
  hasRealtimeSubscribers,
  subscribeToRealtimeEvents,
  type RealtimeEvent
}
