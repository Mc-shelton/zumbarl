import { FiArrowRight, FiBookOpen, FiBriefcase, FiHeart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

const floatingIconRegistry = {
  book: FiBookOpen,
  briefcase: FiBriefcase,
  heart: FiHeart,
}

function CampusHeroPanel({
  chatMessages,
  chatMode,
  discoveryChips,
  discoverySuggestions,
  hero,
  heroCardRef,
  onResetChat,
}) {
  if (!hero && !chatMode) {
    return null
  }

  const heroChips = Array.isArray(hero?.chips) ? hero.chips : []
  const floatingIcons = Array.isArray(hero?.floatingIcons) ? hero.floatingIcons : []
  const phoneImage = normalizeZumbarlFileUrl(hero?.image ?? hero?.thumbnail)

  return (
    <article ref={heroCardRef} className={`campus-hero-card${chatMode ? ' is-chat-mode' : ''}`}>
      {!chatMode ? (
        <section className="campus-splash-panel" aria-label="Campus splash">
          <div className="campus-hero-copy">
            <p className="campus-kicker">
              <span className="growth-cta-highlight">{hero.kickerStart}</span>, {hero.kickerMiddle}{' '}
              <span className="growth-cta-highlight growth-cta-underlined-dark">{hero.kickerEnd}</span>
            </p>
            <h2>
              {hero.headline}<br /> <span className="x_wd_yellow_highlight_bold_05">{hero.highlight}</span>
            </h2>
            <p>{hero.description}</p>
            <div className="campus-chip-row" role="list" aria-label="Student goals">
              {heroChips.map((chip) => (
                <span key={chip.label} className={`campus-chip chip-${chip.tone}`}>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
          <div className="campus-phone-scene" aria-hidden="true">
            <div className="campus-orbit" />
            <div className="campus-orbit orbit-two" />
            <div className="campus-phone">
              {phoneImage ? <img src={phoneImage} alt="" /> : null}
              <p>{hero.phoneLabel}</p>
            </div>
            {floatingIcons.map((iconName, index) => {
              const Icon = floatingIconRegistry[iconName] ?? FiBookOpen
              const tones = ['purple', 'green', 'orange', 'pink']
              return (
                <div key={`${iconName}-${index}`} className={`campus-floating-icon icon-${tones[index % tones.length]}`}>
                  <Icon />
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="campus-chat-panel" aria-label="AI search conversation">
          <header className="campus-chat-head">
            <div>
              <p>{hero?.chatTitle}</p>
              <span>{hero?.chatSubtitle}</span>
            </div>
            <button type="button" className="campus-link-btn" onClick={onResetChat}>
              {hero?.backLabel}
            </button>
          </header>
          <div className="campus-chat-thread" aria-live="polite">
            {chatMessages.map((message) => (
              <article
                key={message.id}
                className={`campus-chat-bubble${message.role === 'user' ? ' is-user' : ' is-assistant'}${message.pending ? ' is-pending' : ''}`}
              >
                <span>{message.role === 'user' ? 'You' : 'Zumbarl AI'}</span>
                {message.pending ? (
                  <p className="campus-chat-typing" aria-label="Zumbarl AI is searching">
                    <span className="campus-chat-typing-dot" />
                    <span className="campus-chat-typing-dot" />
                    <span className="campus-chat-typing-dot" />
                  </p>
                ) : (
                  <p>{message.content}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <aside className="campus-discovery-panel" aria-label="Smart suggestions">
        <div className="campus-discovery-head">
          <h3>{chatMode ? hero?.chatSuggestionsLabel : hero?.quickStartTitle}</h3>
          <p>
            {chatMode
              ? hero?.chatSuggestionsSubtitle
              : hero?.quickStartSubtitle}
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
          {discoverySuggestions.map((item) => {
            const Card = item.href ? Link : 'article'
            return (
            <Card key={item.id} className="campus-discovery-card" {...(item.href ? { to: item.href } : {})}>
              <p className="campus-discovery-type">{item.type}</p>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              {item.actionLabel || item.value ? (
                <span>
                  {item.actionLabel ?? item.value}
                  <FiArrowRight aria-hidden="true" />
                </span>
              ) : null}
            </Card>
          )})}
        </div>
      </aside>
    </article>
  )
}

export default CampusHeroPanel
