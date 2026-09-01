import { useEffect, useRef, useState } from 'react'
import { FiArrowUpRight, FiCheckCircle, FiClock, FiEdit3, FiMessageCircle, FiMoreVertical } from 'react-icons/fi'
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

const BID_FALLBACK_IMAGE = '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp'

function bidStatusNotice(bid) {
  if (bid.status === 'Awarded') return { tone: 'is-awarded', text: 'You won this bid. Continue the work from your project workspace.', Icon: FiCheckCircle }
  if (bid.status === 'Draft') return { tone: 'is-draft', text: 'This application has not been submitted yet.', Icon: FiEdit3 }
  if (bid.status === 'Declined') return { tone: 'is-declined', text: 'This application did not move forward. Your bid history remains saved.', Icon: FiClock }
  return { tone: 'is-active', text: bid.progressNote || 'Your proposal is moving through the client review process.', Icon: FiClock }
}

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
        <div className="opportunities-bids-heading-copy">
          <span>Application tracker</span>
          <h2>My Bids</h2>
          <p>See every proposal, its current stage and the next useful action.</p>
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
        <div className="opportunities-bids-empty">
          <FiEdit3 aria-hidden="true" />
          <div><h3>{bids.length === 0 ? 'Your applications will live here' : 'Nothing in this view'}</h3><p>{bids.length === 0
            ? 'Apply to an opportunity from Discover and track every response here.'
            : 'Choose another status to see the rest of your bid history.'}</p></div>
        </div>
      ) : null}

      <div className="opportunities-bid-grid">
        {visibleBids.map((bid) => {
          const activeProgressPoint = getBidProgressPointIndex(bid.progress)
          const activeProgressWidth = (activeProgressPoint / (BID_PROGRESS_POINT_COUNT - 1)) * 100
          const statusNotice = bidStatusNotice(bid)
          const StatusNoticeIcon = statusNotice.Icon
          const progressCaption = bid.status === 'Awarded'
            ? 'Your accepted bid is now active in the project workspace.'
            : bid.status === 'Draft'
              ? 'Finish the remaining details and submit when you are ready.'
              : bid.progressNote
          const clientActivity = bid.status === 'Awarded' ? 'Bid accepted by client' : bid.lastSeen
          const responseTiming = bid.status === 'Awarded' ? 'Project workspace ready' : bid.responseEta

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
                <img src={bid.image || BID_FALLBACK_IMAGE} alt={`${bid.title} cover`} loading="lazy" onError={(event) => { event.currentTarget.src = BID_FALLBACK_IMAGE }} />
              </div>

              <div className="opportunities-bid-body">
                <p className="opportunities-bid-category">
                  {bid.category}
                  {bid.intentLabel ? ` · ${bid.intentLabel}` : ''}
                </p>
                <h3>{bid.title}</h3>
                <p className="opportunities-bid-description">{bid.description}</p>

                <div className={`opportunities-bid-stage-note ${statusNotice.tone}`}>
                  <StatusNoticeIcon aria-hidden="true" /><p>{statusNotice.text}</p>
                </div>

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
                  <p>{progressCaption}</p>
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
                      {clientActivity}
                    </p>
                    <span>{responseTiming}</span>
                  </div>
                </footer>

                <div className="opportunities-bid-quick-actions">
                  <button type="button" className="is-secondary" onClick={(event) => { event.stopPropagation(); onViewBidOpportunity(bid) }}>
                    View opportunity <FiArrowUpRight aria-hidden="true" />
                  </button>
                  {bid.projectId ? (
                    <button type="button" className="is-primary" onClick={(event) => { event.stopPropagation(); onOpenProject({ id: bid.projectId }) }}>
                      Open project <FiArrowUpRight aria-hidden="true" />
                    </button>
                  ) : bid.isDraft ? (
                    <button type="button" className="is-primary" onClick={(event) => { event.stopPropagation(); onResumeBidDraft(bid) }}>
                      Continue <FiEdit3 aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" className="is-primary" onClick={(event) => { event.stopPropagation(); onOpenMessages() }}>
                      Message <FiMessageCircle aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default OpportunitiesBidsPanel
