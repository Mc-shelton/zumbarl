import {
  API_BASE_URL,
  readZumbarlAuthToken,
  sendZumbarlApiRequest,
} from '../../../lib/sendZumbarlApiRequest'

function sendPresenceHeartbeat() {
  return sendZumbarlApiRequest('/connect/presence/heartbeat', { method: 'POST' })
}

function createCall({ recipientId, opportunityId, callType }) {
  return sendZumbarlApiRequest('/connect/calls', {
    method: 'POST',
    body: JSON.stringify({ recipientId, opportunityId: opportunityId || undefined, callType }),
  })
}

function listIncomingCalls() {
  return sendZumbarlApiRequest('/connect/calls/incoming')
}

function readCall(callId) {
  return sendZumbarlApiRequest(`/connect/calls/${callId}`)
}

function respondToCall(callId, response) {
  return sendZumbarlApiRequest(`/connect/calls/${callId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify({ response }),
  })
}

function cancelCall(callId) {
  return sendZumbarlApiRequest(`/connect/calls/${callId}/cancel`, { method: 'PATCH' })
}

function endCall(callId) {
  return sendZumbarlApiRequest(`/connect/calls/${callId}/end`, { method: 'PATCH' })
}

function endCallOnPageClose(callId) {
  const token = readZumbarlAuthToken()
  if (!callId || !token) return
  fetch(`${API_BASE_URL}/connect/calls/${callId}/end`, {
    method: 'PATCH',
    keepalive: true,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {})
}

export {
  sendPresenceHeartbeat,
  createCall,
  listIncomingCalls,
  readCall,
  respondToCall,
  cancelCall,
  endCall,
  endCallOnPageClose,
}
