import { FiMoreVertical } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { BusinessMarketingThumbnail } from './BusinessMarketingThumbnail'

function getStatusTone(status) {
  if (status === 'Active') return 'green'
  if (status === 'Scheduled') return 'blue'
  if (status === 'Completed') return 'neutral'
  if (status === 'Draft') return 'purple'

  return 'orange'
}

function CampaignCreators({ campaign }) {
  return (
    <div className="business-marketing-creators" aria-label={`${campaign.title} creators`}>
      {campaign.creators.map((creator) => (
        <span key={creator}>{creator}</span>
      ))}
      {campaign.creatorOverflow > 0 ? <em>+{campaign.creatorOverflow}</em> : null}
    </div>
  )
}

export function BusinessMarketingCampaignList({ campaigns, viewMode }) {
  if (!campaigns.length) {
    return (
      <section className="business-marketing-empty" aria-live="polite">
        <h2>No campaigns found</h2>
        <p>Adjust your filters or start a new campaign brief for student creators.</p>
      </section>
    )
  }

  return (
    <section className={`business-marketing-campaigns is-${viewMode}`} aria-label="Marketing campaigns">
      {campaigns.map((campaign) => (
        <article key={campaign.id} className="business-marketing-campaign">
          <Link
            to={`/business/marketing/${campaign.id}`}
            className="business-marketing-campaign-link"
            aria-label={`Open ${campaign.title} campaign`}
          />
          <BusinessMarketingThumbnail campaign={campaign} />

          <div className="business-marketing-campaign-main">
            <h2>{campaign.title}</h2>
            <p className="business-marketing-type">{campaign.type}</p>
            <p className="business-marketing-description">{campaign.description}</p>
            <ul className="business-marketing-tags" aria-label={`${campaign.title} platforms`}>
              <li className={`tone-${getStatusTone(campaign.status)}`}>{campaign.status}</li>
              {campaign.platforms.map((platform) => (
                <li key={platform}>{platform}</li>
              ))}
            </ul>
          </div>

          <dl className="business-marketing-stats">
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
          </dl>

          <aside className="business-marketing-campaign-meta">
            <div>
              <span>Creators</span>
              <CampaignCreators campaign={campaign} />
            </div>
            <div>
              <span>{campaign.timelineLabel}</span>
              <strong>{campaign.timelineValue}</strong>
            </div>
          </aside>

          <button type="button" className="business-marketing-menu" aria-label={`Open ${campaign.title} actions`}>
            <FiMoreVertical aria-hidden="true" />
          </button>
        </article>
      ))}
    </section>
  )
}
