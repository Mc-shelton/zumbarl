import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import type { AuthUser } from '../../../lib/security.js'
import { deliverableTasksRepository } from '../../repositories/projects/deliverableTasks.repository.js'
import { projectWorkflowsRepository } from '../../repositories/projects/index.js'
import { milestoneWorkspaceRepository } from '../../repositories/projects/milestoneWorkspace.repository.js'

const TASK_ADMIN_ROLES = new Set(['admin', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'])

function requireActor(authUser: AuthUser | undefined): AuthUser {
  if (!authUser) throw new ApiError(401, 'Authentication required', 'AUTH_REQUIRED')
  return authUser
}

// The project team and the paying business share one task board. Students may
// declare/claim their work; the owning business may declare work, assign it to a
// student, or leave it in the pool for the team to claim.
async function assertCanReadTasks(projectId: string, authUser: AuthUser | undefined) {
  const actor = requireActor(authUser)
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  const team = await projectWorkflowsRepository.listProjectTeam(projectId)
  const isMember = team.members?.some((member: Record<string, any>) => member.userId === actor.id)
  const canRead = TASK_ADMIN_ROLES.has(actor.role)
    || isMember
    || Boolean(actor.studentId && project.studentId === actor.studentId)
    || Boolean(actor.businessId && project.businessId === actor.businessId)

  if (!canRead) forbidden('You do not have access to this project')
  return { actor, project, isMember: Boolean(isMember) }
}

// Reading is not the same as taking part. The business cannot touch tasks — the
// split is the team's to agree — but it can answer in the thread and clear a
// dependency it is itself the holdup for.
async function assertCanParticipate(projectId: string, authUser: AuthUser | undefined) {
  return assertCanReadTasks(projectId, authUser)
}

async function assertCanWriteTasks(projectId: string, authUser: AuthUser | undefined) {
  const context = await assertCanReadTasks(projectId, authUser)
  const isAwardedStudent = Boolean(context.actor.studentId && context.project.studentId === context.actor.studentId)
  const isOwningBusiness = Boolean(context.actor.businessId && context.project.businessId === context.actor.businessId)
  if (!context.isMember && !isAwardedStudent && !isOwningBusiness && !TASK_ADMIN_ROLES.has(context.actor.role)) {
    forbidden('Only this project’s business or student team can change its tasks')
  }
  return { ...context, isOwningBusiness }
}

async function listDeliverableTasksService(projectId: string, authUser: AuthUser | undefined) {
  const { actor, project, isMember } = await assertCanReadTasks(projectId, authUser)
  const [tasks, workload, splitLocks, notes, dependencies] = await Promise.all([
    deliverableTasksRepository.listProjectTasks(projectId),
    deliverableTasksRepository.readProjectWorkload(projectId),
    deliverableTasksRepository.listSplitLocks(projectId),
    deliverableTasksRepository.listNotes(projectId),
    deliverableTasksRepository.listDependencies(projectId)
  ])
  const isOwningBusiness = Boolean(actor.businessId && project.businessId === actor.businessId)
  return {
    tasks,
    workload,
    splitLocks,
    notes,
    dependencies,
    viewerStudentId: actor.studentId ?? null,
    canEdit: isMember || Boolean(actor.studentId) || isOwningBusiness,
    canAssignTasks: isOwningBusiness || TASK_ADMIN_ROLES.has(actor.role),
    canParticipate: true
  }
}

async function confirmDeliverableSplitService(
  projectId: string,
  scopeItemId: string,
  authUser: AuthUser | undefined
) {
  const { actor } = await assertCanWriteTasks(projectId, authUser)
  if (!actor.studentId) forbidden('Only a contributor can confirm a split')

  const result = await deliverableTasksRepository.confirmDeliverableSplit(projectId, scopeItemId, actor.studentId as string)
  if (!result) notFound('Split')
  if ('notAContributor' in result) {
    throw new ApiError(
      403,
      'Only students credited on this deliverable can confirm its split.',
      'SPLIT_CONFIRM_NOT_CONTRIBUTOR'
    )
  }
  return result.lock
}

async function createDeliverableDependencyService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const { actor } = await assertCanParticipate(projectId, authUser)
  return deliverableTasksRepository.createDependency(projectId, payload, { id: actor.id, name: actor.email })
}

async function resolveDeliverableDependencyService(
  dependencyId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const dependency = await deliverableTasksRepository.findDependency(dependencyId) ?? notFound('Dependency')
  await assertCanParticipate(dependency.projectId, authUser)
  return deliverableTasksRepository.resolveDependency(dependencyId, payload.resolved !== false)
}

async function readProjectSettingsService(projectId: string, authUser: AuthUser | undefined) {
  await assertCanReadTasks(projectId, authUser)
  return deliverableTasksRepository.readProjectSettings(projectId)
}

// Only the business sets the rules it will be paying under.
async function updateProjectSettingsService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const { actor, project } = await assertCanReadTasks(projectId, authUser)
  const isBusiness = Boolean(actor.businessId && project.businessId === actor.businessId)
  if (!isBusiness && !TASK_ADMIN_ROLES.has(actor.role)) {
    forbidden('Only the business can change project settings')
  }
  return deliverableTasksRepository.updateProjectSettings(projectId, payload)
}

