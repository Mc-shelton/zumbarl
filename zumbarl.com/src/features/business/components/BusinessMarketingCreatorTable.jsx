import { FiFileText, FiMoreVertical, FiRadio } from 'react-icons/fi'

const PLATFORM_LABELS = {
  Instagram: 'IG',
  TikTok: 'TT',
  YouTube: 'YT',
}

export function BusinessMarketingCreatorTable({ campaign, compact = false }) {
  return (
    <section className="business-profile-card business-marketing-creator-table">
      <header>
        <h2>Top Creator Collaborations</h2>
      </header>
      <div className="business-marketing-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Creator</th>
              <th>Platform</th>
              <th>Followers</th>
              <th>Content Preview</th>
              <th>Status</th>
              <th>Unique Clicks</th>
              <th>Total Visits</th>
              <th>Engagement</th>
              <th>Amount</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {campaign.detail.creators.map((creator) => (
              <tr key={creator.handle}>
                <td>
                  <span className="business-marketing-creator-avatar">{creator.name.slice(0, 1)}</span>
                  <div>
                    <strong>{creator.name}</strong>
                    <em>{creator.handle}</em>
                  </div>
                </td>
                <td><span className={`business-marketing-platform-mark tone-${creator.tone}`}>{PLATFORM_LABELS[creator.platform] || creator.platform[0]}</span></td>
                <td>{creator.followers}</td>
                <td>
                  <span className="business-marketing-content-preview">
                    <FiFileText aria-hidden="true" />
                    {compact ? 'Preview' : campaign.thumbnailTitle}
                  </span>
                </td>
                <td><strong className={`business-marketing-collab-status is-${creator.status.toLowerCase()}`}>{creator.status}</strong></td>
                <td><strong className="business-marketing-click-count">{Number(creator.clicks || 0).toLocaleString()}</strong></td>
                <td>{Number(creator.visits || 0).toLocaleString()}</td>
                <td>{creator.engagement}</td>
                <td>{creator.amount}</td>
                <td>
                  <button type="button" className="business-marketing-menu" aria-label={`Open ${creator.name} actions`}>
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="business-marketing-find-creators">
        <span aria-hidden="true"><FiRadio /></span>
        <div>
          <strong>Want to reach more students?</strong>
          <p>Boost your campaign by collaborating with more top creators.</p>
        </div>
        <button type="button" className="business-profile-primary-btn">Find More Creators</button>
      </footer>
    </section>
  )
}
