import { pathToFileURL } from 'node:url'
import { prisma } from '../lib/prisma.js'
import { createPrismaRecordRepository } from '../shared/repositories/index.js'

const projects = createPrismaRecordRepository('projects')
const milestones = createPrismaRecordRepository('milestones')

// Rebuilds a milestone project end to end so the workspace has something real to
// exercise: an awarded team, milestones with budgets, priced deliverables,
// declared tasks across the states, and a sprint holding some of them.
// Idempotent by title - running it twice reuses the same opportunity.
const OPPORTUNITY_TITLE = 'Test Milestone Project'

async function seedMilestoneProjectFixture() {
  const company = await prisma.company.findFirst()
  if (!company) throw new Error('No company found. Seed the base database first.')

  const students = await prisma.studentProfile.findMany({ include: { user: true }, take: 2 })
  if (students.length < 2) throw new Error('Need at least two student profiles to build a team.')

  const existing = await prisma.opportunity.findFirst({ where: { title: OPPORTUNITY_TITLE } })
  const opportunity = existing ?? await prisma.opportunity.create({
    data: {
      companyId: company.id,
      title: OPPORTUNITY_TITLE,
      summary: 'Continuous brand and campaign support delivered against milestones.',
      description: 'A milestone-based project used to exercise the planning workspace.',
      opportunityType: 'Project',
      scopeMode: 'milestone',
      category: 'Social Media',
      status: 'in_progress',
      visibility: 'public',
      budgetAmount: 7000,
      currency: 'KES',
      escrowStatus: 'funded',
      skills: ['Campus Activation', 'After Effects', 'Campus Growth'],
      publishedAt: new Date(),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicants: students.length,
      scopeItems: {
        create: [
          { scopeType: 'milestone', sequence: 1, title: 'Some Milestone', description: 'First milestone of the engagement.', budgetAmount: 5000, status: 'published' },
          { scopeType: 'milestone', sequence: 2, title: 'Another Milestone', description: 'Second milestone of the engagement.', budgetAmount: 2000, status: 'published' }
        ]
      }
    }
  })

  // Escrow so the project can actually be started and milestones funded.
  const funded = await prisma.opportunityEscrowHold.findFirst({ where: { opportunityId: opportunity.id, status: 'FUNDED' } })
  if (!funded) {
    await prisma.opportunityEscrowHold.create({
      data: { opportunityId: opportunity.id, companyId: company.id, amount: 7000, currency: 'KES', status: 'FUNDED', transactionRef: `seed-${Date.now()}` }
    })
  }

  for (const student of students) {
    await prisma.bid.upsert({
      where: { opportunityId_studentId: { opportunityId: opportunity.id, studentId: student.id } },
      update: { status: 'awarded' },
      create: { opportunityId: opportunity.id, studentId: student.id, status: 'awarded', bidAmount: 0, currency: 'KES' }
    })
  }

  const allProjects = await projects.listAll((item) => item.opportunityId === opportunity.id)
  const project = allProjects[0] ?? await projects.create({
    opportunityId: opportunity.id,
    businessId: company.id,
    studentId: students[0].id,
    title: opportunity.title,
    status: 'active',
    fundingStatus: 'funded',
    agreedAmount: 7000,
    agreedCurrency: 'KES',
    isTeamProject: true,
    scopeLocked: true,
    startedAt: new Date().toISOString()
  })

  await prisma.bid.updateMany({
    where: { opportunityId: opportunity.id, status: 'awarded' },
    data: { projectId: project.id }
  })

  for (const student of students) {
    if (!student.userId) continue
    await prisma.projectTeamMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: student.userId } },
      update: { status: 'active' },
      create: { projectId: project.id, userId: student.userId, role: 'Contributor', status: 'active' }
    })
  }

  // Milestones: the first funded and active so work can be submitted against it.
  const existingMilestones = await milestones.listAll((item) => item.projectId === project.id)
  const milestoneRecords = existingMilestones.length ? existingMilestones : await Promise.all([
    milestones.create({
      projectId: project.id, title: 'Some Milestone', objective: 'First milestone of the engagement.',
      budgetAmount: 5000, order: 1, status: 'active', fundingStatus: 'funded',
      startsAt: new Date().toISOString(), dueAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      activatedAt: new Date().toISOString()
    }),
    milestones.create({
      projectId: project.id, title: 'Another Milestone', objective: 'Second milestone of the engagement.',
      budgetAmount: 2000, order: 2, status: 'draft', fundingStatus: 'unfunded',
      dueAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
    })
  ])

  const firstMilestone = milestoneRecords[0]
  const deliverableCount = await prisma.milestoneDeliverable.count({ where: { projectId: project.id } })
  if (!deliverableCount) {
    await prisma.milestoneDeliverable.createMany({
      data: [
        { projectId: project.id, milestoneId: firstMilestone.id, title: 'Brand book', description: 'Core brand system and usage rules.', budgetAmount: 3000, sequence: 1, status: 'in_progress', workflow: 'File Asset Deliverables' },
        { projectId: project.id, milestoneId: firstMilestone.id, title: 'Campaign assets', description: 'Launch creative for the first campus push.', budgetAmount: 2000, sequence: 2, status: 'pending', workflow: 'File Asset Deliverables' }
      ]
    })
  }

  const deliverables = await prisma.milestoneDeliverable.findMany({ where: { projectId: project.id }, orderBy: { sequence: 'asc' } })
  const sprintCount = await prisma.projectSprint.count({ where: { projectId: project.id } })
  const sprint = sprintCount
    ? await prisma.projectSprint.findFirst({ where: { projectId: project.id } })
    : await prisma.projectSprint.create({
        data: {
          projectId: project.id, milestoneId: null, name: 'Sprint 1 — Brand foundations',
          goal: 'Land the brand system so campaign work can start.', sequence: 1, status: 'active',
          startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })

  const taskCount = await prisma.deliverableTask.count({ where: { projectId: project.id } })
  if (!taskCount) {
    const evidence = [{ fileName: 'brand-assets.pdf', url: '/files/seed/brand-assets.pdf' }]
    await prisma.deliverableTask.createMany({
      data: [
        { projectId: project.id, milestoneId: firstMilestone.id, milestoneDeliverableId: deliverables[0].id, sprintId: sprint?.id ?? null, title: 'Brand assets', ownerId: students[0].id, declaredById: students[0].id, weight: 5, status: 'done', evidence, doneAt: new Date() },
        { projectId: project.id, milestoneId: firstMilestone.id, milestoneDeliverableId: deliverables[0].id, sprintId: sprint?.id ?? null, title: 'Brand policies', ownerId: students[1].id, declaredById: students[1].id, weight: 3, status: 'in_progress' },
        { projectId: project.id, milestoneId: firstMilestone.id, milestoneDeliverableId: deliverables[0].id, title: 'Logo suite', weight: 2, status: 'todo', declaredById: students[0].id },
        { projectId: project.id, milestoneId: firstMilestone.id, milestoneDeliverableId: deliverables[1].id, title: 'Launch posters', ownerId: students[1].id, declaredById: students[1].id, weight: 4, status: 'submitted', evidence }
      ]
    })
  }

  return {
    opportunityId: opportunity.id,
    projectId: project.id,
    milestones: milestoneRecords.length,
    deliverables: deliverables.length,
    tasks: await prisma.deliverableTask.count({ where: { projectId: project.id } })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedMilestoneProjectFixture()
    .then(async (result) => {
      console.log(`Milestone project fixture ready: ${JSON.stringify(result)}`)
      await prisma.$disconnect()
    })
    .catch(async (error) => {
      console.error(error)
      await prisma.$disconnect()
      process.exitCode = 1
    })
}

export { seedMilestoneProjectFixture }
