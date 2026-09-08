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

function requestTalkItOutHandoff(conversationId, payload) {
  return sendZumbarlApiRequest(`/support/wellbeing/conversations/${encodeURIComponent(conversationId)}/handoff`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function listStudentCarePrograms() {
  return sendZumbarlApiRequest('/support/care-programs')
}

function enrollInStudentCareProgram(programId, payload) {
  return sendZumbarlApiRequest(`/support/care-programs/${encodeURIComponent(programId)}/enrollments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function recordStudentCareCheckIn(enrollmentId, payload) {
  return sendZumbarlApiRequest(`/support/care-enrollments/${encodeURIComponent(enrollmentId)}/check-ins`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export {
  completeWellbeingReset,
  createDailyCheckIn,
  createTalkItOutConversation,
  enrollInStudentCareProgram,
  listStudentCarePrograms,
  readTalkItOutConversation,
  readWellbeingDashboard,
  requestCounselorSession,
  requestTalkItOutHandoff,
  recordStudentCareCheckIn,
  sendTalkItOutMessage,
  submitWellbeingCheckIn,
  updateWellbeingPreferences,
}
