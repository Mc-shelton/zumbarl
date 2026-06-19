import { FiAtSign, FiMapPin, FiSettings } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { PROFILE_TAGS } from '../constants'

function ProfileHero({ profileHeader = null }) {
  const canEditProfile = hasAccess(ACCESS_KEYS.profile.editOwn)
  const tags = profileHeader?.tags?.length ? profileHeader.tags : PROFILE_TAGS

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
          <button type="button" className="campus-profile-ghost-icon" aria-label="Profile settings">
            <FiSettings aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </article>
  )
}

export default ProfileHero
