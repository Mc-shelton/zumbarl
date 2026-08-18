import { FiCheck } from 'react-icons/fi'

function MarketplaceListingSteps({ activeStep, onStepChange, steps }) {
  return (
    <nav className="marketplace-studio-steps" aria-label="Listing creation progress">
      {steps.map((step, index) => {
        const number = index + 1
        const isActive = number === activeStep
        const isDone = number < activeStep
        return (
          <button key={step.id} type="button" className={`${isActive ? 'is-active' : ''}${isDone ? ' is-done' : ''}`} aria-current={isActive ? 'step' : undefined} onClick={() => onStepChange(number)}>
            <span>{isDone ? <FiCheck aria-hidden="true" /> : number}</span>
            <strong>{step.label}</strong>
            <small>{step.meta}</small>
          </button>
        )
      })}
    </nav>
  )
}

export default MarketplaceListingSteps
