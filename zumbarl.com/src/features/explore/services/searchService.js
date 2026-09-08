import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { mapMarketplaceApiListing } from '../../opportunities/services/marketplaceInteractionService'
import { searchEventOrganizers } from './postService'

const DEFAULT_AVATAR = '/assets/index/bee_nobg.png'
const DEFAULT_MARKET_IMAGE = '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp'

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function searchTokens(value) {
  return [...new Set(normalizeSearchText(value).split(' ').filter((token) => token.length > 1))]
}

function editDistance(left, right) {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length
  let beforePrevious = null
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      )
      if (beforePrevious && row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1]) {
        current[column] = Math.min(current[column], beforePrevious[column - 2] + 1)
      }
    }
    beforePrevious = previous
    previous = current
  }
  return previous[right.length]
}

function fieldTokenScore(queryToken, words) {
  let best = 0
  for (const word of words) {
    if (word === queryToken) best = Math.max(best, 28)
    else if (word.startsWith(queryToken) || queryToken.startsWith(word)) best = Math.max(best, 19)
    else if (word.includes(queryToken) || queryToken.includes(word)) best = Math.max(best, 13)
    else if (queryToken.length >= 4 && word.length >= 4) {
      const distance = editDistance(queryToken, word)
      const tolerance = Math.max(queryToken.length, word.length) >= 8 ? 2 : 1
      if (distance <= tolerance) best = Math.max(best, 10 - distance)
    }
  }
  return best
}

function relevanceScore(query, weightedFields) {
  const normalizedQuery = normalizeSearchText(query)
  const tokens = searchTokens(query)
  if (!normalizedQuery || !tokens.length) return 0
  let total = 0
  let matchedTokens = 0

  for (const token of tokens) {
    let tokenBest = 0
    for (const [value, weight = 1] of weightedFields) {
      const field = normalizeSearchText(value)
      if (!field) continue
      const words = field.split(' ')
      tokenBest = Math.max(tokenBest, fieldTokenScore(token, words) * weight)
    }
    if (tokenBest > 0) matchedTokens += 1
    total += tokenBest
  }

  for (const [value, weight = 1] of weightedFields) {
    const field = normalizeSearchText(value)
    if (!field) continue
    if (field === normalizedQuery) total += 140 * weight
    else if (field.startsWith(normalizedQuery)) total += 80 * weight
    else if (field.includes(normalizedQuery)) total += 55 * weight
  }

  if (matchedTokens === tokens.length) total += 45
  else if (tokens.length > 1 && matchedTokens / tokens.length < 0.6) return 0
  return total
}

