import { API_BASE_URL, readZumbarlAuthToken } from '../../../lib/sendZumbarlApiRequest'

const subscribers = new Set()
let connectionController = null
let connectionTask = null
let reconnectTimer = null
let shutdownTimer = null

function publishEvent(event) {
  subscribers.forEach((subscriber) => {
    try {
      subscriber(event)
    } catch {
      // One consumer must not interrupt delivery to the others.
    }
  })
}

function waitForReconnect(delay, signal) {
  return new Promise((resolve) => {
    const finish = () => {
      signal.removeEventListener('abort', finish)
      reconnectTimer = null
      resolve()
    }
    reconnectTimer = window.setTimeout(finish, delay)
    signal.addEventListener('abort', finish, { once: true })
  })
}

async function readEventStream(signal) {
  const token = readZumbarlAuthToken()
  if (!token) return
  const response = await fetch(`${API_BASE_URL}/connect/events`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  })
  if (!response.ok || !response.body) throw new Error('Live updates are unavailable')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName = ''

  while (!signal.aborted) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''
    for (const block of blocks) {
      let data = ''
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (eventName && data) publishEvent({ type: eventName, data: JSON.parse(data) })
      eventName = ''
    }
  }
}

async function maintainConnection() {
  let attempt = 0
  while (subscribers.size > 0) {
    connectionController = new AbortController()
    try {
      await readEventStream(connectionController.signal)
      attempt = 0
    } catch {
      attempt += 1
    }
    if (connectionController.signal.aborted || subscribers.size === 0) break
    const baseDelay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5))
    const jitter = Math.floor(Math.random() * 500)
    await waitForReconnect(baseDelay + jitter, connectionController.signal)
  }
}

function ensureConnection() {
  if (connectionTask || subscribers.size === 0) return
  connectionTask = maintainConnection().finally(() => {
    connectionController = null
    connectionTask = null
    if (subscribers.size > 0 && readZumbarlAuthToken()) ensureConnection()
  })
}

function subscribeToRealtimeEvents(onEvent, signal) {
  if (signal?.aborted) return Promise.resolve()
  if (shutdownTimer) {
    window.clearTimeout(shutdownTimer)
    shutdownTimer = null
  }
  subscribers.add(onEvent)
  ensureConnection()

  return new Promise((resolve) => {
    const unsubscribe = () => {
      subscribers.delete(onEvent)
      signal?.removeEventListener('abort', unsubscribe)
      if (subscribers.size === 0) {
        shutdownTimer = window.setTimeout(() => {
          shutdownTimer = null
          if (subscribers.size === 0) {
            if (reconnectTimer) window.clearTimeout(reconnectTimer)
            connectionController?.abort()
          }
        }, 250)
      }
      resolve()
    }
    signal?.addEventListener('abort', unsubscribe, { once: true })
  })
}

export { subscribeToRealtimeEvents }
