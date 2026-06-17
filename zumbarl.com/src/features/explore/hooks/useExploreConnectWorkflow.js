import { useMemo, useState } from 'react'
import {
  CONNECT_GROUPS,
  CONNECT_POST_TEMPLATE,
  CONNECT_STORIES,
  CONNECT_TAG_CONTEXTS,
  createInitialConnectWorkflowState,
  getConnectActiveStepId,
} from '../../workflows/workflowData'

function useExploreConnectWorkflow() {
  const [state, setState] = useState(createInitialConnectWorkflowState)

  const patchState = (patch) => setState((current) => ({ ...current, ...patch }))

  const activeStory = CONNECT_STORIES.find((story) => story.id === state.activeStoryId) || CONNECT_STORIES[0]
  const activeTag = CONNECT_TAG_CONTEXTS.find((tag) => tag.id === state.activeTagId) || CONNECT_TAG_CONTEXTS[0]
  const activeGroup = CONNECT_GROUPS.find((group) => group.id === state.activeGroupId) || CONNECT_GROUPS[0]
  const activeStepId = getConnectActiveStepId(state)
  const engagementReady = state.reacted && state.commentAdded && state.reposted
  const canRecordProof = state.storyPublished
    && state.postPublished
    && engagementReady
    && state.tagResolved
    && state.groupJoined
    && state.contributionMade
    && state.safetyChecked

  const postMetrics = useMemo(() => ({
    reactions: CONNECT_POST_TEMPLATE.metrics.reactions + (state.reacted ? 1 : 0),
    comments: CONNECT_POST_TEMPLATE.metrics.comments + (state.commentAdded ? 1 : 0),
    reposts: CONNECT_POST_TEMPLATE.metrics.reposts + (state.reposted ? 1 : 0),
  }), [state.commentAdded, state.reacted, state.reposted])

  const walletSaved = activeGroup.wallet
    ? activeGroup.wallet.saved + (state.contributionMade ? 500 : 0)
    : 0

  const workflowStatusItems = useMemo(() => [
    {
      label: 'Profile ready',
      status: state.profileReady ? 'done' : 'blocked',
      detail: state.profileReady
        ? 'Campus identity, interests, and safety preferences are set.'
        : 'Prepare visible social identity first.',
    },
    {
      label: 'Story/status live',
      status: state.storyPublished ? 'done' : 'blocked',
      detail: state.storyPublished
        ? 'Status appears in the top story rail.'
        : 'Publish one short status update.',
    },
    {
      label: 'Tagged post',
      status: state.postPublished ? 'done' : 'blocked',
      detail: state.postPublished
        ? `${activeTag.type} tag is attached to the feed post.`
        : 'Publish a useful post with typed tags.',
    },
    {
      label: 'Engagement loop',
      status: engagementReady ? 'done' : 'blocked',
      detail: `${postMetrics.reactions} reactions, ${postMetrics.comments} comments, ${postMetrics.reposts} reposts.`,
    },
    {
      label: 'Tag action',
      status: state.tagResolved ? 'done' : 'blocked',
      detail: state.tagResolved
        ? `${activeTag.primaryAction} action was recorded.`
        : 'Open a tag and take the primary action.',
    },
    {
      label: 'Membership',
      status: state.groupJoined ? 'done' : 'blocked',
      detail: state.groupJoined
        ? `${activeGroup.title} membership is active.`
        : 'Join one group, club, event circle, or chama.',
    },
    {
      label: 'Contribution',
      status: state.contributionMade ? 'done' : 'blocked',
      detail: state.contributionMade
        ? 'KES 500 contribution added to mock ledger.'
        : 'Make a chama contribution.',
    },
    {
      label: 'Safety check',
      status: state.safetyChecked ? 'done' : 'blocked',
      detail: state.safetyChecked
        ? 'Mock moderation check passed.'
        : 'Check content, tags, comments, and group activity.',
    },
    {
      label: 'Community proof',
      status: state.proofRecorded ? 'done' : 'blocked',
      detail: state.proofRecorded
        ? 'Profile proof updated with creator and group signals.'
        : 'Record proof after the full Connect loop.',
    },
  ], [
    activeGroup.title,
    activeTag.primaryAction,
    activeTag.type,
    engagementReady,
    postMetrics.comments,
    postMetrics.reactions,
    postMetrics.reposts,
    state.contributionMade,
    state.groupJoined,
    state.postPublished,
    state.profileReady,
    state.proofRecorded,
    state.safetyChecked,
    state.storyPublished,
    state.tagResolved,
  ])

  const handlePrepareProfile = () => patchState({ profileReady: true })

  const handlePublishStory = () => {
    if (!state.profileReady) {
      patchState({ profileReady: true })
      return
    }
    patchState({ storyPublished: true })
  }

  const handlePublishPost = () => {
    if (!state.profileReady) {
      patchState({ profileReady: true })
      return
    }
    if (!state.storyPublished) return
    patchState({ postPublished: true })
  }

  const handleComposerPost = () => {
    if (!state.profileReady) {
      patchState({ profileReady: true })
      return
    }
    if (!state.storyPublished) {
      patchState({ storyPublished: true })
      return
    }
    patchState({ postPublished: true })
  }

  return {
    activeGroup,
    activeStepId,
    activeStory,
    activeTag,
    canRecordProof,
    engagementReady,
    handleComposerPost,
    handlePrepareProfile,
    handlePublishPost,
    handlePublishStory,
    patchState,
    postMetrics,
    state,
    walletSaved,
    workflowStatusItems,
  }
}

export default useExploreConnectWorkflow
