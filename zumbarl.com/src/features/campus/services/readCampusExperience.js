import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function readCampusHomeExperience() {
  return sendZumbarlApiRequest('/campus/home')
}

function readMyStudentProfileExperience() {
  return sendZumbarlApiRequest('/campus/profile/me')
}

function readStudentProfileExperience(studentId) {
  return sendZumbarlApiRequest(`/campus/profiles/${studentId}`).then((profile) => {
    recordRecommendationInteraction({ surface: 'people', entityType: 'student_profile', entityId: studentId, eventType: 'profile_click' })
    return profile
  })
}
function updateMyStudentProfile(payload) {
  return sendZumbarlApiRequest('/campus/profile/me', { method: 'PATCH', body: JSON.stringify(payload) })
}

function sendCampusAssistantQuery(query, history = []) {
  return sendZumbarlApiRequest('/campus/assistant', {
    method: 'POST',
    body: JSON.stringify({ query, history }),
  })
}

export {
  readCampusHomeExperience,
  readMyStudentProfileExperience,
  readStudentProfileExperience,
  sendCampusAssistantQuery,
  updateMyStudentProfile,
}
