import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiEdit2, FiSave, FiSend, FiX } from 'react-icons/fi'

function numberValue(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function getTotalBudget(milestones = []) {
  return milestones.reduce((total, milestone) => total + numberValue(milestone.budget), 0)
}

function getTotalPercent(milestones = []) {
  return milestones.reduce((total, milestone) => total + numberValue(milestone.paymentPercent), 0)
}

function EditButton({ onClick }) {
  return (
    <button type="button" className="business-create-review-edit" onClick={onClick}>
      <FiEdit2 aria-hidden="true" />
      Edit
    </button>
  )
}

function ReviewCard({ children, onEdit, title }) {
  return (
    <section className="business-create-review-card">
      <header>
        <h3>{title}</h3>
        <EditButton onClick={onEdit} />
      </header>
      {children}
    </section>
  )
}

function formatRequiredAttachments(requiredAttachments = []) {
  if (!requiredAttachments.length) return 'No required attachments'

  return requiredAttachments
    .filter((attachment) => attachment.label || attachment.fileType)
    .map((attachment) => `${attachment.label || 'Attachment'} (${attachment.fileType || 'Any accepted file'})`)
    .join(', ')
}

function formatFileSize(size = 0) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

function formatSampleWork(sampleWork = []) {
  const visibleSamples = Array.isArray(sampleWork)
    ? sampleWork.filter((sample) => sample.label || sample.files?.length)
    : []

  if (!visibleSamples.length) return 'No sample work attached'

  return visibleSamples.map((sample) => {
    const fileList = sample.files?.length
      ? ` · ${sample.files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(', ')}`
      : ''
    return `${sample.label || 'Sample work'}${fileList}`
  }).join('; ')
}

export function BusinessOpportunityBriefReviewStep({
  clarityChecks = [],
  form,
  isPublishReady = false,
  onBack,
  onCancel,
  onPublish,
  onSaveDraft,
  onStepChange,
}) {
  const firstMissingDetail = clarityChecks.find((check) => !check.complete)
  const scopeItems = form.scopeMode === 'milestone' ? form.milestoneScopes : form.deliverableMilestones
  const scopeLabel = form.scopeMode === 'milestone' ? 'Milestone' : 'Deliverable'

  return (
    <>
      <ReviewCard title="Opportunity Overview" onEdit={() => onStepChange(1)}>
        <dl className="business-create-review-list">
          <div><dt>Title</dt><dd>{form.title}</dd></div>
          <div><dt>Category</dt><dd>{form.category}</dd></div>
          <div><dt>Type</dt><dd>{form.opportunityType}</dd></div>
          <div><dt>Description</dt><dd>{form.summary}</dd></div>
          <div>
            <dt>Opportunity Splash</dt>
            <dd>
              {form.opportunitySplash?.name || 'No splash uploaded'}
            </dd>
          </div>
        </dl>
      </ReviewCard>

      <ReviewCard title="Requirements" onEdit={() => onStepChange(2)}>
        <dl className="business-create-review-list">
          <div><dt>Skills</dt><dd>{form.skills}</dd></div>
          <div><dt>Experience Level</dt><dd>{form.experienceLevel}</dd></div>
          <div><dt>Portfolio</dt><dd>{form.portfolioRequired}</dd></div>
          <div><dt>Screening Focus</dt><dd>{form.screeningFocus}</dd></div>
          <div><dt>Required Attachments</dt><dd>{formatRequiredAttachments(form.requiredAttachments)}</dd></div>
        </dl>
      </ReviewCard>

      <ReviewCard title="Scope & Budget" onEdit={() => onStepChange(3)}>
        {scopeItems?.length ? (
          <>
            <div className="business-create-review-milestone-summary">
              <span><strong>{scopeLabel} Scope</strong>Scope mode</span>
              <span><strong>KES {getTotalBudget(scopeItems).toLocaleString('en-US')}</strong>Total budget</span>
              <span><strong>{getTotalPercent(scopeItems)}%</strong>Payment split</span>
            </div>
            <div className="business-create-review-milestones">
              {scopeItems.map((milestone, index) => (
                <article key={milestone.id}>
                  <header>
                    <span>{scopeLabel} {index + 1}</span>
                    <strong>{milestone.title || milestone.type}</strong>
                    <b>KES {Number(numberValue(milestone.budget)).toLocaleString('en-US')} · {milestone.paymentPercent}%</b>
                  </header>
                  <p>{milestone.description}</p>
                  <dl>
                    <div><dt>{form.scopeMode === 'milestone' ? 'Accepted Methods' : 'Workflow'}</dt><dd>{form.scopeMode === 'milestone' ? 'All documented submission methods' : milestone.workflow || milestone.type}</dd></div>
                    <div><dt>Submission</dt><dd>{milestone.submissionMethod}</dd></div>
                    <div><dt>Verification</dt><dd>{milestone.verificationMethod}</dd></div>
                    <div><dt>Evidence</dt><dd>{milestone.evidenceRequired}</dd></div>
                    <div><dt>Acceptance</dt><dd>{milestone.acceptanceCriteria}</dd></div>
                    <div><dt>Sample Work</dt><dd>{formatSampleWork(milestone.sampleWork)}</dd></div>
                    <div><dt>Release</dt><dd>{milestone.paymentRelease}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <dl className="business-create-review-list">
            <div><dt>Deliverables</dt><dd>{form.deliverables}</dd></div>
            <div><dt>Acceptance Criteria</dt><dd>{form.acceptanceCriteria}</dd></div>
            <div><dt>Budget</dt><dd>KES {form.budget}</dd></div>
          </dl>
        )}
        <dl className="business-create-review-list">
          <div><dt>Duration</dt><dd>{form.duration}</dd></div>
          <div><dt>Engagement</dt><dd>{form.engagementMode}</dd></div>
          <div><dt>Deadline</dt><dd>{form.applicationDeadline || 'Rolling'}</dd></div>
        </dl>
      </ReviewCard>

      <ReviewCard
        title="Publish Readiness"
        onEdit={() => onStepChange(firstMissingDetail?.step || 1)}
      >
        <ul className="business-create-readiness-list">
          {clarityChecks.map((check) => {
            const content = (
              <>
                {check.complete ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
                <span>{check.label}</span>
              </>
            )

            return (
              <li key={check.id} className={check.complete ? 'is-complete' : 'is-missing'}>
                {check.complete ? content : (
                  <button type="button" onClick={() => onStepChange(check.step)}>
                    {content}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {!isPublishReady ? (
          <p className="business-create-readiness-note">
            Complete the missing details before continuing to payment. You can still save this opportunity as a draft.
          </p>
        ) : null}
      </ReviewCard>

      <div className="business-create-review-actions">
        <button type="button" className="business-profile-ghost-btn" onClick={onCancel}>
          <FiX aria-hidden="true" />
          Cancel
        </button>
        <button type="button" className="business-profile-ghost-btn" onClick={onBack}>
          <FiArrowLeft aria-hidden="true" />
          Back
        </button>
        <button type="button" className="business-profile-ghost-btn" onClick={onSaveDraft}>
          <FiSave aria-hidden="true" />
          Save as Draft
        </button>
        <button
          type="button"
          className="business-profile-primary-btn"
          disabled={!isPublishReady}
          onClick={onPublish}
        >
          Continue to Payment
          <FiSend aria-hidden="true" />
        </button>
      </div>
    </>
  )
}
