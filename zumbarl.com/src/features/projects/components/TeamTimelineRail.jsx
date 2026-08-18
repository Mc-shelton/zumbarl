import { FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi'

const COMPLETE_STATUSES = new Set(['approved', 'completed', 'complete', 'done', 'released'])
const ACTIVE_STATUSES = new Set(['active', 'in progress', 'in_progress', 'started', 'submitted', 'in review'])
const CURRENT_TIME = Date.now()

function toTime(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function formatDate(value) {
  const time = typeof value === 'number' ? value : toTime(value)
  if (time === null) return 'Not scheduled'
  return new Date(time).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TeamTimelineRail({ timeline = {} }) {
  const items = ['milestones', 'sprints', 'deliverables'].flatMap((type) => (
    (timeline[type] || []).map((item) => ({ ...item, type }))
  ))
  const completeCount = items.filter((item) => COMPLETE_STATUSES.has(String(item.status || '').toLowerCase())).length
  const activeCount = items.filter((item) => ACTIVE_STATUSES.has(String(item.status || '').toLowerCase())).length
  const undatedCount = items.filter((item) => !toTime(item.startsAt) && !toTime(item.endsAt)).length
  const progress = items.length ? Math.round((completeCount / items.length) * 100) : 0
  const now = CURRENT_TIME
  const nextItem = items
    .map((item) => ({ ...item, targetTime: toTime(item.endsAt) ?? toTime(item.startsAt) }))
    .filter((item) => item.targetTime !== null && item.targetTime >= now)
    .sort((left, right) => left.targetTime - right.targetTime)[0] || null

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Timeline details">
      <section className="campus-rail-card team-rail-card timeline-rail-next">
        <header><FiCalendar aria-hidden="true" /><h3>Next on the timeline</h3></header>
        {nextItem ? (
          <>
            <strong>{nextItem.title}</strong>
            <p>{formatDate(nextItem.targetTime)}</p>
            <span>{nextItem.type.replace(/s$/, '')}</span>
          </>
        ) : <p>No upcoming dated work.</p>}
      </section>

      <section className="campus-rail-card team-rail-card timeline-rail-health">
        <header><FiCheckCircle aria-hidden="true" /><h3>Schedule health</h3></header>
        <div className="timeline-rail-progress"><i style={{ width: `${progress}%` }} /></div>
        <strong>{progress}% complete</strong>
        <div className="timeline-rail-metrics">
          <span><b>{completeCount}</b>Completed</span>
          <span><b>{activeCount}</b>In progress</span>
          <span><b>{undatedCount}</b>Need dates</span>
        </div>
      </section>

      <section className="campus-rail-card team-rail-card timeline-rail-legend">
        <header><FiClock aria-hidden="true" /><h3>Timeline key</h3></header>
        <p><i className="is-milestone" />Milestone</p>
        <p><i className="is-sprint" />Sprint</p>
        <p><i className="is-deliverable" />Deliverable</p>
        <p><i className="is-today" />Today</p>
      </section>
    </aside>
  )
}

export default TeamTimelineRail
