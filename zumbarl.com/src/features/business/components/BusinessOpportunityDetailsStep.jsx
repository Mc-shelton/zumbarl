import {
  BUSINESS_CREATE_SELECTS,
  BUSINESS_CREATE_TYPE_OPTIONS,
} from '../opportunityCreateData'
import {
  BusinessCreateInputField,
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

export function BusinessOpportunityDetailsStep({ form, onUpdateField }) {
  return (
    <>
      <BusinessCreateInputField
        label="Campaign Title"
        name="title"
        required
        value={form.title}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateSelectField
        label="Category"
        name="category"
        options={BUSINESS_CREATE_SELECTS.category}
        required
        value={form.category}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateTextareaField
        helper={`${form.summary.length}/150`}
        isWide
        label="Campaign Description"
        maxLength={150}
        name="summary"
        required
        value={form.summary}
        onUpdateField={onUpdateField}
      />
      <fieldset className="business-create-type-field">
        <legend>Campaign Type <b>*</b></legend>
        <div>
          {BUSINESS_CREATE_TYPE_OPTIONS.map((option) => (
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
      <hr />
      <div className="business-create-section-head">
        <h2>About Your Company</h2>
        <p>This information helps students understand your organization.</p>
      </div>
      <BusinessCreateInputField
        label="Company Name"
        name="companyName"
        required
        value={form.companyName}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateTextareaField
        helper={`${form.companyDescription.length}/250`}
        label="Company Description"
        maxLength={250}
        name="companyDescription"
        value={form.companyDescription}
        onUpdateField={onUpdateField}
      />
    </>
  )
}
