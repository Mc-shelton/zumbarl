import { FiArrowRight } from 'react-icons/fi'

function TeamReviewsRail() {
  return (
    <aside className="campus-rail project-workspace-rail team-project-rail" aria-label="Review details">
      <section className="campus-rail-card team-rail-card team-review-summary-card">
        <h3>Review Summary</h3>
        <div className="team-review-donut">
          <strong>4.6</strong>
          <span>Average Rating</span>
        </div>
        <div className="team-review-breakdown">
          {[
            ['5 Stars', '66.7% (4)', 'gold'],
            ['4 Stars', '16.7% (1)', 'blue'],
            ['3 Stars', '0% (0)', 'purple'],
            ['2 Stars', '0% (0)', 'orange'],
            ['1 Star', '16.7% (1)', 'red'],
          ].map(([label, value, tone]) => (
            <p key={label}>
              <i className={`is-${tone}`} />
              <span>{label}</span>
              <strong>{value}</strong>
            </p>
          ))}
        </div>
        <dl className="team-review-stats">
          <div><dt>Total Reviews</dt><dd>6</dd></div>
          <div><dt>Approved</dt><dd>4</dd></div>
          <div><dt>Changes Requested</dt><dd>2</dd></div>
          <div><dt>Pending</dt><dd>1</dd></div>
        </dl>
      </section>
      <section className="campus-rail-card team-rail-card team-recent-reviews-card">
        <header>
          <h3>Recent Reviews</h3>
          <button type="button">View all</button>
        </header>
        {[
          ['Content Review - Milestone 1', 'May 20, 2024', 'Approved'],
          ['Design Review - Milestone 2', 'May 12, 2024', 'Approved'],
          ['Content Draft Review', 'May 8, 2024', 'Changes Requested'],
        ].map(([title, date, status]) => (
          <article key={title}>
            <span />
            <div>
              <strong>{title}</strong>
              <em>{date}</em>
            </div>
            <b className={status === 'Approved' ? 'is-approved' : 'is-changes'}>{status}</b>
          </article>
        ))}
        <button type="button" className="team-review-link">See all reviews <FiArrowRight aria-hidden="true" /></button>
      </section>
    </aside>
  )
}

export default TeamReviewsRail
