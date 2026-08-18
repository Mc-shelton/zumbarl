import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listConversations() {
  return sendZumbarlApiRequest('/connect/messages/conversations')
}

function listMessages({ participantId, opportunityId }) {
  const params = new URLSearchParams({ participantId })
  if (opportunityId) params.set('opportunityId', opportunityId)
  return sendZumbarlApiRequest(`/connect/messages?${params}`)
}

function sendMessage({ recipientId, opportunityId, body, fileUrls = [], context }) {
  return sendZumbarlApiRequest('/connect/messages', {
    method: 'POST',
    body: JSON.stringify({
      recipientId,
      opportunityId: opportunityId || undefined,
      body,
      fileUrls,
      context,
    }),
  })
}

function listProjectGroupMessages(projectId) {
  return sendZumbarlApiRequest(`/connect/messages/project-group/${projectId}`)
}

function sendProjectGroupMessage(projectId, { body, fileUrls = [] }) {
  return sendZumbarlApiRequest(`/connect/messages/project-group/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ body, fileUrls }),
  })
}

export {
  listConversations,
  listMessages,
  listProjectGroupMessages,
  sendMessage,
  sendProjectGroupMessage,
}
