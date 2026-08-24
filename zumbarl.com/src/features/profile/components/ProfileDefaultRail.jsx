import { FiChevronRight, FiClock, FiMessageCircle, FiPhone, FiVideo } from 'react-icons/fi'
import { filterByAccess } from '../../auth/roleConfig'
import {
  PIPELINE_RELATIONSHIPS,
  QUICK_ACTIONS,
  RECENT_ACTIVITY,
} from '../constants'

function compactNumber(value) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: Number(value) >= 1000 ? 1 : 0,
  }).format(Number(value || 0))
}

function ProfileDefaultRail({
  canContact = false,
  contactName = 'this student',
  isFollowedByViewer = false,
  isOwnProfile = false,
  onAudioCall,
  onMessage,
  onVideoCall,
  relationships = PIPELINE_RELATIONSHIPS,
  recentActivity = RECENT_ACTIVITY,
  socialStats,
}) {
  const quickActions = filterByAccess(QUICK_ACTIONS)
  const stats = [
    { label: 'Followers', value: socialStats?.followers, detail: 'People following this profile' },
    { label: 'Following', value: socialStats?.following, detail: 'Profiles they follow' },
    { label: 'Likes', value: socialStats?.likes },
    { label: 'Posts', value: socialStats?.posts },
  ]

  return (
    <>
      <article className="campus-rail-card campus-profile-side-card campus-profile-social-card">
        <header className="campus-profile-card-head">
          <div>
            <h2>Social activity</h2>
            <p>Across Explore Campus</p>
          </div>
          {isFollowedByViewer ? <span className="campus-profile-followed-badge">Followed by you</span> : null}
        </header>
        <dl className="campus-profile-social-stats">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd title={stat.detail || Number(stat.value || 0).toLocaleString()}>{compactNumber(stat.value)}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </article>

      {!isOwnProfile ? (
        <nav className="campus-profile-contact-strip" aria-label={`Contact ${contactName}`}>
          <button type="button" disabled={!canContact} aria-label={`Message ${contactName}`} onClick={onMessage}>
            <FiMessageCircle aria-hidden="true" />
            <span>Message</span>
          </button>
          <button type="button" disabled={!canContact} aria-label={`Audio call ${contactName}`} onClick={onAudioCall}>
            <FiPhone aria-hidden="true" />
            <span>Audio</span>
          </button>
          <button type="button" disabled={!canContact} aria-label={`Video call ${contactName}`} onClick={onVideoCall}>
            <FiVideo aria-hidden="true" />
            <span>Video</span>
          </button>
        </nav>
      ) : null}

      <article className="campus-rail-card campus-profile-side-card">
        <header className="campus-profile-card-head">
          <h2>Relationships</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>

        <div className="campus-profile-pipeline-list">
          {relationships.map((item) => (
            <article key={item.id || item.name || item.company}>
              <img src="/assets/index/bee_nobg.png" alt={`${item.name || item.company} logo`} />
              <div>
                <h3>{item.name || item.company}</h3>
                <p>{item.meta || `${item.gigs || 0} gigs${item.targetRole ? ` · ${item.targetRole}` : ''}`}</p>
              </div>
              <em>{item.status}</em>
            </article>
          ))}
        </div>

        <p className="campus-profile-pipeline-note">
          <FiClock aria-hidden="true" />
          Transition mode unlocks in 14 months at current pace.
        </p>
      </article>

      <article className="campus-rail-card campus-profile-side-card">
        <header className="campus-profile-card-head">
          <h2>Recent Activity</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>

        <div className="campus-profile-activity-list">
          {recentActivity.map(({ title, detail, description, time, meta, Icon, tone = 'teal' }) => (
            <article key={`${title}-${time || meta}`} className={Icon ? 'has-icon' : undefined}>
              {Icon ? (
                <div className={`campus-profile-activity-icon is-${tone}`}>
                  <Icon aria-hidden="true" />
                </div>
              ) : null}
              <div className="campus-profile-activity-copy">
                <div className="campus-profile-activity-heading">
                  <h3>{title}</h3>
                  {time || meta ? <span>{time || meta}</span> : null}
                </div>
                <p>{detail || description}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      {isOwnProfile && quickActions.length ? (
        <article className="campus-rail-card campus-profile-side-card">
          <header className="campus-profile-card-head">
            <h2>Quick Actions</h2>
          </header>

          <div className="campus-profile-quick-list">
            {quickActions.map(({ label, Icon }) => (
              <button key={label} type="button">
                <span>
                  <Icon aria-hidden="true" />
                  {label}
                </span>
                <FiChevronRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </article>
      ) : null}
    </>
  )
}

export default ProfileDefaultRail
