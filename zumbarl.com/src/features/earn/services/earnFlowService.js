import {
  toStudentBidCard,
  toStudentInterviewCard,
  toStudentInviteCard,
  toStudentProjectCard,
} from './earnFlowMappers'
import { getDefaultEarnFlowState } from './earnFlowRepository'
import { resolveProjectPayment } from './earnPaymentService'
import { resolveEarnTrustSnapshot } from './earnTrustService'
import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationImpressions, withRecommendationEvent } from '../../recommendations/services/recommendationEventService'

const listeners = new Set()
const SEEN_INVITES_KEY = 'zumbarl.earnFlow.seenInvites'

let currentState = getDefaultEarnFlowState()
let backendHydrationPromise = null
let opportunityHydrationGeneration = 0

function readSeenInviteIds() {
  if (typeof window === 'undefined') return new Set()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_INVITES_KEY))
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveSeenInviteIds(seenIds) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SEEN_INVITES_KEY, JSON.stringify([...seenIds]))
}

function applySeenState(invites) {
  const seenIds = readSeenInviteIds()
  return invites.map((invite) => (
    seenIds.has(invite.id) ? { ...invite, isNew: false } : invite
  ))
}

function setEarnFlowState(updater) {
  currentState = updater(currentState)
  listeners.forEach((listener) => listener())
  return currentState
}

export function getEarnFlowSnapshot() {
  return currentState
}

export function subscribeEarnFlow(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readEnvelopeData(payload) {
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function hydrateEarnFlowFromBackend(opportunityIntentId) {
  if (backendHydrationPromise) {
    return backendHydrationPromise
  }

  const opportunityGeneration = ++opportunityHydrationGeneration
  const opportunityQuery = opportunityIntentId ? `?intent=${encodeURIComponent(opportunityIntentId)}` : ''
  setEarnFlowState((state) => ({ ...state, error: '', isLoading: true }))
  backendHydrationPromise = Promise.all([
    sendZumbarlApiRequest(`/earn/opportunities${opportunityQuery}`),
    sendZumbarlApiRequest('/earn/bids'),
    sendZumbarlApiRequest('/earn/projects'),
    sendZumbarlApiRequest('/earn/invites'),
    sendZumbarlApiRequest('/earn/interviews'),
  ]).then(([opportunitiesPayload, bidsPayload, projectsPayload, invitesPayload, interviewsPayload]) => {
    if (opportunitiesPayload && opportunityGeneration === opportunityHydrationGeneration) {
      recordRecommendationImpressions('opportunities', 'opportunity', readEnvelopeData(opportunitiesPayload))
    }
    setEarnFlowState((state) => ({
      ...state,
      opportunities: opportunitiesPayload && opportunityGeneration === opportunityHydrationGeneration
        ? readEnvelopeData(opportunitiesPayload)
        : state.opportunities,
      bids: bidsPayload ? readEnvelopeData(bidsPayload).map(toStudentBidCard) : state.bids,
      projects: projectsPayload ? readEnvelopeData(projectsPayload).map(toStudentProjectCard) : state.projects,
      invites: invitesPayload ? applySeenState(readEnvelopeData(invitesPayload).map(toStudentInviteCard)) : state.invites,
      interviews: interviewsPayload ? readEnvelopeData(interviewsPayload).map(toStudentInterviewCard) : state.interviews,
      error: '',
      isLoading: false,
    }))

    return currentState
  }).catch((error) => {
    backendHydrationPromise = null
    setEarnFlowState((state) => ({
      ...state,
      error: error instanceof Error ? error.message : 'Could not load opportunities.',
      isLoading: false,
    }))
    throw error
  })

  return backendHydrationPromise
}

export async function refreshEarnOpportunities(intentId) {
  const opportunityGeneration = ++opportunityHydrationGeneration
  const query = intentId ? `?intent=${encodeURIComponent(intentId)}` : ''
  const opportunitiesPayload = await sendZumbarlApiRequest(`/earn/opportunities${query}`)
  const opportunities = readEnvelopeData(opportunitiesPayload)

  if (opportunityGeneration !== opportunityHydrationGeneration) return currentState
  recordRecommendationImpressions('opportunities', 'opportunity', opportunities)
  return setEarnFlowState((state) => ({ ...state, opportunities }))
}

export function refreshEarnFlowFromBackend(opportunityIntentId) {
  backendHydrationPromise = null
  return hydrateEarnFlowFromBackend(opportunityIntentId)
}

export async function hydrateEarnOpportunityById(opportunityId) {
  if (!opportunityId) return null
  const opportunity = await withRecommendationEvent(sendZumbarlApiRequest(`/earn/opportunities/${encodeURIComponent(opportunityId)}`), { surface: 'opportunities', entityType: 'opportunity', entityId: opportunityId, eventType: 'open' })
  setEarnFlowState((state) => ({
    ...state,
    opportunities: [
      opportunity,
      ...state.opportunities.filter((item) => item.id !== opportunity.id),
    ],
  }))
  return opportunity
}

export function readOpportunityBidDraft(opportunityId) {
  return sendZumbarlApiRequest(`/earn/opportunities/${opportunityId}/bid-draft`)
}

export async function saveOpportunityBidDraft(opportunityId, draft) {
  const savedDraft = await sendZumbarlApiRequest(`/earn/opportunities/${opportunityId}/bid-draft`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  })
  await refreshEarnFlowFromBackend()
  return savedDraft
}

export async function acceptEarnOpportunityInvite(inviteId) {
  await sendZumbarlApiRequest(`/earn/invites/${inviteId}/accept`, { method: 'POST' })

  let acceptedInvite = null
  setEarnFlowState((state) => ({
    ...state,
    invites: state.invites.map((invite) => {
      if (invite.id !== inviteId) return invite
      acceptedInvite = {
        ...invite,
        isAccepted: true,
        isNew: false,
        stage: 'Accepted',
        stageTone: 'is-open',
        clientLastSeen: 'Client awaiting your bid',
      }
      return acceptedInvite
    }),
  }))
  return acceptedInvite
}

export async function declineEarnOpportunityInvite(inviteId) {
  await sendZumbarlApiRequest(`/earn/invites/${inviteId}/decline`, { method: 'POST' })

  setEarnFlowState((state) => ({
    ...state,
    invites: state.invites.map((invite) => (
      invite.id === inviteId
        ? { ...invite, isAccepted: false, isNew: false, stage: 'Declined', stageTone: 'is-viewed' }
        : invite
    )),
  }))
}

export async function respondToEarnBidCounterOffer(bidId, decision) {
  const result = await sendZumbarlApiRequest(`/earn/bids/${bidId}/counter-offer/respond`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  })
  await refreshEarnFlowFromBackend()
  return result
}

