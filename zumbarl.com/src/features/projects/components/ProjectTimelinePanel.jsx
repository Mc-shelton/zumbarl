import { FiCalendar, FiFlag, FiLayers, FiZap } from 'react-icons/fi'

const DAY = 24 * 60 * 60 * 1000
const CURRENT_TIME = Date.now()
const TRACKS = [
  { id: 'milestones', label: 'Milestones', icon: FiFlag },
  { id: 'sprints', label: 'Sprints', icon: FiZap },
  { id: 'deliverables', label: 'Deliverables', icon: FiLayers },
]

const COMPLETE_STATUSES = new Set(['approved', 'completed', 'complete', 'done', 'released'])
const ACTIVE_STATUSES = new Set(['active', 'in progress', 'in_progress', 'started', 'submitted', 'in review'])

function toTime(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function itemWindow(item) {
  const rawStart = toTime(item.startsAt)
  const rawEnd = toTime(item.endsAt)
  if (rawStart === null && rawEnd === null) return null
  const start = rawStart ?? rawEnd
  const end = rawEnd ?? rawStart
  return { start: Math.min(start, end), end: Math.max(start, end), isPoint: start === end }
}

function getBounds(timeline) {
  const windows = TRACKS.flatMap((track) => (timeline[track.id] || []).map(itemWindow).filter(Boolean))
  if (!windows.length) return null
  const earliest = Math.min(...windows.map((window) => window.start))
  const latest = Math.max(...windows.map((window) => window.end))
  const padding = Math.max(DAY / 2, (latest - earliest) * 0.025)
  return {
    min: earliest - padding,
    max: (latest === earliest ? latest + DAY : latest) + padding,
    actualMin: earliest,
    actualMax: latest,
  }
}

function formatDate(value, options = {}) {
  const time = typeof value === 'number' ? value : toTime(value)
  if (time === null) return 'Date not set'
  return new Date(time).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    ...options,
  })
}

function formatWindow(item) {
  const window = itemWindow(item)
  if (!window) return 'Dates not set'
  if (window.isPoint) return formatDate(window.start)
  return `${formatDate(window.start)} – ${formatDate(window.end)}`
}

function statusTone(status) {
  const normalized = String(status || 'planned').toLowerCase()
  if (COMPLETE_STATUSES.has(normalized)) return 'complete'
  if (ACTIVE_STATUSES.has(normalized)) return 'active'
  if (normalized === 'blocked' || normalized === 'dormant') return 'blocked'
  return 'planned'
}

function statusLabel(status) {
  const value = String(status || 'planned').replaceAll('_', ' ')
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function buildTicks(bounds) {
  const spanDays = Math.max(1, Math.ceil((bounds.max - bounds.min) / DAY))
  const stepDays = Math.max(1, Math.ceil(spanDays / 6))
  const ticks = []
  for (let time = bounds.min; time <= bounds.max; time += stepDays * DAY) ticks.push(time)
  if (ticks.at(-1) < bounds.max - DAY / 2) ticks.push(bounds.max)
  return ticks
}

function ProjectTimelinePanel({ timeline = {} }) {
  const bounds = getBounds(timeline)

  if (!bounds) {
    return (
      <section className="project-card project-timeline-empty">
        <FiCalendar aria-hidden="true" />
        <h3>Your project schedule will appear here</h3>
        <p>Add dates to a milestone, deliverable, or sprint to begin building the timeline.</p>
      </section>
    )
  }

  const span = bounds.max - bounds.min
  const ticks = buildTicks(bounds)
  const today = CURRENT_TIME
  const todayPosition = today >= bounds.min && today <= bounds.max
    ? ((today - bounds.min) / span) * 100
    : null
  const positionFor = (item) => {
    const window = itemWindow(item)
    if (!window) return null
    const left = ((window.start - bounds.min) / span) * 100
    const naturalWidth = ((window.end - window.start) / span) * 100
    const width = window.isPoint ? 1.2 : Math.max(1.8, naturalWidth)
    return {
      left: `${left}%`,
      width: `${Math.min(100 - left, width)}%`,
      isPoint: window.isPoint,
    }
  }
  const allItems = TRACKS.flatMap((track) => timeline[track.id] || [])
  const datedCount = allItems.filter(itemWindow).length

  return (
    <div className="project-timeline project-timeline-redesign">
      <header className="project-timeline-head project-timeline-overview">
        <div>
          <h3>Project timeline</h3>
          <p>One shared schedule for milestones, sprints, and deliverables.</p>
        </div>
        <div className="project-timeline-summary">
          <span><strong>{formatDate(bounds.actualMin)}</strong>Start</span>
          <i aria-hidden="true" />
          <span><strong>{formatDate(bounds.actualMax)}</strong>Finish</span>
          <em>{datedCount} of {allItems.length} dated</em>
        </div>
      </header>

      <section className="project-card project-timeline-board">
        <header className="project-timeline-axis-row">
          <div>
            <span>Work item</span>
            <small>Status and schedule</small>
          </div>
          <div className="project-timeline-axis">
            {ticks.map((tick, index) => (
              <time
                key={tick}
                dateTime={new Date(tick).toISOString()}
                style={{ left: `${(index / Math.max(1, ticks.length - 1)) * 100}%` }}
              >
                {formatDate(tick)}
              </time>
            ))}
          </div>
        </header>

        {TRACKS.map((track) => {
          const items = timeline[track.id] || []
          const TrackIcon = track.icon
          return (
            <section key={track.id} className={`project-timeline-group is-${track.id}`}>
              <header>
                <TrackIcon aria-hidden="true" />
                <strong>{track.label}</strong>
                <span>{items.length}</span>
              </header>
              {items.length ? items.map((item) => {
                const position = positionFor(item)
                const tone = statusTone(item.status)
                return (
                  <article key={item.id} className={!position ? 'is-undated' : ''}>
                    <div className="project-timeline-item-copy">
                      <strong title={item.title}>{item.title}</strong>
                      <p>
                        <span className={`project-timeline-status is-${tone}`}>{statusLabel(item.status)}</span>
                        <time>{formatWindow(item)}</time>
                        {track.id === 'sprints' && Number.isFinite(item.taskCount) ? (
                          <small>{item.doneCount || 0}/{item.taskCount} tasks done</small>
                        ) : null}
                      </p>
                    </div>
                    <div
                      className="project-timeline-canvas"
                      style={{ '--timeline-columns': Math.max(1, ticks.length - 1) }}
                    >
                      {todayPosition !== null ? (
                        <span className="project-timeline-today" style={{ left: `${todayPosition}%` }}>
                          <i />
                        </span>
                      ) : null}
                      {position ? (
                        <span
                          className={`project-timeline-period is-${track.id} is-${tone}${position.isPoint ? ' is-point' : ''}`}
                          style={{ left: position.left, width: position.width }}
                          title={`${item.title}: ${formatWindow(item)}`}
                        >
                          {!position.isPoint ? <b>{item.title}</b> : null}
                        </span>
                      ) : (
                        <span className="project-timeline-undated">Set dates to schedule</span>
                      )}
                    </div>
                  </article>
                )
              }) : (
                <p className="project-timeline-group-empty">No {track.label.toLowerCase()} yet.</p>
              )}
            </section>
          )
        })}
      </section>

      <footer className="project-timeline-footnote">
        <span><i className="is-milestones" /> Milestone</span>
        <span><i className="is-sprints" /> Sprint</span>
        <span><i className="is-deliverables" /> Deliverable</span>
        {todayPosition !== null ? <span><i className="is-today" /> Today</span> : null}
      </footer>
    </div>
  )
}

export default ProjectTimelinePanel
