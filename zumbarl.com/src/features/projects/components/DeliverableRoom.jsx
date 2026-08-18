import { useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiLock,
  FiMessageSquare,
  FiPlus,
  FiSlash,
  FiUploadCloud,
  FiUserPlus,
  FiX,
} from 'react-icons/fi'

const TASK_STATES = [
  { id: 'pool', label: 'Unclaimed', hint: 'Work anyone on the team can pick up.' },
  { id: 'blocked', label: 'Blocked', hint: 'Waiting on another task or an outside dependency.' },
  { id: 'active', label: 'In progress', hint: 'Claimed and being worked on.' },
  { id: 'submitted', label: 'In review', hint: 'Submitted to the business. Approval marks it done.' },
  { id: 'done', label: 'Done', hint: 'Approved by the business. These earn a share.' },
  { id: 'dropped', label: 'Dropped', hint: 'Kept for the record; the work returned to the pool.' },
]

const TASK_STATE_BY_ID = Object.fromEntries(TASK_STATES.map((state) => [state.id, state]))

// One pool, ordered so what needs a decision floats: blocked work first, then
// what is moving, then what is free to pick up, with finished and abandoned
// work last.
const STATE_ORDER = ['blocked', 'active', 'pool', 'submitted', 'done', 'dropped']

const WEIGHT_OPTIONS = [1, 2, 3, 4, 5]

function getTaskGroup(task) {
  if (task.status === 'dropped') return 'dropped'
  if (task.status === 'done') return 'done'
  if (task.status === 'submitted') return 'submitted'
  if (task.status === 'blocked' || task.blockedBy?.length) return 'blocked'
  if (!task.ownerId) return 'pool'
  return 'active'
}

