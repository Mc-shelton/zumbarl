import {
  createBackendBusinessOpportunity,
  listBackendBusinessOpportunities,
  publishBackendBusinessOpportunity,
  sendBackendOpportunityInvites,
  updateBackendBusinessOpportunity,
} from './persistBusinessOpportunity'
import { getOpportunityStatusForAction } from './businessPipelineService'

const STORAGE_KEY = 'zumbarl.businessFlow.v1'
const STATE_VERSION = 2
const REPEAT_HIRE_LIMIT = 3

const listeners = new Set()

function mirrorBackendWrite(writeOperation, onSuccess) {
  writeOperation()
    .then((result) => {
      if (result && onSuccess) onSuccess(result)
    })
    .catch((error) => {
      console.error('Zumbarl backend write failed:', error)
    })
}

function getDefaultState() {
  return {
    version: STATE_VERSION,
    opportunities: [],
    opportunityInvites: [],
    opportunityBids: [],
    selectedOpportunityId: null,
    reviewEvents: [],
  }
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function readStoredState() {
  const storage = getStorage()

  if (!storage) return getDefaultState()

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY))

    if (parsed?.version !== STATE_VERSION) return getDefaultState()

    return {
      ...getDefaultState(),
      ...parsed,
      opportunities: Array.isArray(parsed.opportunities)
        ? parsed.opportunities.map((opportunity) => normalizeOpportunity(opportunity))
        : getDefaultState().opportunities,
      opportunityInvites: Array.isArray(parsed.opportunityInvites) ? parsed.opportunityInvites : [],
      opportunityBids: Array.isArray(parsed.opportunityBids) ? parsed.opportunityBids : [],
      reviewEvents: Array.isArray(parsed.reviewEvents) ? parsed.reviewEvents : getDefaultState().reviewEvents,
    }
  } catch {
    return getDefaultState()
  }
}

let currentState = readStoredState()

