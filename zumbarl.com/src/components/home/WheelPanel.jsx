import { QUOTE_AVATAR, WHEEL_TOPICS } from '../../features/home/constants'

function WheelPanel({ activeIndex }) {
  return (
    <aside className="wheel-panel" aria-label="Focus area details">
      <article className="wheel-panel-quote" aria-label="Quote">
        <WheelQuoteBubble />

        <div className="wheel-panel-quote-card">
          <img className="wheel-panel-quote-avatar" src={QUOTE_AVATAR} alt="Zumbarl bee mark" loading="lazy" />
          <p className="wheel-panel-quote-text">Education&apos;s a dress rehearsal for a life that is yours to lead.</p>
          <p className="wheel-panel-quote-author">- Nora Ephron, Writer.</p>
        </div>
      </article>

      <h3 className="wheel-panel-title">
        <span className="wheel-panel-title-brush">Lets&apos; Tour</span> you out.
      </h3>

      <div className="wheel-topics">
        {WHEEL_TOPICS.map((topic, index) => {
          const isActive = index === activeIndex
          const isDone = index < activeIndex
          const topicClassName = `wheel-topic${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`

          return (
            <article key={topic.label} className={topicClassName}>
              <span className="wheel-topic-index">{`0${index + 1}`}</span>
              <h4>{topic.label}</h4>
              <p>{topic.description}</p>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

function WheelQuoteBubble() {
  return (
    <svg className="wheel-quote-bubble" viewBox="0 0 84 66" aria-hidden="true">
      <path
        d="M38.5 58c-16.9 0-30.6-11.6-30.6-25.9S21.6 6.2 38.5 6.2s30.6 11.6 30.6 25.9S55.4 58 38.5 58Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m17.1 51.6-5.8 11.1 12.4-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31.2" cy="30.3" r="2.6" fill="currentColor" />
      <circle cx="42.4" cy="30.3" r="2.6" fill="currentColor" />
      <path
        d="M28.7 39.3c5.6 3.6 15.1 3.6 20.7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default WheelPanel
