import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listProjectTeam(projectId) {
  return sendZumbarlApiRequest(`/projects/${projectId}/team`)
}

function listProjectTeamInviteCandidates(projectId, search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return sendZumbarlApiRequest(`/projects/${projectId}/team/invite-candidates${query}`)
}

function createProjectTeamInvites(projectId, candidates, { note = '', role = 'Contributor' } = {}) {
  return sendZumbarlApiRequest(`/projects/${projectId}/team/invites`, {
    method: 'POST',
    body: JSON.stringify({
      userIds: candidates.map((candidate) => candidate.userId),
      note,
      role,
    }),
  })
}

function listMyProjectTeamInvites() {
  return sendZumbarlApiRequest('/projects/team-invites/me')
}

function respondToProjectTeamInvite(inviteId, action) {
  return sendZumbarlApiRequest(`/projects/team-invites/${inviteId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export {
  createProjectTeamInvites,
  listMyProjectTeamInvites,
  listProjectTeam,
  listProjectTeamInviteCandidates,
  respondToProjectTeamInvite,
}
