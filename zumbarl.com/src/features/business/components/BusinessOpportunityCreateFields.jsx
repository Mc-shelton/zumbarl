import { FiCalendar, FiChevronDown } from 'react-icons/fi'

export function BusinessCreateField({ children, isWide = false, label, required = false }) {
  return (
    <label className={isWide ? 'is-wide' : ''}>
      <span>{label}{required ? <b> *</b> : null}</span>
      {children}
    </label>
  )
}

export function BusinessCreateInputField({
  isWide = false,
  label,
  name,
  onUpdateField,
  required = false,
  value,
}) {
  return (
    <BusinessCreateField isWide={isWide} label={label} required={required}>
      <input required={required} value={value} onChange={(event) => onUpdateField(name, event.target.value)} />
    </BusinessCreateField>
  )
}

export function BusinessCreateTextareaField({
  helper,
  isWide = false,
  label,
  maxLength,
  name,
  onUpdateField,
  required = false,
  value,
}) {
  return (
    <BusinessCreateField isWide={isWide} label={label} required={required}>
      <textarea
        maxLength={maxLength}
        required={required}
        value={value}
        onChange={(event) => onUpdateField(name, event.target.value)}
      />
      {helper ? <em>{helper}</em> : null}
    </BusinessCreateField>
  )
}

export function BusinessCreateSelectField({
  label,
  name,
  onUpdateField,
  options,
  required = false,
  value,
}) {
  return (
    <BusinessCreateField label={label} required={required}>
      <span className="business-create-select-wrap">
        <select required={required} value={value} onChange={(event) => onUpdateField(name, event.target.value)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <FiChevronDown aria-hidden="true" />
      </span>
    </BusinessCreateField>
  )
}

export function BusinessCreateDateField({ label, name, onUpdateField, required = true, value }) {
  return (
    <BusinessCreateField label={label} required={required}>
      <span className="business-create-date-wrap">
        <FiCalendar aria-hidden="true" />
        <input required={required} type="date" value={value} onChange={(event) => onUpdateField(name, event.target.value)} />
      </span>
    </BusinessCreateField>
  )
}
