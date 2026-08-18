import { FiPlay, FiAlertCircle } from 'react-icons/fi'

// Until the project starts, escrow is unverified and scope is unlocked, so the
// API rejects submissions. The only Start control used to live in the page
// header, far from the board where the block is actually felt - so both sides
// now see the state where the work is.
function ProjectStartNotice({ hasStarted, isPending, onStartProject }) {
  if (hasStarted) return null

  return (
    <p className={`project-start-notice${onStartProject ? ' is-actionable' : ''}`} role="status">
      <FiAlertCircle aria-hidden="true" />
      <span>
        {onStartProject
          ? 'This project has not started yet, so the team cannot submit work against it.'
          : 'The business has not started this project yet, so work cannot be submitted.'}
      </span>
      {onStartProject ? (
        <button type="button" disabled={isPending} onClick={onStartProject}>
          <FiPlay aria-hidden="true" /> {isPending ? 'Starting…' : 'Start project'}
        </button>
      ) : null}
    </p>
  )
}

export default ProjectStartNotice
