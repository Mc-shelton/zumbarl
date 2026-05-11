import { useEffect, useMemo, useRef, useState } from 'react'
import {
  HERO_DOODLE,
  QUOTE_AVATAR,
  WHEEL_IMAGE,
  WHEEL_TOPICS,
  clamp,
} from '../../features/home/constants'

export default function WheelStory() {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const sectionNode = sectionRef.current

    if (!sectionNode) {
      return undefined
    }

    let frameId = 0

    const updateProgress = () => {
      frameId = 0
      const viewportHeight = window.innerHeight || 1
      const rect = sectionNode.getBoundingClientRect()
      const maxScrollable = Math.max(sectionNode.offsetHeight - viewportHeight, 1)
      const scrolledDistance = clamp(-rect.top, 0, maxScrollable)
      const nextProgress = scrolledDistance / maxScrollable

      setProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current))
    }

    const onChange = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateProgress)
      }
    }

    onChange()
    window.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange)

    return () => {
      window.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  const wheelRotation = useMemo(() => clamp((progress - 0.06) / 0.78) * 320, [progress])
  const detailsProgress = useMemo(() => clamp((progress - 0.24) / 0.68), [progress])
  const activeIndex = useMemo(() => {
    const scaled = Math.floor(detailsProgress * WHEEL_TOPICS.length)
    return Math.min(WHEEL_TOPICS.length - 1, Math.max(0, scaled))
  }, [detailsProgress])
  const getCalloutState = (step) => {
    if (step === activeIndex) {
      return 'is-active'
    }
    if (step < activeIndex) {
      return 'is-done'
    }
    return 'is-upcoming'
  }

  return (
    <section className="wheel-story" ref={sectionRef} aria-label="Zumbarl growth wheel">
      <div className="wheel-story-sticky">
        <div className="container wheel-story-layout">
          <div className="wheel-stage">
            <div className="wheel-viewport">
              <div
                className="topic-wheel"
                style={{
                  '--wheel-rotation': `${wheelRotation.toFixed(2)}deg`,
                }}
              >
                <img className="topic-wheel-image" src={WHEEL_IMAGE} alt="" aria-hidden="true" loading="lazy" />
                <div className="topic-wheel-core">
                  <span className="topic-wheel-wordmark">zumbarl.</span>
                </div>

                <div className={`wheel-callout wheel-callout-top ${getCalloutState(0)}`}>
                  <span>Campus Jobs</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-right ${getCalloutState(1)}`}>
                  <span>Student Commerce</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-bottom ${getCalloutState(2)}`}>
                  <span>Smart Communities</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-left ${getCalloutState(3)}`}>
                  <span>Career Momentum</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-left-echo wheel-callout-left-echo-top ${getCalloutState(0)}`}>
                  <span>Campus Support</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-left-echo wheel-callout-left-echo-mid ${getCalloutState(1)}`}>
                  <span>Peer Network</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    loading="lazy"
                  />
                </div>

                <div
                  className={`wheel-callout wheel-callout-left-echo wheel-callout-left-echo-bottom ${getCalloutState(2)}`}
                >
                  <span>Opportunity Flow</span>
                  <img
                    className="wheel-callout-arrow wheel-callout-arrow-doodle"
                    src={HERO_DOODLE}
                    alt=""
                    loading="lazy"
                  />
                </div>

                <div className={`wheel-callout wheel-callout-top-echo-left ${getCalloutState(0)}`}>
                  <span>Financial Aid</span>
                </div>

                <div className={`wheel-callout wheel-callout-top-echo-mid ${getCalloutState(0)}`}>
                  <span>Events & Culture</span>
                </div>

                <div className={`wheel-callout wheel-callout-right-echo-top ${getCalloutState(1)}`}>
                  <span>Learning Tools</span>
                </div>

                <div className={`wheel-callout wheel-callout-right-echo-bottom ${getCalloutState(2)}`}>
                  <span>Wellness & Safety</span>
                </div>

                <div className={`wheel-callout wheel-callout-bottom-echo-mid ${getCalloutState(2)}`}>
                  <span>Transport & Mobility</span>
                </div>

                <div className={`wheel-callout wheel-callout-bottom-echo-left ${getCalloutState(3)}`}>
                  <span>Housing & Meals</span>
                </div>

                <div className={`wheel-callout wheel-callout-left-echo-low ${getCalloutState(3)}`}>
                  <span>Founder Labs</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="wheel-panel" aria-label="Focus area details">
            <article className="wheel-panel-quote" aria-label="Quote">
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

              <div className="wheel-panel-quote-card">
                <img className="wheel-panel-quote-avatar" src={QUOTE_AVATAR} alt="Zumbarl bee mark" loading="lazy" />
                <p className="wheel-panel-quote-text">Ninety percent of life is just showing up.</p>
                <p className="wheel-panel-quote-author">- Shellton Kiage, Advent Band.</p>
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
        </div>
      </div>
    </section>
  )
}
