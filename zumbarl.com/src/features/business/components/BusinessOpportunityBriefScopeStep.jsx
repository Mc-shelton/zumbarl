import { FiInfo } from 'react-icons/fi'
import { BUSINESS_OPPORTUNITY_BRIEF_SELECTS } from '../opportunityBriefCreateData'
import {
  BusinessCreateInputField,
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

export function BusinessOpportunityBriefScopeStep({ form, onUpdateField }) {
  return (
    <>
      <section className="business-create-budget-card">
        <h3>Deliverables</h3>
        <p>Explain the work output you expect from the student.</p>
        <BusinessCreateTextareaField
          isWide
          label="Expected Deliverables"
          name="deliverables"
          required
          value={form.deliverables}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateTextareaField
          isWide
          label="Acceptance Criteria"
          name="acceptanceCriteria"
          required
          value={form.acceptanceCriteria}
          onUpdateField={onUpdateField}
        />
      </section>

      <section className="business-create-budget-card">
        <h3>Budget & Duration</h3>
        <p>Set the commercial scope for the opportunity.</p>
        <div className="business-create-budget-grid">
          <BusinessCreateInputField
            label="Budget (KES)"
            name="budget"
            required
            value={form.budget}
            onUpdateField={onUpdateField}
          />
          <BusinessCreateInputField
            label="Duration"
            name="duration"
            value={form.duration}
            onUpdateField={onUpdateField}
          />
          <BusinessCreateSelectField
            label="Payment Terms"
            name="paymentTerms"
            options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.paymentTerms}
            value={form.paymentTerms}
            onUpdateField={onUpdateField}
          />
          <aside className="business-create-budget-info">
            <FiInfo aria-hidden="true" />
            <div>
              <strong>Keep the brief practical</strong>
              <p>Students respond faster when scope, output, timeline, and budget are clear before publishing.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
