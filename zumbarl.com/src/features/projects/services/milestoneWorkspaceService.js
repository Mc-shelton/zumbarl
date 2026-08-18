import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function readMilestoneWorkspace(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/milestone-workspace`)
}

function readProjectTimeline(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/timeline`)
}

function readProgramGates(projectId, milestoneId = '') {
  const query = milestoneId ? `?milestoneId=${encodeURIComponent(milestoneId)}` : ''
  return sendZumbarlApiRequest(`/projects/${projectId}/program-gates${query}`)
}

function createMilestone(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function fundMilestone(milestoneId) {
  return sendZumbarlApiRequest(`/projects/milestones/${milestoneId}/fund`, { method: 'POST' })
}

function activateMilestone(milestoneId) {
  return sendZumbarlApiRequest(`/projects/milestones/${milestoneId}/activate`, { method: 'POST' })
}

function updateMilestone(milestoneId, patch) {
  return sendZumbarlApiRequest(`/projects/milestones/${milestoneId}/scope`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function createMilestoneDeliverable(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/milestone-deliverables`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateMilestoneDeliverable(deliverableId, patch) {
  return sendZumbarlApiRequest(`/projects/milestone-deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function createProjectSprint(projectId, payload) {
  return sendZumbarlApiRequest(`/projects/${projectId}/sprints`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateProjectSprint(sprintId, patch) {
  return sendZumbarlApiRequest(`/projects/sprints/${sprintId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function assignSprintTasks(projectId, sprintId, taskIds) {
  return sendZumbarlApiRequest(`/projects/${projectId}/sprint-tasks`, {
    method: 'POST',
    body: JSON.stringify({ sprintId, taskIds }),
  })
}

export {
  activateMilestone,
  assignSprintTasks,
  createMilestone,
  fundMilestone,
  createMilestoneDeliverable,
  createProjectSprint,
  readMilestoneWorkspace,
  readProgramGates,
  readProjectTimeline,
  updateMilestone,
  updateMilestoneDeliverable,
  updateProjectSprint,
}
