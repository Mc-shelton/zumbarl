function normalizedHandle(value) {
  const handle = String(value || '').trim().replace(/^@/, '')
  return ['student', 'creator'].includes(handle.toLowerCase()) ? '' : handle
}

function creatorProfilePath(creator = {}) {
  const reference = creator.slug || creator.id || normalizedHandle(creator.handle)
  if (!reference) return ''
  const profileType = String(creator.profileType || '').toLowerCase()
  if (profileType.startsWith('knowledge-')) {
    return `/campus/learn/spaces/${encodeURIComponent(reference)}`
  }
  const isOrganization = Boolean(creator.slug || (profileType && !['student', 'person'].includes(profileType)))
  return isOrganization
    ? `/campus/organizations/${encodeURIComponent(reference)}`
    : `/campus/profiles/${encodeURIComponent(reference)}`
}

function postCreatorProfilePath(post = {}) {
  if (String(post.creatorProfileType || '').startsWith('knowledge-')) {
    const reference = post.creatorSlug || post.creatorId
    return reference ? `/campus/learn/spaces/${encodeURIComponent(reference)}` : ''
  }
  return creatorProfilePath({
    id: post.creatorId,
    slug: post.creatorSlug,
    profileType: post.creatorProfileType,
    handle: post.handle,
  })
}

export { creatorProfilePath, postCreatorProfilePath }
