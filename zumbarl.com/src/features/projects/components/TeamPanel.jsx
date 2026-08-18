import { useMemo, useState } from 'react'
import { FiPlus, FiSearch } from 'react-icons/fi'

const COUNTED_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'submitted', 'done']

// Must match the payout engine exactly (shared/projects/deliverableWorkload.ts):
// only approved work that has evidence attached earns a share. Counting every
// `done` task here instead told students a share the payout would not honour.
function earnsShare(task) {
  const evidence = task.evidence
  const hasEvidence = Array.isArray(evidence)
    ? evidence.length > 0
    : Boolean(evidence && typeof evidence === 'object' && Object.keys(evidence).length > 0)
  return task.status === 'done' && hasEvidence
}

// Every column here is derived from a real record: membership from the project
// team, task counts and share from the declared tasks. Nothing is estimated, so
// a dash means the work has not happened yet rather than that a number is missing.
function buildTaskStats(tasks) {
  const statsByStudentId = new Map()
  let totalDoneWeight = 0

  for (const task of tasks) {
    if (!task.ownerId || !COUNTED_TASK_STATUSES.includes(task.status)) continue

    const stats = statsByStudentId.get(task.ownerId) || { tasks: 0, inReview: 0, blocked: 0, doneWeight: 0 }
    stats.tasks += 1
    if (task.status === 'submitted') stats.inReview += 1
    if (task.status === 'blocked' || task.blockedBy?.length) stats.blocked += 1
    if (earnsShare(task)) {
      stats.doneWeight += Number(task.weight) || 0
      totalDoneWeight += Number(task.weight) || 0
    }
    statsByStudentId.set(task.ownerId, stats)
  }

  return { statsByStudentId, totalDoneWeight }
}

function TeamPanel({ invites = [], members = [], onInviteMembers, tasks = [], viewerStudentId = '' }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { statsByStudentId, totalDoneWeight } = useMemo(() => buildTaskStats(tasks), [tasks])

  // You first: your own row is the one you check, and it anchors the comparison
  // with everyone else's share.
  const rows = useMemo(() => ([
    ...members.map((member) => {
      const stats = statsByStudentId.get(member.studentId) || { tasks: 0, inReview: 0, blocked: 0, doneWeight: 0 }
      return {
        ...member,
        ...stats,
        key: member.userId || member.id || member.name,
        isViewer: Boolean(viewerStudentId) && member.studentId === viewerStudentId,
        sharePercent: totalDoneWeight ? Math.round((stats.doneWeight / totalDoneWeight) * 1000) / 10 : 0,
        status: member.status === 'active' ? 'Active' : member.status,
      }
    }).sort((left, right) => Number(right.isViewer) - Number(left.isViewer)),
    ...invites.map((invite) => ({
      ...invite,
      key: invite.id || invite.userId || invite.name,
      tasks: 0,
      inReview: 0,
      blocked: 0,
      sharePercent: 0,
      status: 'Invited',
    })),
  ]), [invites, members, statsByStudentId, totalDoneWeight, viewerStudentId])

  const roles = useMemo(() => (
    [...new Set(rows.map((row) => row.role).filter(Boolean))]
  ), [rows])

  const normalizedQuery = query.trim().toLowerCase()
  const visibleRows = rows.filter((row) => (
    (roleFilter === 'all' || row.role === roleFilter)
    && (!normalizedQuery || `${row.name} ${row.role || ''} ${row.school || ''}`.toLowerCase().includes(normalizedQuery))
  ))

  return (
    <section className="team-members-panel">
      <div className="team-tab-tools">
        <label>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search team members..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          className="project-soft-btn"
          value={roleFilter}
          aria-label="Filter team members by role"
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        {onInviteMembers ? (
          <button type="button" className="project-primary-btn" onClick={onInviteMembers}>
            <FiPlus aria-hidden="true" />
            Invite Members
          </button>
        ) : null}
      </div>

      <section className="project-card team-members-table">
        <div className="team-member-row is-head">
          <span>Member</span>
          <span>Role</span>
          <span>Tasks</span>
          <span>In review</span>
          <span>Blocked</span>
          <span>Approved share</span>
          <span>Status</span>
        </div>

        {visibleRows.map((member) => (
          <div key={member.key} className={`team-member-row${member.isViewer ? ' is-viewer' : ''}`}>
            <span>
              <img src={member.avatar || '/assets/index/bee_nobg.png'} alt="" />
              <strong>
                {member.name}
                {member.isViewer ? <span className="team-member-you">You</span> : null}
              </strong>
              {member.school ? <em>{member.school}</em> : null}
            </span>
            <span>{member.role || '—'}</span>
            <span>{member.tasks || '—'}</span>
            <span>{member.inReview || '—'}</span>
            <span className={member.blocked ? 'is-blocked' : ''}>{member.blocked || '—'}</span>
            <span>
              {member.sharePercent ? `${member.sharePercent}%` : '—'}
              {member.sharePercent ? <i style={{ '--progress': `${member.sharePercent}%` }}><b /></i> : null}
            </span>
            <span className={`team-member-status is-${String(member.status).toLowerCase().replace(/\s+/g, '-')}`}>
              {member.status}
            </span>
          </div>
        ))}

        {visibleRows.length === 0 ? (
          <p className="team-members-empty">
            {rows.length ? 'No team members match that search.' : 'No one has joined this project team yet.'}
          </p>
        ) : null}
      </section>
    </section>
  )
}

export default TeamPanel
