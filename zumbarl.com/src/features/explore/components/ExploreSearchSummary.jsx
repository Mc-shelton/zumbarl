import { useState } from 'react'
import { FiInfo, FiSearch } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

const TAB_LABELS = {
  all: 'All',
  marketplace: 'Marketplace',
  people: 'People',
  pages: 'Pages',
  posts: 'Posts',
  projects: 'Work',
  resources: 'Resources',
}

function ExploreSearchSummary({ activeQuery, activeTab, counts, hints, loading, onSelectTab, partial }) {
  const [showExplanation, setShowExplanation] = useState(false)
  const tabs = Object.keys(TAB_LABELS).map((id) => ({ id, label: TAB_LABELS[id], count: counts[id] || 0 }))

  return (
    <section className="explore-campus-ai-search-card" aria-label="Campus search summary">
      <Breadcrumb className="explore-campus-breadcrumb" items={[{ label: 'Explore Campus' }, { label: 'Search' }]} />
      <header className="explore-campus-ai-head">
        <div>
          <h1><FiSearch aria-hidden="true" />Campus Search</h1>
          <p>One search across people, pages, posts, marketplace, work, and learning.</p>
        </div>
        <button type="button" className="explore-campus-how-btn" aria-expanded={showExplanation} onClick={() => setShowExplanation((current) => !current)}>
          How it works <FiInfo aria-hidden="true" />
        </button>
      </header>
      {showExplanation ? (
        <aside className="explore-campus-search-explanation">
          Results are matched against names, handles, descriptions, skills, campuses, listing details, and post content. Exact names rank first, then complete phrase, word, prefix, and close-spelling matches.
        </aside>
      ) : null}
      <section className="explore-campus-ai-summary" aria-live="polite">
        <p>
          {loading ? 'Searching Zumbarl…' : counts.all > 0 ? (
            <>Found <strong>{counts.all} relevant {counts.all === 1 ? 'result' : 'results'}</strong> for <strong>&ldquo;{activeQuery}&rdquo;</strong>.</>
          ) : (
            <>No results yet for <strong>&ldquo;{activeQuery}&rdquo;</strong>.</>
          )}
        </p>
        {!loading && (hints.length || partial) ? (
          <div className="explore-campus-ai-hints" aria-label="Matching result types">
            {hints.map((hint) => <span key={hint}>{hint}</span>)}
            {partial ? <span>Some sources unavailable</span> : null}
          </div>
        ) : null}
      </section>
      <section className="explore-campus-tabs-row">
        <nav className="explore-campus-tabs zumbarl-segmented-tabs" aria-label="Search result categories">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => onSelectTab(tab.id)}>
              {tab.label} <span>{tab.count}</span>
            </button>
          ))}
        </nav>
      </section>
    </section>
  )
}

export default ExploreSearchSummary
