import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

async function listBusinessIndustries() {
  return sendZumbarlApiRequest('/business/industries')
}

async function createBusinessIndustry(name) {
  return sendZumbarlApiRequest('/business/industries', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export {
  createBusinessIndustry,
  listBusinessIndustries,
}
