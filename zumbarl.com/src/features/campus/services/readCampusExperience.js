import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function readCampusHomeExperience() {
  return sendZumbarlApiRequest('/campus/home')
}

function readMyStudentProfileExperience() {
  return sendZumbarlApiRequest('/campus/profile/me')
}

function readStudentProfileExperience(studentId, { recordInteraction = true } = {}) {
  return sendZumbarlApiRequest(`/campus/profiles/${studentId}`).then((profile) => {
    if (recordInteraction) {
      recordRecommendationInteraction({ surface: 'people', entityType: 'student_profile', entityId: studentId, eventType: 'profile_click' })
    }
    return profile
  })
}
function updateMyStudentProfile(payload) {
  return sendZumbarlApiRequest('/campus/profile/me', { method: 'PATCH', body: JSON.stringify(payload) })
}

function updateMyPortfolioItem(id, payload) {
  return sendZumbarlApiRequest(`/campus/profile/me/portfolio/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

function publishMyPortfolioItem(id) {
  return sendZumbarlApiRequest(`/campus/profile/me/portfolio/${encodeURIComponent(id)}/publish`, { method: 'POST' })
}

function unpublishMyPortfolioItem(id) {
  return sendZumbarlApiRequest(`/campus/profile/me/portfolio/${encodeURIComponent(id)}/unpublish`, { method: 'POST' })
}

function archiveMyPortfolioItem(id) {
  return sendZumbarlApiRequest(`/campus/profile/me/portfolio/${encodeURIComponent(id)}/archive`, { method: 'POST' })
}

function shareMyPortfolioItem(id, payload) {
  return sendZumbarlApiRequest(`/campus/profile/me/portfolio/${encodeURIComponent(id)}/share`, { method: 'POST', body: JSON.stringify(payload) })
}

function sendCampusAssistantQuery(query, history = []) {
  return sendZumbarlApiRequest('/campus/assistant', {
    method: 'POST',
    body: JSON.stringify({ query, history }),
  })
}

export {
  archiveMyPortfolioItem,
  publishMyPortfolioItem,
  readCampusHomeExperience,
  readMyStudentProfileExperience,
  readStudentProfileExperience,
  sendCampusAssistantQuery,
  shareMyPortfolioItem,
  unpublishMyPortfolioItem,
  updateMyPortfolioItem,
  updateMyStudentProfile,
}
