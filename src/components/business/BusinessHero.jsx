import { useEffect, useState } from 'react'
import { BUSINESS_PAGE_TITLE } from '../../features/business/constants'
import { EXPLAINER_VIDEO_LENGTH, EXPLAINER_VIDEO_SRC, EXPLAINER_VIDEO_TITLE } from '../../features/home/constants'

function BusinessHero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  useEffect(() => {
    if (!isVideoOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsVideoOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isVideoOpen])

  return (
    <section className="business-hero">
      <div className="container business-hero-inner">
        <h1 className="business-title">{BUSINESS_PAGE_TITLE}</h1>

        <div className="event-pill business-explainer-pill">
          <span className="event-flag-fallback" aria-hidden="true">
            <svg className="event-play-glyph" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3.2 2.2 9.4 6 3.2 9.8V2.2Z" fill="currentColor" />
            </svg>
          </span>
          <span className="event-title">{EXPLAINER_VIDEO_TITLE}</span>
          <span className="event-date">{EXPLAINER_VIDEO_LENGTH}</span>
          <button type="button" className="event-link event-play-btn" onClick={() => setIsVideoOpen(true)}>
            Play ⟶
          </button>
        </div>
      </div>

      {isVideoOpen && (
        <div
          className="video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={EXPLAINER_VIDEO_TITLE}
          onClick={() => setIsVideoOpen(false)}
        >
          <div className="video-modal-card" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="video-modal-close"
              aria-label="Close video"
              onClick={() => setIsVideoOpen(false)}
            >
              ×
            </button>
            <video className="video-modal-player" controls autoPlay playsInline src={EXPLAINER_VIDEO_SRC}>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </section>
  )
}

export default BusinessHero
