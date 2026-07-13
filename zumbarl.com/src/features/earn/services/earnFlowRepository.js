const STORAGE_KEY = 'zumbarl.earnFlow.v1'
const STATE_VERSION = 2

export function getDefaultEarnFlowState() {
  return {
    version: STATE_VERSION,
    bids: [],
    opportunities: [],
    projects: [],
    invites: [],
    interviews: [],
    portfolioEvidence: [],
    projectReviews: [],
    endorsements: [],
    payments: [],
  }
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function normalizeEarnFlowState(parsed) {
  const defaultState = getDefaultEarnFlowState()

  if (parsed?.version !== defaultState.version) {
    return defaultState
  }

  return {
    ...defaultState,
    ...parsed,
    bids: Array.isArray(parsed.bids) ? parsed.bids : defaultState.bids,
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : defaultState.opportunities,
    projects: Array.isArray(parsed.projects) ? parsed.projects : defaultState.projects,
    invites: Array.isArray(parsed.invites) ? parsed.invites : [],
    interviews: Array.isArray(parsed.interviews) ? parsed.interviews : [],
    portfolioEvidence: Array.isArray(parsed.portfolioEvidence) ? parsed.portfolioEvidence : [],
    projectReviews: Array.isArray(parsed.projectReviews) ? parsed.projectReviews : [],
    endorsements: Array.isArray(parsed.endorsements) ? parsed.endorsements : [],
    payments: Array.isArray(parsed.payments) ? parsed.payments : [],
  }
}

export function loadEarnFlowState() {
  const storage = getStorage()

  if (!storage) {
    return getDefaultEarnFlowState()
  }

  try {
    return normalizeEarnFlowState(JSON.parse(storage.getItem(STORAGE_KEY)))
  } catch {
    return getDefaultEarnFlowState()
  }
}

export function saveEarnFlowState(state) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createEarnFlowSyncPayload(state) {
  return {
    version: state.version,
    bids: state.bids,
    opportunities: state.opportunities,
    projects: state.projects,
    portfolioEvidence: state.portfolioEvidence,
    projectReviews: state.projectReviews,
    endorsements: state.endorsements,
    payments: state.payments,
  }
}
