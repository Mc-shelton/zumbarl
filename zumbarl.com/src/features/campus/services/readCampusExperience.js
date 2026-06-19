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

export {
  readCampusHomeExperience,
  readMyStudentProfileExperience,
  readStudentProfileExperience,
}
