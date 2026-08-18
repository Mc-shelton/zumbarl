import { FiClock, FiMapPin, FiShoppingBag, FiX } from 'react-icons/fi'

function ExploreDefaultRail({ announcements, events, marketplaceItems, onOpenEvent, people }) {
  return (
    <>
      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>People You May Know</h3>
          <button type="button" className="campus-link-btn">See All</button>
        </header>

        <div className="explore-campus-people-list">
          {people.map((person) => (
            <article key={person.id} className="explore-campus-person-item">
              <div className="explore-campus-person-avatar">
                <img src="/assets/index/bee_nobg.png" alt={person.name} />
                {person.isOnline ? <span /> : null}
              </div>
              <div>
                <h4>{person.name}</h4>
                <p>{person.school}</p>
              </div>
              <button type="button" className="explore-campus-follow-btn">Follow</button>
              <button type="button" className="explore-campus-close-btn" aria-label={`Dismiss ${person.name}`}>
                <FiX aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Campus Announcements</h3>
          <button type="button" className="campus-link-btn">See All</button>
        </header>

        <div className="explore-campus-announcement-list">
          {announcements.map((announcement) => (
            <article key={announcement.id}>
              <h4>{announcement.title}</h4>
              <p>{announcement.detail}</p>
              <span>{announcement.time}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Upcoming Events</h3>
          <button type="button" className="campus-link-btn">See All</button>
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
              </div>
              <img src={event.image} alt={event.title} loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      <section className="campus-rail-card explore-campus-right-card">
        <header>
          <h3>Marketplace</h3>
          <button type="button" className="campus-link-btn">See All</button>
        </header>

        <div className="explore-campus-market-list">
          {marketplaceItems.map((item) => (
            <article key={item.id} className="explore-campus-market-item">
              <img src={item.image} alt={item.name} loading="lazy" />
              <div>
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </div>
              <button type="button" aria-label={`Open ${item.name}`}>
                <FiShoppingBag aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default ExploreDefaultRail
