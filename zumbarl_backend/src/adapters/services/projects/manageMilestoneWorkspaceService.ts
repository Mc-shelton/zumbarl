import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import type { AuthUser } from '../../../lib/security.js'
import { milestoneWorkspaceRepository } from '../../repositories/projects/milestoneWorkspace.repository.js'
import { projectWorkflowsRepository } from '../../repositories/projects/index.js'

const WORKSPACE_ADMIN_ROLES = new Set(['admin', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'])

function requireActor(authUser: AuthUser | undefined): AuthUser {
  if (!authUser) throw new ApiError(401, 'Authentication required', 'AUTH_REQUIRED')
  return authUser
}

// Everyone on the project reads the same workspace; the business and the team
// both plan against it, which is the point of a shared board.
async function assertCanRead(projectId: string, authUser: AuthUser | undefined) {
  const actor = requireActor(authUser)
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  const team = await projectWorkflowsRepository.listProjectTeam(projectId)
  const isMember = team.members?.some((member: Record<string, any>) => member.userId === actor.id)
  const canRead = WORKSPACE_ADMIN_ROLES.has(actor.role)
    || isMember
    || Boolean(actor.studentId && project.studentId === actor.studentId)
    || Boolean(actor.businessId && project.businessId === actor.businessId)

  if (!canRead) forbidden('You do not have access to this project')
  return { actor, project, isMember: Boolean(isMember) }
}

// Sprints are the team's planning tool, so anyone working on the project can
// create and adjust them.
async function assertCanPlan(projectId: string, authUser: AuthUser | undefined) {
  const context = await assertCanRead(projectId, authUser)
  const isBusiness = Boolean(context.actor.businessId && context.project.businessId === context.actor.businessId)
  if (!context.isMember && !isBusiness && !WORKSPACE_ADMIN_ROLES.has(context.actor.role)) {
    forbidden('Only people working on this project can plan sprints')
  }
  return context
}

async function settleTaskPayoutsService(projectId: string, authUser: AuthUser | undefined) {
  await assertCanPlan(projectId, authUser)
  return milestoneWorkspaceRepository.settleApprovedTaskPayouts(projectId)
}

async function readMilestoneWorkspaceService(projectId: string, authUser: AuthUser | undefined) {
  await assertCanRead(projectId, authUser)
  const [milestones, deliverables, sprints] = await Promise.all([
    milestoneWorkspaceRepository.listMilestones(projectId),
    milestoneWorkspaceRepository.listDeliverables(projectId),
    milestoneWorkspaceRepository.listSprints(projectId)
  ])
  // Each milestone's money position travels with it so the UI can prompt for
  // funds without a second round trip.
  const budgets = await Promise.all(milestones.map((milestone) => (
    milestoneWorkspaceRepository.readMilestoneBudgetState(projectId, milestone.id)
  )))

  return {
    milestones: milestones.map((milestone, index) => ({ ...milestone, budget: budgets[index] })),
    deliverables,
    sprints
  }
}

async function readProjectTimelineService(projectId: string, authUser: AuthUser | undefined) {
  await assertCanRead(projectId, authUser)
  return milestoneWorkspaceRepository.readTimeline(projectId)
}

async function readProgramGatesService(
  projectId: string,
  milestoneId: string | null,
  authUser: AuthUser | undefined
) {
  await assertCanRead(projectId, authUser)
  return await milestoneWorkspaceRepository.readProgramGates(projectId, milestoneId) ?? notFound('Project')
}

async function updateMilestoneService(
  milestoneId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const existing = await milestoneWorkspaceRepository.findMilestoneRecord(milestoneId) ?? notFound('Milestone')
  await assertCanPlan(existing.projectId, authUser)
  return milestoneWorkspaceRepository.updateMilestone(milestoneId, payload)
}

async function createMilestoneDeliverableService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  await assertCanPlan(projectId, authUser)
  return milestoneWorkspaceRepository.createDeliverable(projectId, payload)
}

async function updateMilestoneDeliverableService(
  deliverableId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const existing = await milestoneWorkspaceRepository.findDeliverable(deliverableId) ?? notFound('Deliverable')
  await assertCanPlan(existing.projectId, authUser)
  return milestoneWorkspaceRepository.updateDeliverable(deliverableId, payload)
}

async function createProjectSprintService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  await assertCanPlan(projectId, authUser)
  return milestoneWorkspaceRepository.createSprint(projectId, payload)
}

async function updateProjectSprintService(
  sprintId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const existing = await milestoneWorkspaceRepository.findSprint(sprintId) ?? notFound('Sprint')
  await assertCanPlan(existing.projectId, authUser)
  if (payload.status === 'active') {
    const activeSprint = await milestoneWorkspaceRepository.findActiveSprint(existing.projectId, sprintId)
    if (activeSprint) {
      throw new ApiError(
        409,
        `Complete ${activeSprint.name} before starting another sprint`,
        'ACTIVE_SPRINT_EXISTS'
      )
    }
  }
  return milestoneWorkspaceRepository.updateSprint(sprintId, payload)
}

async function assignSprintTasksService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  await assertCanPlan(projectId, authUser)
  const assigned = await milestoneWorkspaceRepository.assignTasksToSprint(
    projectId,
    payload.sprintId ?? null,
    Array.isArray(payload.taskIds) ? payload.taskIds.map(String) : []
  )
  return { assigned }
}

export {
  assignSprintTasksService,
  settleTaskPayoutsService,
  updateMilestoneService,
  createMilestoneDeliverableService,
  createProjectSprintService,
  readMilestoneWorkspaceService,
  readProgramGatesService,
  readProjectTimelineService,
  updateMilestoneDeliverableService,
  updateProjectSprintService
}
