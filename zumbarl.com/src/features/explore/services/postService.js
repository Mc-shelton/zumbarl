import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const listConnectPosts = ({ postId = '' } = {}) => {
  const query = postId ? `?postId=${encodeURIComponent(postId)}` : ''
  return sendZumbarlApiRequest(`/connect/feed${query}`)
}
const listSuggestedProfiles = (limit = 12) => sendZumbarlApiRequest(`/connect/profiles/suggestions?limit=${encodeURIComponent(limit)}`)
const createConnectPost = (payload) => sendZumbarlApiRequest('/connect/posts', { method: 'POST', body: JSON.stringify(payload) })
const updateConnectPost = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
const createConnectPostComment = (id, body, post) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify({ body, post }) })
const toggleConnectPostLike = (id, post) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reactions`, { method: 'POST', body: JSON.stringify({ reaction: 'like', post }) })
const createConnectPostReshare = (id, post, commentary = '') => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reshares`, { method: 'POST', body: JSON.stringify({ post, commentary }) })
const removeConnectPostReshare = (id) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reshares`, { method: 'DELETE' })
const setConnectEventResponse = (id, status) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/event-response`, { method: 'PUT', body: JSON.stringify({ status }) })
const searchEventOrganizers = (query = '') => sendZumbarlApiRequest(`/connect/event-organizers?q=${encodeURIComponent(query)}`)
const searchPostTagTargets = (query = '') => sendZumbarlApiRequest(`/connect/post-tag-targets?q=${encodeURIComponent(query)}`)
const readAnnouncementTargets = () => sendZumbarlApiRequest('/connect/announcements/targets')
const submitPostForAnnouncement = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/announcement-submissions`, { method: 'POST', body: JSON.stringify(payload) })

export { createConnectPost, createConnectPostComment, createConnectPostReshare, listConnectPosts, listSuggestedProfiles, readAnnouncementTargets, removeConnectPostReshare, searchEventOrganizers, searchPostTagTargets, setConnectEventResponse, submitPostForAnnouncement, toggleConnectPostLike, updateConnectPost }
