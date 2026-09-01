const STORAGE_PREFIX = 'zumbarl.campusLandingPreference.v1'

const DAY_MS = 24 * 60 * 60 * 1000
const HALF_LIFE_MS = 30 * DAY_MS
const MIN_TOTAL_DWELL_SECONDS = 10 * 60
const MIN_VISIT_SCORE = 2.5
const MIN_WINNER_SHARE = 0.4
const MIN_INITIAL_MARGIN_SECONDS = 60
const SWITCH_SCORE_RATIO = 1.25
const SWITCH_MARGIN_SECONDS = 2 * 60
const DUPLICATE_VISIT_WINDOW_MS = 10 * 1000
const recentVisits = new Map()

export const DEFAULT_CAMPUS_AREA = 'explore'

export const CAMPUS_LANDING_AREAS = Object.freeze({
  explore: Object.freeze({ path: '/campus', surface: 'connect_feed' }),
  wellbeing: Object.freeze({ path: '/campus/wellbeing', surface: 'wellbeing' }),
  opportunities: Object.freeze({ path: '/campus/opportunities', surface: 'opportunities' }),
  marketplace: Object.freeze({ path: '/campus/opportunities/buy-sell', surface: 'marketplace' }),
  learn: Object.freeze({ path: '/campus/learn', surface: 'learning' }),
})

function emptyArea() {
  return { dwellSeconds: 0, visitScore: 0, lastSeenAt: null }
}

function emptyState(now) {
  return {
    version: 1,
    updatedAt: now,
    preferredArea: null,
    areas: Object.fromEntries(Object.keys(CAMPUS_LANDING_AREAS).map((area) => [area, emptyArea()])),
  }
}

function storageForOwner(ownerId) {
  if (typeof window === 'undefined' || !ownerId) return null
  return `${STORAGE_PREFIX}:${encodeURIComponent(String(ownerId))}`
}

function normalizeState(value, now) {
  const state = emptyState(now)
  if (!value || typeof value !== 'object') return state

  state.updatedAt = Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : now
  state.preferredArea = CAMPUS_LANDING_AREAS[value.preferredArea] ? value.preferredArea : null
  Object.keys(CAMPUS_LANDING_AREAS).forEach((area) => {
    const source = value.areas?.[area]
    state.areas[area] = {
      dwellSeconds: Math.max(0, Number(source?.dwellSeconds) || 0),
      visitScore: Math.max(0, Number(source?.visitScore) || 0),
      lastSeenAt: source?.lastSeenAt !== null && source?.lastSeenAt !== undefined && Number.isFinite(Number(source.lastSeenAt))
        ? Number(source.lastSeenAt)
        : null,
    }
  })
  return state
}

function decayState(state, now) {
  const elapsed = Math.max(0, now - state.updatedAt)
  const decayFactor = 2 ** (-elapsed / HALF_LIFE_MS)
  Object.values(state.areas).forEach((area) => {
    area.dwellSeconds *= decayFactor
    area.visitScore *= decayFactor
  })
  state.updatedAt = now
  return state
}

function readState(ownerId, now = Date.now()) {
  const key = storageForOwner(ownerId)
  if (!key) return emptyState(now)
  try {
    return decayState(normalizeState(JSON.parse(window.localStorage.getItem(key)), now), now)
  } catch {
    return emptyState(now)
  }
}

function writeState(ownerId, state) {
  const key = storageForOwner(ownerId)
  if (!key) return state
  try {
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Landing personalization is optional; storage failures keep Explore as the fallback.
  }
  return state
}

function rankedAreas(state) {
  return Object.entries(state.areas)
    .map(([area, activity]) => ({ area, ...activity }))
    .sort((left, right) => right.dwellSeconds - left.dwellSeconds)
}

function updatePreferredArea(state) {
  const ranked = rankedAreas(state)
  const winner = ranked[0]
  const runnerUp = ranked[1]
  const totalDwell = ranked.reduce((total, area) => total + area.dwellSeconds, 0)
  const hasEnoughEvidence = totalDwell >= MIN_TOTAL_DWELL_SECONDS
    && winner.visitScore >= MIN_VISIT_SCORE
    && winner.dwellSeconds / Math.max(totalDwell, 1) >= MIN_WINNER_SHARE

  if (!hasEnoughEvidence) return state

  const current = state.preferredArea ? state.areas[state.preferredArea] : null
  if (!current) {
    if (winner.dwellSeconds - runnerUp.dwellSeconds >= MIN_INITIAL_MARGIN_SECONDS) {
      state.preferredArea = winner.area
    }
    return state
  }

  if (winner.area === state.preferredArea) return state
  const canSwitch = winner.dwellSeconds >= current.dwellSeconds * SWITCH_SCORE_RATIO
    && winner.dwellSeconds - current.dwellSeconds >= SWITCH_MARGIN_SECONDS
  if (canSwitch) state.preferredArea = winner.area
  return state
}

export function campusPreferenceOwnerId(snapshot) {
  return snapshot?.user?.id || snapshot?.student?.userId || snapshot?.student?.id || null
}

export function campusAreaForPath(pathname = '') {
  if (pathname === '/campus' || pathname === '/campus/') return 'explore'

  if (
    pathname.startsWith('/campus/opportunities/buy-sell')
    || pathname.startsWith('/campus/marketplace')
    || pathname.startsWith('/campus/vendors')
    || pathname.startsWith('/campus/cart')
  ) return 'marketplace'

  if (pathname.startsWith('/campus/learn')) return 'learn'

  if (
    pathname.startsWith('/campus/explore')
    || pathname.startsWith('/campus/profiles')
    || pathname.startsWith('/campus/organizations')
  ) return 'explore'

  if (pathname.startsWith('/campus/wellbeing') || pathname.startsWith('/campus/community')) return 'wellbeing'

  if (
    pathname.startsWith('/campus/opportunities')
    || pathname.startsWith('/campus/projects')
    || pathname.startsWith('/campus/interviews')
  ) return 'opportunities'

  return null
}

export function recordCampusAreaVisit(ownerId, area, now = Date.now()) {
  if (!ownerId || !CAMPUS_LANDING_AREAS[area]) return null
  const visitKey = `${ownerId}:${area}`
  const lastVisitAt = recentVisits.get(visitKey)
  if (lastVisitAt && now - lastVisitAt < DUPLICATE_VISIT_WINDOW_MS) return null
  recentVisits.set(visitKey, now)
  const state = readState(ownerId, now)
  state.areas[area].visitScore += 1
  state.areas[area].lastSeenAt = now
  return writeState(ownerId, updatePreferredArea(state))
}

export function recordCampusAreaDwell(ownerId, area, seconds, now = Date.now()) {
  if (!CAMPUS_LANDING_AREAS[area] || !Number.isFinite(seconds) || seconds <= 0) return null
  const state = readState(ownerId, now)
  state.areas[area].dwellSeconds += Math.min(seconds, 5 * 60)
  state.areas[area].lastSeenAt = now
  return writeState(ownerId, updatePreferredArea(state))
}

export function getCampusLandingPreference(ownerId, now = Date.now()) {
  const state = updatePreferredArea(readState(ownerId, now))
  writeState(ownerId, state)
  const area = state.preferredArea || DEFAULT_CAMPUS_AREA
  return {
    area,
    path: CAMPUS_LANDING_AREAS[area].path,
    personalized: Boolean(state.preferredArea),
  }
}

export function getCampusLandingPreferenceState(ownerId, now = Date.now()) {
  return readState(ownerId, now)
}
