import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiHome,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { ACCESS_KEYS, filterByAccess } from '../auth/roleConfig'

export const OPPORTUNITY_INTENTS = {
  earn: {
    id: 'earn',
    label: 'Earn Mode',
    summary: 'Prioritize paid work, payout readiness and short-term income.',
  },
  career: {
    id: 'career',
    label: 'Build Career Mode',
    summary: 'Prioritize portfolio evidence, mentorship and progression.',
  },
}
export const OPPORTUNITY_INTENT_OPTIONS = Object.values(OPPORTUNITY_INTENTS)
export const DEFAULT_OPPORTUNITY_INTENT_ID = OPPORTUNITY_INTENTS.earn.id

export function resolveOpportunityIntent(value) {
  return OPPORTUNITY_INTENT_OPTIONS.find((intent) => intent.id === value) || OPPORTUNITY_INTENTS.earn
}

export const OPPORTUNITY_TYPES = [
  { id: 'all', label: 'All opportunities', description: 'Everything available', Icon: FiBriefcase },
  { id: 'part-time', label: 'Part-time jobs', description: 'Flexible paid work', Icon: FiCalendar },
  { id: 'gigs', label: 'Gigs & freelance', description: 'Projects and tasks', Icon: FiShoppingBag },
  { id: 'internships', label: 'Internships', description: 'Build work experience', Icon: FiBookOpen },
  { id: 'remote', label: 'Remote', description: 'Work from anywhere', Icon: FiUsers },
  { id: 'on-campus', label: 'On-campus', description: 'Opportunities near you', Icon: FiHome },
]
export const DEFAULT_OPPORTUNITY_TYPE_ID = 'all'

function getOpportunityTypeText(opportunity) {
  return [opportunity.meta, opportunity.location].filter(Boolean).join(' ').toLowerCase()
}

export function matchesOpportunityType(opportunity, typeId) {
  const text = getOpportunityTypeText(opportunity)

  if (!typeId || typeId === 'all') return true
  if (typeId === 'part-time') return text.includes('part-time')
  if (typeId === 'internships') return text.includes('intern') || text.includes('attachment')
  if (typeId === 'remote') return text.includes('remote')
  if (typeId === 'on-campus') return text.includes('on-campus') || text.includes('on campus')
  if (typeId === 'gigs') {
    return ['one-time', 'gig', 'freelance', 'project', 'task', 'contract']
      .some((keyword) => text.includes(keyword))
  }

  return true
}

export function resolveOpportunityTypeId(value) {
  return OPPORTUNITY_TYPES.some((type) => type.id === value) ? value : DEFAULT_OPPORTUNITY_TYPE_ID
}

export function filterOpportunitiesByType(opportunities, typeId) {
  return opportunities.filter((item) => matchesOpportunityType(item, typeId))
}

export function getOpportunityTypeCounts(opportunities) {
  return OPPORTUNITY_TYPES.reduce((counts, type) => ({
    ...counts,
    [type.id]: filterOpportunitiesByType(opportunities, type.id).length,
  }), {})
}

const FILTER_TYPE_KEYWORDS = {
  'Part-time Jobs': ['part-time'],
  'Gigs & Freelance': ['one-time', 'gig', 'freelance', 'project', 'task', 'contract'],
  Internships: ['intern', 'attachment'],
  Volunteer: ['volunteer'],
  'Full-time': ['full-time'],
}

const FILTER_MODE_KEYWORDS = {
  'On-campus': ['on-campus', 'on campus'],
  Remote: ['remote'],
  Hybrid: ['hybrid', 'flexible'],
}

export function getOpportunityPayAmount(opportunity) {
  return Number(String(opportunity.pay || '').replace(/[^\d]/g, '')) || 0
}