function DeclareTaskForm({ assignees, isPending, onCancel, onDeclare, viewerStudentId }) {
  const [title, setTitle] = useState('')
  const [weight, setWeight] = useState(1)
  const [ownerId, setOwnerId] = useState(viewerStudentId || '')

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return
    onDeclare({ title: title.trim(), weight: Number(weight), ownerId: ownerId || null })
    setTitle('')
    setWeight(1)
  }

  return (
    <form className="deliverable-room-declare" onSubmit={handleSubmit}>
      <label>
        <span>What will you deliver?</span>
        <input
          type="text"
          value={title}
          placeholder="e.g. Brand asset pack"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label>
        <span>Effort</span>
        <select value={weight} onChange={(event) => setWeight(event.target.value)}>
          {WEIGHT_OPTIONS.map((option) => (
            <option key={option} value={option}>{option} {option === 1 ? 'point' : 'points'}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Assign to</span>
        <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
          <option value="">Leave unassigned</option>
          {assignees.map((assignee) => (
            <option key={assignee.studentId} value={assignee.studentId}>
              {assignee.name}{assignee.studentId === viewerStudentId ? ' (me)' : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="deliverable-room-declare-actions">
        <button type="submit" className="project-primary-btn" disabled={isPending || !title.trim()}>
          {isPending ? 'Declaring…' : 'Declare task'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}


const DEPENDENCY_PARTIES = [
  { id: 'business', label: 'The business' },
  { id: 'client', label: "The business's client" },
  { id: 'external', label: 'An external party' },
  { id: 'other', label: 'Something else' },
]

// Blockers are picked after a task exists, not while declaring it: you rarely
// know what will stall you at the moment you write the task down. Dependencies
// lead the list because work stalls on people outside the team more often than
// on teammates, and naming one is how the business finds out it is the holdup.
function BlockerPicker({ dependencies, isPending, onClose, onCreateDependency, onSave, openTasks, task }) {
  const [taskIds, setTaskIds] = useState(task.blockedByIds || [])
  const [dependencyIds, setDependencyIds] = useState(task.blockedByDependencyIds || [])
  const [isAddingDependency, setIsAddingDependency] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newParty, setNewParty] = useState('business')

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id])
  }

  async function handleAddDependency(event) {
    event.preventDefault()
    if (!newLabel.trim()) return
    const created = await onCreateDependency({ label: newLabel.trim(), party: newParty })
    if (created?.id) setDependencyIds((current) => [...current, created.id])
    setNewLabel('')
    setIsAddingDependency(false)
  }

  const selectableTasks = openTasks.filter((item) => item.id !== task.id)

  return (
    <div className="deliverable-room-blocker-picker" role="group" aria-label={`What is blocking ${task.title}`}>
      <header>
        <h5>What is blocking &ldquo;{task.title}&rdquo;?</h5>
        <button type="button" onClick={onClose} aria-label="Close blocker picker"><FiX aria-hidden="true" /></button>
      </header>

      <section>
        <h6>Dependencies</h6>
        <p>Something outside the team: an asset, an approval, an account.</p>
        {dependencies.length ? (
          <ul>
            {dependencies.map((dependency) => (
              <li key={dependency.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={dependencyIds.includes(dependency.id)}
                    onChange={() => toggle(dependencyIds, setDependencyIds, dependency.id)}
                  />
                  <span>{dependency.label}</span>
                  <em>{DEPENDENCY_PARTIES.find((party) => party.id === dependency.party)?.label || dependency.party}</em>
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        {isAddingDependency ? (
          <form className="deliverable-room-dependency-form" onSubmit={handleAddDependency}>
            <input
              type="text"
              value={newLabel}
              placeholder="e.g. Brand guidelines from the client"
              onChange={(event) => setNewLabel(event.target.value)}
            />
            <select value={newParty} onChange={(event) => setNewParty(event.target.value)}>
              {DEPENDENCY_PARTIES.map((party) => (
                <option key={party.id} value={party.id}>{party.label}</option>
              ))}
            </select>
            <button type="submit" disabled={isPending || !newLabel.trim()}>Add</button>
            <button type="button" onClick={() => setIsAddingDependency(false)}>Cancel</button>
          </form>
        ) : (
          <button type="button" className="deliverable-room-add-dependency" onClick={() => setIsAddingDependency(true)}>
            <FiPlus aria-hidden="true" /> New dependency
          </button>
        )}
      </section>

      <section>
        <h6>Other open tasks</h6>
        {selectableTasks.length ? (
          <ul>
            {selectableTasks.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={taskIds.includes(item.id)}
                    onChange={() => toggle(taskIds, setTaskIds, item.id)}
                  />
                  <span>{item.title}</span>
                  <em>{item.owner ? item.owner.name : 'Unclaimed'}</em>
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="deliverable-room-blocker-empty">No other open tasks in this deliverable.</p>}
      </section>

      <footer>
        <button
          type="button"
          className="project-primary-btn"
          disabled={isPending}
          onClick={() => onSave({ blockedByIds: taskIds, blockedByDependencyIds: dependencyIds })}
        >
          Save blockers
        </button>
      </footer>
    </div>
  )
}

function TaskCard({
  assignees,
  canAssignTasks,
  canEdit,
  dependencies,
  isPending,
  onClaim,
  onCreateDependency,
  onDrop,
  onRelease,
  onReview,
  onSetBlockers,
  onSetSprint,
  onSubmit,
  openTasks,
  sprints,
  submitBlockedReason = '',
  task,
  viewerStudentId,
}) {
  const [isPickingBlockers, setIsPickingBlockers] = useState(false)
  const isMine = task.ownerId && task.ownerId === viewerStudentId
  const isBlocked = Boolean(task.blockedBy?.length)
  // Any member can close out anything pending. Credit still follows the owner,
  // so closing a teammate's task pays them, not whoever pressed the button.
  const isOpen = !['done', 'submitted'].includes(task.status)
  const isDropped = task.status === 'dropped'
  const state = getTaskGroup(task)
  const ownerName = task.owner?.name || 'Unclaimed'
  const ownerInitial = task.owner ? ownerName.trim().charAt(0).toUpperCase() : ''

  return (
    <article className={`deliverable-room-task is-${state}${isPickingBlockers ? ' is-picking' : ''}`}>
      <header>
        <strong>{task.title}</strong>
        <span className="deliverable-room-task-weight">{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</span>
      </header>

      <p className="deliverable-room-task-meta">
        <span className={`deliverable-room-state-chip is-${state}`}>{TASK_STATE_BY_ID[state]?.label || state}</span>
        <span className="deliverable-room-task-owner">
          {ownerInitial ? <b aria-hidden="true">{ownerInitial}</b> : null}
          <span>{ownerName}</span>
          {isMine ? <em> · you</em> : null}
        </span>
      </p>

      {isBlocked && isOpen ? (
        <ul className="deliverable-room-task-blocked">
          {task.blockedBy.map((blocker) => (
            <li key={blocker.id}>
              <FiAlertCircle aria-hidden="true" />
              <span>{blocker.title}</span>
              <em>{blocker.kind === 'dependency' ? 'dependency' : 'task'}</em>
            </li>
          ))}
        </ul>
      ) : null}

      {canEdit && sprints?.length && isOpen ? (
        <label className="deliverable-room-task-sprint">
          <span>Sprint</span>
          <select
            value={task.sprintId || ''}
            disabled={isPending}
            onChange={(event) => onSetSprint(task.id, event.target.value || null)}
          >
            <option value="">Unscheduled</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {task.status === 'dropped' && task.droppedReason ? (
        <p className="deliverable-room-task-dropped">Dropped: {task.droppedReason}</p>
      ) : null}

      {task.status === 'submitted' ? (
        onReview ? (
          <div className="deliverable-room-task-actions">
            <button type="button" disabled={isPending} onClick={() => onReview(task)}>
              <FiEye aria-hidden="true" /> Review submission
            </button>
          </div>
        ) : (
          <p className="deliverable-room-task-dropped">Submitted — waiting on the business to approve.</p>
        )
      ) : null}

      {canEdit ? (
        <div className="deliverable-room-task-actions">
          {canAssignTasks && isOpen ? (
            <label className="deliverable-room-task-assignee">
              <span>Assigned to</span>
              <select
                value={task.ownerId || ''}
                disabled={isPending}
                onChange={(event) => onClaim(task, event.target.value || null)}
              >
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee.studentId} value={assignee.studentId}>{assignee.name}</option>
                ))}
              </select>
            </label>
          ) : !task.ownerId ? (
            <button type="button" disabled={isPending} onClick={() => onClaim(task)}>
              <FiUserPlus aria-hidden="true" />
              {task.status === 'dropped' ? 'Pick this back up' : 'Take this on'}
            </button>
          ) : null}
          {isOpen && !isDropped ? (
            <>
              {viewerStudentId ? (
                <button
                  type="button"
                  disabled={isPending || isBlocked || Boolean(submitBlockedReason)}
                  title={submitBlockedReason
                    || (isBlocked ? 'Clear what this task is waiting on first' : 'Send this work to the business for review')}
                  onClick={() => onSubmit(task)}
                >
                  <FiUploadCloud aria-hidden="true" /> Submit for review
                </button>
              ) : null}
              {task.ownerId ? (
                <button type="button" disabled={isPending} onClick={() => onRelease(task)}>
                  <FiX aria-hidden="true" /> {isMine ? 'Release' : 'Return to pool'}
                </button>
              ) : null}
              <button type="button" disabled={isPending} onClick={() => onDrop(task)}>
                <FiSlash aria-hidden="true" /> Drop
              </button>
              <button type="button" disabled={isPending} onClick={() => setIsPickingBlockers((current) => !current)}>
                <FiAlertCircle aria-hidden="true" /> {isBlocked ? 'Edit blockers' : 'Mark blocked'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isPickingBlockers ? (
        <BlockerPicker
          dependencies={dependencies}
          isPending={isPending}
          openTasks={openTasks}
          task={task}
          onClose={() => setIsPickingBlockers(false)}
          onCreateDependency={onCreateDependency}
          onSave={async (blockers) => {
            await onSetBlockers(task.id, blockers)
            setIsPickingBlockers(false)
          }}
        />
      ) : null}
    </article>
  )
}


function DeliverableThread({ canEdit, isPending, notes, onAddNote }) {
  const [body, setBody] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!body.trim()) return
    onAddNote({ body: body.trim() })
    setBody('')
  }

  return (
    <section className="deliverable-room-thread">
      <header>
        <h4><FiMessageSquare aria-hidden="true" /> Thread</h4>
        <p>Discussion about this deliverable only, kept out of the project-wide messages.</p>
      </header>

      {notes.length ? (
        <ol>
          {notes.map((note) => (
            <li key={note.id}>
              <p>
                <strong>{note.authorName || 'Team member'}</strong>
                <time>{new Date(note.createdAt).toLocaleDateString()}</time>
              </p>
              <p className="deliverable-room-thread-body">{note.body}</p>
              {note.files?.length ? (
                <ul className="deliverable-room-thread-files">
                  {note.files.map((file) => (
                    <li key={file.url || file.fileName}>
                      <FiFileText aria-hidden="true" />
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noreferrer">{file.fileName || 'Attachment'}</a>
                      ) : <span>{file.fileName || 'Attachment'}</span>}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="deliverable-room-thread-empty">No notes yet. Use this to agree scope before anyone submits.</p>
      )}

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <textarea
            rows={2}
            value={body}
            placeholder="Leave a note for the team..."
            onChange={(event) => setBody(event.target.value)}
          />
          <button type="submit" disabled={isPending || !body.trim()}>Post</button>
        </form>
      ) : null}
    </section>
  )
}

function SplitLockNotice({ canEdit, isPending, lock, onConfirm, viewerStudentId }) {
  if (!lock) return null

  const isContributor = lock.contributors?.includes(viewerStudentId)
  const hasConfirmed = lock.confirmedBy?.includes(viewerStudentId)
  const outstanding = (lock.contributors?.length || 0) - (lock.confirmedBy?.length || 0)

  return (
    <section className={`deliverable-room-lock is-${lock.status}`}>
      <p>
        <FiLock aria-hidden="true" />
        {lock.status === 'confirmed'
          ? 'Split confirmed by everyone credited. This is what the payout will follow.'
          : `Split frozen at submission. ${outstanding} of ${lock.contributors?.length || 0} still to confirm.`}
      </p>
      {canEdit && isContributor && !hasConfirmed ? (
        <button type="button" disabled={isPending} onClick={onConfirm}>Confirm my share</button>
      ) : null}
      {hasConfirmed && lock.status !== 'confirmed' ? <em>You confirmed. Waiting on the rest.</em> : null}
    </section>
  )
}

function DeliverableRoom({
  assignees = [],
  canEdit = true,
  canAssignTasks = false,
  // Writing tasks belongs to the team; the thread and dependencies are shared
  // ground the business takes part in too.
  canParticipate = canEdit,
  embedded = false,
  deliverable,
  error,
  isLoading = false,
  isPending,
  onRetry,
  onClaimTask,
  onClose,
  onDeclareTask,
  onDropTask,
  onReleaseTask,
  onReviewTask,
  onSetTaskSprint,
  onSubmitTask,
  sprints = [],
  submitBlockedReason = '',
  dependencies = [],
  notes = [],
  onAddNote,
  onConfirmSplit,
  onCreateDependency,
  onResolveDependency,
  onSetTaskBlockers,
  splitLock,
  tasks = [],
  viewerStudentId,
}) {
  const [isDeclaring, setIsDeclaring] = useState(false)
  const [activeState, setActiveState] = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [sprintFilter, setSprintFilter] = useState('all')

  const grouped = useMemo(() => {
    const groups = Object.fromEntries(TASK_STATES.map((state) => [state.id, []]))
    for (const task of tasks) groups[getTaskGroup(task)].push(task)
    return groups
  }, [tasks])

  const visibleTasks = useMemo(() => (
    tasks
      .filter((task) => (activeState === 'all' ? true : getTaskGroup(task) === activeState))
      .filter((task) => (!mineOnly || task.ownerId === viewerStudentId))
      .filter((task) => (
        sprintFilter === 'all'
          || (sprintFilter === 'unscheduled' ? !task.sprintId : task.sprintId === sprintFilter)
      ))
      .sort((left, right) => (
        STATE_ORDER.indexOf(getTaskGroup(left)) - STATE_ORDER.indexOf(getTaskGroup(right))
      ))
  ), [activeState, mineOnly, sprintFilter, tasks, viewerStudentId])

  const mineCount = useMemo(() => (
    tasks.filter((task) => task.ownerId && task.ownerId === viewerStudentId).length
  ), [tasks, viewerStudentId])

  const openTasks = useMemo(() => (
    tasks.filter((task) => task.status !== 'done' && task.status !== 'dropped')
  ), [tasks])

  const blockedCount = grouped.blocked.length

  return (
    <section className="deliverable-room">
      <header className="deliverable-room-header">
        <div>
          {onClose ? (
            <button type="button" className="deliverable-room-back" onClick={onClose}>← Back</button>
          ) : null}
          {embedded ? null : (
            <>
              <h3>{deliverable?.title || 'Deliverable'}</h3>
              <p>{deliverable?.description || 'Divide this deliverable into tasks so everyone can see who is doing what.'}</p>
            </>
          )}
        </div>
        <dl className="deliverable-room-stats">
          <div>
            <dt>Tasks</dt>
            <dd>{tasks.length}</dd>
          </div>
          <div>
            <dt>Done</dt>
            <dd>{grouped.done.length}</dd>
          </div>
          <div className={blockedCount ? 'is-blocked' : ''}>
            <dt>Blocked</dt>
            <dd>{blockedCount}</dd>
          </div>
        </dl>
      </header>

      {error ? (
        <div className="deliverable-room-error" role="alert">
          <p>{error}</p>
          {onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
        </div>
      ) : null}

      <SplitLockNotice
        canEdit={canEdit}

        isPending={isPending}
        lock={splitLock}
        viewerStudentId={viewerStudentId}
        onConfirm={onConfirmSplit}
      />

      {dependencies.length ? (
        <section className="deliverable-room-dependencies">
          <header>
            <h4>Dependencies</h4>
            <p>Work this deliverable is waiting on from outside the team.</p>
          </header>
          <ul>
            {dependencies.map((dependency) => (
              <li key={dependency.id} className={dependency.status === 'resolved' ? 'is-resolved' : ''}>
                <div>
                  <strong>{dependency.label}</strong>
                  <em>{DEPENDENCY_PARTIES.find((party) => party.id === dependency.party)?.label || dependency.party}</em>
                </div>
                {canParticipate ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onResolveDependency(dependency.id, dependency.status !== 'resolved')}
                  >
                    {dependency.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
                  </button>
                ) : (
                  <span>{dependency.status === 'resolved' ? 'Resolved' : 'Open'}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {submitBlockedReason && canEdit ? (
        <p className="deliverable-room-readonly is-blocked">
          Submissions are not open on this work yet: {submitBlockedReason} Tasks can still be declared, claimed and worked on.
        </p>
      ) : null}

      {!canEdit && !error ? (
        <p className="deliverable-room-readonly">
          Tasks and weights are the team's to set. You can still reply in the thread and clear anything the team is waiting on from you.
        </p>
      ) : null}

      {canEdit ? (
        isDeclaring ? (
          <DeclareTaskForm
            assignees={assignees}
            isPending={isPending}
            onCancel={() => setIsDeclaring(false)}
            onDeclare={(payload) => {
              onDeclareTask(payload)
              setIsDeclaring(false)
            }}
            viewerStudentId={viewerStudentId}
          />
        ) : (
          <button type="button" className="project-primary-btn deliverable-room-declare-btn" onClick={() => setIsDeclaring(true)}>
            <FiPlus aria-hidden="true" /> Declare a task
          </button>
        )
      ) : null}

      {tasks.length ? (
        <div className="deliverable-room-filters" role="group" aria-label="Filter tasks">
          <button
            type="button"
            className={activeState === 'all' ? 'is-active' : ''}
            aria-pressed={activeState === 'all'}
            onClick={() => setActiveState('all')}
          >
            All <span>{tasks.length}</span>
          </button>
          {TASK_STATES.map((state) => (
            grouped[state.id].length ? (
              <button
                key={state.id}
                type="button"
                className={`is-${state.id} ${activeState === state.id ? 'is-active' : ''}`}
                aria-pressed={activeState === state.id}
                title={state.hint}
                onClick={() => setActiveState(activeState === state.id ? 'all' : state.id)}
              >
                {state.label} <span>{grouped[state.id].length}</span>
              </button>
            ) : null
          ))}
          {sprints.length ? (
            <select
              className="deliverable-room-sprint-filter"
              value={sprintFilter}
              aria-label="Filter tasks by sprint"
              onChange={(event) => setSprintFilter(event.target.value)}
            >
              <option value="all">All sprints</option>
              <option value="unscheduled">Unscheduled</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
              ))}
            </select>
          ) : null}
          {viewerStudentId && mineCount ? (
            <button
              type="button"
              className={`deliverable-room-filter-mine ${mineOnly ? 'is-active' : ''}`}
              aria-pressed={mineOnly}
              onClick={() => setMineOnly((current) => !current)}
            >
              Mine <span>{mineCount}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="deliverable-room-pool">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            assignees={assignees}
            canAssignTasks={canAssignTasks}
            canEdit={canEdit}
            dependencies={dependencies}
            isPending={isPending}
            openTasks={openTasks}
            task={task}
            viewerStudentId={viewerStudentId}
            onClaim={onClaimTask}
            onCreateDependency={onCreateDependency}
            onDrop={onDropTask}
            onRelease={onReleaseTask}
            onReview={onReviewTask}
            onSetBlockers={onSetTaskBlockers}
            onSetSprint={onSetTaskSprint}
            onSubmit={onSubmitTask}
            sprints={sprints}
            submitBlockedReason={submitBlockedReason}
          />
        ))}

        {tasks.length && !visibleTasks.length ? (
          <p className="deliverable-room-filter-empty">
            Nothing matches that filter.
            <button type="button" onClick={() => { setActiveState('all'); setMineOnly(false) }}>Clear filters</button>
          </p>
        ) : null}

        {tasks.length === 0 && !isLoading ? (
          <div className="project-work-deliverables-empty">
            <FiClock aria-hidden="true" />
            <strong>No tasks declared yet</strong>
            <p>Declare what you plan to contribute so the team can divide this deliverable.</p>
            {canEdit && !isDeclaring ? (
              <button type="button" className="project-primary-btn" onClick={() => setIsDeclaring(true)}>
                <FiPlus aria-hidden="true" /> Declare the first task
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <DeliverableThread
        canEdit={canParticipate}
        isPending={isPending}
        notes={notes}
        onAddNote={onAddNote}
      />
    </section>
  )
}

export default DeliverableRoom
