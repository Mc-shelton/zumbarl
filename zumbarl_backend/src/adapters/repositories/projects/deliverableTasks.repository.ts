import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import {
  STUDENT_SETTABLE_TASK_STATUSES,
  computeWorkloadShares,
  normalizeTaskWeight,
  resolveActiveBlockers,
  resolveActiveDependencies
} from '../../../shared/projects/deliverableWorkload.js'

type TaskRecord = Awaited<ReturnType<typeof prisma.deliverableTask.findFirst>>

async function resolveStudentUserId(studentId: string | null | undefined) {
  if (!studentId) return null
  const profile = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { userId: true } })
  return profile?.userId ?? null
}

function toOwner(task: any) {
  if (!task.owner) return null
  const name = `${task.owner.firstName ?? ''} ${task.owner.lastName ?? ''}`.trim()
  return {
    id: task.owner.id,
    name: name || task.owner.user?.name || 'Student',
    username: task.owner.user?.username ?? null,
    avatarUrl: task.owner.avatarUrl ?? null
  }
}

type ActiveBlocker = { id: string; title: string; kind: 'task' | 'dependency'; ownerId?: string | null; party?: string }

function toTask(task: any, activeBlockers: ActiveBlocker[]) {
  return {
    id: task.id,
    projectId: task.projectId,
    scopeItemId: task.scopeItemId,
    title: task.title,
    description: task.description ?? '',
    ownerId: task.ownerId,
    owner: toOwner(task),
    declaredById: task.declaredById,
    weight: task.weight,
    // A task is reported as blocked whenever something it waits on is still
    // open, whatever the stored status says.
    status: activeBlockers.length && task.status !== 'done' && task.status !== 'dropped' ? 'blocked' : task.status,
    storedStatus: task.status,
    milestoneId: task.milestoneId ?? null,
    milestoneDeliverableId: task.milestoneDeliverableId ?? null,
    sprintId: task.sprintId ?? null,
    // Milestone mode nests tasks under a milestone deliverable; deliverable mode
    // hangs them off a scope item. `targetId` is whichever applies, so grouping
    // and workload work identically in both.
    targetId: task.milestoneDeliverableId ?? task.scopeItemId ?? null,
    submissionId: task.submissionId ?? null,
    blockedByIds: task.blockedByIds ?? [],
    blockedByDependencyIds: task.blockedByDependencyIds ?? [],
    blockedBy: activeBlockers,
    blockedAt: task.blockedAt,
    evidence: Array.isArray(task.evidence) ? task.evidence : [],
    droppedReason: task.droppedReason ?? '',
    declaredAt: task.declaredAt,
    claimedAt: task.claimedAt,
    doneAt: task.doneAt,
    updatedAt: task.updatedAt
  }
}

const taskInclude = { owner: { include: { user: true } } } as const

class DeliverableTasksRepository {
  async listProjectTasks(projectId: string) {
    const [tasks, dependencies] = await Promise.all([
      prisma.deliverableTask.findMany({
        where: { projectId },
        include: taskInclude,
        orderBy: [{ scopeItemId: 'asc' }, { declaredAt: 'asc' }]
      }),
      prisma.deliverableDependency.findMany({ where: { projectId } })
    ])
    const tasksById = new Map(tasks.map((task) => [task.id, task]))
    const dependenciesById = new Map(dependencies.map((dependency) => [dependency.id, dependency]))

    return tasks.map((task) => toTask(task, [
      ...resolveActiveDependencies(task, dependenciesById).map((dependency): ActiveBlocker => ({
        id: dependency.id,
        title: dependency.label,
        kind: 'dependency',
        party: dependency.party
      })),
      ...resolveActiveBlockers(task, tasksById).map((blocker): ActiveBlocker => ({
        id: blocker.id,
        title: blocker.title,
        kind: 'task',
        ownerId: blocker.ownerId
      }))
    ]))
  }

