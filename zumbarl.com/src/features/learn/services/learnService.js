import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import {
  recordRecommendationEventsBestEffort,
  recordRecommendationImpressions,
  recordRecommendationInteraction,
} from '../../recommendations/services/recommendationEventService'

const learningResourceEvent = (resourceId, eventType, metadata) => ({
  surface: 'learning',
  entityType: 'knowledge_resource',
  entityId: String(resourceId),
  eventType,
  ...(metadata ? { metadata } : {}),
})

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
  return sendZumbarlApiRequest(`/learn/knowledge${params.size ? `?${params}` : ''}`).then((response) => {
    recordRecommendationImpressions('learning', 'knowledge_resource', response?.resources, 80)
    return response
  })
}

function recordKnowledgeResourceOpen(resourceId) {
  if (!resourceId) return
  recordRecommendationInteraction(learningResourceEvent(resourceId, 'open'))
}

function recordKnowledgeResourceDwell(resourceId, durationSeconds) {
  if (!resourceId) return
  const duration = Math.min(3600, Math.max(0, Math.round(Number(durationSeconds) || 0)))
  if (duration < 10) return
  recordRecommendationEventsBestEffort([learningResourceEvent(resourceId, 'dwell', { durationSeconds: duration })])
}

function recordKnowledgeResourceDownload(resourceId, source = 'attachment') {
  if (!resourceId) return
  recordRecommendationInteraction(learningResourceEvent(resourceId, 'download', { source }))
}

function recordKnowledgeResourceVideoPlay(resourceId, source = 'attachment') {
  if (!resourceId) return
  recordRecommendationInteraction(learningResourceEvent(resourceId, 'video_play', { source }))
}

function recordKnowledgeResourceProgress(resourceId, progressPercent) {
  if (!resourceId) return
  const progress = Math.min(100, Math.max(0, Math.round(Number(progressPercent) || 0)))
  const milestone = [25, 50, 75, 100].findLast((value) => progress >= value)
  if (!milestone) return
  recordRecommendationInteraction(
    learningResourceEvent(resourceId, 'progress', { progressPercent: milestone }),
    { dedupeKey: `progress-${milestone}` },
  )
}

function recordKnowledgeResourceComplete(resourceId, source = 'attachment') {
  if (!resourceId) return
  recordRecommendationInteraction(learningResourceEvent(resourceId, 'complete', { source }))
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
  }).then((resource) => {
    const normalizedAction = String(action).toLowerCase()
    const eventType = { read: 'start', save: 'save', borrow: 'borrow' }[normalizedAction]
    const status = resource?.viewerActions?.[normalizedAction]?.status
    if (eventType && status !== 'cancelled') {
      recordRecommendationInteraction(learningResourceEvent(resourceId, eventType))
    }
    return resource
  })
}

function readKnowledgeResourceCheckout(resourceId) {
  return sendZumbarlApiRequest(`/learn/knowledge/resources/${encodeURIComponent(resourceId)}/checkout`)
}

function purchaseKnowledgeResource(resourceId) {
  return sendZumbarlApiRequest(`/learn/knowledge/resources/${encodeURIComponent(resourceId)}/purchase`, {
    method: 'POST', body: JSON.stringify({ paymentMethod: 'WALLET' }),
  }).then((resource) => {
    recordRecommendationInteraction(learningResourceEvent(resourceId, 'purchase'))
    return resource
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
  recordKnowledgeResourceDownload,
  recordKnowledgeResourceDwell,
  recordKnowledgeResourceComplete,
  recordKnowledgeResourceOpen,
  recordKnowledgeResourceProgress,
  recordKnowledgeResourceVideoPlay,
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
