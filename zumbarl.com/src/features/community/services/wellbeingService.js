import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function submitWellbeingCheckIn(payload) {
  return sendZumbarlApiRequest('/support/wellness-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function requestCounselorSession(payload) {
  return sendZumbarlApiRequest('/support/counselor-bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function readWellbeingDashboard() {
  return sendZumbarlApiRequest('/support/wellbeing')
}

function createDailyCheckIn(payload) {
  return sendZumbarlApiRequest('/support/wellbeing/check-ins', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateWellbeingPreferences(payload) {
  return sendZumbarlApiRequest('/support/wellbeing/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function completeWellbeingReset(payload) {
  return sendZumbarlApiRequest('/support/wellbeing/resets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function createTalkItOutConversation() {
  return sendZumbarlApiRequest('/support/wellbeing/conversations', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

function readTalkItOutConversation(conversationId) {
  return sendZumbarlApiRequest(`/support/wellbeing/conversations/${encodeURIComponent(conversationId)}`)
}

function sendTalkItOutMessage(conversationId, message) {
  return sendZumbarlApiRequest(`/support/wellbeing/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export {
  completeWellbeingReset,
  createDailyCheckIn,
  createTalkItOutConversation,
  readTalkItOutConversation,
  readWellbeingDashboard,
  requestCounselorSession,
  sendTalkItOutMessage,
  submitWellbeingCheckIn,
  updateWellbeingPreferences,
}
