import { useRef, useState } from 'react'
import { FiAlertCircle, FiFile, FiLoader, FiSend, FiUploadCloud, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'

const SUBMISSION_KINDS = [
  { value: 'final', label: 'Final deliverable' },
  { value: 'progress', label: 'Progress update' },
  { value: 'revision', label: 'Revision' },
]

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function SubmitWorkModal({ onClose, onSubmit, milestone = null, initialTargetValue = '', mode = 'submit', revisionSourceId = null, targets = [], targetKindLabel = 'Deliverable', defaultKind = 'final', myTasks = [], initialTaskIds = [] }) {
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
  const selectableTasks = myTasks.filter((task) => {
    if (['done', 'dropped'].includes(task.status)) return false
    return isMilestoneTarget
      ? (task.milestoneId || '') === activeTargetId
      : (task.targetId || task.scopeItemId || '') === activeTargetId
  })
  const [title, setTitle] = useState(milestone ? milestone.title : (initialTarget?.label || ''))
  const [description, setDescription] = useState('')
  const [feedbackRequest, setFeedbackRequest] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isUploading = files.some((item) => item.status === 'uploading')
  const uploadedFiles = files.filter((item) => item.status === 'done')

  async function handleFiles(fileList) {
    const picked = Array.from(fileList || [])
    if (!picked.length) return
    setError('')
    const entries = picked.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: formatSize(file.size),
      status: 'uploading',
    }))
    setFiles((current) => [...current, ...entries])

    await Promise.all(entries.map(async (entry, index) => {
      try {
        const result = await uploadZumbarlFile(picked[index], { scope: 'project-deliverable' })
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

    if (selectableTasks.length && !taskIds.length) {
      setError('Pick at least one of your tasks that this submission covers.')
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
        <button type="button" className="project-modal-close" aria-label="Close submit work modal" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <header>
          <span>
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
                  : 'Upload your final work for review. Once submitted, the client will be notified.'}
            </p>
          </div>
        </header>

        {isRevision ? (
          <p className="project-submit-target">Submission type: <strong>Revision</strong></p>
        ) : (
          <label>
            What are you submitting? *
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
            Which {targetKindLabel.toLowerCase()} do you want to {isRevision ? 'revise' : 'submit'}? *
            <select
              value={targetValue}
              onChange={(event) => {
                const nextValue = event.target.value
                setTargetValue(nextValue)
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

        {selectableTasks.length ? (
          <fieldset className="project-submit-tasks">
            <legend>Which of your tasks does this cover? *</legend>
            <p>
              These move to “In review”. The business marks them done by approving
              this submission — that is what earns your share of the
              {isMilestoneTarget ? ' milestone' : ' deliverable'}.
            </p>
            {selectableTasks.map((task) => (
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
                <span>{task.title}</span>
                <em>{task.weight} {task.weight === 1 ? 'pt' : 'pts'}</em>
              </label>
            ))}
          </fieldset>
        ) : null}

        <label>
          Work Title *
          <input
            type="text"
            value={title}
            placeholder="e.g. Social Media Content - Week 1"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Description (optional)
          <textarea
            value={description}
            placeholder="Briefly describe what you are submitting and how it meets the brief."
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

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
          <FiUploadCloud aria-hidden="true" />
          <strong>Drag &amp; drop files here or click to browse</strong>
          <span>You can upload up to 10 files (max 200MB each)</span>
          <small>Allowed formats: JPG, PNG, MP4, PDF, ZIP, DOCX</small>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />

        {files.length ? (
          <div className="project-submitted-file-list">
            {files.map((file) => (
              <p key={file.id} className={file.status === 'error' ? 'is-error' : file.status === 'uploading' ? 'is-uploading' : ''}>
                <span>
                  {file.status === 'uploading' ? <FiLoader aria-hidden="true" /> : file.status === 'error' ? <FiAlertCircle aria-hidden="true" /> : <FiFile aria-hidden="true" />}
                  {file.name}
                </span>
                <em>{file.status === 'uploading' ? 'Uploading…' : file.status === 'error' ? (file.error || 'Upload failed') : file.size}</em>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file.id)}>
                  <FiX aria-hidden="true" />
                </button>
              </p>
            ))}
          </div>
        ) : null}

        <label>
          Request Feedback (optional)
          <textarea
            value={feedbackRequest}
            placeholder="Ask the client for specific feedback or note anything they should review."
            onChange={(event) => setFeedbackRequest(event.target.value)}
          />
        </label>

        {error ? <p className="project-submit-error" role="alert">{error}</p> : null}

        <footer>
          <p>By submitting, you confirm that this work is original and you own the rights to it.</p>
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
