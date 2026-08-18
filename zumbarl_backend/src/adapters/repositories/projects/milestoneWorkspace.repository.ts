import { prisma } from '../../../lib/prisma.js'
import {
  DORMANT_STATUS,
  getTaskPayableAmount,
  readMilestoneBudget
} from '../../../shared/projects/milestoneBudget.js'
import { creditStudentWallet } from '../../../shared/services/walletLedger.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const projects = createPrismaRecordRepository('projects')
const milestones = createPrismaRecordRepository('milestones')
const payouts = createPrismaRecordRepository('payouts')

function toDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoOrNull(value: Date | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// The milestone track's window: explicit dates if the record carries them,
// otherwise the due date alone so a milestone still plots as a point in time.
function toMilestoneWindow(milestone: Record<string, any>) {
  return {
    startsAt: toIsoOrNull(milestone.startsAt ?? milestone.activatedAt ?? null),
    endsAt: toIsoOrNull(milestone.dueAt ?? milestone.deadline ?? null)
  }
}

class MilestoneWorkspaceRepository {
  // A milestone brief defines its milestones as opportunity scope items, but the
  // project tracks them as its own records - they carry funding, activation and
  // submission state the brief has no place for. Nothing was materialising them
  // on award, so every milestone surface read empty. Idempotent: it only writes
  // when the project has none, which also heals projects awarded before this.
  async ensureProjectMilestones(projectId: string) {
    const existing = await milestones.listAll((item) => item.projectId === projectId)
    if (existing.length) return existing

    // The workspace, timeline and gates are read in parallel, so three requests
    // can arrive here at once and each find it empty. A transaction-scoped
    // advisory lock keyed on the project serialises them; the second and third
    // then see the records the first created and do nothing.
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', projectId)
      const raced = await milestones.listAll((item) => item.projectId === projectId)
      if (raced.length) return raced
      return this.materialiseProjectMilestones(projectId)
    })
  }

  private async materialiseProjectMilestones(projectId: string) {
    const existing: Record<string, any>[] = []

    const project = await projects.findById(projectId)
    if (!project?.opportunityId) return existing

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: project.opportunityId },
      select: {
        scopeMode: true,
        scopeItems: {
          where: { scopeType: 'milestone' },
          orderBy: { sequence: 'asc' }
        }
      }
    })
    if (opportunity?.scopeMode !== 'milestone' || !opportunity.scopeItems.length) return existing

    const created = []
    for (const [index, scopeItem] of opportunity.scopeItems.entries()) {
      created.push(await milestones.create({
        projectId,
        scopeItemId: scopeItem.id,
        title: scopeItem.title,
        objective: scopeItem.description ?? scopeItem.requirement ?? '',
        acceptanceCriteria: scopeItem.acceptanceCriteria ?? '',
        budgetAmount: Number(scopeItem.budgetAmount ?? 0),
        order: scopeItem.sequence ?? index + 1,
        status: 'draft',
        fundingStatus: 'unfunded',
        dueAt: scopeItem.metadata && typeof scopeItem.metadata === 'object'
          ? (scopeItem.metadata as Record<string, any>).dueAt ?? null
          : null
      }))
    }
    return created
  }

  async listMilestones(projectId: string) {
    await this.ensureProjectMilestones(projectId)
    const records = await milestones.listAll((item) => item.projectId === projectId)
    return records
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((milestone) => ({
        id: milestone.id,
        projectId: milestone.projectId,
        title: milestone.title,
        objective: milestone.objective ?? '',
        order: milestone.order ?? 0,
        budgetAmount: Number(milestone.budgetAmount ?? 0),
        status: milestone.status ?? 'draft',
        fundingStatus: milestone.fundingStatus ?? 'unfunded',
        submissionStatus: milestone.submissionStatus ?? null,
        acceptanceCriteria: milestone.acceptanceCriteria ?? '',
        activatedAt: toIsoOrNull(milestone.activatedAt),
        ...toMilestoneWindow(milestone)
      }))
  }

  // Milestones own their own window. Without authored dates the timeline can
  // only guess, so the business sets them here alongside scope and budget.
  async updateMilestone(id: string, payload: Record<string, any>) {
    const existing = await milestones.findById(id)
    if (!existing) return null

    const patch: Record<string, any> = {}
    if (payload.title !== undefined) patch.title = payload.title
    if (payload.objective !== undefined) patch.objective = payload.objective
    if (payload.acceptanceCriteria !== undefined) patch.acceptanceCriteria = payload.acceptanceCriteria
    if (payload.budgetAmount !== undefined) patch.budgetAmount = Number(payload.budgetAmount)
    if (payload.startsAt !== undefined) patch.startsAt = toDate(payload.startsAt)?.toISOString() ?? null
    if (payload.dueAt !== undefined) patch.dueAt = toDate(payload.dueAt)?.toISOString() ?? null

    const updated = await milestones.updateById(id, patch)
    if (payload.budgetAmount !== undefined) {
      await this.reviveDormantDeliverables(existing.projectId, id)
    }
    return updated
  }

  // Adding funds revives the deliverables the milestone can now cover, oldest
  // first, so parked scope comes back in the order it was added.
  async reviveDormantDeliverables(projectId: string, milestoneId: string) {
    const state = await this.readMilestoneBudgetState(projectId, milestoneId)
    if (!state.dormantCount) return 0

    const dormant = await prisma.milestoneDeliverable.findMany({
      where: { projectId, milestoneId, status: DORMANT_STATUS },
      orderBy: { createdAt: 'asc' }
    })

    let remaining = state.remaining
    let revived = 0
    for (const deliverable of dormant) {
      const price = Number(deliverable.budgetAmount ?? 0)
      if (price > remaining) continue
      await prisma.milestoneDeliverable.update({ where: { id: deliverable.id }, data: { status: 'pending' } })
      remaining -= price
      revived += 1
    }
    return revived
  }

  findMilestoneRecord(id: string) {
    return milestones.findById(id)
  }

  listDeliverables(projectId: string) {
    return prisma.milestoneDeliverable.findMany({
      where: { projectId },
      orderBy: [{ milestoneId: 'asc' }, { sequence: 'asc' }]
    })
  }

  findDeliverable(id: string) {
    return prisma.milestoneDeliverable.findUnique({ where: { id } })
  }

  findSprint(id: string) {
    return prisma.projectSprint.findUnique({ where: { id } })
  }

  findActiveSprint(projectId: string, excludeId = '') {
    return prisma.projectSprint.findFirst({
      where: {
        projectId,
        status: 'active',
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    })
  }

  // A deliverable that takes the milestone past its budget is created dormant:
  // it exists and is visible, but no work can accrue against money the milestone
  // does not hold. Adding funds revives it.
  async createDeliverable(projectId: string, payload: Record<string, any>) {
    const milestoneId = String(payload.milestoneId)
    const budget = await this.readMilestoneBudgetState(projectId, milestoneId, {
      extraAmount: Number(payload.budgetAmount ?? 0)
    })

    const created = await prisma.milestoneDeliverable.create({
      data: {
        projectId,
        milestoneId,
        budgetAmount: Number(payload.budgetAmount ?? 0),
        status: budget.wouldExceed ? DORMANT_STATUS : 'pending',
        title: String(payload.title),
        description: payload.description ?? null,
        workflow: payload.workflow ?? null,
        requirement: payload.requirement ?? null,
        submissionMethod: payload.submissionMethod ?? null,
        evidenceRequired: payload.evidenceRequired ?? null,
        acceptanceCriteria: payload.acceptanceCriteria ?? null,
        sequence: Number(payload.sequence ?? 1),
        startsAt: toDate(payload.startsAt),
        dueAt: toDate(payload.dueAt)
      }
    })

    return { deliverable: created, budget }
  }

  // The milestone's money position: what it holds, what its deliverables have
  // committed, and whether a proposed addition would take it past that.
  async readMilestoneBudgetState(
    projectId: string,
    milestoneId: string,
    { extraAmount = 0, excludeDeliverableId = '' }: { extraAmount?: number; excludeDeliverableId?: string } = {}
  ) {
    const [milestone, deliverables] = await Promise.all([
      milestones.findById(milestoneId),
      prisma.milestoneDeliverable.findMany({ where: { projectId, milestoneId } })
    ])
    const considered = deliverables.filter((item) => item.id !== excludeDeliverableId)
    const state = readMilestoneBudget(considered, milestone?.budgetAmount)

    return {
      ...state,
      milestoneId,
      wouldExceed: extraAmount > 0 && state.committed + extraAmount > state.budget,
      projectedCommitted: state.committed + Math.max(0, extraAmount)
    }
  }

  async updateDeliverable(id: string, payload: Record<string, any>) {
    const existing = await prisma.milestoneDeliverable.findUnique({ where: { id } })
    if (!existing) return null

    return prisma.milestoneDeliverable.update({
      where: { id },
      data: {
        title: payload.title ?? undefined,
        description: payload.description ?? undefined,
        workflow: payload.workflow ?? undefined,
        requirement: payload.requirement ?? undefined,
        submissionMethod: payload.submissionMethod ?? undefined,
        evidenceRequired: payload.evidenceRequired ?? undefined,
        acceptanceCriteria: payload.acceptanceCriteria ?? undefined,
        sequence: payload.sequence === undefined ? undefined : Number(payload.sequence),
        status: payload.status ?? undefined,
        startsAt: payload.startsAt === undefined ? undefined : toDate(payload.startsAt),
        dueAt: payload.dueAt === undefined ? undefined : toDate(payload.dueAt)
      }
    })
  }

  // Weekly interim settlement. Every approved, unpaid task draws its share of its
  // deliverable's price and is paid immediately, so a milestone that runs for
  // months pays as it goes instead of holding everything to the end. A payout is
  // recorded per task, so this is safe to run repeatedly.
  async settleApprovedTaskPayouts(projectId: string) {
    const [tasks, deliverables] = await Promise.all([
      prisma.deliverableTask.findMany({ where: { projectId } }),
      prisma.milestoneDeliverable.findMany({ where: { projectId } })
    ])

    const payable = tasks.filter((task) => (
      task.status === 'done' && task.ownerId && !task.paidAmount && task.milestoneDeliverableId
    ))
    if (!payable.length) return { settled: 0, amount: 0 }

    let settled = 0
    let amount = 0

    for (const task of payable) {
      const deliverable = deliverables.find((item) => item.id === task.milestoneDeliverableId)
      if (!deliverable || deliverable.status === DORMANT_STATUS) continue

      const siblings = tasks.filter((item) => item.milestoneDeliverableId === deliverable.id)
      const payout = getTaskPayableAmount(task, siblings, deliverable.budgetAmount)
      if (payout <= 0) continue

      await prisma.$transaction(async (tx) => {
        await tx.deliverableTask.update({
          where: { id: task.id },
          data: { paidAmount: payout, paidAt: new Date() }
        })
        await creditStudentWallet(tx, task.ownerId as string, payout, {
          description: `Weekly payout for approved work: ${task.title}`,
          metadata: { projectId, taskId: task.id, milestoneDeliverableId: deliverable.id }
        })
      })

      // Keep the in-memory copy current so later tasks in this run see the
      // reduced remaining budget rather than all drawing from the full amount.
      const local = tasks.find((item) => item.id === task.id)
      if (local) local.paidAmount = payout
      settled += 1
      amount += payout
    }

    return { settled, amount }
  }

  listSprints(projectId: string) {
    return prisma.projectSprint.findMany({
      where: { projectId },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }]
    })
  }

  async createSprint(projectId: string, payload: Record<string, any>) {
    const count = await prisma.projectSprint.count({ where: { projectId } })
    return prisma.projectSprint.create({
      data: {
        projectId,
        // Sprints are project-global. Milestones organize funded scope; they do
        // not partition the team's time boxes.
        milestoneId: null,
        name: String(payload.name),
        goal: payload.goal ?? null,
        sequence: Number(payload.sequence ?? count + 1),
        startsAt: toDate(payload.startsAt),
        endsAt: toDate(payload.endsAt)
      }
    })
  }

  async updateSprint(id: string, payload: Record<string, any>) {
    const existing = await prisma.projectSprint.findUnique({ where: { id } })
    if (!existing) return null

    return prisma.projectSprint.update({
      where: { id },
      data: {
        name: payload.name ?? undefined,
        goal: payload.goal ?? undefined,
        status: payload.status ?? undefined,
        sequence: payload.sequence === undefined ? undefined : Number(payload.sequence),
        startsAt: payload.startsAt === undefined ? undefined : toDate(payload.startsAt),
        endsAt: payload.endsAt === undefined ? undefined : toDate(payload.endsAt)
      }
    })
  }

  // Scheduling only: sprint membership never touches ownership or weight, so a
  // task can move between sprints without disturbing who gets credited.
  async assignTasksToSprint(projectId: string, sprintId: string | null, taskIds: string[]) {
    if (!taskIds.length) return 0
    const result = await prisma.deliverableTask.updateMany({
      where: { id: { in: taskIds }, projectId },
      data: { sprintId }
    })
    return result.count
  }

  // Three independent tracks. Milestones and deliverables carry their own dates;
  // a sprint falls back to the span of the tasks scheduled into it, so a sprint
  // plots correctly even before anyone sets its window by hand.
  async readTimeline(projectId: string) {
    const [milestoneRecords, deliverables, sprints, tasks] = await Promise.all([
      this.listMilestones(projectId),
      this.listDeliverables(projectId),
      this.listSprints(projectId),
      prisma.deliverableTask.findMany({ where: { projectId } })
    ])

    const sprintTrack = sprints.map((sprint) => {
      const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id)
      const dates = sprintTasks
        .flatMap((task) => [task.claimedAt, task.doneAt])
        .filter(Boolean)
        .map((value) => new Date(value as Date).getTime())

      return {
        id: sprint.id,
        title: sprint.name,
        status: sprint.status,
        milestoneId: null,
        taskCount: sprintTasks.length,
        doneCount: sprintTasks.filter((task) => task.status === 'done').length,
        startsAt: toIsoOrNull(sprint.startsAt) ?? (dates.length ? new Date(Math.min(...dates)).toISOString() : null),
        endsAt: toIsoOrNull(sprint.endsAt) ?? (dates.length ? new Date(Math.max(...dates)).toISOString() : null)
      }
    })

    return {
      milestones: milestoneRecords.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        status: milestone.status,
        budgetAmount: milestone.budgetAmount,
        startsAt: milestone.startsAt,
        endsAt: milestone.endsAt
      })),
      deliverables: deliverables.map((deliverable) => ({
        id: deliverable.id,
        milestoneId: deliverable.milestoneId,
        title: deliverable.title,
        status: deliverable.status,
        startsAt: toIsoOrNull(deliverable.startsAt),
        endsAt: toIsoOrNull(deliverable.dueAt)
      })),
      sprints: sprintTrack
    }
  }

  // The milestone lifecycle gates, read from real records instead of the local
  // mock state the panel used to run on.
  async readProgramGates(projectId: string, milestoneId: string | null) {
    const [project, milestoneList, sprints, tasks, teamCount, projectPayouts] = await Promise.all([
      projects.findById(projectId),
      this.listMilestones(projectId),
      this.listSprints(projectId),
      prisma.deliverableTask.findMany({ where: { projectId } }),
      prisma.projectTeamMember.count({ where: { projectId } }),
      payouts.listAll((item) => item.projectId === projectId)
    ])
    if (!project) return null

    const milestone = milestoneId
      ? milestoneList.find((item) => item.id === milestoneId) ?? null
      : milestoneList.find((item) => item.status !== 'approved') ?? milestoneList[0] ?? null

    const globalSprints = sprints
    const scheduledTaskCount = tasks.filter((task) => task.sprintId).length

    return {
      milestone,
      gates: {
        // Applications must be open before anyone can join the team.
        biddingOpen: Boolean(project.startedAt) || teamCount > 0,
        studentJoined: teamCount > 0,
        fundsReleased: milestone?.fundingStatus === 'funded',
        backlogReady: globalSprints.length > 0 && scheduledTaskCount > 0,
        milestoneActive: milestone?.status === 'active',
        scopeLocked: Boolean(project.scopeLocked),
        submitted: milestone?.submissionStatus === 'submitted' || milestone?.status === 'approved',
        approved: milestone?.status === 'approved',
        disbursed: projectPayouts.some((payout) => payout.milestoneId === milestone?.id)
      }
    }
  }
}

const milestoneWorkspaceRepository = new MilestoneWorkspaceRepository()

export {
  MilestoneWorkspaceRepository,
  milestoneWorkspaceRepository
}
