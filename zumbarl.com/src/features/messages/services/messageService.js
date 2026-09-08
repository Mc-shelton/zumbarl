import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listConversations() {
  return sendZumbarlApiRequest('/connect/messages/conversations')
}

function listMessageNetwork() {
  return sendZumbarlApiRequest('/connect/messages/network')
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

function listPageConversations({ pageType, pageId } = {}) {
  const params = new URLSearchParams()
  if (pageType) params.set('pageType', pageType)
  if (pageId) params.set('pageId', pageId)
  const query = params.toString()
  return sendZumbarlApiRequest(`/connect/messages/page-conversations${query ? `?${query}` : ''}`)
}

function ensurePageConversation({ pageType, pageId, customerUserId }) {
  return sendZumbarlApiRequest('/connect/messages/page-conversations', {
    method: 'POST',
    body: JSON.stringify({ pageType, pageId, customerUserId: customerUserId || undefined }),
  })
}

function listPageMessages(conversationId) {
  return sendZumbarlApiRequest(`/connect/messages/page-conversations/${encodeURIComponent(conversationId)}`)
}

function sendPageMessage(conversationId, { body, fileUrls = [], context, sendAsPage = false }) {
  return sendZumbarlApiRequest(`/connect/messages/page-conversations/${encodeURIComponent(conversationId)}`, {
    method: 'POST',
    body: JSON.stringify({ body, fileUrls, context, sendAsPage }),
  })
}

function listProjectGroupMessages(projectId) {
  return sendZumbarlApiRequest(`/connect/messages/project-group/${projectId}`)
}

function listProjectGroupConversations() {
  return sendZumbarlApiRequest('/connect/messages/project-groups')
}

function sendProjectGroupMessage(projectId, { body, fileUrls = [] }) {
  return sendZumbarlApiRequest(`/connect/messages/project-group/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ body, fileUrls }),
  })
}

export {
  listConversations,
  listMessageNetwork,
  listMessages,
  listPageConversations,
  ensurePageConversation,
  listPageMessages,
  listProjectGroupConversations,
  listProjectGroupMessages,
  sendMessage,
  sendPageMessage,
  sendProjectGroupMessage,
}
