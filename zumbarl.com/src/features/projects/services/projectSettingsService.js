import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readProjectSettings(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/settings`)
}

function updateProjectSettings(projectId, patch) {
  return sendZumbarlApiRequest(`/projects/${projectId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function startProject(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/start`, { method: 'POST' })
}

function endProject(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/end`, { method: 'POST' })
}

export { endProject, readProjectSettings, startProject, updateProjectSettings }
