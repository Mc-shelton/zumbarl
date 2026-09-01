import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listCommunityGroups({ page = 1, pageSize = 60 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return sendZumbarlApiRequest(`/connect/groups?${params.toString()}`)
}

function createCommunityGroup(payload) {
  return sendZumbarlApiRequest('/connect/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function joinCommunityGroup(groupId, membership = {}) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/join`, {
    method: 'POST',
    body: JSON.stringify(membership),
  })
}

function readSupportCircle(groupId) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle`)
}

function sendSupportCircleMessage(groupId, body) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

function createSupportCircleSchedule(groupId, payload) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/schedules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function respondToSupportCircleSchedule(groupId, scheduleId, status) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/schedules/${encodeURIComponent(scheduleId)}/rsvp`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

function decideSupportCircleScheduleAdmission(groupId, scheduleId, studentId, status) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/schedules/${encodeURIComponent(scheduleId)}/admissions/${encodeURIComponent(studentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

function createSupportCirclePost(groupId, payload) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/posts`, { method: 'POST', body: JSON.stringify(payload) })
}

function removeSupportCirclePost(groupId, postId) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' })
}

function updateSupportCircleMemberRole(groupId, membershipId, role) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/members/${encodeURIComponent(membershipId)}`, { method: 'PATCH', body: JSON.stringify({ role }) })
}

function removeSupportCircleMember(groupId, membershipId) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/members/${encodeURIComponent(membershipId)}`, { method: 'DELETE' })
}

function removeSupportCircleMessage(groupId, messageId) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' })
}

function joinSupportCircleAudioRoom(groupId, preferences = {}) {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/audio-room`, {
    method: 'POST',
    body: JSON.stringify({ useAlias: preferences.useAlias !== false, voiceShieldEnabled: preferences.voiceShieldEnabled !== false, scheduleId: preferences.scheduleId || undefined }),
  })
}

function updateSupportCircleAudioPresence(groupId, room, action = 'heartbeat') {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/support-circle/audio-room/presence`, {
    method: 'POST',
    body: JSON.stringify({ roomUrl: room.roomUrl, scheduleId: room.scheduleId || undefined, action }),
  })
}

function contributeToCommunityChama(groupId, amount, currency = 'KES') {
  return sendZumbarlApiRequest(`/connect/groups/${encodeURIComponent(groupId)}/chama-contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount, currency }),
  })
}

export {
  contributeToCommunityChama,
  createCommunityGroup,
  decideSupportCircleScheduleAdmission,
  createSupportCircleSchedule,
  createSupportCirclePost,
  joinCommunityGroup,
  joinSupportCircleAudioRoom,
  updateSupportCircleAudioPresence,
  listCommunityGroups,
  readSupportCircle,
  removeSupportCircleMember,
  removeSupportCircleMessage,
  removeSupportCirclePost,
  respondToSupportCircleSchedule,
  sendSupportCircleMessage,
  updateSupportCircleMemberRole,
}
