import { useState } from 'react'
import MilestoneDeliverableModal from './MilestoneDeliverableModal'
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiPlay,
  FiPlus,
} from 'react-icons/fi'

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function formatWindow(startsAt, dueAt) {
  const format = (value) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      : null
  }
  const start = format(startsAt)
  const end = format(dueAt)
  if (start && end) return `${start} – ${end}`
  if (end) return `Due ${end}`
  if (start) return `From ${start}`
  return 'No dates set'
}

function AddMilestoneForm({ isPending, onCancel, onCreate }) {
  const [form, setForm] = useState({ title: '', budgetAmount: '', startsAt: '', dueAt: '' })

  function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    onCreate({
      title: form.title.trim(),
      budgetAmount: Number(form.budgetAmount) || 0,
      startsAt: form.startsAt || undefined,
      dueAt: form.dueAt || undefined,
    })
  }

  return (
    <form className="project-card milestone-add-form" onSubmit={submit}>
      <label>
        <span>Milestone</span>
        <input
          type="text"
          value={form.title}
          placeholder="e.g. Milestone 3 — Launch assets"
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <label>
        <span>Budget (KES)</span>
        <input
          type="number"
          min="0"
          value={form.budgetAmount}
          onChange={(event) => setForm((current) => ({ ...current, budgetAmount: event.target.value }))}
        />
      </label>
      <label>
        <span>Starts</span>
        <input
          type="date"
          value={form.startsAt}
          onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
        />
      </label>
      <label>
        <span>Due</span>
        <input
          type="date"
          value={form.dueAt}
          onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
        />
      </label>
      <div className="milestone-add-form-actions">
        <button type="submit" className="project-primary-btn" disabled={isPending === 'milestone' || !form.title.trim()}>
          Add milestone
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// Milestone -> deliverable -> task. The business shapes the scope and releases
// funding; the team declares tasks against each deliverable on the board, then
// submits the milestone once that work is in.
function MilestoneScopePanel({
  canPlan = true,
  canSettle = false,
  completionPending = '',
  deliverablesByMilestone,
  milestones = [],
  onActivateMilestone,
  onCompleteMilestone,
  onCreateDeliverable,
  onCreateMilestone,
  onFundMilestone,
  onOpenDeliverable,
  onUpdateMilestone,
  pending,
  tasks = [],
}) {
  const [deliverableFor, setDeliverableFor] = useState(null)
  const [datesFor, setDatesFor] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="milestone-scope">
      <header className="milestone-scope-toolbar">
        <div>
          <h3>Milestones</h3>
          <p>Each milestone carries its own budget and breaks into deliverables the team works against.</p>
        </div>
        {canPlan && !isAdding ? (
          <button type="button" className="project-primary-btn" onClick={() => setIsAdding(true)}>
            <FiPlus aria-hidden="true" /> Add milestone
          </button>
        ) : null}
      </header>

      {isAdding ? (
        <AddMilestoneForm
          isPending={pending}
          onCancel={() => setIsAdding(false)}
          onCreate={(payload) => {
            onCreateMilestone(payload)
            setIsAdding(false)
          }}
        />
      ) : null}

      {!milestones.length ? (
        <section className="project-card">
          <p className="milestone-scope-empty">
            No milestones yet. They come from the milestones defined in the brief, and the business can add more here.
          </p>
        </section>
      ) : null}

      {milestones.map((milestone) => {
        const deliverables = deliverablesByMilestone.get(milestone.id) || []
        const milestoneTasks = tasks.filter((task) => task.milestoneId === milestone.id)
        const doneTasks = milestoneTasks.filter((task) => task.status === 'done').length
        const blockedTasks = milestoneTasks.filter((task) => task.blockedBy?.length).length
        // Paying out is only offered once the work is actually finished.
        const isReady = milestoneTasks.length > 0
          && milestoneTasks.every((task) => ['done', 'dropped'].includes(task.status))
          && blockedTasks === 0
        const isFunded = milestone.fundingStatus === 'funded'

        return (
          <section key={milestone.id} className="project-card milestone-scope-card">
            <header>
              <div>
                <h3>{milestone.title}</h3>
                <p>
                  {milestone.budgetAmount ? `KES ${Number(milestone.budgetAmount).toLocaleString()}` : 'Budget not assigned'}
                  {' · '}{isFunded ? 'Funded' : 'Not funded'}
                  {' · '}{deliverables.length} deliverable{deliverables.length === 1 ? '' : 's'}
                  {milestone.budget ? ` · KES ${Number(milestone.budget.committed).toLocaleString()} committed` : ''}
                  {milestoneTasks.length ? ` · ${doneTasks}/${milestoneTasks.length} tasks done` : ''}
                </p>
              </div>
              <div className="milestone-scope-head-actions">
                <span className={`milestone-scope-status is-${String(milestone.status).toLowerCase()}`}>
                  {milestone.status}
                </span>
                <button
                  type="button"
                  className="milestone-scope-dates-btn"
                  disabled={!canPlan}
                  onClick={() => setDatesFor(datesFor === milestone.id ? '' : milestone.id)}
                >
                  <FiCalendar aria-hidden="true" /> {formatWindow(milestone.startsAt, milestone.endsAt)}
                </button>
              </div>
            </header>

            {milestone.budget?.isOverCommitted ? (
              <p className="milestone-scope-overcommit" role="status">
                <FiAlertCircle aria-hidden="true" />
                <span>
                  Deliverables commit KES {Number(milestone.budget.committed).toLocaleString()} against a
                  KES {Number(milestone.budget.budget).toLocaleString()} budget — short by
                  KES {Number(milestone.budget.shortfall).toLocaleString()}.
                  {milestone.budget.dormantCount
                    ? ` ${milestone.budget.dormantCount} deliverable${milestone.budget.dormantCount === 1 ? ' is' : 's are'} parked until funds are added.`
                    : ' Submissions are held until funds are added.'}
                </span>
                {canSettle ? (
                  <button
                    type="button"
                    disabled={pending === milestone.id}
                    onClick={() => onUpdateMilestone(milestone.id, {
                      budgetAmount: Number(milestone.budget.committed),
                    })}
                  >
                    Add KES {Number(milestone.budget.shortfall).toLocaleString()}
                  </button>
                ) : null}
              </p>
            ) : null}

            {canPlan && datesFor === milestone.id ? (
              <form
                className="milestone-scope-dates"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  onUpdateMilestone(milestone.id, {
                    startsAt: form.get('startsAt') || null,
                    dueAt: form.get('dueAt') || null,
                  })
                  setDatesFor('')
                }}
              >
                <label>
                  <span>Starts</span>
                  <input type="date" name="startsAt" defaultValue={toDateInput(milestone.startsAt)} />
                </label>
                <label>
                  <span>Due</span>
                  <input type="date" name="dueAt" defaultValue={toDateInput(milestone.endsAt)} />
                </label>
                <button type="submit" disabled={pending === milestone.id}>Save dates</button>
                <button type="button" onClick={() => setDatesFor('')}>Cancel</button>
              </form>
            ) : null}

            {deliverables.length ? (
              <ul className="milestone-scope-deliverables">
                {deliverables.map((deliverable) => {
                  const deliverableTasks = tasks.filter((task) => task.milestoneDeliverableId === deliverable.id)
                  const done = deliverableTasks.filter((task) => task.status === 'done').length
                  const blocked = deliverableTasks.filter((task) => task.blockedBy?.length).length

                  return (
                    <li key={deliverable.id}>
                      <div>
                        <strong>{deliverable.title}</strong>
                        <em>
                          {deliverable.budgetAmount ? `KES ${Number(deliverable.budgetAmount).toLocaleString()} · ` : ''}
                          {deliverableTasks.length
                            ? `${done} of ${deliverableTasks.length} tasks done`
                            : 'No tasks declared yet'}
                          {blocked ? ` · ${blocked} blocked` : ''}
                        </em>
                      </div>
                      {deliverable.status === 'dormant' ? (
                        <span className="milestone-scope-dormant" title="Parked until the milestone budget covers it">
                          Parked
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="milestone-scope-open"
                        onClick={() => onOpenDeliverable?.(deliverable, milestone)}
                      >
                        Open
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="milestone-scope-empty">
                No deliverables yet. Break this milestone into the pieces the team will deliver.
              </p>
            )}

            <div className="milestone-scope-actions">
              {canPlan ? (
                <button type="button" className="milestone-scope-add" onClick={() => setDeliverableFor(milestone)}>
                  <FiPlus aria-hidden="true" /> Add deliverable
                </button>
              ) : null}

              {canSettle && !isFunded ? (
                <button
                  type="button"
                  className="milestone-scope-add"
                  disabled={pending === milestone.id}
                  onClick={() => onFundMilestone(milestone.id)}
                >
                  <FiDollarSign aria-hidden="true" /> Release funds
                </button>
              ) : null}

              {canSettle && isFunded && !['active', 'approved'].includes(milestone.status) ? (
                <button
                  type="button"
                  className="milestone-scope-add"
                  disabled={pending === milestone.id}
                  onClick={() => onActivateMilestone(milestone.id)}
                >
                  <FiPlay aria-hidden="true" /> Activate milestone
                </button>
              ) : null}

              {milestone.status !== 'active' && milestone.status !== 'approved' ? (
                <span className="milestone-scope-gate-note">
                  {isFunded
                    ? 'Funded — activate it to open submissions.'
                    : 'Release the budget, then activate, to open submissions.'}
                </span>
              ) : null}

              {milestone.status === 'approved' ? (
                <span className="milestone-scope-approved">
                  <FiCheckCircle aria-hidden="true" /> Completed
                </span>
              ) : canSettle && onCompleteMilestone ? (
                <button
                  type="button"
                  className="milestone-scope-submit"
                  disabled={!isReady || completionPending === milestone.id}
                  title={isReady
                    ? "Approve this milestone and release its budget, split by the team's workload"
                    : 'Every task on this milestone must be approved, and nothing left blocked'}
                  onClick={() => onCompleteMilestone(milestone)}
                >
                  <FiCheckCircle aria-hidden="true" />
                  {completionPending === milestone.id ? 'Completing…' : 'Mark complete & pay'}
                </button>
              ) : (
                <span className="milestone-scope-progress-note">
                  {milestoneTasks.length
                    ? `${doneTasks} of ${milestoneTasks.length} tasks approved${blockedTasks ? ` · ${blockedTasks} blocked` : ''}`
                    : 'No tasks declared on this milestone yet'}
                </span>
              )}
            </div>
          </section>
        )
      })}

      {deliverableFor ? (
        <MilestoneDeliverableModal
          isPending={pending === 'deliverable'}
          milestone={deliverableFor}
          onClose={() => setDeliverableFor(null)}
          onSave={(payload) => {
            onCreateDeliverable({ ...payload, milestoneId: deliverableFor.id })
            setDeliverableFor(null)
          }}
        />
      ) : null}
    </div>
  )
}

export default MilestoneScopePanel
