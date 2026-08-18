import { useEffect, useMemo, useState } from 'react'
import { FiArrowUpRight, FiRadio } from 'react-icons/fi'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { listBusinessMarketingCampaignsFromBackend } from '../../business/services/businessMarketingService'

const FALLBACK_PREVIEW = '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp'

function getMarketingPreviewImage(campaign) {
  const material = campaign.materials?.find((item) => item.url)
  return normalizeZumbarlFileUrl(
    (material?.type === 'image' ? material.previewUrl || material.url : '') || campaign.previewImage,
    material,
  ) || FALLBACK_PREVIEW
}

function MarketingPreview({ campaign }) {
  const material = campaign.materials?.find((item) => item.url)
  const isVideo = material?.type === 'video' || String(material?.mimeType || '').startsWith('video/')

  if (isVideo) {
    return <video src={normalizeZumbarlFileUrl(material.previewUrl || material.url, material)} muted playsInline preload="metadata" />
  }

  return (
    <img
      src={getMarketingPreviewImage(campaign)}
      alt={`${campaign.title} marketing material preview`}
      loading="lazy"
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(FALLBACK_PREVIEW)) {
          event.currentTarget.src = FALLBACK_PREVIEW
        }
      }}
    />
  )
}

function formatClosingDate(value) {
  if (!value) return 'Open'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function matchesCampaignSearch(campaign, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  const searchText = [
    campaign.title,
    campaign.description,
    campaign.type,
    ...(campaign.platforms || []),
    ...(campaign.hashtags || []),
  ].join(' ').toLowerCase()
  return searchText.includes(normalizedQuery)
}

function availableSlots(campaign) {
  if (campaign.creatorsLimit == null) return 'Open'
  return Math.max(0, Number(campaign.creatorsLimit) - Number(campaign.acceptedCreatorsCount || 0)).toLocaleString()
}

function OpportunitiesMarketingPanel({ onOpenMarketingCampaign, searchQuery = '' }) {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    listBusinessMarketingCampaignsFromBackend()
      .then((items) => {
        if (isActive) setCampaigns(items)
      })
      .catch((reason) => {
        if (isActive) setError(reason.message || 'Marketing campaigns could not be loaded.')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const visibleCampaigns = useMemo(() => campaigns.filter((campaign) => (
    ['published', 'funded', 'active'].includes(String(campaign.status || '').toLowerCase())
      && matchesCampaignSearch(campaign, searchQuery)
  )), [campaigns, searchQuery])

  return (
    <section className="opportunities-marketing-opportunities is-tab" aria-label="Open marketing campaigns">
      <header>
        <div>
          <h2>Marketing campaigns from businesses</h2>
          <p>Pick up an open creator slot, publish the approved material, and submit your live post as proof.</p>
        </div>
        {!isLoading && !error ? (
          <strong className="opportunities-marketing-count">
            {visibleCampaigns.length} open {visibleCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </strong>
        ) : null}
      </header>

      {isLoading ? <p className="opportunities-list-empty">Loading marketing campaigns…</p> : null}
      {error ? <p className="opportunities-list-empty" role="alert">{error}</p> : null}

      {!isLoading && !error && visibleCampaigns.length ? (
        <div>
          {visibleCampaigns.map((campaign) => (
            <article key={campaign.id} className="opportunities-marketing-opportunity-card">
              <figure className="opportunities-marketing-opportunity-thumb">
                <MarketingPreview campaign={campaign} />
                <figcaption>
                  <span>Creator payout</span>
                  <strong>{campaign.currency || 'KES'} {Number(campaign.payoutPerCampaigner || 0).toLocaleString()}</strong>
                </figcaption>
              </figure>
              <div className="opportunities-marketing-opportunity-body">
                <div className="opportunities-marketing-card-kicker">
                  <span>{campaign.type || 'Creator campaign'}</span>
                  <em className={campaign.eligibility?.eligible === false ? 'is-ineligible' : ''}>
                    {campaign.eligibility?.eligible === false
                      ? 'Requirements not met'
                      : `${availableSlots(campaign)} slots left`}
                  </em>
                </div>
                <h3>{campaign.title}</h3>
                <p>{campaign.description}</p>
                <ul aria-label={`${campaign.title} platforms`}>
                  {(campaign.platforms || []).map((platform) => <li key={platform}>{platform}</li>)}
                </ul>
              </div>
              <dl>
                <div>
                  <dt>Campaign budget</dt>
                  <dd>{campaign.currency || 'KES'} {Number(campaign.budgetAmount || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Closes</dt>
                  <dd>{formatClosingDate(campaign.endsAt)}</dd>
                </div>
                <div>
                  <dt>Platforms</dt>
                  <dd>{campaign.platforms?.length || 0}</dd>
                </div>
              </dl>
              <button type="button" className="opportunities-detail-bid-btn" onClick={() => onOpenMarketingCampaign(campaign.id)}>
                View campaign <FiArrowUpRight aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && !visibleCampaigns.length ? (
        <div className="opportunities-marketing-empty">
          <span aria-hidden="true"><FiRadio /></span>
          <h3>{searchQuery ? 'No matching campaigns' : 'No open marketing campaigns'}</h3>
          <p>{searchQuery ? 'Try a different campaign, platform, or keyword.' : 'New business campaigns will appear here as soon as they are published.'}</p>
        </div>
      ) : null}
    </section>
  )
}

export default OpportunitiesMarketingPanel
