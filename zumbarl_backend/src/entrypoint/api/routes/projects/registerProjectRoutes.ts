import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import {
  acceptProjectApplicationController,
  activateMilestoneController,
  applyToProjectController,
  createMilestoneController,
  createProjectController,
  createProjectTaskController,
  fundMilestoneController,
  listProjectsController,
  readProjectWorkspaceController,
  reviewDeliverableController,
  updateProjectTaskController
} from '../../controllers/projects/index.js'

async function registerProjectRoutes(app: FastifyInstance) {
  const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.admin)
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.admin)
  const studentOnly = requireRoles(...roleGroups.student, ...roleGroups.admin)
  app.get('/', { preHandler: anyActor }, listProjectsController)
  app.post('/', { preHandler: businessOnly }, createProjectController)
  app.get('/:id', { preHandler: anyActor }, readProjectWorkspaceController)
  app.post('/:id/applications', { preHandler: studentOnly }, applyToProjectController)
  app.post('/applications/:id/accept', { preHandler: businessOnly }, acceptProjectApplicationController)
  app.post('/:id/milestones', { preHandler: businessOnly }, createMilestoneController)
  app.post('/milestones/:id/fund', { preHandler: businessOnly }, fundMilestoneController)
  app.post('/milestones/:id/activate', { preHandler: businessOnly }, activateMilestoneController)
  app.post('/:id/tasks', { preHandler: anyActor }, createProjectTaskController)
  app.patch('/tasks/:id', { preHandler: anyActor }, updateProjectTaskController)
  app.post('/deliverables/:id/review', { preHandler: businessOnly }, reviewDeliverableController)
}

export {
  registerProjectRoutes
}