  // Submitting a deliverable carries the student's chosen tasks with it: each
  // becomes `submitted` and takes the submission's files as its evidence, so the
  // workload record and the delivered work can never drift apart.
  async attachTasksToSubmission(
    tx: Prisma.TransactionClient,
    taskIds: string[],
    submission: { id: string; projectId: string; scopeItemId?: string | null; files?: unknown }
  ) {
    if (!taskIds.length) return 0

    const result = await tx.deliverableTask.updateMany({
      where: {
        id: { in: taskIds },
        projectId: submission.projectId,
        status: { notIn: ['done', 'dropped'] }
      },
      data: {
        status: 'submitted',
        submissionId: submission.id,
        evidence: (Array.isArray(submission.files) ? submission.files : []) as Prisma.InputJsonValue
      }
    })
    return result.count
  }

  // The business approving a submission is what marks its tasks done — the only
  // path to `done`, and therefore the only way a task starts earning a share.
  async settleTasksForSubmission(
    tx: Prisma.TransactionClient,
    submissionId: string,
    decision: 'approved' | 'changes_requested'
  ) {
    if (decision === 'approved') {
      const result = await tx.deliverableTask.updateMany({
        where: { submissionId, status: 'submitted' },
        data: { status: 'done', doneAt: new Date() }
      })
      return result.count
    }

    // Changes requested: the work returns to its owner, still attached to the
    // submission so the next revision knows what it covers.
    const result = await tx.deliverableTask.updateMany({
      where: { submissionId, status: 'submitted' },
      data: { status: 'in_progress' }
    })
    return result.count
  }

