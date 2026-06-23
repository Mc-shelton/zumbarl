import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function sanitizeOpportunitySplash(splash) {
  if (!splash) return splash

  const previewUrl = String(splash.previewUrl || '')
  const url = String(splash.url || '')
  const type = String(splash.type || splash.mimeType || '')
  const hasImageCrop = type.startsWith('image/') || Boolean(splash.crop)

  return {
    ...splash,
    previewUrl: previewUrl.startsWith('data:') || previewUrl.startsWith('blob:') ? url : previewUrl,
    url: url.startsWith('data:') || url.startsWith('blob:') ? '' : url,
    cropConfirmed: hasImageCrop ? true : splash.cropConfirmed,
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

async function listBackendBusinessOpportunities() {
  return sendZumbarlApiRequest('/business/opportunities')
}

async function publishBackendBusinessOpportunity(opportunityId) {
  return sendZumbarlApiRequest(`/business/opportunities/${opportunityId}/publish`, {
    method: 'POST',
  })
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

export {
  createBackendBusinessOpportunity,
  updateBackendBusinessOpportunity,
  publishBackendBusinessOpportunity,
  createBackendOpportunityDeliverables,
  listBackendBusinessOpportunities,
}
