import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { BusinessOpportunityContentStep } from './BusinessOpportunityContentStep'
import { BusinessOpportunityDetailsStep } from './BusinessOpportunityDetailsStep'
import { BusinessOpportunityReviewStep } from './BusinessOpportunityReviewStep'
import { BusinessOpportunityScopeStep } from './BusinessOpportunityScopeStep'
import { BusinessOpportunityTargetingStep } from './BusinessOpportunityTargetingStep'

const STEP_CONTENT = {
  content: BusinessOpportunityContentStep,
  details: BusinessOpportunityDetailsStep,
  review: BusinessOpportunityReviewStep,
  scope: BusinessOpportunityScopeStep,
  targeting: BusinessOpportunityTargetingStep,
}

export function BusinessOpportunityCreateForm({
  activeStepMeta,
  form,
  isFirstStep,
  isFinalStep,
  onBack,
  onContinue,
  onPublish,
  onSaveDraft,
  onStepChange,
  onUpdateField,
}) {
  const ActiveStep = STEP_CONTENT[activeStepMeta.id] || BusinessOpportunityDetailsStep

  return (
    <section className="business-profile-card business-create-form-card" aria-labelledby="business-create-basic-title">
      <header>
        <div>
          <h2 id="business-create-basic-title">{activeStepMeta.label}</h2>
          <p>{activeStepMeta.meta}</p>
        </div>
      </header>

      <form className="business-create-form" onSubmit={(event) => event.preventDefault()}>
        <ActiveStep
          form={form}
          onBack={onBack}
          onPublish={onPublish}
          onSaveDraft={onSaveDraft}
          onStepChange={onStepChange}
          onUpdateField={onUpdateField}
        />
        {!isFinalStep ? (
        <footer>
          {!isFirstStep ? (
            <button type="button" className="business-profile-ghost-btn" onClick={onBack}>
              <FiArrowLeft aria-hidden="true" />
              Back
            </button>
          ) : <span />}
          {isFinalStep ? null : (
            <button type="button" className="business-profile-primary-btn" onClick={onContinue}>
              Save & Continue
              <FiArrowRight aria-hidden="true" />
            </button>
          )}
        </footer>
        ) : null}
      </form>
    </section>
  )
}
