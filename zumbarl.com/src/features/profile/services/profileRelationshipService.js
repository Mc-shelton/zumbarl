import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readProfileRelationship(studentId) {
  return sendZumbarlApiRequest(`/connect/profiles/${encodeURIComponent(studentId)}/relationship`)
}

function setProfileRelationship(studentId, type, active) {
  return sendZumbarlApiRequest(`/connect/profiles/${encodeURIComponent(studentId)}/${type}`, {
    method: active ? 'POST' : 'DELETE',
  })
}

export { readProfileRelationship, setProfileRelationship }
