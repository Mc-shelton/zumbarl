import {
  FiAlertTriangle,
  FiBookmark,
  FiCheckCircle,
  FiEye,
  FiMessageCircle,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiTag,
  FiThumbsUp,
  FiUserPlus,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { WorkflowStatusPanel } from '../../workflows/components/WorkflowStatusPanel'
import { CONNECT_TAG_CONTEXTS } from '../../workflows/workflowData'

function ExploreConnectWorkflowPanel({
  activeTag,
  canRecordProof,
  engagementReady,
  onPatchState,
  onPrepareProfile,
  onPublishPost,
  onPublishStory,
  state,
  workflowStatusItems,
}) {
  return (
    <WorkflowStatusPanel
      title="Connect workflow"
      items={workflowStatusItems}
      actions={(
        <>
          <button type="button" className="connect-soft-btn" onClick={onPrepareProfile}>
            <FiUserPlus aria-hidden="true" />
            Connect settings
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.profileReady || state.storyPublished} onClick={onPublishStory}>
            <FiEye aria-hidden="true" />
            Publish story
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.storyPublished || state.postPublished} onClick={onPublishPost}>
            <FiTag aria-hidden="true" />
            Publish tagged post
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.postPublished || state.reacted} onClick={() => onPatchState({ reacted: true })}>
            <FiThumbsUp aria-hidden="true" />
            React
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.postPublished || state.commentAdded} onClick={() => onPatchState({ commentAdded: true })}>
            <FiMessageCircle aria-hidden="true" />
            Comment
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.postPublished || state.reposted} onClick={() => onPatchState({ reposted: true })}>
            <FiRefreshCw aria-hidden="true" />
            Repost
          </button>
          <button type="button" className="connect-primary-btn" disabled={!engagementReady || state.tagResolved} onClick={() => onPatchState({ tagResolved: true })}>
            <FiZap aria-hidden="true" />
            Resolve {activeTag.primaryAction.toLowerCase()}
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.tagResolved || state.groupJoined} onClick={() => onPatchState({ groupJoined: true })}>
            <FiUsers aria-hidden="true" />
            Join group
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.groupJoined || state.contributionMade} onClick={() => onPatchState({ contributionMade: true })}>
            <FiShoppingCart aria-hidden="true" />
            Contribute KES 500
          </button>
          <button type="button" className="connect-soft-btn" disabled={!state.contributionMade || state.safetyChecked} onClick={() => onPatchState({ safetyChecked: true })}>
            <FiShield aria-hidden="true" />
            Run safety check
          </button>
          <button type="button" className="connect-primary-btn" disabled={!canRecordProof || state.proofRecorded} onClick={() => onPatchState({ proofRecorded: true })}>
            <FiCheckCircle aria-hidden="true" />
            Record proof
          </button>
        </>
      )}
    />
  )
}

function ExploreConnectDraftPost({
  activeTag,
  engagementReady,
  onPatchState,
  onPublishPost,
  postMetrics,
  state,
}) {
  return (
    <section className="explore-connect-feed-grid" aria-label="Your Connect post">
      <article className="connect-post-card">
        <header>
          <div>
            <span>Your post</span>
            <h2>What&apos;s happening on campus?</h2>
          </div>
          <strong>{state.postPublished ? 'Live' : 'Draft'}</strong>
        </header>
        <p>
          {state.postPublished
            ? 'Used comments from the business review to clean up empty states, loading copy, and mobile spacing. Looking for two people to review the case study before I add it to my portfolio.'
            : 'Share a project update, product drop, event invite, or learning milestone. Typed tags route viewers into useful actions.'}
        </p>
        <div className="connect-tag-picker" aria-label="Post tags">
          {CONNECT_TAG_CONTEXTS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={tag.id === state.activeTagId ? 'is-active' : ''}
              onClick={() => onPatchState({ activeTagId: tag.id })}
            >
              {tag.type}
            </button>
          ))}
        </div>
        <footer>
          <button type="button" disabled={!state.postPublished} onClick={() => onPatchState({ reacted: true })}>
            <FiThumbsUp aria-hidden="true" />
            {postMetrics.reactions}
          </button>
          <button type="button" disabled={!state.postPublished} onClick={() => onPatchState({ commentAdded: true })}>
            <FiMessageCircle aria-hidden="true" />
            {postMetrics.comments}
          </button>
          <button type="button" disabled={!state.postPublished} onClick={() => onPatchState({ reposted: true })}>
            <FiRefreshCw aria-hidden="true" />
            {postMetrics.reposts}
          </button>
          <button type="button" disabled={!state.postPublished}>
            <FiBookmark aria-hidden="true" />
            Save
          </button>
          <button type="button">
            <FiAlertTriangle aria-hidden="true" />
            Report
          </button>
          {!state.postPublished ? (
            <button type="button" className="connect-primary-btn" disabled={!state.storyPublished} onClick={onPublishPost}>
              <FiTag aria-hidden="true" />
              Publish post
            </button>
          ) : null}
        </footer>
      </article>

      <article className="connect-context-card">
        <span>{activeTag.type} tag</span>
        <h2>{activeTag.label}</h2>
        <p>{activeTag.detail}</p>
        <div>
          <button type="button" className="connect-primary-btn" disabled={!engagementReady || state.tagResolved} onClick={() => onPatchState({ tagResolved: true })}>
            <FiZap aria-hidden="true" />
            {activeTag.primaryAction}
          </button>
          <button type="button" className="connect-soft-btn">
            <FiEye aria-hidden="true" />
            {activeTag.secondaryAction}
          </button>
        </div>
      </article>
    </section>
  )
}

export { ExploreConnectDraftPost, ExploreConnectWorkflowPanel }
