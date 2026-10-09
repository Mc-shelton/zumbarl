import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { normalizeZumbarlFileMetadata } from '../../../lib/normalizeZumbarlFileUrl'

function sanitizeOpportunitySplash(splash) {
  if (!splash) return splash

  const normalizedSplash = normalizeZumbarlFileMetadata(splash)

  const previewUrl = String(normalizedSplash.previewUrl || '')
  const url = String(normalizedSplash.url || '')
  const type = String(normalizedSplash.type || normalizedSplash.mimeType || '')
  const hasImageCrop = type.startsWith('image/') || Boolean(normalizedSplash.crop)

  return {
    ...normalizedSplash,
    previewUrl: previewUrl.startsWith('data:') || previewUrl.startsWith('blob:') ? url : previewUrl,
    url: url.startsWith('data:') || url.startsWith('blob:') ? '' : url,
    cropConfirmed: hasImageCrop ? true : normalizedSplash.cropConfirmed,
  }
}

function removeNullishDraftValues(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeNullishDraftValues(item))
      .filter((item) => item !== undefined && item !== null)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeNullishDraftValues(item)])
        .filter(([, item]) => item !== undefined && item !== null),
    )
  }

  return value
}

function normalizeOpportunityPayload(opportunity) {
  const status = String(opportunity.status || '').toLowerCase()
  return removeNullishDraftValues({
    ...opportunity,
    budgetAmount: opportunity.budgetAmount || Number(String(opportunity.budget || '').replace(/[^\d.]/g, '')) || 0,
    currency: opportunity.currency || 'KES',
    requirements: Array.isArray(opportunity.requirements) ? opportunity.requirements : [],
    deliverables: opportunity.deliverables || '',
    opportunitySplash: sanitizeOpportunitySplash(opportunity.opportunitySplash),
    type: 'project',
    visibility: status === 'draft' || status === 'draft ready' ? 'draft' : 'public',
  })
}

async function createBackendBusinessOpportunity(opportunity) {
  return sendZumbarlApiRequest('/business/opportunities', {
    method: 'POST',
    body: JSON.stringify(normalizeOpportunityPayload(opportunity)),
  })
}

async function updateBackendBusinessOpportunity(opportunityId, opportunity) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}`, {
    method: 'PATCH',
    body: JSON.stringify(normalizeOpportunityPayload(opportunity)),
  })
}

async function deleteBackendBusinessOpportunity(opportunityId) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}`, {
    method: 'DELETE',
  })
}

async function listBackendBusinessOpportunities() {
  return sendZumbarlApiRequest('/business/opportunities')
}

async function listBackendBusinessActivity() {
  return sendZumbarlApiRequest('/business/activity')
}

async function publishBackendBusinessOpportunity(opportunityId) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/publish`, {
    method: 'POST',
  })
}

async function setBackendOpportunityApplicationsClosed(opportunityId, closed) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/applications-closed`, {
    method: 'POST',
    body: JSON.stringify({ closed }),
  })
}

async function fundBackendBusinessOpportunity(opportunityId, payment) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/fund`, {
    method: 'POST',
    body: JSON.stringify(payment),
  })
}

async function readBackendMpesaPayment(paymentId) {
  return sendZumbarlApiRequest(`/finance/mpesa/payments/${paymentId}`)
}

async function reconcileBackendMpesaPayment(paymentId) {
  return sendZumbarlApiRequest(`/finance/mpesa/payments/${paymentId}/reconcile`, {
    method: 'POST',
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function mpesaPaymentError(message, code, payment = null) {
  const error = new Error(message)
  error.code = code
  error.payment = payment
  return error
}

async function waitForBackendMpesaPayment(paymentId, { intervalMs = 2500, attempts = 48 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await wait(intervalMs)
    let response
    if (attempt % 3 === 2) {
      try {
        response = await reconcileBackendMpesaPayment(paymentId)
      } catch {
        // A transient status-query failure must not hide a callback that may
        // already be on its way. Continue polling the local payment record.
        response = await readBackendMpesaPayment(paymentId)
      }
    } else {
      response = await readBackendMpesaPayment(paymentId)
    }
    const payment = response?.payment
    if (payment?.status === 'COMPLETED') return payment
    if (payment?.status === 'FAILED' || payment?.status === 'REVERSED') {
      throw mpesaPaymentError(
        payment.resultDescription || 'The M-Pesa payment was not completed.',
        'MPESA_PAYMENT_FAILED',
        payment,
      )
    }
  }
  throw mpesaPaymentError(
    'M-Pesa has not confirmed this payment yet. Do not start another payment; you can close this window and fund the opportunity later.',
    'MPESA_PAYMENT_PENDING',
    { id: paymentId, status: 'PROCESSING' },
  )
}

async function listBackendFinanceWallets() {
  return sendZumbarlApiRequest('/finance/wallets')
}

async function createBackendOpportunityDeliverables(opportunityId, deliverables, payment) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/deliverables`, {
    method: 'POST',
    body: JSON.stringify({
      deliverables,
      payment,
    }),
  })
}

