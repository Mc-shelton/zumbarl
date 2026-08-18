import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiBookmark,
  FiHeart,
  FiInfo,
  FiMessageCircle,
  FiPause,
  FiPlay,
  FiSend,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiUser,
  FiVolume2,
  FiVolumeX,
  FiX,
} from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import MarketplaceOfferModal from '../../opportunities/components/MarketplaceOfferModal'
import { addMarketplaceListingToCart, readMarketplaceListing, sendMarketplaceOffer } from '../../opportunities/services/marketplaceInteractionService'
import {
  createStoryComment,
  readStoryEngagement,
  toggleStoryCommentReaction,
  toggleStoryReaction,
} from '../services/storyService'

const DEFAULT_STORY_DURATION = 7000
const STORY_COMMENTS = [
  { id: 'aisha', author: 'Aisha Mwangi', handle: '@aisha.mwangi', time: '4m', text: 'This is such a good update. Keep them coming!', avatar: '/assets/index/bee_nobg.png' },
  { id: 'david', author: 'David Kamau', handle: '@david.analytics', time: '9m', text: 'The campus energy in this one is perfect.', avatar: '/assets/index/bee_nobg.png' },
  { id: 'fatma', author: 'Fatma Ali', handle: '@fatma.ai', time: '14m', text: 'Love this perspective 👏', avatar: '/assets/index/bee_nobg.png' },
  { id: 'mercy', author: 'Mercy Wanjiku', handle: '@mercy.w', time: '21m', text: 'Saving this for later!', avatar: '/assets/index/bee_nobg.png' },
]

function storySnapshot(item, creator) {
  return {
    title: item.title,
    text: item.caption,
    caption: item.caption,
    mediaUrl: item.media,
    mediaType: item.type,
    poster: item.poster,
    storyKind: item.storyKind || 'personal',
    product: item.product || null,
    trimStart: item.trimStart || 0,
    trimEnd: item.trimEnd || null,
    creator: {
      id: creator.id,
      name: creator.name,
      handle: creator.handle,
      campus: creator.campus,
      avatar: creator.avatar,
    },
    visibility: 'campus',
  }
}

function relativeTime(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return 'now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`
  return `${Math.floor(elapsed / 86_400_000)}d`
}

