import { FiMessageCircle, FiMoreHorizontal } from 'react-icons/fi'

function TeamReviewsPanel() {
  const reviews = [
    {
      title: 'Content Review - Milestone 1',
      detail: 'Review and approve content across platforms',
      reviewer: 'Mercy Wanjiku',
      role: 'Project Owner',
      type: 'Milestone Review',
      typeTone: 'purple',
      date: 'May 20, 2024',
      rating: '★★★★★',
      status: 'Approved',
      statusTone: 'approved',
    },
    {
      title: 'Design Review - Milestone 2',
      detail: 'Review visuals and branding assets',
      reviewer: 'Brian Mwangi',
      role: 'Designer',
      type: 'Milestone Review',
      typeTone: 'purple',
      date: 'May 12, 2024',
      rating: '★★★★☆',
      status: 'Approved',
      statusTone: 'approved',
    },
    {
      title: 'Content Draft Review',
      detail: 'Initial draft review and feedback',
      reviewer: "Lydia Achieng'",
      role: 'Social Media Manager',
      type: 'Work Review',
      typeTone: 'blue',
      date: 'May 8, 2024',
      rating: '★★★★☆',
      status: 'Changes Requested',
      statusTone: 'changes',
    },
    {
      title: 'Strategy Review',
      detail: 'Content strategy and plan validation',
      reviewer: 'Shadrach Otieno',
      role: 'Content Writer',
      type: 'Phase Review',
      typeTone: 'gold',
      date: 'May 5, 2024',
      rating: '★★★★★',
      status: 'Approved',
      statusTone: 'approved',
    },
    {
      title: 'Campaign Review - Ad Creative',
      detail: 'Review ad creatives and copy',
      reviewer: 'Grace Njori',
      role: 'Data Analyst',
      type: 'Work Review',
      typeTone: 'blue',
      date: 'Apr 30, 2024',
      rating: '★★★★☆',
      status: 'Changes Requested',
      statusTone: 'changes',
    },
    {
      title: 'Final Review',
      detail: 'Final delivery and overall evaluation',
      reviewer: 'Kevin Mutua',
      role: 'Video Editor',
      type: 'Final Review',
      typeTone: 'green',
      date: 'May 27, 2024',
      rating: '★★★★★',
      status: 'Pending',
      statusTone: 'pending',
    },
  ]

  return (
    <section className="team-reviews-panel">
      <div className="team-tab-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search reviews..." />
        </label>
        <button type="button" className="project-soft-btn">Filter by: All Reviews</button>
      </div>
      <section className="project-card team-review-table">
        <h2>Reviews (6)</h2>
        <div className="team-review-row is-head">
          <span />
          <span>Review</span><span>Reviewer</span><span>Review Type</span><span>Date</span><span>Rating</span><span>Status</span><span>Actions</span>
        </div>
        {reviews.map((review, index) => (
          <div key={review.title} className="team-review-row">
            <span className={`team-review-icon is-${review.typeTone}`}>{index + 1}</span>
            <span className="team-review-title">
              <strong>{review.title}</strong>
              <em>{review.detail}</em>
            </span>
            <span className="team-reviewer-cell">
              <img src="/assets/index/bee_nobg.png" alt="" />
              <strong>{review.reviewer}</strong>
              <em>{review.role}</em>
            </span>
            <span className={`team-review-type is-${review.typeTone}`}>{review.type}</span>
            <span className="team-review-date">{review.date}</span>
            <span className="team-review-stars">{review.rating}</span>
            <span className={`team-review-status is-${review.statusTone}`}>{review.status}</span>
            <button type="button" aria-label={`More actions for ${review.title}`}>
              <FiMoreHorizontal aria-hidden="true" />
            </button>
          </div>
        ))}
        <footer className="team-review-footer">
          <span>Showing 1 to 6 of 6 reviews</span>
          <div>
            <button type="button">‹</button>
            <button type="button" className="is-active">1</button>
            <button type="button">›</button>
            <button type="button">10 / page</button>
          </div>
        </footer>
      </section>
    </section>
  )
}

export default TeamReviewsPanel