export function markEarnInvitesSeen() {
  const seenIds = readSeenInviteIds()
  currentState.invites.forEach((invite) => seenIds.add(invite.id))
  saveSeenInviteIds(seenIds)

  setEarnFlowState((state) => ({
    ...state,
    invites: state.invites.map((invite) => (invite.isNew ? { ...invite, isNew: false } : invite)),
  }))
}

export async function submitOpportunityBid({ gig, intent, proposal }) {
  const opportunityId = gig.submissionOpportunityId || gig.id
  const backendBid = await withRecommendationEvent(sendZumbarlApiRequest(`/earn/opportunities/${opportunityId}/bids`, {
    method: 'POST',
    body: JSON.stringify({
      amount: Number(String(proposal.price || '').replace(/[^\d.]/g, '')) || 0,
      attachments: proposal.attachments || [],
      currency: proposal.currency || 'KES',
      deliveryTime: proposal.deliveryTime || undefined,
      estimatedUnits: proposal.estimatedUnits ? Number(proposal.estimatedUnits) : undefined,
      intent: intent.id === 'career' ? 'build-career' : intent.id,
      message: proposal.message || undefined,
      pricingType: proposal.pricingType || undefined,
      proposal: proposal.proposal,
      questionAnswers: proposal.questionAnswers || [],
    }),
  }), { surface: 'opportunities', entityType: 'opportunity', entityId: opportunityId, eventType: 'apply' })
  const bid = toStudentBidCard({
    ...backendBid,
    intentId: backendBid.intentId || intent.id,
    opportunity: backendBid.opportunity || {
      id: opportunityId,
      budget: gig.budget,
      category: gig.domain,
      company: gig.company,
      image: gig.image,
      title: gig.title,
    },
  })
  setEarnFlowState((state) => ({
    ...state,
    bids: [
      bid,
      ...state.bids.filter((item) => item.opportunityId !== bid.opportunityId),
    ],
  }))
  return bid
}

export function resolveProjectReview(projectReviews, projectId) {
  return projectReviews.find((item) => item.projectId === projectId) || null
}

export { resolveEarnTrustSnapshot, resolveProjectPayment }
