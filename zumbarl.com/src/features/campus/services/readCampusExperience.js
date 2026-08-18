import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readCampusHomeExperience() {
  return sendZumbarlApiRequest('/campus/home')
}

function readMyStudentProfileExperience() {
  return sendZumbarlApiRequest('/campus/profile/me')
}

function readStudentProfileExperience(studentId) {
  return sendZumbarlApiRequest(`/campus/profiles/${studentId}`)
}
function updateMyStudentProfile(payload) {
  return sendZumbarlApiRequest('/campus/profile/me', { method: 'PATCH', body: JSON.stringify(payload) })
}

function sendCampusAssistantQuery(query) {
  return sendZumbarlApiRequest('/campus/assistant', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export {
  readCampusHomeExperience,
  readMyStudentProfileExperience,
  readStudentProfileExperience,
  sendCampusAssistantQuery,
  updateMyStudentProfile,
}
