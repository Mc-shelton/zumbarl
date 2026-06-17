import { FiChevronDown } from 'react-icons/fi'
import { FILTER_MODES, FILTER_TYPES } from '../constants'

function OpportunitiesFilterRailPanel({
  isDetailOpen,
  isFilterCollapsed,
  isFilterExpanded,
  isFilterPanelVisible,
  onBackToDetail,
  onEditFilters,
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
          <button type="button" className="campus-link-btn">Clear all</button>
        )}
      </header>

      {isFilterCollapsed ? (
        <p className="opportunities-filter-collapsed-note">
          Filters are collapsed while you review this gig.
        </p>
      ) : (
        <div className="opportunities-filter-body">
          <div className="opportunities-filter-group">
            <h4>Category</h4>
            <button type="button" className="opportunities-select">
              All Categories
              <FiChevronDown aria-hidden="true" />
            </button>
          </div>

          <div className="opportunities-filter-group">
            <h4>Type</h4>
            <div className="opportunities-checklist">
              {FILTER_TYPES.map((item, index) => (
                <label key={item} className="opportunities-check-item">
                  <input type="checkbox" defaultChecked={index === 0} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4>Location</h4>
            <button type="button" className="opportunities-select">
              All Locations
              <FiChevronDown aria-hidden="true" />
            </button>
          </div>

          <div className="opportunities-filter-group">
            <h4>Work Mode</h4>
            <div className="opportunities-checklist">
              {FILTER_MODES.map((item, index) => (
                <label key={item} className="opportunities-check-item">
                  <input type="checkbox" defaultChecked={index === 0} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4>Budget / Pay</h4>
            <div className="opportunities-budget-row">
              <input type="text" placeholder="Min" />
              <input type="text" placeholder="Max" />
            </div>
          </div>

          <div className="opportunities-filter-group">
            <h4>Skills</h4>
            <button type="button" className="opportunities-select">
              Select skills
              <FiChevronDown aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default OpportunitiesFilterRailPanel
