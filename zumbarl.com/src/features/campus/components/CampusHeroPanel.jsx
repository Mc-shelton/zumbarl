import { useEffect, useRef } from 'react'
import { FiArrowRight, FiCompass, FiRefreshCw, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function CampusDiscoveryPanel({ chips, suggestions, onRunSuggestion }) {
  return (
    <aside className="campus-discovery-panel" aria-label="Live campus picks">
      <header className="campus-discovery-head">
        <span className="campus-discovery-icon"><FiCompass aria-hidden="true" /></span>
        <div>
          <h3>Live around you</h3>
          <p>Fresh picks from your campus network.</p>
        </div>
        <span className="campus-live-status"><i /> Live</span>
      </header>

      <div className="campus-discovery-chip-row" aria-label="Result categories">
        {chips.map((chip) => (
          <button key={chip} type="button" className="campus-discovery-chip" onClick={() => onRunSuggestion(`Show me ${chip.toLowerCase()} options`)}>
            {chip}
          </button>
        ))}
      </div>

      <div className="campus-discovery-grid">
        {suggestions.slice(0, 4).map((item) => {
          const Card = item.href ? Link : 'article'
          return (
            <Card key={`${item.type}-${item.id}`} className="campus-discovery-card" {...(item.href ? { to: item.href } : {})}>
              <div>
                <p className="campus-discovery-type">{item.type}</p>
                <h4>{item.title}</h4>
                {item.summary ? <p>{item.summary}</p> : null}
              </div>
              {item.href ? <FiArrowRight aria-hidden="true" /> : null}
            </Card>
          )
        })}
        {!suggestions.length ? (
          <div className="campus-discovery-empty">
            <FiCompass aria-hidden="true" />
            <h4>Nothing live just yet</h4>
            <p>Ask Zumbarl to search beyond these picks.</p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function CampusHeroPanel({
  assistantPrompts,
  assistantSource,
  chatMessages,
  chatMode,
  discoveryChips,
  discoverySuggestions,
  heroCardRef,
  onResetChat,
  onRunSuggestion,
}) {
  const threadRef = useRef(null)

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [chatMessages])

  return (
    <article ref={heroCardRef} className={`campus-hero-card campus-copilot${chatMode ? ' is-chat-mode' : ''}`}>
      <section className="campus-copilot-main" aria-label="Zumbarl campus assistant">
        <header className="campus-copilot-brand">
          <span className="campus-copilot-mark"><FiZap aria-hidden="true" /></span>
          <div>
            <p>Zumbarl campus copilot</p>
            <span>{chatMode ? 'Searching live campus activity' : 'One ask. Your whole campus.'}</span>
          </div>
          {chatMode ? (
            <button type="button" className="campus-copilot-reset" onClick={onResetChat}>
              <FiRefreshCw aria-hidden="true" /> New search
            </button>
          ) : <span className="campus-copilot-ready"><i /> Ready when you are</span>}
        </header>

        {!chatMode ? (
          <div className="campus-copilot-landing">
            <div className="campus-copilot-intro">
              <p className="campus-copilot-eyebrow">Ask. Find. Move.</p>
              <h2>Your campus,<br />one ask away.</h2>
              <p>Find real gigs, people, events, services and study resources already on Zumbarl.</p>
              <div className="campus-copilot-prompts" aria-label="Quick questions">
                {assistantPrompts.slice(0, 3).map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => onRunSuggestion(suggestion)}>
                    <span>{suggestion}</span>
                    <FiArrowRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <CampusDiscoveryPanel
              chips={discoveryChips}
              suggestions={discoverySuggestions}
              onRunSuggestion={onRunSuggestion}
            />
          </div>
        ) : (
          <div ref={threadRef} className="campus-chat-thread" aria-live="polite">
            {chatMessages.map((message) => (
              <article
                key={message.id}
                className={`campus-chat-bubble${message.role === 'user' ? ' is-user' : ' is-assistant'}${message.pending ? ' is-pending' : ''}${message.hasError ? ' has-error' : ''}`}
              >
                <span>{message.role === 'user' ? 'You' : 'Zumbarl'}</span>
                {message.pending ? (
                  <p className="campus-chat-typing" aria-label="Zumbarl is searching">
                    <span className="campus-chat-typing-dot" />
                    <span className="campus-chat-typing-dot" />
                    <span className="campus-chat-typing-dot" />
                  </p>
                ) : <p>{message.content}</p>}
                {!message.pending && Array.isArray(message.results) && message.results.length ? (
                  <div className="campus-chat-results" aria-label="Results attached to this response">
                    {message.results.slice(0, 4).map((item) => {
                      const ResultCard = item.href ? Link : 'article'
                      return (
                        <ResultCard key={`${message.id}-${item.id}`} className="campus-chat-result-card" {...(item.href ? { to: item.href } : {})}>
                          <div>
                            <span>{item.type}</span>
                            <h4>{item.title}</h4>
                            {item.summary ? <p>{item.summary}</p> : null}
                          </div>
                          {item.href ? <FiArrowRight aria-hidden="true" /> : null}
                        </ResultCard>
                      )
                    })}
                  </div>
                ) : null}
                {!message.pending && Array.isArray(message.suggestions) && message.suggestions.length ? (
                  <div className="campus-chat-followups" aria-label="Suggested follow-up questions">
                    {message.suggestions.slice(0, 3).map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => onRunSuggestion(suggestion)}>{suggestion}</button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {assistantSource ? <p className="campus-assistant-source">Results checked against live Zumbarl listings</p> : null}
          </div>
        )}
      </section>
    </article>
  )
}

export default CampusHeroPanel
