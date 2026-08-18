import { FiActivity, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'

function toTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

function latestRecord(activityData) {
  const records = [
    ...(activityData.tasks || []).map((item) => ({ title: item.title, at: item.updatedAt || item.declaredAt })),
    ...(activityData.sprints || []).map((item) => ({ title: item.name, at: item.updatedAt || item.createdAt })),
    ...(activityData.deliverables || []).map((item) => ({ title: item.title, at: item.updatedAt || item.createdAt })),
    ...(activityData.dependencies || []).map((item) => ({ title: item.label, at: item.resolvedAt || item.createdAt })),
    ...(activityData.notes || []).map((item) => ({ title: 'Deliverable note', at: item.createdAt })),
  ]
  return records.sort((left, right) => toTimestamp(right.at) - toTimestamp(left.at))[0] || null
}

function formatRecordTime(value) {
  const timestamp = toTimestamp(value)
  if (!timestamp) return 'No events recorded'
  return new Date(timestamp).toLocaleString('en-KE', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  })
}

function TeamActivityLogsRail({ activityData = {} }) {
  const tasks = activityData.tasks || []
  const dependencies = activityData.dependencies || []
  const openBlockers = tasks.filter((task) => task.status === 'blocked').length
    + dependencies.filter((item) => item.status !== 'resolved').length
  const totalRecords = tasks.length
    + (activityData.sprints || []).length
    + (activityData.milestones || []).length
    + (activityData.deliverables || []).length
    + dependencies.length
    + (activityData.notes || []).length
    + (activityData.members || []).length
    + (activityData.invites || []).length
    + (activityData.project?.activity || []).length
  const latest = latestRecord(activityData)

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Activity log details">
      <section className="campus-rail-card team-rail-card team-activity-summary-card">
        <h3>Activity Summary</h3>
        <dl>
          <div><dt>Project records</dt><dd>{totalRecords}</dd></div>
          <div><dt>Tasks</dt><dd>{tasks.length}</dd></div>
          <div><dt>Sprints</dt><dd>{(activityData.sprints || []).length}</dd></div>
          <div><dt>Open blockers</dt><dd>{openBlockers}</dd></div>
        </dl>
      </section>

      <section className="campus-rail-card team-rail-card team-activity-health-card">
        <h3>Project record</h3>
        <ul className="team-activity-record-list">
          <li><FiCheckCircle aria-hidden="true" /> Live workspace data</li>
          <li><FiClock aria-hidden="true" /> {formatRecordTime(latest?.at)}</li>
          <li><FiAlertCircle aria-hidden="true" /> {openBlockers} open blocker{openBlockers === 1 ? '' : 's'}</li>
        </ul>
      </section>

      <section className="campus-rail-card team-rail-card team-recent-activity-card">
        <header><h3>Latest record</h3></header>
        {latest ? (
          <article>
            <span><FiActivity aria-hidden="true" /></span>
            <strong>{latest.title}</strong>
            <em>{formatRecordTime(latest.at)}</em>
          </article>
        ) : <p className="project-empty-note">No project events yet.</p>}
      </section>
    </aside>
  )
}

export default TeamActivityLogsRail
