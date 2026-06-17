import {
  FiBookOpen,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiMoreHorizontal,
  FiSend,
} from 'react-icons/fi'
import {
  EVENTS,
  GROUPS,
  PORTFOLIO_STATS,
} from '../homeData'

function CampusHomeRail() {
  return (
    <aside className="campus-rail">
      <section className="campus-rail-card">
        <header>
          <h3>My Wallet</h3>
          <button type="button" className="campus-link-btn">View all</button>
        </header>
        <div className="campus-wallet">
          <p>Total Balance</p>
          <h4>KSh 7,850</h4>
          <span>Wallet · Main</span>
          <div className="campus-wallet-actions">
            <button type="button">
              <FiSend aria-hidden="true" />
              Send
            </button>
            <button type="button">
              <FiDownload aria-hidden="true" />
              Request
            </button>
            <button type="button">
              <FiCreditCard aria-hidden="true" />
              Save
            </button>
            <button type="button">
              <FiClock aria-hidden="true" />
              History
            </button>
          </div>
        </div>
      </section>

      <section className="campus-rail-card">
        <header>
          <h3>Your Portfolio</h3>
          <button type="button" className="campus-link-btn">View all</button>
        </header>
        <section className="campus-portfolio-overview" aria-label="Portfolio highlights">
          <p className="campus-portfolio-meta">Strathmore University · Year 3 · Marketing & Design</p>
          <div className="campus-portfolio-stats">
            {PORTFOLIO_STATS.map((stat) => (
              <article key={stat.label} className="campus-portfolio-stat">
                <p className="campus-portfolio-stat-label">{stat.label}</p>
                <p className="campus-portfolio-stat-value">{stat.value}</p>
                <p className="campus-portfolio-stat-detail">{stat.detail}</p>
                <p className="campus-portfolio-stat-trend">{stat.trend}</p>
              </article>
            ))}
          </div>
        </section>
        <div className="campus-rail-list is-portfolio">
          {GROUPS.map((group) => (
            <article key={group.name} className="campus-list-item">
              <div className="campus-list-head">
                <div>
                  <h4>{group.name}</h4>
                  <p>{group.value}</p>
                </div>
                <button type="button" className="campus-icon-btn plain" aria-label={`Manage ${group.name}`}>
                  <FiMoreHorizontal aria-hidden="true" />
                </button>
              </div>
              <div className="campus-progress">
                <span style={{ width: `${group.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card">
        <header>
          <h3>Upcoming Events</h3>
          <button type="button" className="campus-link-btn">View all</button>
        </header>
        <div className="campus-rail-list">
          {EVENTS.map((event) => (
            <article key={event.title} className="campus-event-item">
              <img className="campus-event-thumb" src={event.thumbnail} alt={`${event.title} thumbnail`} loading="lazy" />
              <div>
                <h4>{event.title}</h4>
                <p>{event.time}</p>
                <span>{event.attendees} attending</span>
              </div>
              <button type="button" className="campus-join-btn">Join</button>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card">
        <article className="campus-papers">
          <div className="campus-paper-icon">
            <FiBookOpen aria-hidden="true" />
          </div>
          <div>
            <h4>New Past Papers</h4>
            <p>12 new past papers uploaded</p>
          </div>
          <FiChevronRight aria-hidden="true" />
        </article>
      </section>
    </aside>
  )
}

export default CampusHomeRail
