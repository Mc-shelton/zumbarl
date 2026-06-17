import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const projects = createPrismaRecordRepository('projects')
const applications = createPrismaRecordRepository('projectApplications')
const milestones = createPrismaRecordRepository('milestones')
const tasks = createPrismaRecordRepository('tasks')
const deliverables = createPrismaRecordRepository('deliverables')
const escrows = createPrismaRecordRepository('escrows')
const payouts = createPrismaRecordRepository('payouts')

class ProjectWorkflowsRepository {
  listProjects(query: Record<string, unknown>) {
    return projects.list(query)
  }

  createProject(payload: Record<string, any>) {
    return projects.create(payload)
  }

  findProject(id: string) {
    return projects.findById(id)
  }

  updateProject(id: string, patch: Record<string, any>) {
    return projects.updateById(id, patch)
  }

  createApplication(payload: Record<string, any>) {
    return applications.create(payload)
  }

  updateApplication(id: string, patch: Record<string, any>) {
    return applications.updateById(id, patch)
  }

  createMilestone(payload: Record<string, any>) {
    return milestones.create(payload)
  }

  findMilestone(id: string) {
    return milestones.findById(id)
  }

  updateMilestone(id: string, patch: Record<string, any>) {
    return milestones.updateById(id, patch)
  }

  createTask(payload: Record<string, any>) {
    return tasks.create(payload)
  }

  updateTask(id: string, patch: Record<string, any>) {
    return tasks.updateById(id, patch)
  }

  findDeliverable(id: string) {
    return deliverables.findById(id)
  }

  updateDeliverable(id: string, patch: Record<string, any>) {
    return deliverables.updateById(id, patch)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  createPayout(payload: Record<string, any>) {
    return payouts.create(payload)
  }

  async readProjectWorkspace(id: string) {
    return {
      project: await projects.findById(id),
      milestones: await milestones.listAll((milestone) => milestone.projectId === id),
      tasks: await tasks.listAll((task) => task.projectId === id),
      applications: await applications.listAll((application) => application.projectId === id),
      deliverables: await deliverables.listAll((deliverable) => deliverable.projectId === id)
    }
  }

  createProjectWithMilestones(projectPayload: Record<string, any>, milestonePayloads: Record<string, any>[]) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionMilestones = createRepository('milestones')
      const project = await transactionProjects.create(projectPayload)
      const milestones = await Promise.all(milestonePayloads.map((milestone, index) => transactionMilestones.create({
        ...milestone,
        projectId: project.id,
        order: index + 1,
        status: 'draft',
        fundingStatus: 'unfunded'
      })))
      return { project, milestones }
    })
  }

  fundMilestone(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionMilestones = createRepository('milestones')
      const transactionEscrows = createRepository('escrows')
      const milestone = await transactionMilestones.findById(id)
      if (!milestone) return null

      const escrow = await transactionEscrows.create({ scope: 'milestone', scopeId: id, amount: milestone.budgetAmount, currency: 'KES', status: 'funded' })
      await transactionMilestones.updateById(id, { fundingStatus: 'funded' })
      return escrow
    })
  }

  activateMilestone(id: string) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionMilestones = createRepository('milestones')
      const milestone = await transactionMilestones.findById(id)
      if (!milestone) return null
      if (milestone.fundingStatus !== 'funded') return { activated: false, reason: 'milestone_funding_required', milestone }

      await transactionProjects.updateById(milestone.projectId, { status: 'execution', scopeLocked: true })
      return transactionMilestones.updateById(id, { status: 'active', activatedAt: new Date().toISOString() })
    })
  }

  reviewDeliverable(id: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionProjects = createRepository('projects')
      const transactionDeliverables = createRepository('deliverables')
      const transactionPayouts = createRepository('payouts')
      const deliverable = await transactionDeliverables.findById(id)
      if (!deliverable) return null
      if (payload.decision === 'changes_requested' && deliverable.revisionCount >= 3) {
        return { accepted: false, reason: 'revision_limit_reached', deliverable }
      }

      const next = await transactionDeliverables.updateById(id, {
        status: payload.decision,
        feedback: payload.feedback,
        revisionCount: payload.decision === 'changes_requested' ? deliverable.revisionCount + 1 : deliverable.revisionCount
      })
      if (payload.decision === 'approved') {
        await transactionProjects.updateById(deliverable.projectId, { status: 'approved' })
        await transactionPayouts.create({ projectId: deliverable.projectId, studentId: deliverable.studentId, status: 'ready', amount: 0, currency: 'KES' })
      }
      return next
    })
  }
}

const projectWorkflowsRepository = new ProjectWorkflowsRepository()

export {
  ProjectWorkflowsRepository,
  projectWorkflowsRepository
}
