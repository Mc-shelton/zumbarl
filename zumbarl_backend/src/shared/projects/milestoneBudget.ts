// A milestone can run for months, so two things have to hold mid-flight rather
// than only at the end:
//
//  1. Scope added along the way must not quietly commit more money than the
//     milestone holds. Deliverables carry prices; their sum is what a milestone
//     has committed, and the moment that passes the budget the business is asked
//     for funds. Until it arrives the offending deliverable is parked as dormant
//     so no more work accrues against money that does not exist.
//
//  2. People must be paid as work is approved, not when the milestone closes.
//     Each approved task draws its share of its deliverable's price.

type DeliverableLike = {
  id: string
  budgetAmount?: number | null
  status?: string | null
}

const DORMANT_STATUS = 'dormant'

function toAmount(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

// Dormant deliverables are excluded: they are parked precisely because they were
// not covered, so counting them would keep the milestone permanently over.
function getCommittedAmount(deliverables: DeliverableLike[]) {
  return deliverables
    .filter((deliverable) => deliverable.status !== DORMANT_STATUS)
    .reduce((total, deliverable) => total + toAmount(deliverable.budgetAmount), 0)
}

function readMilestoneBudget(deliverables: DeliverableLike[], milestoneBudget: unknown) {
  const budget = toAmount(milestoneBudget)
  const committed = getCommittedAmount(deliverables)
  const shortfall = Math.max(0, committed - budget)

  return {
    budget,
    committed,
    remaining: Math.max(0, budget - committed),
    shortfall,
    isOverCommitted: shortfall > 0,
    dormantCount: deliverables.filter((deliverable) => deliverable.status === DORMANT_STATUS).length
  }
}

// Splits a deliverable's price across the tasks declared under it. Paying an
// approved task early means later tasks share what is left, so a deliverable can
// never pay out more than its price however scope grows.
function getTaskPayableAmount(
  task: { id: string; weight?: number | null },
  tasks: Array<{ id: string; weight?: number | null; status?: string | null; paidAmount?: number | null }>,
  deliverableBudget: unknown
) {
  const budget = toAmount(deliverableBudget)
  if (!budget) return 0

  const alreadyPaid = tasks.reduce((total, item) => total + toAmount(item.paidAmount), 0)
  const remainingBudget = Math.max(0, budget - alreadyPaid)
  if (!remainingBudget) return 0

  // Everything still in play: unpaid work, whether approved yet or not, so the
  // pot is shared with tasks that have not finished rather than drained by
  // whoever happens to be approved first.
  const unpaid = tasks.filter((item) => item.status !== 'dropped' && !toAmount(item.paidAmount))
  const unpaidWeight = unpaid.reduce((total, item) => total + Math.max(1, Number(item.weight) || 1), 0)
  if (!unpaidWeight) return 0

  const share = (Math.max(1, Number(task.weight) || 1) / unpaidWeight) * remainingBudget
  return Math.min(remainingBudget, Math.round(share))
}

export {
  DORMANT_STATUS,
  getCommittedAmount,
  getTaskPayableAmount,
  readMilestoneBudget
}
