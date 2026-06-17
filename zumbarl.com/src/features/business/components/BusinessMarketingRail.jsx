import { FiArrowRight, FiChevronRight, FiGift, FiPlayCircle, FiRadio, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const CREATE_ICONS = {
  campaign: FiRadio,
  gift: FiGift,
  video: FiPlayCircle,
}

const PLATFORM_MARKS = {
  Facebook: 'f',
  Instagram: 'IG',
  TikTok: 'TT',
  'X (Twitter)': 'X',
  YouTube: 'YT',
}

export function BusinessMarketingRail({
  createCampaignHref,
  createOptions,
  onCreateCampaign,
  onSelectCampaignType,
  platforms,
  selectedCampaignType,
}) {
  return (
    <aside className="campus-rail business-workspace-rail business-marketing-rail">
      <section className="business-profile-card business-marketing-create-card">
        <header>
          <div>
            <h2>Create New Campaign</h2>
            <p>Choose how you want to promote your brand.</p>
          </div>
        </header>
        <div className="business-marketing-create-options">
          {createOptions.map((option) => {
            const Icon = CREATE_ICONS[option.icon] || FiRadio
            const isSelected = option.id === selectedCampaignType
            const optionContent = (
              <>
                <span className={`tone-${option.tone}`} aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  <strong>{option.title}</strong>
                  <em>{option.description}</em>
                </span>
                <FiChevronRight aria-hidden="true" />
              </>
            )

            if (createCampaignHref) {
              return (
                <Link
                  key={option.id}
                  to={createCampaignHref}
                  className={isSelected ? 'is-selected' : undefined}
                  onClick={() => onSelectCampaignType?.(option.id)}
                >
                  {optionContent}
                </Link>
              )
            }

            return (
              <button
                key={option.id}
                type="button"
                className={isSelected ? 'is-selected' : ''}
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectCampaignType?.(option.id)
                  onCreateCampaign?.()
                }}
              >
                {optionContent}
              </button>
            )
          })}
        </div>
      </section>

      <section className="business-profile-card business-marketing-platform-card">
        <header>
          <div>
            <h2>Popular Platforms</h2>
            <p>Where students are most active</p>
          </div>
        </header>
        <ul>
          {platforms.map((platform) => (
            <li key={platform.label}>
              <span className={`tone-${platform.tone}`}>{PLATFORM_MARKS[platform.label] || platform.label[0]}</span>
              <div>
                <p><strong>{platform.label}</strong><em>{platform.value}%</em></p>
                <b><i className={`tone-${platform.tone}`} style={{ width: `${platform.value}%` }} /></b>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="business-profile-card business-marketing-tip-card">
        <div>
          <h2>Marketing Tips</h2>
          <p>Work with micro-influencers for higher engagement and authentic reach.</p>
          <button type="button" className="business-link-btn">
            View all tips
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>
        <span aria-hidden="true">
          <FiZap />
        </span>
      </section>
    </aside>
  )
}
