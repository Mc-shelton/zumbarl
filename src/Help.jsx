import {
  HiOutlineArrowUpRight,
  HiOutlineBugAnt,
  HiOutlineCalendarDays,
  HiOutlinePaperAirplane,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import './App.css'
import Header from './components/home/Header'

const CONTACT_ACTIONS = [
  { label: 'Meet an advisor', href: 'appointment.html', Icon: HiOutlineCalendarDays },
  { label: 'Request developments', href: 'page/developers-on-demand.html', Icon: HiOutlineArrowUpRight },
  { label: 'Become a partner', href: 'become-a-partner.html', Icon: HiOutlineUserGroup },
  { label: 'Report a bug', href: 'https://github.com/zumbarl/zumbarl/issues', Icon: HiOutlineBugAnt, external: true },
]

const EMERGENCY_LINES = [
  { region: 'Kenya', phone: '+254 716 225 073' },
  { region: 'East Africa', phone: '+254 700 123 456' },
  { region: 'Europe', phone: '+32 2 616 80 02' },
  { region: 'Middle East', phone: '+971 4 498 7800' },
  { region: 'Asia', phone: '+91 79 40 500 100' },
]

function Help() {
  return (
    <main className="page help-page">
      <Header />

      <section className="help-hero">
        <div className="container help-hero-inner">
          <h1 className="help-title">Need help?</h1>

          <div className="help-search-row">
            <form className="help-search-form" action="#" method="get">
              <label htmlFor="help-query" className="help-visually-hidden">
                Ask Zumbarl AI
              </label>
              <input id="help-query" name="q" type="text" placeholder="Ask Zumbarl AI" />
              <button type="submit" aria-label="Send question">
                <HiOutlinePaperAirplane aria-hidden="true" />
              </button>
            </form>

            <span className="help-search-divider">or</span>
            <a className="help-human-btn" href="contactus.html">
              Ask a human
            </a>
          </div>
        </div>
      </section>

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
    </main>
  )
}

export default Help
