import { FiPlus, FiSearch, FiX } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'

function ExploreTopBar({
  onClearSearch,
  onSearchInputChange,
  onSearchSubmit,
  searchInput,
}) {
  return (
    <section className="explore-campus-topbar" aria-label="Search and quick actions">
      <form className="explore-campus-global-search" onSubmit={onSearchSubmit}>
        <button type="submit" className="explore-campus-search-submit" aria-label="Search explore campus">
          <FiSearch aria-hidden="true" />
        </button>
        <input
          type="search"
          value={searchInput}
          onChange={onSearchInputChange}
          placeholder="Search for people, posts, events, and more..."
          aria-label="Search explore campus"
        />
        {searchInput ? (
          <button type="button" aria-label="Clear search" className="explore-campus-search-clear" onClick={onClearSearch}>
            <FiX aria-hidden="true" />
          </button>
        ) : (
          <span className="explore-campus-search-slot" aria-hidden="true" />
        )}
      </form>

      <button type="button" className="explore-campus-discover-btn">
        <FiPlus aria-hidden="true" />
        Explore
      </button>

      <CampusTopActions
        className="explore-campus-header-actions"
        userButtonClassName="explore-campus-user-btn"
        showUserChevron
      />
    </section>
  )
}

export default ExploreTopBar
