import { useMemo, useState } from 'react'
import ExploreFeed from './ExploreFeed'
import ExploreMediaModal from './ExploreMediaModal'
import ExplorePostEditModal from './ExplorePostEditModal'
import ExploreShareModal from './ExploreShareModal'
import {
  createConnectPostComment,
  createConnectPostReshare,
  removeConnectPostReshare,
  toggleConnectPostLike,
  voteOnConnectPostPoll,
} from '../services/postService'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function relativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mapComment(comment) {
  const author = comment.author || {}
  return {
    id: comment.id,
    author: author.name || comment.author || 'Zumbarl member',
    handle: author.handle || comment.handle || '@member',
    avatar: normalizeZumbarlFileUrl(author.avatarUrl || comment.avatar),
    text: comment.body || comment.text || '',
    time: relativeTime(comment.createdAt),
  }
}

function mapEntityPost(post, identity, canEdit, canTakeDown) {
  const payload = post.payload && typeof post.payload === 'object' ? post.payload : {}
  const record = { ...payload, ...post }
  const type = String(record.type || 'post').toLowerCase()
  const mediaUrls = record.mediaUrls || record.gallery || []
  const reactions = record.reactions && typeof record.reactions === 'object' ? record.reactions : {}
  const comments = Array.isArray(record.comments) ? record.comments : []
  return {
    id: record.id,
    type,
    creatorId: identity.id,
    creatorSlug: identity.slug,
    creatorProfileType: identity.profileType,
    author: identity.name,
    handle: identity.handle || identity.label || 'Zumbarl page',
    campus: identity.campus || null,
    zumbarlPoints: identity.zumbarlPoints ?? null,
    avatar: normalizeZumbarlFileUrl(identity.avatar) || '/assets/index/bee_nobg.png',
    time: record.updatedAt && record.updatedAt !== record.createdAt ? `Edited · ${relativeTime(record.updatedAt)}` : relativeTime(record.createdAt),
    tag: record.feeling?.label ? `${record.feeling.emoji || ''} ${record.feeling.label}`.trim() : type === 'video' ? 'Video' : type === 'image' ? 'Photo' : type === 'poll' ? 'Poll' : type === 'event' ? 'Event' : 'Update',
    copy: record.body || '',
    gallery: mediaUrls.map(normalizeZumbarlFileUrl).filter(Boolean),
    mediaEdits: record.mediaEdits || [],
    event: record.event && Object.keys(record.event).length ? record.event : null,
    poll: record.poll && Object.keys(record.poll).length ? record.poll : null,
    isMine: false,
    canEdit,
    canTakeDown,
    stats: {
      likes: Number(record.reactionCount ?? Object.keys(reactions).length),
      comments: Number(record.commentCount ?? comments.length),
      reposts: Number(record.repostCount ?? record.reposts ?? 0),
    },
    viewerLiked: Boolean(record.viewerReacted),
    viewerReshared: Boolean(record.viewerReshared),
    viewerReshareCommentary: record.viewerReshareCommentary || '',
    comments: comments.map(mapComment),
  }
}

function engagementSnapshot(post) {
  return {
    body: post.copy || 'Shared post',
    type: post.type || 'post',
    mediaUrls: post.gallery || [],
    mediaEdits: post.mediaEdits || [],
    creator: {
      id: post.creatorId || undefined,
      slug: post.creatorSlug || undefined,
      profileType: post.creatorProfileType || undefined,
      name: post.author,
      handle: post.handle,
      avatarUrl: post.avatar || null,
      campus: post.campus || null,
      zumbarlPoints: post.zumbarlPoints ?? undefined,
    },
    reactionCount: Number(post.stats?.likes || 0),
    commentCount: Number(post.stats?.comments || 0),
    repostCount: Number(post.stats?.reposts || 0),
  }
}

