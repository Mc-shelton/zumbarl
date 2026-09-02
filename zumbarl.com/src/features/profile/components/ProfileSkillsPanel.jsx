import { useEffect, useState } from 'react'
import { FiChevronDown, FiMoreVertical, FiPlusCircle, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import {
  SKILLS_CATEGORY_FILTERS,
  SKILLS_LEVEL_FILTERS,
} from '../constants'
import { resolveProfileSkill, searchProfileSkills } from '../services/profileSkillService'

function renderSkillRows(skills, groupName, canManageSkills) {
  return skills.map((skill) => (
    <article key={`${groupName}-${skill.id}`} className="campus-skills-row">
      <div className="campus-skills-name-cell">
        <span className={`campus-skills-icon ${skill.iconTone}`}>{skill.iconLabel}</span>
        <div>
          <h4>{skill.name}</h4>
          <p>{skill.category}</p>
        </div>
      </div>

      <div className="campus-skills-proficiency-cell">
        <div className="campus-skills-proficiency-track">
          <span style={{ width: `${skill.proficiency}%` }} />
        </div>
      </div>

      <div className="campus-skills-score-cell">
        <div
          className="campus-skills-score-ring"
          style={{ '--skills-score-angle': `${Math.round((skill.score / 100) * 360)}deg` }}
        >
          <span>{skill.score}</span>
        </div>
        <div>
          <p>{skill.scoreTier}</p>
          <strong>{skill.scoreMeta}</strong>
        </div>
      </div>

      <div className="campus-skills-last-used-cell">
        <p>{skill.lastUsed}</p>
        <strong>{skill.projects}</strong>
      </div>

      {canManageSkills ? (
        <button type="button" className="campus-skills-row-menu" aria-label={`More actions for ${skill.name}`}>
          <FiMoreVertical aria-hidden="true" />
        </button>
      ) : null}
    </article>
  ))
}

function ProfileSkillsPanel({
  canManage = false,
  embedded = false,
  filteredCoreSkills,
  filteredOtherSkills,
  hasSkillsResults,
  onAddSkill,
  onCategoryFilterChange,
  onLevelFilterChange,
  onSearchQueryChange,
  skillsCategoryFilter,
  skillsLevelFilter,
  skillsSearchQuery,
}) {
  const canManageSkills = canManage && hasAccess(ACCESS_KEYS.profile.manageSkills)
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [isSavingSkill, setIsSavingSkill] = useState(false)
  const [skillError, setSkillError] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])

  useEffect(() => {
    const query = skillName.trim()
    if (!isAddingSkill) return undefined
    let active = true
    const timer = window.setTimeout(() => {
      searchProfileSkills(query)
        .then((response) => { if (active) setSkillSuggestions(response?.data || []) })
        .catch(() => { if (active) setSkillSuggestions([]) })
    }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [isAddingSkill, skillName])

  async function submitSkill(event) {
    event.preventDefault()
    const normalized = skillName.trim()
    if (!normalized || isSavingSkill) return
    setIsSavingSkill(true)
    setSkillError('')
    try {
      const { skill } = await resolveProfileSkill(normalized)
      await onAddSkill(skill.name || normalized)
      setSkillName('')
      setIsAddingSkill(false)
      onSearchQueryChange('')
    } catch (error) {
      setSkillError(error.message || 'The skill could not be added.')
    } finally {
      setIsSavingSkill(false)
    }
  }

  return (
    <section className={`campus-profile-surface campus-skills-panel${embedded ? ' is-embedded' : ''}`}>
      <div className="campus-skills-sticky-head">
        <header className="campus-skills-head">
          <div>
            <h2>{embedded ? 'Skills' : 'My Skills'}</h2>
            <p>Your skills, their proficiency level, and how you&apos;re growing.</p>
          </div>
          {canManageSkills ? (
            <button type="button" className="campus-skills-add-btn" onClick={() => { setIsAddingSkill(true); setSkillError('') }}>
              <FiPlusCircle aria-hidden="true" />
              Add Skill
            </button>
          ) : null}
        </header>

        {isAddingSkill ? <form className="campus-skills-add-form" onSubmit={submitSkill}>
          <label htmlFor="campus-new-skill">Skill name</label>
          <input id="campus-new-skill" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(skillSuggestions.length)} autoFocus maxLength="80" value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="Search the skills database" />
          <button type="submit" disabled={!skillName.trim() || isSavingSkill}>{isSavingSkill ? 'Saving…' : skillSuggestions.length ? 'Use closest match' : 'Create skill'}</button>
          <button type="button" aria-label="Cancel adding skill" disabled={isSavingSkill} onClick={() => { setIsAddingSkill(false); setSkillName(''); setSkillError('') }}><FiX /></button>
          {skillError ? <p role="alert">{skillError}</p> : null}
          {skillSuggestions.length ? <div className="campus-profile-skill-suggestions" role="listbox">{skillSuggestions.map((skill) => <button type="button" role="option" key={skill.id} onClick={() => setSkillName(skill.name)}><strong>{skill.name}</strong>{skill.category?.name ? <small>{skill.category.name}</small> : null}</button>)}</div> : null}
        </form> : null}

        <div className="campus-skills-toolbar">
          <label className="campus-skills-search-field" htmlFor="campus-skills-search">
            <FiSearch aria-hidden="true" />
            <input
              id="campus-skills-search"
              type="text"
              placeholder="Search skills..."
              value={skillsSearchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
            />
          </label>

          <select
            aria-label="Filter by category"
            value={skillsCategoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
          >
            {SKILLS_CATEGORY_FILTERS.map((filter) => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>

          <select
            aria-label="Filter by level"
            value={skillsLevelFilter}
            onChange={(event) => onLevelFilterChange(event.target.value)}
          >
            {SKILLS_LEVEL_FILTERS.map((filter) => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>

          {canManageSkills ? (
            <button type="button" className="campus-skills-retake-btn">
              <FiRefreshCw aria-hidden="true" />
              Retake Skill Assessments
            </button>
          ) : null}
        </div>
      </div>

      <section className="campus-skills-table">
        <header className="campus-skills-table-head" aria-hidden="true">
          <span />
          <p>Proficiency Level</p>
          <p>Zumbarl Score</p>
          <p>Last Used</p>
          <span />
        </header>

        {hasSkillsResults ? (
          <>
            {filteredCoreSkills.length ? (
              <>
                <h3 className="campus-skills-group-title">Core Skills</h3>
                <div className="campus-skills-group-list">
                  {renderSkillRows(filteredCoreSkills, 'core', canManageSkills)}
                </div>
              </>
            ) : null}

            {filteredOtherSkills.length ? (
              <>
                <h3 className="campus-skills-group-title">Other Skills</h3>
                <div className="campus-skills-group-list">
                  {renderSkillRows(filteredOtherSkills, 'other', canManageSkills)}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <p className="campus-skills-empty-state">
            No skills match your current filters. Try another search term or reset filters.
          </p>
        )}
      </section>

      <button type="button" className="campus-skills-show-more-btn">
        Show More Skills
        <FiChevronDown aria-hidden="true" />
      </button>
    </section>
  )
}

export default ProfileSkillsPanel
