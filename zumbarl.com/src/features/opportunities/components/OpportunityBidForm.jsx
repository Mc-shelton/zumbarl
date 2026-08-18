import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiEdit3,
  FiFileText,
  FiHelpCircle,
  FiPaperclip,
  FiSave,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi'

const APPLICATION_STEP_DEFINITIONS = {
  proposal: { id: 'proposal', label: 'Proposal', Icon: FiEdit3 },
  questions: { id: 'questions', label: 'Questions', Icon: FiHelpCircle },
  attachments: { id: 'attachments', label: 'Attachments', Icon: FiPaperclip },
  review: { id: 'review', label: 'Review', Icon: FiCheck },
}

const INITIAL_PROPOSAL = {
  currency: 'KES',
  deliveryTime: '',
  estimatedUnits: '',
  message: '',
  price: '',
  pricingType: 'fixed',
  proposal: '',
}

const PRICING_UNIT_LABELS = {
  'per hour': { unit: 'hours', logNote: 'Hours are tracked with the project time log once work starts.' },
  'per day': { unit: 'days', logNote: 'Days are tracked with the project time log once work starts.' },
  'per month': { unit: 'months', logNote: 'Monthly progress is tracked in the project workspace once work starts.' },
}

function getEstimatedBidTotal(proposal) {
  const rate = Number(proposal.price) || 0
  const units = Number(proposal.estimatedUnits) || 0
  return rate * units
}

