import { useMemo, useState } from 'react'
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiDollarSign,
  FiEdit3,
  FiFileText,
  FiFlag,
  FiMessageCircle,
  FiSearch,
  FiUploadCloud,
  FiUsers,
} from 'react-icons/fi'

const ACTIVITY_ICONS = {
  approved: FiCheckCircle,
  changes: FiEdit3,
  dependency: FiAlertCircle,
  deliverable: FiFileText,
  milestone: FiFlag,
  note: FiMessageCircle,
  payment: FiDollarSign,
  project: FiFlag,
  sprint: FiActivity,
  submitted: FiUploadCloud,
  task: FiCheckCircle,
  team: FiUsers,
}

const FILTERS = [
  { id: 'all', label: 'All activity' },
  { id: 'task', label: 'Tasks' },
  { id: 'sprint', label: 'Sprints' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'submitted', label: 'Submissions' },
  { id: 'team', label: 'Team' },
]

function validDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatActivityTime(value) {
  const date = validDate(value)
  if (!date) return 'Date unavailable'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDifference = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000)
  const time = date.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
  if (dayDifference === 0) return `Today, ${time}`
  if (dayDifference === 1) return `Yesterday, ${time}`
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`
}

function taskTargetName(task, deliverableById) {
  const targetId = task.targetId || task.milestoneDeliverableId || task.scopeItemId
  return deliverableById.get(targetId)?.title || 'Project work'
}

function pushEvent(events, event) {
  const at = validDate(event.at)
  if (!at) return
  events.push({ ...event, at: at.toISOString(), timeLabel: formatActivityTime(at) })
}

function buildProjectActivityEvents({
  dependencies = [],
  deliverables = [],
  invites = [],
  members = [],
  milestones = [],
  notes = [],
  project,
  sprints = [],
  tasks = [],
} = {}) {
  const events = []
  const deliverableById = new Map(deliverables.map((item) => [item.id, item]))
  const sprintById = new Map(sprints.map((item) => [item.id, item]))
  const memberByStudentId = new Map(members.map((member) => [member.studentId, member]))

  ;(Array.isArray(project?.activity) ? project.activity : []).forEach((event) => {
    pushEvent(events, {
      id: `project-${event.id}`,
      kind: ['awarded'].includes(event.kind) ? 'project' : event.kind,
      title: event.title,
      detail: event.detail,
      actor: event.kind === 'payment' ? 'Zumbarl payments' : 'Project',
      at: event.at,
    })
  })

  tasks.forEach((task) => {
    const declaredBy = memberByStudentId.get(task.declaredById)
    const ownerName = task.owner?.name || 'Unassigned'
    const target = taskTargetName(task, deliverableById)
    pushEvent(events, {
      id: `task-declared-${task.id}`,
      kind: 'task',
      title: `Task declared: ${task.title}`,
      detail: `${task.weight || 1} ${(task.weight || 1) === 1 ? 'point' : 'points'} under ${target}.`,
      actor: declaredBy?.name || task.owner?.name || 'Team member',
      at: task.declaredAt,
    })
    if (task.claimedAt && task.owner) {
      pushEvent(events, {
        id: `task-claimed-${task.id}`,
        kind: 'team',
        title: `Task claimed: ${task.title}`,
        detail: `${ownerName} took ownership of this task.`,
        actor: ownerName,
        at: task.claimedAt,
      })
    }
    if (task.sprintId) {
      const sprint = sprintById.get(task.sprintId)
      pushEvent(events, {
        id: `task-scheduled-${task.id}`,
        kind: 'sprint',
        title: `Task scheduled: ${task.title}`,
        detail: `Added to ${sprint?.name || 'a project sprint'}.`,
        actor: 'Project team',
        at: task.updatedAt,
      })
    }
    if (task.blockedAt || task.status === 'blocked') {
      pushEvent(events, {
        id: `task-blocked-${task.id}`,
        kind: 'dependency',
        title: `Task blocked: ${task.title}`,
        detail: task.blockedBy?.length
          ? `Waiting on ${task.blockedBy.map((item) => item.title).join(', ')}.`
          : 'This task is currently blocked.',
        actor: ownerName,
        at: task.blockedAt || task.updatedAt,
      })
    }
    if (task.status === 'submitted') {
      pushEvent(events, {
        id: `task-submitted-${task.id}`,
        kind: 'submitted',
        title: `Task submitted: ${task.title}`,
        detail: `Submitted for business review under ${target}.`,
        actor: ownerName,
        at: task.updatedAt,
      })
    }
    if (task.doneAt || task.status === 'done') {
      pushEvent(events, {
        id: `task-done-${task.id}`,
        kind: 'task',
        title: `Task completed: ${task.title}`,
        detail: `Approved and completed under ${target}.`,
        actor: ownerName,
        at: task.doneAt || task.updatedAt,
      })
    }
  })

  sprints.forEach((sprint) => {
    pushEvent(events, {
      id: `sprint-created-${sprint.id}`,
      kind: 'sprint',
      title: `Sprint planned: ${sprint.name}`,
      detail: sprint.goal || 'A new project sprint was created.',
      actor: 'Project team',
      at: sprint.createdAt,
    })
    if (sprint.status === 'active') {
      pushEvent(events, {
        id: `sprint-active-${sprint.id}`,
        kind: 'sprint',
        title: `Sprint started: ${sprint.name}`,
        detail: 'This is now the active sprint.',
        actor: 'Project team',
        at: sprint.updatedAt,
      })
    } else if (sprint.status === 'completed') {
      pushEvent(events, {
        id: `sprint-completed-${sprint.id}`,
        kind: 'sprint',
        title: `Sprint completed: ${sprint.name}`,
        detail: 'The sprint was marked complete.',
        actor: 'Project team',
        at: sprint.updatedAt,
      })
    }
  })

  milestones.forEach((milestone) => {
    if (!milestone.activatedAt) return
    pushEvent(events, {
      id: `milestone-active-${milestone.id}`,
      kind: 'milestone',
      title: `Milestone activated: ${milestone.title}`,
      detail: `${milestone.fundingStatus === 'funded' ? 'Funded and opened' : 'Opened'} for project work.`,
      actor: project?.client?.name || project?.owner?.name || 'Business',
      at: milestone.activatedAt,
    })
  })

  deliverables.forEach((deliverable) => {
    pushEvent(events, {
      id: `deliverable-created-${deliverable.id}`,
      kind: 'deliverable',
      title: `Deliverable added: ${deliverable.title}`,
      detail: deliverable.description || 'Added to the project scope.',
      actor: project?.client?.name || project?.owner?.name || 'Business',
      at: deliverable.createdAt,
    })
  })

  dependencies.forEach((dependency) => {
    pushEvent(events, {
      id: `dependency-created-${dependency.id}`,
      kind: 'dependency',
      title: `Dependency raised: ${dependency.label}`,
      detail: dependency.note || `Waiting on ${dependency.party || 'an external party'}.`,
      actor: dependency.raisedByName || 'Team member',
      at: dependency.createdAt,
    })
    if (dependency.resolvedAt) {
      pushEvent(events, {
        id: `dependency-resolved-${dependency.id}`,
        kind: 'dependency',
        title: `Dependency resolved: ${dependency.label}`,
        detail: 'Work waiting on this dependency can continue.',
        actor: 'Project team',
        at: dependency.resolvedAt,
      })
    }
  })

  notes.forEach((note) => {
    pushEvent(events, {
      id: `note-${note.id}`,
      kind: 'note',
      title: note.kind === 'file' ? 'Working file shared' : 'Deliverable note added',
      detail: note.body,
      actor: note.authorName || 'Team member',
      at: note.createdAt,
    })
  })

  members.forEach((member) => {
    pushEvent(events, {
      id: `member-${member.id}`,
      kind: 'team',
      title: `${member.name} joined the project`,
      detail: `Joined as ${member.role || 'Contributor'}.`,
      actor: member.name,
      at: member.joinedAt,
    })
  })

  invites.forEach((invite) => {
    pushEvent(events, {
      id: `invite-${invite.id}`,
      kind: 'team',
      title: `Project invitation ${invite.status || 'sent'}`,
      detail: `${invite.inviteeName || invite.name || invite.email || 'A contributor'} was invited as ${invite.role || 'Contributor'}.`,
      actor: invite.inviterName || project?.client?.name || 'Business',
      at: invite.respondedAt || invite.sentAt || invite.createdAt,
    })
  })

  return events.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
}

function ActivityLogPanel(props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const activity = useMemo(() => buildProjectActivityEvents(props), [props])
  const visibleActivity = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return activity.filter((event) => (
      (filter === 'all' || event.kind === filter)
      && (!normalizedQuery || `${event.actor} ${event.title} ${event.detail}`.toLowerCase().includes(normalizedQuery))
    ))
  }, [activity, filter, query])

  return (
    <section className="team-activity-logs-panel" aria-label="Activity log">
      <section className="project-card team-activity-log-table">
        <header>
          <div>
            <h2>Activity Logs <span>{activity.length}</span></h2>
            <p>Project events recorded from the current workspace data.</p>
          </div>
          <label className="project-activity-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Search activity"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </header>

        <div className="team-activity-filter-row" aria-label="Activity filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'is-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visibleActivity.length ? (
          <div className="team-activity-log-list">
            {visibleActivity.map((event) => {
              const Icon = ACTIVITY_ICONS[event.kind] || FiActivity
              return (
                <article key={event.id} className={`team-activity-log-row is-${event.kind}`}>
                  <span className="team-activity-log-icon" aria-hidden="true"><Icon /></span>
                  <div className="team-activity-log-copy">
                    <h3>{event.title}</h3>
                    <p>{event.detail}</p>
                    <span>{event.actor} · <time dateTime={event.at}>{event.timeLabel}</time></span>
                  </div>
                  <b>{event.kind === 'submitted' ? 'Submission' : event.kind}</b>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="project-activity-empty">
            <FiActivity aria-hidden="true" />
            <strong>{activity.length ? 'No matching activity' : 'No project activity yet'}</strong>
            <p>{activity.length ? 'Try another search or filter.' : 'Real project events will appear here as work progresses.'}</p>
          </div>
        )}
      </section>
    </section>
  )
}

export default ActivityLogPanel
