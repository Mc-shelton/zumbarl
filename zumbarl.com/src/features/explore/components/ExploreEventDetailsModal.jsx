import { FiCalendar, FiClock, FiMapPin, FiNavigation, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

function ExploreEventDetailsModal({ post, onClose }) {
  const isOpen = Boolean(post?.event)
  const dialogRef = useDialog({ isOpen, onClose })
  if (!isOpen) return null
  const event = post.event
  const mapUrl = event.latitude != null && event.longitude != null ? `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=17/${event.latitude}/${event.longitude}` : null
  return <section ref={dialogRef} className="explore-event-details-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-details-title" onClick={onClose}>
    <article className="explore-event-details-modal" onClick={(clickEvent) => clickEvent.stopPropagation()}>
      <button type="button" className="explore-event-details-close" onClick={onClose} aria-label="Close event details"><FiX /></button>
      {post.gallery?.[0] ? <div className="explore-event-details-cover"><img src={post.gallery[0]} alt="" style={{ objectPosition: `${post.mediaEdits?.[0]?.positionX ?? 50}% ${post.mediaEdits?.[0]?.positionY ?? 50}%`, transform: `scale(${post.mediaEdits?.[0]?.zoom || 1})` }} /></div> : null}
      <div className="explore-event-details-body">
        <span className="explore-event-details-kicker">Campus event</span><h2 id="event-details-title">{event.title}</h2><p>{post.copy}</p>
        <div className="explore-event-details-meta"><span><FiCalendar />{new Date(event.startsAt).toLocaleDateString('en-KE', { dateStyle: 'full' })}</span><span><FiClock />{new Date(event.startsAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}{event.endsAt ? ` – ${new Date(event.endsAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : ''}</span><span><FiMapPin />{event.location}</span></div>
        <div className="explore-event-details-organizer"><span>Organized by</span><div><img src={event.organizer?.avatarUrl || post.avatar || '/assets/index/bee_nobg.png'} alt="" /><p><strong>{event.organizer?.name || post.author}</strong><small>{event.organizer?.handle || post.handle}</small></p></div></div>
        <footer>{mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer"><FiNavigation /> View exact pin</a> : null}<button type="button">Interested</button><button type="button" className="is-primary">Going</button></footer>
      </div>
    </article>
  </section>
}
export default ExploreEventDetailsModal
