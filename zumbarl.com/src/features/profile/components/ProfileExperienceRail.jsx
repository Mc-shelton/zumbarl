import { FiChevronDown } from 'react-icons/fi'
import {
  EXPERIENCE_OVERVIEW_METRICS,
  EXPERIENCE_PATH_CARD,
  EXPERIENCE_PROGRESS_SUMMARY,
  EXPERIENCE_RECENT_ACHIEVEMENTS,
} from '../constants'

function ProfileExperienceRail() {
  return (
    <>
      <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
        <header className="campus-profile-card-head">
          <h2>Career Path</h2>
          <button type="button" className="campus-link-btn">Edit Path</button>
        </header>

        <div className="campus-experience-path-block">
          <img src="/assets/index/bee_nobg.png" alt={`${EXPERIENCE_PATH_CARD.name} logo`} className="campus-experience-path-icon" />
          <div>
            <h3>{EXPERIENCE_PATH_CARD.name}</h3>
            <p>{EXPERIENCE_PATH_CARD.tags.join(' · ')}</p>
            <span>Last Edited: {EXPERIENCE_PATH_CARD.chosenDate}</span>
          </div>
          <em className="campus-experience-pill is-complete">{EXPERIENCE_PATH_CARD.status}</em>
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
        <header className="campus-profile-card-head">
          <h2>Overall Pipeline Progress</h2>
        </header>

        <div className="campus-experience-progress-overview">
          <div
            className="campus-experience-progress-ring"
            style={{ '--experience-progress': `${Math.round((EXPERIENCE_PROGRESS_SUMMARY.percent / 100) * 360)}deg` }}
          >
            <strong>{EXPERIENCE_PROGRESS_SUMMARY.percent}<span>%</span></strong>
          </div>
          <p>
            Completed {EXPERIENCE_PROGRESS_SUMMARY.completedStages} of 5 stages
            <span>Keep going! You&apos;re on track.</span>
          </p>
        </div>

        <div className="campus-experience-side-list">
          <article>
            <p>Completed Stages</p>
            <strong>{EXPERIENCE_PROGRESS_SUMMARY.completedStages}</strong>
          </article>
          <article>
            <p>In Progress</p>
            <strong>{EXPERIENCE_PROGRESS_SUMMARY.inProgressStages}</strong>
          </article>
          <article>
            <p>Locked</p>
            <strong>{EXPERIENCE_PROGRESS_SUMMARY.lockedStages}</strong>
          </article>
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
        <header className="campus-profile-card-head">
          <h2>Experience Overview</h2>
          <button type="button" className="campus-experience-filter-btn">
            This Year
            <FiChevronDown aria-hidden="true" />
          </button>
        </header>

        <div className="campus-experience-overview-list">
          {EXPERIENCE_OVERVIEW_METRICS.map(({ label, value, Icon, tone }) => (
            <article key={label}>
              <p>
                <span className={`campus-experience-overview-icon is-${tone}`}>
                  <Icon aria-hidden="true" />
                </span>
                {label}
              </p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </article>

      <article className="campus-rail-card campus-profile-side-card campus-experience-side-card">
        <header className="campus-profile-card-head">
          <h2>Recent Achievements</h2>
          <button type="button" className="campus-link-btn">View all</button>
        </header>

        <div className="campus-experience-achievement-list">
          {EXPERIENCE_RECENT_ACHIEVEMENTS.map(({ title, detail, date, Icon, tone }) => (
            <article key={`${title}-${date}`}>
              <span className={`campus-experience-overview-icon is-${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
              <time>{date}</time>
            </article>
          ))}
        </div>
      </article>
    </>
  )
}

export default ProfileExperienceRail
