import { FiInfo, FiSearch, FiSliders } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

function ExploreSearchSummary({ activeQuery, hints, tabs }) {
  return (
    <section className="explore-campus-ai-search-card" aria-label="AI search summary">
      <Breadcrumb
        className="explore-campus-breadcrumb"
        items={[
          { label: 'Explore Campus' },
          { label: 'Search' },
        ]}
      />

      <header className="explore-campus-ai-head">
        <div>
          <h1>
            <FiSearch aria-hidden="true" />
            AI Search
            <span>BETA</span>
          </h1>
          <p>Powered by AI to help you find the best results, faster.</p>
        </div>
        <button type="button" className="explore-campus-how-btn">
          How it works
          <FiInfo aria-hidden="true" />
        </button>
      </header>

      <section className="explore-campus-ai-summary">
        <p>
          I found <strong>78 relevant results</strong> for <strong>&ldquo;{activeQuery}&rdquo;</strong> across the campus community,
          marketplace, and resources.
        </p>
        <p className="explore-campus-ai-hints-label">Top picks based on your search:</p>
        <div className="explore-campus-ai-hints">
          {hints.map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      </section>

      <section className="explore-campus-tabs-row">
        <nav className="explore-campus-tabs zumbarl-segmented-tabs" aria-label="Search result categories">
          {tabs.map((tab) => (
            <button key={tab.label} type="button" className={tab.active ? 'is-active' : ''}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
        <button type="button" className="explore-campus-filter-btn">
          <FiSliders aria-hidden="true" />
          Filter
        </button>
      </section>
    </section>
  )
}

export default ExploreSearchSummary
