import {
  createBackendBusinessOpportunity,
  deleteBackendBusinessOpportunity,
  fundBackendBusinessOpportunity,
  waitForBackendMpesaPayment,
  listBackendBusinessOpportunities,
  publishBackendBusinessOpportunity,
  sendBackendOpportunityInvites,
  updateBackendBusinessOpportunity,
} from './persistBusinessOpportunity'
import { normalizeZumbarlFileMetadata } from '../../../lib/normalizeZumbarlFileUrl'

const STATE_VERSION = 2

const listeners = new Set()

function getDefaultState() {
  return {
    version: STATE_VERSION,
    opportunities: [],
    selectedOpportunityId: null,
    error: '',
    isLoading: false,
  }
}

let currentState = getDefaultState()

function setBusinessFlowState(updater) {
  currentState = updater(currentState)
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
    opportunitySplash: normalizeZumbarlFileMetadata(source.opportunitySplash),
  }
}

function getDisplayOpportunityStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'draft' || normalized === 'draft ready') return 'Draft'
  if (normalized === 'published' || normalized === 'open') return 'Open'
  if (normalized === 'ready') return 'Draft'
  if (normalized === 'in_progress' || normalized === 'in progress' || normalized === 'awarded') return 'In Progress'
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
    opportunities: backendOpportunities,
  }))
}

export async function hydrateBusinessOpportunitiesFromBackend() {
  setBusinessFlowState((state) => ({ ...state, error: '', isLoading: true }))
  try {
    const response = await listBackendBusinessOpportunities()
    // Replacing the collection makes the API authoritative and prevents deleted
    // opportunities from surviving as local ghost cards.
    mergeBackendOpportunities(response?.data || [])
    setBusinessFlowState((state) => ({ ...state, error: '', isLoading: false }))
    return response?.data || []
  } catch (error) {
    setBusinessFlowState((state) => ({
      ...state,
      error: error instanceof Error ? error.message : 'Opportunities could not be loaded.',
      isLoading: false,
    }))
    throw error
  }
}

function mergeSavedOpportunity(localOpportunity, backendOpportunity) {
  const backendId = backendOpportunity?.id || localOpportunity.backendId || localOpportunity.id
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
    id: backendId,
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
      item.id === localOpportunity.id || item.id === backendId ? savedOpportunity : item
    )),
    selectedOpportunityId: savedOpportunity.id,
  }))

  return savedOpportunity
}

export async function createBusinessOpportunity(payload, options = {}) {
  const existingOpportunity = options.existingId
    ? currentState.opportunities.find((item) => item.id === options.existingId)
    : null
  const draft = {
    ...(existingOpportunity || {}),
    id: existingOpportunity?.id || createId('brief', `${payload.title}-${Date.now()}`),
    applicants: 0,
    createdAt: existingOpportunity?.createdAt || formatCreatedAt(),
    intentId: 'career',
    intentLabel: 'Build Career Mode',
    ...payload,
    status: getDisplayOpportunityStatus(payload.status || existingOpportunity?.status || 'Draft'),
  }

  const backendOpportunity = draft.backendId
    ? await updateBackendBusinessOpportunity(draft.backendId, draft)
    : await createBackendBusinessOpportunity(draft)

  if (!existingOpportunity) {
    const saved = normalizeOpportunity({
      ...draft,
      ...backendOpportunity,
      id: backendOpportunity.id,
      backendId: backendOpportunity.id,
      status: getDisplayOpportunityStatus(backendOpportunity.status),
    })
    setBusinessFlowState((state) => ({
      ...state,
      opportunities: [saved, ...state.opportunities.filter((item) => item.id !== saved.id)],
      selectedOpportunityId: saved.id,
    }))
    return saved
  }

  return mergeSavedOpportunity(draft, backendOpportunity)
}

export async function deleteBusinessOpportunity(opportunityId) {
  const opportunity = currentState.opportunities.find((item) => item.id === opportunityId)
  if (!opportunity) return null
  if (getDisplayOpportunityStatus(opportunity.status) !== 'Draft') {
    throw new Error('Only draft opportunities can be deleted.')
  }

  if (opportunity.backendId) {
    await deleteBackendBusinessOpportunity(opportunity.backendId)
  }

  setBusinessFlowState((state) => ({
    ...state,
    opportunities: state.opportunities.filter((item) => item.id !== opportunityId),
    selectedOpportunityId: state.selectedOpportunityId === opportunityId ? null : state.selectedOpportunityId,
  }))

  return opportunity
}

export async function publishBusinessOpportunity(opportunityId, payment) {
  const opportunity = currentState.opportunities.find((item) => item.id === opportunityId)
  if (!opportunity) return null

  const backendId = opportunity.backendId || opportunityId
  const funding = await fundBackendBusinessOpportunity(backendId, {
    ...payment,
    publishAfterFunding: payment?.method === 'mobile_money',
  })
  if (funding?.payment?.id && funding.payment.status !== 'COMPLETED') {
    await waitForBackendMpesaPayment(funding.payment.id)
  }
  const backendOpportunity = await publishBackendBusinessOpportunity(backendId)
  return mergeSavedOpportunity(opportunity, backendOpportunity)
}

export async function inviteBusinessOpportunityBidders({ bidders, note, opportunityId }) {
  const opportunity = currentState.opportunities.find((item) => item.id === opportunityId)
  const backendId = opportunity?.backendId || opportunity?.id
  if (!backendId) throw new Error('Save this opportunity before inviting students.')
  if (!bidders.length) return []

  const response = await sendBackendOpportunityInvites(backendId, {
    note,
    studentIds: bidders.map((bidder) => bidder.id),
  })
  await hydrateBusinessOpportunitiesFromBackend()
  return response?.invites || []
}
