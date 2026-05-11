import { CONTACT_ACTIONS, EMERGENCY_LINES } from '../../features/help/constants'

function HelpContactSection() {
  return (
    <section className="help-contact-section">
      <div className="container help-contact-inner">
        <h2 className="help-subtitle">Contact us</h2>

        <div className="help-contact-grid">
          {CONTACT_ACTIONS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="help-action-card"
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer noopener' : undefined}
            >
              <item.Icon className="help-action-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
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
      </div>
    </section>
  )
}

export default HelpContactSection
