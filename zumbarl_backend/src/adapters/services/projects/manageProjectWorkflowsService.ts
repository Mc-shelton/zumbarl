import { notFound } from '../../../lib/http.js'
import { projectWorkflowsRepository } from '../../repositories/projects/index.js'

function listProjectsService(query: Record<string, unknown>) {
  return projectWorkflowsRepository.listProjects(query)
}

async function createProjectService(businessId: string | undefined, payload: Record<string, any>) {
  return projectWorkflowsRepository.createProjectWithMilestones({
    title: payload.title,
    objectives: payload.objectives,
    terms: payload.terms,
    businessId,
    status: 'draft',
    fundingStatus: 'unfunded',
    scopeLocked: false
  }, payload.milestones)
}

async function readProjectWorkspaceService(id: string) {
  const workspace = await projectWorkflowsRepository.readProjectWorkspace(id)
  if (!workspace.project) notFound('Project')
  return workspace
}

async function applyToProjectService(projectId: string, studentId: string | undefined, payload: Record<string, any>) {
  await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  return projectWorkflowsRepository.createApplication({ ...payload, projectId, studentId, status: 'submitted' })
}

async function acceptProjectApplicationService(id: string) {
  const application = await projectWorkflowsRepository.updateApplication(id, { status: 'accepted' }) ?? notFound('Project application')
  return {
    application,
    payCalculation: {
      method: 'milestone-budget * role-weight * student-score-factor',
      estimatedSharePercent: 20
    }
  }
}

async function createMilestoneService(projectId: string, payload: Record<string, any>) {
  await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  return projectWorkflowsRepository.createMilestone({ ...payload, projectId, status: 'draft', fundingStatus: 'unfunded' })
}

async function fundMilestoneService(id: string) {
  return await projectWorkflowsRepository.fundMilestone(id) ?? notFound('Milestone')
}

async function activateMilestoneService(id: string) {
  return await projectWorkflowsRepository.activateMilestone(id) ?? notFound('Milestone')
}

async function createProjectTaskService(projectId: string, payload: Record<string, any>) {
  await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  return projectWorkflowsRepository.createTask({ ...payload, projectId })
}

async function updateProjectTaskService(id: string, payload: Record<string, any>) {
  return await projectWorkflowsRepository.updateTask(id, payload) ?? notFound('Task')
}

async function reviewDeliverableService(id: string, payload: Record<string, any>) {
  return await projectWorkflowsRepository.reviewDeliverable(id, payload) ?? notFound('Deliverable')
}

export {
  listProjectsService,
  createProjectService,
  readProjectWorkspaceService,
  applyToProjectService,
  acceptProjectApplicationService,
  createMilestoneService,
  fundMilestoneService,
  activateMilestoneService,
  createProjectTaskService,
  updateProjectTaskService,
  reviewDeliverableService
}
