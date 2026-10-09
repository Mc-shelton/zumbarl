import {
  FiActivity,
  FiArrowUpRight,
  FiBookOpen,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiTrendingUp,
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

function formatEventDate(event) {
  const date = new Date(event?.meta)
  if (Number.isNaN(date.getTime())) {
    return { day: '', month: '', label: event?.time || 'Date to be confirmed' }
  }

  return {
    day: new Intl.DateTimeFormat('en-KE', { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat('en-KE', { month: 'short' }).format(date),
    label: new Intl.DateTimeFormat('en-KE', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  }
}

function learningProgress(detail) {
  const match = String(detail || '').match(/(\d+(?:\.\d+)?)%/)
  return match ? Math.min(Math.max(Number(match[1]), 0), 100) : null
}

function CampusHomeRail({ rail }) {
  const wallet = rail?.wallet
  const portfolio = rail?.portfolio
  const events = rail?.events ?? []
  const groups = portfolio?.groups ?? []
  const portfolioStats = portfolio?.stats ?? []

  return (
    <aside className="campus-rail campus-workspace-rail">
      <section className="campus-rail-card campus-wallet-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Your money</p>
            <h3>Wallet</h3>
          </div>
          <Link to="/campus/profile?tab=Activity" className="campus-rail-header-link">Activity <FiArrowUpRight aria-hidden="true" /></Link>
        </header>
        <div className="campus-wallet">
          <div className="campus-wallet-balance">
            <div>
              <p>Available balance</p>
              <h4>{formatBalance(wallet)}</h4>
            </div>
            <span className="campus-wallet-icon"><FiCreditCard aria-hidden="true" /></span>
          </div>
          <div className="campus-wallet-meta">
            <span><i />{wallet?.type ? `${wallet.type.charAt(0)}${wallet.type.slice(1).toLowerCase()} wallet` : 'Main wallet'}</span>
            <strong>{formatBalance(wallet, 'pendingBalance')} pending</strong>
          </div>
          <div className="campus-wallet-actions">
            <Link to="/campus/profile?tab=Activity"><FiClock aria-hidden="true" /><span>Transactions</span></Link>
            <Link to="/campus/profile"><FiUser aria-hidden="true" /><span>My profile</span></Link>
          </div>
        </div>
      </section>

      <section className="campus-rail-card campus-momentum-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Your progress</p>
            <h3>Momentum</h3>
          </div>
          <Link to="/campus/profile" className="campus-rail-header-link">Profile <FiArrowUpRight aria-hidden="true" /></Link>
        </header>
        <p className="campus-portfolio-meta">{portfolio?.meta || 'Complete your student profile'}</p>
        <div className="campus-portfolio-stats">
          {portfolioStats.map((stat, index) => (
            <article key={stat.label} className="campus-portfolio-stat">
              <div className="campus-portfolio-stat-head">
                <span className={`campus-portfolio-stat-icon${index === 1 ? ' is-gigs' : ''}`}>{index === 1 ? <FiCheckCircle aria-hidden="true" /> : <FiTrendingUp aria-hidden="true" />}</span>
                <p className="campus-portfolio-stat-label">{stat.label}</p>
              </div>
              <div className="campus-portfolio-stat-score">
                <p className="campus-portfolio-stat-value">{stat.value}</p>
                <p className="campus-portfolio-stat-detail">{stat.detail}</p>
              </div>
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
              <div
                className="campus-progress"
                role="progressbar"
                aria-label={group.name}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={group.progress}
                aria-valuetext={String(group.value)}
              >
                <span style={{ width: `${group.progress}%` }} />
              </div>
              <span className="campus-progress-caption">{group.progress >= 80 ? 'Strong' : group.progress >= 50 ? 'Building' : 'Getting started'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card campus-upcoming-card">
        <header>
          <div>
            <p className="campus-rail-kicker">Around campus</p>
            <h3>Coming up</h3>
          </div>
          <Link to="/campus/explore" className="campus-rail-header-link">See all <FiArrowUpRight aria-hidden="true" /></Link>
        </header>
        <div className="campus-rail-list">
          {events.map((event) => {
            const date = formatEventDate(event)
            return (
              <Link key={event.id || event.title} to={event.href || '/campus/explore'} className="campus-event-item">
                <div className="campus-event-media">
                  {event.thumbnail ? <img className="campus-event-thumb" src={normalizeZumbarlFileUrl(event.thumbnail)} alt="" loading="lazy" /> : <span className="campus-event-placeholder"><FiActivity aria-hidden="true" /></span>}
                  {date.day ? <span className="campus-event-date"><strong>{date.day}</strong>{date.month}</span> : null}
                </div>
                <div className="campus-event-copy">
                  <h4>{event.title}</h4>
                  <p><FiClock aria-hidden="true" /> {date.label}</p>
                  <span>{event.isGoing ? <><FiCheckCircle aria-hidden="true" /> You’re going</> : `${event.attendees} attending`}</span>
                </div>
                <FiChevronRight aria-hidden="true" />
              </Link>
            )
          })}
          {!events.length ? <p className="campus-rail-empty">No upcoming campus events yet.</p> : null}
        </div>
      </section>

      <section className="campus-rail-card campus-learning-card">
        <Link to="/campus/learn" className="campus-papers">
          <span className="campus-paper-icon"><FiBookOpen aria-hidden="true" /></span>
          <div className="campus-learning-copy">
            <span className="campus-card-kicker">Keep learning</span>
            <h4>{rail?.learning?.title || 'Explore learning resources'}</h4>
            <p>{rail?.learning?.detail || 'Roadmaps, notes and verified skills'}</p>
            {learningProgress(rail?.learning?.detail) !== null ? <div className="campus-learning-progress"><span style={{ width: `${learningProgress(rail?.learning?.detail)}%` }} /></div> : null}
          </div>
          <FiChevronRight aria-hidden="true" />
        </Link>
      </section>
    </aside>
  )
}

export default CampusHomeRail
