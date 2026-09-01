import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function readProfileRelationship(studentId) {
  return sendZumbarlApiRequest(`/connect/profiles/${encodeURIComponent(studentId)}/relationship`)
}

function setProfileRelationship(studentId, type, active) {
  return sendZumbarlApiRequest(`/connect/profiles/${encodeURIComponent(studentId)}/${type}`, {
    method: active ? 'POST' : 'DELETE',
  }).then((relationship) => {
    if (active) {
      recordRecommendationInteraction({ surface: 'people', entityType: 'student_profile', entityId: studentId, eventType: 'follow', metadata: { relationshipType: type } })
    }
    return relationship
  })
}

export { readProfileRelationship, setProfileRelationship }
