import {
  BUSINESS_OPPORTUNITY_BRIEF_SELECTS,
  BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS,
} from '../opportunityBriefCreateData'
import {
  BusinessCreateDateField,
  BusinessCreateInputField,
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

export function BusinessOpportunityBriefDetailsStep({ form, onUpdateField }) {
  return (
    <>
      <div className="business-create-section-head">
        <h2>Basic Information</h2>
        <p>Provide the key details about this opportunity.</p>
      </div>
      <BusinessCreateInputField
        label="Opportunity Title"
        name="title"
        required
        value={form.title}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateSelectField
        label="Category"
        name="category"
        options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.category}
        required
        value={form.category}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateTextareaField
        helper={`${form.summary.length}/150`}
        isWide
        label="Short Description"
        maxLength={150}
        name="summary"
        required
        value={form.summary}
        onUpdateField={onUpdateField}
      />
      <fieldset className="business-create-type-field">
        <legend>Opportunity Type <b>*</b></legend>
        <div>
          {BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS.map((option) => (
            <label key={option.id} className={form.opportunityType === option.id ? 'is-active' : ''}>
              <input
                type="radio"
                name="opportunityType"
                checked={form.opportunityType === option.id}
                onChange={() => onUpdateField('opportunityType', option.id)}
              />
              <strong>{option.label}</strong>
              <span>{option.meta}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="business-opportunity-brief-grid-3">
        <BusinessCreateSelectField
          label="Experience Level"
          name="experienceLevel"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.experienceLevel}
          value={form.experienceLevel}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateSelectField
          label="Engagement Mode"
          name="engagementMode"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.engagementMode}
          value={form.engagementMode}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateSelectField
          label="Availability"
          name="availability"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.availability}
          value={form.availability}
          onUpdateField={onUpdateField}
        />
      </div>
      <div className="business-opportunity-brief-grid-2">
        <BusinessCreateDateField
          label="Estimated Start Date"
          name="estimatedStartDate"
          value={form.estimatedStartDate}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateDateField
          label="Application Deadline"
          name="applicationDeadline"
          value={form.applicationDeadline}
          onUpdateField={onUpdateField}
        />
      </div>
      <hr />
      
    </>
  )
}
