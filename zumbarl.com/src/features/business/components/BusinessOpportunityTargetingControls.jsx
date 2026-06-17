import { FiCheck, FiChevronDown } from 'react-icons/fi'
import { BUSINESS_CREATE_SELECTS } from '../opportunityCreateData'

const PLATFORM_LABELS = {
  'Any Platform': 'Any',
  Instagram: 'IG',
  TikTok: 'TT',
  'X (Twitter)': 'X',
  YouTube: 'YT',
}

function toggleTargetingItem(items, item) {
  return items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item]
}

export function ChipPicker({ label, name, onUpdateField, options, value }) {
  return (
    <div className="business-create-field-block">
      <span>{label}</span>
      <div className="business-create-chip-box">
        {value.map((item) => (
          <button
            key={item}
            type="button"
            className="business-create-chip is-selected"
            onClick={() => onUpdateField(name, toggleTargetingItem(value, item))}
          >
            {item}
            <i aria-hidden="true">x</i>
          </button>
        ))}
        <select
          aria-label={`Add ${label.toLowerCase()}`}
          value=""
          onChange={(event) => {
            if (event.target.value) onUpdateField(name, toggleTargetingItem(value, event.target.value))
          }}
        >
          <option value="">Add option</option>
          {options.filter((option) => !value.includes(option)).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <FiChevronDown aria-hidden="true" />
      </div>
    </div>
  )
}

export function SegmentGroup({ label, name, onUpdateField, options, value }) {
  return (
    <div className="business-create-field-block">
      <span>{label}</span>
      <div className="business-create-segment-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'is-active' : ''}
            onClick={() => onUpdateField(name, option)}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CourseField({ form, onUpdateField }) {
  return (
    <div className="business-create-field-block">
      <span>Course / Field of Study (Optional)</span>
      <div className="business-create-chip-box">
        <select
          aria-label="Course or field of study"
          value={form.targetCourseField}
          onChange={(event) => onUpdateField('targetCourseField', event.target.value)}
        >
          <option value="">e.g. Business, Engineering, Media</option>
          {BUSINESS_CREATE_SELECTS.courseFields.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <FiChevronDown aria-hidden="true" />
      </div>
    </div>
  )
}

export function AgeRange({ form, onUpdateField }) {
  return (
    <div className="business-create-field-block">
      <span>Age Range</span>
      <div className="business-create-age-control">
        <input
          aria-label="Minimum age"
          min="16"
          max="35"
          type="number"
          value={form.targetAgeMin}
          onChange={(event) => onUpdateField('targetAgeMin', event.target.value)}
        />
        <div aria-hidden="true"><span /></div>
        <input
          aria-label="Maximum age"
          min="16"
          max="35"
          type="number"
          value={form.targetAgeMax}
          onChange={(event) => onUpdateField('targetAgeMax', event.target.value)}
        />
      </div>
    </div>
  )
}

export function PlatformCard({ isSelected, onClick, platform }) {
  return (
    <button
      type="button"
      className={`business-create-platform-card${isSelected ? ' is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <span>{PLATFORM_LABELS[platform] || platform.slice(0, 2)}</span>
      <strong>{platform}</strong>
      <i aria-hidden="true">{isSelected ? <FiCheck /> : null}</i>
    </button>
  )
}
