import { useEffect, useMemo, useState } from 'react'
import { FiFlag, FiSearch, FiUsers, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import { readAnnouncementTargets } from '../services/postService'

const EMPTY_GROUPS = []

function ExploreAnnouncementSubmissionModal({ onClose, onSubmit, post }) {
  const isOpen = Boolean(post)
  const dialogRef = useDialog({ isOpen, onClose: closeModal })
  const [targets, setTargets] = useState(null)
  const [targetType, setTargetType] = useState('')
  const [targetId, setTargetId] = useState('')
  const [groupQuery, setGroupQuery] = useState('')
  const [groupCategory, setGroupCategory] = useState('all')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!post) return
    readAnnouncementTargets().then(setTargets).catch((requestError) => setError(requestError.message || 'Could not load audiences.'))
  }, [post])

  const groups = targets?.groups || EMPTY_GROUPS
  const categories = useMemo(() => [...new Set(groups.map((group) => group.category).filter(Boolean))].sort(), [groups])
  const filteredGroups = useMemo(() => {
    const query = groupQuery.trim().toLowerCase()
    return groups.filter((group) => {
      const matchesCategory = groupCategory === 'all' || group.category === groupCategory
      const searchableText = [group.name, group.category, group.campus].filter(Boolean).join(' ').toLowerCase()
      return matchesCategory && (!query || searchableText.includes(query))
    })
  }, [groupCategory, groupQuery, groups])

  if (!isOpen) return null

  function closeModal() {
    setTargets(null)
    setTargetType('')
    setTargetId('')
    setGroupQuery('')
    setGroupCategory('all')
    setReason('')
    setError('')
    onClose()
  }

  function chooseTargetType(nextType) {
    setTargetType(nextType)
    setTargetId(nextType === 'campus' ? targets?.campus?.id || '' : '')
    setGroupQuery('')
    setGroupCategory('all')
  }

  async function submit(event) {
    event.preventDefault()
    if (!targetType || !targetId || reason.trim().length < 10) return
    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(post.id, { targetType, targetId, reason: reason.trim() })
      closeModal()
    } catch (submitError) {
      setError(submitError.message || 'Could not submit this post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section ref={dialogRef} className="explore-announcement-backdrop" role="dialog" aria-modal="true" aria-labelledby="announcement-submit-title" onClick={closeModal}>
      <form className="explore-announcement-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <header>
          <div><FiFlag /><span><small>Announcement review</small><h2 id="announcement-submit-title">Submit post for announcement</h2></span></div>
          <button type="button" onClick={closeModal} aria-label="Close"><FiX /></button>
        </header>
        <div className="explore-announcement-preview"><strong>{post.author}</strong><p>{post.copy}</p></div>
        <div className="explore-announcement-fields">
          <label>
            Target audience
            <select required value={targetType} onChange={(event) => chooseTargetType(event.target.value)}>
              <option value="">Choose an audience type</option>
              {targets?.campus ? <option value="campus">Campus</option> : null}
              {groups.length ? <option value="group">Group</option> : null}
            </select>
          </label>
          {targetType === 'campus' && targets?.campus ? (
            <label>Campus<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value={targets.campus.id}>{targets.campus.name}</option></select></label>
          ) : null}
          {targetType === 'group' ? (
            <div className="explore-announcement-group-picker">
              <div className="explore-announcement-group-filters" aria-label="Filter groups">
                <label>Search groups<span className="explore-announcement-search"><FiSearch aria-hidden="true" /><input type="search" value={groupQuery} onChange={(event) => { setGroupQuery(event.target.value); setTargetId('') }} placeholder="Search by name or campus" /></span></label>
                <label>Category<select value={groupCategory} onChange={(event) => { setGroupCategory(event.target.value); setTargetId('') }}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              </div>
              <label>Group<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Select a group ({filteredGroups.length} available)</option>{filteredGroups.map((group) => <option key={group.id} value={group.id}>{group.name}{group.category ? ` · ${group.category}` : ''}</option>)}</select></label>
              {!filteredGroups.length ? <p className="explore-announcement-empty">No groups match these filters.</p> : null}
            </div>
          ) : null}
          <p><FiUsers /> Only members of the approved campus or group will see this as a pinned announcement.</p>
          <label>Why should this be announced?<textarea minLength="10" maxLength="500" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain its relevance and urgency to this audience." /></label>
          {error ? <p className="explore-announcement-error" role="alert">{error}</p> : null}
        </div>
        <footer><button type="button" onClick={closeModal}>Cancel</button><button type="submit" disabled={!targetType || !targetId || reason.trim().length < 10 || isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit for review'}</button></footer>
      </form>
    </section>
  )
}

export default ExploreAnnouncementSubmissionModal
