import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import type { AuthUser } from '../../../lib/security.js'
import { sendTransactionalEmail } from '../../notification/index.js'
import { businessWorkflowsRepository } from '../../repositories/business/index.js'
import { projectWorkflowsRepository } from '../../repositories/projects/index.js'
import { milestoneWorkspaceRepository } from '../../repositories/projects/milestoneWorkspace.repository.js'
import { ensureProjectDeliverableReference } from '../../../shared/projects/ensureDefaultProjectDeliverable.js'

const PROJECT_TEAM_MANAGER_ROLES = new Set(['admin', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'])

function requireAuthenticatedUser(authUser: AuthUser | undefined): AuthUser {
  if (!authUser) throw new ApiError(401, 'Authentication required', 'AUTH_REQUIRED')
  return authUser
}

function assertCanManageProject(project: Record<string, any>, authUser: AuthUser | undefined) {
  const actor = requireAuthenticatedUser(authUser)
  const canManage = PROJECT_TEAM_MANAGER_ROLES.has(actor.role)
    || Boolean(actor.studentId && project.studentId === actor.studentId)
    || Boolean(actor.businessId && project.businessId === actor.businessId)
    || project.ownerId === actor.id

  if (!canManage) forbidden('Only the project owner or business can manage this team')
}

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

async function readProjectWorkspaceService(id: string, authUser?: AuthUser) {
  // No job runner exists, so lifecycle timers (start reminder, auto-end) are
  // advanced opportunistically here; it self-throttles and never blocks the read.
  void projectWorkflowsRepository.sweepProjectLifecycle().catch(() => undefined)
  const viewerStudentId = authUser?.studentId
  let workspace = await projectWorkflowsRepository.readProjectWorkspace(id, viewerStudentId)
  if (!workspace.project) notFound('Project')
  if (workspace.project?.opportunityId) {
    await ensureProjectDeliverableReference(workspace.project)
    workspace = await projectWorkflowsRepository.readProjectWorkspace(id, viewerStudentId)
  }
  const opportunityId = workspace.project?.opportunityId
  const opportunity = opportunityId
    ? await businessWorkflowsRepository.findOpportunity(opportunityId)
    : null
  return { ...workspace, opportunity }
}

async function listProjectTeamService(projectId: string, authUser: AuthUser | undefined) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  const actor = requireAuthenticatedUser(authUser)
  const team = await projectWorkflowsRepository.listProjectTeam(projectId)
  const isMember = team.members.some((member) => member.userId === actor.id)
  const canRead = PROJECT_TEAM_MANAGER_ROLES.has(actor.role)
    || isMember
    || Boolean(actor.studentId && project.studentId === actor.studentId)
    || Boolean(actor.businessId && project.businessId === actor.businessId)
    || project.ownerId === actor.id
  if (!canRead) forbidden('You do not have access to this project team')

  const messageParticipants = await projectWorkflowsRepository.listProjectMessageParticipants(projectId)

  return {
    ...team,
    messageParticipants: messageParticipants.filter((participant) => (
      participant.userId !== actor.id
      && !(actor.businessId && participant.type === 'business')
    ))
  }
}

async function listProjectTeamCandidatesService(
  projectId: string,
  query: Record<string, unknown>,
  authUser: AuthUser | undefined
) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  const actor = requireAuthenticatedUser(authUser)
  const candidates = await projectWorkflowsRepository.listProjectTeamCandidates(
    projectId,
    String(query.search ?? '').trim()
  )
  return {
    candidates: candidates.filter((candidate) => candidate.userId !== actor.id && !candidate.isMember)
  }
}

