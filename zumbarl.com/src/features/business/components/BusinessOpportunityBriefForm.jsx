import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { BusinessOpportunityBriefDetailsStep } from './BusinessOpportunityBriefDetailsStep'
import { BusinessOpportunityBriefRequirementsStep } from './BusinessOpportunityBriefRequirementsStep'
import { BusinessOpportunityBriefReviewStep } from './BusinessOpportunityBriefReviewStep'
import { BusinessOpportunityBriefScopeStep } from './BusinessOpportunityBriefScopeStep'

const STEP_CONTENT = {
  details: BusinessOpportunityBriefDetailsStep,
  requirements: BusinessOpportunityBriefRequirementsStep,
  review: BusinessOpportunityBriefReviewStep,
  scope: BusinessOpportunityBriefScopeStep,
}

export function BusinessOpportunityBriefForm({
  activeStepMeta,
  clarityChecks,
  form,
  isFinalStep,
  isFirstStep,
  isPublishReady,
  isSaving,
  onBack,
  onContinue,
  onPublish,
  onSaveDraft,
  onStepChange,
  onUpdateField,
  saveError,
}) {
  const ActiveStep = STEP_CONTENT[activeStepMeta.id] || BusinessOpportunityBriefDetailsStep

  return (
    <section className="business-profile-card business-create-form-card" aria-label="Create opportunity form">
      <form className="business-create-form" onSubmit={(event) => event.preventDefault()}>
        <ActiveStep
          clarityChecks={clarityChecks}
          form={form}
          isPublishReady={isPublishReady}
          onBack={onBack}
          onPublish={onPublish}
          onSaveDraft={onSaveDraft}
          onStepChange={onStepChange}
          onUpdateField={onUpdateField}
        />
        {saveError ? (
          <p className="business-create-save-error" role="alert">{saveError}</p>
        ) : null}
        {!isFinalStep ? (
          <footer>
            {!isFirstStep ? (
              <button type="button" className="business-profile-ghost-btn" onClick={onBack}>
                <FiArrowLeft aria-hidden="true" />
                Back
              </button>
            ) : <span />}
            <button type="button" className="business-profile-primary-btn" onClick={onContinue} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Continue'}
              <FiArrowRight aria-hidden="true" />
            </button>
          </footer>
        ) : null}
      </form>
    </section>
  )
}
