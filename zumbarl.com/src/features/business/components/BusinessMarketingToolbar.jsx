import { FiChevronDown, FiFilter, FiGrid, FiList, FiSearch, FiSliders } from 'react-icons/fi'

function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="business-marketing-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <FiChevronDown aria-hidden="true" />
    </label>
  )
}

export function BusinessMarketingToolbar({
  filters,
  filterState,
  onChangePlatform,
  onChangeQuery,
  onChangeSort,
  onChangeStatus,
  onChangeType,
  onChangeViewMode,
}) {
  return (
    <section className="business-marketing-toolbar" aria-label="Marketing campaign filters">
      <label className="business-marketing-search">
        <FiSearch aria-hidden="true" />
        <span className="sr-only">Search campaigns</span>
        <input
          type="search"
          value={filterState.query}
          onChange={(event) => onChangeQuery(event.target.value)}
          placeholder="Search campaigns..."
        />
      </label>

      <FilterSelect label="Campaign type" options={filters.types} value={filterState.type} onChange={onChangeType} />
      <FilterSelect label="Platform" options={filters.platforms} value={filterState.platform} onChange={onChangePlatform} />
      <FilterSelect label="Status" options={filters.statuses} value={filterState.status} onChange={onChangeStatus} />

      <button type="button" className="business-marketing-filter-btn">
        <FiSliders aria-hidden="true" />
        Filters
      </button>

      <label className="business-marketing-sort">
        <FiFilter aria-hidden="true" />
        <span>Sort by:</span>
        <select value={filterState.sort} onChange={(event) => onChangeSort(event.target.value)} aria-label="Sort campaigns">
          <option value="newest">Newest</option>
          <option value="reach-high">Reach high</option>
          <option value="engagement-high">Engagement high</option>
          <option value="budget-high">Budget high</option>
        </select>
      </label>

      <div className="business-marketing-view-toggle" role="group" aria-label="Campaign layout">
        <button
          type="button"
          className={filterState.viewMode === 'list' ? 'is-active' : ''}
          aria-pressed={filterState.viewMode === 'list'}
          onClick={() => onChangeViewMode('list')}
        >
          <FiList aria-hidden="true" />
          <span className="sr-only">List view</span>
        </button>
        <button
          type="button"
          className={filterState.viewMode === 'grid' ? 'is-active' : ''}
          aria-pressed={filterState.viewMode === 'grid'}
          onClick={() => onChangeViewMode('grid')}
        >
          <FiGrid aria-hidden="true" />
          <span className="sr-only">Grid view</span>
        </button>
      </div>
    </section>
  )
}
