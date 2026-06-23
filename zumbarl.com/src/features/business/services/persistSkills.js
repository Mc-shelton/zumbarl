import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

async function listBusinessSkills(query = '') {
  const searchParams = new URLSearchParams()
  if (query.trim()) searchParams.set('q', query.trim())
  searchParams.set('limit', '12')
  const suffix = searchParams.toString()
  return sendZumbarlApiRequest(`/skills${suffix ? `?${suffix}` : ''}`)
}

async function createBusinessSkill(name) {
  return sendZumbarlApiRequest('/skills', {
    method: 'POST',
    body: JSON.stringify({
      name,
      source: 'business_opportunity'
    }),
  })
}

export {
  createBusinessSkill,
  listBusinessSkills,
}
