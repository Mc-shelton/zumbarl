import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  claimDeliverableTask,
  confirmDeliverableSplit,
  createDeliverableDependency,
  createDeliverableNote,
  resolveDeliverableDependency,
  setTaskBlockers,
  setTaskSprint,
  declareDeliverableTask,
  dropDeliverableTask,
  listDeliverableTasks,
  releaseDeliverableTask,
  updateDeliverableTask,
} from '../services/deliverableTaskService'

const EMPTY_TASKS = []
const EMPTY_WORKLOAD = []

export function useDeliverableTasks(projectId, { enabled = true } = {}) {
  const [tasks, setTasks] = useState(EMPTY_TASKS)
  const [workload, setWorkload] = useState(EMPTY_WORKLOAD)
  const [viewerStudentId, setViewerStudentId] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [canAssignTasks, setCanAssignTasks] = useState(false)
  const [canParticipate, setCanParticipate] = useState(false)
  const [splitLocks, setSplitLocks] = useState(EMPTY_WORKLOAD)
  const [notes, setNotes] = useState(EMPTY_WORKLOAD)
  const [dependencies, setDependencies] = useState(EMPTY_WORKLOAD)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingTaskId, setPendingTaskId] = useState('')

  const applyResponse = useCallback((response) => {
    setTasks(Array.isArray(response?.tasks) ? response.tasks : EMPTY_TASKS)
    setWorkload(Array.isArray(response?.workload) ? response.workload : EMPTY_WORKLOAD)
    setViewerStudentId(response?.viewerStudentId || '')
    setCanEdit(Boolean(response?.canEdit))
    setCanAssignTasks(Boolean(response?.canAssignTasks))
    setCanParticipate(Boolean(response?.canParticipate))
    setSplitLocks(Array.isArray(response?.splitLocks) ? response.splitLocks : EMPTY_WORKLOAD)
    setNotes(Array.isArray(response?.notes) ? response.notes : EMPTY_WORKLOAD)
    setDependencies(Array.isArray(response?.dependencies) ? response.dependencies : EMPTY_WORKLOAD)
    setError('')
  }, [])

  const refresh = useCallback(async () => {
    if (!projectId || !enabled) return

    try {
      applyResponse(await listDeliverableTasks(projectId))
    } catch (requestError) {
      setError(requestError?.message || 'Could not load the workload board.')
    }
  }, [applyResponse, enabled, projectId])

  useEffect(() => {
    if (!projectId || !enabled) return undefined

    let isCurrent = true
    listDeliverableTasks(projectId)
      .then((response) => { if (isCurrent) applyResponse(response) })
      .catch((requestError) => {
        if (isCurrent) setError(requestError?.message || 'Could not load the workload board.')
      })
      .finally(() => { if (isCurrent) setIsLoading(false) })

    return () => { isCurrent = false }
  }, [applyResponse, enabled, projectId])

  // Every mutation refreshes the whole board: shares are derived from all of a
  // deliverable's tasks, so one task changing moves everybody's percentage.
  const runTaskAction = useCallback(async (taskId, action) => {
    setPendingTaskId(taskId || 'new')
    try {
      // Hand the created record back so a caller can act on it — the blocker
      // picker selects a dependency the moment it is raised.
      const result = await action()
      await refresh()
      setError('')
      return result ?? true
    } catch (requestError) {
      setError(requestError?.message || 'That change could not be saved.')
      return null
    } finally {
      setPendingTaskId('')
    }
  }, [refresh])

  // Keyed by the task's work target: a milestone deliverable in milestone mode,
  // an opportunity scope item otherwise.
  const tasksByScopeItem = useMemo(() => {
    const grouped = new Map()
    for (const task of tasks) {
      const key = task.targetId || task.scopeItemId || ''
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(task)
    }
    return grouped
  }, [tasks])

  const workloadByScopeItem = useMemo(() => (
    new Map(workload.map((entry) => [entry.targetId || entry.scopeItemId || '', entry]))
  ), [workload])

  const splitLockByScopeItem = useMemo(() => (
    new Map(splitLocks.map((lock) => [lock.scopeItemId || '', lock]))
  ), [splitLocks])

  // Dependencies are project-wide by default: a missing client asset usually
  // blocks more than the deliverable it was first raised against.
  const openDependencies = useMemo(() => (
    dependencies.filter((dependency) => dependency.status !== 'resolved')
  ), [dependencies])

  const notesByScopeItem = useMemo(() => {
    const grouped = new Map()
    for (const note of notes) {
      const key = note.scopeItemId || ''
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(note)
    }
    return grouped
  }, [notes])

  return {
    canEdit,
    canAssignTasks,
    canParticipate,
    error,
    isLoading,
    pendingTaskId,
    refresh,
    tasks,
    dependencies,
    notes,
    notesByScopeItem,
    openDependencies,
    splitLockByScopeItem,
    tasksByScopeItem,
    viewerStudentId,
    workloadByScopeItem,
    onAddNote: (payload) => runTaskAction('note', () => createDeliverableNote(projectId, payload)),
    onConfirmSplit: (scopeItemId) => runTaskAction('split', () => confirmDeliverableSplit(projectId, scopeItemId)),
    onCreateDependency: (payload) => runTaskAction('dependency', () => createDeliverableDependency(projectId, payload)),
    onResolveDependency: (dependencyId, resolved) => runTaskAction(dependencyId, () => resolveDeliverableDependency(dependencyId, resolved)),
    onSetTaskBlockers: (taskId, blockers) => runTaskAction(taskId, () => setTaskBlockers(taskId, blockers)),
    onSetTaskSprint: (taskId, sprintId) => runTaskAction(taskId, () => setTaskSprint(taskId, sprintId)),
    onClaimTask: (taskId, studentId) => runTaskAction(taskId, () => claimDeliverableTask(taskId, studentId)),
    onDeclareTask: (payload) => runTaskAction('', () => declareDeliverableTask(projectId, payload)),
    onDropTask: (taskId, reason) => runTaskAction(taskId, () => dropDeliverableTask(taskId, reason)),
    onReleaseTask: (taskId) => runTaskAction(taskId, () => releaseDeliverableTask(taskId)),
    onUpdateTask: (taskId, patch) => runTaskAction(taskId, () => updateDeliverableTask(taskId, patch)),
  }
}

export default useDeliverableTasks
