import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listConversations() {
  return sendZumbarlApiRequest('/connect/messages/conversations')
}

function listMessages({ participantId, opportunityId }) {
  const params = new URLSearchParams({ participantId })
  if (opportunityId) params.set('opportunityId', opportunityId)
  return sendZumbarlApiRequest(`/connect/messages?${params}`)
}

function sendMessage({ recipientId, opportunityId, body, fileUrls = [] }) {
  return sendZumbarlApiRequest('/connect/messages', {
    method: 'POST',
    body: JSON.stringify({
      recipientId,
      opportunityId: opportunityId || undefined,
      body,
      fileUrls,
    }),
  })
}

export { listConversations, listMessages, sendMessage }
