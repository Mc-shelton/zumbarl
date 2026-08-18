import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

function ExploreMediaModal({
  activeMediaComments,
  activeMediaImage,
  activeMediaIndex,
  activeMediaPost,
  onClose,
  onComment,
  onStep,
}) {
  const [comment, setComment] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  const isOpen = Boolean(activeMediaPost && activeMediaImage)
  const dialogRef = useDialog({ isOpen, onClose })

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

            {activeMediaPost.tag === 'Video' ? <video src={activeMediaImage} className="explore-campus-media-image" controls autoPlay /> : <img src={activeMediaImage} alt={`${activeMediaPost.author} shared media`} className="explore-campus-media-image" />}

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
            <h3>Comments</h3>
            <span>{activeMediaComments.length} {activeMediaComments.length === 1 ? 'comment' : 'comments'}</span>
          </header>

          <section className="explore-campus-media-post-context">
            <div className="explore-campus-media-post-head">
              <img
                src={activeMediaPost.avatar || '/assets/index/bee_nobg.png'}
                alt={activeMediaPost.author}
                loading="lazy"
              />
              <div>
                <h4>{activeMediaPost.author}</h4>
                <span>{activeMediaPost.handle}</span>
              </div>
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
