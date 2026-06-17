import { FiCheck } from 'react-icons/fi'

export function CheckoutStepper({ steps }) {
  return (
    <section className="campus-checkout-stepper" aria-label="Checkout steps">
      {steps.map((step, index) => (
        <article key={step.id} className={`campus-checkout-step ${step.state}`}>
          <span className="campus-checkout-step-icon" aria-hidden="true">
            {step.state === 'done' ? <FiCheck /> : step.number}
          </span>
          <div>
            <h3>{step.label}</h3>
            <p>{step.copy}</p>
          </div>
          {index < steps.length - 1 ? <i aria-hidden="true" /> : null}
        </article>
      ))}
    </section>
  )
}
