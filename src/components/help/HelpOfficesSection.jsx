import { HiOutlinePhone } from 'react-icons/hi2'
import { CUMPUS_HUBS, OFFICE_LOCATIONS, OFFICES_REGION } from '../../features/help/constants'

function HelpOfficesSection() {
  return (
    <section className="help-offices-section">
      <div className="container help-contact-inner">
        <h2 className="help-offices-title">Find Zumbarl.</h2>
        <p className="help-offices-region">{OFFICES_REGION}</p>

        <div className="help-offices-grid">
          {OFFICE_LOCATIONS.map((office) => (
            <article key={office.name} className="help-office-card">
              <h3 className="help-office-name">
                <span className="help-office-flag" aria-hidden="true">
                  {office.flag}
                </span>
                <span>{office.name}</span>
              </h3>

              <div className="help-office-tags" aria-label={`${office.name} teams`}>
                {office.tags.map((tag) => (
                  <span key={`${office.name}-${tag.label}`} className={`help-office-tag help-office-tag--${tag.tone}`}>
                    {tag.label}
                  </span>
                ))}
              </div>

              <address className="help-office-address">
                {office.address.map((line) => (
                  <span key={`${office.name}-${line}`}>{line}</span>
                ))}
              </address>

              {office.phone ? (
                <p className="help-office-phone">
                  <HiOutlinePhone aria-hidden="true" />
                  <a href={`tel:${office.phone.replace(/\s+/g, '')}`}>{office.phone}</a>
                  {office.phoneNote ? <span className="help-office-note">({office.phoneNote})</span> : null}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        <br />
        <br />
        <br />
        <p className="help-offices-region">Campus Hubs</p>

        <div className="help-offices-grid">
          {CUMPUS_HUBS.map((office) => (
            <article key={office.name} className="help-office-card">
              <h3 className="help-office-name">
                <span className="help-office-flag" aria-hidden="true">
                  {office.flag}
                </span>
                <span>{office.name}</span>
              </h3>

              <div className="help-office-tags" aria-label={`${office.name} teams`}>
                {office.tags.map((tag) => (
                  <span key={`${office.name}-${tag.label}`} className={`help-office-tag help-office-tag--${tag.tone}`}>
                    {tag.label}
                  </span>
                ))}
              </div>

              <address className="help-office-address">
                {office.address.map((line) => (
                  <span key={`${office.name}-${line}`}>{line}</span>
                ))}
              </address>

              {office.phone ? (
                <p className="help-office-phone">
                  <HiOutlinePhone aria-hidden="true" />
                  <a href={`tel:${office.phone.replace(/\s+/g, '')}`}>{office.phone}</a>
                  {office.phoneNote ? <span className="help-office-note">({office.phoneNote})</span> : null}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HelpOfficesSection
