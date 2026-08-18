import { useMemo, useState } from 'react'
import { FiAlertCircle, FiCheck, FiClock, FiPlus, FiSearch, FiUserPlus } from 'react-icons/fi'
import DeliverableRoom from './DeliverableRoom'
import ProjectStartNotice from './ProjectStartNotice'

const BOARD_COLUMNS = [
  { id: 'pool', label: 'Unassigned', hint: 'Ready for someone to pick up', icon: FiPlus },
  { id: 'active', label: 'In progress', hint: 'Work currently moving', icon: FiClock },
  { id: 'blocked', label: 'Blocked', hint: 'Waiting on a dependency', icon: FiAlertCircle },
  { id: 'submitted', label: 'In review', hint: 'Waiting for business approval', icon: FiUserPlus },
  { id: 'done', label: 'Done', hint: 'Approved and complete', icon: FiCheck },
]

const MANUAL_BOARD_STATES = new Set(['pool', 'active', 'blocked'])

function boardState(task) {
  if (task.status === 'done') return 'done'
  if (task.status === 'submitted') return 'submitted'
  if (task.status === 'blocked' || task.blockedBy?.length) return 'blocked'
  if (!task.ownerId || task.status === 'dropped') return 'pool'
  return 'active'
}

// The milestone board is the same Deliverable Room, opened against a milestone
// deliverable instead of an opportunity scope item. Tasks declared here carry
// both the deliverable and its milestone, so the milestone's payout can weigh
// every task beneath it.
function MilestoneBoardPanel({
  deliverableTasks,
  hasStarted = true,
  assignees = [],
  deliverablesByMilestone,
  milestones = [],
  mode = 'detail',
  openDeliverableId,
  onOpenDeliverable,
  onSubmitTask,
  sprints = [],
}) {
  const [localOpenId, setLocalOpenId] = useState('')
  const [query, setQuery] = useState('')
  const [deliverableFilter, setDeliverableFilter] = useState('all')
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const [dragOverColumn, setDragOverColumn] = useState('')
  const [moveNotice, setMoveNotice] = useState('')
  const openId = openDeliverableId || localOpenId

  const deliverables = useMemo(() => (
    milestones.flatMap((milestone) => (
      (deliverablesByMilestone.get(milestone.id) || []).map((deliverable) => ({ ...deliverable, milestone }))
    ))
  ), [deliverablesByMilestone, milestones])

  const open = deliverables.find((deliverable) => deliverable.id === openId) || null

  const deliverableById = useMemo(() => (
    new Map(deliverables.map((deliverable) => [deliverable.id, deliverable]))
  ), [deliverables])

  const activeSprint = useMemo(() => (
    sprints.find((sprint) => sprint.status === 'active') || null
  ), [sprints])

  const boardTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return deliverableTasks.tasks.filter((task) => {
      const targetId = task.targetId || task.milestoneDeliverableId || task.scopeItemId || ''
      const deliverable = deliverableById.get(targetId)
      return task.sprintId === activeSprint?.id
        && (deliverableFilter === 'all' || targetId === deliverableFilter)
        && (!normalizedQuery || `${task.title} ${task.owner?.name || ''} ${deliverable?.title || ''}`.toLowerCase().includes(normalizedQuery))
    })
  }, [activeSprint, deliverableById, deliverableFilter, deliverableTasks.tasks, query])

  const groupedBoardTasks = useMemo(() => (
    Object.fromEntries(BOARD_COLUMNS.map((column) => [
      column.id,
      boardTasks.filter((task) => boardState(task) === column.id),
    ]))
  ), [boardTasks])

  function close() {
    setLocalOpenId('')
    onOpenDeliverable?.('')
  }

  // Why submitting is closed, if it is: the project has not started, or the
  // task's milestone is not funded and activated yet.
  function getSubmitBlockedReason(task) {
    if (!hasStarted) return 'The business has not started this project yet.'
    const milestone = milestones.find((item) => item.id === task?.milestoneId)
    if (milestone && milestone.status !== 'active') {
      return milestone.fundingStatus === 'funded'
        ? `“${milestone.title}” is funded but not activated yet.`
        : `“${milestone.title}” has not been funded and activated yet.`
    }
    return ''
  }

  async function moveTask(task, nextState) {
    if (!task || boardState(task) === nextState) return
    setMoveNotice('')

    if (nextState === 'submitted') {
      const blockedReason = getSubmitBlockedReason(task)
      if (blockedReason) {
        setMoveNotice(`Submissions are not open on this work yet: ${blockedReason}`)
        return
      }
      if (deliverableTasks.viewerStudentId && onSubmitTask) {
        onSubmitTask(task)
      } else {
        setMoveNotice('Only a student contributor can submit task work for review.')
      }
      return
    }

    if (!MANUAL_BOARD_STATES.has(nextState)) {
      setMoveNotice('A task moves to Done only after the business approves its submission.')
      return
    }

    if (nextState === 'pool') {
      await deliverableTasks.onReleaseTask(task.id)
      return
    }

    if (nextState === 'active') {
      if (!task.ownerId) {
        setMoveNotice('Assign or claim this task before moving it into progress.')
        return
      }
      if (task.blockedByIds?.length || task.blockedByDependencyIds?.length) {
        await deliverableTasks.onSetTaskBlockers(task.id, { blockedByIds: [], blockedByDependencyIds: [] })
      }
      await deliverableTasks.onUpdateTask(task.id, { status: 'in_progress' })
      return
    }

    await deliverableTasks.onUpdateTask(task.id, { status: 'blocked' })
  }

  async function dropTask(event, columnId) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    const task = deliverableTasks.tasks.find((item) => item.id === taskId)
    setDraggedTaskId('')
    setDragOverColumn('')
    await moveTask(task, columnId)
  }

  if (mode === 'kanban' && deliverables.length && !open) {
    const doneCount = groupedBoardTasks.done.length
    const progress = boardTasks.length ? Math.round((doneCount / boardTasks.length) * 100) : 0
    const declareTarget = deliverableFilter !== 'all' ? deliverableFilter : deliverables[0]?.id

    return (
      <section className="milestone-kanban">
        <header className="milestone-kanban-toolbar">
          <div>
            <h3>Project board</h3>
            <p>
              {activeSprint
                ? `Showing tasks in the active sprint: ${activeSprint.name}.`
                : 'Start a sprint to show its tasks on the board.'}
            </p>
          </div>
          <div className="milestone-kanban-progress" aria-label={`${progress}% of visible tasks complete`}>
            <span><strong>{doneCount}</strong>/{boardTasks.length} done</span>
            <i><b style={{ width: `${progress}%` }} /></i>
          </div>
          <label className="milestone-kanban-search">
            <FiSearch aria-hidden="true" />
            <input value={query} placeholder="Search tasks or people" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select value={deliverableFilter} onChange={(event) => setDeliverableFilter(event.target.value)}>
            <option value="all">All deliverables</option>
            {deliverables.map((deliverable) => (
              <option key={deliverable.id} value={deliverable.id}>{deliverable.title}</option>
            ))}
          </select>
          {deliverableTasks.canEdit ? (
            <button type="button" className="project-primary-btn" onClick={() => onOpenDeliverable?.(declareTarget)}>
              <FiPlus aria-hidden="true" /> Declare task
            </button>
          ) : null}
        </header>

        {moveNotice ? <p className="milestone-kanban-notice" role="status">{moveNotice}</p> : null}

        <div className="milestone-kanban-columns">
          {BOARD_COLUMNS.map((column) => {
            const ColumnIcon = column.icon
            const columnTasks = groupedBoardTasks[column.id]
            return (
              <section
                key={column.id}
                className={`milestone-kanban-column is-${column.id}${dragOverColumn === column.id ? ' is-drag-over' : ''}${MANUAL_BOARD_STATES.has(column.id) ? '' : ' is-locked-stage'}`}
                onDragEnter={() => setDragOverColumn(column.id)}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setDragOverColumn('')
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropTask(event, column.id)}
              >
                <header>
                  <div><ColumnIcon aria-hidden="true" /><strong>{column.label}</strong><span>{columnTasks.length}</span></div>
                  <p>{column.hint}</p>
                </header>
                <div className="milestone-kanban-stack">
                  {columnTasks.map((task) => {
                    const targetId = task.targetId || task.milestoneDeliverableId || task.scopeItemId || ''
                    const deliverable = deliverableById.get(targetId)
                    const initial = (task.owner?.name || '?').trim().charAt(0).toUpperCase()
                    return (
                      <article
                        key={task.id}
                        className={`milestone-kanban-card${draggedTaskId === task.id ? ' is-dragging' : ''}`}
                        draggable={!['submitted', 'done'].includes(task.status) && deliverableTasks.canEdit}
                        onDragEnd={() => { setDraggedTaskId(''); setDragOverColumn('') }}
                        onDragStart={(event) => {
                          setDraggedTaskId(task.id)
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', task.id)
                        }}
                      >
                        <button type="button" className="milestone-kanban-card-open" onClick={() => onOpenDeliverable?.(targetId)}>
                          <span className="milestone-kanban-card-scope">{deliverable?.title || 'Deliverable'}</span>
                          <strong>{task.title}</strong>
                          {task.blockedBy?.length ? <em><FiAlertCircle aria-hidden="true" /> {task.blockedBy.length} blocker{task.blockedBy.length === 1 ? '' : 's'}</em> : null}
                        </button>
                        <footer>
                          <span className="milestone-kanban-points">{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</span>
                          {task.sprintId ? <span className="milestone-kanban-sprint">Sprint</span> : null}
                          {task.owner ? (
                            <span className="milestone-kanban-owner" title={task.owner.name}><b>{initial}</b>{task.owner.name}</span>
                          ) : <span className="milestone-kanban-owner is-empty">Unassigned</span>}
                        </footer>
                        {deliverableTasks.canAssignTasks && !['submitted', 'done'].includes(task.status) ? (
                          <label className="milestone-kanban-assign">
                            <span>Assign</span>
                            <select
                              value={task.ownerId || ''}
                              disabled={Boolean(deliverableTasks.pendingTaskId)}
                              onChange={(event) => deliverableTasks.onClaimTask(task.id, event.target.value || null)}
                            >
                              <option value="">Leave unassigned</option>
                              {assignees.map((assignee) => (
                                <option key={assignee.studentId} value={assignee.studentId}>{assignee.name}</option>
                              ))}
                            </select>
                          </label>
                        ) : !task.ownerId && deliverableTasks.viewerStudentId ? (
                          <button type="button" className="milestone-kanban-claim" onClick={() => deliverableTasks.onClaimTask(task.id, deliverableTasks.viewerStudentId)}>
                            <FiUserPlus aria-hidden="true" /> Claim task
                          </button>
                        ) : null}
                        {deliverableTasks.canEdit && !['submitted', 'done'].includes(task.status) ? (
                          <label className="milestone-kanban-move">
                            <span>Move to</span>
                            <select
                              value={boardState(task)}
                              disabled={Boolean(deliverableTasks.pendingTaskId)}
                              onChange={(event) => moveTask(task, event.target.value)}
                            >
                              <option value="pool">Unassigned</option>
                              <option value="active">In progress</option>
                              <option value="blocked">Blocked</option>
                              {deliverableTasks.viewerStudentId ? <option value="submitted">Submit for review…</option> : null}
                            </select>
                          </label>
                        ) : null}
                      </article>
                    )
                  })}
                  {!columnTasks.length ? <p className="milestone-kanban-empty">No tasks here</p> : null}
                </div>
              </section>
            )
          })}
        </div>
      </section>
    )
  }

  if (!deliverables.length) {
    return (
      <section className="milestone-board project-card">
        <p className="milestone-scope-empty">
          No deliverables yet. The business breaks each milestone into deliverables on the Milestones tab, and the
          team declares tasks against them here.
        </p>
      </section>
    )
  }

  // Work out up front why submitting is closed, so the button says so instead of
  // letting someone fill in a form that the API will reject.
  if (open) {
    return (
      <section className="milestone-board project-card">
        <ProjectStartNotice hasStarted={hasStarted} />
        <DeliverableRoom
          assignees={assignees}
          canEdit={deliverableTasks.canEdit}
          canAssignTasks={deliverableTasks.canAssignTasks}
          canParticipate={deliverableTasks.canParticipate}
          deliverable={{ ...open, description: open.description || open.milestone?.title }}
          dependencies={deliverableTasks.dependencies}
          error={deliverableTasks.error}
          isLoading={deliverableTasks.isLoading}
          isPending={Boolean(deliverableTasks.pendingTaskId)}
          notes={deliverableTasks.notesByScopeItem.get(open.id) || []}
          splitLock={deliverableTasks.splitLockByScopeItem.get(open.id)}
          sprints={sprints}
          tasks={deliverableTasks.tasksByScopeItem.get(open.id) || []}
          viewerStudentId={deliverableTasks.viewerStudentId}
          workload={deliverableTasks.workloadByScopeItem.get(open.id)}
          onAddNote={(payload) => deliverableTasks.onAddNote({ ...payload, scopeItemId: open.id })}
          onClaimTask={(task, ownerId = deliverableTasks.viewerStudentId) => deliverableTasks.onClaimTask(task.id, ownerId)}
          onClose={close}
          onConfirmSplit={() => deliverableTasks.onConfirmSplit(open.id)}
          onCreateDependency={(payload) => deliverableTasks.onCreateDependency({ ...payload, scopeItemId: open.id })}
          onDeclareTask={(payload) => deliverableTasks.onDeclareTask({
            ...payload,
            milestoneDeliverableId: open.id,
            milestoneId: open.milestoneId,
          })}
          onDropTask={(task) => deliverableTasks.onDropTask(task.id, 'Handed back to the team')}
          onReleaseTask={(task) => deliverableTasks.onReleaseTask(task.id)}
          onResolveDependency={deliverableTasks.onResolveDependency}
          onRetry={deliverableTasks.refresh}
          onSetTaskBlockers={deliverableTasks.onSetTaskBlockers}
          onSetTaskSprint={deliverableTasks.onSetTaskSprint}
          onSubmitTask={onSubmitTask}
          submitBlockedReason={open ? getSubmitBlockedReason({ milestoneId: open.milestoneId }) : ''}
        />
      </section>
    )
  }

  return (
    <section className="milestone-board project-card">
      <header className="project-sprints-head">
        <div>
          <h3>Board</h3>
          <p>Pick a deliverable to declare and track the tasks beneath it.</p>
        </div>
      </header>

      <ul className="milestone-scope-deliverables">
        {deliverables.map((deliverable) => {
          const tasks = deliverableTasks.tasksByScopeItem.get(deliverable.id) || []
          const done = tasks.filter((task) => task.status === 'done').length
          const blocked = tasks.filter((task) => task.blockedBy?.length).length

          return (
            <li key={deliverable.id}>
              <div>
                <strong>{deliverable.title}</strong>
                <em>
                  {deliverable.milestone?.title}
                  {' · '}
                  {tasks.length ? `${done} of ${tasks.length} done` : 'No tasks yet'}
                  {blocked ? ` · ${blocked} blocked` : ''}
                </em>
              </div>
              <button type="button" className="milestone-scope-open" onClick={() => setLocalOpenId(deliverable.id)}>
                Open
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default MilestoneBoardPanel
