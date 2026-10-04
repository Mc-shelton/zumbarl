import { FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiHeadphones, FiMapPin, FiNavigation, FiShare2, FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDialog } from '../../../components/ui'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { creatorProfilePath, postCreatorProfilePath } from '../utils/creatorProfilePath'

const INITIAL_CLOCK_TIME = Date.now()

function ExploreEventDetailsModal({ error = '', isResponding = false, post, onClose, onRespond, onSharePost }) {
  const isOpen = Boolean(post?.event)
  const dialogRef = useDialog({ isOpen, onClose })
  const [now, setNow] = useState(INITIAL_CLOCK_TIME)
  useEffect(() => {
    if (!isOpen) return undefined
    const timeoutId = window.setTimeout(() => setNow(Date.now()), 0)
    const intervalId = window.setInterval(() => setNow(Date.now()), 30000)
    return () => { window.clearTimeout(timeoutId); window.clearInterval(intervalId) }
  }, [isOpen])
  if (!isOpen) return null
  const event = post.event
  const viewerResponse = event.viewerResponse || null
  const goingCount = Number(event.goingCount || 0)
  const interestedCount = Number(event.interestedCount || 0)
  const capacity = Number(event.capacity) > 0 ? Number(event.capacity) : null
  const mapUrl = event.latitude != null && event.longitude != null ? `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=17/${event.latitude}/${event.longitude}` : null
  const startsAt = new Date(event.startsAt).getTime()
  const endsAt = event.endsAt ? new Date(event.endsAt).getTime() : startsAt + 7200000
  const meetingLive = Number.isFinite(startsAt) && now >= startsAt && now <= endsAt
  const eventEnded = Number.isFinite(endsAt) && now > endsAt
  const canJoinCall = Boolean(event.meetingPath && meetingLive)
  const eventState = meetingLive ? 'Live now' : eventEnded ? 'Past event' : 'Upcoming'
  const organizer = event.organizer || {}
  const organizerName = organizer.name || post.author
  const organizerHandle = organizer.handle || post.handle
  const organizerPath = creatorProfilePath({
    id: organizer.id,
    slug: organizer.slug,
    profileType: organizer.profileType || organizer.type,
    handle: organizer.handle,
  }) || postCreatorProfilePath(post)
  const organizerContent = <>
    <img src={normalizeZumbarlFileUrl(organizer.avatarUrl || post.avatar) || '/assets/index/bee_nobg.png'} alt="" />
    <p><strong>{organizerName}</strong><small>{organizerHandle}</small></p>
    {organizerPath ? <FiArrowUpRight aria-hidden="true" /> : null}
  </>
  const respond = (status) => {
    if (!eventEnded) onRespond?.(post, viewerResponse === status ? 'CANCELLED' : status)
  }
  const startsDate = new Date(event.startsAt)
  const hasValidStart = !Number.isNaN(startsDate.getTime())
  const endsDate = event.endsAt ? new Date(event.endsAt) : null

  return <section ref={dialogRef} className="explore-event-details-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-details-title" onClick={onClose}>
    <article className="explore-event-details-modal" onClick={(clickEvent) => clickEvent.stopPropagation()}>
      <button type="button" className="explore-event-details-close" onClick={onClose} aria-label="Close event details"><FiX /></button>
      <div className="explore-event-details-cover">
        {post.gallery?.[0]
          ? <img src={normalizeZumbarlFileUrl(post.gallery[0])} alt="" style={{ objectPosition: `${post.mediaEdits?.[0]?.positionX ?? 50}% ${post.mediaEdits?.[0]?.positionY ?? 50}%`, transform: `scale(${post.mediaEdits?.[0]?.zoom || 1})` }} />
          : <div className="explore-event-details-cover-placeholder"><img src="/assets/index/bee_nobg.png" alt="" /><span>Campus moments, powered by Zumbarl.</span></div>}
        <span className={`explore-event-details-state is-${eventEnded ? 'past' : meetingLive ? 'live' : 'upcoming'}`}>{eventState}</span>
      </div>
      <div className="explore-event-details-body">
        <div className="explore-event-details-heading">
          <span className="explore-event-details-kicker"><img src="/assets/index/bee_nobg.png" alt="" /> Zumbarl campus event</span>
          <h2 id="event-details-title">{event.title}</h2>
          <p>{post.copy}</p>
        </div>
        <div className="explore-event-details-meta">
          <span><i><FiCalendar /></i><small>Date</small><strong>{hasValidStart ? startsDate.toLocaleDateString('en-KE', { dateStyle: 'full' }) : 'To be confirmed'}</strong></span>
          <span><i><FiClock /></i><small>Time</small><strong>{hasValidStart ? startsDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : 'To be confirmed'}{endsDate && !Number.isNaN(endsDate.getTime()) ? ` – ${endsDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : ''}</strong></span>
          <span><i><FiMapPin /></i><small>Location</small><strong>{event.location || 'To be confirmed'}</strong></span>
        </div>
        <div className="explore-event-details-organizer">
          <span>Organized by</span>
          {organizerPath
            ? <Link to={organizerPath} onClick={onClose} aria-label={`View ${organizerName}'s profile`}>{organizerContent}</Link>
            : <div>{organizerContent}</div>}
        </div>
        <div className="explore-event-response-summary" aria-live="polite">
          {goingCount > 0 ? <strong>{capacity ? `${goingCount}/${capacity}` : goingCount} reserved</strong> : null}
          {goingCount > 0 && interestedCount > 0 ? <span aria-hidden="true">·</span> : null}
          {interestedCount > 0 ? <span>{interestedCount} interested</span> : null}
          {!goingCount && !interestedCount ? <span>No responses yet</span> : null}
        </div>
        {error ? <p className="explore-event-response-error" role="alert">{error}</p> : null}
        <footer>
          {mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer"><FiNavigation /> View exact pin</a> : null}
          <button type="button" onClick={() => onSharePost(post)}><FiShare2 /> Share</button>
          {!eventEnded ? <button type="button" className={viewerResponse === 'INTERESTED' ? 'is-selected' : ''} aria-pressed={viewerResponse === 'INTERESTED'} disabled={isResponding} onClick={() => respond('INTERESTED')}>{viewerResponse === 'INTERESTED' ? <FiCheck /> : null} Interested</button> : null}
          {!eventEnded ? <button type="button" className={`is-primary${viewerResponse === 'GOING' ? ' is-selected' : ''}`} aria-pressed={viewerResponse === 'GOING'} disabled={isResponding} onClick={() => respond('GOING')}>{viewerResponse === 'GOING' ? <FiCheck /> : null} Going</button> : <span className="explore-event-details-ended">This event has ended</span>}
          {canJoinCall ? <a className="is-primary" href={event.meetingPath}><FiHeadphones /> Join Zumbarl call</a> : null}
        </footer>
      </div>
    </article>
  </section>
}
export default ExploreEventDetailsModal
