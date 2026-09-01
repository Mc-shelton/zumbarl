import {
  createAwardedBid,
  createAwardedProject,
  createBid,
  createEvidence,
  toStudentBidCard,
  toStudentInterviewCard,
  toStudentInviteCard,
  toStudentProjectCard,
  toWorkspaceProject,
} from './earnFlowMappers'
import { createEarnFlowSyncPayload, loadEarnFlowState, saveEarnFlowState } from './earnFlowRepository'
import { createPayoutReadinessRecord, resolveProjectPayment } from './earnPaymentService'
import { applyReviewToEvidence, createProjectEndorsement, createProjectReview, getReviewedProjectState } from './earnReviewMappers'
import { resolveEarnTrustSnapshot } from './earnTrustService'
import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationImpressions, withRecommendationEvent } from '../../recommendations/services/recommendationEventService'

const listeners = new Set()
const SEEN_INVITES_KEY = 'zumbarl.earnFlow.seenInvites'

let currentState = loadEarnFlowState()
let backendHydrationPromise = null

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
  saveEarnFlowState(currentState)
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

export async function hydrateEarnFlowFromBackend() {
  if (backendHydrationPromise) {
    return backendHydrationPromise
  }

  backendHydrationPromise = Promise.all([
    sendZumbarlApiRequest('/earn/opportunities').catch(() => null),
    sendZumbarlApiRequest('/earn/bids').catch(() => null),
    sendZumbarlApiRequest('/earn/projects').catch(() => null),
    sendZumbarlApiRequest('/earn/invites').catch(() => null),
    sendZumbarlApiRequest('/earn/interviews').catch(() => null),
  ]).then(([opportunitiesPayload, bidsPayload, projectsPayload, invitesPayload, interviewsPayload]) => {
    recordRecommendationImpressions('opportunities', 'opportunity', readEnvelopeData(opportunitiesPayload))
    setEarnFlowState((state) => ({
      ...state,
      opportunities: opportunitiesPayload ? readEnvelopeData(opportunitiesPayload) : state.opportunities,
      bids: bidsPayload ? readEnvelopeData(bidsPayload).map(toStudentBidCard) : state.bids,
      projects: projectsPayload ? readEnvelopeData(projectsPayload).map(toStudentProjectCard) : state.projects,
      invites: invitesPayload ? applySeenState(readEnvelopeData(invitesPayload).map(toStudentInviteCard)) : state.invites,
      interviews: interviewsPayload ? readEnvelopeData(interviewsPayload).map(toStudentInterviewCard) : state.interviews,
    }))

    return currentState
  }).catch((error) => {
    backendHydrationPromise = null
    throw error
  })

  return backendHydrationPromise
}

export function refreshEarnFlowFromBackend() {
  backendHydrationPromise = null
  return hydrateEarnFlowFromBackend()
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
  const bid = {
    ...createBid({ gig, intent, proposal }),
    ...backendBid,
    id: backendBid.id,
    source: 'database',
    status: 'Submitted',
    stage: 'Proposal submitted',
  }
  setEarnFlowState((state) => ({
    ...state,
    bids: [
      bid,
      ...state.bids.filter((item) => item.opportunityId !== bid.opportunityId),
    ],
  }))
  return bid
}

export function submitProjectWork({ projectId, project }) {
  const evidence = createEvidence({ projectId, project })
  setEarnFlowState((state) => ({
    ...state,
    portfolioEvidence: [
      evidence,
      ...state.portfolioEvidence.filter((item) => item.id !== evidence.id),
    ],
    projects: state.projects.map((item) => (
      item.id === projectId
        ? { ...item, status: 'Submitted', statusTone: 'is-awaiting', progress: '100%' }
        : item
    )),
  }))
  return evidence
}

export function reviewProjectSubmission({ decision, projectId, project, review = {} }) {
  const projectReview = createProjectReview({ decision, projectId, project, review })
  const nextProjectState = getReviewedProjectState(decision)
  const endorsement = decision === 'approved'
    ? createProjectEndorsement({ projectId, project, review: { ...review, ...projectReview } })
    : null
  const payment = decision === 'approved'
    ? createPayoutReadinessRecord({ projectId, project, review: projectReview })
    : null

  setEarnFlowState((state) => {
    const existingEvidence = state.portfolioEvidence.find((item) => item.projectId === projectId)
    const reviewedEvidence = applyReviewToEvidence({
      decision,
      evidence: existingEvidence || createEvidence({ projectId, project }),
      review: projectReview,
    })

    return {
      ...state,
      endorsements: endorsement
        ? [endorsement, ...state.endorsements.filter((item) => item.id !== endorsement.id)]
        : state.endorsements,
      payments: payment
        ? [payment, ...state.payments.filter((item) => item.id !== payment.id)]
        : state.payments,
      portfolioEvidence: [
        reviewedEvidence,
        ...state.portfolioEvidence.filter((item) => item.id !== reviewedEvidence.id),
      ],
      projectReviews: [
        projectReview,
        ...state.projectReviews.filter((item) => item.projectId !== projectId),
      ],
      projects: state.projects.map((item) => (
        item.id === projectId
          ? { ...item, progress: decision === 'approved' ? '100%' : '80%', status: nextProjectState.project, statusTone: nextProjectState.statusTone }
          : item
      )),
    }
  })

  return { endorsement, payment, review: projectReview }
}

export function awardBusinessOpportunity({ applicant, opportunity }) {
  const project = createAwardedProject({ applicant, opportunity })
  const bid = createAwardedBid({ applicant, opportunity, project })

  setEarnFlowState((state) => ({
    ...state,
    bids: [
      bid,
      ...state.bids.filter((item) => item.id !== bid.id),
    ],
    projects: [
      project,
      ...state.projects.filter((item) => item.id !== project.id),
    ],
  }))

  return { bid, project }
}

export function resolveEarnWorkspaceProject(projects, projectId) {
  const project = projects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  return toWorkspaceProject(project)
}

export function resolveProjectReview(projectReviews, projectId) {
  return projectReviews.find((item) => item.projectId === projectId) || null
}

export { resolveEarnTrustSnapshot, resolveProjectPayment }

export function createEarnFlowPersistencePayload() {
  return createEarnFlowSyncPayload(currentState)
}
