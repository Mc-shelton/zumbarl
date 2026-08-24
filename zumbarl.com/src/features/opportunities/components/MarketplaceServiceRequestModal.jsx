import { useState } from 'react'
import { FiCalendar, FiClock, FiX } from 'react-icons/fi'

function MarketplaceServiceRequestModal({ isPending, item, onClose, onSubmit }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const isOrderAhead = item.serviceMode === 'order_ahead'

  return (
    <div className="marketplace-service-request-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="marketplace-service-request-modal" role="dialog" aria-modal="true" aria-labelledby="marketplace-service-request-title">
        <header>
          <div><span>{isOrderAhead ? 'Order ahead' : 'Book a service'}</span><h2 id="marketplace-service-request-title">{item.title}</h2></div>
          <button type="button" aria-label="Close" onClick={onClose}><FiX aria-hidden="true" /></button>
        </header>
        <p>{isOrderAhead ? 'Tell the provider when you want to collect your order.' : 'Request an available time. The provider will confirm it before fulfilment.'}</p>
        <div>
          {!isOrderAhead ? <label><span><FiCalendar aria-hidden="true" /> Preferred date</span><input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label> : null}
          <label><span><FiClock aria-hidden="true" /> {isOrderAhead ? 'Pickup time' : 'Preferred time'}</span><input type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></label>
          <label className="is-wide"><span>Notes for the provider</span><textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={isOrderAhead ? 'Meal choices, allergies or pickup instructions…' : 'What you need, preferred style or anything the provider should prepare…'} /></label>
        </div>
        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="is-primary" disabled={isPending || !time || (!isOrderAhead && !date)} onClick={() => onSubmit({ mode: item.serviceMode, date: date || undefined, time, notes: notes.trim() || undefined })}>{isPending ? 'Saving…' : (isOrderAhead ? 'Continue to checkout' : 'Continue with booking')}</button>
        </footer>
      </section>
    </div>
  )
}

export default MarketplaceServiceRequestModal