export function matchesOpportunitySearch(opportunity, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return true

  return [
    opportunity.title,
    opportunity.company,
    opportunity.description,
    opportunity.careerPath,
    opportunity.location,
    opportunity.meta,
    (opportunity.tags || []).join(' '),
  ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
}

export function matchesOpportunityRailFilters(opportunity, railFilters) {
  const text = getOpportunityTypeText(opportunity)

  if (railFilters.types.length) {
    const matchesType = railFilters.types.some((type) => (
      (FILTER_TYPE_KEYWORDS[type] || []).some((keyword) => text.includes(keyword))
    ))
    if (!matchesType) return false
  }

  if (railFilters.workModes.length) {
    const matchesMode = railFilters.workModes.some((mode) => (
      (FILTER_MODE_KEYWORDS[mode] || []).some((keyword) => text.includes(keyword))
    ))
    if (!matchesMode) return false
  }

  const payAmount = getOpportunityPayAmount(opportunity)
  const budgetMin = Number(railFilters.budgetMin) || 0
  const budgetMax = Number(railFilters.budgetMax) || 0
  if (budgetMin && payAmount < budgetMin) return false
  if (budgetMax && payAmount > budgetMax) return false

  if (railFilters.skill !== 'all' && !(opportunity.tags || []).includes(railFilters.skill)) return false

  return true
}

export const INITIAL_OPPORTUNITY_RAIL_FILTERS = {
  budgetMax: '',
  budgetMin: '',
  skill: 'all',
  types: [],
  workModes: [],
}

export const OPPORTUNITY_TAB_ITEMS = [
  { label: 'Discover', requiredAccess: ACCESS_KEYS.opportunities.discover },
  { label: 'Marketing', requiredAccess: ACCESS_KEYS.opportunities.discover },
  { label: 'My Bids', requiredAccess: ACCESS_KEYS.opportunities.bids },
  { label: 'Invites', requiredAccess: ACCESS_KEYS.opportunities.invites },
  { label: 'Ongoing', requiredAccess: ACCESS_KEYS.opportunities.ongoing },
  { label: 'Service Orders', requiredAccess: ACCESS_KEYS.opportunities.serviceOrders },
]
export const OPPORTUNITY_TABS = filterByAccess(OPPORTUNITY_TAB_ITEMS).map((tab) => tab.label)
export const OPPORTUNITY_TAB_TO_QUERY = {
  Discover: 'discover',
  Marketing: 'marketing',
  'My Bids': 'bids',
  Invites: 'invites',
  Ongoing: 'ongoing',
  'Service Orders': 'service-orders',
}
export const OPPORTUNITY_QUERY_TO_TAB = {
  discover: 'Discover',
  marketing: 'Marketing',
  bids: 'My Bids',
  invites: 'Invites',
  ongoing: 'Ongoing',
  'service-orders': 'Service Orders',
}

export const FILTER_TYPES = ['All Types', 'Part-time Jobs', 'Gigs & Freelance', 'Internships', 'Volunteer', 'Full-time']
export const FILTER_MODES = ['All', 'On-campus', 'Remote', 'Hybrid']
export const DEFAULT_OPPORTUNITY_THUMBNAIL = '/assets/index/business_page_images/campaign-creators-gMsnXqILjp4-unsplash.jpg'

export function slugifyOwner(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function hash32(seed, salt) {
  let hash = (2166136261 ^ salt) >>> 0

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
    hash ^= hash >>> 13
  }

  return hash >>> 0
}

export function toHex8(value) {
  return value.toString(16).padStart(8, '0')
}

export function createDeterministicUuid(seed) {
  const hex = `${toHex8(hash32(seed, 0))}${toHex8(hash32(seed, 1))}${toHex8(hash32(seed, 2))}${toHex8(hash32(seed, 3))}`
  const normalized = hex.split('')

  normalized[12] = '4'
  normalized[16] = ((parseInt(normalized[16], 16) & 0x3) | 0x8).toString(16)

  const compact = normalized.join('')
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`
}

export function filterOpportunitiesByIntent(opportunities, intentId = DEFAULT_OPPORTUNITY_INTENT_ID) {
  return opportunities.filter((item) => (item.intentIds || []).includes(intentId))
}

export const BID_PROGRESS_POINT_COUNT = 5

export function getBidProgressPointIndex(progressValue, pointCount = BID_PROGRESS_POINT_COUNT) {
  const safePointCount = Number.isFinite(pointCount) && pointCount > 1 ? Math.floor(pointCount) : 2
  const safeProgress = Number.isFinite(progressValue) ? Math.min(Math.max(progressValue, 0), 100) : 0
  return Math.round((safeProgress / 100) * (safePointCount - 1))
}

export function resolveOpportunityTab(tabQueryValue) {
  const normalizedQuery = typeof tabQueryValue === 'string' ? tabQueryValue.trim().toLowerCase() : ''
  const queriedTab = OPPORTUNITY_QUERY_TO_TAB[normalizedQuery]

  return OPPORTUNITY_TABS.includes(queriedTab) ? queriedTab : OPPORTUNITY_TABS[0] || 'Discover'
}

export function findOpportunityListingBySelector(listings, selector) {
  if (typeof selector !== 'string' || selector.trim() === '') {
    return null
  }

  return listings.find((item) => (
    item.opportunityUuid === selector || item.shareKey === selector || item.id === selector
  )) || null
}

export function resolveOpportunityUuid(listings, opportunityQueryValue, ownerQueryValue, gigQueryValue) {
  const normalizedOwner = slugifyOwner(ownerQueryValue)
  const matchesOwner = (item) => !normalizedOwner || item.ownerSlug === normalizedOwner

  if (typeof opportunityQueryValue === 'string' && opportunityQueryValue.trim() !== '') {
    const byUuid = listings.find((item) => item.opportunityUuid === opportunityQueryValue)
    if (byUuid) {
      return byUuid.opportunityUuid
    }

    const byIdAndOwner = listings.find((item) => item.id === opportunityQueryValue && matchesOwner(item))
    if (byIdAndOwner) {
      return byIdAndOwner.opportunityUuid
    }

    const byShareKey = listings.find((item) => item.shareKey === opportunityQueryValue)
    if (byShareKey && matchesOwner(byShareKey)) {
      return byShareKey.opportunityUuid
    }
  }

  if (typeof gigQueryValue === 'string' && gigQueryValue.trim() !== '') {
    const legacyGigMatch = findOpportunityListingBySelector(listings, gigQueryValue)
    if (legacyGigMatch && matchesOwner(legacyGigMatch)) {
      return legacyGigMatch.opportunityUuid
    }
  }

  return null
}
