import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiClock, FiMapPin, FiShoppingBag, FiUsers, FiX } from 'react-icons/fi'

function ExploreDefaultRail({ announcements = [], events = [], isLoading = false, marketplaceItems = [], onDismissPerson, onFollowPerson, onOpenEvent, onSeeAnnouncements, onSeeEvents, people = [], pendingPeople = {} }) {
  const [showAllPeople, setShowAllPeople] = useState(false)
  const visiblePeople = showAllPeople ? people : people.slice(0, 3)
  return (
    <>
      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>People You May Know</h3>
          {people.length > 3 ? <button type="button" className="campus-link-btn" onClick={() => setShowAllPeople((current) => !current)}>{showAllPeople ? 'Show Less' : 'See All'}</button> : null}
        </header>

        <div className="explore-campus-people-list">
          {visiblePeople.map((person) => (
            <article key={person.id} className="explore-campus-person-item">
              <Link to={person.profileUrl} className="explore-campus-person-avatar" aria-label={`View ${person.name}'s profile`}>
                <img src={person.avatar || '/assets/index/bee_nobg.png'} alt={person.name} />
                {person.isOnline ? <span /> : null}
              </Link>
              <Link to={person.profileUrl} className="explore-campus-person-copy">
                <h4>{person.name}</h4>
                <p>{person.campus}{person.careerPath ? ` · ${person.careerPath}` : ''}</p>
              </Link>
              <button type="button" className={`explore-campus-follow-btn${person.isFollowing ? ' is-following' : ''}`} aria-pressed={person.isFollowing} disabled={pendingPeople[person.id]} onClick={() => onFollowPerson(person)}>{pendingPeople[person.id] ? 'Saving…' : person.isFollowing ? 'Following' : 'Follow'}</button>
              <button type="button" className="explore-campus-close-btn" aria-label={`Dismiss ${person.name}`} onClick={() => onDismissPerson(person.id)}>
                <FiX aria-hidden="true" />
              </button>
            </article>
          ))}
          {!visiblePeople.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Loading people…' : 'No new profile suggestions right now.'}</p> : null}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Campus Announcements</h3>
          {announcements.length ? <button type="button" className="campus-link-btn" onClick={onSeeAnnouncements}>See All</button> : null}
        </header>

        <div className="explore-campus-announcement-list">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="explore-campus-announcement-item">
              <Link to={announcement.postUrl} className="explore-campus-announcement-copy">
                <h4>{announcement.title}</h4>
                {announcement.detail ? <p>{announcement.detail}</p> : null}
              </Link>
              <footer className="explore-campus-announcement-owner-row">
                {announcement.ownerProfileUrl ? (
                  <Link to={announcement.ownerProfileUrl} className="explore-campus-announcement-owner" aria-label={`View ${announcement.owner}'s profile`}>
                    <img src={announcement.ownerAvatar} alt="" loading="lazy" />
                    <span><strong>{announcement.owner}</strong>{announcement.ownerHandle ? <small>{announcement.ownerHandle}</small> : null}</span>
                  </Link>
                ) : (
                  <div className="explore-campus-announcement-owner">
                    <img src={announcement.ownerAvatar} alt="" loading="lazy" />
                    <span><strong>{announcement.owner}</strong>{announcement.ownerHandle ? <small>{announcement.ownerHandle}</small> : null}</span>
                  </div>
                )}
                <time>{announcement.time}</time>
              </footer>
            </article>
          ))}
          {!announcements.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Loading announcements…' : 'No approved campus announcements yet.'}</p> : null}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Upcoming Events</h3>
          {events.length ? <button type="button" className="campus-link-btn" onClick={onSeeEvents}>See All</button> : null}
        </header>

        <div className="explore-campus-events-list">
          {events.map((event) => (
            <button type="button" key={event.id} className="explore-campus-event-item" onClick={() => onOpenEvent?.(event.post || event)}>
              <div>
                <h4>{event.title}</h4>
                <p>
                  <FiClock aria-hidden="true" />
                  {event.dateTime}
                </p>
                <span>
                  <FiMapPin aria-hidden="true" />
                  {event.location}
                </span>
                <small className="explore-campus-event-reservations">
                  <FiUsers aria-hidden="true" />
                  {event.goingCount > 0 ? <strong>{event.capacity ? `${event.goingCount}/${event.capacity}` : event.goingCount} reserved</strong> : null}
                  {event.goingCount > 0 && event.interestedCount > 0 ? <span aria-hidden="true">·</span> : null}
                  {event.interestedCount > 0 ? <em>{event.interestedCount} interested</em> : null}
                  {!event.goingCount && !event.interestedCount ? <em>No responses yet</em> : null}
                </small>
              </div>
              <img src={event.image} alt={event.title} loading="lazy" />
            </button>
          ))}
          {!events.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Loading events…' : 'No upcoming published events yet.'}</p> : null}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Marketplace</h3>
          <Link className="campus-link-btn" to="/campus/opportunities/buy-sell">See All</Link>
        </header>

        <div className="explore-campus-market-list">
          {marketplaceItems.map((item) => (
            <article key={item.id} className="explore-campus-market-item">
              <Link to={item.href}><img src={item.image} alt={item.name} loading="lazy" /></Link>
              <Link to={item.href} className="explore-campus-market-copy">
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </Link>
              <Link to={item.href} aria-label={`Open ${item.name}`}>
                <FiShoppingBag aria-hidden="true" />
              </Link>
            </article>
          ))}
          {!marketplaceItems.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Loading marketplace…' : 'No live marketplace listings yet.'}</p> : null}
        </div>
      </section>
    </>
  )
}

export default ExploreDefaultRail