function OpportunityBidForm({
  draftError,
  draftNotice,
  initialDraft,
  isSavingDraft,
  isSubmitting,
  onApplicationStateChange,
  onCancel,
  onMarkDirty,
  onSaveDraft,
  onSubmitProposal,
  selectedGig,
  submitError,
}) {
  // Team (project) opportunities pay from one shared budget split by how much
  // work each student submits, so students do not name a price. Only single-hire
  // tasks let the student bid an amount.
  const isTeamOpportunity = String(selectedGig?.type || '').toLowerCase() !== 'task'
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [proposal, setProposal] = useState(INITIAL_PROPOSAL)
  const [questionAnswers, setQuestionAnswers] = useState({})
  const [attachments, setAttachments] = useState({})
  const [stepError, setStepError] = useState('')
  const hydratedDraftIdRef = useRef(null)
  const questions = useMemo(
    () => (Array.isArray(selectedGig.qualificationQuestions) ? selectedGig.qualificationQuestions : []),
    [selectedGig.qualificationQuestions],
  )
  const attachmentRequirements = useMemo(
    () => (Array.isArray(selectedGig.requiredAttachments) ? selectedGig.requiredAttachments : []),
    [selectedGig.requiredAttachments],
  )
  const applicationSteps = useMemo(() => [
    APPLICATION_STEP_DEFINITIONS.proposal,
    ...(questions.length ? [APPLICATION_STEP_DEFINITIONS.questions] : []),
    ...(attachmentRequirements.length ? [APPLICATION_STEP_DEFINITIONS.attachments] : []),
    APPLICATION_STEP_DEFINITIONS.review,
  ], [attachmentRequirements.length, questions.length])
  const activeStep = applicationSteps[activeStepIndex] || applicationSteps[applicationSteps.length - 1]

  useEffect(() => {
    if (!initialDraft?.id || hydratedDraftIdRef.current === initialDraft.id) return
    const metadata = initialDraft.metadata && typeof initialDraft.metadata === 'object'
      ? initialDraft.metadata
      : {}
    setProposal({
      ...INITIAL_PROPOSAL,
      currency: initialDraft.currency || 'KES',
      deliveryTime: initialDraft.deliveryTime || '',
      estimatedUnits: metadata.estimatedUnits ? String(metadata.estimatedUnits) : '',
      message: initialDraft.coverNote || '',
      price: initialDraft.bidAmount == null ? '' : String(initialDraft.bidAmount),
      pricingType: metadata.pricingType || 'fixed',
      proposal: initialDraft.proposal || '',
    })
    setQuestionAnswers(Object.fromEntries(
      (Array.isArray(initialDraft.questionAnswers) ? initialDraft.questionAnswers : [])
        .map((answer) => [answer.question, answer.answer]),
    ))
    setAttachments(Object.fromEntries(
      (Array.isArray(initialDraft.attachments) ? initialDraft.attachments : [])
        // Keep any already-uploaded attachment on resume: it is identified by
        // uploadId, so a missing/relative url must not drop it.
        .filter((attachment) => attachment.requirementId && (attachment.url || attachment.uploadId))
        .map((attachment) => [attachment.requirementId, attachment]),
    ))
    setActiveStepIndex(Math.min(
      applicationSteps.length - 1,
      Math.max(0, Number(metadata.applicationStepIndex) || 0),
    ))
    hydratedDraftIdRef.current = initialDraft.id
  }, [applicationSteps.length, initialDraft])

  const buildApplicationState = useCallback((stepIndex = activeStepIndex) => {
    return {
      ...proposal,
      applicationStepIndex: stepIndex,
      attachments: attachmentRequirements
        .map((requirement) => {
          const value = attachments[requirement.id]
          if (!value) return null
          return {
            requirementId: requirement.id,
            label: requirement.label,
            fileType: requirement.fileType,
            ...(value instanceof File
              ? { file: value }
              : typeof value === 'string'
                ? { url: value.trim() }
                : value),
          }
        })
        .filter(Boolean),
      questionAnswers: questions.map((question) => ({
        question,
        answer: String(questionAnswers[question] || '').trim(),
      })),
    }
  }, [activeStepIndex, attachmentRequirements, attachments, proposal, questionAnswers, questions])

  useEffect(() => {
    onApplicationStateChange?.(buildApplicationState())
  }, [buildApplicationState, onApplicationStateChange])

  function updateProposal(field, value) {
    setProposal((current) => ({ ...current, [field]: value }))
    setStepError('')
    onMarkDirty?.()
  }

  function getStepValidationError(stepId) {
    if (stepId === 'proposal') {
      if (proposal.proposal.trim().length < 10) return 'Write a proposal of at least 10 characters.'
      if (!isTeamOpportunity) {
        if (!proposal.price.trim()) return 'Enter your proposed price.'
        if (proposal.pricingType !== 'fixed' && !(Number(proposal.estimatedUnits) > 0)) {
          return `Estimate how many ${PRICING_UNIT_LABELS[proposal.pricingType]?.unit || 'units'} the work will take.`
        }
        if (!proposal.deliveryTime) return 'Select a delivery time.'
      }
    }

    if (stepId === 'questions') {
      const unansweredQuestion = questions.find((question) => !String(questionAnswers[question] || '').trim())
      if (unansweredQuestion) return 'Answer every application question before continuing.'
    }

    if (stepId === 'attachments') {
      const missingAttachment = attachmentRequirements
        .filter((requirement) => requirement.required !== false)
        .find((requirement) => !attachments[requirement.id])
      if (missingAttachment) return `Add the required attachment: ${missingAttachment.label}.`
    }

    return ''
  }

  async function goToNextStep() {
    const validationError = getStepValidationError(activeStep.id)
    if (validationError) {
      setStepError(validationError)
      return
    }

    setStepError('')
    const nextStepIndex = Math.min(applicationSteps.length - 1, activeStepIndex + 1)
    const savedDraft = await onSaveDraft?.(buildApplicationState(nextStepIndex), { silent: true })
    if (onSaveDraft && !savedDraft) return
    setActiveStepIndex(nextStepIndex)
  }

  function goToPreviousStep() {
    setStepError('')
    setActiveStepIndex((current) => Math.max(0, current - 1))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const firstInvalidStep = applicationSteps
      .slice(0, -1)
      .findIndex((step) => getStepValidationError(step.id))

    if (firstInvalidStep !== -1) {
      setActiveStepIndex(firstInvalidStep)
      setStepError(getStepValidationError(applicationSteps[firstInvalidStep].id))
      return
    }

    await onSubmitProposal({
      ...proposal,
      attachments: attachmentRequirements
        .map((requirement) => {
          const value = attachments[requirement.id]
          if (!value) return null

          return {
            requirementId: requirement.id,
            label: requirement.label,
            fileType: requirement.fileType,
            ...(value instanceof File
              ? { file: value }
              : { url: String(value).trim() }),
          }
        })
        .filter(Boolean),
      questionAnswers: questions.map((question) => ({
        question,
        answer: String(questionAnswers[question] || '').trim(),
      })),
    })
  }

  return (
    <form className="opportunities-bid-form-card" aria-label="Submit application" onSubmit={handleSubmit}>
      <header>
        <h2>Apply for this opportunity</h2>
        <p>Complete each phase. Your answers and required documents are saved with your application.</p>
      </header>

      <ol
        className={`opportunities-application-steps has-${applicationSteps.length}-steps`}
        aria-label="Application phases"
      >
        {applicationSteps.map((step, index) => {
          const isActive = index === activeStepIndex
          const isComplete = index < activeStepIndex
          return (
            <li key={step.id} className={`${isActive ? 'is-active' : ''}${isComplete ? ' is-complete' : ''}`}>
              <span>{isComplete ? <FiCheck aria-hidden="true" /> : <step.Icon aria-hidden="true" />}</span>
              <div>
                <small>Phase {index + 1}</small>
                <strong>{step.label}</strong>
              </div>
            </li>
          )
        })}
      </ol>

      {activeStep.id === 'proposal' ? (
        <section className="opportunities-application-phase" aria-labelledby="application-proposal-title">
          <div className="opportunities-application-phase-heading">
            <span>1</span>
            <div>
              <h3 id="application-proposal-title">Your proposal</h3>
              <p>Explain your approach, price, and expected delivery time.</p>
            </div>
          </div>

          <div className="opportunities-bid-field">
            <label htmlFor="bid-proposal">Proposal <b>*</b></label>
            <p className="opportunities-bid-field-hint">
              Describe your approach, relevant experience, and why you are a strong fit.
            </p>
            <textarea
              id="bid-proposal"
              value={proposal.proposal}
              placeholder="Write your proposal here..."
              maxLength={1500}
              required
              onChange={(event) => updateProposal('proposal', event.target.value)}
            />
            <p className="opportunities-bid-counter">{proposal.proposal.length} / 1500</p>
          </div>

          {isTeamOpportunity ? (
            <div className="opportunities-bid-field">
              <label>Payment</label>
              <p className="opportunities-bid-team-pay-note">
                This is a team project paid from one shared budget. You don&apos;t set a price — each deliverable&apos;s
                budget is split equally among the students who work on it, and your share is released as the business
                approves each deliverable.
              </p>
            </div>
          ) : (
            <div className="opportunities-bid-field">
              <label htmlFor="bid-price">Your price <b>*</b></label>
              <div className="opportunities-bid-price-row">
                <select value={proposal.currency} aria-label="Currency" onChange={(event) => updateProposal('currency', event.target.value)}>
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input
                  id="bid-price"
                  value={proposal.price}
                  type="number"
                  min="0"
                  placeholder="Enter your price"
                  required
                  onChange={(event) => updateProposal('price', event.target.value)}
                />
                <select value={proposal.pricingType} aria-label="Pricing type" onChange={(event) => updateProposal('pricingType', event.target.value)}>
                  <option value="fixed">Fixed Price</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day</option>
                  <option value="per month">Per Month</option>
                </select>
              </div>
            </div>
          )}

          {!isTeamOpportunity && proposal.pricingType !== 'fixed' ? (
            <div className="opportunities-bid-field">
              <label htmlFor="bid-estimated-units">
                Estimated {PRICING_UNIT_LABELS[proposal.pricingType]?.unit || 'units'} <b>*</b>
              </label>
              <p className="opportunities-bid-field-hint">
                {PRICING_UNIT_LABELS[proposal.pricingType]?.logNote}
              </p>
              <div className="opportunities-bid-estimate-row">
                <input
                  id="bid-estimated-units"
                  value={proposal.estimatedUnits}
                  type="number"
                  min="1"
                  placeholder={`e.g. 20 ${PRICING_UNIT_LABELS[proposal.pricingType]?.unit || 'units'}`}
                  required
                  onChange={(event) => updateProposal('estimatedUnits', event.target.value)}
                />
                <p className="opportunities-bid-estimate-total">
                  Estimated total:{' '}
                  <strong>
                    {proposal.currency} {getEstimatedBidTotal(proposal).toLocaleString('en-US')}
                  </strong>
                </p>
              </div>
            </div>
          ) : null}

          {!isTeamOpportunity ? (
            <div className="opportunities-bid-field opportunities-bid-delivery-field">
              <label htmlFor="bid-delivery-time">Delivery time <b>*</b></label>
              <div className="opportunities-bid-delivery-row">
                <FiCalendar aria-hidden="true" />
                <select
                  id="bid-delivery-time"
                  value={proposal.deliveryTime}
                  required
                  onChange={(event) => updateProposal('deliveryTime', event.target.value)}
                >
                  <option value="">Select delivery time</option>
                  <option value="1 day">1 day</option>
                  <option value="2-3 days">2-3 days</option>
                  <option value="4-7 days">4-7 days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                </select>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeStep.id === 'questions' ? (
        <section className="opportunities-application-phase" aria-labelledby="application-questions-title">
          <div className="opportunities-application-phase-heading">
            <span>{activeStepIndex + 1}</span>
            <div>
              <h3 id="application-questions-title">Application questions</h3>
              <p>These answers go directly to the business reviewing your application.</p>
            </div>
          </div>
          {questions.length ? questions.map((question, index) => (
            <div key={question} className="opportunities-bid-field">
              <label htmlFor={`application-question-${index}`}>
                {index + 1}. {question} <b>*</b>
              </label>
              <textarea
                id={`application-question-${index}`}
                value={questionAnswers[question] || ''}
                maxLength={1000}
                required
                placeholder="Enter your answer..."
                onChange={(event) => {
                  setQuestionAnswers((current) => ({ ...current, [question]: event.target.value }))
                  setStepError('')
                  onMarkDirty?.()
                }}
              />
              <p className="opportunities-bid-counter">{String(questionAnswers[question] || '').length} / 1000</p>
            </div>
          )) : (
            <div className="opportunities-application-empty">
              <FiHelpCircle aria-hidden="true" />
              <strong>No additional questions</strong>
              <p>This business did not add screening questions for this opportunity.</p>
            </div>
          )}
        </section>
      ) : null}

      {activeStep.id === 'attachments' ? (
        <section className="opportunities-application-phase" aria-labelledby="application-attachments-title">
          <div className="opportunities-application-phase-heading">
            <span>{activeStepIndex + 1}</span>
            <div>
              <h3 id="application-attachments-title">Required attachments</h3>
              <p>Upload each requested document or provide the requested link.</p>
            </div>
          </div>
          {attachmentRequirements.length ? attachmentRequirements.map((requirement) => {
            const isLink = String(requirement.fileType).toLowerCase() === 'link'
            const selectedValue = attachments[requirement.id]
            return (
              <div key={requirement.id} className="opportunities-bid-field opportunities-application-attachment">
                <label htmlFor={`application-attachment-${requirement.id}`}>
                  {requirement.label} {requirement.required !== false ? <b>*</b> : <small>(Optional)</small>}
                </label>
                <p className="opportunities-bid-field-hint">Accepted format: {requirement.fileType}</p>
                {isLink ? (
                  <input
                    id={`application-attachment-${requirement.id}`}
                    type="url"
                    value={typeof selectedValue === 'string' ? selectedValue : selectedValue?.url || ''}
                    required={requirement.required !== false}
                    placeholder="https://..."
                    onChange={(event) => {
                      setAttachments((current) => ({ ...current, [requirement.id]: event.target.value }))
                      setStepError('')
                      onMarkDirty?.()
                    }}
                  />
                ) : (
                  <label className="opportunities-bid-dropzone" htmlFor={`application-attachment-${requirement.id}`}>
                    <FiUploadCloud aria-hidden="true" />
                    <strong>
                      {selectedValue instanceof File
                        ? selectedValue.name
                        : selectedValue?.fileName || 'Choose a file to upload'}
                    </strong>
                    <span>{requirement.fileType} · Maximum 10MB</span>
                    <input
                      id={`application-attachment-${requirement.id}`}
                      type="file"
                      required={requirement.required !== false}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        setAttachments((current) => ({ ...current, [requirement.id]: file || null }))
                        setStepError('')
                        onMarkDirty?.()
                      }}
                    />
                  </label>
                )}
              </div>
            )
          }) : (
            <div className="opportunities-application-empty">
              <FiPaperclip aria-hidden="true" />
              <strong>No attachments required</strong>
              <p>You can continue to review without uploading documents.</p>
            </div>
          )}
        </section>
      ) : null}

      {activeStep.id === 'review' ? (
        <section className="opportunities-application-phase" aria-labelledby="application-review-title">
          <div className="opportunities-application-phase-heading">
            <span>{activeStepIndex + 1}</span>
            <div>
              <h3 id="application-review-title">Review and submit</h3>
              <p>Confirm your information before creating the application.</p>
            </div>
          </div>
          <div className="opportunities-application-review-grid">
            <article>
              <FiEdit3 aria-hidden="true" />
              <div>
                <small>Proposal</small>
                <strong>
                  {isTeamOpportunity ? (
                    'Shared team budget (pay by work submitted)'
                  ) : (
                    <>
                      {proposal.currency} {proposal.price}
                      {proposal.pricingType !== 'fixed'
                        ? ` ${proposal.pricingType} · ~${proposal.estimatedUnits} ${PRICING_UNIT_LABELS[proposal.pricingType]?.unit || 'units'} (est. ${proposal.currency} ${getEstimatedBidTotal(proposal).toLocaleString('en-US')})`
                        : ''}
                    </>
                  )}
                  {!isTeamOpportunity && proposal.deliveryTime ? <>{' · '}{proposal.deliveryTime}</> : null}
                </strong>
                <p>{proposal.proposal}</p>
              </div>
            </article>
            <article>
              <FiHelpCircle aria-hidden="true" />
              <div>
                <small>Questions</small>
                <strong>{questions.length} answered</strong>
                <p>{questions.length ? 'All business questions are complete.' : 'No additional questions were required.'}</p>
              </div>
            </article>
            <article>
              <FiFileText aria-hidden="true" />
              <div>
                <small>Attachments</small>
                <strong>{Object.values(attachments).filter(Boolean).length} provided</strong>
                <p>{attachmentRequirements.length ? 'Required files and links are ready to upload.' : 'No attachments were required.'}</p>
              </div>
            </article>
          </div>
          <div className="opportunities-bid-field">
            <label htmlFor="bid-message">Message to the business <small>(Optional)</small></label>
            <textarea
              id="bid-message"
              value={proposal.message}
              placeholder="Add a brief final note..."
              maxLength={500}
              onChange={(event) => updateProposal('message', event.target.value)}
            />
            <p className="opportunities-bid-counter">{proposal.message.length} / 500</p>
          </div>
        </section>
      ) : null}

      {draftNotice ? <p className="opportunities-application-saved" role="status">{draftNotice}</p> : null}
      {stepError || submitError || draftError ? (
        <p className="opportunities-application-error" role="alert">{stepError || submitError || draftError}</p>
      ) : null}

      <footer className="opportunities-bid-form-foot opportunities-application-actions">
        <div className="opportunities-application-secondary-actions">
          <button type="button" className="opportunities-application-cancel-btn" disabled={isSubmitting || isSavingDraft} onClick={onCancel}>
            <FiX aria-hidden="true" />
            Cancel
          </button>
          {activeStepIndex > 0 ? (
            <button type="button" className="opportunities-application-back-btn" disabled={isSubmitting || isSavingDraft} onClick={goToPreviousStep}>
              <FiArrowLeft aria-hidden="true" />
              Back
            </button>
          ) : null}
        </div>
        <div className="opportunities-application-primary-actions">
          <button
            type="button"
            className="opportunities-application-save-btn"
            disabled={isSubmitting || isSavingDraft}
            onClick={() => onSaveDraft?.(buildApplicationState())}
          >
            <FiSave aria-hidden="true" />
            {isSavingDraft ? 'Saving...' : 'Save draft'}
          </button>
          {activeStep.id === 'review' ? (
            <button type="submit" className="opportunities-detail-bid-btn" disabled={isSubmitting || isSavingDraft}>
              {isSubmitting ? 'Uploading and submitting...' : 'Submit application'}
              <FiArrowRight aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="opportunities-detail-bid-btn" disabled={isSavingDraft} onClick={goToNextStep}>
              {isSavingDraft ? 'Saving...' : 'Save & continue'}
              <FiArrowRight aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>
    </form>
  )
}

export default OpportunityBidForm
