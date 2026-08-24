import { FiChevronDown, FiMoreVertical, FiPlusCircle, FiRefreshCw, FiSearch } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import {
  SKILLS_CATEGORY_FILTERS,
  SKILLS_LEVEL_FILTERS,
} from '../constants'

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
  onCategoryFilterChange,
  onLevelFilterChange,
  onSearchQueryChange,
  skillsCategoryFilter,
  skillsLevelFilter,
  skillsSearchQuery,
}) {
  const canManageSkills = canManage && hasAccess(ACCESS_KEYS.profile.manageSkills)

  return (
    <section className={`campus-profile-surface campus-skills-panel${embedded ? ' is-embedded' : ''}`}>
      <div className="campus-skills-sticky-head">
        <header className="campus-skills-head">
          <div>
            <h2>{embedded ? 'Skills' : 'My Skills'}</h2>
            <p>Your skills, their proficiency level, and how you&apos;re growing.</p>
          </div>
          {canManageSkills ? (
            <button type="button" className="campus-skills-add-btn">
              <FiPlusCircle aria-hidden="true" />
              Add Skill
            </button>
          ) : null}
        </header>

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
