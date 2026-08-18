import { useState } from 'react'
import {
  FiCalendar,
  FiDownload,
  FiFileText,
  FiSearch,
  FiUploadCloud,
} from 'react-icons/fi'
import { TabNav } from '../../../components/ui'
import DeliverableRoom from './DeliverableRoom'
import ProjectConversationPanel from '../../messages/components/ProjectConversationPanel'
import SubmittedWorkPreview from './SubmittedWorkPreview'

// Mirrors the business panel's sections so both sides of a project have the
// same shell: scope, submissions, files and the shared conversation.
const WORK_SECTIONS = [
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'submitted-work', label: 'Submitted Work' },
  { id: 'files', label: 'Files' },
  { id: 'messages', label: 'Messages' },
]

function getWorkSections(kindPlural) {
  return WORK_SECTIONS.map((section) => (
    section.id === 'deliverables' ? { ...section, label: kindPlural } : section
  ))
}

const STATUS_META = {
  approved: { label: 'Approved', tone: 'is-approved' },
  changes_requested: { label: 'Changes requested', tone: 'is-changes' },
  submitted: { label: 'Under review', tone: 'is-review' },
}

function getSubmissionStatus(status) {
  return STATUS_META[status] || { label: 'Not submitted', tone: 'is-pending' }
}

function getSubmissionTargetId(submission) {
  return submission.milestoneId || submission.scopeItemId || 'whole-project'
}

function buildDeliverableRows(project, submissions, targets) {
  const scopeItems = Array.isArray(project?.scopeDeliverables) ? project.scopeDeliverables : []
  const consumedScopeIds = new Set()
  const sourceTargets = targets.length ? targets : scopeItems.map((scope) => ({
    kind: scope.kind,
    label: scope.title,
    value: scope.id,
  }))

  const rows = sourceTargets.map((target, index) => {
    const scope = scopeItems.find((item) => item.id === target.value)
      || scopeItems.find((item) => item.title === target.label)
    if (scope) consumedScopeIds.add(scope.id)
    const rowSubmissions = submissions.filter((submission) => getSubmissionTargetId(submission) === target.value)
    const latestSubmission = rowSubmissions[0]
    const statusKey = target.submissionStatus || latestSubmission?.status || ''
    const status = getSubmissionStatus(statusKey)
    const kind = target.kind || scope?.kind || 'deliverable'
    const actionMode = target.canSubmit ? 'submit' : target.canRevise ? 'revise' : null

    return {
      id: target.value,
      index: index + 1,
      title: target.label || scope?.title || `Deliverable ${index + 1}`,
      type: kind === 'milestone' ? 'Milestone' : 'Deliverable',
      kind,
      description: scope?.description || scope?.requirement || 'Defined in the opportunity brief.',
      budgetLabel: target.budgetLabel || scope?.budgetLabel || scope?.paymentLabel || '',
      budgetAmount: Number(target.budgetAmount ?? scope?.budgetAmount ?? 0) || 0,
      deadline: project?.deadline || 'Flexible',
      submissionCount: rowSubmissions.length,
      statusKey,
      statusLabel: target.statusLabel || status.label,
      statusTone: status.tone,
      actionMode: target.disabled ? null : actionMode,
    }
  })

  scopeItems.forEach((scope) => {
    if (consumedScopeIds.has(scope.id)) return
    const rowSubmissions = submissions.filter((submission) => getSubmissionTargetId(submission) === scope.id)
    const latestSubmission = rowSubmissions[0]
    const status = getSubmissionStatus(latestSubmission?.status)
    const actionMode = !latestSubmission
      ? 'submit'
      : ['submitted', 'changes_requested'].includes(latestSubmission.status) ? 'revise' : null
    rows.push({
      id: scope.id,
      index: rows.length + 1,
      title: scope.title,
      type: scope.kind === 'milestone' ? 'Milestone' : 'Deliverable',
      kind: scope.kind,
      description: scope.description || scope.requirement || 'Defined in the opportunity brief.',
      budgetLabel: scope.budgetLabel || scope.paymentLabel || '',
      budgetAmount: Number(scope.budgetAmount ?? 0) || 0,
      deadline: project?.deadline || 'Flexible',
      submissionCount: rowSubmissions.length,
      statusKey: latestSubmission?.status || '',
      statusLabel: status.label,
      statusTone: status.tone,
      actionMode,
    })
  })

  if (!rows.length) {
    const wholeProjectSubmissions = submissions.filter((submission) => getSubmissionTargetId(submission) === 'whole-project')
    const latestSubmission = wholeProjectSubmissions[0]
    const status = getSubmissionStatus(latestSubmission?.status)
    const actionMode = !latestSubmission
      ? 'submit'
      : latestSubmission.status === 'changes_requested' ? 'revise' : null
    rows.push({
      id: 'whole-project',
      index: 1,
      title: 'Final project delivery',
      type: 'Whole project',
      kind: 'project',
      description: project?.overview || 'Submit the completed project for business review.',
      budgetLabel: project?.agreedAmountLabel || project?.budget || '',
      deadline: project?.deadline || 'Flexible',
      submissionCount: wholeProjectSubmissions.length,
      statusKey: latestSubmission?.status || '',
      statusLabel: status.label,
      statusTone: status.tone,
      actionMode,
    })
  }

  return rows
}