async function inviteProjectTeamMembersService(
  projectId: string,
  payload: Record<string, any>,
  authUser: AuthUser | undefined
) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  const actor = requireAuthenticatedUser(authUser)
  const result = await projectWorkflowsRepository.createProjectTeamInvites(projectId, actor.id, {
    ...payload,
    projectTitle: project.title || 'your project'
  })
  const emails = await Promise.all(result.recipients.map((recipient) => (
    sendTransactionalEmail(
      recipient.email,
      `You're invited to join ${project.title || 'a project'}`,
      `<p>Hi ${recipient.name},</p><p>${payload.note || `You have been invited to join ${project.title || 'this project'} as ${payload.role}.`}</p><p><a href="/campus/projects/${projectId}?tab=team&teamInvite=${recipient.inviteId}">Review project invitation</a></p>`
    )
  )))

  return {
    invites: result.invites,
    notifications: result.recipients.length,
    emails,
    team: await projectWorkflowsRepository.listProjectTeam(projectId)
  }
}

async function listMyProjectTeamInvitesService(authUser: AuthUser | undefined) {
  const actor = requireAuthenticatedUser(authUser)
  return { invites: await projectWorkflowsRepository.listUserProjectTeamInvites(actor.id) }
}

async function respondToProjectTeamInviteService(
  inviteId: string,
  action: 'accept' | 'decline',
  authUser: AuthUser | undefined
) {
  const actor = requireAuthenticatedUser(authUser)
  return await projectWorkflowsRepository.respondToProjectTeamInvite(inviteId, actor.id, action)
    ?? notFound('Project team invitation')
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

async function createMilestoneService(
  projectId: string,
  payload: Record<string, any>,
  authUser?: AuthUser
) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  // Both sides plan: a team member proposing the next milestone is as valid as
  // the business defining it up front. Funding and completion stay business-only.
  if (authUser) {
    const team = await projectWorkflowsRepository.listProjectTeam(projectId)
    const isMember = team.members?.some((member: Record<string, any>) => member.userId === authUser.id)
    const canPlan = PROJECT_TEAM_MANAGER_ROLES.has(authUser.role)
      || isMember
      || Boolean(authUser.studentId && project.studentId === authUser.studentId)
      || Boolean(authUser.businessId && project.businessId === authUser.businessId)
    if (!canPlan) forbidden('Only people working on this project can add milestones')
  }
  // Appended after the existing milestones so the sequence, and the timeline
  // ordering that follows it, stay stable.
  const existing = await milestoneWorkspaceRepository.listMilestones(projectId)
  return projectWorkflowsRepository.createMilestone({
    ...payload,
    projectId,
    order: existing.length + 1,
    status: 'draft',
    fundingStatus: 'unfunded'
  })
}

async function fundMilestoneService(id: string) {
  return await projectWorkflowsRepository.fundMilestone(id) ?? notFound('Milestone')
}

async function activateMilestoneService(id: string) {
  const result = await projectWorkflowsRepository.activateMilestone(id) ?? notFound('Milestone')
  if ((result as Record<string, any>).activated === false) {
    throw new ApiError(
      409,
      'Release this milestone\u2019s budget into escrow before activating it.',
      'MILESTONE_FUNDING_REQUIRED'
    )
  }
  return result
}

async function createProjectTaskService(projectId: string, payload: Record<string, any>) {
  await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  return projectWorkflowsRepository.createTask({ ...payload, projectId })
}

async function updateProjectTaskService(id: string, payload: Record<string, any>) {
  return await projectWorkflowsRepository.updateTask(id, payload) ?? notFound('Task')
}