async function listBackendOpportunityInviteCandidates(opportunityId, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/invite-candidates${query}`)
}

async function listBackendOpportunityApplicants(opportunityId) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/applicants`)
}

async function scheduleBackendApplicantInterview(applicantBidId, interview) {
  return sendZumbarlApiRequest(`/business/applicants/${applicantBidId}/interview`, {
    method: 'POST',
    body: JSON.stringify(interview),
  })
}

async function startBackendApplicantInterview(applicantBidId) {
  return sendZumbarlApiRequest(`/business/applicants/${applicantBidId}/interview/start`, {
    method: 'POST',
  })
}

async function awardBackendApplicant(applicantBidId) {
  return sendZumbarlApiRequest(`/business/applicants/${applicantBidId}/award`, {
    method: 'POST',
  })
}

async function counterOfferBackendApplicant(applicantBidId, { amount, autoRejectOnDecline, currency }) {
  return sendZumbarlApiRequest(`/business/applicants/${applicantBidId}/counter-offer`, {
    method: 'POST',
    body: JSON.stringify({ amount, autoRejectOnDecline, currency }),
  })
}

async function listBackendOpportunitySubmissions(opportunityId) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/submissions`)
}

async function reviewBackendDeliverable(deliverableId, { decision, feedback }) {
  return sendZumbarlApiRequest(`/projects/deliverables/${deliverableId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, feedback }),
  })
}

async function completeBackendScopeTarget(projectId, { scopeItemId, milestoneId }) {
  return sendZumbarlApiRequest(`/projects/${projectId}/complete-target`, {
    method: 'POST',
    body: JSON.stringify({ scopeItemId, milestoneId }),
  })
}

async function proposeBackendProjectPrice(projectId, { amount, currency }) {
  return sendZumbarlApiRequest(`/projects/${projectId}/price-proposals`, {
    method: 'POST',
    body: JSON.stringify({ amount, currency }),
  })
}

async function startBackendProject(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/start`, { method: 'POST' })
}

async function endBackendProject(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/end`, { method: 'POST' })
}

async function sendBackendOpportunityInvites(opportunityId, { note, studentIds }) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/invites`, {
    method: 'POST',
    body: JSON.stringify({ note, studentIds }),
  })
}

export {
  createBackendBusinessOpportunity,
  deleteBackendBusinessOpportunity,
  updateBackendBusinessOpportunity,
  publishBackendBusinessOpportunity,
  setBackendOpportunityApplicationsClosed,
  fundBackendBusinessOpportunity,
  readBackendMpesaPayment,
  reconcileBackendMpesaPayment,
  waitForBackendMpesaPayment,
  listBackendFinanceWallets,
  createBackendOpportunityDeliverables,
  listBackendOpportunityInviteCandidates,
  listBackendOpportunityApplicants,
  scheduleBackendApplicantInterview,
  startBackendApplicantInterview,
  awardBackendApplicant,
  counterOfferBackendApplicant,
  listBackendOpportunitySubmissions,
  reviewBackendDeliverable,
  completeBackendScopeTarget,
  proposeBackendProjectPrice,
  startBackendProject,
  endBackendProject,
  sendBackendOpportunityInvites,
  listBackendBusinessActivity,
  listBackendBusinessOpportunities,
}
