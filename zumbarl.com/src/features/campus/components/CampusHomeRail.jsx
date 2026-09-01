import {
  FiActivity,
  FiBookOpen,
  FiChevronRight,
  FiClock,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function formatBalance(wallet, field = 'balance') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: wallet?.currency || 'KES',
    maximumFractionDigits: 0,
  }).format(wallet?.[field] || 0)
}

function CampusHomeRail({ rail }) {
  const wallet = rail?.wallet
  const portfolio = rail?.portfolio
  const events = rail?.events ?? []
  const groups = portfolio?.groups ?? []
  const portfolioStats = portfolio?.stats ?? []

  return (
    <aside className="campus-rail">
      <section className="campus-rail-card campus-wallet-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Your money</p>
            <h3>Wallet</h3>
          </div>
          <Link to="/campus/profile?tab=Activity" className="campus-link-btn">Activity</Link>
        </header>
        <div className="campus-wallet">
          <p>Available balance</p>
          <h4>{formatBalance(wallet)}</h4>
          <div className="campus-wallet-meta">
            <span>{wallet?.type ? `${wallet.type.charAt(0)}${wallet.type.slice(1).toLowerCase()} wallet` : 'Main wallet'}</span>
            <span>{formatBalance(wallet, 'pendingBalance')} pending</span>
          </div>
          <div className="campus-wallet-actions">
            <Link to="/campus/profile?tab=Activity"><FiClock aria-hidden="true" />Transactions</Link>
            <Link to="/campus/profile"><FiUser aria-hidden="true" />My profile</Link>
          </div>
        </div>
      </section>

      <section className="campus-rail-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Your progress</p>
            <h3>Momentum</h3>
          </div>
          <Link to="/campus/profile" className="campus-link-btn">View profile</Link>
        </header>
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
        <div className="campus-rail-list is-portfolio">
          {groups.map((group) => (
            <article key={group.name} className="campus-list-item">
              <div className="campus-list-head">
                <h4>{group.name}</h4>
                <p>{group.value}</p>
              </div>
              <div className="campus-progress" aria-label={`${group.name}: ${group.value}`}>
                <span style={{ width: `${group.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Around campus</p>
            <h3>Coming up</h3>
          </div>
          <Link to="/campus/explore" className="campus-link-btn">See all</Link>
        </header>
        <div className="campus-rail-list">
          {events.map((event) => (
            <Link key={event.id || event.title} to={event.href || '/campus/explore'} className="campus-event-item">
              {event.thumbnail ? <img className="campus-event-thumb" src={normalizeZumbarlFileUrl(event.thumbnail)} alt="" loading="lazy" /> : <span className="campus-event-placeholder"><FiActivity aria-hidden="true" /></span>}
              <div>
                <h4>{event.title}</h4>
                <p>{event.time}</p>
                <span>{event.attendees} attending{event.isGoing ? ' · You’re going' : ''}</span>
              </div>
              <FiChevronRight aria-hidden="true" />
            </Link>
          ))}
          {!events.length ? <p className="campus-rail-empty">No upcoming campus events yet.</p> : null}
        </div>
      </section>

      <section className="campus-rail-card campus-learning-card">
        <Link to="/campus/learn" className="campus-papers">
          <span className="campus-paper-icon"><FiBookOpen aria-hidden="true" /></span>
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
