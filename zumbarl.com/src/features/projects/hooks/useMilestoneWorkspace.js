import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  activateMilestone,
  assignSprintTasks,
  createMilestone,
  fundMilestone,
  createMilestoneDeliverable,
  createProjectSprint,
  readMilestoneWorkspace,
  readProgramGates,
  readProjectTimeline,
  updateMilestone,
  updateMilestoneDeliverable,
  updateProjectSprint,
} from '../services/milestoneWorkspaceService'

const EMPTY = []

export function useMilestoneWorkspace(projectId, { enabled = true } = {}) {
  const [workspace, setWorkspace] = useState({ milestones: EMPTY, deliverables: EMPTY, sprints: EMPTY })
  const [timeline, setTimeline] = useState({ milestones: EMPTY, deliverables: EMPTY, sprints: EMPTY })
  const [programGates, setProgramGates] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')

  const applyResponse = useCallback(([next, nextTimeline, gates]) => {
    setWorkspace({
      milestones: next?.milestones || EMPTY,
      deliverables: next?.deliverables || EMPTY,
      sprints: next?.sprints || EMPTY,
    })
    setTimeline({
      milestones: nextTimeline?.milestones || EMPTY,
      deliverables: nextTimeline?.deliverables || EMPTY,
      sprints: nextTimeline?.sprints || EMPTY,
    })
    setProgramGates(gates || null)
    setError('')
  }, [])

  const fetchAll = useCallback(() => Promise.all([
    readMilestoneWorkspace(projectId),
    readProjectTimeline(projectId),
    readProgramGates(projectId),
  ]), [projectId])

  const refresh = useCallback(async () => {
    if (!projectId || !enabled) return
    try {
      applyResponse(await fetchAll())
    } catch (requestError) {
      setError(requestError?.message || 'Could not load the milestone workspace.')
    }
  }, [applyResponse, enabled, fetchAll, projectId])

  useEffect(() => {
    if (!projectId || !enabled) return undefined

    let isCurrent = true
    fetchAll()
      .then((results) => { if (isCurrent) applyResponse(results) })
      .catch((requestError) => {
        if (isCurrent) setError(requestError?.message || 'Could not load the milestone workspace.')
      })
      .then(() => { if (isCurrent) setIsLoading(false) })

    return () => { isCurrent = false }
  }, [applyResponse, enabled, fetchAll, projectId])

  // Milestones, deliverables and sprints all move together: a new sprint changes
  // the timeline, and scheduling a task changes the gates. One reload keeps them
  // from disagreeing.
  const run = useCallback(async (key, action) => {
    setPending(key)
    try {
      const result = await action()
      await refresh()
      setError('')
      return result ?? true
    } catch (requestError) {
      setError(requestError?.message || 'That change could not be saved.')
      return null
    } finally {
      setPending('')
    }
  }, [refresh])

  const deliverablesByMilestone = useMemo(() => {
    const grouped = new Map()
    for (const deliverable of workspace.deliverables) {
      if (!grouped.has(deliverable.milestoneId)) grouped.set(deliverable.milestoneId, [])
      grouped.get(deliverable.milestoneId).push(deliverable)
    }
    return grouped
  }, [workspace.deliverables])

  // Flat list with the milestone name attached, for pickers that need to show
  // which milestone a deliverable belongs to.
  const deliverablesWithMilestone = useMemo(() => {
    const titleById = new Map(workspace.milestones.map((milestone) => [milestone.id, milestone.title]))
    return workspace.deliverables.map((deliverable) => ({
      ...deliverable,
      milestoneTitle: titleById.get(deliverable.milestoneId) || '',
    }))
  }, [workspace.deliverables, workspace.milestones])

  return {
    deliverablesByMilestone,
    deliverablesWithMilestone,
    error,
    isLoading,
    pending,
    programGates,
    refresh,
    timeline,
    ...workspace,
    onCreateDeliverable: (payload) => run('deliverable', () => createMilestoneDeliverable(projectId, payload)),
    onUpdateDeliverable: (id, patch) => run(id, () => updateMilestoneDeliverable(id, patch)),
    onUpdateMilestone: (id, patch) => run(id, () => updateMilestone(id, patch)),
    onCreateMilestone: (payload) => run('milestone', () => createMilestone(projectId, payload)),
    onFundMilestone: (id) => run(id, () => fundMilestone(id)),
    onActivateMilestone: (id) => run(id, () => activateMilestone(id)),
    onCreateSprint: (payload) => run('sprint', () => createProjectSprint(projectId, payload)),
    onUpdateSprint: (id, patch) => run(id, () => updateProjectSprint(id, patch)),
    onAssignTasks: (sprintId, taskIds) => run('assign', () => assignSprintTasks(projectId, sprintId, taskIds)),
  }
}

export default useMilestoneWorkspace
