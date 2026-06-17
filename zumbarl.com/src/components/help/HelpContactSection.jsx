import { useState } from 'react'
import { CONTACT_ACTIONS, EMERGENCY_LINES } from '../../features/help/constants'

function HelpContactSection() {
  const [activeAction, setActiveAction] = useState(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleActionClick = (item) => {
    setSent(false)
    setEmail('')
    setMessage('')
    setActiveAction((current) => (current?.label === item.label ? null : item))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!activeAction || !email.trim() || !message.trim()) {
      return
    }

    setSent(true)
    setMessage('')
  }

  return (
    <section className="help-contact-section">
      <div className="container help-contact-inner">
        <h2 className="help-subtitle">Contact us</h2>

        <div className="help-contact-grid">
          {CONTACT_ACTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`help-action-card help-action-card-button${activeAction?.label === item.label ? ' is-active' : ''}`}
              onClick={() => handleActionClick(item)}
            >
              <item.Icon className="help-action-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
          <article className="help-emergency-card">
            <h3>Emergency lines</h3>
            <ul>
              {EMERGENCY_LINES.map((line) => (
                <li key={line.region}>
                  <span>{line.region}</span>
                  <a href={`tel:${line.phone.replace(/\s+/g, '')}`}>{line.phone}</a>
                </li>
              ))}
            </ul>
          </article>
        </div>

        {activeAction ? (
          <form key={activeAction.label} className="help-contact-form" onSubmit={handleSubmit}>
            <div className="help-contact-form-head">
              <h3>{activeAction.label}</h3>
              <p>Tell us what you need and we will route it to the right team.</p>
            </div>

            <div className="help-contact-form-fields">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="help-contact-form-message">
                <span>Message</span>
                <textarea
                  placeholder={`Describe your ${activeAction.label.toLowerCase()} request...`}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="help-contact-form-actions">
              <button type="submit">Send</button>
              {sent ? <p className="help-contact-form-status">Request sent. We will get back to you shortly.</p> : null}
            </div>
          </form>
        ) : null}
      </div>
    </section>
  )
}

export default HelpContactSection
