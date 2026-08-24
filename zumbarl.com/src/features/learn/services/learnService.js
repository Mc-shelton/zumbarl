import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readLearnExperience() {
  return Promise.all([
    sendZumbarlApiRequest('/learn/ladders'),
    sendZumbarlApiRequest('/learn/baseline'),
    sendZumbarlApiRequest('/learn/roadmaps?pageSize=20'),
  ]).then(([ladders, baseline, roadmaps]) => ({
    ladders: ladders?.data || [],
    baseline,
    roadmaps: roadmaps?.data || [],
  }))
}

function createRoadmap(ladderId, intent) {
  return sendZumbarlApiRequest('/learn/roadmaps', {
    method: 'POST',
    body: JSON.stringify({ ladderId, intent }),
  })
}

function readRoadmapEnrollment(enrollmentId) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}`)
}

function lockRoadmap(enrollmentId) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/lock`, { method: 'POST' })
}

function submitRoadmapEvidence(enrollmentId, payload) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/evidence`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function completeRoadmapAssessment(enrollmentId, checkpointId, answers) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/tests`, {
    method: 'POST',
    body: JSON.stringify({ checkpointId, answers }),
  })
}

function submitLearningPractice(enrollmentId, payload) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/practice-submissions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function verifyRoadmap(enrollmentId) {
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/verify`, { method: 'POST' })
}

function readRoadmapRecommendations(enrollmentId) {
  if (!enrollmentId) return Promise.resolve([])
  return sendZumbarlApiRequest(`/learn/roadmaps/${encodeURIComponent(enrollmentId)}/recommendations`)
    .then((payload) => payload?.data || [])
}

function readKnowledgeHub(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value && value !== 'all'))
  return sendZumbarlApiRequest(`/learn/knowledge${params.size ? `?${params}` : ''}`)
}

function readKnowledgeSpace(spaceSlug) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceSlug)}`)
}

function updateKnowledgeSpace(spaceId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}`, {
    method: 'PATCH', body: JSON.stringify(payload),
  })
}

function listKnowledgeManagerCandidates(spaceId, query = '') {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/manager-candidates${params.size ? `?${params}` : ''}`)
}

function addKnowledgeManager(spaceId, studentId) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/managers`, {
    method: 'POST', body: JSON.stringify({ studentId }),
  })
}

function removeKnowledgeManager(spaceId, studentId) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/managers/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
  })
}

function decideKnowledgeMembershipRequest(spaceId, studentId, action) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/requests/${encodeURIComponent(studentId)}`, {
    method: 'PUT', body: JSON.stringify({ action }),
  })
}

function createKnowledgeRoom(spaceId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/rooms`, {
    method: 'POST', body: JSON.stringify(payload),
  })
}

function createKnowledgeSpacePost(spaceId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/posts`, {
    method: 'POST', body: JSON.stringify(payload),
  })
}

function updateKnowledgeSpacePost(spaceId, postId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH', body: JSON.stringify(payload),
  })
}

function takeDownKnowledgeSpacePost(spaceId, postId) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  })
}

function readKnowledgeRoom(roomId) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}`)
}

function updateKnowledgeRoom(roomId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH', body: JSON.stringify(payload),
  })
}

function setKnowledgeRoomMembership(roomId, active) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}/membership`, {
    method: 'PUT', body: JSON.stringify({ active }),
  })
}

function decideKnowledgeRoomMembershipRequest(roomId, studentId, action) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}/requests/${encodeURIComponent(studentId)}`, {
    method: 'PUT', body: JSON.stringify({ action }),
  })
}

function readKnowledgeRoomMessages(roomId) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}/messages`)
}

function sendKnowledgeRoomMessage(roomId, payload) {
  return sendZumbarlApiRequest(`/learn/knowledge/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST', body: JSON.stringify(typeof payload === 'string' ? { body: payload } : payload),
  })
}

function createKnowledgeSpace(payload) {
  return sendZumbarlApiRequest('/learn/knowledge/spaces', { method: 'POST', body: JSON.stringify(payload) })
}

function createKnowledgeResource(payload) {
  return sendZumbarlApiRequest('/learn/knowledge/resources', { method: 'POST', body: JSON.stringify(payload) })
}

function searchKnowledgeUnits(query) {
  return sendZumbarlApiRequest(`/learn/knowledge/units?q=${encodeURIComponent(query || '')}`)
}

function decideKnowledgeResourceSubmission(spaceId, resourceId, action) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/resources/${encodeURIComponent(resourceId)}`, {
    method: 'PUT', body: JSON.stringify({ action }),
  })
}

function decideKnowledgeResourceAccessRequest(spaceId, accessId, action) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/access-requests/${encodeURIComponent(accessId)}`, {
    method: 'PUT', body: JSON.stringify({ action }),
  })
}

function setKnowledgeSpaceMembership(spaceId, active) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/membership`, {
    method: 'PUT', body: JSON.stringify({ active }),
  })
}

function setKnowledgeSpaceFollowing(spaceId, active) {
  return sendZumbarlApiRequest(`/learn/knowledge/spaces/${encodeURIComponent(spaceId)}/following`, {
    method: 'PUT', body: JSON.stringify({ active }),
  })
}

function accessKnowledgeResource(resourceId, action) {
  return sendZumbarlApiRequest(`/learn/knowledge/resources/${encodeURIComponent(resourceId)}/access`, {
    method: 'POST', body: JSON.stringify({ action }),
  })
}

function readKnowledgeResourceCheckout(resourceId) {
  return sendZumbarlApiRequest(`/learn/knowledge/resources/${encodeURIComponent(resourceId)}/checkout`)
}

function purchaseKnowledgeResource(resourceId) {
  return sendZumbarlApiRequest(`/learn/knowledge/resources/${encodeURIComponent(resourceId)}/purchase`, {
    method: 'POST', body: JSON.stringify({ paymentMethod: 'WALLET' }),
  })
}

export {
  completeRoadmapAssessment,
  accessKnowledgeResource,
  addKnowledgeManager,
  createKnowledgeRoom,
  createKnowledgeSpacePost,
  createKnowledgeResource,
  createKnowledgeSpace,
  createRoadmap,
  decideKnowledgeMembershipRequest,
  decideKnowledgeResourceAccessRequest,
  decideKnowledgeResourceSubmission,
  decideKnowledgeRoomMembershipRequest,
  listKnowledgeManagerCandidates,
  lockRoadmap,
  readLearnExperience,
  readKnowledgeHub,
  readKnowledgeResourceCheckout,
  readKnowledgeRoomMessages,
  readKnowledgeRoom,
  readKnowledgeSpace,
  readRoadmapEnrollment,
  readRoadmapRecommendations,
  removeKnowledgeManager,
  purchaseKnowledgeResource,
  sendKnowledgeRoomMessage,
  searchKnowledgeUnits,
  submitLearningPractice,
  submitRoadmapEvidence,
  takeDownKnowledgeSpacePost,
  setKnowledgeSpaceFollowing,
  setKnowledgeSpaceMembership,
  setKnowledgeRoomMembership,
  updateKnowledgeSpace,
  updateKnowledgeSpacePost,
  updateKnowledgeRoom,
  verifyRoadmap,
}