async function createDeliverableNoteService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const { actor } = await assertCanParticipate(projectId, authUser)
  return deliverableTasksRepository.createNote(projectId, payload, { id: actor.id, name: actor.email })
}

async function declareDeliverableTaskService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const { actor, project, isOwningBusiness } = await assertCanWriteTasks(projectId, authUser)

  // A dormant deliverable is one the milestone budget cannot currently cover, so
  // no more work is allowed to accrue against it.
  if (payload.milestoneDeliverableId) {
    const deliverable = await milestoneWorkspaceRepository.findDeliverable(payload.milestoneDeliverableId)
    if (deliverable?.status === 'dormant') {
      throw new ApiError(
        409,
        'This deliverable is parked because the milestone budget does not cover it. The business needs to add funds before work can be added to it.',
        'DELIVERABLE_DORMANT'
      )
    }
  }

  if (payload.ownerId) {
    const team = await projectWorkflowsRepository.listProjectTeam(projectId)
    const validOwner = team.members?.some((member: Record<string, any>) => member.studentId === payload.ownerId)
      || project.studentId === payload.ownerId
    if (!validOwner) forbidden('Tasks can only be assigned to a student on this project')
    if (!isOwningBusiness && actor.studentId !== payload.ownerId) {
      forbidden('Students may only assign a newly declared task to themselves')
    }
  }
  return deliverableTasksRepository.declareTask(projectId, payload, actor.studentId ?? actor.id)
}

async function updateDeliverableTaskService(
  taskId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const existing = await deliverableTasksRepository.findTask(taskId) ?? notFound('Task')
  const { actor, project, isOwningBusiness } = await assertCanWriteTasks(existing.projectId, authUser)

  if (payload.ownerId !== undefined && payload.ownerId !== null) {
    const team = await projectWorkflowsRepository.listProjectTeam(existing.projectId)
    const validOwner = team.members?.some((member: Record<string, any>) => member.studentId === payload.ownerId)
      || project.studentId === payload.ownerId
    if (!validOwner) forbidden('Tasks can only be assigned to a student on this project')
    if (!isOwningBusiness && actor.studentId !== payload.ownerId) {
      forbidden('Students may only claim a task for themselves')
    }
  }

  // Any team member may act on any task: declare, claim, hand back, or close out
  // something another member left pending. Credit still follows the task's owner,
  // so closing someone else's work pays them, not the person who closed it.
  const result = await deliverableTasksRepository.updateTask(taskId, payload, actor.studentId)
  if (result && 'blocked' in result && result.blocked === 'weight_raise_needs_ack') {
    throw new ApiError(
      409,
      'Raising the weight of your own claimed task needs another team member to acknowledge it.',
      'TASK_WEIGHT_RAISE_NEEDS_ACK'
    )
  }
  if (result && 'blocked' in result && result.blocked === 'status_not_student_settable') {
    throw new ApiError(
      409,
      'Submit the task for review instead. A task is marked done when the business approves the submission covering it.',
      'TASK_DONE_REQUIRES_APPROVAL'
    )
  }
  return result
}

export {
  confirmDeliverableSplitService,
  readProjectSettingsService,
  updateProjectSettingsService,
  createDeliverableDependencyService,
  resolveDeliverableDependencyService,
  createDeliverableNoteService,
  declareDeliverableTaskService,
  listDeliverableTasksService,
  updateDeliverableTaskService
}
