import { MY_BIDS, ONGOING_PROJECTS } from '../../opportunities/constants'

const STORAGE_KEY = 'zumbarl.earnFlow.v1'
const STATE_VERSION = 1

export function getDefaultEarnFlowState() {
  return {
    version: STATE_VERSION,
    bids: MY_BIDS.map((bid) => ({
      intentId: 'earn',
      intentLabel: 'Earn Mode',
      projectId: null,
      source: 'seed',
      ...bid,
    })),
    projects: ONGOING_PROJECTS.map((project) => ({ source: 'seed', ...project })),
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
    projects: Array.isArray(parsed.projects) ? parsed.projects : defaultState.projects,
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
    projects: state.projects,
    portfolioEvidence: state.portfolioEvidence,
    projectReviews: state.projectReviews,
    endorsements: state.endorsements,
    payments: state.payments,
  }
}
