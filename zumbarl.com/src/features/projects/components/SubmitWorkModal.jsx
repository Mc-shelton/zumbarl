import { useRef, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiFile, FiLoader, FiSend, FiUploadCloud, FiUserPlus, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'

const SUBMISSION_KINDS = [
  { value: 'final', label: 'Final deliverable' },
  { value: 'progress', label: 'Progress update' },
  { value: 'revision', label: 'Revision' },
]

const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.mp4,.pdf,.zip,.doc,.docx'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function SubmitWorkModal({
  onClose,
  onSubmit,
  onClaimTask,
  milestone = null,
  initialTargetValue = '',
  mode = 'submit',
  revisionSourceId = null,
  targets = [],
  targetKindLabel = 'Deliverable',
  defaultKind = 'final',
  myTasks = [],
  tasks = null,
  taskCoverageEnabled = false,
  viewerStudentId = '',
  initialTaskIds = [],
}) {
  const dialogRef = useDialog({ isOpen: true, onClose })
  const inputRef = useRef(null)
  const isRevision = mode === 'revise'
  const availableTargets = targets.filter((item) => (
    !item.disabled && (isRevision ? item.canRevise : item.canSubmit)
  ))
  const firstAvailableTarget = availableTargets[0]
  // A phase clicked from the deliverables list preselects that target (as long
  // as it is submittable); otherwise fall back to the first available one.
  const preselectedTarget = initialTargetValue
    ? availableTargets.find((item) => item.value === initialTargetValue)
    : null
  const initialTarget = preselectedTarget || firstAvailableTarget
  const [kind, setKind] = useState(isRevision ? 'revision' : defaultKind)
  // When opened for a specific milestone the target is fixed; otherwise the
  // student picks which deliverable/milestone the submission is for.
  const [targetValue, setTargetValue] = useState(milestone ? milestone.id : (initialTarget?.value || ''))
  const [taskIds, setTaskIds] = useState(initialTaskIds)
  const selectedTarget = milestone ? null : availableTargets.find((item) => item.value === targetValue)
  const isMilestoneDeliverableTarget = selectedTarget?.kind === 'milestone-deliverable'
  // Only your own still-open tasks on the deliverable being submitted.
  const isMilestoneTarget = (milestone ? true : selectedTarget?.kind === 'milestone')
  const activeTargetId = milestone?.id || targetValue || ''
  const requiresTaskContribution = taskCoverageEnabled && !isRevision
  const availableTasks = Array.isArray(tasks) ? tasks : myTasks
  const targetTasks = availableTasks.filter((task) => {
    if (!['todo', 'in_progress', 'blocked'].includes(task.status)) return false
    return isMilestoneTarget
      ? (task.milestoneId || '') === activeTargetId
      : (task.targetId || task.scopeItemId || '') === activeTargetId
  })
  const selectableTasks = targetTasks.filter((task) => task.ownerId === viewerStudentId)
  const [title, setTitle] = useState(milestone ? milestone.title : (initialTarget?.label || ''))
  const [description, setDescription] = useState('')
  const [feedbackRequest, setFeedbackRequest] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimingTaskId, setClaimingTaskId] = useState('')
  const [error, setError] = useState('')

  const isUploading = files.some((item) => item.status === 'uploading')
  const uploadedFiles = files.filter((item) => item.status === 'done')

  async function handleFiles(fileList) {
    const picked = Array.from(fileList || [])
    if (!picked.length) return
    setError('')

    const remainingSlots = Math.max(0, MAX_FILES - files.length)
    if (!remainingSlots) {
      setError(`You can attach up to ${MAX_FILES} files per submission.`)
      return
    }

    const withinLimit = picked.slice(0, remainingSlots)
    const accepted = withinLimit.filter((file) => file.size > 0 && file.size <= MAX_FILE_SIZE_BYTES)
    const rejected = withinLimit.filter((file) => file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES)
    if (picked.length > remainingSlots || rejected.length) {
      const messages = []
      if (picked.length > remainingSlots) messages.push(`Only the first ${remainingSlots} remaining file${remainingSlots === 1 ? '' : 's'} were added.`)
      if (rejected.length) messages.push(`${rejected.map((file) => file.name).join(', ')} must be between 1 byte and 50 MB.`)
      setError(messages.join(' '))
    }
    if (!accepted.length) return

    const entries = accepted.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: formatSize(file.size),
      status: 'uploading',
    }))
    setFiles((current) => [...current, ...entries])

    await Promise.all(entries.map(async (entry, index) => {
      try {
        const result = await uploadZumbarlFile(accepted[index], { scope: 'project-deliverable' })
        setFiles((current) => current.map((item) => (item.id === entry.id
          ? {
            ...item,
            status: 'done',
            url: result.url,
            mimeType: result.mimeType,
            sizeBytes: result.sizeBytes,
            size: formatSize(result.sizeBytes) || item.size,
          }
          : item)))
      } catch (uploadError) {
        setFiles((current) => current.map((item) => (item.id === entry.id
          ? { ...item, status: 'error', error: uploadError instanceof Error ? uploadError.message : 'Upload failed' }
          : item)))
      }
    }))
  }

  function removeFile(id) {
    setFiles((current) => current.filter((item) => item.id !== id))
  }

  async function handleClaimTask(task) {
    if (!onClaimTask || !task?.id) return
    setClaimingTaskId(task.id)
    setError('')
    try {
      const claimed = await onClaimTask(task)
      if (claimed) setTaskIds((current) => [...new Set([...current, task.id])])
      else setError('Could not claim that task. Refresh the deliverable and try again.')
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Could not claim that task.')
    } finally {
      setClaimingTaskId('')
    }
  }

  async function handleSubmit() {
    if (title.trim().length < 3) {
      setError('Add a work title (at least 3 characters).')
      return
    }
    if (isUploading) {
      setError('Wait for the files to finish uploading.')
      return
    }
    if (!uploadedFiles.length) {
      setError('Upload at least one file before submitting.')
      return
    }
    if (!milestone && targets.length && !selectedTarget) {
      setError(`Choose the ${targetKindLabel.toLowerCase()} you want to ${isRevision ? 'revise' : 'submit'}.`)
      return
    }

    let milestoneId = milestone?.id
    let milestoneDeliverableId
    let scopeItemId
    let scopeItemLabel
    if (!milestone && selectedTarget) {
      if (selectedTarget.kind === 'milestone') {
        milestoneId = selectedTarget.value
      } else if (selectedTarget.kind === 'milestone-deliverable') {
        milestoneId = selectedTarget.milestoneId
        milestoneDeliverableId = selectedTarget.value
        scopeItemLabel = selectedTarget.label
      } else {
        scopeItemId = selectedTarget.value
        scopeItemLabel = selectedTarget.label
      }
    }

    if (requiresTaskContribution && !taskIds.some((id) => selectableTasks.some((task) => task.id === id))) {
      setError(selectableTasks.length
        ? 'Pick at least one of your tasks that this submission covers.'
        : 'Add or claim an open task for this deliverable before submitting work.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit({
        title: title.trim(),
        kind,
        taskIds: taskIds.filter((id) => selectableTasks.some((task) => task.id === id)),
        milestoneId,
        milestoneDeliverableId,
        scopeItemId,
        scopeItemLabel,
        revisionOfId: isRevision ? (selectedTarget?.latestSubmissionId || revisionSourceId || undefined) : undefined,
        notes: description.trim() || undefined,
        feedbackRequest: feedbackRequest.trim() || undefined,
        files: uploadedFiles.map((item) => ({
          fileName: item.name,
          url: item.url,
          mimeType: item.mimeType || undefined,
          sizeBytes: item.sizeBytes || undefined,
        })),
      })
      // On success the parent closes the modal (this component unmounts).
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your work.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="project-modal-backdrop" role="presentation">
      <section ref={dialogRef} className="project-submit-modal" role="dialog" aria-modal="true" aria-labelledby="submit-work-title">
        <header className="project-submit-modal-header">
          <span className="project-submit-modal-icon">
            <FiUploadCloud aria-hidden="true" />
          </span>
          <div>
            <h2 id="submit-work-title">
              {isRevision
                ? 'Revise Work'
                : isMilestoneTarget ? 'Submit Milestone' : 'Submit Work'}
            </h2>
            <p>
              {milestone
                ? `${isRevision ? 'Revise' : 'Submit'} your work for the "${milestone.title}" milestone. The client will be notified.`
                : isRevision
                  ? 'Upload a revised version. It will replace the current review copy and notify the business.'
                  : 'Package your work for review. The client will be notified when you submit.'}
            </p>
          </div>
          <button type="button" className="project-modal-close" aria-label="Close submit work modal" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="project-submit-modal-body">
          <div className="project-submit-field-grid">
            {isRevision ? (
              <p className="project-submit-target">Submission type: <strong>Revision</strong></p>
            ) : (
              <label>
                Submission type <span className="project-required-mark">Required</span>
                <select value={kind} onChange={(event) => setKind(event.target.value)}>
                  {SUBMISSION_KINDS.filter((item) => item.value !== 'revision').map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            )}

            {milestone ? (
              <p className="project-submit-target">
                Submitting for milestone: <strong>{milestone.title}</strong>
              </p>
            ) : targets.length ? (
              <label>
                {targetKindLabel} <span className="project-required-mark">Required</span>
                <select
                  value={targetValue}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setTargetValue(nextValue)
                    setTaskIds([])
                    const nextTarget = availableTargets.find((item) => item.value === nextValue)
                    if (nextTarget && (!title.trim() || title === selectedTarget?.label)) {
                      setTitle(nextTarget.label)
                    }
                  }}
                >
                  <option value="">Select {targetKindLabel.toLowerCase()}</option>
                  {availableTargets.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}{item.milestoneTitle ? ` — ${item.milestoneTitle}` : item.budgetLabel ? ` — ${item.budgetLabel}` : ''}
                    </option>
                  ))}
                </select>
                {isMilestoneDeliverableTarget && selectedTarget.milestoneTitle ? (
                  <span className="project-submit-target">
                    Connected milestone: <strong>{selectedTarget.milestoneTitle}</strong>
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>

          {taskCoverageEnabled ? (
            <fieldset className="project-submit-tasks">
              <legend>Contribution covered by this submission</legend>
              {targetTasks.length ? (
                <>
                  <p>Select the tasks this submission completes. Approval turns them into your payable share of this {isMilestoneTarget ? 'milestone' : 'deliverable'}.</p>
                  {targetTasks.map((task) => {
                    const isMine = task.ownerId === viewerStudentId
                    const isUnclaimed = !task.ownerId
                    return isMine ? (
                      <label key={task.id} className="project-submit-task">
                        <input
                          type="checkbox"
                          checked={taskIds.includes(task.id)}
                          onChange={() => setTaskIds((current) => (
                            current.includes(task.id)
                              ? current.filter((item) => item !== task.id)
                              : [...current, task.id]
                          ))}
                        />
                        <span>{task.title}<small>Assigned to you</small></span>
                        <em>{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</em>
                      </label>
                    ) : (
                      <div key={task.id} className="project-submit-task is-unavailable">
                        <span>{task.title}<small>{isUnclaimed ? 'Available to claim' : `Assigned to ${task.owner?.name || 'another contributor'}`}</small></span>
                        <em>{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</em>
                        {isUnclaimed && onClaimTask ? (
                          <button type="button" disabled={Boolean(claimingTaskId)} onClick={() => handleClaimTask(task)}>
                            <FiUserPlus aria-hidden="true" /> {claimingTaskId === task.id ? 'Claiming…' : 'Claim & include'}
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                  {!selectableTasks.length ? (
                    <p className="project-submit-task-note">
                      Claim an available task, or add a task from the deliverable workspace, before submitting work.
                    </p>
                  ) : null}
                </>
              ) : (
                requiresTaskContribution ? (
                  <p className="project-submit-task-note is-required">
                    <FiAlertCircle aria-hidden="true" />
                    <span><strong>Add a task for this contribution</strong>Add or claim an open task in the deliverable workspace, then return here to include it.</span>
                  </p>
                ) : (
                  <p className="project-submit-auto-contribution">
                    <FiCheckCircle aria-hidden="true" />
                    <span><strong>Tasks already attached</strong>This revision keeps the declared tasks from the submission it replaces.</span>
                  </p>
                )
              )}
            </fieldset>
          ) : null}

          <label>
            Work title <span className="project-required-mark">Required</span>
            <input
              type="text"
              value={title}
              placeholder="e.g. Social Media Content - Week 1"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label>
            Submission note <span className="project-optional-mark">Optional</span>
            <textarea
              value={description}
              placeholder="Briefly explain what is included and how it meets the brief."
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <section className="project-submit-attachments" aria-labelledby="project-submit-attachments-title">
            <div>
              <h3 id="project-submit-attachments-title">Attachments <span className="project-required-mark">Required</span></h3>
              <p>Add the files the client needs to review.</p>
            </div>
            <button
              type="button"
              className="project-upload-box"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                handleFiles(event.dataTransfer.files)
              }}
            >
              <span className="project-upload-box-icon"><FiUploadCloud aria-hidden="true" /></span>
              <span className="project-upload-box-copy">
                <strong>Drop files here or <u>browse</u></strong>
                <small>JPG, PNG, MP4, PDF, ZIP or DOCX · up to 10 files · 50 MB each</small>
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              hidden
              onChange={(event) => {
                handleFiles(event.target.files)
                event.target.value = ''
              }}
            />

            {files.length ? (
              <div className="project-submitted-file-list" aria-live="polite">
                {files.map((file) => (
                  <div key={file.id} className={file.status === 'error' ? 'is-error' : file.status === 'uploading' ? 'is-uploading' : 'is-done'}>
                    <span className="project-submitted-file-icon">
                      {file.status === 'uploading' ? <FiLoader aria-hidden="true" /> : file.status === 'error' ? <FiAlertCircle aria-hidden="true" /> : <FiFile aria-hidden="true" />}
                    </span>
                    <span className="project-submitted-file-copy">
                      <strong>{file.name}</strong>
                      <small>{file.status === 'uploading' ? 'Uploading…' : file.status === 'error' ? (file.error || 'Upload failed') : file.size}</small>
                    </span>
                    {file.status === 'done' ? <span className="project-submitted-file-status"><FiCheckCircle aria-hidden="true" /> Ready</span> : null}
                    <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file.id)}>
                      <FiX aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <label>
            Feedback request <span className="project-optional-mark">Optional</span>
            <textarea
              value={feedbackRequest}
              placeholder="Tell the client which parts you would especially like feedback on."
              onChange={(event) => setFeedbackRequest(event.target.value)}
            />
          </label>

          {error ? <p className="project-submit-error" role="alert"><FiAlertCircle aria-hidden="true" /> <span>{error}</span></p> : null}
        </div>

        <footer>
          <p>Submitting confirms this work is original and you have the right to share it.</p>
          <button type="button" className="project-soft-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="project-primary-btn" disabled={isSubmitting || isUploading} onClick={handleSubmit}>
            <FiSend aria-hidden="true" />
            {isSubmitting
              ? (isRevision ? 'Submitting revision…' : 'Submitting…')
              : isRevision ? 'Submit Revision' : isMilestoneTarget ? 'Submit Milestone' : 'Submit Work'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default SubmitWorkModal
