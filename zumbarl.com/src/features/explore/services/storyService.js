import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function listStories() {
  return sendZumbarlApiRequest('/connect/stories')
}

function createStory(story) {
  return sendZumbarlApiRequest('/connect/stories', {
    method: 'POST',
    body: JSON.stringify(story),
  })
}

function readStoryEngagement(storyReference) {
  return sendZumbarlApiRequest(`/connect/stories/${encodeURIComponent(storyReference)}/engagement`)
}

function toggleStoryReaction(storyReference, story) {
  return sendZumbarlApiRequest(`/connect/stories/${encodeURIComponent(storyReference)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ reaction: 'like', story }),
  })
}

function createStoryComment(storyReference, body, story) {
  return sendZumbarlApiRequest(`/connect/stories/${encodeURIComponent(storyReference)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, story }),
  })
}

function toggleStoryCommentReaction(commentId) {
  return sendZumbarlApiRequest(`/connect/stories/comments/${encodeURIComponent(commentId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ reaction: 'like' }),
  })
}

export {
  createStory,
  createStoryComment,
  listStories,
  readStoryEngagement,
  toggleStoryCommentReaction,
  toggleStoryReaction,
}
