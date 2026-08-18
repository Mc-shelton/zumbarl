import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  acceptProjectApplicationController,
  activateMilestoneController,
  applyToProjectController,
  createMilestoneController,
  createProjectController,
  createProjectTaskController,
  confirmDeliverableSplitController,
  createDeliverableDependencyController,
  createDeliverableNoteController,
  readProjectSettingsController,
  readMilestoneWorkspaceController,
  readProjectTimelineController,
  readProgramGatesController,
  createMilestoneDeliverableController,
  updateMilestoneController,
  updateMilestoneDeliverableController,
  createProjectSprintController,
  updateProjectSprintController,
  assignSprintTasksController,
  settleTaskPayoutsController,
  updateProjectSettingsController,
  resolveDeliverableDependencyController,
  declareDeliverableTaskController,
  listDeliverableTasksController,
  updateDeliverableTaskController,
  fundMilestoneController,
  inviteProjectTeamMembersController,
  listMyProjectTeamInvitesController,
  listProjectTeamCandidatesController,
  listProjectTeamController,
  listProjectsController,
  readProjectWorkspaceController,
  respondToProjectTeamInviteController,
  reviewDeliverableController,
  completeScopeTargetController,
  updateProjectTaskController,
  proposeProjectPriceController,
  respondToProjectPriceProposalController,
  startProjectController,
  endProjectController
} from '../../controllers/projects/index.js'

async function registerProjectRoutes(app: FastifyInstance) {
  const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin)
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  const studentOnly = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/', { preHandler: anyActor }, listProjectsController)
  app.post('/', { preHandler: businessOnly }, createProjectController)
  app.get('/team-invites/me', { preHandler: studentOnly }, listMyProjectTeamInvitesController)
  app.post('/team-invites/:id/respond', { preHandler: studentOnly }, respondToProjectTeamInviteController)
  app.get('/:id', { preHandler: anyActor }, readProjectWorkspaceController)
  app.get('/:id/team', { preHandler: anyActor }, listProjectTeamController)
  app.get('/:id/team/invite-candidates', { preHandler: anyActor }, listProjectTeamCandidatesController)
  app.post('/:id/team/invites', { preHandler: anyActor }, inviteProjectTeamMembersController)
  app.post('/:id/applications', { preHandler: studentOnly }, applyToProjectController)
  app.post('/applications/:id/accept', { preHandler: businessOnly }, acceptProjectApplicationController)
  app.post('/:id/milestones', { preHandler: anyActor }, createMilestoneController)
  app.post('/milestones/:id/fund', { preHandler: businessOnly }, fundMilestoneController)
  app.post('/milestones/:id/activate', { preHandler: businessOnly }, activateMilestoneController)
  app.post('/:id/tasks', { preHandler: anyActor }, createProjectTaskController)
  app.patch('/tasks/:id', { preHandler: anyActor }, updateProjectTaskController)
  app.get('/:id/deliverable-tasks', { preHandler: anyActor }, listDeliverableTasksController)
  app.post('/:id/deliverable-tasks', { preHandler: anyActor }, declareDeliverableTaskController)
  app.patch('/deliverable-tasks/:id', { preHandler: anyActor }, updateDeliverableTaskController)
  app.post('/:id/deliverable-splits/:scopeItemId/confirm', { preHandler: anyActor }, confirmDeliverableSplitController)
  app.post('/:id/deliverable-notes', { preHandler: anyActor }, createDeliverableNoteController)
  app.post('/:id/deliverable-dependencies', { preHandler: anyActor }, createDeliverableDependencyController)
  app.patch('/deliverable-dependencies/:id', { preHandler: anyActor }, resolveDeliverableDependencyController)
  app.get('/:id/settings', { preHandler: anyActor }, readProjectSettingsController)
  app.patch('/:id/settings', { preHandler: anyActor }, updateProjectSettingsController)
  app.get('/:id/milestone-workspace', { preHandler: anyActor }, readMilestoneWorkspaceController)
  app.get('/:id/timeline', { preHandler: anyActor }, readProjectTimelineController)
  app.get('/:id/program-gates', { preHandler: anyActor }, readProgramGatesController)
  app.patch('/milestones/:id/scope', { preHandler: anyActor }, updateMilestoneController)
  app.post('/:id/milestone-deliverables', { preHandler: anyActor }, createMilestoneDeliverableController)
  app.patch('/milestone-deliverables/:id', { preHandler: anyActor }, updateMilestoneDeliverableController)
  app.post('/:id/sprints', { preHandler: anyActor }, createProjectSprintController)
  app.patch('/sprints/:id', { preHandler: anyActor }, updateProjectSprintController)
  app.post('/:id/sprint-tasks', { preHandler: anyActor }, assignSprintTasksController)
  app.post('/:id/settle-task-payouts', { preHandler: anyActor }, settleTaskPayoutsController)
  app.post('/deliverables/:id/review', { preHandler: businessOnly }, reviewDeliverableController)
  app.post('/:id/complete-target', { preHandler: businessOnly }, completeScopeTargetController)
  app.post('/:id/price-proposals', { preHandler: businessOnly }, proposeProjectPriceController)
  app.post('/price-proposals/:id/respond', { preHandler: studentOnly }, respondToProjectPriceProposalController)
  app.post('/:id/start', { preHandler: businessOnly }, startProjectController)
  app.post('/:id/end', { preHandler: businessOnly }, endProjectController)
}

export {
  registerProjectRoutes
}
