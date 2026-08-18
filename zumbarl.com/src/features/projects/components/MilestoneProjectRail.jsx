import { FiDollarSign } from 'react-icons/fi'

function formatDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : null
}

// The rail on the planning tabs, built from the project's own records. It
// replaced a mock rail whose milestone dates, sprint donut and velocity chart
// were all invented, and which said nothing about what the viewer had earned.
function MilestoneProjectRail({
  deliverables = [],
  isBusinessViewer = false,
  milestones = [],
  project,
  sprints = [],
  tasks = [],
  viewerStudentId = '',
}) {
  const payouts = Array.isArray(project?.payouts) ? project.payouts : []
  const hasWallet = Number(project?.totalEarned) > 0 || payouts.length > 0

  const myTasks = tasks.filter((task) => task.ownerId && task.ownerId === viewerStudentId)
  const myDone = myTasks.filter((task) => task.status === 'done').length
  const myInReview = myTasks.filter((task) => task.status === 'submitted').length

  const activeSprint = sprints.find((sprint) => sprint.status === 'active')
    || sprints.find((sprint) => sprint.status === 'planned')
  const sprintTasks = activeSprint ? tasks.filter((task) => task.sprintId === activeSprint.id) : []
  const sprintDone = sprintTasks.filter((task) => task.status === 'done').length
  const sprintBlocked = sprintTasks.filter((task) => task.blockedBy?.length).length
  const sprintPercent = sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0

  const paidMilestones = milestones.filter((milestone) => milestone.status === 'approved').length

  // Predict the viewer's maximum project earnings from their current weighted
  // share of each deliverable. Ownership and task weight are the source of
  // truth, so the prediction moves whenever the team redistributes the work.
  const predictedTaskEarnings = deliverables.reduce((total, deliverable) => {
    const deliverableTasks = tasks.filter((task) => (
      task.status !== 'dropped'
      && (task.targetId || task.milestoneDeliverableId) === deliverable.id
    ))
    const totalWeight = deliverableTasks.reduce((sum, task) => sum + Math.max(1, Number(task.weight) || 1), 0)
    if (!totalWeight) return total

    const myWeight = deliverableTasks
      .filter((task) => task.ownerId === viewerStudentId)
      .reduce((sum, task) => sum + Math.max(1, Number(task.weight) || 1), 0)

    return total + ((myWeight / totalWeight) * Number(deliverable.budgetAmount || 0))
  }, 0)
  const agreedProjectAmount = Number(project?.agreedAmount || 0)
  const milestoneBudgetTotal = milestones.reduce((total, milestone) => (
    total + Number(milestone.budget?.committed ?? milestone.budgetAmount ?? 0)
  ), 0)
  const earningCeiling = Math.round(predictedTaskEarnings || agreedProjectAmount || milestoneBudgetTotal)
  const earningCeilingLabel = earningCeiling > 0
    ? `${project?.walletCurrency || 'KES'} ${earningCeiling.toLocaleString()}`
    : 'To be calculated'

  // Project-level commitment is the funded milestone budget. Deliverable-level
  // commitment is shown inside each milestone and can correctly remain zero
  // until the business breaks that milestone into priced deliverables.
  const committed = milestones.reduce((total, milestone) => (
    total + (
      milestone.fundingStatus === 'funded'
        ? Number(milestone.budgetAmount ?? milestone.budget?.budget ?? 0)
        : Number(milestone.budget?.committed ?? 0)
    )
  ), 0)
  const released = payouts
    .filter((payout) => ['paid', 'ready', 'completed'].includes(String(payout.status).toLowerCase()))
    .reduce((total, payout) => total + Number(payout.amount || 0), 0)
  const countedTasks = tasks.filter((task) => task.status !== 'dropped').length
  const approvedTasks = tasks.filter((task) => task.status === 'done').length
  const blockedTasks = tasks.filter((task) => task.blockedBy?.length).length

  return (
    <aside className="campus-rail project-workspace-rail" aria-label="Project summary">
      {isBusinessViewer ? (
        <section className="campus-rail-card project-wallet-card">
          <header>
            <h3>Project spend</h3>
            <span className="project-wallet-badge"><FiDollarSign aria-hidden="true" /></span>
          </header>
          <div className="project-wallet-figures">
            <div>
              <span>Committed</span>
              <strong>KES {committed.toLocaleString()}</strong>
            </div>
            <div>
              <span>Released</span>
              <strong>KES {released.toLocaleString()}</strong>
            </div>
          </div>
          <p className="project-rail-note">
            {approvedTasks} of {countedTasks} declared tasks approved
            {blockedTasks ? ` · ${blockedTasks} blocked` : ''}.
          </p>
          <p className="project-rail-note is-muted">
            {released
              ? `KES ${(committed - released).toLocaleString()} still to release as work is approved.`
              : 'Nothing released yet — budget moves as approved work is settled.'}
          </p>
        </section>
      ) : (
      <section className="campus-rail-card project-wallet-card">
        <header>
          <h3>Your earnings</h3>
          <span className="project-wallet-badge"><FiDollarSign aria-hidden="true" /></span>
        </header>
        <div className="project-wallet-figures">
          <div>
            <span>Earned here</span>
            <strong>{project?.totalEarnedLabel || 'KES 0'}</strong>
          </div>
          <div>
            <span>Wallet balance</span>
            <strong>{project?.walletBalanceLabel || '—'}</strong>
          </div>
          <div className="is-estimate">
            <span>You can earn up to</span>
            <strong>{earningCeilingLabel}</strong>
          </div>
        </div>

        <p className="project-rail-note is-estimate-note">
          {predictedTaskEarnings > 0
            ? 'Predicted from your current share of the assigned work. This changes when the team redistributes tasks.'
            : 'The project’s current earning ceiling. Your predicted share appears when the team divides the work.'}
        </p>

        <p className="project-rail-note">
          {myTasks.length
            ? `${myDone} of ${myTasks.length} of your tasks approved${myInReview ? ` · ${myInReview} in review` : ''}.`
            : 'Claim a task to start earning a share of this project.'}
        </p>

        {hasWallet ? (
          <ul className="project-wallet-payouts">
            {payouts.slice(0, 3).map((payout) => (
              <li key={payout.id}>
                <strong>{payout.amountLabel}</strong>
                <em>Released {payout.paidLabel}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="project-rail-note is-muted">
            Payouts appear here once the business approves a milestone and releases its budget.
          </p>
        )}
      </section>
      )}

      <section className="campus-rail-card project-rail-card">
        <header><h3>Milestones</h3></header>
        {milestones.length ? (
          <ul className="project-rail-list">
            {milestones.map((milestone) => (
              <li key={milestone.id}>
                <div>
                  <strong>{milestone.title}</strong>
                  <em>
                    {milestone.budgetAmount ? `KES ${Number(milestone.budgetAmount).toLocaleString()}` : 'No budget'}
                    {formatDate(milestone.endsAt) ? ` · due ${formatDate(milestone.endsAt)}` : ''}
                  </em>
                </div>
                <span className={`project-rail-pill is-${String(milestone.status).toLowerCase()}`}>
                  {milestone.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="project-rail-note is-muted">No milestones yet.</p>
        )}
        {milestones.length ? (
          <p className="project-rail-note">{paidMilestones} of {milestones.length} completed.</p>
        ) : null}
      </section>

      <section className="campus-rail-card project-rail-card">
        <header><h3>{activeSprint ? activeSprint.name : 'Sprints'}</h3></header>
        {activeSprint ? (
          <>
            <div className="project-rail-meter" role="img" aria-label={`${sprintPercent}% of sprint tasks done`}>
              <i><b style={{ width: `${sprintPercent}%` }} /></i>
              <span>{sprintPercent}%</span>
            </div>
            <ul className="project-rail-stats">
              <li><strong>{sprintTasks.length}</strong><span>Tasks</span></li>
              <li><strong>{sprintDone}</strong><span>Done</span></li>
              <li className={sprintBlocked ? 'is-blocked' : ''}><strong>{sprintBlocked}</strong><span>Blocked</span></li>
            </ul>
            {activeSprint.goal ? <p className="project-rail-note">{activeSprint.goal}</p> : null}
          </>
        ) : (
          <p className="project-rail-note is-muted">No sprint planned yet.</p>
        )}
      </section>
    </aside>
  )
}

export default MilestoneProjectRail
