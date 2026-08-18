import {
  FiBookOpen,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiMoreHorizontal,
  FiSend,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function formatBalance(wallet) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: wallet?.currency || 'KES',
    maximumFractionDigits: 0,
  }).format(wallet?.balance || 0)
}

function CampusHomeRail({ rail }) {
  const wallet = rail?.wallet
  const portfolio = rail?.portfolio
  const events = rail?.events ?? []
  const groups = portfolio?.groups ?? []
  const portfolioStats = portfolio?.stats ?? []

  return (
    <aside className="campus-rail">
      <section className="campus-rail-card">
        <header>
          <h3>My Wallet</h3>
          <Link to="/campus/profile" className="campus-link-btn">View all</Link>
        </header>
        <div className="campus-wallet">
          <p>Total Balance</p>
          <h4>{formatBalance(wallet)}</h4>
          <span>Wallet · {wallet?.type ? wallet.type.charAt(0) + wallet.type.slice(1).toLowerCase() : 'Main'}</span>
          <div className="campus-wallet-actions">
            <Link to="/campus/profile">
              <FiSend aria-hidden="true" />
              Send
            </Link>
            <Link to="/campus/profile">
              <FiDownload aria-hidden="true" />
              Request
            </Link>
            <Link to="/campus/profile">
              <FiCreditCard aria-hidden="true" />
              Save
            </Link>
            <Link to="/campus/profile">
              <FiClock aria-hidden="true" />
              History
            </Link>
          </div>
        </div>
      </section>

      <section className="campus-rail-card">
        <header>
          <h3>Your Portfolio</h3>
          <Link to="/campus/profile" className="campus-link-btn">View all</Link>
        </header>
        <section className="campus-portfolio-overview" aria-label="Portfolio highlights">
          <p className="campus-portfolio-meta">{portfolio?.meta || 'Complete your student profile'}</p>
          <div className="campus-portfolio-stats">
            {portfolioStats.map((stat) => (
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
          {groups.map((group) => (
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
          <Link to="/campus/explore" className="campus-link-btn">View all</Link>
        </header>
        <div className="campus-rail-list">
          {events.map((event) => (
            <article key={event.title} className="campus-event-item">
              <img className="campus-event-thumb" src={normalizeZumbarlFileUrl(event.thumbnail)} alt={`${event.title} thumbnail`} loading="lazy" />
              <div>
                <h4>{event.title}</h4>
                <p>{event.time}</p>
                <span>{event.attendees} attending</span>
              </div>
              <Link to="/campus/explore" className="campus-join-btn">{event.isGoing ? 'Going' : 'View'}</Link>
            </article>
          ))}
          {!events.length ? <p className="campus-rail-empty">No upcoming campus events yet.</p> : null}
        </div>
      </section>

      <section className="campus-rail-card">
        <Link to="/campus/learn" className="campus-papers">
          <div className="campus-paper-icon">
            <FiBookOpen aria-hidden="true" />
          </div>
          <div>
            <h4>{rail?.learning?.title || 'Explore learning resources'}</h4>
            <p>{rail?.learning?.detail || 'Roadmaps, notes and verified skills'}</p>
          </div>
          <FiChevronRight aria-hidden="true" />
        </Link>
      </section>
    </aside>
  )
}

export default CampusHomeRail
