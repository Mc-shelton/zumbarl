import { useState } from 'react'
import { FiAtSign, FiMapPin, FiSettings } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { OPPORTUNITY_INTENT_OPTIONS } from '../../opportunities/constants'
import {
  getPreferredOpportunityIntentId,
  setPreferredOpportunityIntentId,
} from '../../opportunities/services/opportunityIntentPreference'
import { PROFILE_TAGS } from '../constants'

function ProfileHero({ profileHeader = null }) {
  const canEditProfile = hasAccess(ACCESS_KEYS.profile.editOwn)
  const tags = profileHeader?.tags?.length ? profileHeader.tags : PROFILE_TAGS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [preferredIntentId, setPreferredIntentId] = useState(() => getPreferredOpportunityIntentId())

  function changePreferredIntent(intentId) {
    setPreferredOpportunityIntentId(intentId)
    setPreferredIntentId(intentId)
  }

  return (
    <article className="campus-profile-surface campus-profile-hero">
      <div className="campus-profile-identity">
        <div className="campus-profile-photo-wrap">
          <img
            src={profileHeader?.avatar || '/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp'}
            alt={profileHeader?.name || 'Student profile'}
          />
          <span aria-hidden="true" />
        </div>

        <div className="campus-profile-identity-copy">
          <h1>
            {profileHeader?.name || 'Brian Mwangi'}
            <em>{profileHeader?.role || 'Student'}</em>
          </h1>
          <p>{profileHeader?.headline || 'Kenyatta University · Year 3 · Marketing & Design'}</p>
          <div className="campus-profile-identity-meta">
            <span>
              <FiMapPin aria-hidden="true" />
              {profileHeader?.location || 'Nairobi, Kenya'}
            </span>
            <span>
              <FiAtSign aria-hidden="true" />
              {profileHeader?.handle || 'brian_mwangi'}
            </span>
          </div>
          <div className="campus-profile-tag-row" aria-label="Skills">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {canEditProfile ? (
        <div className="campus-profile-hero-actions">
          <button type="button" className="campus-profile-ghost-btn">Edit Profile</button>
          <div className="campus-profile-settings-wrap">
            <button
              type="button"
              className="campus-profile-ghost-icon"
              aria-label="Profile settings"
              aria-expanded={isSettingsOpen}
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              <FiSettings aria-hidden="true" />
            </button>
            {isSettingsOpen ? (
              <div className="campus-profile-settings-menu" role="group" aria-label="Opportunity mode">
                <strong>Opportunity mode</strong>
                <p>Choose how jobs and gigs are prioritized for you across Zumbarl.</p>
                {OPPORTUNITY_INTENT_OPTIONS.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    className={preferredIntentId === intent.id ? 'is-active' : ''}
                    aria-pressed={preferredIntentId === intent.id}
                    onClick={() => changePreferredIntent(intent.id)}
                  >
                    <strong>{intent.label}</strong>
                    <span>{intent.summary}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default ProfileHero
