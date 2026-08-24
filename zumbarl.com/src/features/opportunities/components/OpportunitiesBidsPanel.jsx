import { useEffect, useRef, useState } from 'react'
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

const BID_STATUS_FILTERS = [
  { id: 'all', label: 'All Bids', matches: () => true },
  { id: 'draft', label: 'Drafts', matches: (bid) => bid.status === 'Draft' },
  { id: 'active', label: 'Active', matches: (bid) => !['Draft', 'Awarded', 'Declined'].includes(bid.status) },
  { id: 'awarded', label: 'Awarded', matches: (bid) => bid.status === 'Awarded' },
  { id: 'declined', label: 'Declined', matches: (bid) => bid.status === 'Declined' },
]

function BidActionsMenu({ bid, onOpenMessages, onOpenProject, onResumeBidDraft, onViewBidOpportunity }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const runAction = (event, action) => {
    event.stopPropagation()
    setIsOpen(false)
    action()
  }

  return (
    <div className="opportunities-bid-menu" ref={menuRef}>
      <button
        type="button"
        className="opportunities-bid-more"
        aria-label={`${bid.title} actions`}
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen((current) => !current)
        }}
      >
        <FiMoreVertical aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="opportunities-bid-menu-list" role="menu">
          {bid.isDraft ? (
            <button type="button" role="menuitem" onClick={(event) => runAction(event, () => onResumeBidDraft(bid))}>
              Continue application
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={(event) => runAction(event, () => onViewBidOpportunity(bid))}>
            View opportunity
          </button>
          {bid.projectId ? (
            <button type="button" role="menuitem" onClick={(event) => runAction(event, () => onOpenProject({ id: bid.projectId }))}>
              Open project workspace
            </button>
          ) : null}
          {!bid.isDraft ? (
            <button type="button" role="menuitem" onClick={(event) => runAction(event, onOpenMessages)}>
              Message client
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function OpportunitiesBidsPanel({
  bids = [],
  onBidSelect,
  onOpenMessages = () => {},
  onOpenProject,
  onResumeBidDraft = () => {},
  onRespondCounterOffer = () => {},
  onViewBidOpportunity = () => {},
  selectedBidId,
  shouldFocusSelectedBid = false,
}) {
  const [statusFilterId, setStatusFilterId] = useState('all')
  const selectedBidRef = useRef(null)
  const statusFilter = BID_STATUS_FILTERS.find((filter) => filter.id === statusFilterId) || BID_STATUS_FILTERS[0]
  const visibleBids = bids.filter(statusFilter.matches)

  useEffect(() => {
    if (!shouldFocusSelectedBid || !selectedBidId || !selectedBidRef.current) return
    const frame = window.requestAnimationFrame(() => {
      selectedBidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedBidId, shouldFocusSelectedBid, visibleBids.length])

  return (
    <section className="opportunities-list-section opportunities-bids-section" aria-label="My bids">
      <div className="opportunities-section-head">
        <div>
          <h2>My Bids</h2>
          <p>Track bid progress, client activity and response timelines.</p>
        </div>
        <div className="opportunities-bid-status-filters" role="tablist" aria-label="Filter bids by status">
          {BID_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={statusFilterId === filter.id}
              className={`opportunities-bid-status-filter${statusFilterId === filter.id ? ' is-active' : ''}`}
              onClick={() => setStatusFilterId(filter.id)}
            >
              {filter.label}
              <em>{bids.filter(filter.matches).length}</em>
            </button>
          ))}
        </div>
      </div>

      {visibleBids.length === 0 ? (
        <p className="opportunities-list-empty">
          {bids.length === 0
            ? 'No bids yet. Apply to an opportunity from the Discover tab and your bids will show up here.'
            : 'No bids match this status yet.'}
        </p>
      ) : null}

      <div className="opportunities-bid-grid">
        {visibleBids.map((bid) => {
          const activeProgressPoint = getBidProgressPointIndex(bid.progress)
          const activeProgressWidth = (activeProgressPoint / (BID_PROGRESS_POINT_COUNT - 1)) * 100
          const isAwarded = bid.status === 'Awarded'

          return (
            <article
              key={bid.id}
              ref={selectedBidId === bid.id ? selectedBidRef : null}
              className={`opportunities-bid-card${selectedBidId === bid.id ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedBidId === bid.id}
              onClick={() => onBidSelect(bid.id)}
              onKeyDown={(event) => handleKeyboardActivation(event, () => onBidSelect(bid.id))}
            >
              <div className="opportunities-bid-thumb">
                <span className={`opportunities-bid-status-chip ${bid.statusTone}`}>{bid.status}</span>
                <BidActionsMenu
                  bid={bid}
                  onOpenMessages={onOpenMessages}
                  onOpenProject={onOpenProject}
                  onResumeBidDraft={onResumeBidDraft}
                  onViewBidOpportunity={onViewBidOpportunity}
                />
                <img src={bid.image} alt={`${bid.title} cover`} loading="lazy" />
              </div>

              <div className="opportunities-bid-body">
                <p className="opportunities-bid-category">
                  {bid.category}
                  {bid.intentLabel ? ` · ${bid.intentLabel}` : ''}
                </p>
                <h3>{bid.title}</h3>
                <p className="opportunities-bid-description">{bid.description}</p>

                {isAwarded ? (
                  <p className="opportunities-bid-ongoing-note">
                    <span className="opportunities-bid-ongoing-dot" aria-hidden="true" />
                    You won this bid — it&apos;s now tracked under <strong>Ongoing</strong>.
                  </p>
                ) : null}

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

                {bid.counterOffer && bid.counterOffer.status === 'pending' ? (
                  <div className="opportunities-bid-counter-offer">
                    <p>
                      The business proposed a new price of <strong>{bid.counterOffer.amountLabel}</strong>
                      {bid.counterOffer.previousAmountLabel ? <> (your bid was {bid.counterOffer.previousAmountLabel})</> : null}.
                    </p>
                    {bid.counterOffer.autoRejectOnDecline ? (
                      <p className="opportunities-bid-counter-warning">
                        <strong>Auto-reject enabled:</strong> Declining this offer will automatically move your application to Declined.
                      </p>
                    ) : null}
                    <div className="opportunities-bid-counter-actions">
                      <button
                        type="button"
                        className="campus-link-btn"
                        onClick={(event) => { event.stopPropagation(); onRespondCounterOffer(bid.id, 'rejected') }}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="opportunities-search-btn"
                        onClick={(event) => { event.stopPropagation(); onRespondCounterOffer(bid.id, 'accepted') }}
                      >
                        Accept new price
                      </button>
                    </div>
                  </div>
                ) : bid.counterOffer && bid.counterOffer.status === 'accepted' ? (
                  <p className="opportunities-bid-counter-note is-accepted">You accepted the new price of {bid.counterOffer.amountLabel}.</p>
                ) : bid.counterOffer && bid.counterOffer.status === 'rejected' ? (
                  <p className="opportunities-bid-counter-note is-declined">You declined the {bid.counterOffer.amountLabel} offer.</p>
                ) : null}

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
                {bid.isDraft ? (
                  <button
                    type="button"
                    className="opportunities-detail-bid-btn opportunities-bid-resume-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      onResumeBidDraft(bid)
                    }}
                  >
                    Continue application
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
