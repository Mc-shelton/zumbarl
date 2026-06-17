import { FiChevronRight, FiClock } from 'react-icons/fi'
import { filterByAccess } from '../../auth/roleConfig'
import {
  PIPELINE_RELATIONSHIPS,
  QUICK_ACTIONS,
  RECENT_ACTIVITY,
} from '../constants'

function ProfileDefaultRail() {
  const quickActions = filterByAccess(QUICK_ACTIONS)

  return (
    <>
      <article className="campus-rail-card campus-profile-side-card">
        <header className="campus-profile-card-head">
          <h2>Relationships</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>

        <div className="campus-profile-pipeline-list">
          {PIPELINE_RELATIONSHIPS.map((item) => (
            <article key={item.name}>
              <img src="/assets/index/bee_nobg.png" alt={`${item.name} logo`} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.meta}</p>
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
          {RECENT_ACTIVITY.map(({ title, detail, time, Icon, tone }) => (
            <article key={`${title}-${time}`}>
              <div className={`campus-profile-activity-icon is-${tone}`}>
                <Icon aria-hidden="true" />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
              <span>{time}</span>
            </article>
          ))}
        </div>
      </article>

      {quickActions.length ? (
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
