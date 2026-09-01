import { ApiError } from '../../lib/http.js'

const programTransitions = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['ACTIVE', 'CHANGES_REQUESTED'],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  ACTIVE: ['PAUSED', 'SUSPENDED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  SUSPENDED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: []
} as const

const cohortTransitions = {
  SCHEDULED: ['OPEN', 'PAUSED', 'CANCELLED'],
  OPEN: ['MATCHING', 'PAUSED', 'CANCELLED'],
  MATCHING: ['INTERVIEWING', 'OPEN', 'PAUSED', 'CANCELLED'],
  INTERVIEWING: ['FILLED', 'PARTIALLY_FILLED', 'PAUSED', 'CANCELLED'],
  FILLED: ['IN_PROGRESS', 'PAUSED', 'CANCELLED'],
  PARTIALLY_FILLED: ['IN_PROGRESS', 'PAUSED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'PAUSED', 'CANCELLED'],
  COMPLETED: [],
  PAUSED: ['SCHEDULED', 'OPEN', 'MATCHING', 'INTERVIEWING', 'IN_PROGRESS', 'CANCELLED'],
  CANCELLED: []
} as const

const candidateTransitions = {
  MATCHED: ['INVITED', 'APPLIED', 'REJECTED'],
  INVITED: ['APPLIED', 'DECLINED', 'WITHDRAWN', 'SHORTLISTED'],
  APPLIED: ['SHORTLISTED', 'WITHDRAWN', 'REJECTED'],
  SHORTLISTED: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['ACCEPTED', 'DECLINED', 'OFFER_EXPIRED', 'WITHDRAWN'],
  ACCEPTED: ['STARTED', 'TERMINATED'],
  STARTED: ['COMPLETED', 'TERMINATED'],
  COMPLETED: [],
  DECLINED: [],
  WITHDRAWN: [],
  REJECTED: [],
  OFFER_EXPIRED: [],
  TERMINATED: []
} as const

const offerTransitions = {
  DRAFT: ['SENT', 'WITHDRAWN'],
  SENT: ['VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'],
  VIEWED: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'],
  ACCEPTED: [],
  DECLINED: [],
  EXPIRED: [],
  WITHDRAWN: []
} as const

const placementTransitions = {
  PENDING_ONBOARDING: ['READY', 'DEFERRED', 'CANCELLED_BEFORE_START', 'DISPUTED'],
  READY: ['ACTIVE', 'DEFERRED', 'CANCELLED_BEFORE_START', 'DISPUTED'],
  ACTIVE: ['COMPLETION_REVIEW', 'TERMINATED', 'DISPUTED'],
  COMPLETION_REVIEW: ['COMPLETED', 'ACTIVE', 'DISPUTED', 'TERMINATED'],
  COMPLETED: [],
  DEFERRED: ['PENDING_ONBOARDING', 'CANCELLED_BEFORE_START'],
  CANCELLED_BEFORE_START: [],
  TERMINATED: [],
  DISPUTED: ['ACTIVE', 'COMPLETION_REVIEW', 'COMPLETED', 'TERMINATED']
} as const

type TransitionMap = Record<string, readonly string[]>

function assertTransition(map: TransitionMap, from: string, to: string, entity: string) {
  if (!map[from]?.includes(to)) {
    throw new ApiError(409, `${entity} cannot transition from ${from} to ${to}`, 'EVERGREEN_INVALID_TRANSITION', { entity, from, to })
  }
}

export {
  programTransitions,
  cohortTransitions,
  candidateTransitions,
  offerTransitions,
  placementTransitions,
  assertTransition
}
