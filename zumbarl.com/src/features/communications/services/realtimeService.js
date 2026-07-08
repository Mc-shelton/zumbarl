import { API_BASE_URL, readZumbarlAuthToken } from '../../../lib/sendZumbarlApiRequest'

async function subscribeToRealtimeEvents(onEvent, signal) {
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
      if (eventName && eventName !== 'connected' && data) {
        onEvent({ type: eventName, data: JSON.parse(data) })
      }
      eventName = ''
    }
  }
}

export { subscribeToRealtimeEvents }
