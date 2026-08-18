// Workload maths for deliverable-based team projects. One module so the share
// a student sees while working is computed exactly like the share they are paid
// on: the live view and the payout call the same functions.

const DELIVERABLE_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'submitted', 'done', 'dropped'] as const
// A student can carry a task to `submitted`; only the business approving the
// submission moves it to `done`.
const STUDENT_SETTABLE_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'dropped'] as const
const COUNTABLE_TASK_STATUS = 'done'
const MIN_TASK_WEIGHT = 1
const MAX_TASK_WEIGHT = 5

type DeliverableTaskLike = {
  ownerId?: string | null
  weight?: number | null
  status?: string | null
  evidence?: unknown
}

type WorkloadShare = {
  studentId: string
  weight: number
  sharePercent: number
}

function normalizeTaskWeight(weight: unknown) {
  const numeric = Math.round(Number(weight ?? MIN_TASK_WEIGHT))
  if (!Number.isFinite(numeric)) return MIN_TASK_WEIGHT
  return Math.min(MAX_TASK_WEIGHT, Math.max(MIN_TASK_WEIGHT, numeric))
}

function hasEvidence(evidence: unknown) {
  if (Array.isArray(evidence)) return evidence.length > 0
  return Boolean(evidence && typeof evidence === 'object' && Object.keys(evidence as object).length > 0)
}

// Only approved work with something to show for it earns a share. A task reaches
// `done` solely through the business approving the submission that covers it, so
// the split cannot be moved by flipping a status.
function isCountableTask(task: DeliverableTaskLike) {
  return Boolean(task.ownerId) && task.status === COUNTABLE_TASK_STATUS && hasEvidence(task.evidence)
}

// Percentages are reported to one decimal so a live share never reads as a
// misleading round number; the money split never uses them (see distributeByShares).
function computeWorkloadShares(tasks: DeliverableTaskLike[]): WorkloadShare[] {
  const weightByStudent = new Map<string, number>()

  for (const task of tasks) {
    if (!isCountableTask(task)) continue
    const studentId = String(task.ownerId)
    weightByStudent.set(studentId, (weightByStudent.get(studentId) ?? 0) + normalizeTaskWeight(task.weight))
  }

  const totalWeight = [...weightByStudent.values()].reduce((sum, weight) => sum + weight, 0)
  if (!totalWeight) return []

  return [...weightByStudent.entries()]
    .map(([studentId, weight]) => ({
      studentId,
      weight,
      sharePercent: Math.round((weight / totalWeight) * 1000) / 10
    }))
    .sort((first, second) => second.weight - first.weight)
}

const EARNING_ROLES = ['earner', 'contributor', 'awarded', 'lead']

function normalizeContributorRole(role: unknown) {
  return String(role ?? 'earner').trim().toLowerCase()
}

// Applies the project's role policy to raw workload shares. A non-earning role
// keeps only its configured factor of what its work earned; the freed remainder
// is redistributed across the full earners in proportion to their own shares.
// The underlying weights are never touched - an intern's contribution still
// counts and still shows, the policy only decides what it converts into.
function applyRoleEarningPolicy(
  shares: WorkloadShare[],
  roleByStudentId: Map<string, string>,
  factors: Record<string, number> | null | undefined
): WorkloadShare[] {
  if (!shares.length) return shares

  const factorFor = (studentId: string) => {
    const role = normalizeContributorRole(roleByStudentId.get(studentId))
    if (EARNING_ROLES.includes(role)) return 1
    const configured = Number(factors?.[role])
    if (!Number.isFinite(configured)) return 1
    return Math.min(1, Math.max(0, configured / 100))
  }

  const adjusted = shares.map((share) => ({
    ...share,
    weight: share.weight * factorFor(share.studentId)
  }))
  const freed = shares.reduce((sum, share, index) => sum + (share.weight - adjusted[index].weight), 0)
  if (freed <= 0) return recomputePercentages(adjusted.filter((share) => share.weight > 0))

  const earnerWeight = shares
    .filter((share) => factorFor(share.studentId) === 1)
    .reduce((sum, share) => sum + share.weight, 0)

  // Nobody on this target earns: leave the shares empty so the caller keeps the
  // budget in escrow rather than paying it to people the policy excluded.
  if (earnerWeight <= 0) return []

  const redistributed = adjusted.map((share) => (
    factorFor(share.studentId) === 1
      ? { ...share, weight: share.weight + (freed * (share.weight / earnerWeight)) }
      : share
  ))

  return recomputePercentages(redistributed.filter((share) => share.weight > 0))
}

function recomputePercentages(shares: WorkloadShare[]): WorkloadShare[] {
  const total = shares.reduce((sum, share) => sum + share.weight, 0)
  if (total <= 0) return []
  return shares.map((share) => ({
    ...share,
    sharePercent: Math.round((share.weight / total) * 1000) / 10
  }))
}

// Splits an amount by weight, giving the rounding remainder to the last share so
// the parts always sum to the total exactly.
function distributeByShares(total: number, shares: WorkloadShare[]) {
  const totalWeight = shares.reduce((sum, share) => sum + share.weight, 0)
  if (!shares.length || totalWeight <= 0) return []

  let assigned = 0
  return shares.map((share, index) => {
    const isLast = index === shares.length - 1
    const amount = isLast ? total - assigned : Math.round((share.weight / totalWeight) * total)
    assigned += amount
    return { studentId: share.studentId, amount }
  })
}

// A task is blocked while any task it names is still unfinished, or any external
// dependency it names is still open. Recomputed on read rather than stored, so
// finishing a blocker or resolving a dependency clears everything waiting on it
// without a maintenance pass.
function resolveActiveBlockers<T extends { id: string; status?: string | null }>(
  task: { blockedByIds?: string[] | null },
  tasksById: Map<string, T>
) {
  return (task.blockedByIds ?? [])
    .map((blockerId) => tasksById.get(blockerId))
    .filter((blocker): blocker is T => Boolean(blocker) && blocker!.status !== COUNTABLE_TASK_STATUS && blocker!.status !== 'dropped')
}

function resolveActiveDependencies<T extends { id: string; status?: string | null }>(
  task: { blockedByDependencyIds?: string[] | null },
  dependenciesById: Map<string, T>
) {
  return (task.blockedByDependencyIds ?? [])
    .map((dependencyId) => dependenciesById.get(dependencyId))
    .filter((dependency): dependency is T => Boolean(dependency) && dependency!.status !== 'resolved')
}

export {
  DELIVERABLE_TASK_STATUSES,
  STUDENT_SETTABLE_TASK_STATUSES,
  MAX_TASK_WEIGHT,
  MIN_TASK_WEIGHT,
  applyRoleEarningPolicy,
  computeWorkloadShares,
  distributeByShares,
  isCountableTask,
  normalizeContributorRole,
  normalizeTaskWeight,
  resolveActiveBlockers,
  resolveActiveDependencies,
  type DeliverableTaskLike,
  type WorkloadShare
}