function ManagedEntityFeed({ identity, onEditPost = null, onTakeDownPost = null, posts }) {
  const mappedPosts = useMemo(() => posts.map((post) => mapEntityPost(post, identity, Boolean(onEditPost), Boolean(onTakeDownPost))), [identity, onEditPost, onTakeDownPost, posts])
  const [overrides, setOverrides] = useState({})
  const [pending, setPending] = useState({})
  const [errors, setErrors] = useState({})
  const [comments, setComments] = useState(() => Object.fromEntries(mappedPosts.map((post) => [post.id, post.comments])))
  const [activeMedia, setActiveMedia] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const visiblePosts = mappedPosts.map((post) => ({ ...post, ...(overrides[post.id] || {}), stats: { ...post.stats, ...(overrides[post.id]?.stats || {}) } }))

  async function addComment(id, body, post) {
    const activePost = post || visiblePosts.find((candidate) => candidate.id === id)
    const saved = await createConnectPostComment(id, body, engagementSnapshot(activePost || {}))
    const comment = mapComment(saved)
    setComments((current) => ({ ...current, [id]: [...(current[id] || []), comment] }))
    setOverrides((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), stats: { ...(current[id]?.stats || {}), comments: Number(activePost?.stats?.comments || 0) + 1 } },
    }))
    return comment
  }

  async function toggleLike(post) {
    const key = `${post.id}:like`
    const previousLiked = Boolean(post.viewerLiked)
    const previousCount = Number(post.stats.likes || 0)
    setPending((current) => ({ ...current, [key]: true }))
    setOverrides((current) => ({ ...current, [post.id]: { ...(current[post.id] || {}), viewerLiked: !previousLiked, stats: { ...(current[post.id]?.stats || {}), likes: Math.max(0, previousCount + (previousLiked ? -1 : 1)) } } }))
    try {
      const saved = await toggleConnectPostLike(post.id, engagementSnapshot(post))
      setOverrides((current) => ({ ...current, [post.id]: { ...(current[post.id] || {}), viewerLiked: saved.viewerReacted, stats: { ...(current[post.id]?.stats || {}), likes: saved.reactionCount } } }))
    } catch (error) {
      setOverrides((current) => ({ ...current, [post.id]: { ...(current[post.id] || {}), viewerLiked: previousLiked, stats: { ...(current[post.id]?.stats || {}), likes: previousCount } } }))
      setErrors((current) => ({ ...current, [post.id]: error.message || 'Could not update this reaction.' }))
    } finally {
      setPending((current) => ({ ...current, [key]: false }))
    }
  }

  async function setReshare(post, active, commentary = '') {
    const key = `${post.id}:reshare`
    setPending((current) => ({ ...current, [key]: true }))
    try {
      const saved = active
        ? await createConnectPostReshare(post.id, engagementSnapshot(post), commentary)
        : await removeConnectPostReshare(post.id)
      setOverrides((current) => ({ ...current, [post.id]: { ...(current[post.id] || {}), viewerReshared: saved.viewerReshared, viewerReshareCommentary: saved.viewerReshareCommentary || '', stats: { ...(current[post.id]?.stats || {}), reposts: saved.repostCount } } }))
    } catch (error) {
      setErrors((current) => ({ ...current, [post.id]: error.message || 'Could not update this reshare.' }))
      throw error
    } finally {
      setPending((current) => ({ ...current, [key]: false }))
    }
  }

  async function voteOnPoll(post, optionIds) {
    const key = `${post.id}:poll`
    setPending((current) => ({ ...current, [key]: true }))
    setErrors((current) => ({ ...current, [post.id]: '' }))
    try {
      const saved = await voteOnConnectPostPoll(post.id, optionIds)
      setOverrides((current) => ({ ...current, [post.id]: { ...(current[post.id] || {}), poll: saved.poll } }))
      return saved.poll
    } catch (error) {
      setErrors((current) => ({ ...current, [post.id]: error.message || 'Your poll choice could not be saved.' }))
      throw error
    } finally {
      setPending((current) => ({ ...current, [key]: false }))
    }
  }

  function openMedia(post, index) {
    setActiveMedia({ post, index })
  }

  function sharePost(post) {
    setShareTarget({
      kind: 'post',
      id: post.id,
      author: post.author,
      text: post.copy,
      title: `${post.author} on Zumbarl`,
      url: `${window.location.origin}/campus/explore?post=${encodeURIComponent(post.id)}`,
    })
  }

  const activeMediaPost = activeMedia?.post || null
  const activeMediaIndex = activeMedia?.index || 0
  return <>
    <div className="managed-entity-explore-feed">
      <ExploreFeed
        activeFilter="Page"
        allowAnnouncementSubmission={false}
        commentsByPost={comments}
        engagementErrors={errors}
        engagementPending={pending}
        onComment={addComment}
        onComposerPost={() => {}}
        onEditPost={setEditingPost}
        onLikePost={toggleLike}
        onOpenEvent={() => {}}
        onOpenMediaViewer={openMedia}
        onRemoveReshare={(post) => setReshare(post, false)}
        onResharePost={(post, commentary) => setReshare(post, true, commentary)}
        onSharePost={sharePost}
        onSubmitAnnouncement={() => {}}
        onTakeDownPost={onTakeDownPost}
        onVotePoll={voteOnPoll}
        onViewProduct={() => {}}
        posts={visiblePosts}
        showComposer={false}
      />
    </div>
    <ExploreMediaModal
      activeMediaComments={activeMediaPost ? comments[activeMediaPost.id] || [] : []}
      activeMediaImage={activeMediaPost?.gallery?.[activeMediaIndex] || ''}
      activeMediaIndex={activeMediaIndex}
      activeMediaPost={activeMediaPost}
      onClose={() => setActiveMedia(null)}
      onComment={(id, body) => addComment(id, body, activeMediaPost)}
      onSharePost={sharePost}
      onStep={(direction) => setActiveMedia((current) => {
        if (!current?.post?.gallery?.length) return current
        return { ...current, index: (current.index + direction + current.post.gallery.length) % current.post.gallery.length }
      })}
    />
    <ExploreShareModal target={shareTarget} onClose={() => setShareTarget(null)} />
    <ExplorePostEditModal
      post={editingPost}
      onClose={() => setEditingPost(null)}
      onSave={onEditPost || (() => Promise.resolve())}
    />
  </>
}

export default ManagedEntityFeed