  async listDependencies(projectId: string) {
    return prisma.deliverableDependency.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    })
  }

  async findDependency(id: string) {
    return prisma.deliverableDependency.findUnique({ where: { id } })
  }

  async createDependency(projectId: string, payload: Record<string, any>, raisedBy: { id?: string; name?: string }) {
    const user = raisedBy.id
      ? await prisma.user.findUnique({ where: { id: raisedBy.id }, select: { name: true, firstName: true, lastName: true } })
      : null
    const raisedByName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.name || raisedBy.name || 'Team member'

    return prisma.deliverableDependency.create({
      data: {
        projectId,
        scopeItemId: payload.scopeItemId ?? null,
        label: String(payload.label),
        note: payload.note ?? null,
        party: payload.party ?? 'business',
        raisedById: raisedBy.id ?? null,
        raisedByName
      }
    })
  }

  // Resolving a dependency clears every task waiting on it, because blockers are
  // recomputed on read rather than stored on the task.
  async resolveDependency(id: string, resolved: boolean) {
    return prisma.deliverableDependency.update({
      where: { id },
      data: {
        status: resolved ? 'resolved' : 'open',
        resolvedAt: resolved ? new Date() : null
      }
    })
  }

  // Live workload per deliverable: what each contributor has finished, as a
  // share of everything finished for that deliverable so far.
  async readProjectWorkload(projectId: string) {
    const tasks = await prisma.deliverableTask.findMany({
      where: { projectId },
      include: taskInclude
    })
    const targetIds = [...new Set(tasks.map((task) => task.milestoneDeliverableId ?? task.scopeItemId ?? ''))]
    const ownerById = new Map(tasks.filter((task) => task.owner).map((task) => [task.ownerId as string, toOwner(task)]))

    return targetIds.map((targetId) => {
      const scopeTasks = tasks.filter((task) => (task.milestoneDeliverableId ?? task.scopeItemId ?? '') === targetId)
      return {
        scopeItemId: targetId || null,
        targetId: targetId || null,
        taskCount: scopeTasks.length,
        doneCount: scopeTasks.filter((task) => task.status === 'done').length,
        blockedCount: scopeTasks.filter((task) => task.status === 'blocked').length,
        unclaimedCount: scopeTasks.filter((task) => !task.ownerId && task.status !== 'dropped').length,
        shares: computeWorkloadShares(scopeTasks).map((share) => ({
          ...share,
          student: ownerById.get(share.studentId) ?? null
        }))
      }
    })
  }

  async findTask(id: string) {
    return prisma.deliverableTask.findUnique({ where: { id }, include: taskInclude })
  }

  async declareTask(projectId: string, payload: Record<string, any>, declaredById: string | undefined) {
    const task = await prisma.deliverableTask.create({
      data: {
        projectId,
        scopeItemId: payload.scopeItemId ?? null,
        milestoneId: payload.milestoneId ?? null,
        milestoneDeliverableId: payload.milestoneDeliverableId ?? null,
        title: String(payload.title),
        description: payload.description ?? null,
        // Declaring for yourself claims it in the same step; declaring without
        // an owner puts it in the shared pool.
        ownerId: payload.ownerId ?? null,
        declaredById: declaredById ?? null,
        weight: normalizeTaskWeight(payload.weight),
        status: payload.ownerId ? 'in_progress' : 'todo',
        claimedAt: payload.ownerId ? new Date() : null
      },
      include: taskInclude
    })
    return toTask(task, [])
  }

  async updateTask(id: string, payload: Record<string, any>, actorStudentId: string | undefined) {
    const existing = await prisma.deliverableTask.findUnique({ where: { id } })
    if (!existing) return null

    const data: Record<string, any> = {}
    if (payload.title !== undefined) data.title = String(payload.title)
    if (payload.description !== undefined) data.description = payload.description
    if (payload.blockedByIds !== undefined) data.blockedByIds = payload.blockedByIds
    if (payload.blockedByDependencyIds !== undefined) data.blockedByDependencyIds = payload.blockedByDependencyIds
    if (payload.evidence !== undefined) data.evidence = payload.evidence
    // Scheduling only - never touches ownership or weight.
    if (payload.sprintId !== undefined) data.sprintId = payload.sprintId

    // Claiming: an unowned task can be taken by anyone on the team. Handing one
    // back returns it to the pool rather than deleting it.
    if (payload.ownerId !== undefined) {
      data.ownerId = payload.ownerId
      data.claimedAt = payload.ownerId ? new Date() : null
      // Picking a task up revives it: dropped work returns to the board and a
      // blocked task becomes the new owner's to carry, whoever dropped it before.
      if (payload.ownerId && ['todo', 'dropped', 'blocked'].includes(existing.status)) {
        data.status = 'in_progress'
        data.droppedReason = null
        data.blockedAt = null
      }
      if (!payload.ownerId) data.status = 'todo'
    }

    if (payload.status !== undefined) {
      // `done` is not a student's to set: it is granted when the business
      // approves the submission covering the task.
      if (!STUDENT_SETTABLE_TASK_STATUSES.includes(payload.status)) {
        return { blocked: 'status_not_student_settable' as const, task: toTask(existing, []) }
      }
      data.status = payload.status
      data.blockedAt = payload.status === 'blocked' ? new Date() : null
      if (payload.status === 'dropped') {
        data.droppedReason = payload.droppedReason ?? 'No reason given'
        // A dropped task keeps its history but returns the work to the pool.
        data.ownerId = null
      }
    }

    // Weight is free to set while a task is unclaimed and cheap to lower. Raising
    // a claimed task's weight needs another member's acknowledgement, so nobody
    // can quietly inflate their own share mid-flight.
    if (payload.weight !== undefined) {
      const nextWeight = normalizeTaskWeight(payload.weight)
      const isRaise = nextWeight > existing.weight
      // Anyone may edit any task, so the guard is specifically against raising
      // the weight of work credited to yourself.
      const isOwnTask = Boolean(existing.ownerId) && existing.ownerId === actorStudentId
      if (isRaise && isOwnTask && !payload.acknowledgedBy) {
        return { blocked: 'weight_raise_needs_ack' as const, task: toTask(existing, []) }
      }
      data.weight = nextWeight
    }

    const task = await prisma.deliverableTask.update({ where: { id }, data, include: taskInclude })
    if (payload.blockedByIds !== undefined) await this.notifyBlockedOwners(task)
    return toTask(task, [])
  }

  // Tells the people holding up a task that someone is waiting on them. A block
  // is a message to a person, not a flag on a card.
  private async notifyBlockedOwners(task: TaskRecord) {
    if (!task || !task.blockedByIds?.length) return

    const blockers = await prisma.deliverableTask.findMany({
      where: { id: { in: task.blockedByIds } },
      include: taskInclude
    })
    for (const blocker of blockers) {
      if (!blocker.ownerId || blocker.status === 'done') continue
      const userId = await resolveStudentUserId(blocker.ownerId)
      if (!userId) continue
      await prisma.notification.create({
        data: {
          userId,
          type: 'DELIVERABLE_TASK_BLOCKING',
          title: 'Someone is waiting on your task',
          body: `"${task.title}" cannot start until you finish "${blocker.title}".`,
          data: {
            projectId: task.projectId,
            taskId: task.id,
            blockerTaskId: blocker.id,
            deepLink: `/campus/projects/${task.projectId}?tab=work-deliverables&deliverable=${task.scopeItemId ?? ''}`
          },
          sentVia: ['IN_APP']
        }
      })
    }
  }

  // Snapshots the workload split for a deliverable at submission time. Payout
  // reads this, never the live tasks, so weights edited after the team submits
  // can no longer move money that was already agreed. Re-submitting a revision
  // refreshes a split nobody has confirmed yet, but never a confirmed one.
  async lockDeliverableSplit(projectId: string, scopeItemId: string) {
    const tasks = await prisma.deliverableTask.findMany({ where: { projectId, scopeItemId } })
    const shares = computeWorkloadShares(tasks)
    if (!shares.length) return null

    const existing = await prisma.deliverableSplitLock.findUnique({
      where: { projectId_scopeItemId: { projectId, scopeItemId } }
    })
    if (existing?.status === 'confirmed') return existing

    const contributors = shares.map((share) => share.studentId)
    const data = {
      shares: shares as unknown as object[],
      contributors,
      confirmedBy: [] as string[],
      status: 'pending',
      lockedAt: new Date(),
      confirmedAt: null
    }

    return prisma.deliverableSplitLock.upsert({
      where: { projectId_scopeItemId: { projectId, scopeItemId } },
      update: data,
      create: { projectId, scopeItemId, ...data }
    })
  }

  async listSplitLocks(projectId: string) {
    return prisma.deliverableSplitLock.findMany({ where: { projectId } })
  }

  // Each contributor confirms for themselves; the split is settled once every
  // contributor has. Confirmation is a consent record, so nobody can confirm on
  // another member's behalf.
  async confirmDeliverableSplit(projectId: string, scopeItemId: string, studentId: string) {
    const lock = await prisma.deliverableSplitLock.findUnique({
      where: { projectId_scopeItemId: { projectId, scopeItemId } }
    })
    if (!lock) return null
    if (!lock.contributors.includes(studentId)) return { lock, notAContributor: true as const }

    const confirmedBy = [...new Set([...lock.confirmedBy, studentId])]
    const isSettled = lock.contributors.every((contributor) => confirmedBy.includes(contributor))

    return {
      lock: await prisma.deliverableSplitLock.update({
        where: { id: lock.id },
        data: {
          confirmedBy,
          status: isSettled ? 'confirmed' : 'pending',
          confirmedAt: isSettled ? new Date() : null
        }
      })
    }
  }

  async readProjectSettings(projectId: string) {
    const settings = await prisma.projectSettings.findUnique({ where: { projectId } })
    return settings ?? {
      projectId,
      allowInterns: false,
      allowAttachees: false,
      roleEarningFactors: {},
      sprintCadence: null,
      catchupCadence: null
    }
  }

  async updateProjectSettings(projectId: string, payload: Record<string, any>) {
    const data = {
      allowInterns: payload.allowInterns,
      allowAttachees: payload.allowAttachees,
      roleEarningFactors: payload.roleEarningFactors,
      sprintCadence: payload.sprintCadence,
      catchupCadence: payload.catchupCadence
    }
    return prisma.projectSettings.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data }
    })
  }

  async listNotes(projectId: string) {
    return prisma.deliverableNote.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })
  }

  async createNote(projectId: string, payload: Record<string, any>, author: { id?: string; name?: string }) {
    const user = author.id
      ? await prisma.user.findUnique({ where: { id: author.id }, select: { name: true, firstName: true, lastName: true, email: true } })
      : null
    const authorName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      || user?.name
      || author.name
      || 'Team member'

    return prisma.deliverableNote.create({
      data: {
        projectId,
        scopeItemId: payload.scopeItemId ?? null,
        authorId: author.id ?? null,
        authorName,
        body: String(payload.body ?? ''),
        kind: Array.isArray(payload.files) && payload.files.length ? 'file' : 'note',
        files: Array.isArray(payload.files) ? payload.files : []
      }
    })
  }
}

const deliverableTasksRepository = new DeliverableTasksRepository()

export {
  DeliverableTasksRepository,
  deliverableTasksRepository
}
