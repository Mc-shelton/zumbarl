import { FiAward, FiBookmark, FiCalendar, FiCheck, FiEdit3, FiHeart, FiHelpCircle, FiImage, FiMessageCircle, FiRepeat, FiSend, FiShare2, FiShoppingBag, FiTrash2, FiTrendingUp, FiX } from 'react-icons/fi'
import { BsPinAngleFill } from 'react-icons/bs'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { creatorProfilePath, postCreatorProfilePath } from '../utils/creatorProfilePath'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function mediaTypeFor(post, index) {
  return post?.mediaEdits?.[index]?.type === 'video' || post?.tag === 'Video' || post?.type === 'video' ? 'video' : 'image'
}

function recordPostMediaInteraction(post, index, eventType, location = 'feed') {
  if (!post?.id) return
  recordRecommendationInteraction({
    surface: 'connect_feed',
    entityType: 'connect_post',
    entityId: String(post.id),
    eventType,
    metadata: { location, mediaIndex: index, mediaType: mediaTypeFor(post, index) },
  })
}

function PostComments({ comments, onComment, post }) {
  const [draft, setDraft] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')

  async function submitComment(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || isPosting) return
    setIsPosting(true)
    setError('')
    try {
      await onComment(post.id, body, post)
      setDraft('')
    } catch (requestError) {
      setError(requestError?.message || 'Your comment could not be posted.')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <section className="explore-post-comments" aria-label={`Comments on ${post.author}'s post`}>
      <header>
        <strong>Comments</strong>
        <span>{post.stats.comments}</span>
      </header>
      <div className="explore-post-comments-list">
        {comments.length ? comments.map((comment) => (
          <article key={comment.id}>
            <img src={comment.avatar || '/assets/index/bee_nobg.png'} alt="" loading="lazy" />
            <div>
              <p><strong>{comment.author}</strong><span>{comment.handle} · {comment.time}</span></p>
              <div>{comment.text}</div>
            </div>
          </article>
        )) : <p className="explore-post-comments-empty">No comments yet. Start the conversation.</p>}
      </div>
      {post.stats.comments > comments.length ? (
        <small>Showing {comments.length} of {post.stats.comments} comments</small>
      ) : null}
      {error ? <p className="explore-post-comments-error" role="alert">{error}</p> : null}
      <form onSubmit={submitComment}>
        <input
          type="text"
          maxLength="1000"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a comment…"
          aria-label={`Comment on ${post.author}'s post`}
        />
        <button type="submit" disabled={!draft.trim() || isPosting} aria-label="Post comment">
          <FiSend aria-hidden="true" />
        </button>
      </form>
    </section>
  )
}

function reshareTargetFor(post, posts) {
  if (!post.resharedPost) return post
  const liveOriginal = posts.find((candidate) => candidate.id === post.reshareOfPostId)
  if (liveOriginal) return liveOriginal
  const original = post.resharedPost
  const creator = original.creator || {}
  return {
    id: original.id || post.reshareOfPostId,
    type: original.type || 'post',
    creatorId: creator.id || null,
    creatorSlug: creator.slug || null,
    creatorProfileType: creator.profileType || 'student',
    author: creator.name || 'Zumbarl creator',
    handle: creator.handle || '@creator',
    avatar: creator.avatarUrl || null,
    campus: creator.campus || null,
    copy: original.body || 'Shared post',
    gallery: original.mediaUrls || [],
    mediaEdits: original.mediaEdits || [],
    isMine: Boolean(original.isMine),
    viewerReshared: Boolean(original.viewerReshared),
    viewerReshareCommentary: original.viewerReshareCommentary || '',
    stats: {
      likes: Number(original.reactionCount || 0),
      comments: Number(original.commentCount || 0),
      reposts: Number(original.repostCount || 0),
    },
  }
}

