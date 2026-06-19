import { createAwardedBid, createAwardedProject, createBid, createEvidence, toWorkspaceProject } from './earnFlowMappers'
import { createEarnFlowSyncPayload, loadEarnFlowState, saveEarnFlowState } from './earnFlowRepository'
import { createPayoutReadinessRecord, resolveProjectPayment } from './earnPaymentService'
import { applyReviewToEvidence, createProjectEndorsement, createProjectReview, getReviewedProjectState } from './earnReviewMappers'
import { resolveEarnTrustSnapshot } from './earnTrustService'
import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const listeners = new Set()

let currentState = loadEarnFlowState()
let backendHydrationPromise = null

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
  ]).then(([opportunitiesPayload, bidsPayload, projectsPayload]) => {
    const opportunities = readEnvelopeData(opportunitiesPayload)
    const bids = readEnvelopeData(bidsPayload)
    const projects = readEnvelopeData(projectsPayload)

    setEarnFlowState((state) => ({
      ...state,
      opportunities: opportunities.length ? opportunities : state.opportunities,
      bids: bids.length ? bids : state.bids,
      projects: projects.length ? projects : state.projects,
    }))

    return currentState
  }).catch((error) => {
    backendHydrationPromise = null
    throw error
  })

  return backendHydrationPromise
}

export function submitOpportunityBid({ gig, intent, proposal }) {
  const bid = createBid({ gig, intent, proposal })
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