async function reviewDeliverableService(id: string, payload: Record<string, any>, authUser: AuthUser | undefined) {
  const submission = await projectWorkflowsRepository.findDeliverable(id) ?? notFound('Deliverable')
  const project = await projectWorkflowsRepository.findProject(submission.projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  const result = await projectWorkflowsRepository.reviewDeliverable(id, payload) ?? notFound('Deliverable')
  if ('accepted' in result && result.accepted === false) {
    if (result.reason === 'submission_superseded') {
      throw new ApiError(409, 'A newer revision has replaced this submission.', 'SUBMISSION_SUPERSEDED')
    }
    throw new ApiError(409, 'The revision limit has been reached for this work.', 'REVISION_LIMIT_REACHED')
  }
  return result
}

async function completeScopeTargetService(projectId: string, payload: Record<string, any>, authUser: AuthUser | undefined) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  if (!payload.scopeItemId && !payload.milestoneId) {
    throw new ApiError(400, 'Specify the deliverable or milestone to complete.', 'COMPLETE_TARGET_REQUIRED')
  }
  const result = await projectWorkflowsRepository.completeScopeTarget(projectId, payload) ?? notFound('Project')
  if (result.completed === false) {
    throw new ApiError(404, 'That deliverable or milestone was not found on this project.', 'COMPLETE_TARGET_NOT_FOUND')
  }
  return result
}

async function proposeProjectPriceService(projectId: string, payload: Record<string, any>, authUser: AuthUser | undefined) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  throw new ApiError(
    409,
    'The agreed amount is locked once the student has been accepted.',
    'PROJECT_PRICE_LOCKED_AFTER_ACCEPTANCE'
  )
}

async function respondToProjectPriceProposalService(proposalId: string, payload: Record<string, any>, authUser: AuthUser | undefined) {
  const actor = requireAuthenticatedUser(authUser)
  const result = await projectWorkflowsRepository.respondToPriceProposal(proposalId, payload.decision, actor.studentId) ?? notFound('Price proposal')
  if (result.ok === false) {
    if (result.reason === 'forbidden') forbidden('This price proposal is not addressed to you')
    throw new ApiError(409, 'This price proposal has already been responded to.', 'PROPOSAL_NOT_PENDING')
  }
  return result
}

async function startProjectService(projectId: string, authUser: AuthUser | undefined) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  const result = await projectWorkflowsRepository.startProject(projectId) ?? notFound('Project')
  if (result.started === false && result.reason === 'project_already_finished') {
    throw new ApiError(
      409,
      'This project has already been completed, so it cannot be started again.',
      'PROJECT_ALREADY_FINISHED'
    )
  }
  if (result.started === false) {
    const currency = result.currency ?? 'KES'
    throw new ApiError(
      409,
      `This project's agreed price (${currency} ${Number(result.agreedAmount ?? 0).toLocaleString()}) is more than the ${currency} ${Number(result.escrowCoverage ?? 0).toLocaleString()} funded in escrow. Add funds to cover it before starting.`,
      'ESCROW_BELOW_AGREED_AMOUNT',
      { agreedAmount: result.agreedAmount, escrowCoverage: result.escrowCoverage, currency }
    )
  }
  return result
}

async function endProjectService(projectId: string, authUser: AuthUser | undefined) {
  const project = await projectWorkflowsRepository.findProject(projectId) ?? notFound('Project')
  assertCanManageProject(project, authUser)
  const result = await projectWorkflowsRepository.endProject(projectId) ?? notFound('Project')
  if (result.ended === false) {
    if (result.reason === 'project_not_completed') {
      throw new ApiError(
        409,
        'Approve all required work before ending this project.',
        'PROJECT_NOT_COMPLETED'
      )
    }
    throw new ApiError(
      409,
      'This project has submitted work that has not been paid out yet. Review and release those deliverables before ending it.',
      'PROJECT_HAS_PENDING_SUBMISSION'
    )
  }
  return result
}

export {
  listProjectsService,
  createProjectService,
  readProjectWorkspaceService,
  listProjectTeamService,
  listProjectTeamCandidatesService,
  inviteProjectTeamMembersService,
  listMyProjectTeamInvitesService,
  respondToProjectTeamInviteService,
  applyToProjectService,
  acceptProjectApplicationService,
  createMilestoneService,
  fundMilestoneService,
  activateMilestoneService,
  createProjectTaskService,
  updateProjectTaskService,
  reviewDeliverableService,
  completeScopeTargetService,
  proposeProjectPriceService,
  respondToProjectPriceProposalService,
  startProjectService,
  endProjectService
}
