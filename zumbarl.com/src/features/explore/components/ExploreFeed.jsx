import { FiBookmark, FiBriefcase, FiCalendar, FiHeart, FiImage, FiMessageCircle, FiRepeat, FiSmile } from 'react-icons/fi'
import { BsPinAngleFill } from 'react-icons/bs'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function ExploreFeed({ activeFilter, onComposerPost, onEditPost, onOpenEvent, onOpenMediaViewer, onSubmitAnnouncement, onViewProduct, posts }) {
  const [openPostMenuId, setOpenPostMenuId] = useState('')
  return (
    <>
      <section className="explore-campus-composer-card" aria-label="Create a post">
        <div className="explore-campus-composer-head">
          <img src="/assets/index/bee_nobg.png" alt="Brian avatar" loading="lazy" />
          <button type="button" className="explore-campus-composer-input" onClick={() => onComposerPost('post')}>
            What's happening on campus?
          </button>
        </div>
        <div className="explore-campus-composer-actions">
          <button type="button" onClick={() => onComposerPost('media')}>
            <FiImage aria-hidden="true" />
            Photo/Video
          </button>
          <button type="button" onClick={() => onComposerPost('event')}>
            <FiCalendar aria-hidden="true" />
            Event
          </button>
          <button type="button" onClick={() => onComposerPost('poll')}>
            <FiBriefcase aria-hidden="true" />
            Poll
          </button>
          <button type="button" onClick={() => onComposerPost('feeling')}>
            <FiSmile aria-hidden="true" />
            Feeling/Activity
          </button>
          <button type="button" className="explore-campus-post-btn" onClick={() => onComposerPost('post')}>
            Post
          </button>
        </div>
      </section>

      {!posts.length ? <section className="explore-feed-empty" role="status"><strong>No {activeFilter.toLowerCase()} posts yet</strong><p>New posts matching this feed will appear here.</p></section> : null}

      {posts.map((post) => (
        <article key={post.id} className={`explore-campus-feed-card${post.isPinnedAnnouncement ? ' explore-campus-pinned-card' : ''}`} aria-label={`${post.author} post`}>
          {post.isPinnedAnnouncement ? <p className="explore-campus-pinned-label"><BsPinAngleFill aria-hidden="true" />Pinned Announcement</p> : null}
          <header className="explore-campus-feed-head">
            <div className="explore-campus-feed-author">
              {post.creatorId ? <Link className="explore-campus-author-avatar-link" to={post.creatorSlug ? `/campus/organizations/${encodeURIComponent(post.creatorSlug)}` : `/campus/profiles/${encodeURIComponent(post.creatorId)}`} aria-label={`View ${post.author}'s profile`}><img src={post.avatar || '/assets/index/bee_nobg.png'} alt={post.author} loading="lazy" /></Link> : <img src={post.avatar || '/assets/index/bee_nobg.png'} alt={post.author} loading="lazy" />}
              <div>
                <h3>
                  {post.creatorId ? <Link className="explore-campus-author-link" to={post.creatorSlug ? `/campus/organizations/${encodeURIComponent(post.creatorSlug)}` : `/campus/profiles/${encodeURIComponent(post.creatorId)}`}>{post.author} <span>{post.handle}</span></Link> : <>{post.author} <span>{post.handle}</span></>}
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
            <button type="button" className="explore-campus-more-btn" aria-label={`More options for ${post.author}`} aria-expanded={openPostMenuId === post.id} onClick={() => setOpenPostMenuId((current) => current === post.id ? '' : post.id)}>
              ...
            </button>
            {post.isMine && openPostMenuId === post.id ? <div className="explore-post-menu"><button type="button" onClick={() => { setOpenPostMenuId(''); onEditPost(post) }}>Edit post</button><button type="button" disabled={['pending', 'approved'].includes(post.announcementRequest?.status)} onClick={() => { setOpenPostMenuId(''); onSubmitAnnouncement(post) }}>{post.announcementRequest?.status === 'pending' ? 'Announcement pending' : post.announcementRequest?.status === 'approved' ? 'Approved announcement' : 'Submit as announcement'}</button></div> : null}
          </header>

          <p className="explore-campus-feed-copy">{post.copy}</p>
          {post.event ? <button type="button" className="explore-feed-event" onClick={() => onOpenEvent(post)}><FiCalendar /><div><strong>{post.event.title}</strong><span>{new Date(post.event.startsAt).toLocaleString('en-KE')} · {post.event.location}</span><small>View event details</small></div></button> : null}
          {post.poll ? <div className="explore-feed-poll"><strong>{post.poll.question}</strong>{post.poll.options.map((option) => { const item = typeof option === 'string' ? { id: option, label: option } : option; return <button type="button" key={item.id || item.value}>{item.label}</button> })}</div> : null}

          <div className={`explore-campus-feed-gallery${post.gallery.length === 1 ? ' is-single' : ''}`}>
            {(post.gallery.length > 3 ? post.gallery.slice(0, 3) : post.gallery).map((image, index) => {
              const hiddenCount = post.gallery.length - 3
              const edit = post.mediaEdits?.[index] || {}
              const videoFragment = edit.trimStart || edit.trimEnd ? `#t=${edit.trimStart || 0}${edit.trimEnd ? `,${edit.trimEnd}` : ''}` : ''

              return (
                <button
                  key={`${post.id}-${image}`}
                  type="button"
                  className="explore-campus-feed-gallery-item"
                  onClick={() => onOpenMediaViewer(post, index)}
                  aria-label={`Open image ${index + 1} from ${post.author} post`}
                >
                  {post.tag === 'Video' ? <video src={`${image}${videoFragment}`} controls /> : <img src={image} alt={`${post.author} post`} loading="lazy" style={{ objectPosition: `${edit.positionX ?? 50}% ${edit.positionY ?? 50}%`, transform: `scale(${edit.zoom || 1})` }} />}
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