function uniqueBy(items, keyForItem) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyForItem(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function ranked(items, query, fieldsForItem) {
  return items
    .map((item) => ({ ...item, relevance: relevanceScore(query, fieldsForItem(item)) }))
    .filter((item) => item.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance || new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
}

function organizationHref(item) {
  if (item.slug) return `/campus/organizations/${encodeURIComponent(item.slug)}`
  if (item.type === 'campus') return `/campus/explore?campus=${encodeURIComponent(item.name)}`
  return ''
}

function fulfilledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

async function searchCampus(query, feedPosts = []) {
  const tokens = searchTokens(query)
  const directoryQueries = [query, ...tokens]
    .filter((value, index, values) => value && values.findIndex((candidate) => normalizeSearchText(candidate) === normalizeSearchText(value)) === index)
    .slice(0, 4)
  const requests = [
    Promise.all(directoryQueries.map((value) => searchEventOrganizers(value))),
    sendZumbarlApiRequest('/connect/feed?pageSize=100'),
    sendZumbarlApiRequest('/marketplace/listings?pageSize=100'),
    sendZumbarlApiRequest('/marketplace/shops?pageSize=100'),
    sendZumbarlApiRequest('/earn/opportunities?pageSize=100'),
    sendZumbarlApiRequest('/learn/knowledge'),
  ]
  const [directoryResult, feedResult, listingResult, shopResult, opportunityResult, knowledgeResult] = await Promise.allSettled(requests)
  const failures = [directoryResult, feedResult, listingResult, shopResult, opportunityResult, knowledgeResult].filter((result) => result.status === 'rejected').length
  if (failures === requests.length && !feedPosts.length) throw new Error('Search services are unavailable right now. Please try again.')

  const directoryPayloads = fulfilledValue(directoryResult, [])
  const directory = uniqueBy(directoryPayloads.flatMap((payload) => payload?.data || []), (item) => `${item.type}:${item.slug || item.id}`)
  const people = ranked(
    directory.filter((item) => item.type === 'person').map((person) => ({
      ...person,
      kind: 'people',
      avatar: normalizeZumbarlFileUrl(person.avatarUrl) || DEFAULT_AVATAR,
      href: `/campus/profiles/${encodeURIComponent(person.id)}`,
      subtitle: [person.role, person.campus].filter(Boolean).join(' · '),
    })),
    query,
    (person) => [[person.name, 4], [person.handle, 3], [person.role, 2], [person.campus, 1.5], [person.bio, 1], [(person.skills || []).join(' '), 2]],
  )

  const directoryPages = directory.filter((item) => item.type !== 'person').map((page) => ({
    ...page,
    kind: 'pages',
    avatar: normalizeZumbarlFileUrl(page.avatarUrl) || DEFAULT_AVATAR,
    href: organizationHref(page),
    subtitle: [String(page.type || 'page').replaceAll('_', ' '), page.location].filter(Boolean).join(' · '),
  }))

  const shopsPayload = fulfilledValue(shopResult, { data: [] })
  const shopPages = (shopsPayload?.data || []).map((shop) => ({
    id: shop.id,
    slug: shop.slug,
    type: 'vendor',
    kind: 'pages',
    name: shop.name,
    handle: shop.tagline || shop.category,
    bio: shop.description,
    location: shop.campus || shop.locationLabel,
    avatar: normalizeZumbarlFileUrl(shop.logoUrl) || DEFAULT_AVATAR,
    href: `/campus/vendors/${encodeURIComponent(shop.slug)}`,
    subtitle: ['Marketplace page', shop.campus || shop.locationLabel].filter(Boolean).join(' · '),
    updatedAt: shop.updatedAt,
  }))
  const pages = ranked(uniqueBy([...directoryPages, ...shopPages].filter((item) => item.href), (item) => item.href), query, (page) => (
    [[page.name, 4], [page.handle, 3], [page.type, 1.5], [page.bio, 1], [page.location, 1]]
  ))

  const listingsPayload = fulfilledValue(listingResult, { data: [] })
  const marketplace = ranked((listingsPayload?.data || []).map(mapMarketplaceApiListing).filter(Boolean).map((item) => ({
    ...item,
    kind: 'marketplace',
    href: `/campus/opportunities/buy-sell/${encodeURIComponent(item.id)}`,
    ownerName: item.shop?.name || item.seller?.name || 'Campus seller',
    ownerAvatar: normalizeZumbarlFileUrl(item.shop?.logoUrl || item.seller?.avatarUrl) || DEFAULT_AVATAR,
    school: item.seller?.campus || item.location,
  })), query, (item) => (
    [[item.title, 4], [item.category, 3], [item.description, 1.5], [item.condition, 1], [item.ownerName, 2.5], [item.school, 1], [(item.variants || []).join(' '), 1]]
  ))

  const opportunityPayload = fulfilledValue(opportunityResult, { data: [] })
  const projects = ranked((opportunityPayload?.data || []).map((item) => ({
    ...item,
    kind: 'projects',
    href: `/campus/opportunities?opportunity=${encodeURIComponent(item.id)}`,
    image: normalizeZumbarlFileUrl(item.image || item.previewImage),
    meta: [item.opportunityType || item.category, item.engagementMode || item.duration].filter(Boolean).join(' · '),
  })), query, (item) => (
    [[item.title, 4], [item.company, 3], [item.category, 2], [item.summary, 1.5], [item.description, 1], [(item.requiredSkills || item.skills || []).toString(), 2]]
  ))

  const feedPayload = fulfilledValue(feedResult, { data: [] })
  const persistedPosts = (feedPayload?.data || []).map((post) => ({
    id: post.id,
    copy: post.body,
    event: post.event,
    author: post.creator?.name,
    handle: post.creator?.handle,
    campus: post.creator?.campus,
    avatar: post.creator?.avatarUrl,
    tag: post.type,
    gallery: post.mediaUrls || [],
    tagReferences: (post.tags || []).map((tag) => `${tag.type}:${tag.id}`),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }))
  const posts = ranked(uniqueBy([...(feedPosts || []), ...persistedPosts], (post) => post.id).map((post) => ({
    ...post,
    kind: 'posts',
    href: `/campus?post=${encodeURIComponent(post.id)}`,
    image: normalizeZumbarlFileUrl(post.gallery?.[0] || post.avatar),
    title: post.copy || post.event?.title || `${post.author || 'Zumbarl member'}'s post`,
    meta: [post.author, post.tag, post.campus].filter(Boolean).join(' · '),
  })), query, (post) => (
    [[post.copy, 4], [post.event?.title, 4], [post.author, 3], [post.handle, 2], [post.tag, 1.5], [post.campus, 1], [(post.tagReferences || []).join(' '), 1]]
  ))

  const knowledge = fulfilledValue(knowledgeResult, { resources: [], libraries: [], groups: [] })
  const resources = ranked((knowledge?.resources || []).map((resource) => ({
    ...resource,
    kind: 'resources',
    href: `/campus/learn?resource=${encodeURIComponent(resource.id)}`,
    image: normalizeZumbarlFileUrl(resource.coverImageUrl) || DEFAULT_MARKET_IMAGE,
    meta: [String(resource.type || 'resource').replaceAll('_', ' '), resource.subject || resource.courseCode || resource.institution].filter(Boolean).join(' · '),
  })), query, (resource) => (
    [[resource.title, 4], [resource.subject, 3], [resource.courseCode, 3], [resource.description, 1.5], [resource.previewText, 1], [resource.institution, 1], [resource.unit?.name, 2], [resource.owner?.name, 1]]
  ))

  const spaces = [...(knowledge?.libraries || []), ...(knowledge?.groups || [])].map((space) => ({
    ...space,
    type: `knowledge-${space.type}`,
    kind: 'pages',
    avatar: normalizeZumbarlFileUrl(space.avatarUrl) || DEFAULT_AVATAR,
    href: `/campus/learn/spaces/${encodeURIComponent(space.slug || space.id)}`,
    subtitle: [space.type === 'library' ? 'Library' : 'Study group', space.owner?.campus].filter(Boolean).join(' · '),
  }))
  const matchedSpaces = ranked(spaces, query, (space) => [[space.name, 4], [space.description, 2], [space.owner?.name, 1], [space.owner?.campus, 1]])
  const allPages = uniqueBy([...pages, ...matchedSpaces].sort((left, right) => right.relevance - left.relevance), (item) => item.href)

  const groups = { marketplace, people, pages: allPages, posts, projects, resources }
  const counts = Object.fromEntries(Object.entries(groups).map(([key, items]) => [key, items.length]))
  counts.all = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const hints = Object.entries(counts)
    .filter(([key, count]) => key !== 'all' && count > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([key, count]) => `${count} ${key}`)

  return {
    query,
    groups,
    counts,
    hints,
    partial: failures > 0,
    failedSources: failures,
  }
}

export { normalizeSearchText, relevanceScore, searchCampus, searchTokens }
