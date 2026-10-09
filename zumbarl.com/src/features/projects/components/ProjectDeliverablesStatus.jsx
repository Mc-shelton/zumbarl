function ProjectDeliverablesStatus({ project, onSubmit, onSelectPhase, variant = 'card' }) {
  const targets = Array.isArray(project?.submissionTargets) ? project.submissionTargets : []
  if (!targets.length) return null

  const targetKindLabel = project.targetKindLabel || 'Deliverable'
  const awaitingReleaseCount = targets.filter((item) => item.approved && !item.completed).length
  const pendingCount = targets.filter((item) => !item.approved && item.pending).length
  const className = variant === 'inline'
    ? 'project-deliverables-status is-inline'
    : 'project-card project-deliverables-status'

  return (
    <section className={className}>
      <header>
        <h2>{targetKindLabel}s</h2>
        <span>
          {awaitingReleaseCount
            ? `${awaitingReleaseCount} awaiting payment`
            : pendingCount ? `${pendingCount} pending` : 'All submitted'}
        </span>
      </header>
      <ul>
        {targets.map((target) => {
          const tone = target.approved
            ? 'is-approved'
            : target.submissionStatus === 'submitted'
              ? 'is-review'
              : target.submissionStatus === 'changes_requested'
                ? 'is-changes'
                : 'is-pending'
          const actionMode = target.canSubmit ? 'submit' : target.canRevise ? 'revise' : null
          const canNavigate = onSelectPhase && !target.disabled && actionMode
          return (
            <li
              key={target.value}
              className={`${tone}${canNavigate ? ' is-clickable' : ''}`}
              role={canNavigate ? 'button' : undefined}
              tabIndex={canNavigate ? 0 : undefined}
              onClick={canNavigate ? () => onSelectPhase(target.value, actionMode) : undefined}
              onKeyDown={canNavigate ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectPhase(target.value, actionMode)
                }
              } : undefined}
            >
              <div>
                <strong>{target.label}</strong>
                {target.budgetLabel ? <span>{target.budgetLabel}</span> : null}
              </div>
              <em>
                {target.completed
                  ? 'Completed & paid'
                  : target.approved ? 'Approved · awaiting payment' : target.statusLabel}
              </em>
              {actionMode && onSubmit ? (
                <button
                  type="button"
                  className="project-soft-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (onSelectPhase) onSelectPhase(target.value, actionMode)
                    else onSubmit(null, actionMode)
                  }}
                >
                  {actionMode === 'revise' ? 'Revise Work' : target.approved ? 'Submit more work' : 'Submit'}
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ProjectDeliverablesStatus
