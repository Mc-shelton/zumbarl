import { useEffect, useState } from 'react'
import { OPPORTUNITY_TYPES } from '../constants'
import {
  getBusinessMarketingCampaigns,
  listBusinessMarketingCampaignsFromBackend,
} from '../../business/services/businessMarketingService'

const MARKETING_PREVIEW_IMAGES = {
  'level-up-skills': '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp',
  'summer-collection-launch': '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp',
  'stay-hydrated': '/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp',
}

function getMarketingPreviewImage(campaign) {
  return campaign.previewImage || MARKETING_PREVIEW_IMAGES[campaign.id] || '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp'
}

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function OpportunitiesDiscoverPanel({
  activeOpportunityIntentId,
  onOpenMarketingCampaign,
  onOpportunitySelect,
  opportunities,
  selectedOpportunityUuid,
}) {
  const [marketingCampaigns, setMarketingCampaigns] = useState(() => getBusinessMarketingCampaigns())
  const marketingOpportunities = marketingCampaigns
    .filter((campaign) => ['Active', 'Scheduled', 'published', 'funding'].includes(campaign.status))
    .slice(0, 3)

  useEffect(() => {
    let isActive = true

    listBusinessMarketingCampaignsFromBackend()
      .then((campaigns) => {
        if (isActive && campaigns.length) setMarketingCampaigns(campaigns)
      })
      .catch(() => {})

    return () => {
      isActive = false
    }
  }, [])

  return (
    <>
      <section className="opportunities-types" aria-label="Opportunity categories">
        {OPPORTUNITY_TYPES.map(({ label, count, Icon, active }) => (
          <article key={label} className={`opportunities-type-card${active ? ' is-active' : ''}`}>
            <div className="opportunities-type-icon">
              <Icon aria-hidden="true" />
            </div>
            <h3>{label}</h3>
            <p>{count.toLocaleString()}</p>
          </article>
        ))}
      </section>

      <section className="opportunities-marketing-opportunities" aria-label="Marketing opportunities from businesses">
        <header>
          <div>
            <h2>Marketing opportunities from businesses</h2>
            <p>Accept a campaign, download the material, share it to your socials, then submit proof.</p>
          </div>
          <button type="button" className="campus-link-btn">View all</button>
        </header>

        <div>
          {marketingOpportunities.map((campaign) => (
            <article key={campaign.id} className="opportunities-marketing-opportunity-card">
              <figure className="opportunities-marketing-opportunity-thumb">
                <img src={getMarketingPreviewImage(campaign)} alt={`${campaign.title} marketing material preview`} loading="lazy" />
                <figcaption>
                  <strong>{campaign.thumbnailTitle}</strong>
                  <span>{campaign.thumbnailMeta}</span>
                </figcaption>
              </figure>
              <div className="opportunities-marketing-opportunity-body">
                <span>{campaign.type}</span>
                <h3>{campaign.title}</h3>
                <p>{campaign.description}</p>
                <ul aria-label={`${campaign.title} platforms`}>
                  {(campaign.platforms || []).map((platform) => <li key={platform}>{platform}</li>)}
                </ul>
              </div>
              <dl>
                <div><dt>Budget</dt><dd>{campaign.budget || `KES ${(campaign.budgetAmount || 0).toLocaleString()}`}</dd></div>
                <div><dt>{campaign.timelineLabel || 'Ends in'}</dt><dd>{campaign.timelineValue || campaign.endsAt || 'Open'}</dd></div>
                <div><dt>Creators</dt><dd>{(campaign.creators?.length || 0) + (campaign.creatorOverflow || campaign.creatorsLimit || 0)}</dd></div>
              </dl>
              <button type="button" className="opportunities-detail-bid-btn" onClick={() => onOpenMarketingCampaign(campaign.id)}>
                Accept
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="opportunities-list-section" aria-label="Recommended opportunities">
        <div className="opportunities-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p>Opportunities matched to your skills and activity</p>
          </div>
          <button type="button" className="campus-link-btn">View all</button>
        </div>

        <div className="opportunities-list">
          {opportunities.map((item) => (
            <article
              key={item.opportunityUuid}
              className={`opportunities-job-card${selectedOpportunityUuid === item.opportunityUuid ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedOpportunityUuid === item.opportunityUuid}
              aria-label={`Open details for ${item.title}`}
              onClick={() => onOpportunitySelect(item.opportunityUuid)}
              onKeyDown={(event) => handleKeyboardActivation(event, () => onOpportunitySelect(item.opportunityUuid))}
            >
              <div className="opportunities-job-avatar">
                <img src={item.image} alt={`${item.title} preview`} loading="lazy" />
              </div>

              <div className="opportunities-job-main">
                <div className="opportunities-job-head">
                  <h3>{item.title}</h3>
                  {item.badge ? <span className="opportunities-badge">{item.badge}</span> : null}
                </div>
                <div className="opportunities-job-intent-row">
                  <span className="opportunities-intent-pill">
                    {item.intentFit[activeOpportunityIntentId] || item.careerPath}
                  </span>
                  <span>{item.careerPath}</span>
                </div>
                <p className="opportunities-job-meta">
                  {item.company} · {item.meta}
                </p>
                <p className="opportunities-job-description">{item.description}</p>
                <p className="opportunities-job-outcome">{item.progressionOutcome}</p>
                <div className="opportunities-tag-row">
                  {item.tags.map((tag) => (
                    <span key={`${item.title}-${tag}`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="opportunities-job-side">
                <p className="opportunities-job-pay">
                  <strong>{item.pay}</strong>
                  <span>{item.unit}</span>
                </p>
                <p className="opportunities-job-posted">{item.posted}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default OpportunitiesDiscoverPanel
