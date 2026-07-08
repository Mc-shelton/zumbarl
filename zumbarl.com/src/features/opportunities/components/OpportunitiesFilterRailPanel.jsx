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
  return (
    <section
      className={
        `campus-rail-card opportunities-filter-card opportunities-rail-panel` +
        `${isFilterCollapsed ? ' is-collapsed' : ''}` +
        `${isFilterPanelVisible ? ' is-active' : ' is-hidden'}`
      }
    >
      <header>
        <h3>Filter Opportunities</h3>
        {isDetailOpen && isFilterExpanded ? (
          <button
            type="button"
            className="campus-link-btn opportunities-filter-toggle"
            onClick={onBackToDetail}
          >
            Back to gig
          </button>
        ) : isDetailOpen ? (
          <button
            type="button"
            className="campus-link-btn opportunities-filter-toggle"
            onClick={onEditFilters}
          >
            Edit filters
          </button>
        ) : (
          <button type="button" className="campus-link-btn" onClick={onClearFilters}>Clear all</button>
        )}
      </header>

      {isFilterCollapsed ? (
        <p className="opportunities-filter-collapsed-note">
          Filters are collapsed while you review this gig.
        </p>
      ) : (
        <div className="opportunities-filter-body">
          <div className="opportunities-filter-group">
            <h4>Type</h4>
            <div className="opportunities-checklist">
              {FILTER_TYPES.filter((item) => item !== 'All Types').map((item) => (
                <label key={item} className="opportunities-check-item">
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
            <h4>Work Mode</h4>
            <div className="opportunities-checklist">
              {FILTER_MODES.filter((item) => item !== 'All').map((item) => (
                <label key={item} className="opportunities-check-item">
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
            <h4>Budget / Pay (KES)</h4>
            <div className="opportunities-budget-row">
              <input
                type="number"
                min="0"
                placeholder="Min"
                aria-label="Minimum budget"
                value={railFilters.budgetMin}
                onChange={(event) => onRailFilterChange({ budgetMin: event.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                aria-label="Maximum budget"
                value={railFilters.budgetMax}
                onChange={(event) => onRailFilterChange({ budgetMax: event.target.value })}
              />
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4>Skills</h4>
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
      )}
    </section>
  )
}

export default OpportunitiesFilterRailPanel
