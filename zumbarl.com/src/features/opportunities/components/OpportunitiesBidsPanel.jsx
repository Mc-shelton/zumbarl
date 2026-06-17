import { FiClock, FiMoreVertical } from 'react-icons/fi'
import {
  BID_PROGRESS_POINT_COUNT,
  getBidProgressPointIndex,
} from '../constants'

function handleKeyboardActivation(event, onActivate) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function OpportunitiesBidsPanel({
  bids = [],
  onBidSelect,
  onOpenProject,
  selectedBidId,
}) {
  return (
    <section className="opportunities-list-section opportunities-bids-section" aria-label="My bids">
      <div className="opportunities-section-head">
        <div>
          <h2>My Bids</h2>
          <p>Track bid progress, client activity and response timelines.</p>
        </div>
        <button type="button" className="campus-link-btn">View all bids</button>
      </div>

      <div className="opportunities-bid-grid">
        {bids.map((bid) => {
          const activeProgressPoint = getBidProgressPointIndex(bid.progress)
          const activeProgressWidth = (activeProgressPoint / (BID_PROGRESS_POINT_COUNT - 1)) * 100

          return (
            <article
              key={bid.id}
              className={`opportunities-bid-card${selectedBidId === bid.id ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedBidId === bid.id}
              onClick={() => onBidSelect(bid.id)}
              onKeyDown={(event) => handleKeyboardActivation(event, () => onBidSelect(bid.id))}
            >
              <div className="opportunities-bid-thumb">
                <span className={`opportunities-bid-status-chip ${bid.statusTone}`}>{bid.status}</span>
                <button type="button" className="opportunities-bid-more" aria-label={`${bid.title} actions`}>
                  <FiMoreVertical aria-hidden="true" />
                </button>
                <img src={bid.image} alt={`${bid.title} cover`} loading="lazy" />
              </div>

              <div className="opportunities-bid-body">
                <p className="opportunities-bid-category">
                  {bid.category}
                  {bid.intentLabel ? ` · ${bid.intentLabel}` : ''}
                </p>
                <h3>{bid.title}</h3>
                <p className="opportunities-bid-description">{bid.description}</p>

                <div className="opportunities-bid-meta-grid">
                  <article>
                    <p>Bid Amount</p>
                    <strong>{bid.bidAmount}</strong>
                  </article>
                  <article>
                    <p>Submitted</p>
                    <strong>{bid.submitted}</strong>
                  </article>
                </div>

                <div className="opportunities-bid-progress">
                  <div className="opportunities-bid-progress-head">
                    <span>{bid.stage}</span>
                    <strong>{bid.progress}%</strong>
                  </div>
                  <div
                    className="opportunities-bid-progress-track"
                    role="img"
                    aria-label={`Progress step ${activeProgressPoint + 1} of ${BID_PROGRESS_POINT_COUNT}`}
                  >
                    <span className="opportunities-bid-progress-track-line" aria-hidden="true" />
                    <span
                      className="opportunities-bid-progress-track-line is-filled"
                      aria-hidden="true"
                      style={{ width: `${activeProgressWidth}%` }}
                    />
                    <div className="opportunities-bid-progress-points" aria-hidden="true">
                      {Array.from({ length: BID_PROGRESS_POINT_COUNT }).map((_, index) => (
                        <span
                          key={`${bid.id}-progress-point-${index + 1}`}
                          className={
                            `opportunities-bid-progress-point` +
                            `${index <= activeProgressPoint ? ' is-complete' : ''}` +
                            `${index === activeProgressPoint ? ' is-current' : ''}`
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p>{bid.progressNote}</p>
                </div>

                <footer className="opportunities-bid-foot">
                  <div className="opportunities-bid-client">
                    <img src="/assets/index/bee_nobg.png" alt={`${bid.company} logo`} loading="lazy" />
                    <div>
                      <strong>{bid.client}</strong>
                      <p>{bid.company}</p>
                    </div>
                  </div>
                  <div className="opportunities-bid-presence">
                    <p>
                      <FiClock aria-hidden="true" />
                      {bid.lastSeen}
                    </p>
                    <span>{bid.responseEta}</span>
                  </div>
                </footer>

                {bid.projectId ? (
                  <button
                    type="button"
                    className="campus-link-btn opportunities-bid-project-link"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenProject({ id: bid.projectId })
                    }}
                  >
                    Open Project Workspace
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default OpportunitiesBidsPanel