function ResharedPostPreview({ onOpenMediaViewer, post }) {
  const original = post.resharedPost || {}
  const creator = original.creator || {}
  const gallery = original.mediaUrls || []
  const profilePath = creatorProfilePath(creator)
  const mediaPost = {
    id: original.id || post.reshareOfPostId,
    author: creator.name || 'Zumbarl creator',
    handle: creator.handle || '@creator',
    avatar: normalizeZumbarlFileUrl(creator.avatarUrl),
    creatorId: creator.id,
    campus: creator.campus,
    copy: original.body || '',
    gallery,
    type: original.type || 'post',
    tag: original.type === 'video' ? 'Video' : original.type === 'image' ? 'Photo' : 'Update',
    mediaEdits: original.mediaEdits || [],
    stats: {
      likes: Number(original.reactionCount || 0),
      comments: Number(original.commentCount || 0),
      reposts: Number(original.repostCount || 0),
    },
  }

  return (
    <section className="explore-reshared-post" aria-label={`Original post by ${mediaPost.author}`}>
      <header>
        {profilePath ? <Link className="explore-reshared-owner-avatar" to={profilePath} aria-label={`View ${mediaPost.author}'s profile`}><img src={normalizeZumbarlFileUrl(mediaPost.avatar) || '/assets/index/bee_nobg.png'} alt="" loading="lazy" /></Link> : <img src={normalizeZumbarlFileUrl(mediaPost.avatar) || '/assets/index/bee_nobg.png'} alt="" loading="lazy" />}
        <div>
          {profilePath ? <Link className="explore-reshared-owner-link" to={profilePath}>{mediaPost.author}</Link> : <strong>{mediaPost.author}</strong>}
          <span>{mediaPost.handle}{mediaPost.campus ? ` · ${mediaPost.campus}` : ''}{creator.zumbarlPoints !== null && creator.zumbarlPoints !== undefined ? ` · ${Math.round(Number(creator.zumbarlPoints) || 0)} Buzz` : ''}</span>
        </div>
      </header>
      <p>{mediaPost.copy}</p>
      {gallery.length ? (
        <div className={`explore-reshared-post-gallery${gallery.length === 1 ? ' is-single' : ''}`}>
          {(gallery.length > 3 ? gallery.slice(0, 3) : gallery).map((media, index) => {
            const edit = mediaPost.mediaEdits[index] || {}
            const isVideo = edit.type === 'video' || original.type === 'video'
            return (
              <button key={`${mediaPost.id}-${media}`} type="button" onClick={() => onOpenMediaViewer(mediaPost, index)} aria-label={`Open media ${index + 1} from ${mediaPost.author}'s post`}>
                {isVideo ? <video src={media} muted /> : <img src={media} alt="" loading="lazy" />}
                {gallery.length > 3 && index === 2 ? <span>+{gallery.length - 3}</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function ReshareComposer({ onClose, onSubmit, post }) {
  const [draft, setDraft] = useState(post.viewerReshareCommentary || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const commentary = draft.trim()
    if (!commentary || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(post, commentary)
      onClose()
    } catch (requestError) {
      setError(requestError?.message || 'Your reshare could not be published.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="explore-reshare-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form className="explore-reshare-composer" role="dialog" aria-modal="true" aria-labelledby="reshare-composer-title" onSubmit={submit}>
        <header>
          <div>
            <small>Reshare with your thoughts</small>
            <h2 id="reshare-composer-title">Add your perspective</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close reshare composer"><FiX /></button>
        </header>
        <textarea
          autoFocus
          maxLength="3000"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What do you want to say about this?"
        />
        <div className="explore-reshare-composer-preview">
          <strong>{post.author}</strong>
          <p>{post.copy}</p>
        </div>
        {error ? <p className="explore-post-engagement-error" role="alert">{error}</p> : null}
        <footer>
          <span>{draft.length}/3000</span>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!draft.trim() || isSubmitting}>{isSubmitting ? 'Posting…' : 'Post reshare'}</button>
        </footer>
      </form>
    </div>
  )
}

function formatPollOption(value, type) {
  const normalized = String(value || '')
  if (type === 'date') {
    const parsed = new Date(`${normalized}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (type === 'time' && /^\d{2}:\d{2}/.test(normalized)) {
    const parsed = new Date(`2000-01-01T${normalized}`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
  }
  if (type === 'number' && normalized.trim() && Number.isFinite(Number(normalized))) return Number(normalized).toLocaleString('en-KE')
  return normalized
}

function pollExpiryLabel(poll) {
  if (poll.isClosed) return 'Poll closed'
  if (!poll.expiresAt) return 'No closing date'
  const expiresAt = new Date(poll.expiresAt)
  if (Number.isNaN(expiresAt.getTime())) return 'No closing date'
  return `Closes ${expiresAt.toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
}

function FeedPoll({ error, isPending, onVote, post }) {
  const poll = post.poll || {}
  const selectedIds = Array.isArray(poll.viewerOptionIds) ? poll.viewerOptionIds.map(String) : []
  const showResults = Boolean(poll.hasVoted || poll.isClosed)
  const options = Array.isArray(poll.options) ? poll.options : []

  function choose(optionId) {
    if (poll.isClosed || isPending || !onVote) return
    const normalizedId = String(optionId)
    const nextIds = poll.selectionMode === 'multiple'
      ? selectedIds.includes(normalizedId)
        ? selectedIds.filter((id) => id !== normalizedId)
        : [...selectedIds, normalizedId]
      : [normalizedId]
    onVote(post, nextIds).catch(() => {})
  }

  return (
    <section className={`explore-feed-poll${showResults ? ' has-results' : ''}`} aria-label={`Poll: ${poll.question}`}>
      <header>
        <div>
          <small>Campus poll</small>
          <strong>{poll.question}</strong>
        </div>
        <span>{poll.selectionMode === 'multiple' ? 'Choose any' : 'Choose one'}</span>
      </header>
      <div className="explore-feed-poll-options">
        {options.map((option) => {
          const item = typeof option === 'string' ? { id: option, label: option, value: option } : option
          const optionId = String(item.id || item.value)
          const isSelected = selectedIds.includes(optionId)
          const percentage = Number(item.percentage || 0)
          return (
            <button
              type="button"
              key={optionId}
              className={isSelected ? 'is-selected' : ''}
              style={{ '--poll-result': `${percentage}%` }}
              aria-pressed={isSelected}
              disabled={Boolean(poll.isClosed || isPending || !onVote)}
              onClick={() => choose(optionId)}
            >
              <span className="explore-feed-poll-choice">{isSelected ? <FiCheck aria-hidden="true" /> : null}</span>
              <strong>{formatPollOption(item.label || item.value, poll.optionType)}</strong>
              {showResults ? <span>{percentage}%</span> : null}
            </button>
          )
        })}
      </div>
      <footer>
        <span>{Number(poll.totalVotes || 0).toLocaleString('en-KE')} {Number(poll.totalVotes || 0) === 1 ? 'vote' : 'votes'}</span>
        <span>{pollExpiryLabel(poll)}</span>
        {isPending ? <span>Saving…</span> : null}
      </footer>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  )
}

function ExploreFeed({ activeFilter, allowAnnouncementSubmission = true, commentsByPost, engagementErrors, engagementPending, focusedPostId = '', onComment, onComposerPost, onEditPost, onLikePost, onOpenEvent, onOpenMediaViewer, onRemoveReshare, onResharePost, onSharePost, onSubmitAnnouncement, onTakeDownPost = null, onViewProduct, onVotePoll, posts, showComposer = true }) {
  const [openPostMenuId, setOpenPostMenuId] = useState('')
  const [openCommentsByPost, setOpenCommentsByPost] = useState({})
  const [openReshareMenuId, setOpenReshareMenuId] = useState('')
  const [quotePost, setQuotePost] = useState(null)

  function openExpandedMedia(post, index) {
    recordPostMediaInteraction(post, index, 'media_click')
    recordPostMediaInteraction(post, index, 'media_expand', 'viewer')
    onOpenMediaViewer(post, index)
  }

  return (
    <>
      {showComposer ? <section className="explore-campus-composer-card" aria-label="Create a post">
        <div className="explore-campus-composer-head">
          <img src="/assets/index/bee_nobg.png" alt="Brian avatar" loading="lazy" />
          <button type="button" className="explore-campus-composer-input" onClick={() => onComposerPost('post')}>
            Share a win, need, idea or campus moment…
          </button>
        </div>
        <div className="explore-campus-composer-actions">
          <button type="button" onClick={() => onComposerPost('media')}>
            <FiImage aria-hidden="true" />
            Moment
          </button>
          <button type="button" onClick={() => onComposerPost('event')}>
            <FiCalendar aria-hidden="true" />
            Gather
          </button>
          <button type="button" onClick={() => onComposerPost('poll')}>
            <FiHelpCircle aria-hidden="true" />
            Ask campus
          </button>
          <button type="button" onClick={() => onComposerPost('feeling')}>
            <FiAward aria-hidden="true" />
            Milestone
          </button>
          <button type="button" className="explore-campus-post-btn" onClick={() => onComposerPost('post')}>
            Send signal
          </button>
        </div>
      </section> : null}

      {!posts.length ? <section className="explore-feed-empty" role="status"><strong>No {activeFilter.toLowerCase()} posts yet</strong><p>New posts matching this feed will appear here.</p></section> : null}

      {posts.map((post) => {
        const resharePost = reshareTargetFor(post, posts)
        const profilePath = postCreatorProfilePath(post)
        return (
        <article
          key={post.id}
          id={`connect-post-${post.id}`}
          className={`explore-campus-feed-card${post.isPinnedAnnouncement ? ' explore-campus-pinned-card' : ''}${post.isPromoted ? ' is-promoted' : ''}${focusedPostId === post.id ? ' is-shared-focus' : ''}`}
          aria-label={`${post.author} post`}
        >
          {post.isPinnedAnnouncement ? <p className="explore-campus-pinned-label"><BsPinAngleFill aria-hidden="true" />Pinned Announcement</p> : null}
          {post.isPromoted ? <p className="explore-campus-promoted-label"><FiTrendingUp aria-hidden="true" /><strong>Promoted</strong><span>Sponsored campus update from {post.author}</span></p> : null}
          {post.resharedPost ? (
            <p className="explore-campus-reshared-label">
              <FiRepeat aria-hidden="true" />
              <strong>{post.author}</strong> reshared a post by {post.resharedPost.creator?.name || 'a Zumbarl creator'}
            </p>
          ) : null}
          <header className="explore-campus-feed-head">
            <div className="explore-campus-feed-author">
              {profilePath ? <Link className="explore-campus-author-avatar-link" to={profilePath} aria-label={`View ${post.author}'s profile`}><img src={post.avatar || '/assets/index/bee_nobg.png'} alt={post.author} loading="lazy" /></Link> : <img src={post.avatar || '/assets/index/bee_nobg.png'} alt={post.author} loading="lazy" />}
              <div>
                <h3>
                  {profilePath ? <Link className="explore-campus-author-link" to={profilePath}>{post.author} <span>{post.handle}</span></Link> : <>{post.author} <span>{post.handle}</span></>}
                </h3>
                <p>
                  {post.campus ? <span className="explore-campus-author-context">{post.campus}</span> : null}
                  {post.creatorProfileType === 'student' && post.zumbarlPoints !== null && post.zumbarlPoints !== undefined ? <span className="explore-campus-author-points" title="Zumbarl reputation points"><FiAward aria-hidden="true" />{Math.round(Number(post.zumbarlPoints) || 0)} Buzz</span> : null}
                  {post.taggedSpace ? <Link className="explore-campus-tagged-space-chip" to={post.taggedSpace.href}>{post.tag}</Link> : <em>{post.tag}</em>}
                  {(post.taggedAcademic || []).map((tag) => <Link className="explore-campus-tagged-space-chip is-academic" to={tag.href} key={`${tag.type}-${tag.id}`}>{tag.type === 'university' ? 'University' : tag.type === 'course' ? 'Course' : 'Unit'} · {tag.label}</Link>)}
                  {post.shopProductRef ? (
                    <button type="button" className="explore-campus-view-product-chip" title={`Open ${post.taggedProduct?.title || 'product'}`} onClick={() => onViewProduct(post)}>
                      <FiShoppingBag aria-hidden="true" />
                      {post.taggedProduct?.title || 'View product'}
                    </button>
                  ) : null}
                </p>
              </div>
            </div>
            {!post.resharedPost && (post.isMine || post.canEdit || post.canTakeDown) ? <button type="button" className="explore-campus-more-btn" aria-label={`More options for ${post.author}`} aria-expanded={openPostMenuId === post.id} onClick={() => setOpenPostMenuId((current) => current === post.id ? '' : post.id)}>
              ...
            </button> : null}
            {!post.resharedPost && openPostMenuId === post.id ? <div className="explore-post-menu">
              {(post.isMine || post.canEdit) ? <button type="button" onClick={() => { setOpenPostMenuId(''); onEditPost(post) }}>Edit post</button> : null}
              {post.isMine && allowAnnouncementSubmission ? <button type="button" disabled={['pending', 'approved'].includes(post.announcementRequest?.status)} onClick={() => { setOpenPostMenuId(''); onSubmitAnnouncement(post) }}>{post.announcementRequest?.status === 'pending' ? 'Announcement pending' : post.announcementRequest?.status === 'approved' ? 'Approved announcement' : 'Submit as announcement'}</button> : null}
              {post.canTakeDown && onTakeDownPost ? <button type="button" className="is-danger" onClick={() => { setOpenPostMenuId(''); onTakeDownPost(post) }}>Take down post</button> : null}
            </div> : null}
          </header>

          {post.copy ? <p className="explore-campus-feed-copy">{post.copy}</p> : null}
          {post.resharedPost ? <ResharedPostPreview onOpenMediaViewer={openExpandedMedia} post={post} /> : null}
          {post.event ? <button type="button" className="explore-feed-event" onClick={() => onOpenEvent(post)}><FiCalendar /><div><strong>{post.event.title}</strong><span>{new Date(post.event.startsAt).toLocaleString('en-KE')} · {post.event.location}</span><small>View event details</small></div></button> : null}
          {post.poll ? <FeedPoll error={engagementErrors?.[post.id]} isPending={Boolean(engagementPending?.[`${post.id}:poll`])} onVote={onVotePoll} post={post} /> : null}

          {post.gallery.length ? <div className={`explore-campus-feed-gallery${post.gallery.length === 1 ? ' is-single' : ''}`}>
            {(post.gallery.length > 3 ? post.gallery.slice(0, 3) : post.gallery).map((image, index) => {
              const hiddenCount = post.gallery.length - 3
              const edit = post.mediaEdits?.[index] || {}
              const videoFragment = edit.trimStart || edit.trimEnd ? `#t=${edit.trimStart || 0}${edit.trimEnd ? `,${edit.trimEnd}` : ''}` : ''

              return (
                <button
                  key={`${post.id}-${image}`}
                  type="button"
                  className="explore-campus-feed-gallery-item"
                  onClick={() => openExpandedMedia(post, index)}
                  aria-label={`Open image ${index + 1} from ${post.author} post`}
                >
                  {post.tag === 'Video' ? <video src={`${image}${videoFragment}`} controls onPlay={() => recordPostMediaInteraction(post, index, 'video_play')} /> : <img src={image} alt={`${post.author} post`} loading="lazy" style={{ objectPosition: `${edit.positionX ?? 50}% ${edit.positionY ?? 50}%`, transform: `scale(${edit.zoom || 1})` }} />}
                  {hiddenCount > 0 && index === 2 ? (
                    <span className="explore-campus-feed-gallery-badge">+{hiddenCount}</span>
                  ) : null}
                </button>
              )
            })}
          </div> : null}

          <footer className="explore-campus-feed-stats">
            <button
              type="button"
              className={post.viewerLiked ? 'is-active is-liked' : ''}
              aria-label={`${post.viewerLiked ? 'Unlike' : 'Like'} ${post.author}'s post`}
              aria-pressed={post.viewerLiked}
              disabled={engagementPending[`${post.id}:like`]}
              onClick={() => onLikePost(post)}
            >
              <FiHeart aria-hidden="true" />
              {post.stats.likes}
            </button>
            <button
              type="button"
              className={openCommentsByPost[post.id] ? 'is-active' : ''}
              aria-expanded={Boolean(openCommentsByPost[post.id])}
              onClick={() => setOpenCommentsByPost((current) => ({ ...current, [post.id]: !current[post.id] }))}
            >
              <FiMessageCircle aria-hidden="true" />
              {post.stats.comments}
            </button>
            {!resharePost.isMine ? <div className="explore-reshare-action">
              <button
                type="button"
                className={resharePost.viewerReshared ? 'is-active is-reshared' : ''}
                aria-label={`Open reshare options for ${resharePost.author}'s post`}
                aria-expanded={openReshareMenuId === post.id}
                disabled={engagementPending[`${resharePost.id}:reshare`]}
                onClick={() => setOpenReshareMenuId((current) => current === post.id ? '' : post.id)}
              >
                <FiRepeat aria-hidden="true" />
                {resharePost.stats.reposts}
              </button>
              {openReshareMenuId === post.id ? (
                <div className="explore-reshare-menu" role="menu">
                  <button type="button" role="menuitem" disabled={resharePost.viewerReshared} onClick={() => { setOpenReshareMenuId(''); onResharePost(resharePost, '').catch(() => {}) }}>
                    <FiRepeat aria-hidden="true" />
                    <span><strong>{resharePost.viewerReshared ? 'Reshared' : 'Reshare'}</strong><small>Share the original post with your network</small></span>
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setOpenReshareMenuId(''); setQuotePost(resharePost) }}>
                    <FiEdit3 aria-hidden="true" />
                    <span><strong>{resharePost.viewerReshared ? 'Edit your thoughts' : 'Reshare with your thoughts'}</strong><small>Add your own message before sharing</small></span>
                  </button>
                  {resharePost.viewerReshared ? (
                    <button className="is-danger" type="button" role="menuitem" onClick={() => { setOpenReshareMenuId(''); onRemoveReshare(resharePost).catch(() => {}) }}>
                      <FiTrash2 aria-hidden="true" />
                      <span><strong>Remove your reshare</strong><small>Delete it from the feed</small></span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div> : null}
            <button type="button" className="explore-campus-share-btn" aria-label={`Share ${post.author}'s post`} onClick={() => onSharePost(post)}>
              <FiShare2 aria-hidden="true" />
              <span>Share</span>
            </button>
            <button type="button" className="explore-campus-save-btn" aria-label={`Save ${post.author} post`}>
              <FiBookmark aria-hidden="true" />
            </button>
          </footer>
          {!post.poll && (engagementErrors[post.id] || engagementErrors[resharePost.id]) ? <p className="explore-post-engagement-error" role="alert">{engagementErrors[post.id] || engagementErrors[resharePost.id]}</p> : null}
          {openCommentsByPost[post.id] ? (
            <PostComments
              comments={commentsByPost[post.id] || []}
              onComment={onComment}
              post={post}
            />
          ) : null}
        </article>
        )
      })}
      {quotePost ? <ReshareComposer key={quotePost.id} onClose={() => setQuotePost(null)} onSubmit={onResharePost} post={quotePost} /> : null}
    </>
  )
}

export default ExploreFeed
