import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

async function readBusinessDashboard() {
  return sendZumbarlApiRequest('/business/dashboard')
}

async function createBusinessPost(payload) {
  return sendZumbarlApiRequest('/business/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function listBusinessTalent(query = '') {
  const normalizedQuery = String(query || '').trim()
  const suffix = normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''
  return sendZumbarlApiRequest(`/business/talent${suffix}`)
}

export {
  createBusinessPost,
  listBusinessTalent,
  readBusinessDashboard,
}
