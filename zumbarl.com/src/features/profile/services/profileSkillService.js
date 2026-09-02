import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function searchProfileSkills(query = '') {
  const params = new URLSearchParams({ limit: '12' })
  if (query.trim()) params.set('q', query.trim())
  return sendZumbarlApiRequest(`/skills?${params.toString()}`)
}

function createProfileSkill(name) {
  return sendZumbarlApiRequest('/skills', {
    method: 'POST',
    body: JSON.stringify({ name, source: 'student_profile' }),
  })
}

async function resolveProfileSkill(name) {
  const matches = await searchProfileSkills(name)
  if (matches?.data?.length) return { skill: matches.data[0], created: false }
  return { skill: await createProfileSkill(name), created: true }
}

export { createProfileSkill, resolveProfileSkill, searchProfileSkills }
