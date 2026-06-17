import { FiAtSign, FiMapPin, FiSettings } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { PROFILE_TAGS } from '../constants'

function ProfileHero() {
  const canEditProfile = hasAccess(ACCESS_KEYS.profile.editOwn)

  return (
    <article className="campus-profile-surface campus-profile-hero">
      <div className="campus-profile-identity">
        <div className="campus-profile-photo-wrap">
          <img
            src="/assets/index/business_page_images/optimized/reza-permadi-7SkqWc6VsZ4-unsplash.webp"
            alt="Brian Mwangi"
          />
          <span aria-hidden="true" />
        </div>

        <div className="campus-profile-identity-copy">
          <h1>
            Brian Mwangi
            <em>Student</em>
          </h1>
          <p>Kenyatta University · Year 3 · Marketing & Design</p>
          <div className="campus-profile-identity-meta">
            <span>
              <FiMapPin aria-hidden="true" />
              Nairobi, Kenya
            </span>
            <span>
              <FiAtSign aria-hidden="true" />
              brian_mwangi
            </span>
          </div>
          <div className="campus-profile-tag-row" aria-label="Skills">
            {PROFILE_TAGS.map((tag) => (
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
