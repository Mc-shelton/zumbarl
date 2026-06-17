import { FiMoreHorizontal, FiPause, FiPlay } from 'react-icons/fi'
import { BusinessMarketingThumbnail } from './BusinessMarketingThumbnail'

function statusTone(status) {
  if (status === 'Paused') return 'orange'
  if (status === 'Active') return 'green'
  if (status === 'Scheduled') return 'blue'
  if (status === 'Completed') return 'neutral'

  return 'purple'
}

export function BusinessMarketingCampaignHero({ campaign, isPaused, onTogglePause }) {
  return (
    <section className="business-profile-card business-marketing-detail-hero">
      <BusinessMarketingThumbnail campaign={campaign} className="is-large" />

      <div className="business-marketing-detail-hero-main">
        <strong className={`business-marketing-status tone-${statusTone(campaign.status)}`}>{campaign.status}</strong>
        <h1>{campaign.title}</h1>
        <p className="business-marketing-detail-type">{campaign.type} <span aria-hidden="true">•</span> {campaign.detail.category}</p>
        <p className="business-marketing-detail-description">{campaign.description}</p>
        <ul className="business-marketing-tags" aria-label={`${campaign.title} platforms`}>
          {campaign.platforms.map((platform) => (
            <li key={platform}>{platform}</li>
          ))}
          <li>+1 more</li>
        </ul>
        <dl className="business-marketing-detail-stats">
          <div>
            <dt>Reach</dt>
            <dd>{campaign.reach}</dd>
          </div>
          <div>
            <dt>Engagement</dt>
            <dd>{campaign.engagement}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{campaign.budget}</dd>
          </div>
          <div>
            <dt>{campaign.timelineLabel}</dt>
            <dd>{campaign.timelineValue}</dd>
          </div>
        </dl>
      </div>

      <div className="business-marketing-detail-actions">
        <button type="button" className="business-profile-ghost-btn">Edit Campaign</button>
        <button type="button" className="business-profile-primary-btn" onClick={onTogglePause}>
          {isPaused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
          {isPaused ? 'Resume Campaign' : 'Pause Campaign'}
        </button>
        <button type="button" className="business-profile-icon-btn" aria-label="More campaign actions">
          <FiMoreHorizontal aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
