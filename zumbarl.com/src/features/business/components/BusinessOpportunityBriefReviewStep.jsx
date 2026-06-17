import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiEdit2, FiSave, FiSend } from 'react-icons/fi'

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

export function BusinessOpportunityBriefReviewStep({
  clarityChecks = [],
  form,
  isPublishReady = false,
  onBack,
  onPublish,
  onSaveDraft,
  onStepChange,
}) {
  const firstMissingDetail = clarityChecks.find((check) => !check.complete)

  return (
    <>
      <ReviewCard title="Opportunity Overview" onEdit={() => onStepChange(1)}>
        <dl className="business-create-review-list">
          <div><dt>Title</dt><dd>{form.title}</dd></div>
          <div><dt>Category</dt><dd>{form.category}</dd></div>
          <div><dt>Type</dt><dd>{form.opportunityType}</dd></div>
          <div><dt>Description</dt><dd>{form.summary}</dd></div>
          <div><dt>Company</dt><dd>{form.companyName}</dd></div>
        </dl>
      </ReviewCard>

      <ReviewCard title="Requirements" onEdit={() => onStepChange(2)}>
        <dl className="business-create-review-list">
          <div><dt>Skills</dt><dd>{form.skills}</dd></div>
          <div><dt>Experience Level</dt><dd>{form.experienceLevel}</dd></div>
          <div><dt>Portfolio</dt><dd>{form.portfolioRequired}</dd></div>
          <div><dt>Screening Focus</dt><dd>{form.screeningFocus}</dd></div>
          <div><dt>Bidder Instructions</dt><dd>{form.bidderInstructions}</dd></div>
        </dl>
      </ReviewCard>

      <ReviewCard title="Scope & Budget" onEdit={() => onStepChange(3)}>
        <dl className="business-create-review-list">
          <div><dt>Deliverables</dt><dd>{form.deliverables}</dd></div>
          <div><dt>Acceptance Criteria</dt><dd>{form.acceptanceCriteria}</dd></div>
          <div><dt>Budget</dt><dd>KES {form.budget}</dd></div>
          <div><dt>Duration</dt><dd>{form.duration}</dd></div>
          <div><dt>Engagement</dt><dd>{form.engagementMode}</dd></div>
          <div><dt>Deadline</dt><dd>{form.applicationDeadline}</dd></div>
        </dl>
      </ReviewCard>

      <ReviewCard
        title="Publish Readiness"
        onEdit={() => onStepChange(firstMissingDetail?.step || 1)}
      >
        <ul className="business-create-readiness-list">
          {clarityChecks.map((check) => (
            <li key={check.id} className={check.complete ? 'is-complete' : 'is-missing'}>
              {check.complete ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
        {!isPublishReady ? (
          <p className="business-create-readiness-note">
            Complete the missing details before publishing. You can still save this opportunity as a draft.
          </p>
        ) : null}
      </ReviewCard>

      <div className="business-create-review-actions">
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
          Publish Opportunity
          <FiSend aria-hidden="true" />
        </button>
      </div>
    </>
  )
}
