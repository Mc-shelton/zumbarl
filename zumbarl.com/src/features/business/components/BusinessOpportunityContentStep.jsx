import { FiFileText, FiMinus, FiPlus, FiUploadCloud } from 'react-icons/fi'
import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa'
import {
  BUSINESS_CREATE_CONTENT_REQUIREMENTS,
  BUSINESS_CREATE_DELIVERABLES,
} from '../opportunityCreateData'

const DELIVERABLE_ICONS = {
  file: FiFileText,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
}

function updateDeliverable(deliverables, id, nextCount) {
  return {
    ...deliverables,
    [id]: Math.max(0, nextCount),
  }
}

function toggleRequirement(items, item) {
  return items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item]
}

function ContentTextarea({ helper, label, name, onUpdateField, value }) {
  return (
    <label className="business-create-content-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onUpdateField(name, event.target.value)} />
      <em>{helper}</em>
    </label>
  )
}

function DeliverableCard({ deliverable, form, onUpdateField }) {
  const Icon = DELIVERABLE_ICONS[deliverable.icon] || FiFileText
  const count = form.deliverables[deliverable.id] || 0
  const isSelected = count > 0

  return (
    <article className={`business-create-deliverable-card${isSelected ? ' is-selected' : ''}`}>
      <button
        type="button"
        aria-label={`${isSelected ? 'Remove' : 'Select'} ${deliverable.label}`}
        onClick={() => onUpdateField('deliverables', updateDeliverable(form.deliverables, deliverable.id, isSelected ? 0 : 1))}
      >
        {isSelected ? '✓' : ''}
      </button>
      <Icon aria-hidden="true" />
      <h4>{deliverable.label}</h4>
      <p>{deliverable.meta}</p>
      <div>
        <button
          type="button"
          aria-label={`Decrease ${deliverable.label}`}
          onClick={() => onUpdateField('deliverables', updateDeliverable(form.deliverables, deliverable.id, count - 1))}
        >
          <FiMinus aria-hidden="true" />
        </button>
        <strong>{count}</strong>
        <button
          type="button"
          aria-label={`Increase ${deliverable.label}`}
          onClick={() => onUpdateField('deliverables', updateDeliverable(form.deliverables, deliverable.id, count + 1))}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

function RequirementPicker({ form, onUpdateField }) {
  return (
    <div className="business-create-field-block">
      <span>Content Requirements</span>
      <div className="business-create-chip-box">
        {form.contentRequirements.map((item) => (
          <button
            key={item}
            type="button"
            className="business-create-chip is-selected"
            onClick={() => onUpdateField('contentRequirements', toggleRequirement(form.contentRequirements, item))}
          >
            {item}
            <i aria-hidden="true">x</i>
          </button>
        ))}
        <select
          aria-label="Add content requirement"
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onUpdateField('contentRequirements', toggleRequirement(form.contentRequirements, event.target.value))
            }
          }}
        >
          <option value="">Add requirement</option>
          {BUSINESS_CREATE_CONTENT_REQUIREMENTS
            .filter((item) => !form.contentRequirements.includes(item))
            .map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </div>
  )
}

function ReferenceUpload({ form, onUpdateField }) {
  return (
    <label className="business-create-upload-card">
      <span>References & Examples (Optional)</span>
      <div>
        <FiUploadCloud aria-hidden="true" />
        <p><strong>Upload files</strong> or drag and drop<br />PNG, JPG, MP4 or PDF (Max 20MB)</p>
        <b>Browse Files</b>
      </div>
      <input
        multiple
        type="file"
        onChange={(event) => onUpdateField('referenceFiles', Array.from(event.target.files).map((file) => file.name))}
      />
      {form.referenceFiles.length ? <em>{form.referenceFiles.join(', ')}</em> : null}
    </label>
  )
}

export function BusinessOpportunityContentStep({ form, onUpdateField }) {
  return (
    <>
      <div className="business-create-copy-grid">
        <ContentTextarea
          helper={`${form.contentMessage.length}/300`}
          label="Campaign Message"
          name="contentMessage"
          value={form.contentMessage}
          onUpdateField={onUpdateField}
        />
        <ContentTextarea
          helper={`${form.contentGuidelines.split('\n').filter(Boolean).length}/10`}
          label="Creator Guidelines (Optional)"
          name="contentGuidelines"
          value={form.contentGuidelines}
          onUpdateField={onUpdateField}
        />
      </div>

      <section className="business-create-deliverables">
        <h3>Deliverables</h3>
        <p>Select the type and number of deliverables you expect from creators.</p>
        <div>
          {BUSINESS_CREATE_DELIVERABLES.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              form={form}
              onUpdateField={onUpdateField}
            />
          ))}
        </div>
      </section>

      <div className="business-create-bottom-grid">
        <RequirementPicker form={form} onUpdateField={onUpdateField} />
        <ReferenceUpload form={form} onUpdateField={onUpdateField} />
      </div>
    </>
  )
}
