import {
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiHeart,
  FiImage,
  FiMapPin,
  FiMessageCircle,
  FiRepeat,
  FiSmile,
} from 'react-icons/fi'
import { BsPinAngleFill } from 'react-icons/bs'

function ExploreFeed({ onComposerPost, onOpenMediaViewer, onViewProduct, posts, profileReady }) {
  return (
    <>
      <section className="explore-campus-composer-card" aria-label="Create a post">
        <div className="explore-campus-composer-head">
          <img src="/assets/index/bee_nobg.png" alt="Brian avatar" loading="lazy" />
          <button type="button" className="explore-campus-composer-input">
            {profileReady ? "What's happening on campus?" : 'Prepare your Connect profile to post'}
          </button>
        </div>
        <div className="explore-campus-composer-actions">
          <button type="button">
            <FiImage aria-hidden="true" />
            Photo/Video
          </button>
          <button type="button">
            <FiCalendar aria-hidden="true" />
            Event
          </button>
          <button type="button">
            <FiBriefcase aria-hidden="true" />
            Poll
          </button>
          <button type="button">
            <FiSmile aria-hidden="true" />
            Feeling/Activity
          </button>
          <button type="button" className="explore-campus-post-btn" onClick={onComposerPost}>
            {profileReady ? 'Post' : 'Prepare profile'}
          </button>
        </div>
      </section>

      <article className="explore-campus-feed-card explore-campus-pinned-card" aria-label="Pinned announcement">
        <header className="explore-campus-feed-head">
          <p className="explore-campus-pinned-label">
            <BsPinAngleFill aria-hidden="true" />
            Pinned Announcement
          </p>
          <button type="button" className="explore-campus-more-btn" aria-label="More announcement options">
            ...
          </button>
        </header>

        <div className="explore-campus-feed-author">
          <img src="/assets/index/bee_nobg.png" alt="Kenyatta University Official" loading="lazy" />
          <div>
            <h3>Kenyatta University Official</h3>
            <p>@KU_Official · 2h ago</p>
          </div>
        </div>

        <p className="explore-campus-feed-copy">
          The 3rd Annual Innovation & Entrepreneurship Summit is here! Join industry leaders, alumni and students as we shape the
          future together.
        </p>

        <footer className="explore-campus-pinned-meta">
          <span>
            <FiCalendar aria-hidden="true" />
            24 May, 2024
          </span>
          <span>
            <FiClock aria-hidden="true" />
            9:00 AM - 4:00 PM
          </span>
          <span>
            <FiMapPin aria-hidden="true" />
            Chandaria Auditorium
          </span>
          <button type="button" className="explore-campus-learn-btn">Learn More</button>
        </footer>
      </article>

      {posts.map((post) => (
        <article key={post.id} className="explore-campus-feed-card" aria-label={`${post.author} post`}>
          <header className="explore-campus-feed-head">
            <div className="explore-campus-feed-author">
              <img src="/assets/index/bee_nobg.png" alt={post.author} loading="lazy" />
              <div>
                <h3>
                  {post.author} <span>{post.handle}</span>
                </h3>
                <p>
                  <span>{post.time}</span>
                  <em>{post.tag}</em>
                  {post.tag === 'Product' && post.shopProductRef ? (
                    <button type="button" className="explore-campus-view-product-chip" onClick={() => onViewProduct(post)}>
                      View product
                    </button>
                  ) : null}
                </p>
              </div>
            </div>
            <button type="button" className="explore-campus-more-btn" aria-label={`More options for ${post.author}`}>
              ...
            </button>
          </header>

          <p className="explore-campus-feed-copy">{post.copy}</p>

          <div className={`explore-campus-feed-gallery${post.gallery.length === 1 ? ' is-single' : ''}`}>
            {(post.gallery.length > 3 ? post.gallery.slice(0, 3) : post.gallery).map((image, index) => {
              const hiddenCount = post.gallery.length - 3

              return (
                <button
                  key={`${post.id}-${image}`}
                  type="button"
                  className="explore-campus-feed-gallery-item"
                  onClick={() => onOpenMediaViewer(post.id, index)}
                  aria-label={`Open image ${index + 1} from ${post.author} post`}
                >
                  <img src={image} alt={`${post.author} post`} loading="lazy" />
                  {hiddenCount > 0 && index === 2 ? (
                    <span className="explore-campus-feed-gallery-badge">+{hiddenCount}</span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <footer className="explore-campus-feed-stats">
            <button type="button">
              <FiHeart aria-hidden="true" />
              {post.stats.likes}
            </button>
            <button type="button">
              <FiMessageCircle aria-hidden="true" />
              {post.stats.comments}
            </button>
            <button type="button">
              <FiRepeat aria-hidden="true" />
              {post.stats.reposts}
            </button>
            <button type="button" className="explore-campus-save-btn" aria-label={`Save ${post.author} post`}>
              <FiBookmark aria-hidden="true" />
            </button>
          </footer>
        </article>
      ))}
    </>
  )
}

export default ExploreFeed
