import { FiCalendar, FiClock, FiMessageCircle } from 'react-icons/fi'
import {
  BID_RAIL_CALENDAR_DAYS,
  BID_RAIL_INTERVIEWS,
  BID_RAIL_REMINDERS,
} from '../constants'

function OpportunitiesBidsRail({
  selectedBid,
  selectedBidInterview,
  upcomingInterviewsCount,
}) {
  return (
    <aside className="campus-rail opportunities-rail opportunities-bids-rail" aria-label="Bid planning tools">
      <section className="campus-rail-card opportunities-bids-rail-card opportunities-bids-calendar-card">
        <header>
          <h3>Interview Calendar</h3>
          <button type="button" className="campus-link-btn">Sync</button>
        </header>
        <p className="opportunities-bids-rail-subtitle">
          {upcomingInterviewsCount} upcoming interviews this week
        </p>

        <div className="opportunities-bids-week-grid">
          {BID_RAIL_CALENDAR_DAYS.map((item) => (
            <article
              key={`${item.day}-${item.date}`}
              className={`opportunities-bids-week-cell${item.isToday ? ' is-today' : ''}${item.interviews > 0 ? ' has-event' : ''}`}
            >
              <span>{item.day}</span>
              <strong>{item.date}</strong>
            </article>
          ))}
        </div>

        {selectedBid ? (
          <article className="opportunities-bids-focus-card">
            <p className="opportunities-bids-focus-label">Focused bid</p>
            <h4>{selectedBid.title}</h4>
            <p>{selectedBid.company} · {selectedBid.stage}</p>

            {selectedBidInterview ? (
              <div className="opportunities-bids-focus-interview">
                <p>
                  <FiCalendar aria-hidden="true" />
                  {selectedBidInterview.time}
                </p>
                <p>
                  <FiMessageCircle aria-hidden="true" />
                  {selectedBidInterview.mode} · {selectedBidInterview.contact}
                </p>
              </div>
            ) : (
              <p className="opportunities-bids-no-interview">No interview scheduled yet for this bid.</p>
            )}
          </article>
        ) : null}
      </section>

      <section className="campus-rail-card opportunities-bids-rail-card">
        <header>
          <h3>Upcoming Interviews</h3>
        </header>

        <div className="opportunities-bids-interview-list">
          {BID_RAIL_INTERVIEWS.map((item) => (
            <article
              key={item.id}
              className={`opportunities-bids-interview-item${selectedBidInterview?.id === item.id ? ' is-selected' : ''}`}
            >
              <h4>{item.title}</h4>
              <p>
                <FiClock aria-hidden="true" />
                {item.time}
              </p>
              <p>
                <FiMessageCircle aria-hidden="true" />
                {item.mode} · {item.contact}
              </p>
              <span>{item.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card opportunities-bids-rail-card">
        <header>
          <h3>Reminders</h3>
          <button type="button" className="campus-link-btn">Manage</button>
        </header>

        <div className="opportunities-bids-reminder-list">
          {BID_RAIL_REMINDERS.map((item, index) => (
            <article key={`${item.id}-${index}`} className={`opportunities-bids-reminder-item ${item.tone}`}>
              <div>
                <h4>{item.title}</h4>
                <p>{item.detail}</p>
              </div>
              <strong>{item.due}</strong>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default OpportunitiesBidsRail