function WorkDeliverablesPanel({
  deliverableTasks,
  // Milestone briefs replace the deliverable table with the milestone planning
  // surface, keeping Submitted Work and Files exactly where they already are.
  isMilestoneScope = false,
  milestoneContent = null,
  onSelectPhase,
  onSubmitTask,
  onSubmitWork,
  project,
}) {
  const [activeSection, setActiveSection] = useState('deliverables')
  const [openDeliverableId, setOpenDeliverableId] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  // A deliverable-based team divides its work inside the deliverable. Solo and
  // milestone-based projects keep the plain table.
  const usesDeliverableRooms = Boolean(project?.isTeamProject) && !project?.hasMilestones
  const submissions = Array.isArray(project?.deliverables) ? project.deliverables : []
  const targets = Array.isArray(project?.submissionTargets) ? project.submissionTargets : []
  const files = Array.isArray(project?.workFiles) ? project.workFiles : []
  const deliverableRows = buildDeliverableRows(project, submissions, targets)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleRows = deliverableRows.filter((row) => (
    (!normalizedQuery || `${row.title} ${row.description} ${row.type}`.toLowerCase().includes(normalizedQuery))
    && (statusFilter === 'all' || row.statusKey === statusFilter)
    && (typeFilter === 'all' || row.kind === typeFilter)
  ))
  const sectionCounts = {
    deliverables: deliverableRows.length,
    'submitted-work': submissions.length,
    files: files.length,
  }
  const canSubmitWork = Boolean(onSubmitWork || onSelectPhase || onSubmitTask)

  function handleRowAction(row) {
    if (usesDeliverableRooms && row.id !== 'whole-project') {
      setOpenDeliverableId(row.id)
      return
    }
    if (row.actionMode && canSubmitWork) {
      if (row.id === 'whole-project') onSubmitWork?.(null, row.actionMode)
      else if (onSelectPhase) onSelectPhase(row.id, row.actionMode)
      else onSubmitWork?.(null, row.actionMode)
      return
    }
    setActiveSection('submitted-work')
  }

  const openDeliverable = openDeliverableId
    ? deliverableRows.find((row) => row.id === openDeliverableId)
    : null

  if (openDeliverable) {
    const scopeKey = openDeliverable.id
    return (
      <section className="project-card project-work-deliverables-card">
        <DeliverableRoom
          canEdit={deliverableTasks.canEdit}
          isLoading={deliverableTasks.isLoading}
          onRetry={deliverableTasks.refresh}
          deliverable={openDeliverable}
          error={deliverableTasks.error}
          isPending={Boolean(deliverableTasks.pendingTaskId)}
          dependencies={deliverableTasks.dependencies}
          notes={deliverableTasks.notesByScopeItem.get(scopeKey) || []}
          splitLock={deliverableTasks.splitLockByScopeItem.get(scopeKey)}
          tasks={deliverableTasks.tasksByScopeItem.get(scopeKey) || []}
          viewerStudentId={deliverableTasks.viewerStudentId}
          onAddNote={(payload) => deliverableTasks.onAddNote({ ...payload, scopeItemId: scopeKey })}
          onConfirmSplit={() => deliverableTasks.onConfirmSplit(scopeKey)}
          onCreateDependency={(payload) => deliverableTasks.onCreateDependency({ ...payload, scopeItemId: scopeKey })}
          onResolveDependency={deliverableTasks.onResolveDependency}
          onSetTaskBlockers={deliverableTasks.onSetTaskBlockers}
          onClaimTask={(task) => deliverableTasks.onClaimTask(task.id, deliverableTasks.viewerStudentId)}
          onClose={() => setOpenDeliverableId('')}
          onSubmitTask={onSubmitTask}
          submitBlockedReason={project?.lifecycleStatus === 'awarded'
            ? 'The business has not started this project yet.'
            : ''}
          onDeclareTask={({ claimNow, ...payload }) => deliverableTasks.onDeclareTask({
            ...payload,
            scopeItemId: scopeKey,
            ownerId: claimNow ? deliverableTasks.viewerStudentId : null,
          })}
          onDropTask={(task) => deliverableTasks.onDropTask(task.id, 'Handed back to the team')}
          onReleaseTask={(task) => deliverableTasks.onReleaseTask(task.id)}
        />
      </section>
    )
  }

  // A milestone brief's targets are milestones, so the panel says so rather than
  // calling everything a deliverable.
  const kindLabel = project?.targetKindLabel || 'Deliverable'
  const kindPlural = `${kindLabel}s`
  const heading = activeSection === 'messages'
    ? 'Messages'
    : activeSection === 'submitted-work'
      ? 'Submitted Work'
      : activeSection === 'files'
        ? 'Files'
        : isMilestoneScope ? 'Milestones' : `Work & ${kindPlural}`
  const caption = activeSection === 'messages'
    ? 'Coordinate with the business around evidence, revisions and approvals.'
    : activeSection === 'submitted-work'
      ? 'Review every submission attempt and the files you sent to the business.'
      : activeSection === 'files'
        ? 'Access all files submitted for this project.'
        : isMilestoneScope
          ? 'Plan the milestones, break them into deliverables and track the work against them.'
          : `Track ${kindPlural.toLowerCase()}, submission requirements, and review status.`

  return (
    <section className="project-card project-work-deliverables-card">
      <header>
        <div>
          <h2>{heading}</h2>
          <p>{caption}</p>
        </div>
        {activeSection === 'deliverables' && !isMilestoneScope && project?.canSubmitWork !== false && onSubmitWork ? (
          <button type="button" className="project-primary-btn" onClick={() => onSubmitWork?.(null, project?.workActionMode)}>
            <FiUploadCloud aria-hidden="true" />
            {project?.workActionLabel || 'Submit Work'}
          </button>
        ) : null}
      </header>

      <TabNav
        activeId={activeSection}
        ariaLabel="Work and deliverable sections"
        className="project-work-deliverables-tabs"
        items={getWorkSections(isMilestoneScope ? 'Milestones' : kindPlural)}
        onChange={setActiveSection}
        renderTab={(section) => (
          <>
            {section.label}
            {sectionCounts[section.id] ? <span>{sectionCounts[section.id]}</span> : null}
          </>
        )}
      />

      {activeSection === 'messages' ? (
        <ProjectConversationPanel opportunity={{ backendId: project?.opportunityId }} />
      ) : activeSection === 'submitted-work' ? (
        submissions.length ? (
          <SubmittedWorkPreview embedded submissions={submissions} />
        ) : (
          <div className="project-work-deliverables-empty">
            <FiUploadCloud aria-hidden="true" />
            <strong>No work submitted yet</strong>
            <p>Your submission history will appear here.</p>
          </div>
        )
      ) : activeSection === 'files' ? (
        files.length ? (
          <div className="project-work-files-table">
            <div className="project-work-files-row is-head">
              <span>Name</span>
              <span>Type</span>
              <span>Source</span>
              <span>Submitted</span>
              <span>Size</span>
              <span>Action</span>
            </div>
            {files.map((file) => (
              <div className="project-work-files-row" key={file.id}>
                <span><FiFileText aria-hidden="true" /><strong>{file.name}</strong></span>
                <span>{file.type}</span>
                <span>{file.source}</span>
                <span>{file.updated}</span>
                <span>{file.size}</span>
                {file.url ? (
                  <a href={file.url} target="_blank" rel="noreferrer" aria-label={`Download ${file.name}`}>
                    <FiDownload aria-hidden="true" />
                  </a>
                ) : <span>—</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="project-work-deliverables-empty">
            <FiFileText aria-hidden="true" />
            <strong>No submitted files yet</strong>
            <p>Files attached to submitted work will appear here.</p>
          </div>
        )
      ) : isMilestoneScope ? (
        milestoneContent
      ) : (
        <>
          <div className="project-work-deliverable-toolbar">
            <label>
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder={`Search ${kindPlural.toLowerCase()}...`}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select value={statusFilter} aria-label={`Filter ${kindPlural.toLowerCase()} by status`} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Status: All</option>
              <option value="">Not submitted</option>
              <option value="submitted">Under review</option>
              <option value="changes_requested">Changes requested</option>
              <option value="approved">Approved</option>
            </select>
            <select value={typeFilter} aria-label={`Filter ${kindPlural.toLowerCase()} by type`} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Type: All</option>
              <option value="deliverable">Deliverable</option>
              <option value="milestone">Milestone</option>
              <option value="project">Whole project</option>
            </select>
          </div>

          <div className="project-work-deliverable-table">
            <div className="project-work-deliverable-row is-head">
              <span>#</span>
              <span>{kindLabel}</span>
              <span>Type</span>
              <span>Description</span>
              <span>Due Date</span>
              <span>Submissions</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {visibleRows.map((row) => (
              <article className="project-work-deliverable-row" key={row.id}>
                <span className="project-work-deliverable-order">{row.index}</span>
                <div className="project-work-deliverable-title">
                  <span><FiFileText aria-hidden="true" /></span>
                  <div>
                    <strong>{row.title}</strong>
                    {row.budgetLabel ? <em>{row.budgetLabel}</em> : null}
                  </div>
                </div>
                <strong>{row.type}</strong>
                <p>{row.description}</p>
                <time>
                  <span><FiCalendar aria-hidden="true" /> {row.deadline}</span>
                  <em>{row.deadline === 'Flexible' ? 'No fixed due date' : 'Project deadline'}</em>
                </time>
                <strong className="project-work-deliverable-submissions">{row.submissionCount}</strong>
                <span className={`project-work-deliverable-status ${row.statusTone}`}>{row.statusLabel}</span>
                <div className="project-work-deliverable-actions">
                  <button type="button" onClick={() => handleRowAction(row)}>
                    {usesDeliverableRooms && row.id !== 'whole-project'
                      ? 'Open'
                      : canSubmitWork && row.actionMode === 'revise'
                        ? 'Revise Work'
                        : canSubmitWork && row.actionMode === 'submit' ? 'Submit' : 'View'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <footer className="project-work-deliverable-footer">
            Showing {visibleRows.length} of {deliverableRows.length} {kindPlural.toLowerCase()}
          </footer>
        </>
      )}
    </section>
  )
}

export default WorkDeliverablesPanel
