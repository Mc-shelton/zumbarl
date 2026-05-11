import { useEffect, useState } from 'react'
import {
  DOC_APPS_FOR_GRID,
  EXPLAINER_VIDEO_LENGTH,
  EXPLAINER_VIDEO_SRC,
  EXPLAINER_VIDEO_TITLE,
} from '../../features/home/constants'

export default function AppsWall() {
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
    <section className="apps-wall">
      <div className="container">
        <div className="event-pill">
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

        <div className="apps-grid">
          {DOC_APPS_FOR_GRID.map((app) => {
            const Icon = app.icon

            return (
              <a key={app.id || app.name} href={app.href} className="app-entry">
                <figure>
                  <span
                    className="app-icon"
                    style={{
                      color: app.iconColor,
                    }}
                    aria-hidden="true"
                  >
                    <Icon strokeWidth={1} />
                  </span>
                  <figcaption>{app.name}</figcaption>
                </figure>
              </a>
            )
          })}
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
