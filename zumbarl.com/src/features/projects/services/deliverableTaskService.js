import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listDeliverableTasks(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/deliverable-tasks`)
}

function declareDeliverableTask(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/deliverable-tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateDeliverableTask(taskId, patch) {
  return sendZumbarlApiRequest(`/projects/deliverable-tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function claimDeliverableTask(taskId, studentId) {
  return updateDeliverableTask(taskId, { ownerId: studentId })
}

function releaseDeliverableTask(taskId) {
  return updateDeliverableTask(taskId, { ownerId: null })
}

function dropDeliverableTask(taskId, droppedReason) {
  return updateDeliverableTask(taskId, { status: 'dropped', droppedReason })
}

function confirmDeliverableSplit(projectId, scopeItemId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/deliverable-splits/${scopeItemId}/confirm`, {
    method: 'POST',
  })
}

function createDeliverableNote(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/deliverable-notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function createDeliverableDependency(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/deliverable-dependencies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function resolveDeliverableDependency(dependencyId, resolved = true) {
  return sendZumbarlApiRequest(`/projects/deliverable-dependencies/${dependencyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved }),
  })
}

function setTaskSprint(taskId, sprintId) {
  return updateDeliverableTask(taskId, { sprintId })
}

function setTaskBlockers(taskId, { blockedByIds, blockedByDependencyIds }) {
  return updateDeliverableTask(taskId, { blockedByIds, blockedByDependencyIds })
}

export {
  claimDeliverableTask,
  createDeliverableDependency,
  resolveDeliverableDependency,
  setTaskBlockers,
  setTaskSprint,
  confirmDeliverableSplit,
  createDeliverableNote,
  declareDeliverableTask,
  dropDeliverableTask,
  listDeliverableTasks,
  releaseDeliverableTask,
  updateDeliverableTask,
}
