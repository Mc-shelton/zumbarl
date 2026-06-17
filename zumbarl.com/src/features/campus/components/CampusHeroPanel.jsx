import { FiArrowRight, FiBookOpen, FiBriefcase, FiHeart } from 'react-icons/fi'

function CampusHeroPanel({
  chatMessages,
  chatMode,
  discoveryChips,
  discoverySuggestions,
  heroCardRef,
  onResetChat,
}) {
  return (
    <article ref={heroCardRef} className={`campus-hero-card${chatMode ? ' is-chat-mode' : ''}`}>
      {!chatMode ? (
        <section className="campus-splash-panel" aria-label="Campus splash">
          <div className="campus-hero-copy">
            <p className="campus-kicker">
              <span className="growth-cta-highlight">simple</span>, sure{' '}
              <span className="growth-cta-highlight growth-cta-underlined-dark">growth</span>
            </p>
            <h2>
              Let me help you find things<br /> <span className="x_wd_yellow_highlight_bold_05">around!</span>
            </h2>
            <p>Earn, learn, connect, grow and thrive in your student journey at Zumbarl.</p>
            <div className="campus-chip-row" role="list" aria-label="Student goals">
              <span className="campus-chip chip-earn">Earn</span>
              <span className="campus-chip chip-learn">Learn</span>
              <span className="campus-chip chip-connect">Connect</span>
              <span className="campus-chip chip-grow">Grow</span>
            </div>
          </div>
          <div className="campus-phone-scene" aria-hidden="true">
            <div className="campus-orbit" />
            <div className="campus-orbit orbit-two" />
            <div className="campus-phone">
              <img src="/assets/index/bee_nobg.png" alt="zumbarl logo" />
              <p>zumbarl</p>
            </div>
            <div className="campus-floating-icon icon-purple">
              <FiBriefcase />
            </div>
            <div className="campus-floating-icon icon-green">
              <FiBookOpen />
            </div>
            <div className="campus-floating-icon icon-orange">
              <FiBookOpen />
            </div>
            <div className="campus-floating-icon icon-pink">
              <FiHeart />
            </div>
          </div>
        </section>
      ) : (
        <section className="campus-chat-panel" aria-label="AI search conversation">
          <header className="campus-chat-head">
            <div>
              <p>Zumbarl AI Assistant</p>
              <span>Type naturally and discover apps, products, people, books and gigs.</span>
            </div>
            <button type="button" className="campus-link-btn" onClick={onResetChat}>
              Back to splash
            </button>
          </header>
          <div className="campus-chat-thread" aria-live="polite">
            {chatMessages.map((message) => (
              <article
                key={message.id}
                className={`campus-chat-bubble${message.role === 'user' ? ' is-user' : ' is-assistant'}`}
              >
                <span>{message.role === 'user' ? 'You' : 'Zumbarl AI'}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <aside className="campus-discovery-panel" aria-label="Smart suggestions">
        <div className="campus-discovery-head">
          <h3>{chatMode ? 'Suggestions' : 'Quick start'}</h3>
          <p>
            {chatMode
              ? 'Based on: chat'
              : 'Apps, products, people, books, gigs and services.'}
          </p>
        </div>
        <div className="campus-discovery-chip-row" role="list" aria-label="Suggestion categories">
          {discoveryChips.map((chip) => (
            <span key={chip} className="campus-discovery-chip">
              {chip}
            </span>
          ))}
        </div>
        <div className="campus-discovery-grid">
          {discoverySuggestions.map((item) => (
            <article key={item.id} className="campus-discovery-card">
              <p className="campus-discovery-type">{item.type}</p>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <span>
                Explore
                <FiArrowRight aria-hidden="true" />
              </span>
            </article>
          ))}
        </div>
      </aside>
    </article>
  )
}

export default CampusHeroPanel