function ExploreStoryViewer({ activeStoryId, onClose, onStoryViewed, stories = [] }) {
  const navigate = useNavigate()
  const isOpen = Boolean(activeStoryId)
  const dialogRef = useDialog({ isOpen, onClose })
  const videoRef = useRef(null)
  const commentInputRef = useRef(null)
  const pointerStartRef = useRef(null)
  const didSwipeRef = useRef(false)
  const wheelGestureRef = useRef({ x: 0, y: 0, resetTimer: null, cooldownUntil: 0 })
  const remainingDurationRef = useRef(DEFAULT_STORY_DURATION)
  const [creatorIndex, setCreatorIndex] = useState(() => {
    const initialIndex = stories.findIndex((story) => story.id === activeStoryId)
    return initialIndex >= 0 ? initialIndex : 0
  })
  const [itemIndex, setItemIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [engagementByItem, setEngagementByItem] = useState({})
  const [isSavingEngagement, setIsSavingEngagement] = useState(false)
  const [comment, setComment] = useState('')
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [savedProducts, setSavedProducts] = useState({})
  const [sharedItemId, setSharedItemId] = useState('')
  const [isOfferOpen, setIsOfferOpen] = useState(false)
  const [activeOffer, setActiveOffer] = useState(null)
  const [productActionStatus, setProductActionStatus] = useState('')
  const [isProductActionPending, setIsProductActionPending] = useState(false)
  const [productImageIndex, setProductImageIndex] = useState(0)

  const activeCreator = stories[creatorIndex] || null
  const activeItems = activeCreator?.items || []
  const activeItem = activeItems[itemIndex] || null
  const listingId = activeItem?.product?.listingId || activeItem?.product?.id || ''
  const productGallery = activeItem?.product?.gallery?.length ? activeItem.product.gallery : [activeItem?.product?.image || activeItem?.media].filter(Boolean)
  const activeProductImage = productGallery[productImageIndex] || productGallery[0]

  useEffect(() => {
    if (isOpen && activeCreator?.id && activeItem?.id) onStoryViewed?.(activeCreator.id, activeItem.id)
  }, [activeCreator?.id, activeItem?.id, isOpen, onStoryViewed])

  const step = useCallback((direction) => {
    if (!stories.length || !activeItems.length) return
    const nextItemIndex = itemIndex + direction

    if (nextItemIndex >= 0 && nextItemIndex < activeItems.length) {
      setItemIndex(nextItemIndex)
    } else {
      const nextCreatorIndex = creatorIndex + direction
      if (nextCreatorIndex < 0 || nextCreatorIndex >= stories.length) {
        if (direction > 0) {
          onClose()
          return
        }
        setIsPaused(true)
        return
      }
      const nextItems = stories[nextCreatorIndex]?.items || []
      setCreatorIndex(nextCreatorIndex)
      setItemIndex(direction > 0 ? 0 : Math.max(0, nextItems.length - 1))
    }

    setIsPaused(false)
    setIsCommentsOpen(false)
    setIsDetailsOpen(false)
    setComment('')
    setSharedItemId('')
  }, [activeItems.length, creatorIndex, itemIndex, onClose, stories])

  useEffect(() => {
    remainingDurationRef.current = activeItem?.duration || DEFAULT_STORY_DURATION
    setProductImageIndex(0)
    setProductActionStatus('')
    setIsOfferOpen(false)
  }, [activeItem?.id, activeItem?.duration])

  useEffect(() => {
    if (!isOpen || !activeItem?.id) return undefined
    let cancelled = false
    readStoryEngagement(activeItem.id)
      .then((engagement) => {
        if (!cancelled) setEngagementByItem((current) => ({ ...current, [activeItem.id]: engagement }))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [activeItem?.id, isOpen])

  useEffect(() => {
    if (!isOpen || activeItem?.storyKind !== 'product' || !listingId) return
    readMarketplaceListing(listingId)
      .then((response) => setActiveOffer(response?.activeOffer || null))
      .catch(() => setActiveOffer(null))
  }, [activeItem?.id, activeItem?.storyKind, isOpen, listingId])

  useEffect(() => {
    if (!isOpen || !activeItem || isPaused) return undefined
    const startedAt = Date.now()
    const timer = window.setTimeout(() => step(1), remainingDurationRef.current)
    return () => {
      window.clearTimeout(timer)
      remainingDurationRef.current = Math.max(0, remainingDurationRef.current - (Date.now() - startedAt))
    }
  }, [activeItem, isOpen, isPaused, step])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPaused) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [activeItem?.id, isPaused])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      const isWriting = ['INPUT', 'TEXTAREA'].includes(event.target?.tagName)
      if (isWriting) return
      if (event.key === 'ArrowDown') step(1)
      if (event.key === 'ArrowUp') step(-1)
      if (event.key === 'ArrowLeft') {
        setIsCommentsOpen(false)
        setIsDetailsOpen(true)
        setIsPaused(true)
      }
      if (event.key === 'ArrowRight' && isDetailsOpen) {
        setIsDetailsOpen(false)
        setIsPaused(false)
      }
      if (event.key === ' ') {
        event.preventDefault()
        setIsPaused((current) => !current)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDetailsOpen, isOpen, step])

  useEffect(() => () => {
    if (wheelGestureRef.current.resetTimer) {
      window.clearTimeout(wheelGestureRef.current.resetTimer)
    }
  }, [])

  if (!isOpen || !activeCreator || !activeItem) return null

  const engagement = engagementByItem[activeItem.id] || { reactionCount: 0, viewerReacted: false, comments: [] }
  const isLiked = Boolean(engagement.viewerReacted)
  const itemComments = engagement.comments || []
  const comments = activeItem.comments + itemComments.length
  const visibleComments = STORY_COMMENTS
    .filter((entry) => entry.author !== activeCreator.name)
    .slice(0, Math.min(3, activeItem.comments))
  const mediaAlt = `${activeCreator.name}: ${activeItem.title}`

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim() || isSavingEngagement) return
    setIsSavingEngagement(true)
    try {
      const savedComment = await createStoryComment(activeItem.id, comment.trim(), storySnapshot(activeItem, activeCreator))
      setEngagementByItem((current) => ({
        ...current,
        [activeItem.id]: {
          ...engagement,
          comments: [...itemComments, savedComment],
        },
      }))
      setComment('')
    } finally {
      setIsSavingEngagement(false)
    }
  }

  async function toggleLike() {
    if (isSavingEngagement) return
    setIsSavingEngagement(true)
    try {
      const saved = await toggleStoryReaction(activeItem.id, storySnapshot(activeItem, activeCreator))
      setEngagementByItem((current) => ({
        ...current,
        [activeItem.id]: { ...engagement, ...saved, comments: itemComments },
      }))
    } finally {
      setIsSavingEngagement(false)
    }
  }

  async function toggleCommentLike(commentId) {
    if (isSavingEngagement) return
    setIsSavingEngagement(true)
    try {
      const saved = await toggleStoryCommentReaction(commentId)
      setEngagementByItem((current) => ({
        ...current,
        [activeItem.id]: {
          ...engagement,
          comments: itemComments.map((entry) => entry.id === commentId ? { ...entry, ...saved } : entry),
        },
      }))
    } finally {
      setIsSavingEngagement(false)
    }
  }

  function shareStory() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
    setSharedItemId(activeItem.id)
  }

  function openDetails() {
    setIsCommentsOpen(false)
    setIsDetailsOpen(true)
    setIsPaused(true)
  }

  function stepProductImage(direction) {
    setProductImageIndex((current) => (current + direction + productGallery.length) % productGallery.length)
  }

  async function addProductToCart() {
    if (!listingId || isProductActionPending || activeOffer) return
    setIsProductActionPending(true); setProductActionStatus('Adding product to your cart…')
    try { await addMarketplaceListingToCart(listingId); navigate('/campus/cart') }
    catch (requestError) { setProductActionStatus(requestError.message || 'Could not add this product to your cart.'); setIsProductActionPending(false) }
  }

  async function makeProductOffer(amount) {
    const response = await sendMarketplaceOffer(listingId, {
      sellerUsername: activeItem.product?.sellerUsername,
      amount,
      currency: 'KES',
      product: { id: listingId, title: activeItem.product?.name || activeItem.title, price: activeItem.product?.price, image: activeItem.product?.image || activeItem.media, href: `/campus/opportunities/buy-sell/${encodeURIComponent(listingId)}` },
    })
    setActiveOffer(response.offer)
    setIsOfferOpen(false)
    setProductActionStatus(`Your KSh ${Number(amount).toLocaleString('en-KE')} offer was sent to ${activeCreator.name}.`)
  }

  function handlePointerDown(event) {
    didSwipeRef.current = false
    if (event.target.closest('.explore-story-comments, .explore-story-actions, .explore-story-player-head, .explore-story-stepper, .explore-story-details button')) {
      pointerStartRef.current = null
      return
    }
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY)

    if (isDetailsOpen) {
      if (horizontal && deltaX > 70) {
        didSwipeRef.current = true
        setIsDetailsOpen(false)
        setIsPaused(false)
      }
      return
    }

    if (isCommentsOpen) return

    if (horizontal && deltaX < -70) {
      didSwipeRef.current = true
      openDetails()
    } else if (!horizontal && deltaY > 70) {
      didSwipeRef.current = true
      step(1)
    } else if (!horizontal && deltaY < -70) {
      didSwipeRef.current = true
      step(-1)
    }
  }

  function handleWheel(event) {
    if (event.target.closest('.explore-story-comments')) return

    const gesture = wheelGestureRef.current
    const now = Date.now()
    if (now < gesture.cooldownUntil) return

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    const horizontalDelta = (event.deltaX || (event.shiftKey ? event.deltaY : 0)) * unit
    const verticalDelta = (event.shiftKey ? 0 : event.deltaY) * unit

    gesture.x += horizontalDelta
    gesture.y += verticalDelta
    if (gesture.resetTimer) window.clearTimeout(gesture.resetTimer)
    gesture.resetTimer = window.setTimeout(() => {
      gesture.x = 0
      gesture.y = 0
      gesture.resetTimer = null
    }, 180)

    const isHorizontal = Math.abs(gesture.x) > Math.abs(gesture.y) * 1.15
    let handled = false

    if (isDetailsOpen) {
      if (isHorizontal && gesture.x < -72) {
        setIsDetailsOpen(false)
        setIsPaused(false)
        handled = true
      }
    } else if (isHorizontal && gesture.x > 72) {
      openDetails()
      handled = true
    } else if (!isHorizontal && gesture.y > 72) {
      step(1)
      handled = true
    } else if (!isHorizontal && gesture.y < -72) {
      step(-1)
      handled = true
    }

    if (handled) {
      gesture.x = 0
      gesture.y = 0
      gesture.cooldownUntil = now + 600
      if (gesture.resetTimer) {
        window.clearTimeout(gesture.resetTimer)
        gesture.resetTimer = null
      }
    }
  }

  return (
    <section
      ref={dialogRef}
      className="explore-story-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${activeCreator.name}'s stories`}
      onClick={onClose}
    >
      <div className="explore-story-viewer-content" onClick={(event) => event.stopPropagation()}>
        <main className="explore-story-player" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onWheel={handleWheel}>
          <div className="explore-story-progress" aria-label={`Story ${itemIndex + 1} of ${activeItems.length}`}>
            {activeItems.map((item, index) => (
              <span key={item.id} className={index < itemIndex ? 'is-complete' : index === itemIndex ? 'is-current' : ''}>
                {index === itemIndex ? (
                  <i
                    key={item.id}
                    style={{
                      animationDuration: `${item.duration || DEFAULT_STORY_DURATION}ms`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  />
                ) : null}
              </span>
            ))}
          </div>

          <header className="explore-story-player-head">
            <div>
              <img src={activeCreator.avatar} alt="" />
              <span><strong>{activeCreator.name}</strong><small>{activeItem.time}</small></span>
            </div>
            <div>
              {activeItem.type === 'video' ? (
                <button type="button" onClick={() => setIsMuted((current) => !current)} aria-label={isMuted ? 'Unmute story' : 'Mute story'}>
                  {isMuted ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
                </button>
              ) : null}
              <button type="button" onClick={() => setIsPaused((current) => !current)} aria-label={isPaused ? 'Play story' : 'Pause story'}>
                {isPaused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
              </button>
              <button type="button" onClick={onClose} aria-label="Close stories"><FiX aria-hidden="true" /></button>
            </div>
          </header>

          <button
            type="button"
            className="explore-story-media"
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false
                return
              }
              setIsPaused((current) => !current)
            }}
            aria-label={isPaused ? 'Play story' : 'Pause story'}
          >
            {activeItem.type === 'video' ? (
              <video
                key={activeItem.id}
                ref={videoRef}
                src={activeItem.media}
                poster={activeItem.poster}
                autoPlay
                muted={isMuted}
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => { event.currentTarget.currentTime = activeItem.trimStart || 0 }}
                onTimeUpdate={(event) => { if (activeItem.trimEnd && event.currentTarget.currentTime >= activeItem.trimEnd) step(1) }}
              />
            ) : <img key={activeItem.id} src={activeItem.media} alt={mediaAlt} />}
          </button>

          <div className="explore-story-gradient" />

          <section className="explore-story-caption" aria-live="polite">
            <span>{activeCreator.campus}</span>
            <h2>{activeItem.title}</h2>
            <p>{activeItem.caption}</p>
          </section>

          <nav className="explore-story-actions" aria-label="Story actions">
            <button
              type="button"
              className={isLiked ? 'is-active' : ''}
              onClick={toggleLike}
              disabled={isSavingEngagement}
              aria-label={isLiked ? 'Unlike story' : 'Like story'}
            >
              <FiHeart aria-hidden="true" /><span>{activeItem.likes + engagement.reactionCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDetailsOpen(false)
                setIsCommentsOpen(true)
                setIsPaused(true)
              }}
              aria-label="Comment on story"
              aria-expanded={isCommentsOpen}
            >
              <FiMessageCircle aria-hidden="true" /><span>{comments}</span>
            </button>
            <button type="button" onClick={shareStory} aria-label="Share story">
              <FiSend aria-hidden="true" /><span>{sharedItemId === activeItem.id ? 'Copied' : 'Share'}</span>
            </button>
            <button type="button" onClick={openDetails} aria-label={activeItem.storyKind === 'product' ? 'View product details' : 'View creator details'}>
              {activeItem.storyKind === 'product' ? <FiShoppingBag aria-hidden="true" /> : <FiUser aria-hidden="true" />}
              <span>{activeItem.storyKind === 'product' ? 'Product' : 'Creator'}</span>
            </button>
          </nav>

          <nav className="explore-story-stepper" aria-label="Move through stories">
            <button type="button" onClick={() => step(-1)} aria-label="Previous story"><FiChevronUp aria-hidden="true" /></button>
            <button type="button" onClick={() => step(1)} aria-label="Next story"><FiChevronDown aria-hidden="true" /></button>
          </nav>

          {isCommentsOpen ? (
          <section className="explore-story-comments is-open" aria-label="Story comments">
            <header>
              <div><strong>Comments</strong><span>{comments}</span></div>
              <button
                type="button"
                onClick={() => {
                  setIsCommentsOpen(false)
                  setIsPaused(false)
                }}
                aria-label="Close comments"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className="explore-story-comments-list">
              {[...visibleComments, ...itemComments].length ? [...visibleComments, ...itemComments].map((entry) => (
                <article key={entry.id}>
                  <img src={entry.avatar || '/assets/index/bee_nobg.png'} alt="" />
                  <div>
                    <p><strong>{entry.author}</strong><span>{entry.handle} · {entry.time || relativeTime(entry.createdAt)}</span></p>
                    <p>{entry.text || entry.body}</p>
                  </div>
                  <button
                    type="button"
                    className={entry.viewerReacted ? 'is-active' : ''}
                    onClick={() => entry.createdAt && toggleCommentLike(entry.id)}
                    disabled={!entry.createdAt || isSavingEngagement}
                    aria-label={`${entry.viewerReacted ? 'Unlike' : 'Like'} ${entry.author}'s comment`}
                  >
                    <FiHeart aria-hidden="true" />
                    {entry.reactionCount ? <span>{entry.reactionCount}</span> : null}
                  </button>
                </article>
              )) : <p className="explore-story-comments-empty">No comments yet. Start the conversation.</p>}
            </div>

            <form className="explore-story-comments-reply" onSubmit={submitComment}>
              <input
                ref={commentInputRef}
                type="text"
                value={comment}
                placeholder={`Reply to ${activeCreator.shortName || activeCreator.name}…`}
                aria-label="Reply to story"
                onChange={(event) => setComment(event.target.value)}
              />
              <button type="submit" disabled={!comment.trim() || isSavingEngagement} aria-label="Send reply"><FiSend aria-hidden="true" /></button>
            </form>
          </section>
          ) : null}

          {isDetailsOpen ? (
            <section className={`explore-story-details${activeItem.storyKind === 'product' ? ' is-product' : ''}`} aria-label={activeItem.storyKind === 'product' ? 'Product details' : 'Creator details'}>
              <header>
                <div>
                  {activeItem.storyKind === 'product' ? <FiShoppingBag aria-hidden="true" /> : <FiInfo aria-hidden="true" />}
                  <span><small>{activeItem.storyKind === 'product' ? 'Featured product' : 'About this creator'}</small><strong>{activeItem.storyKind === 'product' ? activeItem.product?.name : activeCreator.name}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsOpen(false)
                    setIsPaused(false)
                  }}
                  aria-label="Close details"
                >
                  <FiX aria-hidden="true" />
                </button>
              </header>

              {activeItem.storyKind === 'product' ? (
                <div className="explore-story-product-detail">
                  <div className="explore-story-product-gallery">
                    <div className="explore-story-product-image-stage">
                      <img src={activeProductImage} alt={activeItem.product?.name || activeItem.title} />
                      {productGallery.length > 1 ? <>
                        <button type="button" className="is-previous" onClick={() => stepProductImage(-1)} aria-label="Previous product image"><FiChevronLeft /></button>
                        <button type="button" className="is-next" onClick={() => stepProductImage(1)} aria-label="Next product image"><FiChevronRight /></button>
                        <span>{productImageIndex + 1}/{productGallery.length}</span>
                      </> : null}
                    </div>
                    {productGallery.length > 1 ? <div>{productGallery.map((image, index) => <button type="button" key={`${image}-${index}`} className={index === productImageIndex ? 'is-active' : ''} onClick={() => setProductImageIndex(index)} aria-label={`Show product image ${index + 1}`}><img src={image} alt="" /></button>)}</div> : null}
                  </div>
                  <div>
                    <p className="explore-story-product-price">{activeItem.product?.price || 'Price on request'}</p>
                    <h2>{activeItem.product?.name || activeItem.title}</h2>
                    <p>{activeItem.product?.description || activeItem.caption}</p>
                  </div>
                  <dl>
                    <div><dt>Seller</dt><dd>{activeCreator.name}</dd></div>
                    <div><dt>Campus</dt><dd>{activeCreator.campus}</dd></div>
                    <div><dt>Story</dt><dd>Product short</dd></div>
                  </dl>
                  {activeItem.product?.specs?.length ? <section className="explore-story-product-specs"><h3>Item specifications</h3><dl>{activeItem.product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section> : null}
                  <div className="explore-story-product-actions">
                  <button
                    type="button"
                    className={savedProducts[activeItem.product?.id || activeItem.id] ? 'is-saved' : ''}
                    onClick={() => {
                      const productId = activeItem.product?.id || activeItem.id
                      setSavedProducts((current) => ({ ...current, [productId]: !current[productId] }))
                    }}
                  >
                    <FiBookmark aria-hidden="true" />
                    {savedProducts[activeItem.product?.id || activeItem.id] ? 'Product saved' : 'Save product'}
                  </button>
                  {!activeOffer ? <button type="button" onClick={() => setIsOfferOpen(true)}><FiTag /> Make offer</button> : null}
                  {!activeOffer ? <button type="button" disabled={isProductActionPending} onClick={addProductToCart}><FiShoppingCart /> {isProductActionPending ? 'Adding…' : 'Add to cart'}</button> : null}
                  </div>
                  {activeOffer ? <p className="explore-story-product-status">Offer {activeOffer.status}. Cart checkout is unavailable while negotiation is active.</p> : null}
                  {productActionStatus ? <p className="explore-story-product-status" role="status">{productActionStatus}</p> : null}
                </div>
              ) : (
                <div className="explore-story-creator-detail">
                  <img src={activeCreator.avatar} alt="" />
                  <h2>{activeCreator.name}</h2>
                  <p>{activeCreator.handle}</p>
                  <span>{activeCreator.campus}</span>
                  <dl>
                    <div><dt>Stories</dt><dd>{activeItems.length}</dd></div>
                    <div><dt>Active story</dt><dd>{itemIndex + 1} of {activeItems.length}</dd></div>
                  </dl>
                  <p className="explore-story-creator-note">Campus creator sharing projects, learning, and everyday moments with the Zumbarl community.</p>
                </div>
              )}

              <p className="explore-story-details-hint">Swipe right or tap × to return to the story.</p>
              <MarketplaceOfferModal isOpen={isOfferOpen} item={{ title: activeItem.product?.name || activeItem.title, price: activeItem.product?.price, image: activeItem.product?.image || activeItem.media }} onClose={() => setIsOfferOpen(false)} onSubmit={makeProductOffer} seller={{ name: activeCreator.name }} />
            </section>
          ) : null}
        </main>
      </div>
    </section>
  )
}

export default ExploreStoryViewer
