import { FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi'

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function TeamReviewsRail({ submissions = [] }) {
  const current = submissions.filter((item) => item.status !== 'superseded')
  const awaiting = current.filter((item) => item.status === 'submitted').length
  const approved = current.filter((item) => item.status === 'approved').length
  const changes = current.filter((item) => item.status === 'changes_requested').length
  const decided = approved + changes
  const decisionProgress = current.length ? Math.round((decided / current.length) * 100) : 0
  const recent = current
    .filter((item) => ['approved', 'changes_requested'].includes(item.status))
    .sort((left, right) => new Date(right.reviewedAt || 0) - new Date(left.reviewedAt || 0))
    .slice(0, 3)

  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Review details">
      <section className="campus-rail-card team-rail-card project-review-rail-summary">
        <h3>Review summary</h3>
        <div className="project-review-rail-progress"><i style={{ width: `${decisionProgress}%` }} /></div>
        <strong>{decisionProgress}% reviewed</strong>
        <div>
          <span><FiClock aria-hidden="true" /><b>{awaiting}</b><small>Awaiting</small></span>
          <span><FiCheckCircle aria-hidden="true" /><b>{approved}</b><small>Approved</small></span>
          <span><FiRefreshCw aria-hidden="true" /><b>{changes}</b><small>Changes</small></span>
        </div>
      </section>

      <section className="campus-rail-card team-rail-card project-review-rail-recent">
        <h3>Recent decisions</h3>
        {recent.length ? recent.map((submission) => (
          <article key={submission.id}>
            <span className={submission.status === 'approved' ? 'is-approved' : 'is-changes'} />
            <div><strong>{submission.title}</strong><small>{formatDate(submission.reviewedAt)}</small></div>
          </article>
        )) : <p>No review decisions yet.</p>}
      </section>

      <section className="campus-rail-card team-rail-card project-review-rail-guide">
        <h3>How reviews work</h3>
        <ol>
          <li><span>1</span>Students submit evidence for one or more tasks.</li>
          <li><span>2</span>The business approves it or requests clear changes.</li>
          <li><span>3</span>Approved tasks move to Done and count toward earnings.</li>
        </ol>
      </section>
    </aside>
  )
}

export default TeamReviewsRail
