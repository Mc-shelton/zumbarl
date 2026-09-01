import { FiAward, FiBriefcase, FiDollarSign, FiMapPin, FiSliders } from 'react-icons/fi'
import { FILTER_MODES, FILTER_TYPES } from '../constants'

function OpportunitiesFilterRailPanel({
  isDetailOpen,
  isFilterCollapsed,
  isFilterExpanded,
  isFilterPanelVisible,
  onBackToDetail,
  onClearFilters,
  onEditFilters,
  onRailFilterChange,
  onRailFilterToggle,
  railFilters,
  skillOptions = [],
}) {
  const activeFilterCount = (
    railFilters.types.length +
    railFilters.workModes.length +
    (railFilters.budgetMin ? 1 : 0) +
    (railFilters.budgetMax ? 1 : 0) +
    (railFilters.skill !== 'all' ? 1 : 0)
  )

  return (
    <section
      className={
        `campus-rail-card opportunities-filter-card opportunities-rail-panel` +
        `${isFilterCollapsed ? ' is-collapsed' : ''}` +
        `${isFilterPanelVisible ? ' is-active' : ' is-hidden'}`
      }
    >
      <header>
        <div className="opportunities-filter-heading">
          <span><FiSliders aria-hidden="true" /></span>
          <div>
            <small>Refine your match</small>
            <h3>Filter opportunities</h3>
          </div>
        </div>
        {isDetailOpen && isFilterExpanded ? (
          <button
            type="button"
            className="opportunities-filter-action opportunities-filter-toggle"
            onClick={onBackToDetail}
          >
            Back to gig
          </button>
        ) : isDetailOpen ? (
          <button
            type="button"
            className="opportunities-filter-action opportunities-filter-toggle"
            onClick={onEditFilters}
          >
            Edit filters
          </button>
        ) : (
          <button type="button" className="opportunities-filter-action" onClick={onClearFilters}>
            Clear all
            {activeFilterCount > 0 ? <span>{activeFilterCount}</span> : null}
          </button>
        )}
      </header>

      {isFilterCollapsed ? (
        <p className="opportunities-filter-collapsed-note">
          Filters are collapsed while you review this gig.
        </p>
      ) : (
        <div className="opportunities-filter-body">
          <div className="opportunities-filter-group">
            <h4><FiBriefcase aria-hidden="true" />Type</h4>
            <div className="opportunities-checklist">
              {FILTER_TYPES.filter((item) => item !== 'All Types').map((item) => (
                <label key={item} className={`opportunities-check-item${railFilters.types.includes(item) ? ' is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={railFilters.types.includes(item)}
                    onChange={() => onRailFilterToggle('types', item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4><FiMapPin aria-hidden="true" />Work mode</h4>
            <div className="opportunities-checklist">
              {FILTER_MODES.filter((item) => item !== 'All').map((item) => (
                <label key={item} className={`opportunities-check-item${railFilters.workModes.includes(item) ? ' is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={railFilters.workModes.includes(item)}
                    onChange={() => onRailFilterToggle('workModes', item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4><FiDollarSign aria-hidden="true" />Budget / pay</h4>
            <div className="opportunities-budget-row">
              <label>
                <span>Minimum</span>
                <div><b>KES</b><input type="number" min="0" placeholder="0" aria-label="Minimum budget" value={railFilters.budgetMin} onChange={(event) => onRailFilterChange({ budgetMin: event.target.value })} /></div>
              </label>
              <label>
                <span>Maximum</span>
                <div><b>KES</b><input type="number" min="0" placeholder="Any" aria-label="Maximum budget" value={railFilters.budgetMax} onChange={(event) => onRailFilterChange({ budgetMax: event.target.value })} /></div>
              </label>
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4><FiAward aria-hidden="true" />Skills</h4>
            <div className="opportunities-select-wrap">
              <FiAward aria-hidden="true" />
              <select
                className="opportunities-select"
                aria-label="Filter by skill"
                value={railFilters.skill}
                onChange={(event) => onRailFilterChange({ skill: event.target.value })}
              >
                <option value="all">All skills</option>
                {skillOptions.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default OpportunitiesFilterRailPanel
