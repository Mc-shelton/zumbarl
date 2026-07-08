import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiX } from 'react-icons/fi'
import {
  BUSINESS_OPPORTUNITY_BRIEF_SELECTS,
} from '../opportunityBriefCreateData'
import { createBusinessSkill, listBusinessSkills } from '../services/persistSkills'
import {
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

const REQUIRED_ATTACHMENT_TYPE_OPTIONS = [
  'Any accepted file',
  'PDF',
  'DOCX',
  'Image',
  'Video',
  'Spreadsheet',
  'ZIP',
  'Link',
]

function getSkillList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getUniqueItems(items) {
  return items.filter((item, index, list) => (
    item && list.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index
  ))
}

function getQualificationQuestions(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function BusinessOpportunitySkillsField({ form, onUpdateField }) {
  const [skillInput, setSkillInput] = useState('')
  const [skillOptions, setSkillOptions] = useState([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const selectedSkills = useMemo(() => getUniqueItems(getSkillList(form.skills)), [form.skills])
  const availableSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase()
    return skillOptions
      .filter((skill) => !selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase()))
      .filter((skill) => !query || skill.toLowerCase().includes(query))
  }, [selectedSkills, skillInput, skillOptions])

  useEffect(() => {
    let isCurrent = true
    const timeoutId = window.setTimeout(() => {
      setIsLoadingSkills(true)
      listBusinessSkills(skillInput)
        .then((payload) => {
          if (!isCurrent) return
          const nextSkills = Array.isArray(payload?.data)
            ? payload.data.map((skill) => skill.name).filter(Boolean)
            : []
          setSkillOptions(nextSkills)
        })
        .catch(() => {
          if (isCurrent) setSkillOptions([])
        })
        .finally(() => {
          if (isCurrent) setIsLoadingSkills(false)
        })
    }, 180)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [skillInput])

  function updateSkills(skills) {
    const nextSkills = getUniqueItems(skills)
    onUpdateField('skills', nextSkills.join(', '))
    onUpdateField('mustHave', nextSkills)
  }

  async function addSkill(skill) {
    const nextSkill = skill.trim()
    if (!nextSkill) return
    const savedSkill = await createBusinessSkill(nextSkill).catch(() => null)
    updateSkills([...selectedSkills, savedSkill?.name ?? nextSkill])
    setSkillInput('')
  }

  function removeSkill(skill) {
    updateSkills(selectedSkills.filter((item) => item !== skill))
  }

  function handleSkillInputKeyDown(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void addSkill(skillInput)
  }

  return (
    <div className="business-create-skill-field">
      <label htmlFor="business-opportunity-required-skills">
        Required Skills <b>*</b>
      </label>
      <input
        id="business-opportunity-required-skills"
        type="text"
        value={skillInput}
        placeholder="Search or enter a skill..."
        onChange={(event) => setSkillInput(event.target.value)}
        onKeyDown={handleSkillInputKeyDown}
      />
      {availableSuggestions.length ? (
        <div className="business-create-skill-suggestions" aria-label="Skill suggestions">
          {availableSuggestions.map((skill) => (
            <button key={skill} type="button" onClick={() => void addSkill(skill)}>
              <FiPlus aria-hidden="true" />
              {skill}
            </button>
          ))}
        </div>
      ) : skillInput.trim() ? (
        <p className="business-create-skill-empty">Press Enter to create and add "{skillInput.trim()}".</p>
      ) : isLoadingSkills ? (
        <p className="business-create-skill-empty">Loading skills...</p>
      ) : null}
      <div className="business-create-chip-box business-create-selected-skills">
        {selectedSkills.map((skill) => (
          <span key={skill} className="business-create-chip is-selected">
            {skill}
            <button type="button" aria-label={`Remove ${skill}`} onClick={() => removeSkill(skill)}>
              <FiX aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function BusinessOpportunityQualificationQuestions({ value, onUpdateField }) {
  const [questions, setQuestions] = useState(() => {
    const initialQuestions = getQualificationQuestions(value)
    const rowValues = initialQuestions.length ? initialQuestions : ['']
    return rowValues.map((question, index) => ({ id: `qualification-${index}-${Date.now()}`, value: question }))
  })

  function updateQuestion(index, nextValue) {
    const nextQuestions = [...questions]
    nextQuestions[index] = { ...nextQuestions[index], value: nextValue }
    setQuestions(nextQuestions)
    onUpdateField('qualificationQuestions', nextQuestions.map((item) => item.value.trim()).filter(Boolean))
  }

  function addQuestion() {
    setQuestions([...questions, { id: `qualification-${Date.now()}`, value: '' }])
  }

  function removeQuestion(index) {
    const nextQuestions = questions.filter((_, itemIndex) => itemIndex !== index)
    const safeQuestions = nextQuestions.length ? nextQuestions : [{ id: `qualification-${Date.now()}`, value: '' }]
    setQuestions(safeQuestions)
    onUpdateField('qualificationQuestions', safeQuestions.map((item) => item.value.trim()).filter(Boolean))
  }

  return (
    <div className="business-create-qualification-field">
      <div className="business-create-field-label">Application Questions</div>
      <div className="business-create-qualification-list">
        {questions.map((question, index) => (
          <label key={question.id} className="business-create-qualification-row">
            <span>Application question {index + 1}</span>
            <div>
              <input
                type="text"
                value={question.value}
                placeholder="e.g. Describe a relevant project and its outcome"
                onChange={(event) => updateQuestion(index, event.target.value)}
              />
              <button type="button" aria-label={`Remove qualification question ${index + 1}`} onClick={() => removeQuestion(index)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
          </label>
        ))}
      </div>
      <button type="button" className="business-create-add-question" onClick={addQuestion}>
        <FiPlus aria-hidden="true" />
        Add application question
      </button>
    </div>
  )
}

function BusinessOpportunityRequiredAttachmentsField({ requiredAttachments = [], onUpdateField }) {
  const safeAttachments = Array.isArray(requiredAttachments) ? requiredAttachments : []

  function updateRequiredAttachments(nextAttachments) {
    onUpdateField('requiredAttachments', nextAttachments)
  }

  function addRequiredAttachment() {
    updateRequiredAttachments([
      ...safeAttachments,
      {
        id: `required-attachment-${Date.now()}`,
        label: '',
        fileType: REQUIRED_ATTACHMENT_TYPE_OPTIONS[0],
      },
    ])
  }

  function updateRequiredAttachment(attachmentId, field, value) {
    updateRequiredAttachments(safeAttachments.map((attachment) => (
      attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment
    )))
  }

  function removeRequiredAttachment(attachmentId) {
    updateRequiredAttachments(safeAttachments.filter((attachment) => attachment.id !== attachmentId))
  }

  return (
    <div className="business-create-required-attachments-field">
      <header>
        <div>
          <h4>Required Attachments</h4>
          <p>Define the files or links applicants must provide when they apply.</p>
        </div>
        <button type="button" className="business-create-add-question" onClick={addRequiredAttachment}>
          <FiPlus aria-hidden="true" />
          Add required attachment
        </button>
      </header>
      <div className="business-create-required-attachment-list">
        {safeAttachments.map((attachment, index) => (
          <article key={attachment.id} className="business-create-required-attachment-row">
            <label>
              <span>Attachment {index + 1}</span>
              <input
                type="text"
                value={attachment.label}
                placeholder="e.g. Portfolio samples"
                onChange={(event) => updateRequiredAttachment(attachment.id, 'label', event.target.value)}
              />
            </label>
            <label>
              <span>File type</span>
              <select
                value={attachment.fileType}
                onChange={(event) => updateRequiredAttachment(attachment.id, 'fileType', event.target.value)}
              >
                {REQUIRED_ATTACHMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label={`Remove required attachment ${index + 1}`}
              onClick={() => removeRequiredAttachment(attachment.id)}
            >
              <FiX aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
      {!safeAttachments.length ? (
        <p className="business-create-required-attachments-empty">No required attachments yet. Add one if applicants need to submit a file, portfolio, proof, or link.</p>
      ) : null}
    </div>
  )
}

export function BusinessOpportunityBriefRequirementsStep({ form, onUpdateField }) {
  return (
    <>
      <section className="business-create-target-card">
        <h3>Skills & Qualifications</h3>
        <p>Define the capabilities students need before they apply.</p>
        <BusinessOpportunitySkillsField form={form} onUpdateField={onUpdateField} />
      </section>

      <section className="business-create-target-card">
        <h3>Applicant Screening</h3>
        <p>Set expectations for reviewing applicants quickly.</p>
        <div className="business-create-target-grid">
          <BusinessCreateSelectField
            label="Portfolio Requirement"
            name="portfolioRequired"
            options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.portfolioRequired}
            value={form.portfolioRequired}
            onUpdateField={onUpdateField}
          />
          <BusinessOpportunityQualificationQuestions
            value={form.qualificationQuestions}
            onUpdateField={onUpdateField}
          />
          <BusinessCreateTextareaField
            isWide
            label="Preferred Qualifications"
            name="preferredQualifications"
            value={form.preferredQualifications}
            onUpdateField={onUpdateField}
          />
          <BusinessCreateTextareaField
            isWide
            label="Screening Focus"
            name="screeningFocus"
            value={form.screeningFocus}
            onUpdateField={onUpdateField}
          />
          <BusinessOpportunityRequiredAttachmentsField
            requiredAttachments={form.requiredAttachments}
            onUpdateField={onUpdateField}
          />
        </div>
      </section>
    </>
  )
}
