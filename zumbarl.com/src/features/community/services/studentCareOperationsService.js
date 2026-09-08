import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readStudentCareOperations() {
  return sendZumbarlApiRequest('/support/operations')
}

function updateStudentCareCase(type, id, payload) {
  return sendZumbarlApiRequest(`/support/operations/cases/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function updateStudentCareEnrollment(id, payload) {
  return sendZumbarlApiRequest(`/support/operations/enrollments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function reviewStudentCareCircle(id, payload) {
  return sendZumbarlApiRequest(`/support/operations/circles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export { readStudentCareOperations, reviewStudentCareCircle, updateStudentCareCase, updateStudentCareEnrollment }
