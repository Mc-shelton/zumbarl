import { useState } from 'react'
import { FiBriefcase, FiCalendar, FiClock, FiMessageCircle } from 'react-icons/fi'

function getCurrentWeekDays(interviews) {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)

    const interviewCount = interviews.filter((interview) => {
      if (!interview.scheduledAt) return false
      const scheduled = new Date(interview.scheduledAt)
      return !Number.isNaN(scheduled.getTime()) && scheduled.toDateString() === day.toDateString()
    }).length

    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      date: String(day.getDate()),
      interviews: interviewCount,
      isToday: day.toDateString() === now.toDateString(),
    }
  })
}

function OpportunitiesBidsRail({
  interviews = [],
  onRefresh = () => {},
  selectedBid,
  selectedBidInterview,
  upcomingInterviewsCount,
}) {
  const calendarDays = getCurrentWeekDays(interviews)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onRefresh()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <aside className="campus-rail opportunities-rail opportunities-bids-rail" aria-label="Bid planning tools">
      <section className="campus-rail-card opportunities-bids-rail-card opportunities-bids-calendar-card">
        <header>
          <div className="opportunities-bids-rail-title"><span><FiCalendar aria-hidden="true" /></span><div><small>Planning</small><h3>Interview calendar</h3></div></div>
          <button type="button" className="campus-link-btn" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? 'Syncing…' : 'Sync'}
          </button>
        </header>
        <p className="opportunities-bids-rail-subtitle">
          {upcomingInterviewsCount} upcoming interviews this week
        </p>

        <div className="opportunities-bids-week-grid">
          {calendarDays.map((item) => (
            <article
              key={`${item.day}-${item.date}`}
              className={`opportunities-bids-week-cell${item.isToday ? ' is-today' : ''}${item.interviews > 0 ? ' has-event' : ''}`}
            >
              <span>{item.day}</span>
              <strong>{item.date}</strong>
              {item.interviews ? <em>{item.interviews}</em> : null}
            </article>
          ))}
        </div>

        {selectedBid ? (
          <article className="opportunities-bids-focus-card">
            <p className="opportunities-bids-focus-label"><FiBriefcase aria-hidden="true" /> Focused bid</p>
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
        <div className="opportunities-bids-upcoming-block">
          <header><h3>Upcoming interviews</h3><span>{interviews.length}</span></header>
          <div className="opportunities-bids-interview-list">
            {interviews.length === 0 ? (
              <div className="opportunities-bids-interview-empty"><FiCalendar aria-hidden="true" /><p>No interviews scheduled. New bookings will appear here automatically.</p></div>
            ) : null}
            {interviews.map((item) => (
              <article
                key={item.id}
                className={`opportunities-bids-interview-item${selectedBidInterview?.id === item.id ? ' is-selected' : ''}`}
              >
                <h4>{item.title}</h4>
                <p><FiClock aria-hidden="true" />{item.time}</p>
                <p><FiMessageCircle aria-hidden="true" />{item.mode} · {item.contact}</p>
                {item.note ? <span>{item.note}</span> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </aside>
  )
}

export default OpportunitiesBidsRail
