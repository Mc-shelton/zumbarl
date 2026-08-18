import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

const listConnectPosts = () => sendZumbarlApiRequest('/connect/feed')
const createConnectPost = (payload) => sendZumbarlApiRequest('/connect/posts', { method: 'POST', body: JSON.stringify(payload) })
const updateConnectPost = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
const createConnectPostComment = (id, body) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify({ body }) })
const searchEventOrganizers = (query = '') => sendZumbarlApiRequest(`/connect/event-organizers?q=${encodeURIComponent(query)}`)
const readAnnouncementTargets = () => sendZumbarlApiRequest('/connect/announcements/targets')
const submitPostForAnnouncement = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/announcement-submissions`, { method: 'POST', body: JSON.stringify(payload) })

export { createConnectPost, createConnectPostComment, listConnectPosts, readAnnouncementTargets, searchEventOrganizers, submitPostForAnnouncement, updateConnectPost }
