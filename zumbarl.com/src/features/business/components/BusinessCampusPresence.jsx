import { FiArrowRight, FiCheckCircle, FiEdit3, FiImage, FiLink, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function relativePostTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  if (elapsedMinutes < 1440) return `${Math.round(elapsedMinutes / 60)}h ago`
  return new Date(timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function postLabel(type) {
  if (type === 'image') return 'Photo post'
  if (type === 'video') return 'Video post'
  if (type === 'poll') return 'Campus poll'
  if (type === 'feeling') return 'Milestone'
  return 'Campus update'
}

export function BusinessCampusPresence({ business, onCopyStudentLink, onCreatePost, postCount = 0, posts = [] }) {
  const publisher = business?.publisher
  const recentPosts = posts.slice(0, 3)

  return (
    <section className="business-campus-presence" aria-labelledby="business-campus-presence-title">
      <div className="business-campus-presence-hero">
        <div className="business-campus-presence-copy">
          <span className="business-campus-presence-mark" aria-hidden="true"><img src={normalizeZumbarlFileUrl(business?.logoUrl) || '/assets/index/bee_nobg.png'} alt="" /></span>
          <div>
            <span className="business-dashboard-eyebrow">Your campus presence</span>
            <h2 id="business-campus-presence-title">Show students what {business?.name || 'your team'} is building.</h2>
            <p>Share company updates, useful ideas, work culture and milestones directly into Explore Campus.</p>
            <div className="business-campus-presence-actions">
              <button type="button" onClick={onCreatePost}><FiEdit3 aria-hidden="true" />Create campus post</button>
              <Link to="/business/opportunities/create">Create opportunity<FiArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
        <aside className="business-campus-presence-status" aria-label="Campus presence status">
          <span><strong>{postCount}</strong><small>Published posts</small></span>
          <span><FiCheckCircle aria-hidden="true" /><small>{publisher ? 'Public page ready' : 'Created on first post'}</small></span>
          {publisher ? <button type="button" onClick={() => onCopyStudentLink(`/campus/organizations/${encodeURIComponent(publisher.slug)}`)}>Copy student page link<FiLink aria-hidden="true" /></button> : null}
        </aside>
      </div>

      <div className="business-campus-posts">
        <header>
          <div><span>From your business</span><h3>Recent campus posts</h3><p>Every published update appears in Explore Campus as your verified business identity.</p></div>
          <button type="button" onClick={onCreatePost}><FiPlus aria-hidden="true" />New post</button>
        </header>
        {recentPosts.length ? <div className="business-campus-post-grid">
          {recentPosts.map((post) => {
            const mediaUrl = normalizeZumbarlFileUrl(post.mediaUrls?.[0])
            return <article className="business-campus-post-card" key={post.id}>
              <span className={`business-campus-post-visual${mediaUrl ? ' has-media' : ''}`}>
                {mediaUrl ? (post.type === 'video' ? <video src={mediaUrl} muted /> : <img src={mediaUrl} alt="" loading="lazy" />) : <><FiImage aria-hidden="true" /><small>{postLabel(post.type)}</small></>}
              </span>
              <span className="business-campus-post-copy"><small>{postLabel(post.type)} · {relativePostTime(post.createdAt)}</small><strong>{post.body}</strong><button type="button" onClick={() => onCopyStudentLink(`/campus/explore/posts/${encodeURIComponent(post.id)}`)}>Copy student link<FiLink aria-hidden="true" /></button></span>
            </article>
          })}
        </div> : <div className="business-campus-post-empty">
          <span><FiEdit3 aria-hidden="true" /></span>
          <div><strong>Your business has a voice here.</strong><p>Publish the first update and students will discover it naturally in Explore Campus.</p></div>
          <button type="button" onClick={onCreatePost}>Create your first post<FiArrowRight aria-hidden="true" /></button>
        </div>}
      </div>
    </section>
  )
}
