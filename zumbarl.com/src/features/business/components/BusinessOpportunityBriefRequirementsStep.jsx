import { useMemo, useState } from 'react'
import { FiPlus, FiX } from 'react-icons/fi'
import {
  BUSINESS_OPPORTUNITY_BRIEF_SELECTS,
  BUSINESS_OPPORTUNITY_BRIEF_SKILLS,
} from '../opportunityBriefCreateData'
import {
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

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
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function BusinessOpportunitySkillsField({ form, onUpdateField }) {
  const [skillInput, setSkillInput] = useState('')
  const selectedSkills = useMemo(() => getUniqueItems(getSkillList(form.skills)), [form.skills])
  const availableSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase()
    return BUSINESS_OPPORTUNITY_BRIEF_SKILLS
      .filter((skill) => !selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase()))
      .filter((skill) => !query || skill.toLowerCase().includes(query))
  }, [selectedSkills, skillInput])

  function updateSkills(skills) {
    const nextSkills = getUniqueItems(skills)
    onUpdateField('skills', nextSkills.join(', '))
    onUpdateField('mustHave', nextSkills)
  }

  function addSkill(skill) {
    const nextSkill = skill.trim()
    if (!nextSkill) return
    updateSkills([...selectedSkills, nextSkill])
    setSkillInput('')
  }

  function removeSkill(skill) {
    updateSkills(selectedSkills.filter((item) => item !== skill))
  }

  function handleSkillInputKeyDown(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addSkill(skillInput)
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
            <button key={skill} type="button" onClick={() => addSkill(skill)}>
              <FiPlus aria-hidden="true" />
              {skill}
            </button>
          ))}
        </div>
      ) : skillInput.trim() ? (
        <p className="business-create-skill-empty">Press Enter to add "{skillInput.trim()}".</p>
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
    onUpdateField('preferredQualifications', nextQuestions.map((item) => item.value.trim()).filter(Boolean).join('\n'))
  }

  function addQuestion() {
    setQuestions([...questions, { id: `qualification-${Date.now()}`, value: '' }])
  }

  function removeQuestion(index) {
    const nextQuestions = questions.filter((_, itemIndex) => itemIndex !== index)
    const safeQuestions = nextQuestions.length ? nextQuestions : [{ id: `qualification-${Date.now()}`, value: '' }]
    setQuestions(safeQuestions)
    onUpdateField('preferredQualifications', safeQuestions.map((item) => item.value.trim()).filter(Boolean).join('\n'))
  }

  return (
    <div className="business-create-qualification-field">
      <div className="business-create-field-label">Preferred Qualifications</div>
      <div className="business-create-qualification-list">
        {questions.map((question, index) => (
          <label key={question.id} className="business-create-qualification-row">
            <span>Qualification question {index + 1}</span>
            <div>
              <input
                type="text"
                value={question.value}
                placeholder="e.g. You are above 18 years old"
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
        Add qualification question
      </button>
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
          <BusinessCreateTextareaField
            isWide
            label="Bidder Instructions"
            name="bidderInstructions"
            required
            value={form.bidderInstructions}
            onUpdateField={onUpdateField}
          />
        </div>
      </section>
    </>
  )
}
