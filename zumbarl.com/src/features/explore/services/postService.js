import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'
import { recordRecommendationEventsBestEffort, recordRecommendationImpressions, recordRecommendationInteraction, withRecommendationEvent } from '../../recommendations/services/recommendationEventService'

const listConnectPosts = ({ postId = '' } = {}) => {
  const query = postId ? `?postId=${encodeURIComponent(postId)}` : ''
  return sendZumbarlApiRequest(`/connect/feed${query}`).then((response) => {
    recordRecommendationImpressions('connect_feed', 'connect_post', response?.data)
    return response
  })
}
const listSuggestedProfiles = (limit = 12) => sendZumbarlApiRequest(`/connect/profiles/suggestions?limit=${encodeURIComponent(limit)}`).then((response) => {
  recordRecommendationImpressions('people', 'student_profile', response?.data, limit)
  return response
})
const recordProfileSuggestionDismiss = (id) => recordRecommendationInteraction({ surface: 'people', entityType: 'student_profile', entityId: id, eventType: 'hide' })
const recordConnectPostOpen = (id, source = 'feed') => recordRecommendationInteraction({ surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'open', metadata: { source } })
const createConnectPost = (payload) => sendZumbarlApiRequest('/connect/posts', { method: 'POST', body: JSON.stringify(payload) })
const updateConnectPost = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
const createConnectPostComment = (id, body, post) => withRecommendationEvent(sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify({ body, post }) }), { surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'comment' })
const toggleConnectPostLike = (id, post) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reactions`, { method: 'POST', body: JSON.stringify({ reaction: 'like', post }) }).then((result) => {
  if (result?.viewerReacted) recordRecommendationEventsBestEffort([{ surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'like' }])
  return result
})
const createConnectPostReshare = (id, post, commentary = '') => withRecommendationEvent(sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reshares`, { method: 'POST', body: JSON.stringify({ post, commentary }) }), { surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'share' })
const removeConnectPostReshare = (id) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/reshares`, { method: 'DELETE' })
const setConnectEventResponse = (id, status) => withRecommendationEvent(sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/event-response`, { method: 'PUT', body: JSON.stringify({ status }) }), { surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'rsvp' })
const voteOnConnectPostPoll = (id, optionIds) => withRecommendationEvent(sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/poll-vote`, { method: 'PUT', body: JSON.stringify({ optionIds }) }), { surface: 'connect_feed', entityType: 'connect_post', entityId: id, eventType: 'poll_vote' })
const searchEventOrganizers = (query = '') => sendZumbarlApiRequest(`/connect/event-organizers?q=${encodeURIComponent(query)}`)
const searchPostTagTargets = (query = '') => sendZumbarlApiRequest(`/connect/post-tag-targets?q=${encodeURIComponent(query)}`)
const readAnnouncementTargets = () => sendZumbarlApiRequest('/connect/announcements/targets')
const submitPostForAnnouncement = (id, payload) => sendZumbarlApiRequest(`/connect/posts/${encodeURIComponent(id)}/announcement-submissions`, { method: 'POST', body: JSON.stringify(payload) })

export { createConnectPost, createConnectPostComment, createConnectPostReshare, listConnectPosts, listSuggestedProfiles, readAnnouncementTargets, recordConnectPostOpen, recordProfileSuggestionDismiss, removeConnectPostReshare, searchEventOrganizers, searchPostTagTargets, setConnectEventResponse, submitPostForAnnouncement, toggleConnectPostLike, updateConnectPost, voteOnConnectPostPoll }
