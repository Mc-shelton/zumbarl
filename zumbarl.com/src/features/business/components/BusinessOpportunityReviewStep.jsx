import {
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiDollarSign,
  FiEdit2,
  FiFileText,
  FiSave,
  FiSend,
  FiUsers,
} from 'react-icons/fi'
import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa'
import {
  BUSINESS_CREATE_BUDGET_PLATFORMS,
  BUSINESS_CREATE_DELIVERABLES,
} from '../opportunityCreateData'

const PLATFORM_ICONS = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
}

const NEXT_STEPS = [
  'We will notify matched students about your opportunity.',
  'Students submit applications and portfolio samples for review.',
  'Approve candidates and payments are released by milestone.',
]

function numberValue(value) {
  return Number(String(value).replace(/[^\d]/g, '')) || 0
}

function moneyFromPercent(totalBudget, percent) {
  return `KES ${Math.round((numberValue(totalBudget) * percent) / 100).toLocaleString('en-US')}`
}

function EditButton({ onClick }) {
  return (
    <button type="button" className="business-create-review-edit" onClick={onClick}>
      <FiEdit2 aria-hidden="true" />
      Edit
    </button>
  )
}

function OverviewCard({ form, onStepChange }) {
  return (
    <section className="business-create-review-card business-create-review-overview">
      <header>
        <h3>Campaign Overview</h3>
        <EditButton onClick={() => onStepChange(1)} />
      </header>
      <div>
        <span aria-hidden="true"><FiFileText /></span>
        <article>
          <h4>{form.title} <em>{form.opportunityType}</em></h4>
          <p>{form.contentMessage}</p>
          <dl>
            <div><dt>Objective</dt><dd>{form.category}</dd></div>
            <div><dt>Category</dt><dd>{form.category}</dd></div>
            <div><dt>Campaign Duration</dt><dd>{form.startDate} - {form.endDate}</dd></div>
            <div><dt>Created by</dt><dd>{form.companyName}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  )
}

function TargetingCard({ form, onStepChange }) {
  return (
    <section className="business-create-review-card">
      <header>
        <h3><FiUsers aria-hidden="true" /> Targeting</h3>
        <EditButton onClick={() => onStepChange(2)} />
      </header>
      <dl className="business-create-review-list">
        <div><dt>Location</dt><dd>{form.targetLocations.join(', ')}</dd></div>
        <div><dt>Universities</dt><dd>{form.targetUniversities.join(', ')}</dd></div>
        <div><dt>Age Range</dt><dd>{form.targetAgeMin} - {form.targetAgeMax}</dd></div>
        <div><dt>Gender</dt><dd>{form.gender}</dd></div>
        <div>
          <dt>Interests</dt>
          <dd className="business-create-review-tags">{form.targetInterests.map((item) => <span key={item}>{item}</span>)}</dd>
        </div>
      </dl>
    </section>
  )
}

function DeliverablesCard({ form, onStepChange }) {
  const rows = BUSINESS_CREATE_DELIVERABLES.map((deliverable) => ({
    ...deliverable,
    count: form.deliverables[deliverable.id] || 0,
  }))

  return (
    <section className="business-create-review-card">
      <header>
        <h3><FiFileText aria-hidden="true" /> Platforms & Deliverables</h3>
        <EditButton onClick={() => onStepChange(3)} />
      </header>
      <div className="business-create-review-deliverables">
        {rows.map((row) => {
          const Icon = PLATFORM_ICONS[row.icon] || FiFileText

          return (
            <article key={row.id}>
              <Icon aria-hidden="true" />
              <strong>{row.label}</strong>
              <span>{row.meta}</span>
              <b>{row.count}</b>
            </article>
          )
        })}
      </div>
      <footer>Total Deliverables <strong>{rows.reduce((total, row) => total + row.count, 0)}</strong></footer>
    </section>
  )
}

function BudgetCard({ form, onStepChange }) {
  return (
    <section className="business-create-review-card">
      <header>
        <h3><FiDollarSign aria-hidden="true" /> Budget & Payment</h3>
        <EditButton onClick={() => onStepChange(4)} />
      </header>
      <dl className="business-create-review-list">
        <div><dt>Total Budget</dt><dd>KES {form.totalBudget}</dd></div>
        <div><dt>Payment Terms</dt><dd>{form.paymentTerm}</dd></div>
      </dl>
      <div className="business-create-review-allocation">
        {BUSINESS_CREATE_BUDGET_PLATFORMS.map((platform) => {
          const Icon = PLATFORM_ICONS[platform.icon]
          const percent = form.budgetAllocation[platform.id] || 0

          return (
            <article key={platform.id}>
              {Icon ? <Icon aria-hidden="true" /> : <span aria-hidden="true">X</span>}
              <strong>{percent}%</strong>
              <em>{moneyFromPercent(form.totalBudget, percent)}</em>
            </article>
          )
        })}
      </div>
      <p><FiCheck aria-hidden="true" /> Creators will be paid based on approved deliverables and selected payment terms.</p>
    </section>
  )
}

export function BusinessOpportunityReviewStep({ form, onBack, onPublish, onSaveDraft, onStepChange }) {
  return (
    <>
      <OverviewCard form={form} onStepChange={onStepChange} />
      <TargetingCard form={form} onStepChange={onStepChange} />
      <DeliverablesCard form={form} onStepChange={onStepChange} />
      <BudgetCard form={form} onStepChange={onStepChange} />

      <section className="business-create-review-next">
        <h3>What happens next?</h3>
        <div>
          {NEXT_STEPS.map((step) => (
            <article key={step}>
              <FiSend aria-hidden="true" />
              <p>{step}</p>
              <FiArrowRight aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <div className="business-create-review-actions">
        <button type="button" className="business-profile-ghost-btn" onClick={onBack}>
          <FiArrowLeft aria-hidden="true" />
          Back
        </button>
        <button type="button" className="business-profile-ghost-btn" onClick={onSaveDraft}>
          <FiSave aria-hidden="true" />
          Save as Draft
        </button>
        <button type="button" className="business-profile-primary-btn" onClick={onPublish}>
          Publish Campaign
          <FiSend aria-hidden="true" />
        </button>
      </div>
    </>
  )
}
