import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiShoppingBag,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { recordConnectPostOpen, recordProfileSuggestionDismiss } from '../services/postService'

function RailHeading({ eyebrow, Icon, title }) {
  return (
    <div className="explore-campus-rail-heading">
      <span><Icon aria-hidden="true" /></span>
      <div><small>{eyebrow}</small><h3>{title}</h3></div>
    </div>
  )
}

function CommercePreview({ item, tone }) {
  return (
    <article className={`explore-campus-market-item is-${tone}`}>
      <Link to={item.href} className="explore-campus-market-image">
        <img src={item.image} alt={item.name} loading="lazy" />
        {item.badge ? <span>{item.badge}</span> : null}
      </Link>
      <Link to={item.href} className="explore-campus-market-copy">
        <small>{item.vendor}</small>
        <h4>{item.name}</h4>
        <p>{item.price}</p>
      </Link>
      <Link to={item.href} className="explore-campus-market-open" aria-label={`Open ${item.name}`}>
        <FiShoppingBag aria-hidden="true" />
      </Link>
    </article>
  )
}

function ExploreDefaultRail({
  announcements = [],
  campusItems = [],
  events = [],
  isLoading = false,
  marketplaceItems = [],
  onDismissPerson,
  onFollowPerson,
  onOpenEvent,
  onSeeAnnouncements,
  onSeeEvents,
  people = [],
  pendingPeople = {},
}) {
  const [showAllPeople, setShowAllPeople] = useState(false)
  const eligiblePeople = people.filter((person) => !person.isFollowing)
  const visiblePeople = showAllPeople ? eligiblePeople : eligiblePeople.slice(0, 3)
  const discoveryItems = [
    ...campusItems.map((item) => ({ ...item, railTone: 'campus' })),
    ...marketplaceItems.map((item) => ({ ...item, railTone: 'marketplace' })),
  ]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 4)

  return (
    <section className="explore-campus-pulse" aria-label="Campus pulse">
      <header className="explore-campus-pulse-header">
        <span><FiActivity aria-hidden="true" /></span>
        <div><small>Live around you</small><h2>Campus pulse</h2></div>
        <em><i /> Live</em>
      </header>

      <section className="explore-campus-pulse-section is-people">
        <header>
          <RailHeading eyebrow="Your network" Icon={FiUsers} title="People to follow" />
          {eligiblePeople.length > 3 ? (
            <button type="button" className="campus-link-btn" onClick={() => setShowAllPeople((current) => !current)}>
              {showAllPeople ? 'Less' : 'All'}
            </button>
          ) : null}
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
              <button type="button" className="explore-campus-follow-btn" aria-pressed="false" disabled={pendingPeople[person.id]} onClick={() => onFollowPerson(person)}>
                {pendingPeople[person.id] ? 'Saving…' : 'Follow'}
              </button>
              <button type="button" className="explore-campus-close-btn" aria-label={`Dismiss ${person.name}`} onClick={() => { recordProfileSuggestionDismiss(person.id); onDismissPerson(person.id) }}>
                <FiX aria-hidden="true" />
              </button>
            </article>
          ))}
          {!visiblePeople.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Loading people…' : 'You are caught up with suggestions.'}</p> : null}
        </div>
      </section>

      {announcements.length ? (
        <section className="explore-campus-pulse-section is-announcements">
          <header>
            <RailHeading eyebrow="Stay informed" Icon={FiBell} title="Latest announcement" />
            <button type="button" className="campus-link-btn" onClick={onSeeAnnouncements}>All</button>
          </header>

          <div className="explore-campus-announcement-list">
            {announcements.slice(0, 1).map((announcement) => (
              <article key={announcement.id} className="explore-campus-announcement-item">
                <Link to={announcement.postUrl} className="explore-campus-announcement-copy" onClick={() => recordConnectPostOpen(announcement.id, 'announcement_rail')}>
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
          </div>
        </section>
      ) : null}

      {events.length ? (
        <section className="explore-campus-pulse-section is-events">
          <header>
            <RailHeading eyebrow="Coming up" Icon={FiCalendar} title="Events near you" />
            <button type="button" className="campus-link-btn" onClick={onSeeEvents}>All</button>
          </header>

          <div className="explore-campus-events-list">
            {events.slice(0, 2).map((event) => (
              <button type="button" key={event.id} className="explore-campus-event-item" onClick={() => { recordConnectPostOpen(event.id, 'event_rail'); onOpenEvent?.(event.post || event) }}>
                <div>
                  <h4>{event.title}</h4>
                  <p><FiClock aria-hidden="true" />{event.dateTime}</p>
                  <span><FiMapPin aria-hidden="true" />{event.location}</span>
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
          </div>
        </section>
      ) : null}

      <section className="explore-campus-pulse-section is-discovery">
        <header>
          <RailHeading eyebrow="Picked for you" Icon={FiShoppingBag} title="Discover nearby" />
          <Link className="campus-link-btn" to="/campus/opportunities/buy-sell">Browse</Link>
        </header>

        <div className="explore-campus-market-list">
          {discoveryItems.map((item) => <CommercePreview key={item.id} item={item} tone={item.railTone} />)}
          {!discoveryItems.length ? <p className="explore-campus-rail-empty">{isLoading ? 'Finding things around you…' : 'Nothing new nearby right now.'}</p> : null}
        </div>
      </section>
    </section>
  )
}

export default ExploreDefaultRail
