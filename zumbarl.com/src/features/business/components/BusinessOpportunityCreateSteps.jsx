import { FiCheck } from 'react-icons/fi'
import { BUSINESS_CREATE_STEPS } from '../opportunityCreateData'

export function BusinessOpportunityCreateSteps({ activeStep, onStepChange }) {
  return (
    <section className="business-create-stepper" aria-label="Create opportunity progress">
      {BUSINESS_CREATE_STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === activeStep
        const isDone = stepNumber < activeStep

        return (
          <button
            key={step.id}
            type="button"
            className={`${isActive ? 'is-active' : ''}${isDone ? ' is-done' : ''}`}
            onClick={() => onStepChange(stepNumber)}
            aria-current={isActive ? 'step' : undefined}
          >
            <span>{isDone ? <FiCheck aria-hidden="true" /> : stepNumber}</span>
            <strong>{step.label}</strong>
            <small>{step.meta}</small>
          </button>
        )
      })}
    </section>
  )
}
