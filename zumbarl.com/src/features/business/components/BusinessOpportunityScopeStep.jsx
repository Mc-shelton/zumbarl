import { FiCalendar, FiInfo } from 'react-icons/fi'
import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa'
import { BUSINESS_CREATE_BUDGET_PLATFORMS, BUSINESS_CREATE_PAYMENT_TERMS } from '../opportunityCreateData'

const PLATFORM_ICONS = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
}

function AllocationCard({ allocation, platform, onUpdateField }) {
  const Icon = PLATFORM_ICONS[platform.icon]
  const value = allocation[platform.id] || 0

  return (
    <label className="business-create-allocation-card">
      <span>
        {Icon ? <Icon aria-hidden="true" /> : <i aria-hidden="true">X</i>}
        <strong>{platform.label}</strong>
      </span>
      <input
        aria-label={`${platform.label} budget allocation percentage`}
        min="0"
        max="100"
        type="number"
        value={value}
        onChange={(event) => onUpdateField('budgetAllocation', {
          ...allocation,
          [platform.id]: Number(event.target.value),
        })}
      />
      <em>%</em>
    </label>
  )
}

function DateInput({ helper, label, name, onUpdateField, value }) {
  return (
    <label className="business-create-schedule-date">
      <span>{label} <b>*</b></span>
      <div>
        <FiCalendar aria-hidden="true" />
        <input value={value} onChange={(event) => onUpdateField(name, event.target.value)} />
      </div>
      <p>{helper}</p>
    </label>
  )
}

function PaymentTermCard({ form, onUpdateField, term }) {
  const isActive = form.paymentTerm === term.id

  return (
    <button
      type="button"
      className={`business-create-payment-card${isActive ? ' is-active' : ''}`}
      onClick={() => onUpdateField('paymentTerm', term.id)}
      aria-pressed={isActive}
    >
      <i aria-hidden="true" />
      <span><strong>{term.label}</strong>{term.meta}</span>
    </button>
  )
}

export function BusinessOpportunityScopeStep({ form, onUpdateField }) {
  return (
    <>
      <section className="business-create-budget-card">
        <h3>Budget</h3>
        <p>Set your total campaign budget.</p>
        <div className="business-create-budget-grid">
          <label className="business-create-budget-input">
            <span>Total Budget (KES) <b>*</b></span>
            <input
              value={form.totalBudget}
              onChange={(event) => onUpdateField('totalBudget', event.target.value)}
            />
          </label>
          <aside className="business-create-budget-info">
            <FiInfo aria-hidden="true" />
            <div>
              <strong>How creator payments work</strong>
              <p>Creators are paid individually based on the deliverables they complete. You can adjust suggested payments before publishing.</p>
            </div>
          </aside>
        </div>

        <h4>Budget Allocation <span>(Optional)</span></h4>
        <p>Allocate budget across platforms. The split should add up to 100%.</p>
        <div className="business-create-allocation-grid">
          {BUSINESS_CREATE_BUDGET_PLATFORMS.map((platform) => (
            <AllocationCard
              key={platform.id}
              allocation={form.budgetAllocation}
              platform={platform}
              onUpdateField={onUpdateField}
            />
          ))}
        </div>
      </section>

      <section className="business-create-budget-card">
        <h3>Schedule</h3>
        <p>Choose when your opportunity will run.</p>
        <div className="business-create-schedule-grid">
          <DateInput
            helper="Campaign will go live on this date."
            label="Start Date"
            name="startDate"
            value={form.startDate}
            onUpdateField={onUpdateField}
          />
          <DateInput
            helper="Campaign will end on this date."
            label="End Date"
            name="endDate"
            value={form.endDate}
            onUpdateField={onUpdateField}
          />
        </div>
        <div className="business-create-budget-summary">
          <article>
            <FiCalendar aria-hidden="true" />
            <span><strong>Campaign Duration</strong>{form.duration}</span>
          </article>
          <article>
            <span><strong>Estimated Creator Payout</strong>{form.estimatedPayout}</span>
          </article>
          <article>
            <span><strong>Remaining Budget</strong>{form.remainingBudget}</span>
          </article>
        </div>
      </section>

      <section className="business-create-budget-card">
        <h3>Payment Terms</h3>
        <p>Choose how and when creators will be paid.</p>
        <div className="business-create-payment-grid">
          {BUSINESS_CREATE_PAYMENT_TERMS.map((term) => (
            <PaymentTermCard
              key={term.id}
              form={form}
              term={term}
              onUpdateField={onUpdateField}
            />
          ))}
        </div>
      </section>
    </>
  )
}