function persistState(state) {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function setBusinessFlowState(updater) {
  currentState = updater(currentState)
  persistState(currentState)
  listeners.forEach((listener) => listener())
  return currentState
}

function createId(prefix, value) {
  return `${prefix}-${String(value || Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function formatCreatedAt() {
  return new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeOpportunity(opportunity) {
  const source = opportunity || {}
  const fallback = {
    acceptanceCriteria: '',
    applicants: 0,
    bidderInstructions: '',
    clarityScore: 0,
    companyDescription: '',
    deliverables: '',
    duration: '',
    invitedCount: 0,
    paymentTerms: '',
    requiredAttachments: [],
    screeningFocus: '',
  }

  return {
    ...fallback,
    ...source,
    applicationDeadline: source.applicationDeadline || source.deadline || fallback.applicationDeadline,
    deadline: source.deadline || source.applicationDeadline || fallback.deadline,
  }
}

function getDisplayOpportunityStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'draft' || normalized === 'draft ready') return 'Draft'
  if (normalized === 'published' || normalized === 'open') return 'Open'
  if (normalized === 'ready') return 'Draft'
  if (normalized === 'in_review' || normalized === 'in review') return 'In Review'
  if (normalized === 'shortlisted') return 'Shortlisted'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'archived' || normalized === 'closed') return 'Archived'

  return status || 'Draft'
}

export function getBusinessFlowSnapshot() {
  return currentState
}

export function subscribeBusinessFlow(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function mergeBackendOpportunities(opportunities) {
  const backendOpportunities = opportunities.map((opportunity) => normalizeOpportunity({
    ...opportunity,
    backendId: opportunity.id,
    status: getDisplayOpportunityStatus(opportunity.status),
  }))
  setBusinessFlowState((state) => ({
    ...state,
    opportunities: [
      ...backendOpportunities,
      ...state.opportunities.filter((opportunity) => !opportunity.backendId),
    ],
  }))
}

export function hydrateBusinessOpportunitiesFromBackend() {
  return listBackendBusinessOpportunities()
    .then((response) => {
      const opportunities = response?.data || []
      if (opportunities.length) mergeBackendOpportunities(opportunities)
      return opportunities
    })
    .catch(() => [])
}

function mergeSavedOpportunity(localOpportunity, backendOpportunity) {
  const backendId = backendOpportunity?.id || localOpportunity.backendId
  const keepLocalArrayIfBackendEmpty = (fieldName) => {
    const backendItems = Array.isArray(backendOpportunity?.[fieldName])
      ? backendOpportunity[fieldName]
      : undefined
    const localItems = Array.isArray(localOpportunity[fieldName])
      ? localOpportunity[fieldName]
      : []

    return backendItems?.length || !localItems.length ? backendItems : localItems
  }
  const backendRequiredAttachments = Array.isArray(backendOpportunity?.requiredAttachments)
    ? backendOpportunity.requiredAttachments
    : undefined
  const localRequiredAttachments = Array.isArray(localOpportunity.requiredAttachments)
    ? localOpportunity.requiredAttachments
    : []
  const savedOpportunity = normalizeOpportunity({
    ...localOpportunity,
    ...backendOpportunity,
    id: localOpportunity.id,
    backendId,
    deliverableMilestones: keepLocalArrayIfBackendEmpty('deliverableMilestones'),
    milestoneScopes: keepLocalArrayIfBackendEmpty('milestoneScopes'),
    requiredAttachments: backendRequiredAttachments?.length || !localRequiredAttachments.length
      ? backendRequiredAttachments
      : localRequiredAttachments,
    status: getDisplayOpportunityStatus(backendOpportunity?.status || localOpportunity.status),
  })

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((item) => (
      item.id === localOpportunity.id ? savedOpportunity : item
    )),
    selectedOpportunityId: savedOpportunity.id,
  }))

  return savedOpportunity
}

export async function createBusinessOpportunity(payload, options = {}) {
  const existingOpportunity = options.existingId
    ? currentState.opportunities.find((item) => item.id === options.existingId)
    : null
  const opportunity = {
    ...(existingOpportunity || {}),
    id: existingOpportunity?.id || createId('brief', `${payload.title}-${Date.now()}`),
    applicants: 0,
    createdAt: existingOpportunity?.createdAt || formatCreatedAt(),
    intentId: 'career',
    intentLabel: 'Build Career Mode',
    ...payload,
    status: getDisplayOpportunityStatus(payload.status || existingOpportunity?.status || 'Draft'),
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: existingOpportunity
      ? state.opportunities.map((item) => (item.id === existingOpportunity.id ? opportunity : item))
      : [opportunity, ...state.opportunities],
    selectedOpportunityId: opportunity.id,
  }))

  const backendOpportunity = opportunity.backendId
    ? await updateBackendBusinessOpportunity(opportunity.backendId, opportunity)
    : await createBackendBusinessOpportunity(opportunity)

  return mergeSavedOpportunity(opportunity, backendOpportunity)
}

export function publishBusinessOpportunity(opportunityId) {
  let updatedOpportunity = null

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity

      updatedOpportunity = {
        ...opportunity,
        publishedAt: formatCreatedAt(),
        status: 'Open',
      }

      return updatedOpportunity
    }),
  }))

  if (updatedOpportunity) {
    mirrorBackendWrite(() => publishBackendBusinessOpportunity(updatedOpportunity.backendId || opportunityId))
    recordApplicantReviewEvent({
      action: 'opportunity_published',
      detail: `${updatedOpportunity.title} published from the opportunities workspace.`,
      opportunityId,
    })
  }

  return updatedOpportunity
}

export async function inviteBusinessOpportunityBidders({ bidders, note, opportunityId }) {
  const opportunity = currentState.opportunities.find((item) => item.id === opportunityId)
  const existingInviteKeys = new Set(
    currentState.opportunityInvites
      .filter((invite) => invite.opportunityId === opportunityId)
      .map((invite) => invite.bidderId),
  )
  const createdAt = formatCreatedAt()
  const newInvites = bidders
    .filter((bidder) => !existingInviteKeys.has(bidder.id))
    .map((bidder) => ({
      id: createId('invite', `${opportunityId}-${bidder.id}-${Date.now()}`),
      bidderId: bidder.id,
      bidderName: bidder.name,
      match: bidder.match,
      note,
      opportunityId,
      sentAt: createdAt,
      status: 'Invited',
    }))

  if (!newInvites.length) return []

  if (opportunity?.backendId) {
    await sendBackendOpportunityInvites(opportunity.backendId, {
      note,
      studentIds: newInvites.map((invite) => invite.bidderId),
    })
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity

      return {
        ...opportunity,
        invitedCount: (opportunity.invitedCount || 0) + newInvites.length,
        status: opportunity.status === 'Draft ready' || opportunity.status === 'Draft' ? 'Open' : opportunity.status,
      }
    }),
    opportunityInvites: [...newInvites, ...state.opportunityInvites],
  }))

  recordApplicantReviewEvent({
    action: 'opportunity_invites_sent',
    detail: `${newInvites.length} bidder${newInvites.length === 1 ? '' : 's'} invited to submit an offer.`,
    opportunityId,
  })

  return newInvites
}

export function recordApplicantReviewEvent({ action, detail, opportunityId }) {
  const event = {
    id: createId('event', `${action}-${Date.now()}`),
    action,
    opportunityId,
    detail,
    createdAt: formatCreatedAt(),
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.map((opportunity) => (
      opportunity.id === opportunityId
        ? { ...opportunity, status: getOpportunityStatusForAction(action) }
        : opportunity
    )),
    reviewEvents: [event, ...state.reviewEvents],
  }))

  return event
}

export function resolveApplicantHiringGuardrail(reviewEvents) {
  const awardedCount = reviewEvents.filter((event) => event.action === 'awarded').length
  const unlockCount = reviewEvents.filter((event) => event.action === 'guardrail_unlocked').length
  const isUnlocked = unlockCount > 0
  const remainingAwards = Math.max(0, REPEAT_HIRE_LIMIT - awardedCount)

  return {
    awardedCount,
    hireLimit: REPEAT_HIRE_LIMIT,
    isUnlocked,
    remainingAwards,
    requiresUnlock: awardedCount >= REPEAT_HIRE_LIMIT && !isUnlocked,
    status: isUnlocked ? 'Mentorship unlock active' : `${remainingAwards} repeat hires remaining`,
  }
}
