import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function normalizeOpportunityPayload(opportunity) {
  return {
    ...opportunity,
    budgetAmount: opportunity.budgetAmount || Number(String(opportunity.budget || '').replace(/[^\d.]/g, '')) || 0,
    currency: opportunity.currency || 'KES',
    requirements: Array.isArray(opportunity.requirements) ? opportunity.requirements : [],
    deliverables: opportunity.deliverables || '',
    type: 'project',
    visibility: opportunity.status === 'Draft' ? 'draft' : 'public',
  }
}

async function createBackendBusinessOpportunity(opportunity) {
  return sendZumbarlApiRequest('/business/opportunities', {
    method: 'POST',
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
  publishBackendBusinessOpportunity,
  createBackendOpportunityDeliverables,
  listBackendBusinessOpportunities,
}
