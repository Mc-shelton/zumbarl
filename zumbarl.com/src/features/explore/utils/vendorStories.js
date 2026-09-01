import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function vendorViewedStoryStorageKey(vendorId) {
  return `zumbarl:viewed-vendor-stories:${vendorId}`
}

function readViewedVendorStoryIds(vendorId) {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(vendorViewedStoryStorageKey(vendorId)) || '[]'))
  } catch {
    return new Set()
  }
}

function markVendorStoryViewed(vendorId, storyId) {
  const viewedIds = readViewedVendorStoryIds(vendorId)
  viewedIds.add(storyId)
  window.localStorage.setItem(vendorViewedStoryStorageKey(vendorId), JSON.stringify([...viewedIds]))
}

function buildVendorStoryCreator(shop, records = []) {
  if (!shop) return null
  const viewedIds = readViewedVendorStoryIds(shop.id)
  const items = records
    .filter((record) => record.creator?.profileType === 'vendor' && (record.creator.id === shop.id || record.creator.slug === shop.slug))
    .map((record) => ({
      id: record.id,
      type: record.mediaType || 'image',
      media: normalizeZumbarlFileUrl(record.mediaUrl),
      poster: normalizeZumbarlFileUrl(record.poster),
      storyKind: record.storyKind || record.context || 'vendor',
      title: record.title || `${shop.name} story`,
      caption: record.text,
      time: 'Recently',
      likes: Number(record.reactionCount || 0),
      comments: Number(record.commentCount || 0),
      product: record.product || null,
      trimStart: record.trimStart || 0,
      trimEnd: record.trimEnd || null,
      duration: record.trimEnd ? Math.max(500, (record.trimEnd - (record.trimStart || 0)) * 1000) : undefined,
      isViewed: viewedIds.has(record.id),
    }))

  if (!items.length) return null
  return {
    id: `vendor-story-${shop.id}`,
    name: shop.name,
    shortName: shop.name,
    handle: 'Campus vendor',
    campus: shop.campus || shop.locationLabel || 'Campus vendor',
    avatar: normalizeZumbarlFileUrl(shop.logoUrl) || '/assets/knowledge/default-group-avatar.svg',
    storyCategory: 'pages',
    items,
  }
}

export { buildVendorStoryCreator, markVendorStoryViewed }
