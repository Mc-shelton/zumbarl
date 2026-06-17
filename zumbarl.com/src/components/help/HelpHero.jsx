import { useState } from 'react'
import { HiOutlinePaperAirplane } from 'react-icons/hi2'

function HelpHero({ onAskAi, onAskHuman }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()

    if (!trimmed) {
      return
    }

    onAskAi?.(trimmed)
    setQuery('')
  }

  return (
    <section className="help-hero">
      <div className="container help-hero-inner">
        <h1 className="help-title">Need help?</h1>

        <div className="help-search-row">
          <form className="help-search-form" onSubmit={handleSubmit}>
            <label htmlFor="help-query" className="help-visually-hidden">
              Ask Tonnie AI
            </label>
            <input
              id="help-query"
              name="q"
              type="text"
              placeholder="Ask Tonnie - Zumbarl AI"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="Send question">
              <HiOutlinePaperAirplane aria-hidden="true" />
            </button>
          </form>

          <span className="help-search-divider">or</span>
          <button type="button" className="help-human-btn" onClick={onAskHuman}>
            Ask a human
          </button>
        </div>
      </div>
    </section>
  )
}

export default HelpHero
