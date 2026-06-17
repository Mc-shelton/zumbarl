import { FiChevronDown, FiFilter, FiGrid, FiList, FiSearch, FiSliders } from 'react-icons/fi'

function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="business-opportunities-select">
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

export function BusinessOpportunityToolbar({
  filters,
  filterState,
  onChangeBudget,
  onChangeCategory,
  onChangeQuery,
  onChangeSkill,
  onChangeSort,
  onChangeStage,
  onChangeViewMode,
}) {
  return (
    <section className="business-opportunities-toolbar" aria-label="Opportunity filters">
      <label className="business-opportunities-search">
        <FiSearch aria-hidden="true" />
        <span className="sr-only">Search opportunities</span>
        <input
          type="search"
          value={filterState.query}
          onChange={(event) => onChangeQuery(event.target.value)}
          placeholder="Search opportunities..."
        />
      </label>

      <FilterSelect label="Category" options={filters.categories} value={filterState.category} onChange={onChangeCategory} />
      <FilterSelect label="Skill" options={filters.skills} value={filterState.skill} onChange={onChangeSkill} />
      <FilterSelect label="Stage" options={filters.stages} value={filterState.stage} onChange={onChangeStage} />
      <FilterSelect label="Budget" options={filters.budgets} value={filterState.budget} onChange={onChangeBudget} />

      <button type="button" className="business-opportunities-filter-btn">
        <FiSliders aria-hidden="true" />
        Filters
      </button>

      <label className="business-opportunities-sort">
        <FiFilter aria-hidden="true" />
        <span>Sort by:</span>
        <select value={filterState.sort} onChange={(event) => onChangeSort(event.target.value)} aria-label="Sort opportunities">
          <option value="newest">Newest</option>
          <option value="budget-high">Budget high</option>
          <option value="applicants-high">Applicants high</option>
        </select>
      </label>

      <div className="business-opportunities-view-toggle" role="group" aria-label="Opportunity layout">
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
