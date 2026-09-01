import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiShare2, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDialog } from '../../../components/ui'
import { postCreatorProfilePath } from '../utils/creatorProfilePath'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function ExploreMediaModal({
  activeMediaComments,
  activeMediaImage,
  activeMediaIndex,
  activeMediaPost,
  onClose,
  onComment,
  onSharePost,
  onStep,
}) {
  const [comment, setComment] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  const isOpen = Boolean(activeMediaPost && activeMediaImage)
  const dialogRef = useDialog({ isOpen, onClose })

  // Each selected post owns a separate comment draft.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setComment(''); setError('') }, [activeMediaPost?.id])

  async function submitComment(event) {
    event.preventDefault()
    const body = comment.trim()
    if (!body || isPosting) return
    setIsPosting(true)
    setError('')
    try {
      await onComment(activeMediaPost.id, body)
      setComment('')
    } catch (submissionError) {
      setError(submissionError?.message || 'Could not post your comment. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  if (!isOpen) {
    return null
  }
  const profilePath = postCreatorProfilePath(activeMediaPost)

  function recordVideoPlay() {
    recordRecommendationInteraction({
      surface: 'connect_feed',
      entityType: 'connect_post',
      entityId: String(activeMediaPost.id),
      eventType: 'video_play',
      metadata: { location: 'viewer', mediaIndex: activeMediaIndex, mediaType: 'video' },
    })
  }

  return (
    <section ref={dialogRef} className="explore-campus-media-modal" role="dialog" aria-modal="true" aria-label="Post media viewer" onClick={onClose}>
      <div className="explore-campus-media-content" onClick={(event) => event.stopPropagation()}>
        <section className="explore-campus-media-frame">
          <button type="button" className="explore-campus-media-close" onClick={onClose} aria-label="Close media viewer">
            <FiX aria-hidden="true" />
          </button>

          <div className="explore-campus-media-stage">
            <button type="button" className="explore-campus-media-nav prev" onClick={() => onStep(-1)} aria-label="Previous image">
              <FiChevronLeft aria-hidden="true" />
            </button>

            {activeMediaPost.tag === 'Video' ? <video src={activeMediaImage} className="explore-campus-media-image" controls autoPlay onPlay={recordVideoPlay} /> : <img src={activeMediaImage} alt={`${activeMediaPost.author} shared media`} className="explore-campus-media-image" />}

            <button type="button" className="explore-campus-media-nav next" onClick={() => onStep(1)} aria-label="Next image">
              <FiChevronRight aria-hidden="true" />
            </button>

            <p className="explore-campus-media-count">
              {activeMediaIndex + 1} / {activeMediaPost.gallery.length}
            </p>
          </div>
        </section>

        <aside className="explore-campus-media-comments" aria-label="Post comments">
          <header>
            <div>
              <h3>Comments</h3>
              <span>{activeMediaComments.length} {activeMediaComments.length === 1 ? 'comment' : 'comments'}</span>
            </div>
            <button type="button" className="explore-campus-media-share" onClick={() => onSharePost(activeMediaPost)}>
              <FiShare2 aria-hidden="true" /> Share
            </button>
          </header>

          <section className="explore-campus-media-post-context">
            <div className="explore-campus-media-post-head">
              {profilePath ? (
                <Link className="explore-campus-media-owner-avatar" to={profilePath} aria-label={`View ${activeMediaPost.author}'s profile`}>
                  <img src={activeMediaPost.avatar || '/assets/index/bee_nobg.png'} alt={activeMediaPost.author} loading="lazy" />
                </Link>
              ) : <img src={activeMediaPost.avatar || '/assets/index/bee_nobg.png'} alt={activeMediaPost.author} loading="lazy" />}
              {profilePath ? (
                <Link className="explore-campus-media-owner-copy" to={profilePath}>
                  <h4>{activeMediaPost.author}</h4>
                  <span>{activeMediaPost.handle}</span>
                </Link>
              ) : <div><h4>{activeMediaPost.author}</h4><span>{activeMediaPost.handle}</span></div>}
            </div>
            <p>{activeMediaPost.copy}</p>
          </section>

          <div className="explore-campus-media-thread">
            {!activeMediaComments.length ? <p className="explore-campus-media-comments-empty">No comments yet. Start the conversation.</p> : null}
            {activeMediaComments.map((comment) => (
              <article key={comment.id}>
                <img
                  className="explore-campus-media-comment-avatar"
                  src={comment.avatar || '/assets/index/bee_nobg.png'}
                  alt={comment.author}
                  loading="lazy"
                />
                <div className="explore-campus-media-comment-body">
                  <div className="explore-campus-media-comment-head">
                    <strong>{comment.author}</strong>
                    <span>{comment.handle} · {comment.time}</span>
                  </div>
                  <p>{comment.text}</p>
                </div>
              </article>
            ))}
          </div>

          {error ? <p className="explore-campus-media-comment-error" role="alert">{error}</p> : null}
          <form className="explore-campus-media-comment-box" onSubmit={submitComment}>
            <input type="text" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment..." aria-label="Add a comment" maxLength={1000} />
            <button type="submit" disabled={!comment.trim() || isPosting}>{isPosting ? 'Posting…' : 'Post'}</button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export default ExploreMediaModal
