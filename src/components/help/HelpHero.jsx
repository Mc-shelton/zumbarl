import { HiOutlinePaperAirplane } from 'react-icons/hi2'

function HelpHero() {
  return (
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
  )
}

export default HelpHero
