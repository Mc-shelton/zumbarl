import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

function ExploreMediaModal({
  activeMediaComments,
  activeMediaImage,
  activeMediaIndex,
  activeMediaPost,
  onClose,
  onStep,
}) {
  if (!activeMediaPost || !activeMediaImage) {
    return null
  }

  return (
    <section className="explore-campus-media-modal" role="dialog" aria-modal="true" aria-label="Post media viewer" onClick={onClose}>
      <div className="explore-campus-media-content" onClick={(event) => event.stopPropagation()}>
        <section className="explore-campus-media-frame">
          <button type="button" className="explore-campus-media-close" onClick={onClose} aria-label="Close media viewer">
            <FiX aria-hidden="true" />
          </button>

          <div className="explore-campus-media-stage">
            <button type="button" className="explore-campus-media-nav prev" onClick={() => onStep(-1)} aria-label="Previous image">
              <FiChevronLeft aria-hidden="true" />
            </button>

            <img src={activeMediaImage} alt={`${activeMediaPost.author} shared media`} className="explore-campus-media-image" />

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
            <span>{activeMediaPost.stats.comments} comments</span>
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

          <form className="explore-campus-media-comment-box" onSubmit={(event) => event.preventDefault()}>
            <input type="text" placeholder="Add a comment..." aria-label="Add a comment" />
            <button type="submit">Post</button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export default ExploreMediaModal
