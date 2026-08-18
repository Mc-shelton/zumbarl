import { useMemo, useState } from 'react'
import { FiCheck, FiMove, FiPlus, FiX } from 'react-icons/fi'

function formatWindow(startsAt, endsAt) {
  const format = (value) => {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      : null
  }
  const start = format(startsAt)
  const end = format(endsAt)
  if (start && end) return `${start} – ${end}`
  if (start) return `From ${start}`
  if (end) return `Until ${end}`
  return 'No dates set'
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const SPRINT_STATUS_FLOW = {
  planned: { next: 'active', label: 'Start sprint' },
  active: { next: 'completed', label: 'Complete sprint' },
  completed: { next: 'planned', label: 'Reopen sprint' },
}

function SprintForm({ initial, isPending, onCancel, onSave, submitLabel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    goal: initial?.goal || '',
    startsAt: toDateInput(initial?.startsAt),
    endsAt: toDateInput(initial?.endsAt),
  })

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    onSave({
      name: form.name.trim(),
      goal: form.goal.trim() || undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
    })
  }

  return (
    <form className="project-sprint-form" onSubmit={submit}>
      <label className="is-wide">
        <span>Sprint name</span>
        <input
          type="text"
          value={form.name}
          placeholder="e.g. Sprint 1 — Brand foundations"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </label>
      <label className="is-wide">
        <span>Sprint goal</span>
        <textarea
          rows={2}
          value={form.goal}
          placeholder="What this sprint is meant to achieve"
          onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
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
        <span>Ends</span>
        <input
          type="date"
          value={form.endsAt}
          onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
        />
      </label>
      <div className="project-sprint-form-actions">
        <button type="submit" className="project-primary-btn" disabled={isPending || !form.name.trim()}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function SprintTaskTable({
  canMove = false,
  deliverableById,
  draggedTaskId,
  onAssignTasks,
  onDragEnd,
  onDragStart,
  pending,
  sprintId = null,
  sprintTargets = [],
  tasks,
}) {
  return (
    <div className="project-sprint-backlog-table">
      <div className="project-sprint-backlog-row is-head" aria-hidden="true">
        <span>Task</span>
        <span>Deliverable</span>
        <span>Owner</span>
        <span>Effort</span>
        <span>Status</span>
        <span>Schedule</span>
      </div>
      {tasks.map((task) => {
        const targetId = task.targetId || task.milestoneDeliverableId || task.scopeItemId
        const deliverable = deliverableById.get(targetId)
        return (
          <article
            key={task.id}
            className={`project-sprint-backlog-row${draggedTaskId === task.id ? ' is-dragging' : ''}`}
            draggable={canMove && pending !== 'assign'}
            onDragStart={(event) => onDragStart(event, task.id)}
            onDragEnd={onDragEnd}
          >
            <div className="project-sprint-backlog-task">
              {canMove ? <FiMove aria-hidden="true" /> : null}
              <strong>{task.title}</strong>
            </div>
            <span>{deliverable?.title || 'Project work'}</span>
            <span>{task.owner ? task.owner.name : 'Unclaimed'}</span>
            <span>{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</span>
            <span className={`project-sprint-task-state is-${task.status}`}>{task.status.replace('_', ' ')}</span>
            {canMove && !sprintId && sprintTargets.length ? (
              <select
                value=""
                aria-label={`Schedule ${task.title}`}
                disabled={pending === 'assign'}
                onChange={(event) => {
                  if (event.target.value) onAssignTasks(event.target.value, [task.id])
                }}
              >
                <option value="">Move to sprint…</option>
                {sprintTargets.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
              </select>
            ) : null}
            {canMove && sprintId ? (
              <button
                type="button"
                className="project-sprint-return-btn"
                disabled={pending === 'assign'}
                onClick={() => onAssignTasks(null, [task.id])}
              >
                <FiX aria-hidden="true" /> Backlog
              </button>
            ) : null}
            {!canMove ? <span>{sprintId ? 'Locked' : 'Read only'}</span> : null}
            {canMove && !sprintId && !sprintTargets.length ? <span>Create a sprint first</span> : null}
          </article>
        )
      })}
    </div>
  )
}

function ProjectSprintsPanel({
  canPlan = false,
  deliverables = [],
  onAddBacklogItem,
  onAssignTasks,
  onCreateSprint,
  onUpdateSprint,
  pending,
  sprints = [],
  tasks = [],
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [backlogDraft, setBacklogDraft] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const [dragOverSprintId, setDragOverSprintId] = useState('')
  const [isBacklogDragOver, setIsBacklogDragOver] = useState(false)

  const backlog = useMemo(() => (
    tasks.filter((task) => !task.sprintId && !['done', 'dropped'].includes(task.status))
  ), [tasks])

  const activeSprint = useMemo(() => sprints.find((sprint) => sprint.status === 'active') || null, [sprints])
  const currentSprint = useMemo(() => (
    activeSprint || sprints.find((sprint) => sprint.status === 'planned') || null
  ), [activeSprint, sprints])
  const otherSprints = useMemo(() => (
    sprints.filter((sprint) => sprint.id !== currentSprint?.id)
  ), [currentSprint, sprints])
  const sprintTargets = useMemo(() => (
    sprints.filter((sprint) => sprint.status !== 'completed')
  ), [sprints])

  const deliverableById = useMemo(() => (
    new Map(deliverables.map((deliverable) => [deliverable.id, deliverable]))
  ), [deliverables])

  function startDragging(event, taskId) {
    setDraggedTaskId(taskId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }

  function finishDragging() {
    setDraggedTaskId('')
    setDragOverSprintId('')
    setIsBacklogDragOver(false)
  }

  function dropTask(event, sprintId) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    finishDragging()
    const task = tasks.find((item) => item.id === taskId)
    const targetSprint = sprintId ? sprints.find((sprint) => sprint.id === sprintId) : null
    if (!canPlan || !taskId || targetSprint?.status === 'completed' || (task?.sprintId || null) === sprintId) return
    onAssignTasks(sprintId, [taskId])
  }

  function renderSprint(sprint, label) {
    const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id)
    const done = sprintTasks.filter((task) => task.status === 'done').length
    const blocked = sprintTasks.filter((task) => task.blockedBy?.length).length
    const points = sprintTasks.reduce((sum, task) => sum + (Number(task.weight) || 0), 0)
    const donePoints = sprintTasks
      .filter((task) => task.status === 'done')
      .reduce((sum, task) => sum + (Number(task.weight) || 0), 0)
    const flow = SPRINT_STATUS_FLOW[sprint.status] || SPRINT_STATUS_FLOW.planned
    const canMoveTasks = canPlan && sprint.status !== 'completed'
    const cannotStart = sprint.status === 'planned' && activeSprint && activeSprint.id !== sprint.id

    return (
      <section
        key={sprint.id}
        className={`project-card project-sprint-card${dragOverSprintId === sprint.id ? ' is-drag-over' : ''}`}
        onDragEnter={() => {
          if (canMoveTasks) setDragOverSprintId(sprint.id)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragOverSprintId('')
        }}
        onDragOver={(event) => {
          if (canMoveTasks) event.preventDefault()
        }}
        onDrop={(event) => dropTask(event, sprint.id)}
      >
        {editingId === sprint.id ? (
          <SprintForm
            initial={sprint}
            isPending={pending === sprint.id}
            submitLabel="Save sprint"
            onCancel={() => setEditingId('')}
            onSave={(payload) => {
              onUpdateSprint(sprint.id, payload)
              setEditingId('')
            }}
          />
        ) : (
          <>
            <header>
              <div>
                {label ? <span className="project-sprint-kicker">{label}</span> : null}
                <h4>{sprint.name}</h4>
                <p>{sprint.goal || 'No goal set for this sprint yet.'}</p>
              </div>
              <span className={`project-sprint-status is-${sprint.status}`}>{sprint.status}</span>
            </header>

            <dl>
              <div><dt>Window</dt><dd>{formatWindow(sprint.startsAt, sprint.endsAt)}</dd></div>
              <div><dt>Tasks</dt><dd>{done}/{sprintTasks.length}</dd></div>
              <div><dt>Points</dt><dd>{donePoints}/{points}</dd></div>
              <div className={blocked ? 'is-blocked' : ''}><dt>Blocked</dt><dd>{blocked || '—'}</dd></div>
            </dl>

            {sprintTasks.length ? (
              <SprintTaskTable
                canMove={canMoveTasks}
                deliverableById={deliverableById}
                draggedTaskId={draggedTaskId}
                onAssignTasks={onAssignTasks}
                onDragEnd={finishDragging}
                onDragStart={startDragging}
                pending={pending}
                sprintId={sprint.id}
                tasks={sprintTasks}
              />
            ) : (
              <p className="project-sprint-empty project-sprint-drop-hint">
                {canMoveTasks ? 'Drag backlog tasks here to add them to this sprint.' : 'No tasks were scheduled in this sprint.'}
              </p>
            )}

            {canPlan ? (
              <div className="project-sprint-actions">
                <button
                  type="button"
                  disabled={pending === sprint.id || cannotStart}
                  title={cannotStart ? `Complete ${activeSprint.name} before starting another sprint` : undefined}
                  onClick={() => onUpdateSprint(sprint.id, { status: flow.next })}
                >
                  <FiCheck aria-hidden="true" /> {flow.label}
                </button>
                <button type="button" onClick={() => setEditingId(sprint.id)}>Edit goal &amp; dates</button>
                {cannotStart ? <span className="project-sprint-action-note">Complete the active sprint first.</span> : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    )
  }

  return (
    <div className="project-sprints">
      <header className="project-sprints-head">
        <div>
          <h3>Sprints</h3>
          <p>One active sprint at a time. Drag work from the backlog into the current sprint.</p>
        </div>
        {canPlan && !isCreating ? (
          <button type="button" className="project-primary-btn" onClick={() => setIsCreating(true)}>
            <FiPlus aria-hidden="true" /> Plan a sprint
          </button>
        ) : null}
      </header>

      {isCreating ? (
        <section className="project-card">
          <SprintForm
            isPending={pending === 'sprint'}
            submitLabel="Create sprint"
            onCancel={() => setIsCreating(false)}
            onSave={(payload) => {
              onCreateSprint(payload)
              setIsCreating(false)
            }}
          />
        </section>
      ) : null}

      {currentSprint ? (
        renderSprint(currentSprint, activeSprint ? 'Active sprint' : 'Next sprint')
      ) : (
        <section className="project-card project-sprint-empty-state">
          <h4>No current sprint</h4>
          <p>Plan a sprint, then drag backlog tasks into it.</p>
        </section>
      )}

      <section
        className={`project-card project-sprint-backlog-card${isBacklogDragOver ? ' is-drag-over' : ''}`}
        onDragEnter={() => setIsBacklogDragOver(true)}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsBacklogDragOver(false)
        }}
        onDragOver={(event) => {
          if (canPlan) event.preventDefault()
        }}
        onDrop={(event) => dropTask(event, null)}
      >
        <header>
          <div>
            <h4>Backlog <span>{backlog.length}</span></h4>
            <p>Declared work not yet scheduled into a sprint. Every item belongs to a deliverable.</p>
          </div>
          {canPlan && deliverables.length && !backlogDraft ? (
            <button
              type="button"
              className="project-primary-btn"
              onClick={() => setBacklogDraft({ title: '', weight: 1, milestoneDeliverableId: deliverables[0].id })}
            >
              <FiPlus aria-hidden="true" /> Add backlog item
            </button>
          ) : null}
        </header>

        {backlogDraft ? (
          <form
            className="project-sprint-backlog-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!backlogDraft.title.trim()) return
              const deliverable = deliverables.find((item) => item.id === backlogDraft.milestoneDeliverableId)
              onAddBacklogItem({
                title: backlogDraft.title.trim(),
                weight: Number(backlogDraft.weight) || 1,
                milestoneDeliverableId: deliverable?.id,
                milestoneId: deliverable?.milestoneId,
              })
              setBacklogDraft(null)
            }}
          >
            <label>
              <span>Backlog item</span>
              <input
                type="text"
                value={backlogDraft.title}
                placeholder="e.g. Draft the tone-of-voice section"
                onChange={(event) => setBacklogDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              <span>Deliverable</span>
              <select
                value={backlogDraft.milestoneDeliverableId}
                onChange={(event) => setBacklogDraft((current) => ({ ...current, milestoneDeliverableId: event.target.value }))}
              >
                {deliverables.map((deliverable) => (
                  <option key={deliverable.id} value={deliverable.id}>
                    {deliverable.milestoneTitle ? `${deliverable.milestoneTitle} · ` : ''}{deliverable.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Effort</span>
              <select
                value={backlogDraft.weight}
                onChange={(event) => setBacklogDraft((current) => ({ ...current, weight: event.target.value }))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value} {value === 1 ? 'point' : 'points'}</option>
                ))}
              </select>
            </label>
            <div className="project-sprint-form-actions">
              <button type="submit" className="project-primary-btn" disabled={pending === 'new' || !backlogDraft.title.trim()}>
                Add to backlog
              </button>
              <button type="button" onClick={() => setBacklogDraft(null)}>Cancel</button>
            </div>
          </form>
        ) : null}

        {canPlan && !deliverables.length ? (
          <p className="project-sprint-empty">Add a deliverable to a milestone first — backlog items are always tied to one.</p>
        ) : null}
        {backlog.length ? (
          <SprintTaskTable
            canMove={canPlan}
            deliverableById={deliverableById}
            draggedTaskId={draggedTaskId}
            onAssignTasks={onAssignTasks}
            onDragEnd={finishDragging}
            onDragStart={startDragging}
            pending={pending}
            sprintTargets={sprintTargets}
            tasks={backlog}
          />
        ) : (
          <p className="project-sprint-empty">Nothing waiting. Declare tasks on the board to fill the backlog.</p>
        )}
      </section>

      {otherSprints.length ? (
        <section className="project-sprint-other-section">
          <header>
            <h4>Other sprints <span>{otherSprints.length}</span></h4>
            <p>Upcoming and completed sprints remain available for planning and history.</p>
          </header>
          <div className="project-sprint-list">
            {otherSprints.map((sprint) => renderSprint(sprint))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default ProjectSprintsPanel
